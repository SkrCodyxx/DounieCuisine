-- Migration: Create flexible variants system
-- Allows unlimited customizable variants per dish with custom labels and prices

-- Create new dish_variants table with flexible structure
CREATE TABLE IF NOT EXISTS dish_variants_new (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL, -- e.g., "Petit", "Grand", "Extra Large", "Sans Sauce", etc.
  price NUMERIC(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0, -- For ordering variants
  is_default INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dish_id, label)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dish_variants_new_dish_id ON dish_variants_new(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_variants_new_display_order ON dish_variants_new(dish_id, display_order);

-- Migrate data from old system if it exists
-- If priceSmall/priceLarge exist, migrate them
INSERT INTO dish_variants_new (dish_id, label, price, display_order, is_default, created_at, updated_at)
SELECT 
  id,
  'Petit',
  COALESCE(price_small, price, 0),
  0,
  CASE WHEN default_size = 'small' THEN 1 ELSE 0 END,
  created_at,
  updated_at
FROM dishes
WHERE has_variants = true AND price_small IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO dish_variants_new (dish_id, label, price, display_order, is_default, created_at, updated_at)
SELECT 
  id,
  'Grand',
  COALESCE(price_large, 0),
  1,
  CASE WHEN default_size = 'large' THEN 1 ELSE 0 END,
  created_at,
  updated_at
FROM dishes
WHERE has_variants = true AND price_large IS NOT NULL
ON CONFLICT DO NOTHING;

-- For dishes without variants, create a single variant with base price
INSERT INTO dish_variants_new (dish_id, label, price, is_default, created_at, updated_at)
SELECT 
  id,
  'Standard',
  COALESCE(price, 0),
  1,
  created_at,
  updated_at
FROM dishes
WHERE has_variants = false AND price IS NOT NULL
ON CONFLICT DO NOTHING;

-- Keep old columns for backward compatibility (will be dropped in future migration)
-- Old system will just read from new table

COMMIT;
