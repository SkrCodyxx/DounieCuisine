/**
 * ROUTES ADMIN - CATERING
 * Gestion des devis traiteur
 */

import { Router, Request, Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";

const router = Router();

// ============================================================
// CATERING MENU
// ============================================================

// GET /catering-menu - Get complete catering menu
router.get("/catering-menu", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const menu = await storage.getCateringMenu();
    res.json(menu);
  } catch (error) {
    console.error("Error fetching catering menu:", error);
    res.status(500).json({ message: "Failed to fetch catering menu" });
  }
});

// GET /catering-categories - Get all catering categories
router.get("/catering-categories", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const categories = await storage.getCateringCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching catering categories:", error);
    res.status(500).json({ message: "Failed to fetch catering categories" });
  }
});

// POST /catering-categories - Create catering category
router.post("/catering-categories", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newCategory = await storage.createCateringCategory(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating catering category:", error);
    res.status(500).json({ message: "Failed to create catering category" });
  }
});

// PATCH /catering-categories/:id - Update catering category
router.patch("/catering-categories/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const updatedCategory = await storage.updateCateringCategory(categoryId, req.body);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating catering category:", error);
    res.status(500).json({ message: "Failed to update catering category" });
  }
});

// DELETE /catering-categories/:id - Delete catering category
router.delete("/catering-categories/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const success = await storage.deleteCateringCategory(categoryId);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Catering category deleted successfully" });
  } catch (error) {
    console.error("Error deleting catering category:", error);
    res.status(500).json({ message: "Failed to delete catering category" });
  }
});

// ============================================================
// CATERING ITEMS
// ============================================================

// GET /catering-items - Get all catering items
router.get("/catering-items", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const items = await storage.getCateringItems();
    
    // Enrichir chaque item avec ses prix
    const itemsWithPrices = [];
    for (const item of items) {
      const prices = await storage.getCateringItemPrices(item.id);
      itemsWithPrices.push({ ...item, prices });
    }
    
    res.json(itemsWithPrices);
  } catch (error) {
    console.error("Error fetching catering items:", error);
    res.status(500).json({ message: "Failed to fetch catering items" });
  }
});

// GET /catering-items/:id - Get catering item by ID
router.get("/catering-items/:id", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await storage.getCateringItem(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    // Enrichir avec les prix
    const prices = await storage.getCateringItemPrices(item.id);
    const itemWithPrices = { ...item, prices };
    
    res.json(itemWithPrices);
  } catch (error) {
    console.error("Error fetching catering item:", error);
    res.status(500).json({ message: "Failed to fetch catering item" });
  }
});

// POST /catering-items - Create catering item
router.post("/catering-items", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const { prices, ...itemData } = req.body;
    
    // Créer l'item d'abord
    const newItem = await storage.createCateringItem(itemData);
    
    // Créer les prix si fournis
    const itemPrices = [];
    if (prices && Array.isArray(prices)) {
      for (const price of prices) {
        const newPrice = await storage.createCateringItemPrice({
          itemId: newItem.id,
          sizeLabelFr: price.sizeLabelFr,
          sizeLabelEn: price.sizeLabelEn || price.sizeLabelFr,
          price: String(parseFloat(price.price) || 0),
          isDefault: price.isDefault ? 1 : 0,
          displayOrder: price.displayOrder || 0
        });
        itemPrices.push(newPrice);
      }
    }
    
    // Retourner l'item avec ses prix
    res.status(201).json({ ...newItem, prices: itemPrices });
  } catch (error) {
    console.error("Error creating catering item:", error);
    res.status(500).json({ message: "Failed to create catering item" });
  }
});

// PATCH /catering-items/:id - Update catering item
router.patch("/catering-items/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    const { prices, ...itemData } = req.body;
    
    // Mettre à jour l'item
    const updatedItem = await storage.updateCateringItem(itemId, itemData);
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    // Gérer les prix si fournis
    let itemPrices = [];
    if (prices && Array.isArray(prices)) {
      // Supprimer tous les prix existants pour cet item
      const existingPrices = await storage.getCateringItemPrices(itemId);
      for (const existingPrice of existingPrices) {
        await storage.deleteCateringItemPrice(existingPrice.id);
      }
      
      // Créer les nouveaux prix
      for (const price of prices) {
        const newPrice = await storage.createCateringItemPrice({
          itemId: updatedItem.id,
          sizeLabelFr: price.sizeLabelFr,
          sizeLabelEn: price.sizeLabelEn || price.sizeLabelFr,
          price: String(parseFloat(price.price) || 0),
          isDefault: price.isDefault ? 1 : 0,
          displayOrder: price.displayOrder || 0
        });
        itemPrices.push(newPrice);
      }
    } else {
      // Si pas de prix fournis, récupérer les prix existants
      itemPrices = await storage.getCateringItemPrices(itemId);
    }
    
    // Retourner l'item avec ses prix
    res.json({ ...updatedItem, prices: itemPrices });
  } catch (error) {
    console.error("Error updating catering item:", error);
    res.status(500).json({ message: "Failed to update catering item" });
  }
});

// DELETE /catering-items/:id - Delete catering item
router.delete("/catering-items/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Supprimer d'abord tous les prix associés
    const existingPrices = await storage.getCateringItemPrices(itemId);
    for (const price of existingPrices) {
      await storage.deleteCateringItemPrice(price.id);
    }
    
    // Ensuite supprimer l'item
    const success = await storage.deleteCateringItem(itemId);
    if (!success) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Catering item deleted successfully" });
  } catch (error) {
    console.error("Error deleting catering item:", error);
    res.status(500).json({ message: "Failed to delete catering item" });
  }
});

// ============================================================
// CATERING QUOTES
// ============================================================

// GET /catering-quotes - Get all catering quotes
router.get("/catering-quotes", requireAuth, requirePermission('orders', 'view'), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    
    let query = db.select().from(schema.cateringQuotes);
    
    let quotes;
    if (status) {
      quotes = await query.where(eq(schema.cateringQuotes.status, status)).orderBy(desc(schema.cateringQuotes.createdAt));
    } else {
      quotes = await query.orderBy(desc(schema.cateringQuotes.createdAt));
    }
      
    res.json(quotes);
  } catch (error) {
    console.error("Error fetching catering quotes:", error);
    res.status(500).json({ message: "Failed to fetch catering quotes" });
  }
});

// GET /catering-quotes/:id - Get catering quote by ID
router.get("/catering-quotes/:id", requireAuth, requirePermission('orders', 'view'), async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    const [quote] = await db
      .select()
      .from(schema.cateringQuotes)
      .where(eq(schema.cateringQuotes.id, quoteId))
      .limit(1);

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json(quote);
  } catch (error) {
    console.error("Error fetching catering quote:", error);
    res.status(500).json({ message: "Failed to fetch catering quote" });
  }
});

// PUT /catering-quotes/:id - Update catering quote
router.put("/catering-quotes/:id", requireAuth, requirePermission('orders', 'edit'), async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    const updateData = schema.updateCateringQuoteSchema.parse(req.body);

    const [updatedQuote] = await db
      .update(schema.cateringQuotes)
      .set({
        status: updateData.status,
        adminNotes: updateData.adminNotes,
        ...(updateData.quoteSentAt && { quoteSentAt: new Date(updateData.quoteSentAt) }),
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.cateringQuotes.id, quoteId))
      .returning();

    if (!updatedQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({
      message: "Quote updated successfully",
      quote: updatedQuote
    });
  } catch (error) {
    console.error("Error updating quote:", error);
    res.status(500).json({ message: "Failed to update quote" });
  }
});

// PATCH /catering-quotes/:id/status - Update quote status
router.patch("/catering-quotes/:id/status", requireAuth, requirePermission('orders', 'edit'), async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'quoted', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db
      .update(schema.cateringQuotes)
      .set({
        status,
        ...(adminNotes && { adminNotes }),
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.cateringQuotes.id, quoteId));

    res.json({ message: "Quote status updated successfully" });
  } catch (error) {
    console.error("Error updating quote status:", error);
    res.status(500).json({ message: "Failed to update quote status" });
  }
});

// DELETE /catering-quotes/:id - Delete catering quote
router.delete("/catering-quotes/:id", requireAuth, requirePermission('orders', 'delete'), async (req: Request, res: Response) => {
  try {
    const quoteId = parseInt(req.params.id);
    await db.delete(schema.cateringQuotes).where(eq(schema.cateringQuotes.id, quoteId));
    res.json({ message: "Catering quote deleted successfully" });
  } catch (error) {
    console.error("Error deleting catering quote:", error);
    res.status(500).json({ message: "Failed to delete catering quote" });
  }
});

export default router;
