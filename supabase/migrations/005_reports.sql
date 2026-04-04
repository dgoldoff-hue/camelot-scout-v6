-- 005: Building Intelligence Reports + Lead Capture
CREATE TABLE IF NOT EXISTS scout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_address TEXT NOT NULL,
  building_bbl TEXT,
  report_data JSONB DEFAULT '{}',
  generated_by TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scout_report_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES scout_reports(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scout_reports_address ON scout_reports(building_address);
CREATE INDEX idx_scout_report_leads_email ON scout_report_leads(email);
