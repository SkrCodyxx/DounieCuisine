-- Migration: Ajouter le deuxième numéro de téléphone
-- Date: 2024-11-14
-- Description: Ajouter phone2 qui était manquant

UPDATE site_info 
SET phone2 = '+1 514 993-3311', 
    phone2_label = 'Secondaire'
WHERE id = 1 AND (phone2 IS NULL OR phone2 = '');

-- Vérifier la mise à jour
SELECT business_name, phone1, phone2, phone1_label, phone2_label 
FROM site_info WHERE id = 1;