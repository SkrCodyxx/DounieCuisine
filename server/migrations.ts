import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  try {
    console.log("Running migrations...");
    
    // Add logo_id column to site_info table
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Add column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'site_info' 
          AND column_name = 'logo_id'
        ) THEN
          ALTER TABLE site_info 
          ADD COLUMN logo_id integer REFERENCES media_assets(id);
          
          -- Add index for better performance
          CREATE INDEX IF NOT EXISTS idx_site_info_logo_id ON site_info(logo_id);
          
          -- Mark logo_url as deprecated in comments
          COMMENT ON COLUMN site_info.logo_url IS 'DEPRECATED - Use logo_id instead. Will be removed in future versions.';
          COMMENT ON COLUMN site_info.logo_id IS 'Reference to logo image in media_assets table';
        END IF;
      END $$;
    `);

    console.log("✓ Migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}