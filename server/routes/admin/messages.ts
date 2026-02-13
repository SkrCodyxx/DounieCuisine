import { Router, Request, Response } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db.js";
import * as schema from "../../../shared/schema.js";

const router = Router();

// GET /messages - Get all contact messages with filtering
router.get("/messages", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    let whereConditions = [];
    
    // Apply filters
    if (status && status !== 'all') {
      whereConditions.push(eq(schema.contactMessages.status, status));
    }
    if (search) {
      whereConditions.push(
        sql`(
          ${schema.contactMessages.name} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.email} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.subject} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.message} ILIKE ${'%' + search + '%'}
        )`
      );
    }

    // Build and execute query
    const offset = (page - 1) * limit;
    let messages;
    let totalCount;
    
    if (whereConditions.length > 0) {
      messages = await db.select().from(schema.contactMessages)
        .where(and(...whereConditions))
        .orderBy(desc(schema.contactMessages.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.contactMessages)
        .where(and(...whereConditions));
      totalCount = count;
    } else {
      messages = await db.select().from(schema.contactMessages)
        .orderBy(desc(schema.contactMessages.createdAt))
        .limit(limit)
        .offset(offset);
      
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(schema.contactMessages);
      totalCount = count;
    }

    res.json({
      data: messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    res.status(500).json({ message: "Failed to fetch contact messages" });
  }
});

// GET /messages/stats - Get messages statistics
router.get("/messages/stats", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(schema.contactMessages);
    const [unreadResult] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.contactMessages)
      .where(eq(schema.contactMessages.status, 'new'));

    const [todayResult] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.contactMessages)
      .where(sql`DATE(${schema.contactMessages.createdAt}) = CURRENT_DATE`);

    res.json({
      total: totalResult.count,
      unread: unreadResult.count,
      today: todayResult.count
    });
  } catch (error) {
    console.error("Error fetching message stats:", error);
    res.status(500).json({ message: "Failed to fetch message statistics" });
  }
});

// PUT /messages/:id - Update message status
router.put("/messages/:id", requireAuth, requirePermission('content', 'edit'), async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [updatedMessage] = await db
      .update(schema.contactMessages)
      .set({
        status
      })
      .where(eq(schema.contactMessages.id, messageId))
      .returning();

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({
      message: "Message status updated successfully",
      data: updatedMessage
    });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
});

// POST /messages/bulk-delete - Bulk delete messages
router.post("/messages/bulk-delete", requireAuth, requirePermission('content', 'delete'), async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid or empty IDs array" });
    }

    await db.delete(schema.contactMessages).where(
      sql`${schema.contactMessages.id} = ANY(${ids})`
    );

    res.json({ 
      message: `Successfully deleted ${ids.length} messages`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error("Error bulk deleting messages:", error);
    res.status(500).json({ message: "Failed to delete messages" });
  }
});

// GET /messages/export - Export messages to CSV
router.get("/messages/export", requireAuth, requirePermission('content', 'view'), async (req: Request, res: Response) => {
  try {
    const format = req.query.format || 'csv';
    const status = req.query.status as string;
    const search = req.query.search as string;

    let whereConditions = [];

    // Apply same filters as main query
    if (status && status !== 'all') {
      whereConditions.push(eq(schema.contactMessages.status, status));
    }
    if (search) {
      whereConditions.push(
        sql`(
          ${schema.contactMessages.name} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.email} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.subject} ILIKE ${'%' + search + '%'} OR
          ${schema.contactMessages.message} ILIKE ${'%' + search + '%'}
        )`
      );
    }

    let messages;
    if (whereConditions.length > 0) {
      messages = await db.select().from(schema.contactMessages)
        .where(and(...whereConditions))
        .orderBy(desc(schema.contactMessages.createdAt));
    } else {
      messages = await db.select().from(schema.contactMessages)
        .orderBy(desc(schema.contactMessages.createdAt));
    }

    if (format === 'csv') {
      const csvHeaders = ['ID', 'Name', 'Email', 'Subject', 'Message', 'Status', 'Created At'];
      const csvRows = messages.map(msg => [
        msg.id,
        msg.name,
        msg.email,
        msg.subject || '',
        msg.message.replace(/"/g, '""'), // Escape quotes for CSV
        msg.status,
        msg.createdAt?.toISOString() || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=contact_messages_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.json(messages);
    }
  } catch (error) {
    console.error("Error exporting messages:", error);
    res.status(500).json({ message: "Failed to export messages" });
  }
});

export default router;