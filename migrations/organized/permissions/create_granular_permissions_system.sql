-- Migration: Système de permissions granulaires pour les pages admin
-- Date: 2025-11-12

-- Table pour définir les modules/pages admin disponibles
CREATE TABLE IF NOT EXISTS admin_modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison entre admins et leurs permissions sur chaque module
CREATE TABLE IF NOT EXISTS admin_module_permissions (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES admin_modules(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(admin_user_id, module_id)
);

-- Insérer les modules admin existants
INSERT INTO admin_modules (name, display_name, description) VALUES
    ('content', 'Gestion de Contenu', 'Galerie, médias, diaporamas, annonces'),
    ('menu', 'Gestion des Menus', 'Plats, catégories, menus traiteur, accompagnements'),
    ('orders', 'Gestion des Commandes', 'Commandes en ligne et traiteur, statuts, paiements'),
    ('users', 'Gestion des Utilisateurs', 'Clients et administrateurs'),
    ('community', 'Gestion de la Communauté', 'Événements, témoignages, messages'),
    ('settings', 'Paramètres du Site', 'Configuration générale, emails, paiements, pages légales')
ON CONFLICT (name) DO NOTHING;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_admin_module_permissions_admin_id 
    ON admin_module_permissions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_module_permissions_module_id 
    ON admin_module_permissions(module_id);

-- Fonction pour vérifier qu'il reste au moins 1 super admin actif
CREATE OR REPLACE FUNCTION check_minimum_super_admin()
RETURNS TRIGGER AS $$
DECLARE
    active_super_admin_count INTEGER;
BEGIN
    -- Compter les super admins actifs après l'opération
    IF TG_OP = 'DELETE' THEN
        SELECT COUNT(*) INTO active_super_admin_count
        FROM admin_users
        WHERE role = 'super_admin' AND active = 1 AND id != OLD.id;
    ELSIF TG_OP = 'UPDATE' THEN
        SELECT COUNT(*) INTO active_super_admin_count
        FROM admin_users
        WHERE role = 'super_admin' AND active = 1 AND id != NEW.id;
        
        -- Ajouter NEW s'il est super admin et actif
        IF NEW.role = 'super_admin' AND NEW.active = 1 THEN
            active_super_admin_count := active_super_admin_count + 1;
        END IF;
    END IF;
    
    -- Empêcher l'opération s'il ne reste plus de super admin
    IF active_super_admin_count < 1 THEN
        RAISE EXCEPTION 'Cannot perform this operation: at least one active super admin must exist';
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour protéger la suppression/désactivation du dernier super admin
DROP TRIGGER IF EXISTS prevent_last_super_admin_removal ON admin_users;
CREATE TRIGGER prevent_last_super_admin_removal
    BEFORE UPDATE OR DELETE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION check_minimum_super_admin();

-- Donner automatiquement tous les accès aux super admins existants
INSERT INTO admin_module_permissions (admin_user_id, module_id, can_view, can_create, can_edit, can_delete)
SELECT 
    au.id,
    am.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
FROM admin_users au
CROSS JOIN admin_modules am
WHERE au.role = 'super_admin' AND au.active = 1
ON CONFLICT (admin_user_id, module_id) DO UPDATE SET
    can_view = TRUE,
    can_create = TRUE,
    can_edit = TRUE,
    can_delete = TRUE,
    updated_at = NOW();
