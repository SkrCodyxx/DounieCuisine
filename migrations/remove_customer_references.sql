-- Migration pour supprimer customer_id des tables
ALTER TABLE event_bookings DROP COLUMN IF EXISTS customer_id;
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS customer_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS customer_dc_id;
ALTER TABLE receipts DROP COLUMN IF EXISTS customer_id;
ALTER TABLE receipts DROP COLUMN IF EXISTS customer_dc_id;
