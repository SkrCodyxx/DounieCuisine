#!/bin/bash

# Script de redémarrage rapide de l'application Dounie Cuisine
# Ce script redémarre uniquement l'application sans reconstruction

set -e

echo "⚡ Redémarrage rapide de l'application Dounie Cuisine..."

# Configuration
PROJECT_ROOT="/var/www/dounie-cuisine"
LOG_FILE="$PROJECT_ROOT/logs/restart-$(date +%Y%m%d_%H%M%S).log"

# Fonctions utilitaires
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "❌ [ERROR] $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo "✅ $1" | tee -a "$LOG_FILE"
}

# Vérifications initiales
if [ ! -d "$PROJECT_ROOT" ]; then
    error "Répertoire projet non trouvé: $PROJECT_ROOT"
fi

cd "$PROJECT_ROOT"

log "🔄 Début du redémarrage rapide - $(date)"

# Redémarrage uniquement de l'application Dounie Cuisine
log "🔄 Redémarrage de l'application Dounie Cuisine..."
if command -v pm2 &> /dev/null; then
    # Afficher le statut avant redémarrage
    log "Statut actuel:"
    pm2 list | grep -E "(dounie-cuisine|id|name)" || true
    
    # Redémarrage uniquement de notre app
    pm2 restart dounie-cuisine
    success "Application Dounie Cuisine redémarrée avec PM2"
    
    # Attendre que l'app soit stabilisée
    sleep 2
    
    # Afficher le nouveau statut
    log "Nouveau statut:"
    pm2 list | grep -E "(dounie-cuisine|id|name)" || true
else
    error "PM2 non trouvé, impossible de redémarrer l'application"
fi

# Test de santé rapide
log "🏥 Test de santé de l'application..."
sleep 2

if command -v curl &> /dev/null; then
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        success "API accessible et fonctionnelle"
    else
        log "⚠️  API non accessible, vérification manuelle nécessaire"
    fi
else
    log "curl non disponible, vérification manuelle nécessaire"
fi

success "⚡ Redémarrage rapide terminé!"
log "📝 Log disponible dans: $LOG_FILE"

echo ""
echo "🌐 Application accessible sur:"
echo "   - Frontend: http://localhost ou https://votre-domaine"
echo "   - API: http://localhost:3000/api"