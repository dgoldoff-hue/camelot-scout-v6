-- Camelot Scout v6 — Proposals Table
-- Stores generated property management proposals

CREATE TABLE IF NOT EXISTS scout_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES scout_buildings(id),
  building_address TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  pricing_per_unit NUMERIC,
  total_monthly NUMERIC,
  total_annual NUMERIC,
  sections JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by building
CREATE INDEX IF NOT EXISTS idx_scout_proposals_building_id ON scout_proposals(building_id);

-- Index for listing by status
CREATE INDEX IF NOT EXISTS idx_scout_proposals_status ON scout_proposals(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_scout_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scout_proposals_updated_at
  BEFORE UPDATE ON scout_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_scout_proposals_updated_at();

-- RLS (enable if using Supabase auth)
ALTER TABLE scout_proposals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (adjust as needed)
CREATE POLICY "Authenticated users can manage proposals"
  ON scout_proposals
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
