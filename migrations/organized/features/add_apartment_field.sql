-- Migration: Ajouter le champ apartment aux clients et commandes
-- Date: 2025-11-09
-- Description: Ajouter un champ pour le numéro d'appartement dans les informations client et livraison

-- Ajouter le champ apartment à la table customers
ALTER TABLE customers 
ADD COLUMN apartment VARCHAR(20);

-- Ajouter le champ delivery_apartment à la table orders
ALTER TABLE orders 
ADD COLUMN delivery_apartment VARCHAR(20);

-- Ajouter des commentaires pour clarifier l'usage
COMMENT ON COLUMN customers.apartment IS 'Numéro d''appartement, unité ou bureau (optionnel)';
COMMENT ON COLUMN orders.delivery_apartment IS 'Numéro d''appartement pour la livraison (optionnel)';

-- Créer des index pour faciliter les recherches si nécessaire
CREATE INDEX idx_customers_apartment ON customers(apartment) WHERE apartment IS NOT NULL;
CREATE INDEX idx_orders_delivery_apartment ON orders(delivery_apartment) WHERE delivery_apartment IS NOT NULL;