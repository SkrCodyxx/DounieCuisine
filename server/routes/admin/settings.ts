/**
 * ROUTES ADMIN - SETTINGS
 * Site info, delivery zones  
 */

import { Router, Request, Response } from "express";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";
import { db } from "../../db";
import { squareSettings } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import xss from "xss";

// Fonction de sanitization explicite pour les settings
const sanitizeSettings = (data: any) => {
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = xss(value);
      }
    }
    return sanitized;
  }
  return data;
};

const router = Router();

// ============================================================
// SITE INFO
// ============================================================

// GET /settings - Get site info
router.get("/settings", requireAuth, requirePermission('settings', 'view'), async (req: Request, res: Response) => {
  try {
    const siteInfo = await storage.getSiteInfo();
    res.json(siteInfo);
  } catch (error) {
    console.error("Error fetching site info:", error);
    res.status(500).json({ message: "Failed to fetch site info" });
  }
});

// PUT /settings - Update site info avec sanitization renforcée
router.put("/settings", requireAuth, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
  try {
    // Sanitization explicite des données sensibles
    const sanitizedData = sanitizeSettings(req.body);
    console.log("[SECURITY] Settings data sanitized:", Object.keys(sanitizedData));
    
    const siteInfo = await storage.updateSiteInfo(sanitizedData);
    res.json(siteInfo);
  } catch (error) {
    console.error("Error updating site info:", error);
    res.status(500).json({ message: "Failed to update site info" });
  }
});

// POST /replace - Replace entire site info (alias for PUT)
router.post("/replace", requireAuth, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
  try {
    const { keepCategories, ...siteInfoData } = req.body;
    const updated = await storage.updateSiteInfo(siteInfoData);
    res.json(updated);
  } catch (error) {
    console.error("Error replacing site info:", error);
    res.status(500).json({ message: "Failed to replace site info" });
  }
});

// ============================================================
// SQUARE SETTINGS
// ============================================================

// GET /square-settings - Get all Square configurations
router.get("/square-settings", requireAuth, requirePermission('settings', 'view'), async (req: Request, res: Response) => {
  try {
    const settings = await db
      .select()
      .from(squareSettings)
      .orderBy(squareSettings.environment);
    
    // Masquer les clés secrètes
    const sanitized = settings.map(setting => ({
      id: setting.id,
      environment: setting.environment,
      applicationId: setting.applicationId,
      locationId: setting.locationId,
      isActive: setting.isActive,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      // Ne pas exposer accessToken ni webhookSecret
      hasAccessToken: !!setting.accessToken,
      hasWebhookSecret: !!setting.webhookSecret
    }));
    
    res.json(sanitized);
  } catch (error) {
    console.error("Error fetching Square settings:", error);
    res.status(500).json({ message: "Failed to fetch Square settings" });
  }
});

// POST /square-settings - Create or update Square configuration
router.post("/square-settings", requireAuth, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
  try {
    const { environment, applicationId, locationId, accessToken, webhookSecret } = req.body;
    
    if (!environment || !applicationId || !locationId || !accessToken) {
      return res.status(400).json({ 
        message: "environment, applicationId, locationId et accessToken sont requis" 
      });
    }
    
    // Vérifier si la config existe déjà
    const existing = await db
      .select()
      .from(squareSettings)
      .where(eq(squareSettings.environment, environment))
      .limit(1);
    
    if (existing.length > 0) {
      // Mettre à jour
      const updated = await db
        .update(squareSettings)
        .set({
          applicationId,
          locationId,
          accessToken,
          webhookSecret,
          updatedAt: new Date()
        })
        .where(eq(squareSettings.environment, environment))
        .returning();
      
      res.json({ message: "Configuration Square mise à jour", id: updated[0].id });
    } else {
      // Créer nouvelle config
      const created = await db
        .insert(squareSettings)
        .values({
          environment,
          applicationId,
          locationId,
          accessToken,
          webhookSecret,
          isActive: false
        })
        .returning();
      
      res.json({ message: "Configuration Square créée", id: created[0].id });
    }
  } catch (error) {
    console.error("Error saving Square settings:", error);
    res.status(500).json({ message: "Failed to save Square settings" });
  }
});

// POST /square-settings/activate - Switch active environment
router.post("/square-settings/activate", requireAuth, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
  try {
    const { environment } = req.body;
    
    if (!environment || !['sandbox', 'production'].includes(environment)) {
      return res.status(400).json({ 
        message: "environment doit être 'sandbox' ou 'production'" 
      });
    }
    
    // Désactiver toutes les configs
    await db
      .update(squareSettings)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Activer la config demandée
    const activated = await db
      .update(squareSettings)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(squareSettings.environment, environment))
      .returning();
    
    if (activated.length === 0) {
      return res.status(404).json({ 
        message: `Configuration ${environment} non trouvée` 
      });
    }
    
    res.json({ 
      message: `Mode ${environment} activé`,
      activeEnvironment: environment 
    });
  } catch (error) {
    console.error("Error activating Square environment:", error);
    res.status(500).json({ message: "Failed to activate Square environment" });
  }
});

// DELETE /square-settings/:environment - Delete Square configuration
router.delete("/square-settings/:environment", requireAuth, requirePermission('settings', 'delete'), async (req: Request, res: Response) => {
  try {
    const { environment } = req.params;
    
    const deleted = await db
      .delete(squareSettings)
      .where(eq(squareSettings.environment, environment))
      .returning();
    
    if (deleted.length === 0) {
      return res.status(404).json({ 
        message: "Configuration non trouvée" 
      });
    }
    
    res.json({ message: `Configuration ${environment} supprimée` });
  } catch (error) {
    console.error("Error deleting Square settings:", error);
    res.status(500).json({ message: "Failed to delete Square settings" });
  }
});

export default router;