-- =============================================================================
-- SYSTÈME DE TEMPLATES EMAIL
-- =============================================================================
-- Création des tables pour le nouveau système de templates email unifié

-- Table des templates email
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSON, -- Variables disponibles pour ce template
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- Templates par défaut
INSERT INTO email_templates (name, display_name, subject, html_content, text_content, variables, description, category) VALUES
-- 1. Confirmation de commande
('order_confirmation', 'Confirmation de commande', 'Votre commande #{{orderNumber}} est confirmée', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmation de commande</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #E85D04 0%, #F77F00 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { background: #E85D04; color: white; padding: 15px; margin: 20px 0; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .button { display: inline-block; background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Commande Confirmée!</h1>
            <p>Merci pour votre confiance, {{customerName}}</p>
        </div>
        <div class="content">
            <h2>Détails de votre commande #{{orderNumber}}</h2>
            <div class="order-details">
                <h3>Articles commandés:</h3>
                {{#each items}}
                <div class="item">
                    <span>{{dishName}} (x{{quantity}})</span>
                    <span>{{unitPrice}} CAD</span>
                </div>
                {{/each}}
            </div>
            <div class="total">
                Total: {{totalAmount}} CAD
            </div>
            <p><strong>Type:</strong> {{orderType}}</p>
            {{#if deliveryAddress}}
            <p><strong>Adresse de livraison:</strong> {{deliveryAddress}}</p>
            {{/if}}
            {{#if deliveryDate}}
            <p><strong>Date de livraison:</strong> {{deliveryDate}} à {{deliveryTime}}</p>
            {{/if}}
            {{#if specialInstructions}}
            <p><strong>Instructions spéciales:</strong> {{specialInstructions}}</p>
            {{/if}}
            <a href="{{siteUrl}}/track-order?number={{orderNumber}}&email={{customerEmail}}" class="button">
                Suivre ma commande
            </a>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>Merci de nous avoir choisis !</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}},

Votre commande #{{orderNumber}} a été confirmée !

Détails de la commande:
{{#each items}}
- {{dishName}} (x{{quantity}}) - {{unitPrice}} CAD
{{/each}}

Total: {{totalAmount}} CAD
Type: {{orderType}}
{{#if deliveryAddress}}
Adresse de livraison: {{deliveryAddress}}
{{/if}}

Suivez votre commande: {{siteUrl}}/track-order?number={{orderNumber}}&email={{customerEmail}}

Merci de nous avoir choisis !
Dounie Cuisine - L''Art du Goût', 
'["customerName", "orderNumber", "items", "totalAmount", "orderType", "deliveryAddress", "deliveryDate", "deliveryTime", "specialInstructions", "customerEmail", "siteUrl"]', 
'Email envoyé au client après confirmation de commande', 'commandes'),

-- 2. Confirmation de paiement
('payment_confirmation', 'Confirmation de paiement', 'Paiement confirmé pour la commande #{{orderNumber}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Paiement confirmé</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .payment-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Paiement Confirmé!</h1>
            <p>Votre paiement a été traité avec succès</p>
        </div>
        <div class="content">
            <div class="payment-success">
                <h3>🎉 Paiement réussi pour {{totalAmount}} CAD</h3>
                <p>Commande #{{orderNumber}}</p>
            </div>
            <p>Bonjour {{customerName}},</p>
            <p>Nous avons bien reçu votre paiement de <strong>{{totalAmount}} CAD</strong> pour votre commande #{{orderNumber}}.</p>
            <p>Votre commande est maintenant en cours de préparation par notre équipe.</p>
            <p>Vous recevrez une notification dès que votre commande sera prête.</p>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>Merci pour votre confiance !</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}},

Votre paiement de {{totalAmount}} CAD pour la commande #{{orderNumber}} a été confirmé !

Votre commande est maintenant en cours de préparation.

Merci pour votre confiance !
Dounie Cuisine - L''Art du Goût',
'["customerName", "orderNumber", "totalAmount"]',
'Email envoyé après confirmation de paiement', 'commandes'),

-- 3. Email de bienvenue
('welcome', 'Email de bienvenue', 'Bienvenue chez Dounie Cuisine, {{customerName}} !',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bienvenue</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #E85D04 0%, #F77F00 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .welcome-gift { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .button { display: inline-block; background: #E85D04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bienvenue chez Dounie Cuisine!</h1>
            <p>L''Art du Goût à votre portée</p>
        </div>
        <div class="content">
            <h2>Bonjour {{customerName}} !</h2>
            <p>Nous sommes ravis de vous accueillir dans la famille Dounie Cuisine !</p>
            <p>🍽️ Découvrez notre cuisine authentique haïtienne préparée avec amour et des ingrédients de qualité.</p>
            
            <div class="welcome-gift">
                <h3>🎁 Offre de bienvenue</h3>
                <p>Profitez de <strong>10% de réduction</strong> sur votre première commande avec le code:</p>
                <h2 style="color: #E85D04; margin: 10px 0;">BIENVENUE10</h2>
            </div>
            
            <p>✨ <strong>Ce qui vous attend :</strong></p>
            <ul>
                <li>🥘 Plats traditionnels haïtiens authentiques</li>
                <li>🚚 Livraison rapide dans votre région</li>
                <li>📱 Commandes faciles en ligne</li>
                <li>🎉 Événements et fêtes sur mesure</li>
            </ul>
            
            <a href="{{siteUrl}}/menu" class="button">Découvrir notre menu</a>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>N''hésitez pas à nous contacter pour toute question !</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}} !

Bienvenue chez Dounie Cuisine - L''Art du Goût !

Nous sommes ravis de vous accueillir dans notre famille.

🎁 OFFRE DE BIENVENUE 🎁
Profitez de 10% de réduction sur votre première commande avec le code : BIENVENUE10

Découvrez notre menu : {{siteUrl}}/menu

Au plaisir de vous servir !
Dounie Cuisine',
'["customerName", "siteUrl"]',
'Email envoyé lors de l''inscription d''un nouveau client', 'clients'),

-- 4. Formulaire de contact
('contact_form', 'Accusé de réception contact', 'Nous avons bien reçu votre message',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Message reçu</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .message-recap { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6f42c1; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Message bien reçu!</h1>
            <p>Nous vous répondrons rapidement</p>
        </div>
        <div class="content">
            <p>Bonjour {{customerName}},</p>
            <p>Nous avons bien reçu votre message concernant : <strong>{{subject}}</strong></p>
            
            <div class="message-recap">
                <h3>Récapitulatif de votre message :</h3>
                <p><strong>Sujet :</strong> {{subject}}</p>
                <p><strong>Message :</strong></p>
                <p style="font-style: italic;">{{message}}</p>
            </div>
            
            <p>🕐 <strong>Délai de réponse :</strong> Nous nous engageons à vous répondre dans les 24 heures.</p>
            <p>Notre équipe examine votre demande et vous contactera bientôt.</p>
            
            <p>Merci de nous avoir contactés !</p>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>Réponse sous 24h garantie</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}},

Nous avons bien reçu votre message concernant : {{subject}}

Votre message :
{{message}}

Nous vous répondrons dans les 24 heures.

Merci de nous avoir contactés !
Dounie Cuisine - L''Art du Goût',
'["customerName", "subject", "message"]',
'Accusé de réception automatique pour les messages de contact', 'contact'),

-- 5. Confirmation de réservation d'événement
('event_booking_confirmation', 'Confirmation de réservation', 'Réservation confirmée pour {{eventName}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Réservation confirmée</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .event-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Réservation Confirmée!</h1>
            <p>Votre place est réservée</p>
        </div>
        <div class="content">
            <p>Bonjour {{customerName}},</p>
            <p>Votre réservation pour <strong>{{eventName}}</strong> a été confirmée !</p>
            
            <div class="event-details">
                <h3>📅 Détails de votre réservation :</h3>
                <p><strong>Événement :</strong> {{eventName}}</p>
                <p><strong>Date :</strong> {{eventDate}}</p>
                <p><strong>Nombre d''invités :</strong> {{numberOfGuests}}</p>
                {{#if specialRequests}}
                <p><strong>Demandes spéciales :</strong> {{specialRequests}}</p>
                {{/if}}
            </div>
            
            <p>🎊 Nous avons hâte de vous accueillir pour cet événement spécial !</p>
            <p>Si vous avez des questions ou des modifications à apporter, n''hésitez pas à nous contacter.</p>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>Créateur d''expériences culinaires inoubliables</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}},

Votre réservation pour {{eventName}} est confirmée !

Détails :
- Événement : {{eventName}}
- Date : {{eventDate}}
- Nombre d''invités : {{numberOfGuests}}
{{#if specialRequests}}
- Demandes spéciales : {{specialRequests}}
{{/if}}

Nous avons hâte de vous accueillir !

Dounie Cuisine - L''Art du Goût',
'["customerName", "eventName", "eventDate", "numberOfGuests", "specialRequests"]',
'Email de confirmation pour les réservations d''événements', 'evenements'),

-- 6. Réinitialisation de mot de passe
('password_reset', 'Réinitialisation de mot de passe', 'Réinitialisez votre mot de passe',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Réinitialisation mot de passe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 30px; }
        .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Réinitialisation</h1>
            <p>Créez un nouveau mot de passe</p>
        </div>
        <div class="content">
            <p>Bonjour {{customerName}},</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Dounie Cuisine.</p>
            
            <a href="{{resetUrl}}" class="button">Réinitialiser mon mot de passe</a>
            
            <div class="security-notice">
                <h3>🛡️ Sécurité</h3>
                <p>Ce lien est valide pendant <strong>1 heure</strong> seulement.</p>
                <p>Si vous n''avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
            
            <p>Pour votre sécurité, ce lien ne peut être utilisé qu''une seule fois.</p>
        </div>
        <div class="footer">
            <p>Dounie Cuisine - L''Art du Goût</p>
            <p>Votre sécurité est notre priorité</p>
        </div>
    </div>
</body>
</html>',
'Bonjour {{customerName}},

Vous avez demandé à réinitialiser votre mot de passe.

Cliquez sur ce lien pour créer un nouveau mot de passe :
{{resetUrl}}

⚠️ Ce lien expire dans 1 heure.
Si vous n''avez pas fait cette demande, ignorez cet email.

Dounie Cuisine - L''Art du Goût',
'["customerName", "resetUrl"]',
'Email pour réinitialiser le mot de passe', 'securite');

-- Mise à jour du timestamp
UPDATE email_templates SET updated_at = NOW();

COMMIT;