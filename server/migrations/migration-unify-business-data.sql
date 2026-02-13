-- MIGRATION: Unification des données business
-- Objectif: Centraliser toutes les données dans site_info simplifié

BEGIN;

-- ========================================
-- 1. Créer nouvelle structure simplifiée
-- ========================================

-- Sauvegarde des données actuelles
CREATE TEMP TABLE site_info_backup AS SELECT * FROM site_info;

-- Ajouter colonnes unifiées si elles n'existent pas
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS unified_phone VARCHAR(20);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS unified_email VARCHAR(100);
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS unified_address TEXT;
ALTER TABLE site_info ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

-- ========================================
-- 2. Consolider les données
-- ========================================

-- Unifier téléphone (prendre le premier non-null)
UPDATE site_info SET unified_phone = 
  COALESCE(phone1, phone2, phone3, '+1 514 743-8128')
  WHERE unified_phone IS NULL;

-- Unifier email (prendre le premier non-null)
UPDATE site_info SET unified_email = 
  COALESCE(email_primary, email_secondary, email_support, 'info@douniecuisine.com')
  WHERE unified_email IS NULL;

-- Unifier adresse (format complet)
UPDATE site_info SET unified_address = 
  TRIM(CONCAT(
    COALESCE(address, '3954 Boulevard Leman'), 
    CASE WHEN city IS NOT NULL THEN ', ' || city ELSE ', Laval' END,
    CASE WHEN province IS NOT NULL THEN ', ' || province ELSE ', QC' END,
    CASE WHEN postal_code IS NOT NULL THEN ' ' || postal_code ELSE ' H7E 1A1' END,
    CASE WHEN country IS NOT NULL AND country != 'Canada' THEN ', ' || country ELSE '' END
  ))
  WHERE unified_address IS NULL;

-- Unifier website URL
UPDATE site_info SET website_url = 
  COALESCE(website_url, 'https://douniecuisine.com')
  WHERE website_url IS NULL;

-- ========================================
-- 3. Nettoyer colonnes obsolètes (optionnel)
-- ========================================

-- Pour l'instant, on garde les anciennes colonnes pour compatibilité
-- Plus tard, on pourra les supprimer :
-- ALTER TABLE site_info DROP COLUMN phone2;
-- ALTER TABLE site_info DROP COLUMN phone3;
-- etc.

-- ========================================
-- 4. Créer vue simplifiée pour l'API
-- ========================================

CREATE OR REPLACE VIEW business_info AS
SELECT 
  id,
  business_name,
  tagline,
  description,
  unified_phone AS phone,
  unified_email AS email,
  unified_address AS address,
  website_url,
  business_hours,
  tps_rate,
  tvq_rate,
  delivery_fee,
  updated_at
FROM site_info
WHERE id = 1;

-- ========================================
-- 5. Fonction pour récupérer info business
-- ========================================

CREATE OR REPLACE FUNCTION get_business_info()
RETURNS TABLE(
  business_name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  website_url VARCHAR(255),
  tagline VARCHAR(200)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.business_name,
    si.unified_phone,
    si.unified_email,
    si.unified_address,
    si.website_url,
    si.tagline
  FROM site_info si
  WHERE si.id = 1
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. Vérification des données unifiées
-- ========================================

SELECT 
  'AVANT UNIFICATION' AS status,
  business_name,
  phone1 AS ancien_phone,
  email_primary AS ancien_email,
  address AS ancienne_address
FROM site_info_backup;

SELECT 
  'APRÈS UNIFICATION' AS status,
  business_name,
  unified_phone AS nouveau_phone,
  unified_email AS nouveau_email,
  unified_address AS nouvelle_address
FROM site_info;

COMMIT;

-- ========================================
-- Test de la fonction
-- ========================================
SELECT * FROM get_business_info();

ANALYZE site_info;