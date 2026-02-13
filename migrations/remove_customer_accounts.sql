-- Migration: Supprimer complètement le système de comptes clients
-- Date: 2025-12-04
-- Raison: Les clients seront maintenant uniquement via les commandes (nom, email, phone)

-- 1. Supprimer les contraintes de clé étrangère d'abord
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS event_bookings DROP CONSTRAINT IF EXISTS event_bookings_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS messages DROP CONSTRAINT IF EXISTS messages_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS customer_notifications DROP CONSTRAINT IF EXISTS customer_notifications_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_customer_id_customers_id_fk;
ALTER TABLE IF EXISTS testimonials DROP CONSTRAINT IF EXISTS testimonials_customer_id_customers_id_fk;

-- 2. Supprimer la colonne customer_id des tables et la remplacer par des champs directs
-- Table orders - remplacer customer_id par champs directs
ALTER TABLE orders 
  DROP COLUMN IF EXISTS customer_id,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Mettre à jour les commandes existantes avec les données client avant suppression
UPDATE orders 
SET 
  customer_name = COALESCE(customers.name, orders.customer_name),
  customer_email = COALESCE(customers.email, orders.customer_email),
  customer_phone = COALESCE(customers.phone, orders.customer_phone)
FROM customers 
WHERE orders.customer_id = customers.id;

-- Table event_bookings - remplacer customer_id par champs directs  
ALTER TABLE event_bookings 
  DROP COLUMN IF EXISTS customer_id,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Mettre à jour les réservations existantes
UPDATE event_bookings 
SET 
  customer_name = COALESCE(customers.name, event_bookings.customer_name),
  customer_email = COALESCE(customers.email, event_bookings.customer_email), 
  customer_phone = COALESCE(customers.phone, event_bookings.customer_phone)
FROM customers 
WHERE event_bookings.customer_id = customers.id;

-- 3. Supprimer les tables liées aux comptes clients
DROP TABLE IF EXISTS customer_notifications CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS messages CASCADE; -- Messages clients (pas admin)

-- 4. Mettre à jour la table testimonials pour être indépendante
ALTER TABLE testimonials 
  DROP COLUMN IF EXISTS customer_id,
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(100);

-- Mettre à jour les témoignages existants
UPDATE testimonials 
SET 
  customer_name = COALESCE(customers.name, testimonials.customer_name),
  customer_email = COALESCE(customers.email, testimonials.customer_email)
FROM customers 
WHERE testimonials.customer_id = customers.id;

-- 5. Supprimer la table customers complètement
DROP TABLE IF EXISTS customers CASCADE;

-- 6. Nettoyer les index et contraintes restantes
DROP INDEX IF EXISTS idx_customers_apartment;
DROP INDEX IF EXISTS idx_customers_created_at; 
DROP INDEX IF EXISTS idx_customers_email;

-- 7. Ajouter des index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_event_bookings_customer_email ON event_bookings(customer_email);