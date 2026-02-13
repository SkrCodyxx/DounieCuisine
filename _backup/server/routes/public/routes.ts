/**
 * ROUTES PUBLIQUES SÉCURISÉES
 * Routes accessibles sans authentification (menu, events, gallery, etc.)
 */

import { Router, Request, Response } from "express";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { z } from "zod"; // AJOUTÉ pour validation universelle
import fs from "fs";
import path from "path";
import { db } from "../../db";
import { storage } from "../../storage";
import { cacheMiddleware } from "../../memory-cache";
import * as schema from "../../../shared/schema";
import { 
  insertContactMessageSchema,
  insertTestimonialSchema,
} from "../../../shared/schema";

import { sanitizeInput, validateEmail, validatePhoneNumber, toSnakeCase } from "../utils";

// MIDDLEWARE DE VALIDATION PUBLIC CRITIQUE - NOUVEAU
const publicInputValidation = (req: any, res: any, next: any) => {
  // Schema pour params publics
  const publicParamsSchema = z.object({
    id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    slug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    type: z.enum(['takeout', 'catering', 'delivery']).optional(),
    category: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional()
  });

  // Schema pour query publics
  const publicQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().min(1).max(200).optional(),
    isTakeout: z.enum(['1', '0', 'true', 'false']).optional(),
    sort: z.enum(['name', 'price', 'date', 'popular']).optional()
  }).partial();

  try {
    if (req.params && Object.keys(req.params).length > 0) {
      publicParamsSchema.parse(req.params);
    }
    if (req.query && Object.keys(req.query).length > 0) {
      publicQuerySchema.parse(req.query);
    }
    next();
  } catch (error) {
    console.error(`[PUBLIC VALIDATION ERROR] ${req.method} ${req.path}:`, error);
    res.status(400).json({ error: "Paramètres invalides", details: "Format incorrect ou non autorisé" });
  }
};

const router = Router();

// ORDRE CRITIQUE : Validation d'entrée AVANT toute logique
router.use(publicInputValidation);

// ============================================================
// MENU & DISHES SÉCURISÉS
// ============================================================

// GET /dishes - Get all dishes with variants (AVEC CACHE)
router.get("/dishes", cacheMiddleware(30 * 60), async (req: Request, res: Response) => {
  try {
    const { isTakeout } = req.query;
    
    // Utiliser getDishesWithVariants pour inclure les variants avec le bon paramètre
    const isTakeoutBoolean = isTakeout === "1" || isTakeout === "true";
    const dishes = await storage.getDishesWithVariants(isTakeoutBoolean);
    
    res.json(toSnakeCase(dishes));
  } catch (error) {
    console.error("Error fetching dishes:", error);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET /dishes/:id - Get single dish
router.get("/dishes/:id", async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    
    const [dish] = await db
      .select()
      .from(schema.dishes)
      .where(eq(schema.dishes.id, dishId))
      .limit(1);

    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Get variants separately
    const variants = await db
      .select()
      .from(schema.dishVariantsNew)
      .where(and(
        eq(schema.dishVariantsNew.dishId, dishId),
        eq(schema.dishVariantsNew.isActive, 1)
      ))
      .orderBy(schema.dishVariantsNew.displayOrder);

    res.json(toSnakeCase({ ...dish, variants }));
  } catch (error) {
    console.error("Error fetching dish:", error);
    res.status(500).json({ message: "Failed to fetch dish" });
  }
});

// GET /dishes/:id/variants - Get dish variants
router.get("/dishes/:id/variants", async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    
    // Utiliser le storage layer au lieu de requêtes directes
    const variants = await storage.getDishVariants(dishId);

    res.json(toSnakeCase(variants));
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ message: "Failed to fetch variants" });
  }
});

// GET /dishes/:id/sides - Get sides for a specific dish
router.get("/dishes/:id/sides", async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    
    // Utiliser le storage layer pour récupérer les accompagnements du plat
    const sides = await storage.getDishSides(dishId);
    
    res.json(toSnakeCase(sides));
  } catch (error) {
    console.error("Error fetching sides:", error);
    res.status(500).json({ message: "Failed to fetch sides" });
  }
});
router.get("/menu-sections", async (req: Request, res: Response) => {
  try {
    const sections = await storage.getMenuSections();
    res.json(toSnakeCase(sections));
  } catch (error) {
    console.error("Error fetching menu sections:", error);
    res.status(500).json({ message: "Failed to fetch menu sections" });
  }
});

// GET /menu/categories - Get menu categories
router.get("/menu/categories", async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(schema.dishCategories)
      .where(eq(schema.dishCategories.isActive, 1))
      .orderBy(schema.dishCategories.displayOrder, schema.dishCategories.name);
    res.json(toSnakeCase(categories));
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    res.status(500).json({ message: "Failed to fetch menu categories" });
  }
});

// GET /menu-categories - Alias pour compatibilité (avec tiret)
router.get("/menu-categories", async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(schema.dishCategories)
      .where(eq(schema.dishCategories.isActive, 1))
      .orderBy(schema.dishCategories.displayOrder, schema.dishCategories.name);
    res.json(toSnakeCase(categories));
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    res.status(500).json({ message: "Failed to fetch menu categories" });
  }
});

// ============================================================
// EVENTS
// ============================================================

// GET /events - Get all events
router.get("/events", cacheMiddleware('events'), async (req: Request, res: Response) => {
  try {
    const events = await db.query.events.findMany({
      where: sql`${schema.events.activityDate} >= CURRENT_DATE`,
      orderBy: [asc(schema.events.activityDate)],
    });

    res.json(toSnakeCase(events));
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// GET /events/feed - Get events feed
router.get("/events/feed", cacheMiddleware('events-feed'), async (req: Request, res: Response) => {
  try {
    const events = await db.query.events.findMany({
      where: sql`1=1`,
      orderBy: [desc(schema.events.activityDate)],
      limit: 10,
    });

    res.json(toSnakeCase(events));
  } catch (error) {
    console.error("Error fetching events feed:", error);
    res.status(500).json({ message: "Failed to fetch events feed" });
  }
});

// GET /events/:id - Get single event
router.get("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const event = await db.query.events.findFirst({
      where: eq(schema.events.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(toSnakeCase(event));
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// ============================================================
// GALLERY
// ============================================================

// GET /gallery - Get gallery photos
router.get("/gallery", cacheMiddleware('gallery'), async (req: Request, res: Response) => {
  try {
    const photos = await storage.getGalleryPhotos();
    res.json(toSnakeCase(photos));
  } catch (error) {
    console.error("Error fetching gallery:", error);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

// GET /gallery-albums - Get gallery albums
router.get("/gallery-albums", cacheMiddleware('gallery-albums'), async (req: Request, res: Response) => {
  try {
    const albums = await db
      .select({
        id: schema.galleryAlbums.id,
        title: schema.galleryAlbums.title,
        description: schema.galleryAlbums.description,
        eventDate: schema.galleryAlbums.eventDate,
        location: schema.galleryAlbums.location,
        coverImageId: schema.galleryAlbums.coverImageId,
        category: schema.galleryAlbums.category,
        displayOrder: schema.galleryAlbums.displayOrder,
        isActive: schema.galleryAlbums.isActive,
        isFeatured: schema.galleryAlbums.isFeatured,
        createdAt: schema.galleryAlbums.createdAt,
        photoCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${schema.galleryPhotos} 
          WHERE ${schema.galleryPhotos.albumId} = ${schema.galleryAlbums.id} 
          AND ${schema.galleryPhotos.isActive} = 1
        )`,
      })
      .from(schema.galleryAlbums)
      .where(eq(schema.galleryAlbums.isActive, 1))
      .orderBy(desc(schema.galleryAlbums.isFeatured), schema.galleryAlbums.displayOrder);

    res.json(toSnakeCase(albums));
  } catch (error) {
    console.error("Error fetching albums:", error);
    res.status(500).json({ message: "Failed to fetch albums" });
  }
});

// GET /gallery-albums/:id - Get album with photos
router.get("/gallery-albums/:id", async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    
    // Get album
    const [album] = await db
      .select()
      .from(schema.galleryAlbums)
      .where(eq(schema.galleryAlbums.id, albumId))
      .limit(1);

    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    // Get photos for this album
    const photos = await db
      .select()
      .from(schema.galleryPhotos)
      .where(and(
        eq(schema.galleryPhotos.albumId, albumId),
        eq(schema.galleryPhotos.isActive, 1)
      ))
      .orderBy(schema.galleryPhotos.displayOrder);

    res.json(toSnakeCase({ ...album, photos }));
  } catch (error) {
    console.error("Error fetching album:", error);
    res.status(500).json({ message: "Failed to fetch album" });
  }
});

// ============================================================
// HERO SLIDES
// ============================================================

// GET /hero-slides - Get hero slides
router.get("/hero-slides", cacheMiddleware('hero-slides'), async (req: Request, res: Response) => {
  try {
    const slides = await storage.getHeroSlides();
    res.json(toSnakeCase(slides));
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    res.status(500).json({ message: "Failed to fetch hero slides" });
  }
});

// ============================================================
// TESTIMONIALS
// ============================================================

// GET /testimonials - Get testimonials
router.get("/testimonials", cacheMiddleware('testimonials'), async (req: Request, res: Response) => {
  try {
    const testimonials = await storage.getTestimonials();
    res.json(toSnakeCase(testimonials));
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
});

// POST /testimonials - Submit testimonial
router.post("/testimonials", async (req: Request, res: Response) => {
  try {
    const validatedData = insertTestimonialSchema.parse(req.body);
    
    // Normaliser le nom du client
    const clientName = validatedData.clientName || validatedData.name;
    
    const testimonial = await storage.createTestimonial({
      ...validatedData,
      clientName,
      approved: 0, // Requires admin approval
    });

    res.status(201).json({
      message: "Testimonial submitted successfully. It will be reviewed before publication.",
      testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: "Données invalides", details: error.errors });
    }
    res.status(500).json({ message: "Failed to submit testimonial" });
  }
});

// ============================================================
// SITE INFO & LEGAL
// ============================================================

// GET /site-info - Get site information
router.get("/site-info", cacheMiddleware('site-info'), async (req: Request, res: Response) => {
  try {
    const siteInfo = await storage.getSiteInfo();
    res.json(toSnakeCase(siteInfo));
  } catch (error) {
    console.error("Error fetching site info:", error);
    res.status(500).json({ message: "Failed to fetch site info" });
  }
});

// GET /legal-pages - Get legal pages
router.get("/legal-pages", async (req: Request, res: Response) => {
  try {
    const pages = await storage.getLegalPages();
    res.json(toSnakeCase(pages));
  } catch (error) {
    console.error("Error fetching legal pages:", error);
    res.status(500).json({ message: "Failed to fetch legal pages" });
  }
});

// GET /legal-pages/:slug - Get legal page by slug
router.get("/legal-pages/:slug", async (req: Request, res: Response) => {
  try {
    const page = await storage.getLegalPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json(toSnakeCase(page));
  } catch (error) {
    console.error("Error fetching legal page:", error);
    res.status(500).json({ message: "Failed to fetch legal page" });
  }
});

// ============================================================
// CONTACT
// ============================================================

// POST /contact - Submit contact message
router.post("/contact", async (req: Request, res: Response) => {
  try {
    // Ajouter inquiryType par défaut si manquant
    const requestBody = {
      ...req.body,
      inquiryType: req.body.inquiryType || "general"
    };
    const validatedData = insertContactMessageSchema.parse(requestBody);
    
    let { name, email, phone, subject, message } = validatedData;

    // Sanitize inputs
    name = sanitizeInput(name);
    email = sanitizeInput(email);
    phone = phone ? sanitizeInput(phone) : null;
    subject = subject ? sanitizeInput(subject) : null;
    message = sanitizeInput(message);

    // Validate
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (phone && !validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const contactMessage = await storage.createContactMessage({
      name,
      email,
      phone,
      subject,
      message,
      status: "new",
      inquiryType: "general",
    });


    res.status(201).json({
      message: "Message sent successfully",
      contactMessage,
    });
  } catch (error) {
    console.error("Error creating contact message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ============================================================
// CATERING MENU
// ============================================================

// GET /catering-menu - Get complete catering menu (public)
router.get("/catering-menu", cacheMiddleware('catering-menu'), async (req: Request, res: Response) => {
  try {
    const menu = await storage.getCompleteCateringMenu();
    
    // Transform camelCase to snake_case for client compatibility
    const transformedMenu = menu.map(category => ({
      id: category.id,
      name_fr: category.nameFr,
      name_en: category.nameEn,
      description_fr: category.descriptionFr,
      description_en: category.descriptionEn,
      display_order: category.displayOrder,
      is_active: category.isActive,
      items: category.items.map(item => ({
        id: item.id,
        category_id: item.categoryId,
        name_fr: item.nameFr,
        name_en: item.nameEn,
        description_fr: item.descriptionFr,
        description_en: item.descriptionEn,
        image_id: item.imageId,
        display_order: item.displayOrder,
        is_active: item.isActive,
        prices: item.prices.map(price => ({
          id: price.id,
          size_label_fr: price.sizeLabelFr,
          size_label_en: price.sizeLabelEn,
          price: parseFloat(price.price),
          is_default: price.isDefault,
          display_order: price.displayOrder,
        }))
      }))
    }));
    
    res.json(transformedMenu);
  } catch (error) {
    console.error("Error fetching catering menu:", error);
    res.status(500).json({ message: "Failed to fetch catering menu" });
  }
});

// POST /catering-quotes - Submit catering quote request (public)
router.post("/catering-quotes", async (req: Request, res: Response) => {
  try {
    const quoteData = schema.insertCateringQuoteSchema.parse(req.body);

    const [newQuote] = await db
      .insert(schema.cateringQuotes)
      .values({
        eventType: quoteData.eventType,
        guestCount: quoteData.guestCount,
        eventDate: quoteData.eventDate ? new Date(quoteData.eventDate) : null,
        eventTime: quoteData.eventTime || null,
        location: quoteData.location || null,
        budgetRange: quoteData.budgetRange || null,
        customerName: quoteData.customerName,
        customerEmail: quoteData.customerEmail,
        customerPhone: quoteData.customerPhone,
        message: quoteData.message || null,
        selectedItems: quoteData.selectedItems || null,
        estimatedPrice: quoteData.estimatedPrice ? String(quoteData.estimatedPrice) : null,
        status: 'pending',
      })
      .returning();

    res.status(201).json({
      message: "Quote request submitted successfully",
      quote: newQuote,
    });
  } catch (error) {
    console.error("Error creating catering quote:", error);
    res.status(500).json({ message: "Failed to submit quote request" });
  }
});

// ============================================================
// MEDIA ASSETS
// ============================================================

// GET /media/:id - Get media asset by ID (serves images)
router.get("/media/:id", async (req: Request, res: Response) => {
  try {
    const mediaId = parseInt(req.params.id);
    
    if (isNaN(mediaId)) {
      return res.status(400).json({ message: "Invalid media ID" });
    }

    const [media] = await db
      .select()
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.id, mediaId))
      .limit(1);

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Si c'est un lien externe, rediriger
    if (media.externalUrl) {
      return res.redirect(media.externalUrl);
    }

    // Si c'est un fichier sur disque (commence par /uploads/)
    if (media.data && media.data.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'attached_assets', media.data);
      
      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Détecter le type MIME selon l'extension si pas défini
      let mimeType = media.mimeType;
      if (!mimeType) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
          case '.mp4':
            mimeType = 'video/mp4';
            break;
          case '.webm':
            mimeType = 'video/webm';
            break;
          case '.mov':
            mimeType = 'video/quicktime';
            break;
          case '.avi':
            mimeType = 'video/x-msvideo';
            break;
          case '.jpg':
          case '.jpeg':
            mimeType = 'image/jpeg';
            break;
          case '.png':
            mimeType = 'image/png';
            break;
          case '.gif':
            mimeType = 'image/gif';
            break;
          default:
            mimeType = 'application/octet-stream';
        }
      }

      // Headers spéciaux pour les vidéos
      if (mimeType.startsWith('video/')) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Headers pour images
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      return res.sendFile(filePath);
    }

    // Servir l'image directement depuis le base64
    if (media.data) {
      // Extraire le base64 (enlever le préfixe data:image/...;base64, si présent)
      const base64Data = media.data.includes(',') 
        ? media.data.split(',')[1] 
        : media.data;
      
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Set headers pour le cache
      res.setHeader('Content-Type', media.mimeType || 'image/jpeg');
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      
      return res.send(imageBuffer);
    }

    res.status(404).json({ message: "Media data not found" });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ message: "Failed to fetch media" });
  }
});

// ============================================================
// ROUTES ADDITIONNELLES POUR COMPATIBILITÉ FRONTEND
// ============================================================

// GET /catering-categories - Alias pour compatibilité
router.get("/catering-categories", async (req: Request, res: Response) => {
  try {
    const categories = await storage.getCateringCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching catering categories:", error);
    res.status(500).json({ message: "Failed to fetch catering categories" });
  }
});

// GET /catering-items - Alias pour compatibilité
router.get("/catering-items", async (req: Request, res: Response) => {
  try {
    const items = await storage.getCateringItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching catering items:", error);
    res.status(500).json({ message: "Failed to fetch catering items" });
  }
});

// GET /gallery/:id - Photos d'un album spécifique
router.get("/gallery/:id", async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }

    const photos = await storage.getGalleryPhotos(albumId);
    res.json(photos);
  } catch (error) {
    console.error(`Error fetching photos for album ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to fetch album photos" });
  }
});

// GET /contact - Informations de contact (pour formulaire)
router.get("/contact", async (req: Request, res: Response) => {
  try {
    const siteInfoData = await storage.getSiteInfo();
    
    // S'assurer que c'est un array
    const siteInfo = Array.isArray(siteInfoData) ? siteInfoData : [];
    
    const contactInfo = {
      phone: siteInfo.find(info => info.keyName === 'phone')?.value || '',
      email: siteInfo.find(info => info.keyName === 'email')?.value || '',
      address: siteInfo.find(info => info.keyName === 'address')?.value || '',
      hours: siteInfo.find(info => info.keyName === 'hours')?.value || ''
    };
    res.json(contactInfo);
  } catch (error) {
    console.error("Error fetching contact info:", error);
    res.status(500).json({ message: "Failed to fetch contact information" });
  }
});

export default router;
