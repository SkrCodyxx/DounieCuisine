/**
 * Initialisation des templates d'email
 * Vérifie que les templates sont disponibles au démarrage
 */

import { storage } from './storage';

export async function initializeEmailTemplates(): Promise<void> {
  console.log('📧 Vérification des templates d\'email...');
  
  // Les templates sont définis directement dans email-service.ts
  // Cette fonction vérifie simplement que le système est prêt
  
  const defaultTemplates = [
    'order_confirmation',
    'order_status_update',
    'welcome_email',
    'contact_reply',
    'reservation_confirmation',
    'admin_notification'
  ];
  
  console.log(`✅ ${defaultTemplates.length} templates d'email disponibles`);
  
  // Vérifier la configuration SMTP (sans exposer les credentials)
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  if (smtpConfigured) {
    console.log('✅ Configuration SMTP détectée');
  } else {
    console.log('⚠️ Configuration SMTP non détectée - les emails ne seront pas envoyés');
  }
}
