#!/bin/bash

# =============================================================================
# 🚀 SCRIPT DE REDÉMARRAGE RAPIDE - DOUNIE CUISINE
# =============================================================================
# Ce script redémarre juste les services sans rebuild
# Usage: ./scripts/quick-restart.sh
# =============================================================================

echo "🚀 Redémarrage rapide en cours..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Arrêter le serveur
echo -e "${BLUE}Arrêt du serveur...${NC}"
pkill -f "tsx server/index.ts" || true
sleep 2

# Redémarrer le serveur
echo -e "${BLUE}Démarrage du serveur...${NC}"
cd /var/www/dounie-cuisine
export NODE_ENV=development
export BEHIND_PROXY=true
npm run dev > logs/server.log 2>&1 &
echo $! > .server.pid

sleep 3
echo -e "${GREEN}✅ Serveur redémarré (PID: $(cat .server.pid))${NC}"
echo -e "${GREEN}✅ Disponible sur: https://douniecuisine.com${NC}"