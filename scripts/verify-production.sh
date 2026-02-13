#!/bin/bash

echo "=== VERIFICATION MODE PRODUCTION ==="
echo ""

echo "1. Variables d'environnement (.env):"
echo "NODE_ENV: $(grep NODE_ENV /var/www/dounie-cuisine/.env | cut -d'=' -f2)"
echo "SQUARE_ENVIRONMENT: $(grep SQUARE_ENVIRONMENT /var/www/dounie-cuisine/.env | cut -d'=' -f2)"
echo ""

echo "2. Configuration Square API:"
curl -s http://localhost:5000/api/payments/square/config | jq '{ environment, sdkUrl }'
echo ""

echo "3. Vérification URLs Square:"
SQUARE_SDK_URL=$(grep SQUARE_SDK_URL /var/www/dounie-cuisine/.env | grep -v '^#' | cut -d'=' -f2)
echo "SDK URL configurée: $SQUARE_SDK_URL"

if [[ $SQUARE_SDK_URL == *"sandbox"* ]]; then
    echo "⚠️  ATTENTION: URL SDK pointe vers sandbox!"
else
    echo "✅ SDK URL pointe vers production"
fi

echo ""
echo "4. Test accès API Square:"
RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/api/payments/square/config)
HTTP_CODE=$(echo $RESPONSE | tail -c 4)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Square accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Problème API Square (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== STATUT FINAL ==="
if grep -q "SQUARE_ENVIRONMENT=production" /var/www/dounie-cuisine/.env && \
   ! grep -q "sandbox" /var/www/dounie-cuisine/.env | grep -v '^#' | grep SQUARE_SDK_URL; then
    echo "🎉 CONFIGURATION PRODUCTION CONFIRMÉE"
else
    echo "⚠️  VÉRIFIER CONFIGURATION"
fi