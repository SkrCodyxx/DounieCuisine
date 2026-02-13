/**
 * ROUTES ADMIN - INDEX SÉCURISÉ
 * Point d'entrée principal pour toutes les routes d'administration
 * Importe et monte tous les sous-modules admin avec sécurité renforcée
 */

import { Router } from "express";
import { z } from "zod"; // AJOUTÉ pour validation universelle
import { requireAuth } from "../../middleware/auth";
import { 
  sanitizeAllInputs, 
  validateCriticalParams, 
  csrfProtection,
  logCriticalActions 
} from "../../middleware/security";

// MIDDLEWARE DE VALIDATION ADMIN CRITIQUE - NOUVEAU
const adminInputValidation = (req: any, res: any, next: any) => {
  // Schema universel pour validation des paramètres admin
  const adminParamsSchema = z.object({
    id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    userId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    orderId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    eventId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional()
  });

  // Schema pour req.body admin
  const adminBodySchema = z.record(z.any()).refine((data) => {
    // Taille max du body pour éviter DoS
    return JSON.stringify(data).length < 1000000; // 1MB max
  }, { message: "Request body trop volumineux" });

  try {
    if (req.params && Object.keys(req.params).length > 0) {
      adminParamsSchema.parse(req.params);
    }
    if (req.body && Object.keys(req.body).length > 0) {
      adminBodySchema.parse(req.body);
    }
    next();
  } catch (error) {
    console.error(`[ADMIN VALIDATION ERROR] ${req.method} ${req.path}:`, error);
    res.status(400).json({ error: "Données d'entrée invalides", details: "Format incorrect ou non sécurisé" });
  }
};

// Import des sous-modules admin
import authRoutes from "./auth";
import dashboardRoutes from "./dashboard";
import contentRoutes from "./content";
import usersRoutes from "./users";
import settingsRoutes from "./settings";
import ordersRoutes from "./orders";
import menuRoutes from "./menu";
import eventsRoutes from "./events";
import cacheRoutes from "./cache";
import testimonialsRoutes from "./testimonials";
import cateringRoutes from "./catering";
import deliveryRoutes from "./delivery";
import messagesRoutes from "./messages";
import exportRoutes from "./export"; // NOUVEAU - export sécurisé sans xlsx

const router = Router();

// ORDRE CRITIQUE : Validation d'entrée AVANT sécurité globale
router.use(adminInputValidation); // NOUVEAU - validation universelle admin

// Middleware de sécurité global pour toutes les routes admin  
router.use(sanitizeAllInputs);
router.use(validateCriticalParams);

// Routes d'authentification admin (pas de requireAuth - accès libre mais sécurisé)
router.use("/auth", logCriticalActions("AUTH"), authRoutes);

// Applique l'authentification ET la protection CSRF pour toutes les autres routes
router.use(requireAuth);
router.use(csrfProtection);

// Monte les sous-modules avec leurs préfixes et logging de sécurité  
router.use("/", logCriticalActions("DASHBOARD"), dashboardRoutes);
router.use("/", logCriticalActions("CONTENT"), contentRoutes);
router.use("/", logCriticalActions("USERS"), usersRoutes);
router.use("/", logCriticalActions("SETTINGS"), settingsRoutes);
router.use("/", logCriticalActions("ORDERS"), ordersRoutes);
router.use("/", logCriticalActions("MENU"), menuRoutes);
router.use("/", logCriticalActions("EVENTS"), eventsRoutes);
router.use("/", logCriticalActions("CACHE"), cacheRoutes);
router.use("/", logCriticalActions("TESTIMONIALS"), testimonialsRoutes);
router.use("/", logCriticalActions("CATERING"), cateringRoutes);
router.use("/", logCriticalActions("DELIVERY"), deliveryRoutes);
router.use("/", logCriticalActions("MESSAGES"), messagesRoutes);
router.use("/export", logCriticalActions("EXPORT"), exportRoutes); // NOUVEAU - export sécurisé

// Routes définitives pour les fonctionnalités admin
router.get("/sse", (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Envoyer un ping initial
  res.write('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n');
  
  // Maintenir la connexion avec un ping périodique RÉDUIT
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
  }, 120000); // 2 minutes au lieu de 30 secondes
  
  // Nettoyer au déconnexion
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

router.get("/notifications/unread", (req, res) => {
  res.json({ count: 0, notifications: [] });
});

router.get("/site-info", (req, res) => {
  // Retourner les infos de site de base
  res.json({
    name: "Dounie Cuisine",
    description: "Restaurant haïtien authentique",
    phone1: "450-000-0000",
    phone2: null,
    email: "info@douniecuisine.com",
    address: "Montréal, QC",
    hours: {
      monday: "11:00-22:00",
      tuesday: "11:00-22:00", 
      wednesday: "11:00-22:00",
      thursday: "11:00-22:00",
      friday: "11:00-23:00",
      saturday: "11:00-23:00",
      sunday: "12:00-21:00"
    }
  });
});

export default router;
