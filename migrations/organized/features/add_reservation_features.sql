-- Migration supplémentaire pour ajouter les fonctionnalités de réservation aux posts d'activités

-- Ajouter les champs de réservation
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS max_participants INTEGER;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS current_reservations INTEGER DEFAULT 0;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS requires_reservation BOOLEAN DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS reservation_deadline TIMESTAMP;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ticket_types JSON;

-- Ajouter des commentaires
COMMENT ON COLUMN events.max_participants IS 'Nombre maximum de participants pour l''activité';
COMMENT ON COLUMN events.current_reservations IS 'Nombre actuel de réservations';
COMMENT ON COLUMN events.requires_reservation IS 'L''activité nécessite-t-elle une réservation';
COMMENT ON COLUMN events.reservation_deadline IS 'Date limite pour réserver';
COMMENT ON COLUMN events.ticket_types IS 'Types de billets/places disponibles (JSON)';

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_events_requires_reservation ON events(requires_reservation);
CREATE INDEX IF NOT EXISTS idx_events_reservation_deadline ON events(reservation_deadline);

-- Mettre à jour les données existantes
UPDATE events 
SET requires_reservation = (price IS NOT NULL AND price > 0)
WHERE requires_reservation IS NULL;