-- Migration: Ajouter la table square_settings pour gérer les credentials Square
-- Date: 2025-12-15
-- Description: Déplacement des credentials Square du .env vers la base de données

CREATE TABLE IF NOT EXISTS "square_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"environment" varchar(20) DEFAULT 'sandbox' NOT NULL,
	"application_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"application_secret" text,
	"location_id" varchar(100) NOT NULL,
	"location_name" varchar(255),
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Insérer les credentials actuels depuis .env
INSERT INTO "square_settings" (
	"environment", 
	"application_id", 
	"access_token", 
	"application_secret",
	"location_id", 
	"location_name",
	"is_active"
) VALUES 
(
	'production', 
	'your_square_application_id', 
	'your_square_access_token',
	'your_square_webhook_secret',
	'your_location_id', 
	'Dounie cuisine (Main)',
	true
),
(
	'sandbox', 
	'sandbox-sq0idb-dYCFQU1H4r8qUOnjKznoaQ', 
	'EAAAlwEfqJ6clvPSGTC44JKvPe95YqHZTeVfMmxSD2B1aBdzZOOM0y_AYiotagOB',
	null,
	'LRFJN5J8XXVDX', 
	'Test Location',
	false
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_square_settings_environment" ON "square_settings" ("environment");
CREATE INDEX IF NOT EXISTS "idx_square_settings_active" ON "square_settings" ("is_active");