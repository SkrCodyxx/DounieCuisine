/**
 * ROUTES ADMIN - AUTHENTIFICATION
 * Login, logout, vérification session admin
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../../storage";
import { requireAuth, loginLimiter } from "../../middleware/auth";
import { z } from "zod";

// Schéma de validation pour le login (sécurité renforcée)
const loginSchema = z.object({
  email: z.string().email("Format email invalide").min(1, "Email requis"),
  password: z.string().min(1, "Mot de passe requis").max(200, "Mot de passe trop long")
});

const router = Router();

// POST /login - Admin login avec validation renforcée
router.post("/login", async (req: Request, res: Response) => {
  try {
    console.log("[DEBUG LOGIN] Début de la tentative de connexion");
    
    // Validation sécurisée des entrées
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      console.log("[SECURITY] Validation échouée:", validation.error.format());
      return res.status(400).json({ 
        message: "Données de connexion invalides",
        errors: validation.error.format()
      });
    }

    const { email, password } = validation.data;
    console.log("[DEBUG LOGIN] Email validé:", email);

    if (!email || !password) {
      console.log("[DEBUG LOGIN] Email ou mot de passe manquant");
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log("[DEBUG LOGIN] Recherche utilisateur par email:", email);
    const adminUser = await storage.getAdminUserByEmail(email);
    console.log("[DEBUG LOGIN] Utilisateur trouvé:", adminUser ? "OUI" : "NON");
    
    if (!adminUser || !adminUser.password) {
      console.log("[DEBUG LOGIN] Utilisateur non trouvé ou pas de mot de passe");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("[DEBUG LOGIN] Vérification du mot de passe...");
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    console.log("[DEBUG LOGIN] Mot de passe valide:", isValidPassword ? "OUI" : "NON");
    
    if (!isValidPassword) {
      console.log("[DEBUG LOGIN] Mot de passe incorrect");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("[DEBUG LOGIN] Statut utilisateur actif:", adminUser.active);
    if (adminUser.active !== 1) {
      console.log("[DEBUG LOGIN] Compte inactif");
      return res.status(403).json({ message: "Account is inactive" });
    }

    console.log("[DEBUG LOGIN] Configuration de la session...");
    req.session.adminUserId = adminUser.id;
    req.session.adminEmail = adminUser.email;

    // Sauvegarder la session avant de répondre
    req.session.save((err) => {
      if (err) {
        console.error("[DEBUG LOGIN] Erreur sauvegarde session:", err);
        return res.status(500).json({ message: "Failed to save session" });
      }

      console.log("[DEBUG LOGIN] Connexion réussie pour:", adminUser.email);
      res.json({
        message: "Login successful",
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// GET /me - Get current admin user
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const adminUser = await storage.getAdminUser(req.session.adminUserId!);
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    res.json({
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      active: adminUser.active,
      lastLogin: adminUser.lastLogin,
      createdAt: adminUser.createdAt,
    });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ message: "Failed to fetch admin user" });
  }
});

// POST /logout - Admin logout
router.post("/logout", requireAuth, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// GET /check - Check admin auth
router.get("/check", (req: Request, res: Response) => {
  res.json({
    authenticated: !!req.session.adminUserId,
    adminUserId: req.session.adminUserId || null,
  });
});

// POST /change-password - Change admin password
router.post("/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const adminUser = await storage.getAdminUser(req.session.adminUserId!);
    if (!adminUser || !adminUser.password) {
      return res.status(401).json({ message: "Admin user not found" });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateAdminUser(adminUser.id, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

export default router;
