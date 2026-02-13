/**
 * ROUTES ADMIN - TESTIMONIALS
 * Gestion des témoignages clients
 */

import { Router, Request, Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { requireAuth, requirePermission } from "../../middleware/auth";
import { memoryCache } from "../../memory-cache";

const router = Router();

// GET /testimonials - Get all testimonials
router.get("/testimonials", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const testimonials = await db
      .select()
      .from(schema.testimonials)
      .orderBy(desc(schema.testimonials.createdAt));

    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
});

// POST /testimonials - Create testimonial
router.post("/testimonials", requireAuth, requirePermission('content', 'create'), async (req: Request, res: Response) => {
  try {
    const [newTestimonial] = await db
      .insert(schema.testimonials)
      .values(req.body)
      .returning();

    memoryCache.clear('public_testimonials');
    res.status(201).json(newTestimonial);
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({ message: "Failed to create testimonial" });
  }
});

// PATCH /testimonials/:id - Update testimonial
router.patch("/testimonials/:id", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const testimonialId = parseInt(req.params.id);
    const [updatedTestimonial] = await db
      .update(schema.testimonials)
      .set({
        ...req.body,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.testimonials.id, testimonialId))
      .returning();

    memoryCache.clear('public_testimonials');
    res.json(updatedTestimonial);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({ message: "Failed to update testimonial" });
  }
});

// DELETE /testimonials/:id - Delete testimonial
router.delete("/testimonials/:id", requireAuth, requirePermission('content', 'delete'), async (req: Request, res: Response) => {
  try {
    const testimonialId = parseInt(req.params.id);
    await db.delete(schema.testimonials).where(eq(schema.testimonials.id, testimonialId));
    memoryCache.clear('public_testimonials');
    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ message: "Failed to delete testimonial" });
  }
});

// PATCH /testimonials/:id/approve - Approve testimonial
router.patch("/testimonials/:id/approve", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const testimonialId = parseInt(req.params.id);
    await db
      .update(schema.testimonials)
      .set({ approved: 1 })
      .where(eq(schema.testimonials.id, testimonialId));

    memoryCache.clear('public_testimonials');
    res.json({ message: "Testimonial approved successfully" });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({ message: "Failed to approve testimonial" });
  }
});

export default router;
