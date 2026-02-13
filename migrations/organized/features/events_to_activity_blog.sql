-- Migration pour transformer les événements en système de posts d'activités (blog style)
-- Dounie Cuisine pourra poster ses activités de manière chronologique

-- D'abord, sauvegardons les données existantes
CREATE TABLE IF NOT EXISTS events_backup AS SELECT * FROM events;

-- Supprimer les colonnes qui ne sont plus nécessaires pour un blog
ALTER TABLE events DROP COLUMN IF EXISTS event_type;
ALTER TABLE events DROP COLUMN IF EXISTS requires_booking;
ALTER TABLE events DROP COLUMN IF EXISTS promotional;
ALTER TABLE events DROP COLUMN IF EXISTS announcement_text;
ALTER TABLE events DROP COLUMN IF EXISTS display_until;
ALTER TABLE events DROP COLUMN IF EXISTS tags;
ALTER TABLE events DROP COLUMN IF EXISTS priority;
ALTER TABLE events DROP COLUMN IF EXISTS end_date;
ALTER TABLE events DROP COLUMN IF EXISTS event_time;
ALTER TABLE events DROP COLUMN IF EXISTS max_guests;
ALTER TABLE events DROP COLUMN IF EXISTS current_bookings;

-- Ajouter de nouveaux champs adaptés pour un blog d'activités
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'activity';

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS short_excerpt TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS media_gallery JSON;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS author_id INTEGER;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS engagement_stats JSON;

-- Renommer certaines colonnes pour être plus claires pour un blog
ALTER TABLE events RENAME COLUMN event_date TO activity_date;
ALTER TABLE events RENAME COLUMN gallery_images TO media_attachments;

-- Mettre à jour les valeurs par défaut et contraintes
ALTER TABLE events ALTER COLUMN is_free SET DEFAULT NULL;
ALTER TABLE events ALTER COLUMN activity_date DROP NOT NULL;
ALTER TABLE events ALTER COLUMN published_at SET DEFAULT NOW();

-- Ajouter des commentaires pour clarifier l'usage du nouveau système
COMMENT ON COLUMN events.post_type IS 'Type de post: activity, announcement, promotion, menu_update, opening_hours, special_event';
COMMENT ON COLUMN events.content IS 'Contenu principal du post (HTML/Markdown)';
COMMENT ON COLUMN events.short_excerpt IS 'Extrait court pour les listes';
COMMENT ON COLUMN events.media_gallery IS 'Galerie de médias (images, PDFs, etc.)';
COMMENT ON COLUMN events.is_pinned IS 'Post épinglé en haut du feed';
COMMENT ON COLUMN events.is_published IS 'Post publié et visible';
COMMENT ON COLUMN events.published_at IS 'Date de publication du post';
COMMENT ON COLUMN events.author_id IS 'ID de l''administrateur auteur';
COMMENT ON COLUMN events.engagement_stats IS 'Statistiques d''engagement (vues, etc.)';
COMMENT ON COLUMN events.activity_date IS 'Date de l''activité (si applicable)';

-- Créer des index pour les performances du blog
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_pinned ON events(is_pinned);
CREATE INDEX IF NOT EXISTS idx_events_post_type ON events(post_type);
CREATE INDEX IF NOT EXISTS idx_events_activity_date ON events(activity_date);

-- Mettre à jour les données existantes
UPDATE events 
SET 
    post_type = 'activity',
    is_published = (status = 'upcoming' OR status = 'ongoing'),
    published_at = COALESCE(published_at, created_at),
    short_excerpt = LEFT(description, 200)
WHERE post_type IS NULL;