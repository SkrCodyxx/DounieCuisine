-- Migration pour ajouter les colonnes manquantes à site_info
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(255);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Toronto';

-- Mise à jour des données par défaut si nécessaire
UPDATE site_info SET 
  company_name = COALESCE(company_name, name),
  country = COALESCE(country, 'Canada'),
  timezone = COALESCE(timezone, 'America/Toronto')
WHERE id = 1;