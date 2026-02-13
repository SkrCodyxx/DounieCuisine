#!/bin/bash

# =============================================================================
# 🚀 SCRIPT DE REBUILD FRONTEND - DOUNIE CUISINE
# =============================================================================
# Ce script rebuild juste le frontend et redémarre le serveur
# Usage: ./scripts/rebuild-frontend.sh
# =============================================================================

echo "🚀 Rebuild frontend en cours..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /var/www/dounie-cuisine

# Nettoyer les anciens builds
echo -e "${BLUE}Nettoyage des anciens builds...${NC}"
rm -rf dist/public
rm -rf .vite/
rm -rf node_modules/.vite/

# Rebuild frontend
echo -e "${BLUE}Construction du frontend...${NC}"
npx vite build

if [ ! -f "dist/public/index.html" ]; then
    echo -e "${YELLOW}❌ Erreur: Build du frontend échoué${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend construit avec succès${NC}"

# Arrêter et redémarrer le serveur
echo -e "${BLUE}Redémarrage du serveur...${NC}"
pkill -f "tsx server/index.ts" || true
sleep 2

export NODE_ENV=development
export BEHIND_PROXY=true
npm run dev > logs/server.log 2>&1 &
echo $! > .server.pid

sleep 3
echo -e "${GREEN}✅ Serveur redémarré avec nouveau build${NC}"
echo -e "${GREEN}✅ Disponible sur: https://douniecuisine.com${NC}"