/**
 * ADMIN NOTIFICATIONS - Service de notification pour l'administration
 */

export interface AdminNotification {
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  link?: string;
  priority?: "low" | "medium" | "high";
}

/**
 * Crée une notification admin (version simplifiée)
 */
export async function createAdminNotification(notification: AdminNotification): Promise<void> {
  try {
    console.log(`[ADMIN NOTIFICATION] ${notification.type}: ${notification.title}`);
    // Pour le moment, juste du logging - peut être étendu pour SSE/DB
    return Promise.resolve();
  } catch (error) {
    console.error("Erreur lors de la création de notification admin:", error);
  }
}

// Notification pour nouvelle commande
export async function notifyNewOrder(order: {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string | number;
  orderType: string;
}): Promise<void> {
  await createAdminNotification({
    type: 'new_order',
    title: '🛒 Nouvelle commande',
    message: `Commande #${order.orderNumber} de ${order.customerName} - $${order.totalAmount}`,
    link: `/admin/orders/${order.id}`,
  });
}

// Notification pour nouveau contact
export async function notifyNewContact(contact: {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  await createAdminNotification({
    type: 'new_contact',
    title: '📧 Nouveau message de contact',
    message: `De ${contact.customerName}: ${contact.subject}`,
    link: `/admin/contacts/${contact.id}`,
  });
}

// Notification pour nouvelle réservation d'événement
export async function notifyNewEventBooking(booking: {
  id: number;
  eventName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  numberOfGuests?: number;
  eventDate: string;
  specialRequests?: string;
}): Promise<void> {
  await createAdminNotification({
    type: 'new_booking',
    title: '🎉 Nouvelle réservation',
    message: `Réservation de ${booking.customerName} pour ${booking.numberOfGuests || '?'} personnes le ${booking.eventDate}`,
    link: `/admin/bookings/${booking.id}`,
  });
}

// Notification pour paiement reçu
export async function notifyPaymentReceived(payment: {
  amount: number;
  orderNumber: string;
  orderId: number;
  customerName: string;
  paymentMethod?: string;
}): Promise<void> {
  await createAdminNotification({
    type: 'payment_received',
    title: '💰 Paiement reçu',
    message: `$${payment.amount} pour commande #${payment.orderNumber} de ${payment.customerName}`,
    link: `/admin/orders/${payment.orderId}`,
  });
}