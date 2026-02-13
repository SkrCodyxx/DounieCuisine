-- Migration pour ajouter les champs manquants dans site_info, events et testimonials
-- Date: 2025-11-13

-- Ajouter les champs manquants à site_info
ALTER TABLE site_info 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'America/Toronto',
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS online_ordering_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reservations_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN DEFAULT true;

-- Ajouter champ isPublished aux events s'il manque
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- S'assurer que les champs approved et featured existent dans testimonials
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS approved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured INTEGER DEFAULT 0;

-- Mettre à jour les valeurs par défaut existantes
UPDATE site_info SET 
  company_name = business_name || ' Inc.',
  timezone = 'America/Toronto',
  maintenance_mode = false,
  online_ordering_enabled = true,
  reservations_enabled = true,
  newsletter_enabled = true
WHERE id = 1 AND company_name IS NULL;

-- Mettre à jour les événements pour qu'ils soient publiés par défaut
UPDATE events SET is_published = true WHERE is_published IS NULL;

-- S'assurer que les témoignages ont les bonnes valeurs par défaut
UPDATE testimonials SET 
  approved = COALESCE(approved, 0),
  featured = COALESCE(featured, 0);