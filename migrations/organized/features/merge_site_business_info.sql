-- Migration pour fusionner site_info et business_info en une table optimisée
-- Sauvegarde des données existantes puis restructuration

BEGIN;

-- 1. Sauvegarde des données actuelles
CREATE TEMP TABLE site_info_backup AS SELECT * FROM site_info;
CREATE TEMP TABLE business_info_backup AS SELECT * FROM business_info;

-- 2. Suppression de l'ancienne table site_info
DROP TABLE IF EXISTS site_info CASCADE;

-- 3. Création de la nouvelle table site_info optimisée
CREATE TABLE site_info (
    id SERIAL PRIMARY KEY,
    
    -- Informations business essentielles
    business_name VARCHAR(100) NOT NULL DEFAULT 'Dounie Cuisine',
    tagline VARCHAR(200),
    description TEXT,
    
    -- Contact principal
    phone VARCHAR(20),
    email VARCHAR(100),
    
    -- Adresse complète
    address TEXT,
    website_url VARCHAR(255),
    
    -- Horaires d'ouverture
    business_hours JSON DEFAULT '{"monday":"9h00-18h00","tuesday":"9h00-18h00","wednesday":"9h00-18h00","thursday":"9h00-18h00","friday":"9h00-20h00","saturday":"10h00-20h00","sunday":"10h00-16h00"}',
    
    -- Taxes et livraison
    tps_rate DECIMAL(5,3) DEFAULT 0.050,
    tvq_rate DECIMAL(5,4) DEFAULT 0.0998,
    delivery_fee DECIMAL(10,2) DEFAULT 5.00,
    delivery_radius_km DECIMAL(5,2) DEFAULT 15.00,
    
    -- Logo et visibilité
    logo_id INTEGER,
    logo_visible BOOLEAN DEFAULT true,
    
    -- URLs du site
    site_url VARCHAR(255) DEFAULT 'https://douniecuisine.com/',
    admin_url VARCHAR(255) DEFAULT 'https://douniecuisine.com/admin',
    
    -- SEO
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Restauration des données consolidées
INSERT INTO site_info (
    business_name, tagline, description,
    phone, email, address, website_url,
    business_hours, tps_rate, tvq_rate, delivery_fee, delivery_radius_km,
    logo_id, logo_visible, site_url, admin_url,
    meta_description, meta_keywords, updated_at
)
SELECT 
    COALESCE(s.business_name, b.business_name, 'Dounie Cuisine'),
    COALESCE(s.tagline, b.tagline, 'L''Art du Goût'),
    COALESCE(s.description, b.description, 'Cuisine traditionnelle haïtienne préparée avec passion'),
    COALESCE(s.phone1, b.phone, '+1 514 743-8128'),
    COALESCE(s.email_primary, b.email, 'info@douniecuisine.com'),
    COALESCE(s.address || ', ' || s.city || ', ' || s.province || ' ' || s.postal_code, b.address, '3954 Boulevard Leman, Laval, Québec H7E 1A1'),
    COALESCE(s.site_url, b.website_url, 'https://douniecuisine.com/'),
    COALESCE(s.business_hours, b.business_hours, '{"monday":"9h00-18h00","tuesday":"9h00-18h00","wednesday":"9h00-18h00","thursday":"9h00-18h00","friday":"9h00-20h00","saturday":"10h00-20h00","sunday":"10h00-16h00"}'),
    COALESCE(s.tps_rate, b.tps_rate, 0.050),
    COALESCE(s.tvq_rate, b.tvq_rate, 0.0998),
    COALESCE(b.delivery_fee, 5.00),
    COALESCE(s.delivery_radius_km, 15.00),
    s.logo_id,
    COALESCE(s.logo_visible::boolean, true),
    COALESCE(s.site_url, 'https://douniecuisine.com/'),
    COALESCE(s.admin_url, 'https://douniecuisine.com/admin'),
    s.meta_description,
    s.meta_keywords,
    GREATEST(COALESCE(s.updated_at, NOW()), COALESCE(b.updated_at, NOW()))
FROM site_info_backup s
FULL OUTER JOIN business_info_backup b ON true
LIMIT 1;

-- 5. Suppression de la vue business_info (si c'est une vue)
DROP VIEW IF EXISTS business_info;

-- 6. Création d'une vue business_info pour compatibilité
CREATE VIEW business_info AS
SELECT 
    id,
    business_name,
    tagline,
    description,
    phone,
    email,
    address,
    website_url,
    business_hours,
    tps_rate,
    tvq_rate,
    delivery_fee,
    updated_at
FROM site_info;

-- 7. Index pour performance
CREATE INDEX idx_site_info_business_name ON site_info(business_name);
CREATE INDEX idx_site_info_updated_at ON site_info(updated_at);

-- 8. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_info_updated_at 
    BEFORE UPDATE ON site_info 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Vérification
SELECT 'Migration terminée - site_info fusionné' as status;
SELECT COUNT(*) as nb_records FROM site_info;
SELECT business_name, phone, email FROM site_info LIMIT 1;