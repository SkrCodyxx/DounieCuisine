-- Script pour donner toutes les permissions au nouvel admin
-- et corriger les problèmes de navigation

-- Obtenir l'ID du dernier admin créé
DO $$ 
DECLARE
    new_admin_id INTEGER;
    module_rec RECORD;
BEGIN
    -- Obtenir l'ID du dernier admin non super_admin
    SELECT id INTO new_admin_id 
    FROM admin_users 
    WHERE role = 'admin' 
    ORDER BY id DESC 
    LIMIT 1;
    
    IF new_admin_id IS NULL THEN
        RAISE NOTICE 'Aucun admin standard trouvé';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Attribution des permissions à l''admin ID: %', new_admin_id;
    
    -- Supprimer les anciennes permissions
    DELETE FROM admin_module_permissions 
    WHERE admin_user_id = new_admin_id;
    
    -- Donner toutes les permissions pour tous les modules
    FOR module_rec IN 
        SELECT id FROM admin_modules WHERE active = true
    LOOP
        INSERT INTO admin_module_permissions (
            admin_user_id, 
            module_id, 
            can_view, 
            can_create, 
            can_edit, 
            can_delete
        ) VALUES (
            new_admin_id,
            module_rec.id,
            true,
            true,
            true,
            true
        );
        
        RAISE NOTICE 'Permissions ajoutées pour module ID: %', module_rec.id;
    END LOOP;
    
END $$;