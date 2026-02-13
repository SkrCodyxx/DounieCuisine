-- ================================================================
-- TABLE NEWSLETTERS - SYSTÈME COMPLET
-- ================================================================

-- Table pour stocker les newsletters créées manuellement
CREATE TABLE IF NOT EXISTS newsletters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    preview_text VARCHAR(200),
    
    -- Contrôles d'envoi
    is_active BOOLEAN DEFAULT false,
    is_scheduled BOOLEAN DEFAULT false,
    send_immediately BOOLEAN DEFAULT false,
    scheduled_date TIMESTAMP,
    
    -- Ciblage
    target_audience JSONB DEFAULT '{"all_customers": true, "newsletter_subscribers": false}',
    customer_segments JSONB DEFAULT '[]', -- ["vip", "new", "inactive"]
    
    -- Fréquence et limitations
    frequency_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'weekly', 'monthly'
    max_sends_per_month INTEGER DEFAULT 4,
    min_days_between_sends INTEGER DEFAULT 7,
    
    -- Tracking
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    last_sent_at TIMESTAMP,
    
    -- Métadonnées
    created_by VARCHAR(100) DEFAULT 'admin',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour historique des envois
CREATE TABLE IF NOT EXISTS newsletter_sends (
    id SERIAL PRIMARY KEY,
    newsletter_id INTEGER REFERENCES newsletters(id) ON DELETE CASCADE,
    
    -- Détails envoi
    sent_to_count INTEGER NOT NULL,
    target_audience JSONB,
    sent_at TIMESTAMP DEFAULT NOW(),
    
    -- Résultats
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    sent_by VARCHAR(100) DEFAULT 'admin',
    campaign_notes TEXT
);

-- Table pour préférences clients newsletters
CREATE TABLE IF NOT EXISTS customer_newsletter_preferences (
    id SERIAL PRIMARY KEY,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    
    -- Abonnements
    is_subscribed BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP DEFAULT NOW(),
    unsubscribed_at TIMESTAMP,
    
    -- Préférences fréquence
    max_emails_per_week INTEGER DEFAULT 2,
    preferred_day VARCHAR(20) DEFAULT 'any', -- 'monday', 'weekend', 'any'
    preferred_time VARCHAR(20) DEFAULT 'any', -- 'morning', 'evening', 'any'
    
    -- Segmentation automatique
    customer_segment VARCHAR(50) DEFAULT 'regular', -- 'new', 'regular', 'vip', 'inactive'
    last_order_date TIMESTAMP,
    total_orders INTEGER DEFAULT 0,
    
    -- Tracking comportement
    last_email_opened TIMESTAMP,
    total_emails_opened INTEGER DEFAULT 0,
    last_link_clicked TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(customer_email)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_newsletters_active ON newsletters(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled ON newsletters(is_scheduled, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_customer_newsletter_email ON customer_newsletter_preferences(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_newsletter_subscribed ON customer_newsletter_preferences(is_subscribed);

-- Fonction pour calculer le segment client automatiquement
CREATE OR REPLACE FUNCTION update_customer_segment()
RETURNS TRIGGER AS $$
BEGIN
    -- Nouveau client (< 30 jours)
    IF NEW.total_orders <= 1 AND NEW.last_order_date > NOW() - INTERVAL '30 days' THEN
        NEW.customer_segment = 'new';
    -- Client VIP (> 10 commandes ou commande récente > 100€)
    ELSIF NEW.total_orders > 10 THEN
        NEW.customer_segment = 'vip';
    -- Client inactif (> 60 jours sans commande)
    ELSIF NEW.last_order_date < NOW() - INTERVAL '60 days' THEN
        NEW.customer_segment = 'inactive';
    -- Client régulier
    ELSE
        NEW.customer_segment = 'regular';
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique des segments
DROP TRIGGER IF EXISTS trigger_update_customer_segment ON customer_newsletter_preferences;
CREATE TRIGGER trigger_update_customer_segment
    BEFORE UPDATE ON customer_newsletter_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_segment();

COMMENT ON TABLE newsletters IS 'Newsletters créées manuellement par l''admin avec contrôles intelligents';
COMMENT ON TABLE newsletter_sends IS 'Historique des envois de newsletters avec statistiques';
COMMENT ON TABLE customer_newsletter_preferences IS 'Préférences et segmentation automatique des clients pour newsletters';