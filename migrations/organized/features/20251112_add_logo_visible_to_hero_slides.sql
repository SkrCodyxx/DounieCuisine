-- Ajout du champ logo_visible pour contrôler l'affichage du logo sur chaque slide
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS logo_visible integer DEFAULT 1 NOT NULL;
