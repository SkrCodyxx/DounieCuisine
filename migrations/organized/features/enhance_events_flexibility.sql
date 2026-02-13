-- Migration pour améliorer la flexibilité des événements
-- Ajout des colonnes pour les événements flexibles

-- Colonnes pour les types d'événements flexibles
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'announcement';
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_pricing BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_guests INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 50;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 120;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time TIME;

-- Colonnes pour les fichiers joints (menus PDF, images, etc.)
ALTER TABLE events ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);
ALTER TABLE events ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

-- Mise à jour des événements existants
UPDATE events SET has_pricing = (price IS NOT NULL AND price > 0);
UPDATE events SET event_type = CASE 
    WHEN price IS NOT NULL AND price > 0 THEN 'ticketed'
    WHEN is_free = true THEN 'invitation'
    ELSE 'announcement'
END;

-- Commentaires pour clarifier les types d'événements
COMMENT ON COLUMN events.event_type IS 'Types: announcement (blog), ticketed (billetterie), invitation (sans prix), catering (traiteur)';
COMMENT ON COLUMN events.has_pricing IS 'Indique si l événement a un système de tarification';
COMMENT ON COLUMN events.attachment_url IS 'URL du fichier joint (PDF menu, image, etc.)';
COMMENT ON COLUMN events.attachment_type IS 'Type de fichier: pdf, image, menu, document';
COMMENT ON COLUMN events.attachment_name IS 'Nom du fichier pour affichage';