#!/bin/bash

# =============================================================================
# 🚀 SCRIPT DE REBUILD COMPLET - DOUNIE CUISINE
# =============================================================================
# Ce script rebuild complètement l'application et redémarre tous les services
# Usage: ./scripts/rebuild-and-restart.sh
# =============================================================================

set -e  # Arrêter sur toute erreur

echo "🚀 ============================================"
echo "🚀 REBUILD COMPLET - DOUNIE CUISINE"
echo "🚀 ============================================"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Script doit être exécuté depuis le répertoire racine du projet"
    exit 1
fi

log_info "Démarrage du rebuild complet..."

# =============================================================================
# 1. ARRÊT DES SERVICES
# =============================================================================
echo ""
log_info "1. Arrêt des services existants..."

# Arrêter le serveur Node.js
log_info "Arrêt du serveur Node.js..."
pkill -f "tsx server/index.ts" || log_warning "Aucun serveur Node.js à arrêter"
pkill -f "node.*server" || log_warning "Aucun serveur Node à arrêter"
sleep 2
log_success "Serveurs arrêtés"

# =============================================================================
# 2. NETTOYAGE
# =============================================================================
echo ""
log_info "2. Nettoyage des fichiers temporaires..."

# Nettoyer le cache npm
log_info "Nettoyage du cache npm..."
npm cache clean --force
log_success "Cache npm nettoyé"

# Supprimer les builds précédents
log_info "Suppression des builds précédents..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/
log_success "Builds précédents supprimés"

# Nettoyer les logs
log_info "Nettoyage des logs..."
rm -f logs/*.log 2>/dev/null || true
log_success "Logs nettoyés"

# =============================================================================
# 3. INSTALLATION DES DÉPENDANCES
# =============================================================================
echo ""
log_info "3. Installation/mise à jour des dépendances..."

log_info "Installation des dépendances npm..."
npm ci --prefer-offline
log_success "Dépendances installées"

# =============================================================================
# 4. BUILD DU FRONTEND
# =============================================================================
echo ""
log_info "4. Build du frontend..."

log_info "Construction du frontend avec Vite..."
npx vite build
log_success "Frontend construit avec succès"

# Vérifier que le build est OK
if [ ! -f "dist/public/index.html" ]; then
    log_error "Build du frontend échoué - index.html non trouvé"
    exit 1
fi
log_success "Build du frontend vérifié"

# =============================================================================
# 5. VÉRIFICATION DE LA BASE DE DONNÉES
# =============================================================================
echo ""
log_info "5. Vérification de la base de données..."

# Vérifier que PostgreSQL fonctionne
if ! systemctl is-active --quiet postgresql; then
    log_warning "PostgreSQL n'est pas actif, tentative de démarrage..."
    sudo systemctl start postgresql
fi
log_success "PostgreSQL actif"

# =============================================================================
# 6. REDÉMARRAGE DES SERVICES
# =============================================================================
echo ""
log_info "6. Redémarrage des services..."

# Redémarrer Nginx
log_info "Redémarrage de Nginx..."
sudo systemctl reload nginx
log_success "Nginx redémarré"

# Démarrer le serveur Node.js en arrière-plan
log_info "Démarrage du serveur Node.js..."
export NODE_ENV=development
export BEHIND_PROXY=true

# Démarrer en arrière-plan et capturer le PID
npm run dev > logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > .server.pid

# Attendre que le serveur démarre
log_info "Attente du démarrage du serveur..."
sleep 5

# Vérifier que le serveur fonctionne
if ! kill -0 $SERVER_PID 2>/dev/null; then
    log_error "Le serveur ne s'est pas démarré correctement"
    cat logs/server.log
    exit 1
fi

# Test de connectivité
log_info "Test de connectivité..."
if curl -sf http://localhost:5000/api/site-info > /dev/null; then
    log_success "Serveur accessible sur localhost:5000"
else
    log_error "Serveur non accessible"
    cat logs/server.log
    exit 1
fi

# =============================================================================
# 7. VÉRIFICATIONS FINALES
# =============================================================================
echo ""
log_info "7. Vérifications finales..."

# Vérifier les APIs essentielles
log_info "Vérification des APIs..."

if ! curl -sf "http://localhost:5000/api/dishes?isTakeout=1" > /dev/null; then
    log_error "API des plats takeout non accessible"
    exit 1
fi

if ! curl -sf "http://localhost:5000/api/menu-categories" > /dev/null; then
    log_error "API des catégories non accessible"
    exit 1
fi

log_success "Toutes les APIs fonctionnent"

# Vérifier les ports
log_info "Vérification des ports..."
if ! ss -tlnp | grep -q ":5000"; then
    log_error "Port 5000 non ouvert"
    exit 1
fi
log_success "Port 5000 actif"

# =============================================================================
# 8. RÉSUMÉ FINAL
# =============================================================================
echo ""
echo "🎉 ============================================"
echo "🎉 REBUILD COMPLET TERMINÉ AVEC SUCCÈS"
echo "🎉 ============================================"
echo ""
log_success "Application disponible sur:"
echo "   • Local: http://localhost:5000"
echo "   • Domain: https://douniecuisine.com"
echo ""
log_info "Services actifs:"
echo "   • Node.js: PID $SERVER_PID"
echo "   • Nginx: $(systemctl is-active nginx)"
echo "   • PostgreSQL: $(systemctl is-active postgresql)"
echo ""
log_info "Logs disponibles:"
echo "   • Serveur: tail -f logs/server.log"
echo "   • Nginx: tail -f /var/log/nginx/access.log"
echo ""
log_info "Pour arrêter le serveur: kill $SERVER_PID"
echo ""

# Optionnel: ouvrir automatiquement le navigateur
if command -v xdg-open > /dev/null; then
    log_info "Ouverture du navigateur..."
    sleep 2
    xdg-open "https://douniecuisine.com" 2>/dev/null &
fi

exit 0