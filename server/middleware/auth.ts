/**
 * MIDDLEWARE D'AUTHENTIFICATION - Optimisé pour haute charge
 * Standards OWASP avec performances optimales
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";

// Cache simple pour éviter les requêtes DB répétées
const userCache = new Map<number, { user: any; expires: number }>();
const CACHE_TTL = 60000; // 1 minute

// Validation d'entrée simple et rapide
export function validateInput(input: any, type: 'email' | 'text' | 'number' | 'filename'): boolean {
  if (!input || typeof input !== 'string') return false;
  
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) && input.length <= 254;
    case 'filename':
      // Autoriser les noms de fichiers normaux avec espaces et caractères unicode
      // Bloquer seulement les caractères vraiment dangereux
      const dangerousChars = /[<>:"|?*\x00-\x1f]/;
      const pathTraversal = /\.\./;
      return !dangerousChars.test(input) && !pathTraversal.test(input) && input.length <= 255 && input.trim().length > 0;
    case 'text':
      return input.length <= 5000;
    case 'number':
      return /^\d+$/.test(input);
    default:
      return false;
  }
}

// Middleware d'authentification admin - optimisé avec cache
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.session.adminUserId;
  const now = Date.now();
  
  // Check cache first
  const cached = userCache.get(userId);
  if (cached && cached.expires > now) {
    if (cached.user?.active === 1) return next();
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getAdminUser(userId);
    
    // Update cache
    userCache.set(userId, { user, expires: now + CACHE_TTL });
    
    if (!user || user.active !== 1) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

// Middleware de permissions simplifié
export function requirePermission(moduleName: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.adminUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.session.adminUserId;
      const cached = userCache.get(userId);
      const user = cached?.user || await storage.getAdminUser(userId);
      
      if (!user || user.active !== 1) {
        return res.status(401).json({ message: "User not found or inactive" });
      }
      
      // Super admin has all rights
      if (user.role === 'super_admin') return next();
      
      // Regular admins restricted on sensitive actions
      const sensitiveModules = ['users', 'settings'];
      if (sensitiveModules.includes(moduleName) && action !== 'view') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      next();
    } catch (error) {
      console.error('Permission error:', error);
      return res.status(500).json({ message: "Permission check error" });
    }
  };
}

// ============================================================
// RATE LIMITERS - Optimisés pour 100+ utilisateurs simultanés
// ============================================================

// Login: 50 tentatives / 15 min (temporaire pour développement)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Admin API: 10000 req / 15 min (TEMPORAIRE - pour éviter le blocage SSE)
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Check: Très permissif pour /me et autres vérifications
export const authCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
});

// API publique: 10000 req / 15 min (TEMPORAIRE - pour éviter le blocage SSE)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Uploads: 30 / 15 min
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Trop d'uploads, patientez" },
});

// Formulaires publics: 20 / 15 min
export const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Trop de soumissions, ralentissez" },
});

// Nettoyage du cache périodique
setInterval(() => {
  const now = Date.now();
  userCache.forEach((value, key) => {
    if (value.expires < now) userCache.delete(key);
  });
}, 60000);
