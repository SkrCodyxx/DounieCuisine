-- Migration: Add email_settings table for controlling email notifications
-- Date: 2025-11-02

CREATE TABLE IF NOT EXISTS email_settings (
  id SERIAL PRIMARY KEY,
  email_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  category VARCHAR(30) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default email settings
INSERT INTO email_settings (email_type, name, description, category, is_enabled) VALUES
-- Emails déjà implémentés
('order_confirmation', 'Confirmation de commande', 'Email envoyé lors de la création d''une commande', 'orders', true),
('contact_form', 'Confirmation de contact', 'Email envoyé après soumission du formulaire de contact', 'communication', true),
('event_booking', 'Confirmation d''événement', 'Email envoyé lors de la réservation d''un événement', 'communication', true),
('welcome_email', 'Email de bienvenue', 'Email envoyé lors de l''inscription d''un nouveau client', 'customer', true),
('email_verification', 'Vérification d''email', 'Email envoyé pour vérifier l''adresse email', 'customer', true),

-- Nouveaux emails à implémenter
('order_status_update', 'Mise à jour du statut', 'Email envoyé quand le statut d''une commande change', 'orders', true),
('payment_confirmation', 'Confirmation de paiement', 'Email envoyé après confirmation du paiement', 'orders', true),
('order_cancellation', 'Annulation de commande', 'Email envoyé quand une commande est annulée', 'orders', true),
('delivery_notification', 'Notification de livraison', 'Email envoyé quand la commande est en livraison', 'orders', true),
('pickup_ready', 'Prêt pour récupération', 'Email envoyé quand la commande est prête à récupérer', 'orders', true),
('password_reset', 'Réinitialisation mot de passe', 'Email envoyé pour réinitialiser le mot de passe', 'customer', true),
('loyalty_reward', 'Récompense fidélité', 'Email envoyé pour les récompenses de fidélité', 'customer', true),
('newsletter', 'Newsletter', 'Email de newsletter périodique', 'marketing', true),
('promotion', 'Promotions spéciales', 'Email pour les offres promotionnelles', 'marketing', true),
('birthday_greeting', 'Anniversaire client', 'Email d''anniversaire avec offre spéciale', 'marketing', true),
('order_reminder', 'Rappel de panier abandonné', 'Email de rappel pour les paniers abandonnés', 'marketing', false),
('admin_notification', 'Notifications admin', 'Email de notification pour les administrateurs', 'admin', true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_email_settings_updated_at();