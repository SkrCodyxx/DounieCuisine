-- Migration : Simplifier les variantes en ajoutant des colonnes directement dans la table dishes
-- Au lieu d'une table séparée, on stocke les prix petit/grand directement

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS price_small DECIMAL(10,2);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS price_large DECIMAL(10,2);
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS default_size VARCHAR(10) DEFAULT 'small';

-- Migrer les données existantes de dish_variants vers dishes
UPDATE dishes 
SET 
  price_small = (SELECT price FROM dish_variants WHERE dish_id = dishes.id AND size = 'small' LIMIT 1),
  price_large = (SELECT price FROM dish_variants WHERE dish_id = dishes.id AND size = 'large' LIMIT 1),
  default_size = CASE 
    WHEN (SELECT is_default FROM dish_variants WHERE dish_id = dishes.id AND size = 'large' LIMIT 1) = 1 THEN 'large'
    ELSE 'small'
  END
WHERE has_variants = true;

-- Pour les plats sans variantes, on met le prix dans price_small et price_large
UPDATE dishes 
SET 
  price_small = CAST(price AS DECIMAL(10,2)),
  price_large = CAST(price AS DECIMAL(10,2))
WHERE has_variants = false AND price IS NOT NULL;