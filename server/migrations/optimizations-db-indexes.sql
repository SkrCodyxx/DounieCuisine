-- INDEX DE PERFORMANCE CRITIQUES POUR DOUNIE CUISINE
-- Ces index vont accélérer les requêtes de 3-10x

-- INDEX SUR LA TABLE ORDERS (requêtes les plus fréquentes)
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

-- INDEX SUR LA TABLE DISHES (menu et recherche)
CREATE INDEX IF NOT EXISTS idx_dishes_active ON dishes(active);
CREATE INDEX IF NOT EXISTS idx_dishes_active_created ON dishes(active, created_at);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);

-- INDEX SUR LA TABLE CUSTOMERS (authentification)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- INDEX SUR LA TABLE NOTIFICATIONS (dashboard admin)
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_created ON notifications(read_status, created_at);

-- INDEX SUR LA TABLE CONTACT_MESSAGES (gestion admin)
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at);

-- INDEX SUR LA TABLE GALLERY (affichage public)
CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery(active);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);

-- INDEX SUR LA TABLE EVENTS (calendrier public)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date);

-- INDEX SUR LA TABLE TESTIMONIALS (affichage public)
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);

-- INDEX SUR LA TABLE ORDER_ITEMS (détails commandes)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON order_items(dish_id);

-- INDEX SUR LA TABLE ADMIN_USERS (authentification admin)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(active);

-- INDEX SUR LA TABLE AUDIT_LOGS (si elle existe - surveillance admin)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_type, user_id);

-- STATISTIQUES DES TABLES POUR L'OPTIMISEUR SQL
ANALYZE orders;
ANALYZE dishes;
ANALYZE customers;
ANALYZE notifications;
ANALYZE gallery;
ANALYZE events;
ANALYZE testimonials;