#!/bin/bash

# Script de maintenance automatique - À exécuter périodiquement
# Garde seulement les 10 notifications les plus récentes
# Supprime les sessions expirées et les données inutiles

echo "🔄 MAINTENANCE AUTOMATIQUE QUOTIDIENNE"
echo "====================================="

# 1. Garder seulement les 10 notifications les plus récentes  
echo "📮 Nettoyage des notifications (garder les 10 plus récentes)..."

NOTIFICATIONS_DELETED=$(sudo -u postgres psql dounie_cuisine -t -c "
WITH recent_notifications AS (
  SELECT id FROM notifications 
  WHERE recipient_type = 'admin'
  ORDER BY created_at DESC 
  LIMIT 10
)
DELETE FROM notifications 
WHERE recipient_type = 'admin' 
  AND id NOT IN (SELECT id FROM recent_notifications);
SELECT ROW_COUNT();" 2>/dev/null | tail -1 | tr -d ' ')

echo "   ✅ Notifications anciennes supprimées"

# 2. Marquer toutes les notifications restantes comme lues
sudo -u postgres psql dounie_cuisine -c "
UPDATE notifications 
SET is_read = 1 
WHERE recipient_type = 'admin' AND is_read = 0;" 2>/dev/null

echo "   ✅ Notifications marquées comme lues"

# 3. Sessions expirées
EXPIRED_SESSIONS=$(sudo -u postgres psql dounie_cuisine -t -c "
DELETE FROM session WHERE expire < NOW();
SELECT ROW_COUNT();" 2>/dev/null | tail -1 | tr -d ' ')

echo "🔐 Sessions expirées supprimées: $EXPIRED_SESSIONS"

# 4. Queue emails en erreur
sudo -u postgres psql dounie_cuisine -c "
DELETE FROM email_queue 
WHERE status IN ('failed', 'error') 
   OR created_at < NOW() - INTERVAL '1 day';" 2>/dev/null

echo "📧 Queue emails nettoyée"

# 5. Tokens expirés
sudo -u postgres psql dounie_cuisine -c "
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW();" 2>/dev/null

echo "🔑 Tokens expirés supprimés"

# État final
NOTIF_COUNT=$(sudo -u postgres psql dounie_cuisine -t -c "SELECT COUNT(*) FROM notifications WHERE recipient_type = 'admin';" | tr -d ' ')
UNREAD_COUNT=$(sudo -u postgres psql dounie_cuisine -t -c "SELECT COUNT(*) FROM notifications WHERE recipient_type = 'admin' AND is_read = 0;" | tr -d ' ')

echo ""
echo "📊 RÉSULTAT"
echo "==========="
echo "📮 Notifications admin: $NOTIF_COUNT (max 10)"
echo "🔔 Non lues: $UNREAD_COUNT (devrait être 0)"
echo ""
echo "✅ Maintenance terminée - Base propre!"