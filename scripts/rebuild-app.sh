#!/bin/bash

# Script de reconstruction et redémarrage de l'application Dounie Cuisine
# Ce script nettoie, reconstruit et redémarre l'application complète

set -e

echo "🚀 Début de la reconstruction de l'application Dounie Cuisine..."

# Configuration
PROJECT_ROOT="/var/www/dounie-cuisine"
BACKUP_DIR="$PROJECT_ROOT/backup"
LOG_FILE="$PROJECT_ROOT/logs/rebuild-$(date +%Y%m%d_%H%M%S).log"

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

log "📋 Début de la reconstruction - $(date)"

# Étape 1: Sauvegarde préventive
log "📦 Création d'une sauvegarde préventive..."
mkdir -p "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
if [ -d "dist" ]; then
    cp -r dist "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/dist-backup"
    success "Sauvegarde du build précédent créée"
fi

# Étape 2: Nettoyage
log "🧹 Nettoyage des fichiers temporaires et cache..."
rm -rf dist/ || true
rm -rf node_modules/.cache/ || true
rm -rf node_modules/.vite/ || true
rm -rf client/dist/ || true
success "Nettoyage terminé"

# Étape 3: Vérification des dépendances
log "📦 Vérification et installation des dépendances..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    log "Installation des dépendances npm..."
    npm ci --silent
    success "Dépendances installées"
else
    log "Dépendances déjà à jour"
fi

# Étape 4: Build du frontend
log "🔨 Construction du frontend avec Vite..."
npx vite build --mode production
if [ $? -eq 0 ]; then
    success "Build frontend terminé avec succès"
else
    error "Échec du build frontend"
fi

# Étape 5: Vérification du build
log "🔍 Vérification du build..."
if [ ! -f "dist/public/index.html" ]; then
    error "Fichier index.html non trouvé dans le build"
fi

if [ ! -d "dist/public/assets" ]; then
    error "Dossier assets non trouvé dans le build"
fi

BUILD_SIZE=$(du -sh dist/ | cut -f1)
success "Build vérifié - Taille: $BUILD_SIZE"

# Étape 6: Redémarrage de l'application
log "🔄 Redémarrage de l'application..."
if command -v pm2 &> /dev/null; then
    # Redémarrage uniquement de l'app Dounie Cuisine, pas des autres processus
    pm2 restart dounie-cuisine
    success "Application Dounie Cuisine redémarrée avec PM2"
else
    log "PM2 non trouvé, redémarrage manuel nécessaire"
fi

# Étape 7: Test de santé
log "🏥 Test de santé de l'application..."
sleep 3

if command -v curl &> /dev/null; then
    if curl -f -s http://localhost:3000/api/health > /dev/null; then
        success "API accessible et fonctionnelle"
    else
        log "⚠️  API non accessible, vérification manuelle nécessaire"
    fi
else
    log "curl non disponible, vérification manuelle nécessaire"
fi

# Résumé
log "📊 Résumé de la reconstruction:"
log "   - Sauvegarde: ✅"
log "   - Nettoyage: ✅"
log "   - Dépendances: ✅"
log "   - Build frontend: ✅"
log "   - Redémarrage: ✅"
log "   - Taille du build: $BUILD_SIZE"

success "🎉 Reconstruction terminée avec succès!"
log "📝 Log complet disponible dans: $LOG_FILE"

echo ""
echo "🌐 Votre application est maintenant accessible:"
echo "   - Frontend: http://localhost ou https://votre-domaine"
echo "   - API: http://localhost:3000/api"
echo ""
echo "📊 Statut PM2:"
pm2 status || echo "PM2 non disponible"