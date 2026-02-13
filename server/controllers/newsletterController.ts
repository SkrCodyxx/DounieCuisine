import { Request, Response } from 'express';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  port: 5432,
});

// Configuration email (à adapter selon votre config)
const transporter = nodemailer.createTransport({
  // Configuration SMTP
});

// Types
interface Newsletter {
  id?: number;
  name: string;
  display_name: string;
  subject: string;
  html_content: string;
  preview_text?: string;
  is_active: boolean;
  is_scheduled: boolean;
  send_immediately: boolean;
  scheduled_date?: string;
  target_audience: {
    all_customers: boolean;
    newsletter_subscribers: boolean;
  };
  customer_segments: string[];
  frequency_type: 'manual' | 'weekly' | 'monthly';
  max_sends_per_month: number;
  min_days_between_sends: number;
}

// Récupérer toutes les newsletters
export const getNewsletters = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        *,
        (SELECT COUNT(*) FROM newsletter_sends WHERE newsletter_id = newsletters.id) as total_sends
      FROM newsletters 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération newsletters:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer une newsletter
export const getNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM newsletters WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération newsletter:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer une newsletter
export const createNewsletter = async (req: Request, res: Response) => {
  try {
    const newsletter: Newsletter = req.body;
    
    // Validation
    if (!newsletter.name || !newsletter.display_name || !newsletter.subject) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const result = await pool.query(`
      INSERT INTO newsletters (
        name, display_name, subject, html_content, preview_text,
        is_active, is_scheduled, send_immediately, scheduled_date,
        target_audience, customer_segments, frequency_type,
        max_sends_per_month, min_days_between_sends
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *
    `, [
      newsletter.name,
      newsletter.display_name,
      newsletter.subject,
      newsletter.html_content,
      newsletter.preview_text || null,
      newsletter.is_active,
      newsletter.is_scheduled,
      newsletter.send_immediately,
      newsletter.scheduled_date || null,
      JSON.stringify(newsletter.target_audience),
      JSON.stringify(newsletter.customer_segments),
      newsletter.frequency_type,
      newsletter.max_sends_per_month,
      newsletter.min_days_between_sends
    ]);

    const newNewsletter = result.rows[0];

    // Si envoi immédiat demandé
    if (newsletter.send_immediately && newsletter.is_active) {
      await sendNewsletterNow(newNewsletter.id);
    }

    res.status(201).json(newNewsletter);
  } catch (error: any) {
    console.error('Erreur création newsletter:', error);
    if (error.code === '23505') { // Violation contrainte unique
      res.status(400).json({ error: 'Une newsletter avec ce nom existe déjà' });
    } else {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// Mettre à jour une newsletter
export const updateNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsletter: Newsletter = req.body;
    
    const result = await pool.query(`
      UPDATE newsletters SET
        name = $1, display_name = $2, subject = $3, html_content = $4,
        preview_text = $5, is_active = $6, is_scheduled = $7,
        send_immediately = $8, scheduled_date = $9, target_audience = $10,
        customer_segments = $11, frequency_type = $12,
        max_sends_per_month = $13, min_days_between_sends = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `, [
      newsletter.name,
      newsletter.display_name,
      newsletter.subject,
      newsletter.html_content,
      newsletter.preview_text || null,
      newsletter.is_active,
      newsletter.is_scheduled,
      newsletter.send_immediately,
      newsletter.scheduled_date || null,
      JSON.stringify(newsletter.target_audience),
      JSON.stringify(newsletter.customer_segments),
      newsletter.frequency_type,
      newsletter.max_sends_per_month,
      newsletter.min_days_between_sends,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter non trouvée' });
    }

    // Si envoi immédiat demandé
    if (newsletter.send_immediately && newsletter.is_active) {
      await sendNewsletterNow(parseInt(id));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur mise à jour newsletter:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Activer/Désactiver une newsletter
export const toggleNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await pool.query(`
      UPDATE newsletters SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur toggle newsletter:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Envoyer une newsletter maintenant
export const sendNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { send_immediately } = req.body;

    if (send_immediately) {
      const result = await sendNewsletterNow(parseInt(id));
      res.json({ success: true, sent_count: result.sent_count });
    } else {
      res.status(400).json({ error: 'Option d\'envoi non supportée' });
    }
  } catch (error) {
    console.error('Erreur envoi newsletter:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Fonction pour envoyer une newsletter
const sendNewsletterNow = async (newsletterId: number) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Récupérer la newsletter
    const newsletterResult = await client.query(
      'SELECT * FROM newsletters WHERE id = $1 AND is_active = true',
      [newsletterId]
    );

    if (newsletterResult.rows.length === 0) {
      throw new Error('Newsletter introuvable ou inactive');
    }

    const newsletter = newsletterResult.rows[0];

    // Vérifier les limites d'envoi
    const limitsCheck = await checkSendingLimits(client, newsletter);
    if (!limitsCheck.canSend) {
      throw new Error(limitsCheck.reason);
    }

    // Récupérer les destinataires
    const recipients = await getNewsletterRecipients(client, newsletter);
    
    if (recipients.length === 0) {
      throw new Error('Aucun destinataire trouvé');
    }

    // Récupérer les infos du site pour les variables
    const siteInfoResult = await client.query('SELECT * FROM site_info LIMIT 1');
    const siteInfo = siteInfoResult.rows[0] || {};

    let sentCount = 0;
    let errors = 0;

    // Envoyer à chaque destinataire
    for (const recipient of recipients) {
      try {
        // Remplacer les variables dans le contenu
        let htmlContent = newsletter.html_content;
        
        // Variables communes
        const variables = {
          customerName: recipient.name || recipient.email.split('@')[0],
          customerEmail: recipient.email,
          businessName: siteInfo.business_name || 'Dounie Cuisine',
          phone1: siteInfo.phone1 || '',
          contactEmail: siteInfo.contact_email || '',
          websiteUrl: siteInfo.website_url || '',
          currentDate: new Date().toLocaleDateString('fr-FR'),
          unsubscribeUrl: `${siteInfo.website_url}/unsubscribe?email=${encodeURIComponent(recipient.email)}`
        };

        // Remplacer les variables
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          htmlContent = htmlContent.replace(regex, value.toString());
        });

        // Envoyer l'email
        await transporter.sendMail({
          from: `"${siteInfo.business_name}" <${siteInfo.contact_email}>`,
          to: recipient.email,
          subject: newsletter.subject,
          html: htmlContent,
          headers: {
            'List-Unsubscribe': `<${variables.unsubscribeUrl}>`,
            'X-Newsletter-ID': newsletter.id.toString()
          }
        });

        sentCount++;
      } catch (emailError) {
        console.error(`Erreur envoi email à ${recipient.email}:`, emailError);
        errors++;
      }
    }

    // Enregistrer l'historique d'envoi
    await client.query(`
      INSERT INTO newsletter_sends (
        newsletter_id, sent_to_count, target_audience, 
        delivered_count, sent_by
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      newsletterId,
      recipients.length,
      JSON.stringify(newsletter.target_audience),
      sentCount,
      'admin'
    ]);

    // Mettre à jour les stats de la newsletter
    await client.query(`
      UPDATE newsletters SET
        total_sent = total_sent + $1,
        last_sent_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
    `, [sentCount, newsletterId]);

    await client.query('COMMIT');

    return { sent_count: sentCount, errors };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Vérifier les limites d'envoi
const checkSendingLimits = async (client: any, newsletter: any) => {
  // Vérifier le nombre d'envois ce mois
  const monthlyCount = await client.query(`
    SELECT COUNT(*) as count 
    FROM newsletter_sends 
    WHERE newsletter_id = $1 
    AND DATE_TRUNC('month', sent_at) = DATE_TRUNC('month', NOW())
  `, [newsletter.id]);

  if (parseInt(monthlyCount.rows[0].count) >= newsletter.max_sends_per_month) {
    return {
      canSend: false,
      reason: `Limite mensuelle atteinte (${newsletter.max_sends_per_month} envois/mois)`
    };
  }

  // Vérifier le délai minimum entre envois
  if (newsletter.last_sent_at) {
    const lastSent = new Date(newsletter.last_sent_at);
    const minInterval = newsletter.min_days_between_sends * 24 * 60 * 60 * 1000;
    const timeSinceLastSend = Date.now() - lastSent.getTime();

    if (timeSinceLastSend < minInterval) {
      const daysRemaining = Math.ceil((minInterval - timeSinceLastSend) / (24 * 60 * 60 * 1000));
      return {
        canSend: false,
        reason: `Délai minimum non respecté (${daysRemaining} jours restants)`
      };
    }
  }

  return { canSend: true };
};

// Récupérer les destinataires d'une newsletter
const getNewsletterRecipients = async (client: any, newsletter: any) => {
  let query = '';
  let params: any[] = [];

  if (newsletter.target_audience.newsletter_subscribers) {
    // Abonnés newsletter uniquement
    query = `
      SELECT DISTINCT email, customer_name as name
      FROM customer_newsletter_preferences 
      WHERE is_subscribed = true
    `;
  } else if (newsletter.target_audience.all_customers) {
    // Tous les clients avec commande
    query = `
      SELECT DISTINCT 
        COALESCE(u.email, o.customer_email) as email,
        COALESCE(u.first_name || ' ' || u.last_name, o.customer_name) as name
      FROM orders o
      LEFT JOIN users u ON u.email = o.customer_email
      WHERE o.customer_email IS NOT NULL
    `;
  }

  // Filtrage par segments si spécifié
  if (newsletter.customer_segments.length > 0) {
    if (newsletter.target_audience.newsletter_subscribers) {
      query += ` AND customer_segment = ANY($1)`;
      params.push(newsletter.customer_segments);
    } else {
      // Pour les clients non-newsletter, on peut ajouter une logique de segmentation
      // basée sur l'historique des commandes
    }
  }

  query += ` ORDER BY email`;

  const result = await client.query(query, params);
  return result.rows;
};

// Récupérer les statistiques
export const getNewsletterStats = async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM newsletters) as total_newsletters,
        (SELECT COUNT(*) FROM newsletters WHERE is_active = true) as active_newsletters,
        (SELECT COUNT(*) FROM customer_newsletter_preferences WHERE is_subscribed = true) as total_subscribers,
        (SELECT COUNT(*) FROM newsletter_sends WHERE DATE_TRUNC('month', sent_at) = DATE_TRUNC('month', NOW())) as this_month_sends,
        COALESCE(
          (SELECT AVG(
            CASE WHEN ns.sent_to_count > 0 
            THEN (ns.opened_count::float / ns.sent_to_count) * 100 
            ELSE 0 END
          ) FROM newsletter_sends ns), 0
        ) as avg_open_rate,
        COALESCE(
          (SELECT AVG(
            CASE WHEN ns.sent_to_count > 0 
            THEN (ns.clicked_count::float / ns.sent_to_count) * 100 
            ELSE 0 END
          ) FROM newsletter_sends ns), 0
        ) as avg_click_rate
    `);

    const result = stats.rows[0];
    
    // Arrondir les pourcentages
    result.avg_open_rate = Math.round(parseFloat(result.avg_open_rate) * 100) / 100;
    result.avg_click_rate = Math.round(parseFloat(result.avg_click_rate) * 100) / 100;

    res.json(result);
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Supprimer une newsletter
export const deleteNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM newsletters WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Newsletter non trouvée' });
    }
    
    res.json({ message: 'Newsletter supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression newsletter:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export {
  // Export des fonctions pour les routes
};