/**
 * ROUTES ADMIN - DASHBOARD & STATISTIQUES
 * Statistiques générales, analytics, métriques
 */

import { Router, Request, Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { requireAuth } from "../../middleware/auth";
import { storage } from "../../storage";

const router = Router();

// GET /dashboard/stats - Dashboard statistics
router.get("/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    // Get comprehensive dashboard stats using storage layer
    const dashboardStats = await storage.getDashboardStats();
    
    // Get recent orders (slice from all orders)
    const allOrders = await storage.getOrders();
    const recentOrders = allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    // Get total counts using storage methods
    const totalDishes = await storage.getDishesCount();
    const totalEvents = await storage.getEventsCount();
    
    // Count unique customers from orders instead of customer table
    const uniqueCustomersResult = await db.select({ 
      count: sql`count(distinct ${schema.orders.customerEmail})` 
    }).from(schema.orders);
    const totalCustomers = Number(uniqueCustomersResult[0]?.count || 0);

    res.json({
      totalCustomers,
      totalOrders: dashboardStats.totalOrders,
      totalDishes,
      totalEvents,
      totalRevenue: dashboardStats.totalRevenue.toFixed(2),
      totalMessages: dashboardStats.totalMessages,
      totalConversations: dashboardStats.totalConversations,
      activeConversations: dashboardStats.activeConversations,
      unreadMessages: dashboardStats.unreadMessages,
      ordersGrowth: dashboardStats.ordersGrowth,
      revenueGrowth: dashboardStats.revenueGrowth,
      messagesGrowth: dashboardStats.messagesGrowth,
      conversationsGrowth: dashboardStats.conversationsGrowth,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

// GET /dashboard/recent-activity - Recent activity feed
router.get("/dashboard/recent-activity", requireAuth, async (req: Request, res: Response) => {
  try {
    const recentActivity = await storage.getRecentActivity();
    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

export default router;
