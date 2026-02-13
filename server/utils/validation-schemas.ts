/**
 * VALIDATION SCHEMAS UNIVERSELS
 * Centralisation de toutes les validations Zod pour consistency
 */

import { z } from "zod";

// ============================================================
// SCHEMAS DE BASE RÉUTILISABLES
// ============================================================

export const emailSchema = z.string().email("Email invalide").max(100);
export const passwordSchema = z.string().min(6, "Mot de passe trop court (min 6 caractères)").max(255);
export const usernameSchema = z.string().min(3, "Nom d'utilisateur trop court (min 3 caractères)").max(50);
export const phoneSchema = z.string().min(10, "Numéro de téléphone invalide").max(20);

// Schema pour les contenus riches (avec HTML autorisé)
export const richTextSchema = z.string().max(10000, "Contenu trop long");

// Schema pour les textes simples (sans HTML)
export const simpleTextSchema = z.string().max(1000, "Texte trop long");

// Schema pour les URLs
export const urlSchema = z.string().url("URL invalide").max(500);

// Schema pour les prix
export const priceSchema = z.number().min(0, "Prix invalide").max(99999.99);

// ============================================================
// SCHEMAS ADMIN
// ============================================================

export const adminUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["admin", "super_admin"]).default("admin"),
  active: z.number().min(0).max(1).default(1)
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis")
});

// ============================================================
// SCHEMAS CONTENU
// ============================================================

export const dishSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  description: richTextSchema.optional(),
  price: priceSchema,
  category_id: z.number().int().positive(),
  dietary_tags: z.array(z.string()).optional(),
  image_url: urlSchema.optional(),
  available: z.boolean().default(true)
});

export const eventSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  description: richTextSchema,
  activity_date: z.string().datetime("Date invalide"),
  location: z.string().max(200).optional(),
  max_participants: z.number().int().positive().optional(),
  price_per_person: priceSchema.optional(),
  status: z.enum(["draft", "upcoming", "ongoing", "completed", "cancelled"]).default("upcoming")
});

export const contactSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(1, "Sujet requis").max(200),
  message: z.string().min(10, "Message trop court (min 10 caractères)").max(2000)
});

// ============================================================
// SCHEMAS CATERING
// ============================================================

export const cateringQuoteSchema = z.object({
  client_name: z.string().min(1, "Nom client requis").max(100),
  client_email: emailSchema,
  client_phone: phoneSchema,
  event_date: z.string().datetime("Date invalide"),
  event_type: z.string().max(100),
  guest_count: z.number().int().positive().max(1000),
  budget_range: z.string().max(50),
  special_requests: richTextSchema.optional(),
  delivery_address: z.string().max(500)
});

// ============================================================
// SCHEMAS SETTINGS
// ============================================================

export const siteInfoSchema = z.object({
  site_name: z.string().min(1, "Nom du site requis").max(100),
  tagline: z.string().max(200).optional(),
  description: richTextSchema.optional(),
  address: z.string().max(500).optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  opening_hours: z.string().max(1000).optional(),
  social_facebook: urlSchema.optional(),
  social_instagram: urlSchema.optional(),
  social_twitter: urlSchema.optional()
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  subject: z.string().min(1, "Sujet requis").max(200),
  body: richTextSchema,
  template_type: z.string().max(50),
  is_active: z.boolean().default(true)
});

// ============================================================
// UTILITAIRES DE VALIDATION
// ============================================================

/**
 * Middleware de validation Zod générique
 */
export function validateSchema(schema: z.ZodSchema<any>) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Données invalides",
          errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      // Remplacer req.body par les données validées
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Erreur de validation"
      });
    }
  };
}

/**
 * Validation des paramètres d'URL
 */
export function validateParams(schema: z.ZodSchema<any>) {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Paramètres invalides",
          errors: result.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      req.params = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Erreur de validation"
      });
    }
  };
}

// Schema pour validation des IDs
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID invalide").transform(Number)
});

export default {
  // Schemas de base
  emailSchema,
  passwordSchema,
  usernameSchema,
  phoneSchema,
  richTextSchema,
  simpleTextSchema,
  urlSchema,
  priceSchema,
  
  // Schemas admin
  adminUserSchema,
  adminLoginSchema,
  
  // Schemas contenu
  dishSchema,
  eventSchema,
  contactSchema,
  
  // Schemas catering
  cateringQuoteSchema,
  
  // Schemas settings
  siteInfoSchema,
  emailTemplateSchema,
  
  // Utilitaires
  validateSchema,
  validateParams,
  idParamSchema
};