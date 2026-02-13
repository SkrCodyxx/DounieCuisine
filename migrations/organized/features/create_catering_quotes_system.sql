-- Table pour les demandes de devis traiteur
CREATE TABLE IF NOT EXISTS catering_quotes (
  id SERIAL PRIMARY KEY,
  
  -- Informations événement
  event_type VARCHAR(50) NOT NULL,
  guest_count INTEGER NOT NULL,
  event_date DATE,
  event_time VARCHAR(10),
  location VARCHAR(200),
  budget_range VARCHAR(50),
  
  -- Informations client
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Détails
  message TEXT,
  selected_items JSONB, -- Pour stocker les plats sélectionnés du configurateur
  estimated_price DECIMAL(10, 2),
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, quoted, confirmed, cancelled
  admin_notes TEXT,
  quote_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour recherche et filtrage
CREATE INDEX IF NOT EXISTS idx_catering_quotes_status ON catering_quotes(status);
CREATE INDEX IF NOT EXISTS idx_catering_quotes_created_at ON catering_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_catering_quotes_event_date ON catering_quotes(event_date);
CREATE INDEX IF NOT EXISTS idx_catering_quotes_email ON catering_quotes(customer_email);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_catering_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_catering_quotes_updated_at
  BEFORE UPDATE ON catering_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_catering_quotes_updated_at();
