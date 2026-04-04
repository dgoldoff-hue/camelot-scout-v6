-- Camelot Scout v6 — Complete Database Schema
-- Run against your Supabase Postgres instance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

------------------------------------------------------------
-- ENUM TYPES
------------------------------------------------------------
CREATE TYPE building_type AS ENUM ('co-op', 'condo', 'rental', 'mixed-use', 'commercial', 'other');
CREATE TYPE building_grade AS ENUM ('A', 'B', 'C');
CREATE TYPE pipeline_stage AS ENUM (
  'discovered', 'scored', 'contacted', 'nurture',
  'proposal', 'negotiation', 'won', 'lost'
);
CREATE TYPE team_role AS ENUM ('owner', 'tech_lead', 'cold_caller', 'operations', 'team');
CREATE TYPE bot_status AS ENUM ('active', 'paused', 'error', 'idle');
CREATE TYPE outreach_status AS ENUM ('draft', 'sent', 'delivered', 'opened', 'replied', 'bounced');

------------------------------------------------------------
-- TEAM TABLE
------------------------------------------------------------
CREATE TABLE scout_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role team_role NOT NULL DEFAULT 'team',
  initials TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

------------------------------------------------------------
-- SCANS TABLE
------------------------------------------------------------
CREATE TABLE scout_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  regions TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  building_types building_type[] DEFAULT '{}',
  min_units INT,
  max_units INT,
  year_built_min INT,
  year_built_max INT,
  violation_threshold INT,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  results_count INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES scout_team(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

------------------------------------------------------------
-- BUILDINGS TABLE (core)
------------------------------------------------------------
CREATE TABLE scout_buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  address TEXT NOT NULL,
  name TEXT,
  borough TEXT,
  region TEXT,
  neighborhood TEXT,
  zip_code TEXT,
  
  -- Building details
  units INT,
  type building_type DEFAULT 'other',
  year_built INT,
  lot_area NUMERIC,
  building_area NUMERIC,
  stories INT,
  building_class TEXT,
  
  -- Scoring
  grade building_grade DEFAULT 'C',
  score INT DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  signals TEXT[] DEFAULT '{}',
  
  -- Contacts — CRITICAL: board members, owners, supers, etc.
  contacts JSONB DEFAULT '[]',
  -- Structure: [{name, role, phone, email, linkedin, source, verified_at}]
  
  -- Enriched data from APIs
  enriched_data JSONB DEFAULT '{}',
  -- {hpd: {...}, dof: {...}, dob: {...}, ll97: {...}, apollo: {...}}
  
  -- Management
  current_management TEXT,
  source TEXT, -- 'nyc_open_data', 'import', 'manual', 'ai_research'
  status TEXT DEFAULT 'active', -- active, archived, dismissed
  archive_reason TEXT,
  archived_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES scout_team(id),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Pipeline
  pipeline_stage pipeline_stage DEFAULT 'discovered',
  pipeline_moved_at TIMESTAMPTZ DEFAULT now(),
  
  -- HubSpot integration
  hubspot_deal_id TEXT,
  hubspot_contact_id TEXT,
  hubspot_synced_at TIMESTAMPTZ,
  
  -- NYC-specific IDs
  bbl TEXT, -- Borough-Block-Lot
  bin TEXT, -- Building Identification Number
  hpd_building_id TEXT,
  
  -- Violation summary (cached)
  violations_count INT DEFAULT 0,
  open_violations_count INT DEFAULT 0,
  last_violation_date DATE,
  
  -- Financial data (DOF)
  market_value NUMERIC,
  assessed_value NUMERIC,
  land_value NUMERIC,
  tax_class TEXT,
  dof_owner TEXT,
  
  -- Energy/LL97
  energy_star_score INT,
  site_eui NUMERIC,
  ghg_emissions NUMERIC,
  occupancy_pct NUMERIC,
  
  -- Metadata
  scan_id UUID REFERENCES scout_scans(id),
  folder_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_buildings_address ON scout_buildings USING gin (address gin_trgm_ops);
CREATE INDEX idx_buildings_borough ON scout_buildings(borough);
CREATE INDEX idx_buildings_region ON scout_buildings(region);
CREATE INDEX idx_buildings_grade ON scout_buildings(grade);
CREATE INDEX idx_buildings_score ON scout_buildings(score DESC);
CREATE INDEX idx_buildings_pipeline ON scout_buildings(pipeline_stage);
CREATE INDEX idx_buildings_status ON scout_buildings(status);
CREATE INDEX idx_buildings_assigned ON scout_buildings(assigned_to);
CREATE INDEX idx_buildings_bbl ON scout_buildings(bbl);
CREATE INDEX idx_buildings_scan ON scout_buildings(scan_id);

------------------------------------------------------------
-- SAVED SEARCH FOLDERS
------------------------------------------------------------
CREATE TABLE scout_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C5A55A',
  created_by UUID REFERENCES scout_team(id),
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scout_folder_buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES scout_folders(id) ON DELETE CASCADE,
  building_id UUID REFERENCES scout_buildings(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID REFERENCES scout_team(id),
  UNIQUE(folder_id, building_id)
);

------------------------------------------------------------
-- SAVED SEARCHES
------------------------------------------------------------
CREATE TABLE scout_saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES scout_team(id),
  last_run_at TIMESTAMPTZ,
  results_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

------------------------------------------------------------
-- ACTIVITIES (timeline for buildings)
------------------------------------------------------------
CREATE TABLE scout_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID REFERENCES scout_buildings(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'scan', 'email', 'call', 'note', 'pipeline_move', 'enrichment', 'export', 'crm_sync'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES scout_team(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_building ON scout_activities(building_id);
CREATE INDEX idx_activities_type ON scout_activities(type);
CREATE INDEX idx_activities_created ON scout_activities(created_at DESC);

------------------------------------------------------------
-- OUTREACH TEMPLATES
------------------------------------------------------------
CREATE TABLE scout_outreach_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'cold', 'followup', 'nurture', 'proposal', 'complimentary'
  variables TEXT[] DEFAULT '{}', -- available template variables
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES scout_team(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

------------------------------------------------------------
-- OUTREACH LOG
------------------------------------------------------------
CREATE TABLE scout_outreach_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID REFERENCES scout_buildings(id) ON DELETE CASCADE,
  template_id UUID REFERENCES scout_outreach_templates(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status outreach_status DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  sent_by UUID REFERENCES scout_team(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outreach_building ON scout_outreach_log(building_id);
CREATE INDEX idx_outreach_status ON scout_outreach_log(status);

------------------------------------------------------------
-- CHAT MESSAGES (Scout AI)
------------------------------------------------------------
CREATE TABLE scout_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES scout_team(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_session ON scout_chat_messages(session_id);
CREATE INDEX idx_chat_created ON scout_chat_messages(created_at);

------------------------------------------------------------
-- AI BOTS
------------------------------------------------------------
CREATE TABLE scout_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'cold_caller', 'follow_up', 'system_health', 'auto_enrichment'
  status bot_status DEFAULT 'idle',
  config JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  tasks_completed INT DEFAULT 0,
  tasks_queued INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scout_bot_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id UUID REFERENCES scout_bots(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running', -- running, completed, failed
  results JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT
);

------------------------------------------------------------
-- APP SETTINGS
------------------------------------------------------------
CREATE TABLE scout_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES scout_team(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

------------------------------------------------------------
-- ROW LEVEL SECURITY
------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE scout_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_folder_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_bot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_settings ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can access all team data
CREATE POLICY "Team members can view all team data" ON scout_team
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access buildings" ON scout_buildings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access scans" ON scout_scans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access activities" ON scout_activities
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access templates" ON scout_outreach_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access outreach" ON scout_outreach_log
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access saved searches" ON scout_saved_searches
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can access their chat messages" ON scout_chat_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access folders" ON scout_folders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access folder buildings" ON scout_folder_buildings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access bots" ON scout_bots
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access bot runs" ON scout_bot_runs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access settings" ON scout_settings
  FOR ALL USING (auth.role() = 'authenticated');

------------------------------------------------------------
-- SEED DATA: Default team members
------------------------------------------------------------
INSERT INTO scout_team (name, email, role, initials) VALUES
  ('David Goldoff', 'david@camelotmgt.com', 'owner', 'DG'),
  ('Sam Lodge', 'sam@camelotmgt.com', 'tech_lead', 'SL'),
  ('Carl', 'carl@camelotmgt.com', 'cold_caller', 'CA'),
  ('Luigi', 'luigi@camelotmgt.com', 'operations', 'LU'),
  ('Jake', 'jake@camelotmgt.com', 'team', 'JK'),
  ('Valerie', 'valerie@camelotmgt.com', 'team', 'VA'),
  ('Spencer', 'spencer@camelotmgt.com', 'team', 'SP'),
  ('Danielle', 'danielle@camelotmgt.com', 'team', 'DA'),
  ('Merlin', 'merlin@camelotmgt.com', 'tech_lead', 'ME');

------------------------------------------------------------
-- SEED DATA: Default outreach templates
------------------------------------------------------------
INSERT INTO scout_outreach_templates (name, subject, body, category, variables, is_default) VALUES
(
  'Cold Outreach — David''s Template',
  'Property Management Services for {building_name}',
  E'Dear {contact_name},\n\nMy name is David Goldoff, and I''m the principal of Camelot Realty Group. I''m reaching out because I noticed {building_name} at {address} — a {unit_count}-unit {building_type} in {borough} — and I believe we can provide exceptional management services for your property.\n\nWith {violations_count} open HPD violations on record, I understand the challenges of maintaining a well-run building in New York City. At Camelot, we take a hands-on approach:\n\n• **Personal Attention:** I personally oversee every property in our portfolio\n• **Weekly Inspections:** On-site walkthroughs to catch issues before they become violations\n• **Technology-Forward:** We use ConciergePlus for seamless resident communication\n• **Transparent Financials:** Real-time budget tracking with monthly board reporting\n• **Compliance & Reporting:** Proactive violation resolution and regulatory compliance\n• **Local Resources:** 20+ years of vendor relationships across the tri-state area\n• **Zero Bank Fees:** We never charge bank fees — your money works for your building\n\nI''d love to schedule a 15-minute call to discuss how Camelot can serve {building_name}. Would this week work for you?\n\nBest regards,\nDavid Goldoff\nPrincipal, Camelot Realty Group\n501 Madison Avenue, Suite 1400\nNew York, NY 10022\n(212) 555-0100',
  'cold',
  ARRAY['building_name', 'address', 'unit_count', 'building_type', 'borough', 'violations_count', 'contact_name', 'current_management'],
  true
),
(
  '30-Day Complimentary Service',
  'Complimentary Property Evaluation — {building_name}',
  E'Dear {contact_name},\n\nFollowing up on my earlier note about {building_name} at {address} — I''d like to offer something unusual:\n\n**A complimentary 30-day property evaluation at no cost and no obligation.**\n\nDuring this period, our team will:\n• Conduct a full building inspection\n• Review your current vendor contracts for savings opportunities\n• Audit your HPD violation status and create a resolution plan\n• Provide a detailed capital improvement recommendation\n• Deliver a comprehensive management proposal\n\nWe''re confident that once you see the Camelot difference, the decision will be easy. But there''s absolutely no pressure — this is our way of demonstrating value upfront.\n\nShall I schedule a walkthrough this week?\n\nBest regards,\nDavid Goldoff\nCamelot Realty Group',
  'complimentary',
  ARRAY['building_name', 'address', 'contact_name'],
  false
),
(
  'Follow-Up Nurture',
  'Following Up — {building_name} Management',
  E'Hi {contact_name},\n\nI wanted to follow up on my previous message regarding management services for {building_name}.\n\nI understand these decisions take time, and I respect that. If it would be helpful, I''m happy to:\n• Share references from similar buildings we manage\n• Provide a no-obligation property assessment\n• Simply answer any questions you might have\n\nOur door is always open. When the timing is right, we''d love to earn your business.\n\nWarm regards,\nDavid Goldoff\nCamelot Realty Group',
  'nurture',
  ARRAY['building_name', 'contact_name'],
  false
);

------------------------------------------------------------
-- SEED DATA: Default bots
------------------------------------------------------------
INSERT INTO scout_bots (name, description, type, status) VALUES
  ('Cold Caller Bot', 'Auto-generates call scripts for top-scoring leads. Prioritizes buildings with high violation counts and no current management.', 'cold_caller', 'idle'),
  ('Follow-Up Bot', 'Monitors the nurture pipeline and suggests follow-up actions based on time-in-stage and engagement signals.', 'follow_up', 'idle'),
  ('System Health Bot', 'Monitors API connections, data freshness, and system performance. Alerts on failures.', 'system_health', 'idle'),
  ('Auto-Enrichment Bot', 'Automatically enriches new buildings with Apollo/Prospeo contact data and NYC API information.', 'auto_enrichment', 'idle');

------------------------------------------------------------
-- FUNCTIONS
------------------------------------------------------------

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_buildings_updated
  BEFORE UPDATE ON scout_buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_team_updated
  BEFORE UPDATE ON scout_team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_templates_updated
  BEFORE UPDATE ON scout_outreach_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bots_updated
  BEFORE UPDATE ON scout_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Pipeline stage change tracking
CREATE OR REPLACE FUNCTION track_pipeline_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    NEW.pipeline_moved_at = now();
    INSERT INTO scout_activities (building_id, type, title, description, metadata)
    VALUES (
      NEW.id,
      'pipeline_move',
      'Pipeline stage changed',
      format('Moved from %s to %s', OLD.pipeline_stage, NEW.pipeline_stage),
      jsonb_build_object('from', OLD.pipeline_stage::text, 'to', NEW.pipeline_stage::text)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pipeline_change
  BEFORE UPDATE ON scout_buildings
  FOR EACH ROW EXECUTE FUNCTION track_pipeline_change();
