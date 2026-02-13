-- Script simplifié pour corriger les prix des salades & gratinés et viandes

-- ================================
-- PRIX POUR: Salades & Gratinés
-- ================================

-- Nettoyer les prix existants pour les salades/gratinés
DELETE FROM catering_item_prices WHERE item_id IN (SELECT id FROM catering_items WHERE category_id = 4);

-- Salade Verte
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Salade Verte'), 'Petit Plateau', 'Small Platter', 40.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Salade Verte'), 'Grand Plateau', 'Large Platter', 70.00, 0, 2);

-- Salade César
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Salade César'), 'Petit Plateau', 'Small Platter', 45.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Salade César'), 'Grand Plateau', 'Large Platter', 80.00, 0, 2);

-- Salade Macaroni
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Salade Macaroni'), 'Petit Plateau', 'Small Platter', 50.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Salade Macaroni'), 'Grand Plateau', 'Large Platter', 90.00, 0, 2);

-- Salade Russe
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Salade Russe'), 'Petit Plateau', 'Small Platter', 45.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Salade Russe'), 'Grand Plateau', 'Large Platter', 80.00, 0, 2);

-- Salade de Pomme de Terre
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Salade de Pomme de Terre'), 'Petit Plateau', 'Small Platter', 45.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Salade de Pomme de Terre'), 'Grand Plateau', 'Large Platter', 80.00, 0, 2);

-- Macaroni Gratiné
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Macaroni Gratiné'), 'Petit Plateau', 'Small Platter', 65.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Macaroni Gratiné'), 'Grand Plateau', 'Large Platter', 100.00, 0, 2);

-- Lasagne
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Lasagne'), 'Petit Plateau', 'Small Platter', 75.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Lasagne'), 'Grand Plateau', 'Large Platter', 110.00, 0, 2);

-- Soufflé de Maïs
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Soufflé de Maïs'), 'Petit Plateau', 'Small Platter', 70.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Soufflé de Maïs'), 'Grand Plateau', 'Large Platter', 90.00, 0, 2);

-- ================================
-- PRIX POUR: Viandes
-- ================================

-- Nettoyer les prix existants pour les viandes
DELETE FROM catering_item_prices WHERE item_id IN (SELECT id FROM catering_items WHERE category_id = 7);

-- Griot
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Griot'), 'Petit Plateau', 'Small Platter', 110.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Griot'), 'Grand Plateau', 'Large Platter', 180.00, 0, 2);

-- Poulet
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Poulet'), 'Petit Plateau', 'Small Platter', 130.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Poulet'), 'Grand Plateau', 'Large Platter', 190.00, 0, 2);

-- Tasso Cabrit
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Tasso Cabrit'), 'Petit Plateau', 'Small Platter', 180.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Tasso Cabrit'), 'Grand Plateau', 'Large Platter', 240.00, 0, 2);

-- Cabrit en Sauce
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Cabrit en Sauce'), 'Petit Plateau', 'Small Platter', 180.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Cabrit en Sauce'), 'Grand Plateau', 'Large Platter', 240.00, 0, 2);

-- Tasso Boeuf
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Tasso Boeuf'), 'Petit Plateau', 'Small Platter', 140.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Tasso Boeuf'), 'Grand Plateau', 'Large Platter', 190.00, 0, 2);

-- Ailes de Poulet
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Ailes de Poulet'), 'Petit Plateau', 'Small Platter', 100.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Ailes de Poulet'), 'Grand Plateau', 'Large Platter', 160.00, 0, 2);

-- Ailes à la Mangue
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Ailes à la Mangue'), 'Petit Plateau', 'Small Platter', 100.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Ailes à la Mangue'), 'Grand Plateau', 'Large Platter', 160.00, 0, 2);

-- Brochettes de Poulet
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Brochettes de Poulet'), 'Petit Plateau', 'Small Platter', 100.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Brochettes de Poulet'), 'Grand Plateau', 'Large Platter', 160.00, 0, 2);

-- Côtes Levées
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Côtes Levées'), 'Petit Plateau', 'Small Platter', 100.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Côtes Levées'), 'Grand Plateau', 'Large Platter', 170.00, 0, 2);

-- Poulet Jerk
INSERT INTO catering_item_prices (item_id, size_label_fr, size_label_en, price, is_default, display_order) VALUES
((SELECT id FROM catering_items WHERE name_fr = 'Poulet Jerk'), 'Petit Plateau', 'Small Platter', 130.00, 1, 1),
((SELECT id FROM catering_items WHERE name_fr = 'Poulet Jerk'), 'Grand Plateau', 'Large Platter', 190.00, 0, 2);