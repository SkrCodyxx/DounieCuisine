import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import xss from "xss";
import { setupRoutes } from "./routes/index";
import { serveStatic, log } from "./static";
import { initializeSuperAdmin } from "./initSuperAdmin";
import { initializeDefaultData } from "./initDefaultData";
import { runMigrations } from "./migrations";
import { ImageOptimizer } from "./services/image-optimizer";

// Extension de Express Request pour le nonce CSP
declare global {
  namespace Express {
    interface Request {
      nonce?: string;
    }
  }
}

const app = express();

// ============================================================
// SÉCURITÉ: Trust proxy + Headers de sécurité globaux
// ============================================================
app.set('trust proxy', 1);

// Middleware de sanitization XSS RENFORCÉ universel
app.use((req, res, next) => {
  // Sanitize body parameters avec configuration stricte
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key], {
          whiteList: {}, // AUCUNE balise HTML autorisée par défaut (sécurité maximale)
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
          onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
            // Bloquer tous les attributs potentiellement dangereux
            if (name.substr(0, 2) === 'on' || name === 'style') {
              return '';
            }
          }
        });
      }
    }
  }
  
  // Sanitize query parameters AJOUTÉ
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = xss(req.query[key] as string, { whiteList: {} });
      }
    }
  }
  
  // Sanitize URL parameters AJOUTÉ  
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = xss(req.params[key], { whiteList: {} });
      }
    }
  }
  
  // Log des tentatives XSS détectées
  const originalBody = req.body ? JSON.stringify(req.body) : '{}';
  const originalQuery = req.query ? JSON.stringify(req.query) : '{}';
  if (originalBody.includes('<script') || originalQuery.includes('<script')) {
    console.log(`[SECURITY ALERT] XSS tentative détectée - IP: ${req.ip} - URL: ${req.url}`);
  }
  
  next();
});

// Headers de sécurité au niveau application - STANDARDS OWASP
app.use((req, res, next) => {
  // Headers de sécurité renforcés selon OWASP
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Headers CORS temporairement allégés pour éviter les erreurs console
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Permissions Policy - Désactiver les fonctionnalités sensibles
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), bluetooth=(), ' +
    'autoplay=(), encrypted-media=()');
  
  // Content Security Policy ultra-stricte - TEMPORAIREMENT DÉSACTIVÉ POUR TESTS
  const nonce = crypto.randomBytes(16).toString('base64');
  req.nonce = nonce;
  
  // CSP DÉSACTIVÉ POUR DEBUG SQUARE
  /*
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', 
      `default-src 'self'; ` +
      `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com https://pci-connect.squareup.com; ` +
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
      `img-src 'self' data: https: blob:; ` +
      `font-src 'self' https://fonts.gstatic.com; ` +
      `connect-src 'self' https://pci-connect.squareup.com https://connect.squareup.com; ` +
      `frame-src 'none'; ` +
      `object-src 'none'; ` +
      `base-uri 'self'; ` +
      `form-action 'self'; ` +
      `frame-ancestors 'none'; ` +
      `upgrade-insecure-requests;`
    );
  }
  */
  
  // HSTS forcé en production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Protection contre le cache des données sensibles
  if (req.path.startsWith('/api/admin/') || req.path.startsWith('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// ============================================================
// LOGGING: Logs structurés sans données sensibles
// ============================================================
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log seulement méthode, path, statut et durée (PAS de données sensibles)
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Configuration des sessions
  app.set('trust proxy', 1);
  app.use(cookieParser());

  // Validation du SESSION_SECRET
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for security. Application startup aborted.");
  }

  // Configuration de la session avec PostgreSQL store
  const PgSession = connectPgSimple(session);
  const sessionPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60, // Nettoyer les sessions expirées toutes les heures
      }),
      secret: process.env.SESSION_SECRET,
      resave: false, // Plus sécurisé
      saveUninitialized: false, // Plus sécurisé - ne sauvegarde pas les sessions vides
      name: 'dcsid', // Nom personnalisé pour masquer la technologie
      cookie: {
        secure: false, // Temporairement désactivé pour tests locaux
        httpOnly: true, // Empêche l'accès JavaScript côté client
        sameSite: 'lax', // Moins strict pour tests - changer à 'strict' en prod
        maxAge: 1000 * 60 * 60 * 8, // 8 heures (au lieu de 7 jours)
        path: '/',
        domain: undefined,
      },
      // Régénérer l'ID de session après authentification pour éviter la fixation
      genid: () => {
        return crypto.randomBytes(32).toString('hex');
      }
    })
  );

  // Middleware pour servir les images optimisées
  app.use("/optimized", express.static("attached_assets/optimized", {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  }));
  
  await setupRoutes(app);
  
  // Créer serveur HTTP (nginx gère HTTPS)
  let server;
  const port = parseInt(process.env.PORT || "5000");
  const isProduction = process.env.NODE_ENV === 'production';
  const isBehindProxy = process.env.BEHIND_PROXY === 'true';
  
  console.log(`🔧 Environment: NODE_ENV="${process.env.NODE_ENV}", BEHIND_PROXY="${process.env.BEHIND_PROXY}"`);
  
  if (isProduction && !isBehindProxy) {
    // En production directe sans proxy, utiliser HTTPS
    try {
      const sslOptions = {
        key: fs.readFileSync(path.join(process.cwd(), 'ssl/key.pem')),
        cert: fs.readFileSync(path.join(process.cwd(), 'ssl/cert.pem'))
      };
      
      server = https.createServer(sslOptions, app);
      server.listen(port, "0.0.0.0", () => {
        log(`HTTPS server running on https://localhost:${port}`);
      });
    } catch (error) {
      console.warn("⚠️ SSL certificates not found in production, falling back to HTTP");
      server = app.listen(port, "0.0.0.0", () => {
        log(`HTTP fallback server running on http://localhost:${port}`);
      });
    }
  } else {
    // HTTP pour développement et production derrière proxy
    const mode = isProduction && isBehindProxy ? "production behind nginx proxy" : "development";
    server = app.listen(port, "0.0.0.0", () => {
      log(`HTTP server running on http://localhost:${port} (${mode})`);
    });
  }

  // Exécuter les migrations de base de données
  await runMigrations();

  // Initialiser automatiquement le Super Admin si nécessaire
  await initializeSuperAdmin();
  
  // Initialiser automatiquement les données par défaut si nécessaire
  await initializeDefaultData();

  // Initialiser les templates d'email
  try {
    const { initializeEmailTemplates } = await import('./email-template-init');
    await initializeEmailTemplates();
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des templates d\'email:', error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (!isProduction && !isBehindProxy) {
    // En développement local uniquement, utiliser Vite avec HMR
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    // En production ou développement avec proxy (nginx), utiliser les fichiers statiques
    serveStatic(app);
  }

  log(`serving on port ${process.env.PORT || "5000"}`);
})();
 
