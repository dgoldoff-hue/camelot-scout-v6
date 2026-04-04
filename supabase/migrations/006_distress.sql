-- 006: Financial Distress + Tax Abatement Tracking
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS distress_score NUMERIC;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS distress_level TEXT;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS distress_signals JSONB DEFAULT '[]';
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS abatement_type TEXT;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS abatement_expiration DATE;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS abatement_tax_impact NUMERIC;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS mortgage_count INTEGER;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS last_mortgage_date DATE;
ALTER TABLE scout_buildings ADD COLUMN IF NOT EXISTS last_mortgage_amount NUMERIC;

CREATE INDEX idx_scout_buildings_distress ON scout_buildings(distress_level);
CREATE INDEX idx_scout_buildings_abatement ON scout_buildings(abatement_expiration);
