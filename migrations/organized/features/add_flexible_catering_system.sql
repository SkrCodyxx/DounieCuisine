-- Migration pour système de menu catering flexible
-- Basé sur le menu réel de Dounie Cuisine

-- 1. Catégories de menu catering avec ordre personnalisable
CREATE TABLE IF NOT EXISTS catering_categories (
    id SERIAL PRIMARY KEY,
    name_fr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Items de menu avec support multi-prix
CREATE TABLE IF NOT EXISTS catering_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES catering_categories(id) ON DELETE CASCADE,
    name_fr VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    image_id INTEGER, -- Référence à media_assets
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Prix multiples pour chaque item (petit/grand, unitaire, etc.)
CREATE TABLE IF NOT EXISTS catering_item_prices (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES catering_items(id) ON DELETE CASCADE,
    size_label_fr VARCHAR(50) NOT NULL, -- "Petit plateau", "Grand plateau", "Unitaire", "À la pointe", "Entier"
    size_label_en VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0, -- Prix par défaut pour cet item
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_catering_items_category ON catering_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catering_item_prices_item ON catering_item_prices(item_id);
CREATE INDEX IF NOT EXISTS idx_catering_categories_order ON catering_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_catering_items_order ON catering_items(display_order);

-- Insertion des catégories basées sur votre menu
INSERT INTO catering_categories (name_fr, name_en, display_order) VALUES
('Petites Bouchées & Cocktail', 'Small Bites & Cocktail', 1),
('Boissons', 'Drinks', 2),
('Fritay', 'Fritay', 3),
('Salades & Gratinés', 'Salads & Gratins', 4),
('Bananes Plantain', 'Plantain Bananas', 5),
('Poissons-Fruits de mer', 'Fish-Seafood', 6),
('Viandes', 'Meats', 7),
('Riz', 'Rice', 8),
('Latibonn', 'Latibonn', 9)
ON CONFLICT DO NOTHING;