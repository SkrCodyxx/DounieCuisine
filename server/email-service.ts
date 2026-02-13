/**
 * SERVICE EMAIL - Gestion complète des emails
 * Templates HTML professionnels, envoi SMTP
 */

import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Template de base
function getBaseTemplate(content: string, title: string = 'Dounie Cuisine'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #E85D04, #DC2F02); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .footer { background: #1a1a1a; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    .btn { display: inline-block; background: #E85D04; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .order-table th { background: #f8f8f8; padding: 12px; text-align: left; border-bottom: 2px solid #E85D04; }
    .order-table td { padding: 10px; border-bottom: 1px solid #eee; }
    .total-row { font-weight: bold; background: #f8f8f8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍽️ Dounie Cuisine</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Dounie Cuisine - Cuisine Haïtienne Authentique</p>
      <p>Montreal, QC | info@douniecuisine.com</p>
    </div>
  </div>
</body>
</html>`;
}

// Templates d'email
const templates: Record<string, (vars: any) => { subject: string; html: string }> = {
  order_confirmation: (vars) => ({
    subject: `✅ Commande #${vars.orderNumber} confirmée - Dounie Cuisine`,
    html: getBaseTemplate(`
      <h2>Merci pour votre commande, ${vars.customerName}! 🎉</h2>
      <p>Votre commande <strong>#${vars.orderNumber}</strong> a été reçue et est en cours de préparation.</p>
      
      <h3>📋 Détails de la commande</h3>
      <table class="order-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Qté</th>
            <th>Prix</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${vars.orderItemsHtml || ''}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td>$${vars.totalAmount}</td>
          </tr>
        </tfoot>
      </table>
      
      <p><strong>Type:</strong> ${vars.orderType === 'delivery' ? '🚗 Livraison' : '🏠 À emporter'}</p>
      ${vars.deliveryAddress ? `<p><strong>Adresse:</strong> ${vars.deliveryAddress}</p>` : ''}
      ${vars.deliveryTime ? `<p><strong>Heure prévue:</strong> ${vars.deliveryTime}</p>` : ''}
      
      <a href="${vars.orderTrackingUrl || '#'}" class="btn">Suivre ma commande</a>
    `, 'Confirmation de commande')
  }),

  order_status_update: (vars) => ({
    subject: `📦 Mise à jour commande #${vars.orderNumber} - ${vars.status}`,
    html: getBaseTemplate(`
      <h2>Mise à jour de votre commande</h2>
      <p>Bonjour ${vars.customerName},</p>
      <p>Votre commande <strong>#${vars.orderNumber}</strong> a été mise à jour:</p>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px; margin: 0;"><strong>Nouveau statut:</strong> ${vars.statusLabel || vars.status}</p>
      </div>
      ${vars.message ? `<p>${vars.message}</p>` : ''}
      <a href="${vars.orderTrackingUrl || '#'}" class="btn">Voir ma commande</a>
    `, 'Mise à jour commande')
  }),

  welcome: (vars) => ({
    subject: `Bienvenue chez Dounie Cuisine! 🎉`,
    html: getBaseTemplate(`
      <h2>Bienvenue ${vars.customerName}! 👋</h2>
      <p>Merci de rejoindre la famille Dounie Cuisine!</p>
      <p>Découvrez nos délicieux plats haïtiens authentiques, préparés avec amour et les meilleures épices des Caraïbes.</p>
      <h3>Ce qui vous attend:</h3>
      <ul>
        <li>🍖 Griot croustillant</li>
        <li>🍚 Riz collé aux pois</li>
        <li>🥗 Pikliz maison</li>
        <li>Et bien plus encore...</li>
      </ul>
      <a href="${vars.menuUrl || 'https://douniecuisine.com/menu'}" class="btn">Découvrir le menu</a>
    `, 'Bienvenue')
  }),

  contact_reply: (vars) => ({
    subject: `Re: ${vars.subject} - Dounie Cuisine`,
    html: getBaseTemplate(`
      <h2>Réponse à votre message</h2>
      <p>Bonjour ${vars.customerName},</p>
      <p>Merci pour votre message. Voici notre réponse:</p>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E85D04;">
        ${vars.replyMessage}
      </div>
      <p>N'hésitez pas à nous recontacter si vous avez d'autres questions.</p>
      <p>Cordialement,<br>L'équipe Dounie Cuisine</p>
    `, 'Réponse')
  }),

  admin_notification: (vars) => ({
    subject: `🔔 ${vars.title} - Admin Dounie Cuisine`,
    html: getBaseTemplate(`
      <h2>${vars.title}</h2>
      <p>${vars.message}</p>
      ${vars.details ? `<div style="background: #f8f8f8; padding: 15px; border-radius: 8px; margin: 15px 0;"><pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(vars.details, null, 2)}</pre></div>` : ''}
      ${vars.actionUrl ? `<a href="${vars.actionUrl}" class="btn">${vars.actionLabel || 'Voir les détails'}</a>` : ''}
    `, 'Notification Admin')
  }),

  event_booking_confirmation: (vars) => ({
    subject: `🎉 Réservation confirmée - ${vars.eventTitle}`,
    html: getBaseTemplate(`
      <h2>Votre réservation est confirmée!</h2>
      <p>Bonjour ${vars.customerName},</p>
      <p>Votre réservation pour <strong>${vars.eventTitle}</strong> a été confirmée.</p>
      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>📅 Date:</strong> ${vars.eventDate}</p>
        <p><strong>⏰ Heure:</strong> ${vars.eventTime}</p>
        <p><strong>👥 Invités:</strong> ${vars.guestsCount} personnes</p>
        ${vars.location ? `<p><strong>📍 Lieu:</strong> ${vars.location}</p>` : ''}
      </div>
      <p>Nous avons hâte de vous accueillir!</p>
    `, 'Réservation confirmée')
  }),
};

// Fonction principale d'envoi d'email avec template
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  variables: Record<string, any>
): Promise<boolean> {
  try {
    const template = templates[templateName];
    if (!template) {
      console.error(`Template "${templateName}" not found`);
      return false;
    }

    const { subject, html } = template(variables);

    await transporter.sendMail({
      from: `"Dounie Cuisine" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent: ${templateName} to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email error (${templateName} to ${to}):`, error);
    return false;
  }
}

// Fonctions utilitaires d'envoi
export async function sendAdminNotification(title: string, message: string, details?: any): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return false;
  
  return sendTemplateEmail('admin_notification', adminEmail, { title, message, details });
}

export async function sendWelcomeEmail(email: string, customerName: string): Promise<boolean> {
  return sendTemplateEmail('welcome', email, { customerName });
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  orderNumber: string,
  customerName: string,
  status: string,
  statusLabel?: string
): Promise<boolean> {
  return sendTemplateEmail('order_status_update', email, {
    orderNumber,
    customerName,
    status,
    statusLabel,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    totalAmount: string | number;
    orderType: string;
    orderItemsHtml?: string;
    deliveryAddress?: string;
    deliveryTime?: string;
  }
): Promise<boolean> {
  return sendTemplateEmail('order_confirmation', email, orderData);
}

// Export par défaut
export default {
  sendTemplateEmail,
  sendAdminNotification,
  sendWelcomeEmail,
  sendOrderStatusUpdateEmail,
  sendOrderConfirmationEmail,
};
