/**
 * ROUTES ADMIN - DELIVERY
 * Gestion des zones de livraison
 */

import { Router, Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { requireAuth, requirePermission } from "../../middleware/auth";

const router = Router();

// GET /delivery-zones - Get all delivery zones
router.get("/delivery-zones", requireAuth, requirePermission('settings', 'view'), async (req: Request, res: Response) => {
  try {
    const zones = await db.select().from(schema.deliveryZones);
    res.json(zones);
  } catch (error) {
    console.error("Error fetching delivery zones:", error);
    res.status(500).json({ message: "Failed to fetch delivery zones" });
  }
});

// POST /delivery-zones - Create delivery zone
router.post("/delivery-zones", requireAuth, requirePermission('settings', 'create'), async (req: Request, res: Response) => {
  try {
    const [newZone] = await db
      .insert(schema.deliveryZones)
      .values(req.body)
      .returning();

    res.status(201).json(newZone);
  } catch (error) {
    console.error("Error creating delivery zone:", error);
    res.status(500).json({ message: "Failed to create delivery zone" });
  }
});

// PATCH /delivery-zones/:id - Update delivery zone
router.patch("/delivery-zones/:id", requireAuth, requirePermission('settings', 'edit'), async (req: Request, res: Response) => {
  try {
    const zoneId = parseInt(req.params.id);
    const [updatedZone] = await db
      .update(schema.deliveryZones)
      .set({
        ...req.body,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.deliveryZones.id, zoneId))
      .returning();

    res.json(updatedZone);
  } catch (error) {
    console.error("Error updating delivery zone:", error);
    res.status(500).json({ message: "Failed to update delivery zone" });
  }
});

// DELETE /delivery-zones/:id - Delete delivery zone
router.delete("/delivery-zones/:id", requireAuth, requirePermission('settings', 'delete'), async (req: Request, res: Response) => {
  try {
    const zoneId = parseInt(req.params.id);
    await db.delete(schema.deliveryZones).where(eq(schema.deliveryZones.id, zoneId));
    res.json({ message: "Delivery zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting delivery zone:", error);
    res.status(500).json({ message: "Failed to delete delivery zone" });
  }
});

export default router;
