-- Add logo_id column to site_info table
ALTER TABLE site_info 
ADD COLUMN logo_id integer REFERENCES media_assets(id);

-- Comment on column
COMMENT ON COLUMN site_info.logo_id IS 'Reference to logo image in media_assets table';

-- Add index for better performance
CREATE INDEX idx_site_info_logo_id ON site_info(logo_id);

-- Mark logo_url as deprecated
COMMENT ON COLUMN site_info.logo_url IS 'DEPRECATED - Use logo_id instead. Will be removed in future versions.';