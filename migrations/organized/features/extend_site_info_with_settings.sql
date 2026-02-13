-- Migration pour étendre site_info avec tous les settings sociaux et web
-- Ajouter les colonnes pour les réseaux sociaux

ALTER TABLE site_info ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS facebook_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS instagram_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS twitter_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS tiktok_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS youtube_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS linkedin_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS pinterest_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS pinterest_enabled INTEGER DEFAULT 0;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS whatsapp_enabled INTEGER DEFAULT 0;

-- Ajouter les colonnes pour les settings web
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS site_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS admin_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Ajouter les colonnes pour les settings menu
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS menu_display_enabled INTEGER DEFAULT 1;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS menu_display_days VARCHAR(100) DEFAULT 'thursday,friday,saturday';
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS menu_display_start_time VARCHAR(10) DEFAULT '10:00';
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS menu_display_end_time VARCHAR(10) DEFAULT '20:00';

COMMIT;