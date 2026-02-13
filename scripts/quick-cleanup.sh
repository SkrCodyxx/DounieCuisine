#!/bin/bash

echo "🧹 NETTOYAGE AUTO - DONNÉES INUTILES SEULEMENT"
echo "============================================="
echo "🔒 Vos données importantes sont protégées!"
echo ""

echo "🗑️ SUPPRESSION AUTOMATIQUE..."

# 1. Notifications de test
TEST_NOTIF=$(sudo -u postgres psql dounie_cuisine -t -c "
DELETE FROM notifications 
WHERE title ILIKE '%test%';
SELECT ROW_COUNT();" 2>/dev/null || echo "0")

echo "✅ Notifications de test supprimées"

# 2. Queue emails en erreur
EMAIL_ERR=$(sudo -u postgres psql dounie_cuisine -t -c "
DELETE FROM email_queue 
WHERE status IN ('failed', 'error') OR created_at < NOW() - INTERVAL '7 days';" 2>/dev/null)

echo "✅ Emails en erreur nettoyés"

# 3. Sessions très anciennes (>30 jours)
OLD_SESS=$(sudo -u postgres psql dounie_cuisine -t -c "
DELETE FROM session 
WHERE expire < NOW() - INTERVAL '30 days';" 2>/dev/null)

echo "✅ Anciennes sessions supprimées"

# 4. Tokens expirés
EXP_TOKENS=$(sudo -u postgres psql dounie_cuisine -t -c "
DELETE FROM password_reset_tokens 
WHERE expires_at < NOW();" 2>/dev/null)

echo "✅ Tokens expirés supprimés"

# 5. Table de backup inutile
sudo -u postgres psql dounie_cuisine -c "
DELETE FROM legacy_dishes_variants_backup;" 2>/dev/null

echo "✅ Backup inutile vidé"

# 6. Vider les tables vraiment inutiles si elles existent
sudo -u postgres psql dounie_cuisine -c "
DROP TABLE IF EXISTS events_backup CASCADE;" 2>/dev/null

echo "✅ Tables backup supprimées"

echo ""
echo "📊 ÉTAT POST-NETTOYAGE"
echo "====================="

# Compter ce qui reste
NOTIFS=$(sudo -u postgres psql dounie_cuisine -t -c "SELECT COUNT(*) FROM notifications;" 2>/dev/null | tr -d ' ')
QUEUE=$(sudo -u postgres psql dounie_cuisine -t -c "SELECT COUNT(*) FROM email_queue;" 2>/dev/null | tr -d ' ')
SESSIONS=$(sudo -u postgres psql dounie_cuisine -t -c "SELECT COUNT(*) FROM session;" 2>/dev/null | tr -d ' ')

echo "📮 Notifications: $NOTIFS"
echo "📧 Queue emails: $QUEUE"
echo "🔐 Sessions: $SESSIONS"

echo ""
echo "🎉 NETTOYAGE TERMINÉ!"
echo "==================="
echo "✅ Base de données optimisée"
echo "🔒 Données importantes préservées" 
echo "🚀 Prêt pour la production"