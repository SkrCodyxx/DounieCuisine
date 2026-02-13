import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Initialise automatiquement les données par défaut au premier démarrage
 * S'exécute une seule fois lorsque les tables sont vides
 */
export async function initializeDefaultData() {
  try {
    console.log("[INIT] Initialisation des données par défaut (mode UPSERT)...");

    let insertedCount = 0;
    let skippedCount = 0;

    // ========================================
    // 1. SITE_INFO - Informations business de base
    // ========================================
    const existingSiteInfo = await db.execute(sql`
      SELECT id FROM site_info LIMIT 1
    `);

    if (existingSiteInfo.rows.length === 0) {
      console.log("[INIT] → Création de site_info...");
      
      await db.execute(sql`
      INSERT INTO site_info (
        business_name,
        tagline,
        description,
        phone1,
        phone1_label,
        email_primary,
        address,
        city,
        province,
        postal_code,
        country,
        business_hours,
        tps_rate,
        tvq_rate,
        delivery_fee,
        free_delivery_threshold,
        delivery_radius_km
      ) VALUES (
        'Dounie Cuisine',
        'L''Art du Goût',
        'Vivez les saveurs authentiques d''Haïti depuis le Canada. Cuisine traditionnelle haïtienne préparée avec passion et des ingrédients frais.',
        '+1 (514) 123-4567',
        'Principal',
        'info@douniecuisine.com',
        '123 Rue Saint-Laurent',
        'Montréal',
        'Québec',
        'H2X 1Y8',
        'Canada',
        ${JSON.stringify({
          monday: "09:00-18:00",
          tuesday: "09:00-18:00",
          wednesday: "09:00-18:00",
          thursday: "09:00-20:00",
          friday: "09:00-20:00",
          saturday: "11:00-21:00",
          sunday: "Fermé"
        })},
        0.05,
        0.09975,
        5.00,
        75.00,
        15.00
      )
      `);
      console.log("[INIT]   ✓ site_info créé");
      insertedCount++;
    } else {
      console.log("[INIT]   • site_info existe déjà");
      skippedCount++;
    }

    // ========================================
    // 2. SITE_SETTINGS REMOVED - Now consolidated in site_info
    // ========================================
    console.log("[INIT] → site_settings supprimé - données maintenant dans site_info");

    // ========================================
    // 2. DELIVERY_ZONES - Désactivé (l'admin gère manuellement)
    // ========================================
    console.log("[INIT] → Vérification de delivery_zones...");
    const zonesInserted = 0;
    console.log(`[INIT]   ✓ ${zonesInserted} delivery_zones insérées, 3 existaient déjà`);

    // ========================================
    // 3. LEGAL_PAGES - Pages légales de base (ALWAYS UPSERT)
    // ========================================
    console.log("[INIT] → Vérification de legal_pages...");

    const legalPages = [
      {
        slug: 'politique-confidentialite',
        title: 'Politique de Confidentialité',
        content: `
          <h1>Politique de Confidentialité</h1>
          <p>Dernière mise à jour: ${new Date().toLocaleDateString('fr-CA')}</p>
          
          <h2>1. Collecte d'informations</h2>
          <p>Nous collectons les informations que vous nous fournissez directement lors de vos commandes, notamment:</p>
          <ul>
            <li>Nom et coordonnées</li>
            <li>Adresse de livraison</li>
            <li>Informations de paiement</li>
            <li>Historique de commandes</li>
          </ul>
          
          <h2>2. Utilisation des informations</h2>
          <p>Vos informations sont utilisées pour:</p>
          <ul>
            <li>Traiter et livrer vos commandes</li>
            <li>Communiquer avec vous au sujet de vos commandes</li>
            <li>Améliorer nos services</li>
          </ul>
          
          <h2>3. Protection des données</h2>
          <p>Nous prenons la sécurité de vos données très au sérieux et utilisons des mesures de sécurité appropriées.</p>
          
          <h2>4. Contact</h2>
          <p>Pour toute question concernant cette politique, contactez-nous à info@douniecuisine.com</p>
        `,
        meta_description: 'Politique de confidentialité de Dounie Cuisine - Protection de vos données personnelles',
        display_order: 1
      },
      {
        slug: 'conditions-utilisation',
        title: 'Conditions d\'Utilisation',
        content: `
          <h1>Conditions d'Utilisation</h1>
          <p>Dernière mise à jour: ${new Date().toLocaleDateString('fr-CA')}</p>
          
          <h2>1. Acceptation des conditions</h2>
          <p>En utilisant notre site web et nos services, vous acceptez ces conditions d'utilisation.</p>
          
          <h2>2. Services offerts</h2>
          <p>Dounie Cuisine offre des services de restauration et de livraison de plats haïtiens traditionnels.</p>
          
          <h2>3. Commandes et paiements</h2>
          <ul>
            <li>Toutes les commandes sont sujettes à disponibilité</li>
            <li>Les prix sont en dollars canadiens (CAD)</li>
            <li>Les taxes applicables sont ajoutées au montant total</li>
          </ul>
          
          <h2>4. Livraison</h2>
          <p>Les délais de livraison sont estimés et peuvent varier selon la demande et les conditions.</p>
          
          <h2>5. Annulation et remboursement</h2>
          <p>Les politiques d'annulation et de remboursement sont disponibles sur demande.</p>
          
          <h2>6. Contact</h2>
          <p>Pour toute question, contactez-nous à info@douniecuisine.com</p>
        `,
        meta_description: 'Conditions d\'utilisation de Dounie Cuisine - Termes et règles de service',
        display_order: 2
      }
    ];

    let pagesInserted = 0;
    for (const page of legalPages) {
      const result = await db.execute(sql`
        INSERT INTO legal_pages (slug, title, content, meta_description, active, display_order)
        VALUES (
          ${page.slug},
          ${page.title},
          ${page.content},
          ${page.meta_description},
          1,
          ${page.display_order}
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING slug
      `);
      if (result.rows.length > 0) {
        pagesInserted++;
      }
    }
    console.log(`[INIT]   ✓ ${pagesInserted} legal_pages insérées, ${legalPages.length - pagesInserted} existaient déjà`);
    insertedCount += pagesInserted;
    skippedCount += (legalPages.length - pagesInserted);

    // ========================================
    // 5. HERO_SLIDES - Slide de bienvenue
    // ========================================
    const existingWelcomeSlide = await db.execute(sql`
      SELECT id FROM hero_slides WHERE title = 'Bienvenue chez Dounie Cuisine' LIMIT 1
    `);

    if (existingWelcomeSlide.rows.length === 0) {
      console.log("[INIT] → Création de hero_slide de bienvenue...");

    const generateDcId = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 7);
      return `DC-${timestamp}${random}`.toUpperCase().substring(0, 20);
    };

    await db.execute(sql`
      INSERT INTO hero_slides (
        dc_id,
        title,
        media_url,
        media_type,
        alt_text,
        text_content,
        text_position,
        logo_url,
        logo_size,
        display_order,
        active
      ) VALUES (
        ${generateDcId()},
        'Bienvenue chez Dounie Cuisine',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80',
        'image',
        'Cuisine haïtienne traditionnelle',
        ${JSON.stringify({
          heading: "Bienvenue chez Dounie Cuisine",
          subheading: "L'Art du Goût - Saveurs Authentiques d'Haïti",
          buttonText: "Commander Maintenant",
          buttonUrl: "/takeout"
        })},
        'center',
        '/logo.png',
        'large',
        1,
        1
      )
      `);
      console.log("[INIT]   ✓ hero_slide de bienvenue créé");
      insertedCount++;
    } else {
      console.log("[INIT]   • hero_slide de bienvenue existe déjà");
      skippedCount++;
    }

    // Summary
    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║       INITIALISATION DES DONNÉES PAR DÉFAUT TERMINÉE         ║");
    console.log("╠═══════════════════════════════════════════════════════════════╣");
    console.log(`║  ✅ ${insertedCount} enregistrements insérés                            ║`);
    console.log(`║  • ${skippedCount} enregistrements existaient déjà                    ║`);
    console.log("║                                                               ║");
    
    // Vérifier la configuration SMTP et Square
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    const squareConfigured = process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID;
    
    if (smtpConfigured && squareConfigured) {
      console.log("║  🎉 SMTP et paiements Square configurés et opérationnels !   ║");
    } else {
      if (!smtpConfigured) {
        console.log("║  ⚠️  SMTP non configuré - emails désactivés                  ║");
      }
      if (!squareConfigured) {
        console.log("║  ⚠️  Square non configuré - paiements désactivés            ║");
      }
      console.log("║  💡 Configuration dans le fichier .env                       ║");
    }
    
    console.log("╚═══════════════════════════════════════════════════════════════╝");

  } catch (error) {
    console.error("[INIT] ❌ Erreur lors de l'initialisation des données par défaut:", error);
    // Ne pas bloquer le démarrage de l'application
  }
}
