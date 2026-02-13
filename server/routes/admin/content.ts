/**
 * ROUTES ADMIN - GESTION CONTENU SÉCURISÉ
 * Gallery, hero slides, testimonials, media
 */

import { Router, Request, Response } from "express";
import { z } from "zod"; // AJOUTÉ pour validation universelle
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { validateInput } from "../../middleware/auth";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";
import { memoryCache } from "../../memory-cache";
import {
  findUnusedMedia,
  findDuplicateMedia,
  cleanupUnusedMedia,
  cleanupDuplicateMedia,
  getMediaUsageReport
} from "../../utils/media-cleanup";

// VALIDATION CRITIQUE CONTENT ADMIN - NOUVEAU
const contentValidationSchemas = {
  mediaUpload: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(1000).optional(),
    category: z.enum(['gallery', 'hero', 'testimonial', 'product', 'other']).optional()
  }),
  
  testimonialCreate: z.object({
    name: z.string().min(1).max(100),
    content: z.string().min(10).max(1000),
    rating: z.number().min(1).max(5),
    isPublic: z.boolean().default(false)
  }),
  
  galleryUpdate: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    order: z.number().min(0).max(999).optional(),
    isActive: z.boolean().optional()
  })
};

// MIDDLEWARE VALIDATION CONTENT
const validateContentInput = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      console.error(`[CONTENT VALIDATION ERROR]`, error);
      res.status(400).json({ 
        error: "Données de contenu invalides", 
        details: error instanceof z.ZodError ? error.errors : "Format incorrect" 
      });
    }
  };
};

const router = Router();

// Configuration Multer ultra-sécurisée pour uploads
const upload = multer({
  dest: "attached_assets/uploads/",
  limits: { 
    fileSize: 5 * 1024 * 1024, // Réduit à 5MB (plus sécurisé)
    files: 1, // Un seul fichier par upload
    fields: 10, // Limite le nombre de champs
    fieldNameSize: 100, // Limite la taille des noms de champs
    fieldSize: 1024, // Limite la taille des valeurs de champs
  },
  fileFilter: (req, file, cb) => {
    try {
      // Validation stricte du nom de fichier
      if (!validateInput(file.originalname, 'filename')) {
        return cb(new Error("Nom de fichier invalide ou dangereux"));
      }
      
      // Whitelist stricte des types MIME autorisés
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      // Whitelist stricte des extensions
      const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
      
      // Double vérification: MIME type ET extension
      const isValidMime = allowedMimeTypes.includes(file.mimetype);
      const isValidExt = allowedExtensions.test(file.originalname);
      
      // Vérifications supplémentaires de sécurité
      const hasDoubleExt = /\.[^.]+\.[^.]+$/.test(file.originalname); // .php.jpg
      const hasScriptExt = /\.(php|js|html|exe|bat|cmd|sh)$/i.test(file.originalname);
      
      if (!isValidMime || !isValidExt || hasDoubleExt || hasScriptExt) {
        const clientIP = req.ip || 'unknown';
        console.warn(`[SECURITY] Fichier dangereux bloqué - IP: ${clientIP} - Fichier: ${file.originalname} - MIME: ${file.mimetype}`);
        return cb(new Error("Type de fichier non autorisé"));
      }
      
      cb(null, true);
    } catch (error) {
      cb(new Error("Erreur de validation du fichier"));
    }
  },
  // Générer des noms de fichiers sécurisés et uniques
  storage: multer.diskStorage({
    destination: 'attached_assets/uploads/',
    filename: (req, file, cb) => {
      // Générer un nom de fichier totalement sécurisé
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      const sanitizedName = `img_${Date.now()}_${uniqueSuffix}${ext}`;
      cb(null, sanitizedName);
    }
  })
});

// ============================================================
// GALLERY
// ============================================================

// GET /gallery - Get all gallery photos avec validation stricte
router.get("/gallery", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    
    // Validation stricte de l'entrée utilisateur
    if (category && !validateInput(category, 'text')) {
      return res.status(400).json({ message: "Paramètre category invalide" });
    }
    
    const photos = await storage.getGalleryItems(category);
    res.json(photos);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

// GET /gallery/categories - Get gallery categories
router.get("/gallery/categories", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const categories = await storage.getGalleryCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// POST /gallery - Upload gallery photo
router.post("/gallery", requireAuth, requirePermission('content', 'create'), upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { title, description, category } = req.body;
    
    // First create media asset
    const media = await storage.createMediaAsset({
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      byteLength: req.file.size,
      data: `/uploads/${req.file.filename}`,
    });
    
    const newPhoto = await storage.createGalleryItem({
      title: title || req.file.filename,
      type: 'photo',
      mediaId: media.id,
      description,
      category: category || 'general',
      active: 1,
      featured: 0,
      displayOrder: 0,
    });

    memoryCache.clear('gallery');
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error("Error creating gallery photo:", error);
    res.status(500).json({ message: "Failed to create gallery photo" });
  }
});

// POST /upload-media - Upload media asset
router.post("/upload-media", requireAuth, requirePermission('content', 'create'), upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const media = await storage.createMediaAsset({
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      byteLength: req.file.size,
      data: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(media);
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ message: "Failed to upload media" });
  }
});

// POST /gallery/from-media - Create gallery photo from existing media
router.post("/gallery/from-media", requireAuth, requirePermission('content', 'create'), async (req: Request, res: Response) => {
  try {
    const { mediaId, title, description, category } = req.body;

    if (!mediaId) {
      return res.status(400).json({ message: "Media ID is required" });
    }

    const media = await storage.getMediaAsset(mediaId);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    const photo = await storage.createGalleryItem({
      title: title || media.filename,
      type: 'photo',
      mediaId: media.id,
      description,
      category: category || 'general',
      active: 1,
      featured: 0,
      displayOrder: 0,
    });

    memoryCache.clear('gallery');
    res.status(201).json(photo);
  } catch (error) {
    console.error("Error creating gallery from media:", error);
    res.status(500).json({ message: "Failed to create gallery photo" });
  }
});

// PATCH /gallery/:id - Update gallery photo
router.patch("/gallery/:id", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.id);
    const updated = await storage.updateGalleryItem(photoId, req.body);

    memoryCache.clear('gallery');
    res.json(updated);
  } catch (error) {
    console.error("Error updating gallery photo:", error);
    res.status(500).json({ message: "Failed to update gallery photo" });
  }
});

// DELETE /gallery/:id - Delete gallery photo
router.delete("/gallery/:id", requireAuth, requirePermission('content', 'delete'), async (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.id);
    await storage.deleteGalleryItem(photoId);

    memoryCache.clear('gallery');
    res.json({ message: "Gallery photo deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery photo:", error);
    res.status(500).json({ message: "Failed to delete gallery photo" });
  }
});

// ============================================================
// MEDIA CLEANUP
// ============================================================

// GET /media/cleanup-preview - Preview media cleanup
router.get("/media/cleanup-preview", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const [unusedMedia, duplicateMedia, report] = await Promise.all([
      findUnusedMedia(),
      findDuplicateMedia(),
      getMediaUsageReport()
    ]);

    res.json({
      unusedMedia,
      duplicateMedia,
      report,
      totalUnused: unusedMedia.length,
      totalDuplicates: duplicateMedia.length,
    });
  } catch (error) {
    console.error("Error previewing media cleanup:", error);
    res.status(500).json({ message: "Failed to preview media cleanup" });
  }
});

// POST /media/cleanup-execute - Execute media cleanup
router.post("/media/cleanup-execute", requireAuth, async (req: Request, res: Response) => {
  try {
    const { cleanupUnused, cleanupDuplicates } = req.body;

    let unusedResult: { deleted: number[]; failed: number[]; totalSizeFreed: number } = { deleted: [], failed: [], totalSizeFreed: 0 };
    let duplicateResult: { deleted: number[]; failed: number[]; totalSizeFreed: number } = { deleted: [], failed: [], totalSizeFreed: 0 };

    if (cleanupUnused) {
      unusedResult = await cleanupUnusedMedia();
    }

    if (cleanupDuplicates) {
      duplicateResult = await cleanupDuplicateMedia();
    }
    
    const results = {
      unusedCleaned: unusedResult.deleted.length,
      duplicatesCleaned: duplicateResult.deleted.length,
    };

    res.json({
      success: true,
      ...results,
      message: `Cleaned ${results.unusedCleaned} unused and ${results.duplicatesCleaned} duplicate media files`,
    });
  } catch (error) {
    console.error("Error executing media cleanup:", error);
    res.status(500).json({ message: "Failed to execute media cleanup" });
  }
});

// ============================================================
// HERO SLIDES
// ============================================================

// GET /hero-slides - Get all hero slides (including inactive for admin)
router.get("/hero-slides", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const slides = await storage.getAllHeroSlides();
    res.json(slides);
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    res.status(500).json({ message: "Failed to fetch hero slides" });
  }
});

// POST /hero-slides - Create hero slide
router.post("/hero-slides", requireAuth, requirePermission('content', 'create'), async (req: Request, res: Response) => {
  try {
    const slide = await storage.createHeroSlide(req.body);
    memoryCache.clear('hero-slides');
    res.status(201).json(slide);
  } catch (error) {
    console.error("Error creating hero slide:", error);
    res.status(500).json({ message: "Failed to create hero slide" });
  }
});

// PATCH /hero-slides/:id - Update hero slide
router.patch("/hero-slides/:id", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const slideId = parseInt(req.params.id);
    const updated = await storage.updateHeroSlide(slideId, req.body);
    
    memoryCache.clear('hero-slides');
    res.json(updated);
  } catch (error) {
    console.error("Error updating hero slide:", error);
    res.status(500).json({ message: "Failed to update hero slide" });
  }
});

// DELETE /hero-slides/:id - Delete hero slide
router.delete("/hero-slides/:id", requireAuth, requirePermission('content', 'delete'), async (req: Request, res: Response) => {
  try {
    const slideId = parseInt(req.params.id);
    await storage.deleteHeroSlide(slideId);
    
    memoryCache.clear('hero-slides');
    res.json({ message: "Hero slide deleted successfully" });
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    res.status(500).json({ message: "Failed to delete hero slide" });
  }
});

// ============================================================
// GALLERY ALBUMS - Routes déléguées à /api/gallery-albums
// Les opérations d'albums sont gérées par server/routes/galleryAlbums.ts
// ============================================================

// GET /gallery-albums - Redirect to main gallery-albums route
router.get("/gallery-albums", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const albums = await db.select().from(schema.galleryAlbums).orderBy(desc(schema.galleryAlbums.createdAt));
    res.json(albums);
  } catch (error) {
    console.error("Error fetching gallery albums:", error);
    res.status(500).json({ message: "Failed to fetch gallery albums" });
  }
});

// GET /gallery-albums/:id - Get gallery album by ID with photos
router.get("/gallery-albums/:id", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    const [album] = await db.select().from(schema.galleryAlbums).where(eq(schema.galleryAlbums.id, albumId)).limit(1);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    res.json(album);
  } catch (error) {
    console.error("Error fetching gallery album:", error);
    res.status(500).json({ message: "Failed to fetch gallery album" });
  }
});

// POST /gallery-albums - Create new gallery album
router.post("/gallery-albums", requireAuth, requirePermission('content', 'create'), async (req: Request, res: Response) => {
  try {
    const { title, description, category } = req.body;
    const [album] = await db.insert(schema.galleryAlbums).values({ 
      title: title || 'Nouvel Album',
      description,
      category: category || 'événements'
    }).returning();
    memoryCache.clear('gallery-albums');
    res.status(201).json(album);
  } catch (error) {
    console.error("Error creating gallery album:", error);
    res.status(500).json({ message: "Failed to create gallery album" });
  }
});

// PUT /gallery-albums/:id - Update gallery album
router.put("/gallery-albums/:id", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    const { title, description } = req.body;
    const [album] = await db.update(schema.galleryAlbums)
      .set({ title, description, updatedAt: new Date() })
      .where(eq(schema.galleryAlbums.id, albumId))
      .returning();
    memoryCache.clear('gallery-albums');
    res.json(album);
  } catch (error) {
    console.error("Error updating gallery album:", error);
    res.status(500).json({ message: "Failed to update gallery album" });
  }
});

// DELETE /gallery-albums/:id - Delete gallery album
router.delete("/gallery-albums/:id", requireAuth, requirePermission('content', 'delete'), async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    await db.delete(schema.galleryAlbums).where(eq(schema.galleryAlbums.id, albumId));
    memoryCache.clear('gallery-albums');
    res.json({ message: "Gallery album deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery album:", error);
    res.status(500).json({ message: "Failed to delete gallery album" });
  }
});

// POST /gallery-albums/:id/photos - Add photo to album
router.post("/gallery-albums/:id/photos", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.id);
    const { photoId, mediaId } = req.body;
    await db.insert(schema.galleryPhotos).values({ 
      albumId, 
      mediaId: mediaId || photoId,
      isActive: 1
    });
    memoryCache.clear('gallery-albums');
    res.json({ message: "Photo added to album successfully" });
  } catch (error) {
    console.error("Error adding photo to album:", error);
    res.status(500).json({ message: "Failed to add photo to album" });
  }
});

// DELETE /gallery-albums/:albumId/photos/:photoId - Remove photo from album
router.delete("/gallery-albums/:albumId/photos/:photoId", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const albumId = parseInt(req.params.albumId);
    const photoId = parseInt(req.params.photoId);
    await db.delete(schema.galleryPhotos)
      .where(and(
        eq(schema.galleryPhotos.albumId, albumId),
        eq(schema.galleryPhotos.id, photoId)
      ));
    memoryCache.clear('gallery-albums');
    res.json({ message: "Photo removed from album successfully" });
  } catch (error) {
    console.error("Error removing photo from album:", error);
    res.status(500).json({ message: "Failed to remove photo from album" });
  }
});

// ============================================================
// HERO SLIDES
// ============================================================

// GET /hero-slides - Get all hero slides
router.get("/hero-slides", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const slides = await storage.getHeroSlides();
    res.json(slides);
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    res.status(500).json({ message: "Failed to fetch hero slides" });
  }
});

// ============================================================
// MEDIA
// ============================================================

// GET /media - Get all media assets
router.get("/media", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const { db } = await import("../../db");
    const schema = await import("../../../shared/schema");
    const media = await db.select().from(schema.mediaAssets);
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ message: "Failed to fetch media" });
  }
});

export default router;
