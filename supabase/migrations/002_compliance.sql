-- LL97 Compliance columns for scout_buildings
-- Stores calculated penalty estimates and compliance status

ALTER TABLE scout_buildings
  ADD COLUMN IF NOT EXISTS ll97_penalty_estimate NUMERIC,
  ADD COLUMN IF NOT EXISTS ll97_compliance_status TEXT,
  ADD COLUMN IF NOT EXISTS ll97_period TEXT,
  ADD COLUMN IF NOT EXISTS ll97_emissions_limit NUMERIC,
  ADD COLUMN IF NOT EXISTS ll97_actual_emissions NUMERIC;

-- Index for filtering non-compliant buildings
CREATE INDEX IF NOT EXISTS idx_scout_buildings_ll97_status
  ON scout_buildings (ll97_compliance_status)
  WHERE ll97_compliance_status IS NOT NULL;

COMMENT ON COLUMN scout_buildings.ll97_penalty_estimate IS 'Estimated annual LL97 penalty in USD';
COMMENT ON COLUMN scout_buildings.ll97_compliance_status IS 'Compliant | At Risk | Non-Compliant';
COMMENT ON COLUMN scout_buildings.ll97_period IS 'period1 (2024-2029) or period2 (2030-2034)';
COMMENT ON COLUMN scout_buildings.ll97_emissions_limit IS 'Building CO2 emissions limit in metric tons CO2e';
COMMENT ON COLUMN scout_buildings.ll97_actual_emissions IS 'Estimated actual CO2 emissions in metric tons CO2e';
