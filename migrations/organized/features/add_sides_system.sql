-- Migration: Ajouter le système d'accompagnements (sides)
-- Date: 2025-11-12

-- Créer la table des accompagnements
CREATE TABLE IF NOT EXISTS sides (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  is_active INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Créer la table de liaison plat-accompagnement
CREATE TABLE IF NOT EXISTS dish_sides (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL,
  side_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(dish_id, side_id),
  FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY(side_id) REFERENCES sides(id) ON DELETE CASCADE
);

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_dish_sides_dish_id ON dish_sides(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_sides_side_id ON dish_sides(side_id);

-- Donner les permissions à l'utilisateur de la base de données
GRANT SELECT, INSERT, UPDATE, DELETE ON sides TO dounie_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON dish_sides TO dounie_user;
GRANT USAGE, SELECT ON SEQUENCE sides_id_seq TO dounie_user;
GRANT USAGE, SELECT ON SEQUENCE dish_sides_id_seq TO dounie_user;
