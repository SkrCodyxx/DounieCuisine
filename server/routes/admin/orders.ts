/**
 * ROUTES ADMIN - ORDERS
 * Gestion des commandes
 */

import { Router, Request, Response } from "express";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "../../../shared/schema";
import { storage } from "../../storage";
import { requireAuth, requirePermission } from "../../middleware/auth";

const router = Router();

// GET /orders - Get all orders (paginated, searchable)
router.get("/orders", requireAuth, requirePermission('orders', 'view'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string || '').toLowerCase();
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;

    // Get all orders from storage
    let orders = await storage.getOrders();
    
    // Apply filters
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    if (paymentStatus) {
      orders = orders.filter(o => o.paymentStatus === paymentStatus);
    }
    if (search) {
      orders = orders.filter(o => 
        o.customerName.toLowerCase().includes(search) ||
        o.customerEmail.toLowerCase().includes(search) ||
        o.orderNumber.toLowerCase().includes(search)
      );
    }
    
    // Sort by date desc
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Paginate
    const total = orders.length;
    const paginatedOrders = orders.slice((page - 1) * limit, page * limit);

    res.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// GET /orders/:id - Get order by ID with details
router.get("/orders/:id", requireAuth, requirePermission('orders', 'view'), async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await storage.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

// PATCH /orders/:id/status - Update order status
router.patch("/orders/:id/status", requireAuth, requirePermission('orders', 'edit'), async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const success = await storage.updateOrderStatus(orderId, status, notes);
    if (!success) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// PATCH /orders/:id/payment-status - Update payment status
router.patch("/orders/:id/payment-status", requireAuth, requirePermission('orders', 'edit'), async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { paymentStatus } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const success = await storage.updateOrderPaymentStatus(orderId, paymentStatus);
    if (!success) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
});

// DELETE /orders/:id - Delete order
router.delete("/orders/:id", requireAuth, requirePermission('orders', 'delete'), async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);

    const success = await storage.deleteOrder(orderId);
    if (!success) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

// GET /orders/stats/overview - Get orders statistics
router.get("/orders/stats/overview", requireAuth, requirePermission('orders', 'view'), async (req: Request, res: Response) => {
  try {
    const stats = await storage.getOrdersStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching orders stats:", error);
    res.status(500).json({ message: "Failed to fetch orders statistics" });
  }
});

export default router;
