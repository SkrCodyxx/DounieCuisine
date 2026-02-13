-- Création de la table des catégories de plats takeout
CREATE TABLE IF NOT EXISTS dish_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer des catégories par défaut
INSERT INTO dish_categories (name, description, display_order) VALUES
  ('Entrées', 'Plats d''entrée et hors-d''œuvres', 1),
  ('Soupes', 'Soupes et potages', 2),
  ('Salades', 'Salades et crudités', 3),
  ('Plats principaux', 'Plats de résistance', 4),
  ('Pâtes', 'Plats de pâtes', 5),
  ('Pizzas', 'Pizzas et tartes salées', 6),
  ('Burgers', 'Burgers et sandwichs chauds', 7),
  ('Sandwichs', 'Sandwichs froids', 8),
  ('Accompagnements', 'Plats d''accompagnement', 9),
  ('Desserts', 'Desserts et sucreries', 10),
  ('Boissons', 'Boissons chaudes et froides', 11),
  ('Spécialités', 'Spécialités de la maison', 12)
ON CONFLICT (name) DO NOTHING;

-- Mettre à jour les plats existants pour utiliser les nouvelles catégories
-- (Cette partie sera gérée manuellement pour éviter les conflits)