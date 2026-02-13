import { Router } from "express";
import { db } from "../db";
import { galleryAlbums, galleryPhotos, mediaAssets } from "../../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

// GET /api/gallery-albums - Liste tous les albums avec leur nombre de photos
router.get("/", async (req, res) => {
  try {
    const albums = await db
      .select({
        id: galleryAlbums.id,
        title: galleryAlbums.title,
        description: galleryAlbums.description,
        eventDate: galleryAlbums.eventDate,
        location: galleryAlbums.location,
        coverImageId: galleryAlbums.coverImageId,
        category: galleryAlbums.category,
        displayOrder: galleryAlbums.displayOrder,
        isActive: galleryAlbums.isActive,
        isFeatured: galleryAlbums.isFeatured,
        createdAt: galleryAlbums.createdAt,
        updatedAt: galleryAlbums.updatedAt,
        photoCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${galleryPhotos} 
          WHERE ${galleryPhotos.albumId} = ${galleryAlbums.id} 
          AND ${galleryPhotos.isActive} = 1
        )`,
      })
      .from(galleryAlbums)
      .where(eq(galleryAlbums.isActive, 1))
      .orderBy(desc(galleryAlbums.isFeatured), galleryAlbums.displayOrder, desc(galleryAlbums.createdAt));

    res.json(albums);
  } catch (error) {
    console.error("Erreur lors de la récupération des albums:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des albums",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// GET /api/gallery-albums/:id - Récupère un album avec toutes ses photos
router.get("/:id", async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "ID d'album invalide" });
    }

    // Récupérer l'album
    const [album] = await db
      .select()
      .from(galleryAlbums)
      .where(and(
        eq(galleryAlbums.id, albumId),
        eq(galleryAlbums.isActive, 1)
      ));

    if (!album) {
      return res.status(404).json({ message: "Album non trouvé" });
    }

    // Récupérer toutes les photos de l'album
    const photos = await db
      .select({
        id: galleryPhotos.id,
        albumId: galleryPhotos.albumId,
        mediaId: galleryPhotos.mediaId,
        title: galleryPhotos.title,
        description: galleryPhotos.description,
        displayOrder: galleryPhotos.displayOrder,
        isActive: galleryPhotos.isActive,
        createdAt: galleryPhotos.createdAt,
      })
      .from(galleryPhotos)
      .where(and(
        eq(galleryPhotos.albumId, albumId),
        eq(galleryPhotos.isActive, 1)
      ))
      .orderBy(galleryPhotos.displayOrder, desc(galleryPhotos.createdAt));

    res.json({
      ...album,
      photos,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'album:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de l'album",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// POST /api/gallery-albums - Créer un nouvel album (admin uniquement)
router.post("/", async (req, res) => {
  try {
    const newAlbum = await db
      .insert(galleryAlbums)
      .values(req.body)
      .returning();

    res.status(201).json(newAlbum[0]);
  } catch (error) {
    console.error("Erreur lors de la création de l'album:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création de l'album",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// PUT /api/gallery-albums/:id - Mettre à jour un album (admin uniquement)
router.put("/:id", async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "ID d'album invalide" });
    }

    const updatedAlbum = await db
      .update(galleryAlbums)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(galleryAlbums.id, albumId))
      .returning();

    if (updatedAlbum.length === 0) {
      return res.status(404).json({ message: "Album non trouvé" });
    }

    res.json(updatedAlbum[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'album:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'album",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// DELETE /api/gallery-albums/:id - Supprimer un album (admin uniquement)
router.delete("/:id", async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "ID d'album invalide" });
    }

    // Soft delete
    const deleted = await db
      .update(galleryAlbums)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(galleryAlbums.id, albumId))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Album non trouvé" });
    }

    res.json({ message: "Album supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'album:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de l'album",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// POST /api/gallery-albums/:id/photos - Ajouter une photo à un album (admin uniquement)
router.post("/:id/photos", async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    if (isNaN(albumId)) {
      return res.status(400).json({ message: "ID d'album invalide" });
    }

    // Vérifier que l'album existe
    const [album] = await db
      .select()
      .from(galleryAlbums)
      .where(eq(galleryAlbums.id, albumId));

    if (!album) {
      return res.status(404).json({ message: "Album non trouvé" });
    }

    const newPhoto = await db
      .insert(galleryPhotos)
      .values({
        albumId,
        ...req.body,
      })
      .returning();

    res.status(201).json(newPhoto[0]);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la photo:", error);
    res.status(500).json({ 
      message: "Erreur lors de l'ajout de la photo",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

// DELETE /api/gallery-albums/:albumId/photos/:photoId - Supprimer une photo (admin uniquement)
router.delete("/:albumId/photos/:photoId", async (req, res) => {
  try {
    const albumId = parseInt(req.params.albumId);
    const photoId = parseInt(req.params.photoId);
    
    if (isNaN(albumId) || isNaN(photoId)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Soft delete
    const deleted = await db
      .update(galleryPhotos)
      .set({ isActive: 0 })
      .where(and(
        eq(galleryPhotos.id, photoId),
        eq(galleryPhotos.albumId, albumId)
      ))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Photo non trouvée" });
    }

    res.json({ message: "Photo supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la photo",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    });
  }
});

export default router;
