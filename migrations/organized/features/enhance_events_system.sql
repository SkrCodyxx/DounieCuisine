-- Migration pour améliorer le système d'événements de Dounie Cuisine
-- Support pour différents types d'activités : annonces, promotions, événements gratuits/payants

-- Ajouter de nouveaux champs à la table events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'event';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS requires_booking BOOLEAN DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS promotional BOOLEAN DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS announcement_text TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS attachment_files JSON;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS display_until TIMESTAMP;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS tags VARCHAR(500);

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Mettre à jour les valeurs par défaut pour la catégorie
ALTER TABLE events 
ALTER COLUMN category SET DEFAULT 'general';

-- Ajouter des commentaires pour clarifier l'usage
COMMENT ON COLUMN events.event_type IS 'Type d''événement: announcement, promotion, free_activity, paid_event, menu_showcase';
COMMENT ON COLUMN events.is_free IS 'Indique si l''événement est gratuit';
COMMENT ON COLUMN events.requires_booking IS 'Indique si l''événement nécessite une réservation';
COMMENT ON COLUMN events.promotional IS 'Indique si c''est une promotion ou offre spéciale';
COMMENT ON COLUMN events.announcement_text IS 'Texte d''annonce pour les posts simples';
COMMENT ON COLUMN events.attachment_files IS 'Fichiers attachés (PDFs, images menu, etc.)';
COMMENT ON COLUMN events.display_until IS 'Date jusqu''à laquelle afficher l''événement';
COMMENT ON COLUMN events.tags IS 'Tags séparés par virgules pour filtrage';
COMMENT ON COLUMN events.priority IS 'Priorité d''affichage (plus élevé = plus prioritaire)';

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);
CREATE INDEX IF NOT EXISTS idx_events_promotional ON events(promotional);
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority DESC);
CREATE INDEX IF NOT EXISTS idx_events_display_until ON events(display_until);

-- Mettre à jour quelques événements existants pour utiliser les nouveaux champs
UPDATE events 
SET event_type = 'event', 
    is_free = (price IS NULL OR price = 0),
    requires_booking = (max_guests IS NOT NULL AND max_guests > 0)
WHERE event_type IS NULL;