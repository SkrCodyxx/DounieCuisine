/**
 * ROUTES ADMIN - EVENTS
 * Gestion des événements et réservations
 */

import { Router, Request, Response } from "express";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";

const router = Router();

// GET /events - Get all events
router.get("/events", requireAuth, requirePermission('events', 'view'), async (req: Request, res: Response) => {
  try {
    const events = await db
      .select()
      .from(schema.events)
      .orderBy(desc(schema.events.activityDate));

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// GET /events/:id - Get event by ID
router.get("/events/:id", requireAuth, requirePermission('events', 'view'), async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1);

    if (event.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// POST /events - Create new event
router.post("/events", requireAuth, requirePermission('events', 'create'), async (req: Request, res: Response) => {
  try {
    const newEvent = await storage.createEvent(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// PATCH /events/:id - Update event
router.patch("/events/:id", requireAuth, requirePermission('events', 'edit'), async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const [updatedEvent] = await db
      .update(schema.events)
      .set({
        ...req.body,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.events.id, eventId))
      .returning();

    res.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// DELETE /events/:id - Delete event
router.delete("/events/:id", requireAuth, requirePermission('events', 'delete'), async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const success = await storage.deleteEvent(eventId);
    if (!success) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// GET /event-bookings - Get all event bookings
router.get("/event-bookings", requireAuth, requirePermission('events', 'view'), async (req: Request, res: Response) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string) : undefined;
    
    const bookings = await storage.getEventBookings(eventId);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching event bookings:", error);
    res.status(500).json({ message: "Failed to fetch event bookings" });
  }
});

// PATCH /event-bookings/:id - Update event booking
router.patch("/event-bookings/:id", requireAuth, requirePermission('events', 'edit'), async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [updatedBooking] = await db
      .update(schema.eventBookings)
      .set({ 
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.eventBookings.id, bookingId))
      .returning();

    if (!updatedBooking) {
      return res.status(404).json({ message: "Event booking not found" });
    }

    res.json({ 
      message: "Event booking updated successfully",
      data: updatedBooking
    });
  } catch (error) {
    console.error("Error updating event booking:", error);
    res.status(500).json({ message: "Failed to update event booking" });
  }
});

// PATCH /event-bookings/:id/status - Update event booking status
router.patch("/event-bookings/:id/status", requireAuth, requirePermission('events', 'edit'), async (req: Request, res: Response) => {
  try {
    const reservationId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db
      .update(schema.eventBookings)
      .set({ status })
      .where(eq(schema.eventBookings.id, reservationId));

    res.json({ message: "Event booking status updated successfully" });
  } catch (error) {
    console.error("Error updating event booking status:", error);
    res.status(500).json({ message: "Failed to update event booking status" });
  }
});

// DELETE /event-bookings/:id - Delete event booking
router.delete("/event-bookings/:id", requireAuth, requirePermission('events', 'delete'), async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id);

    const [deletedBooking] = await db
      .delete(schema.eventBookings)
      .where(eq(schema.eventBookings.id, bookingId))
      .returning();

    if (!deletedBooking) {
      return res.status(404).json({ message: "Event booking not found" });
    }

    res.json({ 
      message: "Event booking deleted successfully",
      data: deletedBooking
    });
  } catch (error) {
    console.error("Error deleting event booking:", error);
    res.status(500).json({ message: "Failed to delete event booking" });
  }
});

export default router;
