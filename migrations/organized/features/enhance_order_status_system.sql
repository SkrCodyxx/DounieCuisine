-- ================================================================
-- AMÉLIORATION SYSTÈME DE STATUTS COMMANDES + EMAILS AUTO
-- ================================================================

-- 1. Étendre les statuts disponibles pour inclure les étapes de livraison
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending';

-- 2. Créer un ENUM pour les statuts de livraison
DO $$ BEGIN
    CREATE TYPE delivery_status_type AS ENUM (
        'pending',          -- En attente
        'preparing',        -- En préparation
        'ready',           -- Prêt (sortie cuisine)
        'out_for_delivery', -- Livreur parti
        'delivered',        -- Livré
        'delayed',          -- Retardé
        'cancelled',        -- Annulé
        'pickup_ready',     -- Prêt pour ramassage
        'picked_up'         -- Récupéré
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Ajouter colonnes pour tracking détaillé
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delay_reason TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_time INTERVAL,
ADD COLUMN IF NOT EXISTS actual_delivery_time INTERVAL;

-- 4. Fonction pour envoyer emails automatiquement selon statut
CREATE OR REPLACE FUNCTION send_status_email()
RETURNS TRIGGER AS $$
DECLARE
    email_template_name VARCHAR(100);
    customer_email_addr VARCHAR(255);
    order_data JSONB;
    site_data JSONB;
BEGIN
    -- Récupérer email client et données commande
    SELECT 
        COALESCE(NEW.customer_email, u.email),
        jsonb_build_object(
            'order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', COALESCE(NEW.customer_name, u.first_name || ' ' || u.last_name),
            'customer_phone', NEW.customer_phone,
            'delivery_address', NEW.delivery_address,
            'total_amount', NEW.total_amount,
            'is_delivery', NEW.delivery_type = 'delivery',
            'delivery_fee', NEW.delivery_fee
        )
    INTO customer_email_addr, order_data
    FROM orders o
    LEFT JOIN users u ON u.email = NEW.customer_email
    WHERE o.id = NEW.id;

    -- Récupérer infos site
    SELECT jsonb_build_object(
        'business_name', business_name,
        'phone1', phone1,
        'contact_email', contact_email,
        'website_url', website_url,
        'restaurant_address', address
    ) INTO site_data
    FROM site_info
    LIMIT 1;

    -- Déterminer quel email envoyer selon le changement de statut
    IF NEW.delivery_status IS DISTINCT FROM OLD.delivery_status THEN
        CASE NEW.delivery_status
            WHEN 'ready' THEN
                email_template_name := 'order-ready';
                NEW.ready_at := NOW();
            
            WHEN 'out_for_delivery' THEN
                email_template_name := 'delivery-started';
                NEW.out_for_delivery_at := NOW();
            
            WHEN 'delayed' THEN
                email_template_name := 'delivery-delayed';
            
            WHEN 'delivered' THEN
                email_template_name := 'feedback-request';
                NEW.delivered_at := NOW();
            
            WHEN 'cancelled' THEN
                email_template_name := 'order-cancelled';
            
            WHEN 'pickup_ready' THEN
                email_template_name := 'pickup-reminder';
                
            ELSE
                email_template_name := NULL;
        END CASE;

        -- Envoyer l'email si un template est défini
        IF email_template_name IS NOT NULL AND customer_email_addr IS NOT NULL THEN
            -- Insérer dans une table de queue d'emails pour traitement asynchrone
            INSERT INTO email_queue (
                template_name,
                recipient_email,
                order_id,
                template_data,
                priority,
                created_at
            ) VALUES (
                email_template_name,
                customer_email_addr,
                NEW.id,
                order_data || site_data,
                'high',
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer table de queue pour emails
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    order_id INTEGER,
    newsletter_id INTEGER,
    template_data JSONB,
    priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
    status VARCHAR(20) DEFAULT 'pending',  -- pending, sent, failed
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_template ON email_queue(template_name);

-- 6. Trigger pour emails automatiques
DROP TRIGGER IF EXISTS trigger_order_status_email ON orders;
CREATE TRIGGER trigger_order_status_email
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_status_email();

-- 7. Fonction pour traiter la queue d'emails
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS INTEGER AS $$
DECLARE
    email_record RECORD;
    template_record RECORD;
    html_content TEXT;
    email_subject TEXT;
    processed_count INTEGER := 0;
BEGIN
    -- Traiter les emails en attente par ordre de priorité
    FOR email_record IN 
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND attempts < max_attempts
        ORDER BY 
            CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'normal' THEN 2 
                WHEN 'low' THEN 3 
            END,
            created_at
        LIMIT 50
    LOOP
        BEGIN
            -- Récupérer le template
            SELECT * INTO template_record
            FROM email_templates 
            WHERE name = email_record.template_name 
            AND is_active = true;

            IF template_record IS NOT NULL THEN
                -- Remplacer les variables dans le template
                html_content := template_record.html_content;
                email_subject := template_record.subject;

                -- Remplacer les variables simples
                html_content := replace(html_content, '{{customerName}}', COALESCE(email_record.template_data->>'customer_name', 'Client'));
                html_content := replace(html_content, '{{orderNumber}}', COALESCE(email_record.template_data->>'order_number', 'N/A'));
                html_content := replace(html_content, '{{businessName}}', COALESCE(email_record.template_data->>'business_name', 'Dounie Cuisine'));
                html_content := replace(html_content, '{{phone1}}', COALESCE(email_record.template_data->>'phone1', ''));
                html_content := replace(html_content, '{{contactEmail}}', COALESCE(email_record.template_data->>'contact_email', ''));
                html_content := replace(html_content, '{{deliveryAddress}}', COALESCE(email_record.template_data->>'delivery_address', ''));
                html_content := replace(html_content, '{{customerPhone}}', COALESCE(email_record.template_data->>'customer_phone', ''));
                html_content := replace(html_content, '{{departureTime}}', TO_CHAR(NOW(), 'HH24:MI'));
                html_content := replace(html_content, '{{estimatedDeliveryTime}}', '30-45 minutes');
                html_content := replace(html_content, '{{estimatedArrivalTime}}', TO_CHAR(NOW() + INTERVAL '35 minutes', 'HH24:MI'));

                -- Marquer comme traité (en production, ici on enverrait vraiment l'email)
                UPDATE email_queue 
                SET 
                    status = 'sent',
                    sent_at = NOW(),
                    attempts = attempts + 1
                WHERE id = email_record.id;

                processed_count := processed_count + 1;

                -- Log l'envoi
                INSERT INTO email_automation_log (
                    email_type, recipient_email, order_id, sent_at
                ) VALUES (
                    email_record.template_name,
                    email_record.recipient_email, 
                    email_record.order_id,
                    NOW()
                );

            ELSE
                -- Template non trouvé
                UPDATE email_queue 
                SET 
                    status = 'failed',
                    error_message = 'Template not found: ' || email_record.template_name,
                    attempts = attempts + 1
                WHERE id = email_record.id;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            -- Erreur lors du traitement
            UPDATE email_queue 
            SET 
                status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
                error_message = SQLERRM,
                attempts = attempts + 1
            WHERE id = email_record.id;
        END;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Ajouter des colonnes de tracking pour l'interface admin
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]';

-- Fonction pour logger les changements de statut
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status IS DISTINCT FROM OLD.delivery_status THEN
        NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || 
            jsonb_build_object(
                'from_status', OLD.delivery_status,
                'to_status', NEW.delivery_status,
                'changed_at', NOW(),
                'changed_by', 'admin'
            );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_status_change ON orders;
CREATE TRIGGER trigger_log_status_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- 9. Mettre à jour les commandes existantes
UPDATE orders 
SET delivery_status = 
    CASE status
        WHEN 'pending' THEN 'pending'
        WHEN 'confirmed' THEN 'preparing'
        WHEN 'completed' THEN 'delivered'
        ELSE 'pending'
    END
WHERE delivery_status IS NULL;

-- 10. Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamps ON orders(ready_at, out_for_delivery_at, delivered_at);

COMMENT ON COLUMN orders.delivery_status IS 'Statut détaillé de livraison pour emails automatiques';
COMMENT ON COLUMN orders.ready_at IS 'Timestamp quand la commande est prête';
COMMENT ON COLUMN orders.out_for_delivery_at IS 'Timestamp quand le livreur est parti';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp de livraison effective';
COMMENT ON TABLE email_queue IS 'Queue pour envoi asynchrone des emails de statut';

-- 11. Fonction utilitaire pour déclencher manuellement un email
CREATE OR REPLACE FUNCTION trigger_order_email(
    p_order_id INTEGER,
    p_email_type VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- Récupérer la commande
    SELECT * INTO order_record FROM orders WHERE id = p_order_id;
    
    IF order_record IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Ajouter à la queue
    INSERT INTO email_queue (
        template_name,
        recipient_email,
        order_id,
        template_data,
        priority,
        created_at
    ) VALUES (
        p_email_type,
        order_record.customer_email,
        p_order_id,
        jsonb_build_object(
            'order_id', order_record.id,
            'order_number', order_record.order_number,
            'customer_name', order_record.customer_name,
            'customer_phone', order_record.customer_phone
        ),
        'high',
        NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test de la fonction
-- SELECT trigger_order_email(1, 'order-ready');