/**
 * ROUTES ADMIN - CACHE
 * Gestion du cache mémoire
 */

import { Router, Request, Response } from "express";
import { memoryCache } from "../../memory-cache";
import { requireAuth } from "../../middleware/auth";
import { z } from "zod";
import xss from "xss";

// Schémas de validation pour la sécurité
const cacheKeySchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, "Clé invalide")
});

const router = Router();

// GET /cache/stats - Get cache statistics
router.get("/cache/stats", requireAuth, (req: Request, res: Response) => {
  const stats = memoryCache.getStats();
  res.json(stats);
});

// DELETE /cache - Clear all cache
router.delete("/cache", requireAuth, (req: Request, res: Response) => {
  memoryCache.clearAll();
  res.json({ message: "All cache cleared successfully" });
});

// DELETE /cache/:key - Clear specific cache key avec validation
router.delete("/cache/:key", requireAuth, (req: Request, res: Response) => {
  try {
    // Validation sécurisée de la clé
    const validation = cacheKeySchema.safeParse({ key: req.params.key });
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Clé de cache invalide",
        errors: validation.error.format() 
      });
    }
    
    const { key } = validation.data;
    // Sanitisation supplémentaire
    const sanitizedKey = xss(key);
    
    memoryCache.clear(sanitizedKey);
    res.json({ message: `Cache key '${sanitizedKey}' cleared successfully` });
  } catch (error) {
    console.error("[SECURITY] Cache deletion error:", error);
    res.status(500).json({ message: "Erreur lors de la suppression du cache" });
  }
});

export default router;
