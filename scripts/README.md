# 🚀 SCRIPTS DE GESTION - DOUNIE CUISINE

Ce dossier contient les scripts pour gérer l'application facilement.

## 📋 Scripts disponibles

### 🔄 rebuild-and-restart.sh
**Rebuild complet et redémarrage**
```bash
./scripts/rebuild-and-restart.sh
```
- Arrête tous les services
- Nettoie les caches et builds précédents
- Reinstalle les dépendances
- Rebuild le frontend complet
- Redémarre tous les services
- Vérifie que tout fonctionne

**Utiliser quand :**
- Après des changements importants
- Problèmes de cache
- Mise en production
- Premier déploiement

---

### ⚡ quick-restart.sh
**Redémarrage rapide**
```bash
./scripts/quick-restart.sh
```
- Arrête et redémarre juste le serveur Node.js
- Garde le build existant
- Très rapide (3-5 secondes)

**Utiliser quand :**
- Changements côté serveur uniquement
- Redémarrage rapide après crash
- Test de configuration

---

### 🎨 rebuild-frontend.sh
**Rebuild frontend uniquement**
```bash
./scripts/rebuild-frontend.sh
```
- Nettoie et rebuild le frontend
- Redémarre le serveur avec nouveau build
- Plus rapide qu'un rebuild complet

**Utiliser quand :**
- Changements côté client (React, CSS, TypeScript)
- Problèmes d'affichage
- Nouvelles fonctionnalités frontend

---

## 🛠️ Utilisation

Tous les scripts doivent être exécutés depuis le répertoire racine :

```bash
cd /var/www/dounie-cuisine

# Rebuild complet (recommandé)
./scripts/rebuild-and-restart.sh

# Redémarrage rapide
./scripts/quick-restart.sh

# Rebuild frontend seulement
./scripts/rebuild-frontend.sh
```

## 📝 Logs

Les logs sont disponibles dans :
- `logs/server.log` - Logs du serveur Node.js
- `/var/log/nginx/access.log` - Logs Nginx
- `/var/log/nginx/error.log` - Erreurs Nginx

```bash
# Suivre les logs en temps réel
tail -f logs/server.log
tail -f /var/log/nginx/access.log
```

## 🆘 Dépannage

### Serveur ne démarre pas
```bash
# Vérifier les logs
cat logs/server.log

# Vérifier les ports
ss -tlnp | grep :5000

# Rebuild complet
./scripts/rebuild-and-restart.sh
```

### Page web ne charge pas
```bash
# Rebuild frontend
./scripts/rebuild-frontend.sh

# Vérifier nginx
sudo systemctl status nginx
sudo nginx -t
```

### Base de données
```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Redémarrer si nécessaire
sudo systemctl restart postgresql
```

## 📊 Monitoring

### Vérifier les services
```bash
# État des services
sudo systemctl status nginx
sudo systemctl status postgresql
ps aux | grep tsx

# Ports ouverts
ss -tlnp | grep -E "(80|443|5000)"
```

### URLs de test
- **Local:** http://localhost:5000
- **Production:** https://douniecuisine.com
- **API Test:** http://localhost:5000/api/site-info

---
*Mis à jour le 3 décembre 2025*