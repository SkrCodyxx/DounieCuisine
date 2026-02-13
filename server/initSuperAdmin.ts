import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Initialise automatiquement le Super Admin après le démarrage de l'application
 * Credentials: vfreud@yahoo.com / Admin2025!
 * Système simplifié - tous les admins ont accès complet
 */
export async function initializeSuperAdmin() {
  try {
    console.log("[INIT] Vérification du Super Admin...");

    // Vérifier si le Super Admin existe déjà
    const existingSuperAdmin = await db.execute(sql`
      SELECT id FROM admin_users WHERE email = 'vfreud@yahoo.com'
    `);

    if (existingSuperAdmin.rows.length > 0) {
      console.log("[INIT] ✓ Super Admin existe déjà (vfreud@yahoo.com)");
      return;
    }

    console.log("[INIT] Création du Super Admin...");

    // Créer le compte Super Admin
    // Mot de passe: !Phone200344VILF
    const password = "!Phone200344VILF";
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(sql`
      INSERT INTO admin_users (
        username, 
        email, 
        password, 
        role, 
        active
      )
      VALUES (
        'vfreud',
        'vfreud@yahoo.com',
        ${hashedPassword},
        'super_admin',
        1
      )
    `);

    console.log("╔═══════════════════════════════════════════════════════════════╗");
    console.log("║          SUPER ADMIN CRÉÉ AVEC SUCCÈS                         ║");
    console.log("╠═══════════════════════════════════════════════════════════════╣");
    console.log("║  Email:            vfreud@yahoo.com                           ║");
    console.log("║  Rôle:             super_admin                                ║");
    console.log("║  Accès:            Complet (tous les admins ont accès total)  ║");
    console.log("║                                                               ║");
    console.log("║  ⚠️  SÉCURITÉ:                                                  ║");
    console.log("║  Changez le mot de passe immédiatement après la connexion    ║");
    console.log("║  Le mot de passe temporaire a été défini lors de la création ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");

  } catch (error) {
    console.error("[INIT] ❌ Erreur lors de l'initialisation du Super Admin:", error);
    // Ne pas bloquer le démarrage de l'application
  }
}
