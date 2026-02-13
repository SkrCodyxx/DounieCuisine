-- Tables pour le système de chat en temps réel

-- Sessions de chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  customer_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'waiting' NOT NULL, -- waiting, active, closed
  assigned_admin_id INTEGER REFERENCES admin_users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages du chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- customer, admin, system
  sender_id INTEGER, -- admin_user_id si sender_type='admin'
  sender_name VARCHAR(100),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_admin ON chat_sessions(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Vue pour les sessions actives avec dernier message
CREATE OR REPLACE VIEW active_chat_sessions AS
SELECT 
  cs.*,
  (SELECT message FROM chat_messages WHERE session_id = cs.session_id ORDER BY created_at DESC LIMIT 1) as last_message,
  (SELECT created_at FROM chat_messages WHERE session_id = cs.session_id ORDER BY created_at DESC LIMIT 1) as last_message_time,
  (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.session_id AND sender_type = 'customer' AND is_read = FALSE) as unread_count
FROM chat_sessions cs
WHERE cs.status IN ('waiting', 'active')
ORDER BY cs.updated_at DESC;
