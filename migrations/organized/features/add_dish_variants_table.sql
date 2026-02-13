-- Migration: Add dish_variants table
-- Cette table permet de gérer les variantes de prix pour les plats (petit/grand)

CREATE TABLE "dish_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"dish_id" integer NOT NULL,
	"size" varchar(20) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Ajouter la colonne has_variants à la table dishes si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dishes' AND column_name = 'has_variants') THEN
        ALTER TABLE "dishes" ADD COLUMN "has_variants" integer DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "dish_variants_dish_id_idx" ON "dish_variants" ("dish_id");
CREATE INDEX IF NOT EXISTS "dish_variants_size_idx" ON "dish_variants" ("size");