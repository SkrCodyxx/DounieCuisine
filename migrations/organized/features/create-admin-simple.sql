-- Créer un admin avec un mot de passe simple
-- Mot de passe : password123 (hash bcrypt)

INSERT INTO admin_users (username, email, password, role, active, created_at, updated_at) 
VALUES (
  'admin', 
  'admin@dounie-cuisine.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'super_admin', 
  1, 
  NOW(), 
  NOW()
) ON CONFLICT (email) DO UPDATE SET 
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  active = 1,
  updated_at = NOW();

-- Afficher les admins créés
SELECT id, username, email, role, active FROM admin_users WHERE active = 1;