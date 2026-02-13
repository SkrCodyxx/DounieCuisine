-- Migration: Création de la table email_templates
-- Date: 2025-11-02

-- Création de la table email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSON,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Insertion des templates par défaut
INSERT INTO email_templates (name, display_name, subject, html_content, text_content, variables, category, description) VALUES 
('order_confirmation', 'Confirmation de commande', '🎉 Votre commande #{{orderNumber}} est confirmée', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #E85D04; margin: 0;">Dounie Cuisine</h1>
    <p style="color: #666; margin: 5px 0;">L''Art du Goût</p>
  </div>
  
  <h2 style="color: #333;">🎉 Commande confirmée !</h2>
  
  <p>Bonjour <strong>{{customerName}}</strong>,</p>
  
  <p>Merci pour votre commande ! Voici le récapitulatif :</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Numéro de commande :</strong> {{orderNumber}}</p>
    <p><strong>Type :</strong> {{orderType}}</p>
    <p><strong>Montant total :</strong> {{totalAmount}}€</p>
    {{#if deliveryAddress}}
    <p><strong>Adresse de livraison :</strong> {{deliveryAddress}}</p>
    {{/if}}
  </div>
  
  <h3>Détail de votre commande :</h3>
  <ul>
    {{#each items}}
    <li>{{dishName}} x{{quantity}} - {{unitPrice}}€</li>
    {{/each}}
  </ul>
  
  <p>Nous préparons votre commande avec soin. Vous recevrez une notification quand elle sera prête.</p>
  
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{siteUrl}}" style="background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visitez notre site</a>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px; text-align: center;">
    Dounie Cuisine - L''Art du Goût<br>
    Si vous avez des questions, contactez-nous !
  </p>
</div>', 
'Bonjour {{customerName}},

Merci pour votre commande ! Voici le récapitulatif :

Numéro de commande : {{orderNumber}}
Type : {{orderType}}
Montant total : {{totalAmount}}€

Détail de votre commande :
{{#each items}}
- {{dishName}} x{{quantity}} - {{unitPrice}}€
{{/each}}

Nous préparons votre commande avec soin.

Dounie Cuisine - L''Art du Goût', 
'["customerName", "orderNumber", "orderType", "totalAmount", "deliveryAddress", "items"]', 
'orders', 'Email de confirmation envoyé automatiquement après validation d''une commande'),

('payment_confirmation', 'Confirmation de paiement', '💳 Paiement reçu pour la commande #{{orderNumber}}', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #E85D04; margin: 0;">Dounie Cuisine</h1>
    <p style="color: #666; margin: 5px 0;">L''Art du Goût</p>
  </div>
  
  <h2 style="color: #16a34a;">💳 Paiement confirmé</h2>
  
  <p>Bonjour <strong>{{customerName}}</strong>,</p>
  
  <p>Nous avons bien reçu votre paiement de <strong>{{totalAmount}}€</strong> pour la commande #{{orderNumber}}.</p>
  
  <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
    <p style="margin: 0; color: #16a34a;"><strong>✅ Paiement traité avec succès</strong></p>
  </div>
  
  <p>Votre commande est maintenant en préparation. Nous vous tiendrons informé de son avancement.</p>
  
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{siteUrl}}" style="background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Suivre ma commande</a>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px; text-align: center;">
    Dounie Cuisine - L''Art du Goût
  </p>
</div>', 
'Bonjour {{customerName}},

Nous avons bien reçu votre paiement de {{totalAmount}}€ pour la commande #{{orderNumber}}.

✅ Paiement traité avec succès

Votre commande est maintenant en préparation.

Dounie Cuisine - L''Art du Goût', 
'["customerName", "orderNumber", "totalAmount"]', 
'orders', 'Email de confirmation envoyé après réception d''un paiement'),

('welcome', 'Email de bienvenue', '🌟 Bienvenue chez Dounie Cuisine !', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #E85D04; margin: 0;">Dounie Cuisine</h1>
    <p style="color: #666; margin: 5px 0;">L''Art du Goût</p>
  </div>
  
  <h2 style="color: #333;">🌟 Bienvenue dans notre famille !</h2>
  
  <p>Bonjour <strong>{{customerName}}</strong>,</p>
  
  <p>Merci de nous avoir rejoint ! Nous sommes ravis de vous compter parmi nos clients.</p>
  
  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E85D04;">
    <h3 style="margin: 0 0 10px 0; color: #E85D04;">Découvrez nos spécialités :</h3>
    <ul style="margin: 0; padding-left: 20px;">
      <li>Plats traditionnels haïtiens authentiques</li>
      <li>Service traiteur pour vos événements</li>
      <li>Livraison rapide dans votre région</li>
    </ul>
  </div>
  
  <p>N''hésitez pas à parcourir notre menu et à nous contacter si vous avez des questions !</p>
  
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{siteUrl}}" style="background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px;">Découvrir le menu</a>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px; text-align: center;">
    Dounie Cuisine - L''Art du Goût<br>
    L''authenticité dans chaque bouchée
  </p>
</div>', 
'Bonjour {{customerName}},

Merci de nous avoir rejoint ! Nous sommes ravis de vous compter parmi nos clients.

Découvrez nos spécialités :
- Plats traditionnels haïtiens authentiques
- Service traiteur pour vos événements  
- Livraison rapide dans votre région

N''hésitez pas à parcourir notre menu !

Visitez : {{siteUrl}}

Dounie Cuisine - L''Art du Goût', 
'["customerName", "siteUrl"]', 
'customers', 'Email de bienvenue envoyé lors de la création d''un compte client'),

('contact_form', 'Nouveau message de contact', '📞 Nouveau message de {{customerName}}', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #333;">📞 Nouveau message de contact</h2>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>De :</strong> {{customerName}}</p>
    <p><strong>Email :</strong> {{customerEmail}}</p>
    <p><strong>Téléphone :</strong> {{customerPhone}}</p>
    <p><strong>Sujet :</strong> {{subject}}</p>
  </div>
  
  <h3>Message :</h3>
  <div style="background: white; padding: 15px; border-left: 4px solid #E85D04; margin: 15px 0;">
    <p style="margin: 0; white-space: pre-wrap;">{{message}}</p>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px;">
    Dounie Cuisine - Système de notifications automatiques
  </p>
</div>', 
'Nouveau message de contact

De : {{customerName}}
Email : {{customerEmail}} 
Téléphone : {{customerPhone}}
Sujet : {{subject}}

Message :
{{message}}

Dounie Cuisine', 
'["customerName", "customerEmail", "customerPhone", "subject", "message"]', 
'notifications', 'Email envoyé aux administrateurs lors d''un nouveau message de contact'),

('event_booking', 'Nouvelle réservation d''événement', '🎉 Nouvelle réservation : {{eventName}}', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #333;">🎉 Nouvelle réservation d''événement</h2>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Événement :</strong> {{eventName}}</p>
    <p><strong>Client :</strong> {{customerName}}</p>
    <p><strong>Email :</strong> {{customerEmail}}</p>
    <p><strong>Téléphone :</strong> {{customerPhone}}</p>
    <p><strong>Date :</strong> {{eventDate}}</p>
    <p><strong>Nombre d''invités :</strong> {{numberOfGuests}}</p>
  </div>
  
  {{#if specialRequests}}
  <h3>Demandes spéciales :</h3>
  <div style="background: white; padding: 15px; border-left: 4px solid #E85D04; margin: 15px 0;">
    <p style="margin: 0; white-space: pre-wrap;">{{specialRequests}}</p>
  </div>
  {{/if}}
  
  <div style="text-align: center; margin-top: 30px;">
    <a href="{{siteUrl}}/admin/events" style="background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Gérer les réservations</a>
  </div>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">  
  <p style="color: #666; font-size: 12px;">
    Dounie Cuisine - Système de notifications automatiques
  </p>
</div>', 
'Nouvelle réservation d''événement

Événement : {{eventName}}
Client : {{customerName}}
Email : {{customerEmail}}
Téléphone : {{customerPhone}}
Date : {{eventDate}}
Nombre d''invités : {{numberOfGuests}}

{{#if specialRequests}}
Demandes spéciales :
{{specialRequests}}
{{/if}}

Dounie Cuisine', 
'["eventName", "customerName", "customerEmail", "customerPhone", "eventDate", "numberOfGuests", "specialRequests"]', 
'events', 'Email envoyé lors d''une nouvelle réservation d''événement');

-- Insérer des commentaires pour la documentation
COMMENT ON TABLE email_templates IS 'Templates d''emails automatiques du système';
COMMENT ON COLUMN email_templates.name IS 'Nom technique unique du template (non modifiable)';
COMMENT ON COLUMN email_templates.display_name IS 'Nom d''affichage pour l''interface admin';
COMMENT ON COLUMN email_templates.variables IS 'Variables disponibles au format JSON';
COMMENT ON COLUMN email_templates.category IS 'Catégorie du template (orders, customers, events, etc.)';