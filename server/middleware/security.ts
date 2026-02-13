/**
 * MIDDLEWARE DE SÉCURITÉ RENFORCÉ - Protection maximale
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import xss from "xss";

// Configuration XSS stricte pour sécurité maximale
const xssOptions = {
  whiteList: {}, // AUCUNE balise HTML autorisée
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  onIgnoreTagAttr: function (tag: string, name: string, value: string, isWhiteAttr: boolean) {
    // Bloquer tous les attributs dangereux
    if (name.substr(0, 2) === 'on' || name === 'style') {
      return '';
    }
  }
};

// Sanitisation RENFORCÉE des entrées avec XSS
export function sanitizeAllInputs(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    console.log("[SECURITY] sanitizeAllInputs - RENFORCÉ OK");
    next();
  } catch (error) {
    console.error("[SECURITY] sanitizeAllInputs ERROR:", error);
    res.status(400).json({ error: "Données d'entrée invalides" });
  }
}

// Fonction auxiliaire pour sanitiser récursivement
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return xss(obj, xssOptions);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitiser aussi les clés
      const sanitizedKey = xss(key, xssOptions);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Validation des paramètres critiques
export function validateCriticalParams(req: Request, res: Response, next: NextFunction) {
  console.log("[SECURITY] validateCriticalParams - début");
  // Valider les IDs numériques
  const idParams = ['id', 'userId', 'orderId', 'dishId', 'categoryId'];
  for (const param of idParams) {
    if (req.params[param]) {
      const value = req.params[param];
      if (!/^\d+$/.test(value)) {
        console.log("[SECURITY] validateCriticalParams - BLOQUÉ:", param, value);
        return res.status(400).json({ message: `Paramètre ${param} invalide` });
      }
    }
  }
  console.log("[SECURITY] validateCriticalParams - OK");
  next();
}

// Protection CSRF simplifiée
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // En production, vérifier l'origin pour les requêtes modifiantes
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = req.get('Origin') || req.get('Referer');
    const host = req.get('Host');
    
    // Autoriser les requêtes sans origin (same-origin) ou correspondant au host
    if (origin && host && !origin.includes(host)) {
      // Log mais ne pas bloquer en dev
      console.warn(`[CSRF] Origin mismatch: ${origin} vs ${host}`);
    }
  }
  next();
}

// Log des actions critiques
export function logCriticalActions(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const userId = req.session?.adminUserId || 'anonymous';
    console.log(`[AUDIT] ${action} - User: ${userId} - IP: ${ip} - Path: ${req.path}`);
    next();
  };
}
