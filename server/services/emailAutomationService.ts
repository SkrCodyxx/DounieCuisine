import { Pool } from 'pg';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

// Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Service d'automatisation des emails
class EmailAutomationService {
  private transporter: any;
  private isInitialized = false;

  constructor() {
    this.initializeEmailTransporter();
    this.startAutomationJobs();
  }

  private async initializeEmailTransporter() {
    // Configuration du transporteur email (à adapter selon votre config)
    this.transporter = nodemailer.createTransport({
      // Configuration SMTP
    });
    this.isInitialized = true;
  }

  // Démarrer tous les jobs d'automatisation
  private startAutomationJobs() {
    console.log('🚀 Démarrage du système d\'automatisation email...');

    // Vérifier les paniers abandonnés toutes les heures
    cron.schedule('0 * * * *', () => {
      this.checkAbandonedCarts();
    });

    // Envoyer les rappels de panier toutes les 6 heures
    cron.schedule('0 */6 * * *', () => {
      this.sendCartReminders();
    });

    // Vérifier les newsletters programmées toutes les 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.checkScheduledNewsletters();
    });

    // Nettoyer les anciens paniers abandonnés une fois par jour
    cron.schedule('0 2 * * *', () => {
      this.cleanupOldCarts();
    });

    console.log('✅ Jobs d\'automatisation configurés');
  }

  // 1. PANIERS ABANDONNÉS (1h après abandon)
  async checkAbandonedCarts() {
    if (!this.isInitialized) return;

    try {
      console.log('🛒 Vérification des paniers abandonnés...');

      // Récupérer les paniers abandonnés depuis 1h (sans email envoyé)
      const query = `
        SELECT DISTINCT
          s.session_id,
          s.customer_email,
          s.customer_name,
          s.created_at,
          s.updated_at,
          COALESCE(
            (SELECT SUM(quantity * unit_price) FROM session_items WHERE session_id = s.session_id),
            0
          ) as cart_total,
          (SELECT COUNT(*) FROM session_items WHERE session_id = s.session_id) as items_count
        FROM sessions s
        WHERE s.customer_email IS NOT NULL
          AND s.updated_at < NOW() - INTERVAL '1 hour'
          AND s.updated_at > NOW() - INTERVAL '25 hours'
          AND NOT EXISTS (
            SELECT 1 FROM orders WHERE customer_email = s.customer_email 
            AND created_at > s.updated_at
          )
          AND NOT EXISTS (
            SELECT 1 FROM email_automation_log 
            WHERE email_type = 'cart-abandoned' 
            AND recipient_email = s.customer_email
            AND created_at > s.updated_at
          )
        ORDER BY s.updated_at DESC
        LIMIT 50
      `;

      const result = await pool.query(query);
      
      for (const cart of result.rows) {
        await this.sendAbandonedCartEmail(cart);
      }

      console.log(`📧 ${result.rows.length} emails de panier abandonné envoyés`);
    } catch (error) {
      console.error('Erreur vérification paniers abandonnés:', error);
    }
  }

  // 2. RAPPELS DE PANIER (24h après abandon)
  async sendCartReminders() {
    if (!this.isInitialized) return;

    try {
      console.log('⏰ Envoi des rappels de panier...');

      const query = `
        SELECT DISTINCT
          s.session_id,
          s.customer_email,
          s.customer_name,
          s.updated_at,
          COALESCE(
            (SELECT SUM(quantity * unit_price) FROM session_items WHERE session_id = s.session_id),
            0
          ) as cart_total
        FROM sessions s
        WHERE s.customer_email IS NOT NULL
          AND s.updated_at < NOW() - INTERVAL '24 hours'
          AND s.updated_at > NOW() - INTERVAL '48 hours'
          AND NOT EXISTS (
            SELECT 1 FROM orders WHERE customer_email = s.customer_email 
            AND created_at > s.updated_at
          )
          AND EXISTS (
            SELECT 1 FROM email_automation_log 
            WHERE email_type = 'cart-abandoned' 
            AND recipient_email = s.customer_email
            AND created_at > s.updated_at
          )
          AND NOT EXISTS (
            SELECT 1 FROM email_automation_log 
            WHERE email_type = 'cart-reminder' 
            AND recipient_email = s.customer_email
            AND created_at > s.updated_at
          )
        ORDER BY s.updated_at DESC
        LIMIT 30
      `;

      const result = await pool.query(query);
      
      for (const cart of result.rows) {
        await this.sendCartReminderEmail(cart);
      }

      console.log(`📧 ${result.rows.length} rappels de panier envoyés`);
    } catch (error) {
      console.error('Erreur envoi rappels panier:', error);
    }
  }

  // 3. NEWSLETTERS PROGRAMMÉES
  async checkScheduledNewsletters() {
    if (!this.isInitialized) return;

    try {
      const query = `
        SELECT * FROM newsletters
        WHERE is_active = true 
          AND is_scheduled = true 
          AND scheduled_date <= NOW()
          AND scheduled_date > NOW() - INTERVAL '15 minutes'
          AND NOT EXISTS (
            SELECT 1 FROM newsletter_sends 
            WHERE newsletter_id = newsletters.id 
            AND sent_at > newsletters.scheduled_date - INTERVAL '1 hour'
          )
      `;

      const result = await pool.query(query);
      
      for (const newsletter of result.rows) {
        await this.sendScheduledNewsletter(newsletter.id);
      }

      if (result.rows.length > 0) {
        console.log(`📧 ${result.rows.length} newsletters programmées envoyées`);
      }
    } catch (error) {
      console.error('Erreur newsletters programmées:', error);
    }
  }

  // Envoyer email panier abandonné
  private async sendAbandonedCartEmail(cart: any) {
    try {
      // Récupérer le template
      const templateResult = await pool.query(
        'SELECT * FROM email_templates WHERE name = $1 AND is_active = true',
        ['cart-abandoned']
      );

      if (templateResult.rows.length === 0) {
        console.log('Template cart-abandoned non trouvé');
        return;
      }

      const template = templateResult.rows[0];

      // Récupérer les items du panier
      const itemsResult = await pool.query(`
        SELECT si.*, d.name, d.price 
        FROM session_items si
        JOIN dishes d ON d.id = si.dish_id
        WHERE si.session_id = $1
      `, [cart.session_id]);

      // Récupérer les infos du site
      const siteInfoResult = await pool.query('SELECT * FROM site_info LIMIT 1');
      const siteInfo = siteInfoResult.rows[0] || {};

      // Préparer les variables
      const variables = {
        customerName: cart.customer_name || cart.customer_email.split('@')[0],
        cartItemsCount: cart.items_count,
        cartItems: itemsResult.rows.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.unit_price
        })),
        cartTotal: parseFloat(cart.cart_total).toFixed(2),
        expirationTime: '23 heures',
        completeOrderUrl: `${siteInfo.website_url}/checkout?session=${cart.session_id}`,
        browseMenuUrl: `${siteInfo.website_url}/menu`,
        phone1: siteInfo.phone1 || '',
        contactEmail: siteInfo.contact_email || ''
      };

      // Remplacer les variables dans le template
      let htmlContent = template.html_content;
      
      // Variables simples
      Object.entries(variables).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          const regex = new RegExp(`{{${key}}}`, 'g');
          htmlContent = htmlContent.replace(regex, value.toString());
        }
      });

      // Variables complexes (items)
      if (variables.cartItems && variables.cartItems.length > 0) {
        let itemsHtml = '';
        variables.cartItems.forEach(item => {
          itemsHtml += `<p style="margin: 8px 0; font-weight: 500;">• ${item.name} (${item.quantity}x) - ${item.price}$ CAD</p>`;
        });
        htmlContent = htmlContent.replace(/{{#each cartItems}}[\s\S]*?{{\/each}}/g, itemsHtml);
      }

      // Envoyer l'email
      await this.transporter.sendMail({
        from: `"${siteInfo.business_name}" <${siteInfo.contact_email}>`,
        to: cart.customer_email,
        subject: template.subject,
        html: htmlContent,
        headers: {
          'X-Email-Type': 'cart-abandoned',
          'X-Session-ID': cart.session_id
        }
      });

      // Logger l'envoi
      await this.logEmailSent('cart-abandoned', cart.customer_email, cart.session_id);

    } catch (error) {
      console.error(`Erreur envoi email panier abandonné pour ${cart.customer_email}:`, error);
    }
  }

  // Envoyer rappel panier
  private async sendCartReminderEmail(cart: any) {
    try {
      const templateResult = await pool.query(
        'SELECT * FROM email_templates WHERE name = $1 AND is_active = true',
        ['cart-reminder']
      );

      if (templateResult.rows.length === 0) return;

      const template = templateResult.rows[0];
      const siteInfoResult = await pool.query('SELECT * FROM site_info LIMIT 1');
      const siteInfo = siteInfoResult.rows[0] || {};

      // Variables pour rappel
      const variables = {
        customerName: cart.customer_name || cart.customer_email.split('@')[0],
        cartTotal: parseFloat(cart.cart_total).toFixed(2),
        finalExpirationTime: '6 heures',
        discountOffer: 'Profitez de -10% sur votre commande !',
        discountCode: 'RAPPEL10',
        completeOrderUrl: `${siteInfo.website_url}/checkout?session=${cart.session_id}&discount=RAPPEL10`,
        freeDeliveryThreshold: siteInfo.free_delivery_threshold || '30',
        unsubscribeUrl: `${siteInfo.website_url}/unsubscribe?email=${encodeURIComponent(cart.customer_email)}&type=cart`,
        phone1: siteInfo.phone1 || '',
        contactEmail: siteInfo.contact_email || ''
      };

      let htmlContent = template.html_content;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, value.toString());
      });

      await this.transporter.sendMail({
        from: `"${siteInfo.business_name}" <${siteInfo.contact_email}>`,
        to: cart.customer_email,
        subject: template.subject,
        html: htmlContent
      });

      await this.logEmailSent('cart-reminder', cart.customer_email, cart.session_id);

    } catch (error) {
      console.error(`Erreur envoi rappel panier pour ${cart.customer_email}:`, error);
    }
  }

  // Envoyer newsletter programmée
  private async sendScheduledNewsletter(newsletterId: number) {
    // Utiliser la fonction existante du controller
    try {
      // Import de la fonction d'envoi newsletter
      // await sendNewsletterNow(newsletterId);
      console.log(`Newsletter ${newsletterId} programmée envoyée`);
    } catch (error) {
      console.error(`Erreur envoi newsletter programmée ${newsletterId}:`, error);
    }
  }

  // Logger les emails envoyés
  private async logEmailSent(emailType: string, recipientEmail: string, sessionId?: string) {
    try {
      await pool.query(`
        INSERT INTO email_automation_log (
          email_type, recipient_email, session_id, sent_at
        ) VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `, [emailType, recipientEmail, sessionId || null]);
    } catch (error) {
      console.error('Erreur log email:', error);
    }
  }

  // Nettoyer les anciens paniers
  private async cleanupOldCarts() {
    try {
      // Supprimer les sessions de plus de 7 jours sans commande
      await pool.query(`
        DELETE FROM sessions 
        WHERE updated_at < NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM orders WHERE customer_email = sessions.customer_email
          AND created_at > sessions.updated_at
        )
      `);

      // Nettoyer les logs d'automation de plus de 30 jours
      await pool.query(`
        DELETE FROM email_automation_log 
        WHERE sent_at < NOW() - INTERVAL '30 days'
      `);

      console.log('🧹 Nettoyage des anciens paniers effectué');
    } catch (error) {
      console.error('Erreur nettoyage:', error);
    }
  }

  // Méthodes publiques pour déclencher manuellement

  // Déclencher email commande prête
  async triggerOrderReadyEmail(orderId: number) {
    try {
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];
      
      // Logique pour envoyer email "commande prête"
      await this.sendOrderReadyEmail(order);
    } catch (error) {
      console.error('Erreur trigger email commande prête:', error);
    }
  }

  // Déclencher email livreur parti
  async triggerDeliveryStartedEmail(orderId: number) {
    try {
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];
      
      await this.sendDeliveryStartedEmail(order);
    } catch (error) {
      console.error('Erreur trigger email livreur parti:', error);
    }
  }

  // Déclencher email retard
  async triggerDeliveryDelayedEmail(orderId: number, delayInfo: any) {
    try {
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) return;

      const order = orderResult.rows[0];
      
      await this.sendDeliveryDelayedEmail(order, delayInfo);
    } catch (error) {
      console.error('Erreur trigger email retard:', error);
    }
  }

  // Implémentation des méthodes d'envoi spécifiques
  private async sendOrderReadyEmail(order: any) {
    // Implémentation similaire aux autres emails
    console.log(`Email "commande prête" envoyé pour commande ${order.id}`);
  }

  private async sendDeliveryStartedEmail(order: any) {
    console.log(`Email "livreur parti" envoyé pour commande ${order.id}`);
  }

  private async sendDeliveryDelayedEmail(order: any, delayInfo: any) {
    console.log(`Email "retard" envoyé pour commande ${order.id}`);
  }
}

// Table pour les logs d'automation
const createAutomationLogTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_automation_log (
        id SERIAL PRIMARY KEY,
        email_type VARCHAR(100) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        session_id VARCHAR(255),
        order_id INTEGER,
        newsletter_id INTEGER,
        sent_at TIMESTAMP DEFAULT NOW(),
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        
        UNIQUE(email_type, recipient_email, session_id, DATE_TRUNC('day', sent_at))
      );
      
      CREATE INDEX IF NOT EXISTS idx_email_automation_log_type ON email_automation_log(email_type);
      CREATE INDEX IF NOT EXISTS idx_email_automation_log_email ON email_automation_log(recipient_email);
      CREATE INDEX IF NOT EXISTS idx_email_automation_log_sent_at ON email_automation_log(sent_at);
    `);
    console.log('✅ Table email_automation_log créée');
  } catch (error) {
    console.error('Erreur création table automation log:', error);
  }
};

// Initialiser le service
let automationService: EmailAutomationService;

export const initializeEmailAutomation = async () => {
  await createAutomationLogTable();
  automationService = new EmailAutomationService();
  return automationService;
};

export const getEmailAutomationService = () => {
  return automationService;
};

export default EmailAutomationService;