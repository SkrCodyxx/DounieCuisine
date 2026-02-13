-- Migration: add logo_visible column to site_info
ALTER TABLE site_info
ADD COLUMN IF NOT EXISTS logo_visible integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN site_info.logo_visible IS '1 = visible, 0 = hidden';
