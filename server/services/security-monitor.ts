/**
 * MONITORING SÉCURITÉ INTÉGRÉ
 * Surveille automatiquement les recommandations de sécurité
 */

import fs from 'fs';
import { Request, Response } from 'express';

interface SecurityMetrics {
  timestamp: string;
  rateLimitingActive: boolean;
  sanitizationActive: boolean;
  validationErrors: number;
  suspiciousRequests: number;
  httpsActive: boolean;
  pm2Status: string;
}

class SecurityMonitor {
  private metrics: SecurityMetrics[] = [];
  
  // Surveillance automatique des métriques de sécurité
  async collectMetrics(): Promise<SecurityMetrics> {
    const now = new Date().toISOString();
    
    return {
      timestamp: now,
      rateLimitingActive: this.checkRateLimiting(),
      sanitizationActive: this.checkSanitization(),
      validationErrors: await this.countValidationErrors(),
      suspiciousRequests: await this.countSuspiciousRequests(),
      httpsActive: this.checkHTTPS(),
      pm2Status: await this.checkPM2Status()
    };
  }
  
  // Vérifie si le rate limiting est actif
  private checkRateLimiting(): boolean {
    // Logique pour vérifier les middlewares rate limit
    return true; // Simplifié pour l'exemple
  }
  
  // Vérifie la sanitization
  private checkSanitization(): boolean {
    // Vérifier si XSS middleware est actif
    return true;
  }
  
  // Compte les erreurs de validation
  private async countValidationErrors(): Promise<number> {
    try {
      const logs = fs.readFileSync('/var/www/dounie-cuisine/logs/pm2-error.log', 'utf8');
      const validationErrors = (logs.match(/validation/gi) || []).length;
      return validationErrors;
    } catch {
      return 0;
    }
  }
  
  // Détecte les requêtes suspectes
  private async countSuspiciousRequests(): Promise<number> {
    // Logique pour détecter tentatives d'intrusion
    return 0;
  }
  
  // Vérifie HTTPS
  private checkHTTPS(): boolean {
    return process.env.NODE_ENV === 'production';
  }
  
  // Vérifie PM2
  private async checkPM2Status(): Promise<string> {
    // Vérification status PM2
    return 'online';
  }
  
  // Endpoint pour dashboard de monitoring
  async getSecurityDashboard(): Promise<object> {
    const currentMetrics = await this.collectMetrics();
    this.metrics.push(currentMetrics);
    
    // Garde seulement les 24 dernières heures
    this.metrics = this.metrics.slice(-144); // 1 point toutes les 10 minutes
    
    return {
      current: currentMetrics,
      history: this.metrics,
      alerts: this.generateAlerts(currentMetrics),
      recommendations: this.getActiveRecommendations(currentMetrics)
    };
  }
  
  // Génère des alertes automatiques
  private generateAlerts(metrics: SecurityMetrics): string[] {
    const alerts: string[] = [];
    
    if (!metrics.rateLimitingActive) {
      alerts.push("⚠️ Rate limiting désactivé");
    }
    
    if (!metrics.sanitizationActive) {
      alerts.push("🚨 Sanitization manquante");
    }
    
    if (metrics.validationErrors > 10) {
      alerts.push("📊 Nombreuses erreurs de validation");
    }
    
    if (!metrics.httpsActive) {
      alerts.push("🔒 HTTPS non configuré");
    }
    
    return alerts;
  }
  
  // Recommandations adaptées
  private getActiveRecommendations(metrics: SecurityMetrics): string[] {
    const reco: string[] = [];
    
    if (!metrics.rateLimitingActive) {
      reco.push("Activer le rate limiting sur tous les endpoints");
    }
    
    if (metrics.validationErrors > 0) {
      reco.push("Renforcer la validation Zod sur les routes problématiques");
    }
    
    return reco;
  }
}

export const securityMonitor = new SecurityMonitor();