-- Migration: Ajouter tags alimentaires (végétarien, sans gluten, halal, etc.)
-- Date: 2025-11-23

-- Ajouter colonne dietary_tags pour badges alimentaires
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS dietary_tags TEXT;

-- Ajouter colonne allergens_list pour liste détaillée allergènes
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS allergens_list TEXT;

-- Exemples de tags: vegetarian, vegan, gluten-free, dairy-free, halal, kosher, nut-free, spicy
-- Format JSON array: ["vegetarian", "gluten-free"]

-- Pour table catering_items aussi
ALTER TABLE catering_items ADD COLUMN IF NOT EXISTS dietary_tags TEXT;
ALTER TABLE catering_items ADD COLUMN IF NOT EXISTS allergens_list TEXT;

COMMENT ON COLUMN dishes.dietary_tags IS 'JSON array of dietary tags: vegetarian, vegan, gluten-free, halal, etc.';
COMMENT ON COLUMN dishes.allergens_list IS 'JSON array of allergens: gluten, lactose, nuts, shellfish, etc.';
COMMENT ON COLUMN catering_items.dietary_tags IS 'JSON array of dietary tags for catering items';
COMMENT ON COLUMN catering_items.allergens_list IS 'JSON array of allergens for catering items';
