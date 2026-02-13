#!/bin/bash

# Script pour extraire la structure de la base de données
# et identifier les différences avec le schema Drizzle

# URL de connexion depuis .env
DATABASE_URL="postgresql://dounie_user:D0un1eCu1s1n3@localhost:5432/dounie_cuisine"

echo "=== EXTRACTION STRUCTURE BASE DE DONNÉES ===" > /tmp/db_structure.txt
echo "Date: $(date)" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

# Extraire la liste des tables
echo "=== TABLES EXISTANTES ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

# Extraire la structure de la table testimonials
echo "=== STRUCTURE TABLE TESTIMONIALS ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -c "\d testimonials" >> /tmp/db_structure.txt 2>/dev/null || echo "Table testimonials n'existe pas" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

# Vérifier si la table session existe
echo "=== VÉRIFICATION TABLE SESSION ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session');" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

# Extraire la structure de toutes les tables mentionnées par Drizzle
echo "=== STRUCTURE ADMIN_MODULES ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -c "\d admin_modules" >> /tmp/db_structure.txt 2>/dev/null || echo "Table admin_modules n'existe pas" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

echo "=== STRUCTURE DISH_CATEGORIES ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -c "\d dish_categories" >> /tmp/db_structure.txt 2>/dev/null || echo "Table dish_categories n'existe pas" >> /tmp/db_structure.txt
echo "" >> /tmp/db_structure.txt

# Vérifier les colonnes customer_name et customer_email dans testimonials
echo "=== COLONNES TESTIMONIALS ===" >> /tmp/db_structure.txt
psql "$DATABASE_URL" -t -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'testimonials' AND table_schema = 'public';" >> /tmp/db_structure.txt 2>/dev/null || echo "Impossible de récupérer les colonnes" >> /tmp/db_structure.txt

echo "Structure sauvegardée dans /tmp/db_structure.txt"