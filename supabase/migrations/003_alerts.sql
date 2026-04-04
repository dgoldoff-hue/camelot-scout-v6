-- Scout Alerts — ownership changes, violation spikes, 311 surges, etc.
CREATE TABLE IF NOT EXISTS scout_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  building_id UUID REFERENCES scout_buildings(id),
  building_address TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scout_alerts_type ON scout_alerts(type);
CREATE INDEX idx_scout_alerts_severity ON scout_alerts(severity);
CREATE INDEX idx_scout_alerts_read ON scout_alerts(read);
