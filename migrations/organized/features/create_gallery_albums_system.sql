-- Migration: Nouveau système de galerie avec albums d'événements
-- Date: 2025-12-01
-- Description: Transforme la galerie en système d'albums contenant plusieurs photos

-- Table des albums/événements de galerie
CREATE TABLE IF NOT EXISTS gallery_albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date DATE,
    location VARCHAR(100),
    cover_image_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'événements',
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table des photos dans chaque album
CREATE TABLE IF NOT EXISTS gallery_photos (
    id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    media_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    title VARCHAR(100),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_gallery_albums_active ON gallery_albums(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_featured ON gallery_albums(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_category ON gallery_albums(category);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_album ON gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_active ON gallery_photos(is_active);

-- Commentaires
COMMENT ON TABLE gallery_albums IS 'Albums/événements de la galerie contenant plusieurs photos';
COMMENT ON TABLE gallery_photos IS 'Photos individuelles appartenant à un album';
COMMENT ON COLUMN gallery_albums.cover_image_id IS 'Image de couverture de l''album';
COMMENT ON COLUMN gallery_albums.event_date IS 'Date de l''événement si applicable';
COMMENT ON COLUMN gallery_photos.album_id IS 'Référence à l''album parent';
