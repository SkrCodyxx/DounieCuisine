-- Script d'initialisation des zones de livraison
-- À exécuter avec: psql -d douniecuisine -f scripts/init-delivery-zones.sql

-- Supprimer les zones existantes (si on veut recommencer)
-- DELETE FROM delivery_zones;

-- Créer des zones de livraison par défaut (ajuster selon vos besoins)

-- Zone 1: 0-5 km - Gratuit ou prix réduit
INSERT INTO delivery_zones (zone_name, distance_min_km, distance_max_km, delivery_price, is_active)
VALUES ('Zone locale (0-5 km)', 0.00, 5.00, 3.99, 1)
ON CONFLICT DO NOTHING;

-- Zone 2: 5-10 km - Prix moyen
INSERT INTO delivery_zones (zone_name, distance_min_km, distance_max_km, delivery_price, is_active)
VALUES ('Zone intermédiaire (5-10 km)', 5.01, 10.00, 5.99, 1)
ON CONFLICT DO NOTHING;

-- Zone 3: 10-15 km - Prix maximum
INSERT INTO delivery_zones (zone_name, distance_min_km, distance_max_km, delivery_price, is_active)
VALUES ('Zone éloignée (10-15 km)', 10.01, 15.00, 8.99, 1)
ON CONFLICT DO NOTHING;

-- Vérifier les zones créées
SELECT 
  id,
  zone_name,
  distance_min_km,
  distance_max_km,
  delivery_price,
  CASE WHEN is_active = 1 THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM delivery_zones
ORDER BY distance_min_km ASC;
