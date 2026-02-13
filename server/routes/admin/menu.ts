/**
 * ROUTES ADMIN - MENU
 * Gestion des plats, catégories, variants, accompagnements
 */

import { Router, Request, Response } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";
import { memoryCache } from "../../memory-cache";

const router = Router();

// DISHES

// GET /dishes - Get all dishes
router.get("/dishes", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const dishes = await storage.getDishes();
    res.json(dishes);
  } catch (error) {
    console.error("Error fetching dishes:", error);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET /dishes/:id - Get dish by ID
router.get("/dishes/:id", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    const dish = await storage.getDish(dishId);

    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    res.json(dish);
  } catch (error) {
    console.error("Error fetching dish:", error);
    res.status(500).json({ message: "Failed to fetch dish" });
  }
});

// POST /dishes - Create new dish
router.post("/dishes", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newDish = await storage.createDish(req.body);
    memoryCache.clear('public_menu_dishes');
    res.status(201).json(newDish);
  } catch (error) {
    console.error("Error creating dish:", error);
    res.status(500).json({ message: "Failed to create dish" });
  }
});

// PATCH /dishes/:id - Update dish
router.patch("/dishes/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    const updatedDish = await storage.updateDish(dishId, req.body);
    memoryCache.clear('public_menu_dishes');
    res.json(updatedDish);
  } catch (error) {
    console.error("Error updating dish:", error);
    res.status(500).json({ message: "Failed to update dish" });
  }
});

// DELETE /dishes/:id - Delete dish
router.delete("/dishes/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.id);
    await storage.deleteDish(dishId);
    memoryCache.clear('public_menu_dishes');
    res.json({ message: "Dish deleted successfully" });
  } catch (error) {
    console.error("Error deleting dish:", error);
    res.status(500).json({ message: "Failed to delete dish" });
  }
});

// CATEGORIES

// GET /categories - Get all categories
router.get("/categories", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const categories = await storage.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// POST /categories - Create category
router.post("/categories", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newCategory = await storage.createCategory(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

// PATCH /categories/:id - Update category
router.patch("/categories/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const updatedCategory = await storage.updateCategory(categoryId, req.body);
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Failed to update category" });
  }
});

// DELETE /categories/:id - Delete category
router.delete("/categories/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    await storage.deleteCategory(categoryId);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// VARIANTS

// GET /variants - Get all variants/options
router.get("/variants", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const variants = await storage.getAllVariants();
    res.json(variants);
  } catch (error) {
    console.error("Error fetching all variants:", error);
    res.status(500).json({ message: "Failed to fetch variants" });
  }
});

// GET /dishes/:dishId/variants - Get dish variants
router.get("/dishes/:dishId/variants", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const variants = await storage.getDishVariants(dishId);
    res.json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ message: "Failed to fetch variants" });
  }
});

// POST /variants - Create variant
router.post("/variants", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newVariant = await storage.createVariant(req.body);
    memoryCache.clear('public_menu_dishes');
    res.status(201).json(newVariant);
  } catch (error) {
    console.error("Error creating variant:", error);
    res.status(500).json({ message: "Failed to create variant" });
  }
});

// PATCH /variants/:id - Update variant
router.patch("/variants/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    const updatedVariant = await storage.updateVariant(variantId, req.body);
    memoryCache.clear('public_menu_dishes');
    res.json(updatedVariant);
  } catch (error) {
    console.error("Error updating variant:", error);
    res.status(500).json({ message: "Failed to update variant" });
  }
});

// DELETE /variants/:id - Delete variant
router.delete("/variants/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    await storage.deleteVariant(variantId);
    memoryCache.clear('public_menu_dishes');
    res.json({ message: "Variant deleted successfully" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    res.status(500).json({ message: "Failed to delete variant" });
  }
});

// SIDES

// GET /sides - Get all sides
router.get("/sides", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const sides = await storage.getSides();
    res.json(sides);
  } catch (error) {
    console.error("Error fetching sides:", error);
    res.status(500).json({ message: "Failed to fetch sides" });
  }
});

// POST /sides - Create side
router.post("/sides", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newSide = await storage.createSide(req.body);
    res.status(201).json(newSide);
  } catch (error) {
    console.error("Error creating side:", error);
    res.status(500).json({ message: "Failed to create side" });
  }
});

// PATCH /sides/:id - Update side
router.patch("/sides/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const sideId = parseInt(req.params.id);
    const updatedSide = await storage.updateSide(sideId, req.body);
    res.json(updatedSide);
  } catch (error) {
    console.error("Error updating side:", error);
    res.status(500).json({ message: "Failed to update side" });
  }
});

// DELETE /sides/:id - Delete side
router.delete("/sides/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const sideId = parseInt(req.params.id);
    await storage.deleteSide(sideId);
    res.json({ message: "Side deleted successfully" });
  } catch (error) {
    console.error("Error deleting side:", error);
    res.status(500).json({ message: "Failed to delete side" });
  }
});

// DISH CATEGORIES

// GET /dish-categories - Get all dish categories
router.get("/dish-categories", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const categories = await storage.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching dish categories:", error);
    res.status(500).json({ message: "Failed to fetch dish categories" });
  }
});

// POST /dish-categories - Create dish category
router.post("/dish-categories", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const newCategory = await storage.createCategory(req.body);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating dish category:", error);
    res.status(500).json({ message: "Failed to create dish category" });
  }
});

// PATCH /dish-categories/:id - Update dish category
router.patch("/dish-categories/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const updatedCategory = await storage.updateCategory(categoryId, req.body);
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating dish category:", error);
    res.status(500).json({ message: "Failed to update dish category" });
  }
});

// DELETE /dish-categories/:id - Delete dish category
router.delete("/dish-categories/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const success = await storage.deleteCategory(categoryId);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ message: "Dish category deleted successfully" });
  } catch (error) {
    console.error("Error deleting dish category:", error);
    res.status(500).json({ message: "Failed to delete dish category" });
  }
});

// VARIANTES
// =========

// POST /dishes/:dishId/variants - Create variant for dish
router.post("/dishes/:dishId/variants", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const variantData = {
      dishId,
      label: req.body.label,
      price: req.body.price,
      displayOrder: req.body.displayOrder || 0,
      isDefault: req.body.isDefault ? 1 : 0,
      isActive: req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : 1
    };
    const variant = await storage.createVariant(variantData);
    memoryCache.clear('public_menu_dishes');
    res.status(201).json(variant);
  } catch (error) {
    console.error("Error creating dish variant:", error);
    res.status(500).json({ message: "Failed to create dish variant" });
  }
});

// DELETE /dishes/:dishId/variants/:variantId - Remove variant from dish
router.delete("/dishes/:dishId/variants/:variantId", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const variantId = parseInt(req.params.variantId);

    if (isNaN(dishId) || isNaN(variantId)) {
      return res.status(400).json({ message: "Invalid dish ID or variant ID" });
    }

    // Delete the variant
    await db
      .delete(schema.dishVariantsNew)
      .where(and(
        eq(schema.dishVariantsNew.dishId, dishId),
        eq(schema.dishVariantsNew.id, variantId)
      ));

    // Check if dish still has variants
    const remainingVariants = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.dishVariantsNew)
      .where(and(
        eq(schema.dishVariantsNew.dishId, dishId),
        eq(schema.dishVariantsNew.isActive, 1)
      ));

    if (remainingVariants[0]?.count === 0) {
      await db
        .update(schema.dishes)
        .set({ hasVariants: 0 })
        .where(eq(schema.dishes.id, dishId));
    }

    memoryCache.clear('public_menu_dishes');
    res.json({ message: "Variant removed successfully" });
  } catch (error) {
    console.error("Error removing variant from dish:", error);
    res.status(500).json({ message: "Failed to remove variant from dish" });
  }
});

// PATCH /dishes/:dishId/variants/:variantId - Update variant of a specific dish
router.patch("/dishes/:dishId/variants/:variantId", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const variantId = parseInt(req.params.variantId);

    if (isNaN(dishId) || isNaN(variantId)) {
      return res.status(400).json({ message: "Invalid dish ID or variant ID" });
    }

    // Update the variant
    const [updatedVariant] = await db
      .update(schema.dishVariantsNew)
      .set({
        label: req.body.label,
        price: req.body.price,
        displayOrder: req.body.displayOrder,
        isDefault: req.body.isDefault ? 1 : 0,
        isActive: req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : 1,
        updatedAt: new Date()
      })
      .where(and(
        eq(schema.dishVariantsNew.dishId, dishId),
        eq(schema.dishVariantsNew.id, variantId)
      ))
      .returning();

    if (!updatedVariant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    memoryCache.clear('public_menu_dishes');
    res.json(updatedVariant);
  } catch (error) {
    console.error("Error updating variant:", error);
    res.status(500).json({ message: "Failed to update variant" });
  }
});

// PATCH /variants/:id - Update variant
router.patch("/variants/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    const variant = await storage.updateVariant(variantId, req.body);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }
    memoryCache.clear('public_menu_dishes');
    res.json(variant);
  } catch (error) {
    console.error("Error updating dish variant:", error);
    res.status(500).json({ message: "Failed to update dish variant" });
  }
});

// ACCOMPAGNEMENTS (SIDES)
// =======================

// GET /sides - Get all sides
router.get("/sides", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const sides = await storage.getSides();
    res.json(sides);
  } catch (error) {
    console.error("Error fetching sides:", error);
    res.status(500).json({ message: "Failed to fetch sides" });
  }
});

// POST /sides - Create side
router.post("/sides", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const side = await storage.createSide(req.body);
    res.status(201).json(side);
  } catch (error) {
    console.error("Error creating side:", error);
    res.status(500).json({ message: "Failed to create side" });
  }
});

// PATCH /sides/:id - Update side
router.patch("/sides/:id", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const sideId = parseInt(req.params.id);
    const side = await storage.updateSide(sideId, req.body);
    if (!side) {
      return res.status(404).json({ message: "Side not found" });
    }
    res.json(side);
  } catch (error) {
    console.error("Error updating side:", error);
    res.status(500).json({ message: "Failed to update side" });
  }
});

// DELETE /sides/:id - Delete side
router.delete("/sides/:id", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const sideId = parseInt(req.params.id);
    const success = await storage.deleteSide(sideId);
    if (!success) {
      return res.status(404).json({ message: "Side not found" });
    }
    res.json({ message: "Side deleted successfully" });
  } catch (error) {
    console.error("Error deleting side:", error);
    res.status(500).json({ message: "Failed to delete side" });
  }
});

// GET /dishes/:dishId/sides - Get sides for a dish
router.get("/dishes/:dishId/sides", requireAuth, requirePermission('menu', 'view'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const sides = await storage.getDishSides(dishId);
    res.json(sides);
  } catch (error) {
    console.error("Error fetching dish sides:", error);
    res.status(500).json({ message: "Failed to fetch dish sides" });
  }
});

// POST /dishes/:dishId/sides/:sideId - Add side to dish
router.post("/dishes/:dishId/sides/:sideId", requireAuth, requirePermission('menu', 'create'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const sideId = parseInt(req.params.sideId);
    const { isIncluded = 0, extraPrice = "0.00", displayOrder = 0 } = req.body;
    
    const dishSide = await storage.addDishSide({
      dishId,
      sideId,
      isIncluded,
      extraPrice,
      displayOrder
    });
    
    memoryCache.clear('public_menu_dishes');
    res.status(201).json(dishSide);
  } catch (error) {
    console.error("Error adding dish side:", error);
    res.status(500).json({ message: "Failed to add dish side" });
  }
});

// DELETE /dishes/:dishId/sides/:sideId - Remove side from dish
router.delete("/dishes/:dishId/sides/:sideId", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const sideId = parseInt(req.params.sideId);

    if (isNaN(dishId) || isNaN(sideId)) {
      return res.status(400).json({ message: "Invalid dish or side ID" });
    }

    const result = await db
      .delete(schema.dishSides)
      .where(and(
        eq(schema.dishSides.dishId, dishId),
        eq(schema.dishSides.sideId, sideId)
      ))
      .returning({ id: schema.dishSides.id });

    if (result.length === 0) {
      return res.status(404).json({ message: "Side not assigned to this dish" });
    }

    memoryCache.clear('public_menu_dishes');
    res.json({
      success: true,
      message: "Side removed from dish"
    });
  } catch (error) {
    console.error("Error removing side from dish:", error);
    res.status(500).json({ message: "Failed to remove side from dish" });
  }
});

// PATCH /dishes/:dishId/sides/:sideId - Update dish side relation
router.patch("/dishes/:dishId/sides/:sideId", requireAuth, requirePermission('menu', 'edit'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const sideId = parseInt(req.params.sideId);
    
    const success = await storage.updateDishSide(dishId, sideId, req.body);
    if (!success) {
      return res.status(404).json({ message: "Dish side relation not found" });
    }
    
    memoryCache.clear('public_menu_dishes');
    res.json({ message: "Dish side updated successfully" });
  } catch (error) {
    console.error("Error updating dish side:", error);
    res.status(500).json({ message: "Failed to update dish side" });
  }
});

// DELETE /dishes/:dishId/sides/:sideId - Remove side from dish
router.delete("/dishes/:dishId/sides/:sideId", requireAuth, requirePermission('menu', 'delete'), async (req: Request, res: Response) => {
  try {
    const dishId = parseInt(req.params.dishId);
    const sideId = parseInt(req.params.sideId);
    
    const success = await storage.removeDishSide(dishId, sideId);
    if (!success) {
      return res.status(404).json({ message: "Dish side relation not found" });
    }
    
    memoryCache.clear('public_menu_dishes');
    res.json({ message: "Side removed from dish successfully" });
  } catch (error) {
    console.error("Error removing dish side:", error);
    res.status(500).json({ message: "Failed to remove dish side" });
  }
});

export default router;
