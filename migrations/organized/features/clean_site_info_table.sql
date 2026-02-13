-- Migration: Nettoyage de la table site_info
-- Supprime toutes les colonnes inutilisées identifiées

BEGIN;

-- Supprimer les colonnes de réseaux sociaux inutilisées (vides)
ALTER TABLE site_info DROP COLUMN IF EXISTS email_secondary;
ALTER TABLE site_info DROP COLUMN IF EXISTS email_support;
ALTER TABLE site_info DROP COLUMN IF EXISTS phone3;
ALTER TABLE site_info DROP COLUMN IF EXISTS phone3_label;

-- Supprimer les URLs réseaux sociaux (vides)
ALTER TABLE site_info DROP COLUMN IF EXISTS facebook_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS twitter_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS tiktok_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS youtube_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS linkedin_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS pinterest_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS whatsapp_number;

-- Supprimer les flags enabled (tous à 0)
ALTER TABLE site_info DROP COLUMN IF EXISTS facebook_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS instagram_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS twitter_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS tiktok_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS youtube_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS linkedin_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS pinterest_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS whatsapp_enabled;

-- Supprimer les champs meta (vides)
ALTER TABLE site_info DROP COLUMN IF EXISTS meta_description;
ALTER TABLE site_info DROP COLUMN IF EXISTS meta_keywords;

-- Supprimer les champs menu display (feature non utilisée)
ALTER TABLE site_info DROP COLUMN IF EXISTS menu_display_enabled;
ALTER TABLE site_info DROP COLUMN IF EXISTS menu_display_days;
ALTER TABLE site_info DROP COLUMN IF EXISTS menu_display_start_time;
ALTER TABLE site_info DROP COLUMN IF EXISTS menu_display_end_time;

-- Supprimer les champs URLs redondants
ALTER TABLE site_info DROP COLUMN IF EXISTS site_url;
ALTER TABLE site_info DROP COLUMN IF EXISTS admin_url;

-- Supprimer les champs unifiés redondants (on a déjà phone1, email_primary, address)
ALTER TABLE site_info DROP COLUMN IF EXISTS unified_phone;
ALTER TABLE site_info DROP COLUMN IF EXISTS unified_email;
ALTER TABLE site_info DROP COLUMN IF EXISTS unified_address;
ALTER TABLE site_info DROP COLUMN IF EXISTS website_url;

COMMIT;

-- Vérifier la structure finale
\d site_info