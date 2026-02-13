/**
 * ROUTES DE PAIEMENT (SQUARE)
 * Gestion des paiements Square et création de commandes
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { SquareClient, SquareEnvironment } from "square";
import { storage } from "../../storage";
import { db } from "../../db";
import { generateOrderDCID } from "../../utils/dcid";
import { squareSettings } from "../../../shared/schema";
import * as schema from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import xss from "xss";

// Schémas de validation pour sécurité paiements
const paymentRequestSchema = z.object({
  nonce: z.string().min(1, "Nonce requis"),
  amount: z.number().positive("Montant invalide").max(999999, "Montant trop élevé"),
  currency: z.string().length(3, "Code devise invalide").default("CAD"),
  orderData: z.object({
    items: z.array(z.object({
      id: z.number().positive(),
      name: z.string().min(1).max(200),
      quantity: z.number().positive().max(99),
      price: z.number().positive()
    })).min(1, "Au moins un article requis")
  })
});

const router = Router();

// GET /square/available-modes - Get available payment modes for public
router.get("/square/available-modes", async (req: Request, res: Response) => {
  try {
    // Récupérer toutes les configurations Square disponibles
    const configs = await db
      .select({
        environment: squareSettings.environment,
        isActive: squareSettings.isActive
      })
      .from(squareSettings);

    const modes = [
      { environment: 'active', label: 'Configuration Active', available: true }
    ];

    // Ajouter le mode sandbox si une config sandbox existe
    const hasSandbox = configs.some(c => c.environment === 'sandbox');
    if (hasSandbox) {
      modes.push({ environment: 'sandbox', label: 'Mode Test', available: true });
    }

    res.json(modes);
  } catch (error) {
    console.error("Error getting available Square modes:", error);
    // Fallback: au moins le mode actif
    res.json([{ environment: 'active', label: 'Configuration Active', available: true }]);
  }
});

// GET /square/config - Get Square configuration
router.get("/square/config", async (req: Request, res: Response) => {
  try {
    // Récupérer la configuration active depuis la base de données
    const activeConfig = await db
      .select()
      .from(squareSettings)
      .where(eq(squareSettings.isActive, true))
      .limit(1);

    if (activeConfig.length === 0) {
      return res.status(500).json({ 
        message: "Aucune configuration Square active trouvée" 
      });
    }

    const config = activeConfig[0];
    
    // URL du SDK selon l'environnement
    let sdkUrl;
    if (config.environment === 'production') {
      sdkUrl = 'https://web.squarecdn.com/v1/square.js';
    } else {
      sdkUrl = 'https://sandbox.web.squarecdn.com/v1/square.js';
    }

    res.json({
      applicationId: config.applicationId,
      locationId: config.locationId,
      environment: config.environment,
      sdkUrl
    });
  } catch (error) {
    console.error("Error getting Square config:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de la configuration Square" 
    });
  }
});

// GET /square/config-sandbox - Get Square sandbox configuration for testing
router.get("/square/config-sandbox", async (req: Request, res: Response) => {
  try {
    // Configuration sandbox hardcodée pour les tests
    const sandboxConfig = {
      applicationId: "sandbox-sq0idb-dYCFQU1H4r8qUOnjKznoaQ",
      locationId: "LRFJN5J8XXVDX", 
      environment: "sandbox",
      sdkUrl: "https://sandbox.web.squarecdn.com/v1/square.js"
    };

    res.json(sandboxConfig);
  } catch (error) {
    console.error("Error getting Square sandbox config:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de la configuration Square sandbox" 
    });
  }
});

// GET /square/test-credentials - Test Square credentials
router.get("/square/test-credentials", async (req: Request, res: Response) => {
  try {
    // Récupérer la configuration active depuis la base de données
    const activeConfig = await db
      .select()
      .from(squareSettings)
      .where(eq(squareSettings.isActive, true))
      .limit(1);

    if (activeConfig.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune configuration Square active trouvée"
      });
    }

    const config = activeConfig[0];

    const squareClient = new SquareClient({
      token: config.accessToken,
      environment: config.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
    });

    const locationsApi = squareClient.locations;
    const response = await locationsApi.list();
    
    if (response.locations && response.locations.length > 0) {
      const validLocation = response.locations.find(loc => loc.id === config.locationId);
      
      res.json({
        success: true,
        message: "Credentials Square valides",
        environment: config.environment,
        configuredLocationId: config.locationId,
        validLocation: validLocation ? {
          id: validLocation.id,
          name: validLocation.name,
          status: validLocation.status
        } : null,
        allLocations: response.locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          status: loc.status
        }))
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Aucune location trouvée"
      });
    }
  } catch (error: any) {
    console.error("Square credentials test error:", error);
    res.status(401).json({
      success: false,
      message: "Credentials Square invalides",
      error: error.message || "Token invalide ou expiré"
    });
  }
});

// POST /square/process - Process Square payment
router.post("/square/process", async (req: Request, res: Response) => {
  try {
    const { sourceId, amount, currency = "CAD", orderData } = req.body;
    
    if (!sourceId || !amount || !orderData) {
      return res.status(400).json({ 
        message: "sourceId, amount et orderData sont requis" 
      });
    }

    // Récupérer la configuration active depuis la base de données
    const activeConfig = await db
      .select()
      .from(squareSettings)
      .where(eq(squareSettings.isActive, true))
      .limit(1);

    if (activeConfig.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Aucune configuration Square active trouvée"
      });
    }

    const config = activeConfig[0];

    const squareClient = new SquareClient({
      token: config.accessToken,
      environment: config.environment === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
    });

    const paymentsApi = squareClient.payments;
    
    const requestBody = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(Number(amount))),
        currency: currency,
      },
      idempotencyKey: crypto.randomUUID(),
    };

    console.log('🔄 Processing Square payment:', {
      sourceId: sourceId.substring(0, 10) + '...',
      amount,
      currency,
      environment: config.environment
    });

    const response = await paymentsApi.create(requestBody);
    const payment = response.payment;
    
    if (!payment) {
      console.error('❌ No payment in Square response:', response);
      return res.status(500).json({
        success: false,
        message: "Réponse Square invalide - pas de paiement"
      });
    }

    if (payment?.status === 'COMPLETED') {
      console.log('✅ Square payment successful:', payment.id);
      
      // Générer numéro de commande unique
      const orderNumber = generateOrderDCID();
      
      // Sauvegarder la commande dans le système
      const orderToSave: schema.InsertOrder = {
        orderNumber,
        customerName: xss(orderData.customerInfo?.name || 'Client'),
        customerEmail: xss(orderData.customerInfo?.email || ''),
        customerPhone: xss(orderData.customerInfo?.phone || ''),
        orderType: orderData.type || 'delivery',
        totalAmount: (Number(amount) / 100).toFixed(2), // Convertir de cents vers dollars
        taxAmount: ((Number(amount) / 100) * 0.14975).toFixed(2), // TPS + TVQ approximatif
        deliveryFee: orderData.deliveryFee?.toString() || '0.00',
        deliveryAddress: orderData.type === 'delivery' 
          ? `${orderData.customerInfo?.street || ''}, ${orderData.customerInfo?.city || ''}, ${orderData.customerInfo?.postalCode || ''}` 
          : null,
        specialInstructions: xss(orderData.customerInfo?.deliveryInstructions || ''),
        paymentMethod: 'Square',
        paymentProvider: 'Square',
        paymentId: payment.id,
        paymentStatus: 'paid',
        paidAt: new Date(),
        status: 'pending'
      };

      try {
        // Sauvegarder dans le storage
        await storage.createOrder(orderToSave);
        console.log('✅ Order saved successfully:', orderNumber);

        // Préparer les données pour l'email
        const orderItemsHtml = orderData.items.map((item: any) => {
          const variantInfo = item.variant ? ` (${item.variant.label})` : '';
          const itemPrice = item.variant?.price || item.dish?.price || 0;
          return `
            <tr>
              <td>${xss(item.dish?.name || 'Article')}${variantInfo}</td>
              <td>${item.quantity}</td>
              <td>$${itemPrice.toFixed(2)}</td>
              <td>$${(itemPrice * item.quantity).toFixed(2)}</td>
            </tr>
          `;
        }).join('');

        // Envoyer email de confirmation au client
        if (orderToSave.customerEmail) {
          try {
            const { sendOrderConfirmationEmail } = await import('../../email-service');
            await sendOrderConfirmationEmail(orderToSave.customerEmail, {
              orderNumber: orderNumber,
              customerName: orderToSave.customerName,
              totalAmount: orderToSave.totalAmount,
              orderType: orderToSave.orderType,
              orderItemsHtml,
              deliveryAddress: orderToSave.deliveryAddress || undefined,
              deliveryTime: 'Dans les 30-45 minutes'
            });
            console.log('✅ Confirmation email sent to customer');
          } catch (emailError) {
            console.error('❌ Error sending confirmation email:', emailError);
          }
        }

        // Envoyer notification à l'administration
        try {
          const { createAdminNotification } = await import('../../admin-notifications');
          await createAdminNotification({
            type: 'new_order',
            title: 'Nouvelle commande reçue',
            message: `Commande #${orderNumber} de ${orderToSave.customerName} - $${orderToSave.totalAmount} (${config.environment})`,
            link: `/admin/orders`
          });
          console.log('✅ Admin notification sent');
        } catch (notifError) {
          console.error('❌ Error sending admin notification:', notifError);
        }

      } catch (saveError) {
        console.error('❌ Error saving order:', saveError);
        // Le paiement a réussi mais la sauvegarde a échoué
        // On retourne quand même le succès mais on log l'erreur
      }
      
      const responseData = {
        success: true,
        paymentId: payment.id,
        orderNumber: orderNumber,
        status: payment.status,
        receipt: payment.receiptUrl,
        amount: Number(payment.totalMoney?.amount || 0),
        currency: payment.totalMoney?.currency || 'CAD',
        environment: config.environment
      };
      
      res.json(responseData);
    } else {
      console.error('❌ Square payment failed:', payment?.status);
      res.status(400).json({
        success: false,
        message: `Paiement échoué: ${payment?.status || 'Statut inconnu'}`
      });
    }
  } catch (error: any) {
    console.error('Square payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors du traitement du paiement"
    });
  }
});

export default router;
