/**
 * ROUTES ADMIN - GESTION UTILISATEURS
 * Admin users, permissions (Note: système clients supprimé)
 */

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { storage } from "../../storage";
import * as schema from "../../../shared/schema";
import { adminUsers } from "../../../shared/schema";
import { requireAuth, requirePermission } from "../../middleware/auth";
import { createAdminUserSchema, updateAdminUserSchema } from "../utils";

const router = Router();

// ============================================================
// CUSTOMERS - SYSTÈME SUPPRIMÉ
// Routes conservées pour compatibilité, retournent des données vides
// ============================================================

// GET /customers - Système supprimé
router.get("/customers", requireAuth, async (req: Request, res: Response) => {
  res.json({
    customers: [],
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
    message: "Le système de comptes clients a été supprimé"
  });
});

// GET /customers/:id - Système supprimé
router.get("/customers/:id", requireAuth, async (req: Request, res: Response) => {
  res.status(404).json({ message: "Le système de comptes clients a été supprimé" });
});

// PATCH /customers/:id - Système supprimé
router.patch("/customers/:id", requireAuth, async (req: Request, res: Response) => {
  res.status(404).json({ message: "Le système de comptes clients a été supprimé" });
});

// DELETE /customers/:id - Système supprimé
router.delete("/customers/:id", requireAuth, async (req: Request, res: Response) => {
  res.status(404).json({ message: "Le système de comptes clients a été supprimé" });
});

// ============================================================
// ADMIN USERS
// ============================================================

// GET /users - Get all admin users
router.get("/users", requireAuth, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAdminUsers();
    
    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Failed to fetch admin users" });
  }
});

// POST /users - Create admin user
router.post("/users", requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createAdminUserSchema.parse(req.body);
    
    // Check if email already exists
    const existing = await storage.getAdminUserByEmail(validatedData.email);
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await storage.createAdminUser({
      ...validatedData,
      password: hashedPassword,
    });

    const { password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ 
      message: "Failed to create admin user",
      error: error.message 
    });
  }
});

// PATCH /users/:id - Update admin user
router.patch("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const validatedData = updateAdminUserSchema.parse(req.body);

    // If updating password, hash it
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    const updated = await storage.updateAdminUser(userId, validatedData);
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password before sending response
    const { password: _, ...safeUser } = updated as any;

    res.json(safeUser);
  } catch (error: any) {
    console.error("Error updating admin user:", error);
    res.status(500).json({ 
      message: "Failed to update admin user",
      error: error.message 
    });
  }
});

// DELETE /users/:id - Delete admin user
router.delete("/users/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Only prevent deleting yourself
    if (userId === req.session.adminUserId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    // Super admins can delete anyone else (no other restrictions)

    await storage.deleteAdminUser(userId);
    res.json({ message: "Admin user deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ message: "Failed to delete admin user" });
  }
});

// ============================================================
// PERMISSIONS
// ============================================================

// GET /modules - Get all permission modules
router.get("/modules", requireAuth, async (req: Request, res: Response) => {
  try {
    const modules = await storage.getAdminModules();
    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ message: "Failed to fetch modules" });
  }
});

// GET /users/:id/permissions - Get user permissions
router.get("/users/:id/permissions", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const permissions = await storage.getAdminModulePermissions(userId);
    res.json(permissions);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    res.status(500).json({ message: "Failed to fetch user permissions" });
  }
});

// POST /users/:id/permissions - Update user permissions
router.post("/users/:id/permissions", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { permissions } = req.body;

    // Delete existing permissions
    await db
      .delete(schema.adminModulePermissions)
      .where(eq(schema.adminModulePermissions.adminUserId, userId));

    // Insert new permissions
    const success = await storage.updateUserPermissions(userId, permissions);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to update permissions" });
    }

    res.json({ message: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({ message: "Failed to update permissions" });
  }
});

// PATCH /users/:id/role - Update user role
router.patch("/users/:id/role", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Cannot change your own role
    if (userId === req.session.adminUserId) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    await storage.updateAdminUser(userId, { role });
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
});

// PATCH /users/:id/password - Update user password (route dédiée)
router.patch("/users/:id/password", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    await storage.updateAdminUser(userId, { password: hashedPassword });
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

export default router;
