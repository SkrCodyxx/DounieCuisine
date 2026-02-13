/**
 * UTILITAIRES PARTAGÉS POUR ROUTES
 * Fonctions helper utilisées par plusieurs modules de routes
 */

import { z } from "zod";

// ============================================================
// DATA TRANSFORMATION
// ============================================================

/**
 * Convertit récursivement un objet camelCase en snake_case
 * Utilisé pour maintenir la compatibilité avec le client qui attend snake_case
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const snakeObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Convertir camelCase en snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      snakeObj[snakeKey] = toSnakeCase(value);
    }
    return snakeObj;
  }
  
  return obj;
}

// ============================================================
// VALIDATION & SANITIZATION
// ============================================================

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sanitized = sanitizeInput(email);
  
  if (sanitized.length > 100) return false;
  if (sanitized.includes('..')) return false;
  if (sanitized.startsWith('.') || sanitized.endsWith('.')) return false;
  
  return emailRegex.test(sanitized);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
  const sanitized = sanitizeInput(phone);
  return phoneRegex.test(sanitized) && sanitized.length <= 20;
}

// ============================================================
// GÉNÉRATION DE NUMÉROS
// ============================================================

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp.slice(-8)}${random}`;
}

// ============================================================
// SCHEMAS DE VALIDATION ADMIN
// ============================================================

export const createAdminUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format").max(100),
  password: z.string().min(8, "Password must be at least 8 characters").max(255),
  role: z.enum(["admin", "super_admin"]).optional().default("admin"),
  active: z.number().int().min(0).max(1).optional().default(1),
});

export const updateAdminUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().max(100).optional(),
  password: z.string().min(8).max(255).optional(),
  role: z.enum(["admin", "super_admin"]).optional(),
  active: z.number().int().min(0).max(1).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});
