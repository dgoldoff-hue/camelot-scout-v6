// ============================================================
// Camelot Scout v6 — Type Definitions
// ============================================================

export type BuildingType = 'co-op' | 'condo' | 'rental' | 'mixed-use' | 'commercial' | 'other';
export type BuildingGrade = 'A' | 'B' | 'C';
export type PipelineStage = 'discovered' | 'scored' | 'contacted' | 'nurture' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type TeamRole = 'owner' | 'tech_lead' | 'cold_caller' | 'operations' | 'team';
export type BotStatus = 'active' | 'paused' | 'error' | 'idle';
export type OutreachStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';

export interface Contact {
  name: string;
  role: string; // Board President, Treasurer, Secretary, Owner, Super, Resident Manager, Managing Agent
  phone?: string;
  email?: string;
  linkedin?: string;
  source?: string;
  verified_at?: string;
}

export interface Building {
  id: string;
  address: string;
  name?: string;
  borough?: string;
  region?: string;
  neighborhood?: string;
  zip_code?: string;
  units?: number;
  type: BuildingType;
  year_built?: number;
  lot_area?: number;
  building_area?: number;
  stories?: number;
  building_class?: string;
  grade: BuildingGrade;
  score: number;
  signals: string[];
  contacts: Contact[];
  enriched_data: Record<string, any>;
  current_management?: string;
  source?: string;
  status: string;
  archive_reason?: string;
  archived_at?: string;
  assigned_to?: string;
  notes?: string;
  tags: string[];
  pipeline_stage: PipelineStage;
  pipeline_moved_at?: string;
  hubspot_deal_id?: string;
  hubspot_contact_id?: string;
  hubspot_synced_at?: string;
  bbl?: string;
  bin?: string;
  hpd_building_id?: string;
  violations_count: number;
  open_violations_count: number;
  last_violation_date?: string;
  market_value?: number;
  assessed_value?: number;
  land_value?: number;
  tax_class?: string;
  dof_owner?: string;
  energy_star_score?: number;
  site_eui?: number;
  ghg_emissions?: number;
  occupancy_pct?: number;
  scan_id?: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  role: TeamRole;
  initials: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  name?: string;
  regions: string[];
  filters: Record<string, any>;
  building_types: BuildingType[];
  min_units?: number;
  max_units?: number;
  year_built_min?: number;
  year_built_max?: number;
  violation_threshold?: number;
  status: string;
  results_count: number;
  started_at?: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  building_id: string;
  type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  performed_by?: string;
  created_at: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string[];
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachLog {
  id: string;
  building_id: string;
  template_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_role?: string;
  subject: string;
  body: string;
  status: OutreachStatus;
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  bounced_at?: string;
  sent_by?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  user_id?: string;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_by?: string;
  shared_with: string[];
  created_at: string;
  updated_at: string;
  building_count?: number;
}

export interface Bot {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: BotStatus;
  config: Record<string, any>;
  last_run_at?: string;
  tasks_completed: number;
  tasks_queued: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface BotRun {
  id: string;
  bot_id: string;
  status: string;
  results: Record<string, any>;
  started_at: string;
  completed_at?: string;
  error?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  regions: string[];
  created_by?: string;
  last_run_at?: string;
  results_count: number;
  created_at: string;
}

// NYC API Response Types
export interface HPDViolation {
  violationid: string;
  boroid: string;
  block: string;
  lot: string;
  buildingid: string;
  registrationid: string;
  apartment: string;
  story: string;
  inspectiondate: string;
  approveddate: string;
  originalcertifybydate: string;
  originalcorrectbydate: string;
  novdescription: string;
  novpenaltybalance: string;
  currentstatus: string;
  currentstatusdate: string;
  violationstatus: string;
  class: string; // A, B, C
  ordernumber: string;
}

export interface DOFProperty {
  bbl: string;
  borough: string;
  block: string;
  lot: string;
  address: string;
  owner: string;
  bldgcl: string;
  taxclass: string;
  fullval: string;
  avland: string;
  avtot: string;
  yearbuilt: string;
  unitsres: string;
  unitstotal: string;
  lotarea: string;
  bldgarea: string;
  numfloors: string;
  numbldgs: string;
}

export interface DOBPermit {
  job_: string;
  job_doc_: string;
  job_type: string;
  job_status: string;
  job_status_descrp: string;
  filing_date: string;
  permit_type: string;
  permit_status: string;
  job_description: string;
  owner_s_first_name: string;
  owner_s_last_name: string;
  owner_s_business_name: string;
}

export interface LL97Energy {
  property_name: string;
  address_1: string;
  borough: string;
  postcode: string;
  energy_star_score: string;
  site_eui_kbtu_ft: string;
  total_ghg_emissions_metric_tons_co2e: string;
  occupancy: string;
  year_built: string;
  property_gfa_self_reported_ft: string;
}

// Region configuration
export interface RegionGroup {
  name: string;
  tag?: string; // 'LIVE' or 'AI-powered research'
  areas: string[];
}

// Search/filter state
export interface SearchFilters {
  query?: string;
  regions: string[];
  buildingTypes: BuildingType[];
  minUnits?: number;
  maxUnits?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  violationThreshold?: number;
  grades: BuildingGrade[];
  sortBy: 'score' | 'violations' | 'units' | 'newest';
  sortOrder: 'asc' | 'desc';
}

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'discovered', label: 'Discovered', color: '#64748b' },
  { key: 'scored', label: 'Scored', color: '#8b5cf6' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { key: 'nurture', label: 'Nurture', color: '#f59e0b' },
  { key: 'proposal', label: 'Proposal', color: '#C5A55A' },
  { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { key: 'won', label: 'Won', color: '#22c55e' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

export const GRADE_COLORS: Record<BuildingGrade, string> = {
  A: '#22c55e',
  B: '#f59e0b',
  C: '#94a3b8',
};
