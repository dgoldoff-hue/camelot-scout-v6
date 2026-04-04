/**
 * Proposal Generation Engine
 * Generates structured proposal data from Building records for PDF rendering.
 */

import type { Building, Contact } from '@/types';

// ============================================================
// Company Constants
// ============================================================

export const CAMELOT_INFO = {
  name: 'Camelot Property Management Services Corp',
  address: '477 Madison Ave, 6th Fl, New York, NY 10022',
  phone: '(212) 206-9939',
  website: 'www.camelot.nyc',
  licenses: [
    { entity: 'Camelot Brokerage Services Corp', number: '#10311208308' },
    { entity: 'Camelot Realty Group LLC', number: '#10491200104' },
  ],
  portfolio: {
    buildings: '130+',
    sqft: '1.2M',
    description: '130+ building portfolio spanning 1.2M sq ft across NYC',
  },
};

export const COMPETITIVE_ADVANTAGES = [
  {
    title: 'Proven Portfolio',
    description: `Currently managing ${CAMELOT_INFO.portfolio.buildings} buildings and ${CAMELOT_INFO.portfolio.sqft} sq ft of residential and commercial property across all five boroughs.`,
  },
  {
    title: 'Technology-Driven Operations',
    description:
      'Proprietary building intelligence platform with real-time violation monitoring, automated compliance tracking, and resident communication via ConciergePlus.',
  },
  {
    title: 'Personal Attention',
    description:
      'Unlike large firms where your building is one of thousands, our principals personally oversee every property. Weekly on-site inspections are standard, not optional.',
  },
  {
    title: 'Financial Transparency',
    description:
      'Real-time budget tracking, monthly board reporting with full financials, zero hidden bank fees. Your money works for your building.',
  },
  {
    title: 'Vendor Network',
    description:
      '20+ years of cultivated vendor relationships deliver better pricing and faster response times for maintenance, capital projects, and emergency repairs.',
  },
  {
    title: 'Compliance Expertise',
    description:
      'Proactive violation resolution, Local Law 97 energy compliance planning, DOB permit management, and regulatory reporting — keeping your building ahead of deadlines.',
  },
];

// ============================================================
// Pricing Logic
// ============================================================

export interface PricingBreakdown {
  baseRate: number;
  baseRateLabel: string;
  rentStabilizedSurcharge: number;
  ll97Surcharge: number;
  totalPerUnit: number;
  totalMonthly: number;
  totalAnnual: number;
  units: number;
}

export function calculatePricing(
  units: number,
  options?: { rentStabilized?: boolean; ll97Services?: boolean }
): PricingBreakdown {
  let baseRate: number;
  let baseRateLabel: string;

  if (units < 30) {
    baseRate = 65;
    baseRateLabel = 'Boutique (under 30 units)';
  } else if (units <= 75) {
    baseRate = 50;
    baseRateLabel = 'Mid-size (30–75 units)';
  } else if (units <= 150) {
    baseRate = 42;
    baseRateLabel = 'Large (75–150 units)';
  } else {
    baseRate = 35;
    baseRateLabel = 'Portfolio (150+ units)';
  }

  const rentStabilizedSurcharge = options?.rentStabilized ? 5 : 0;
  const ll97Surcharge = options?.ll97Services ? 3 : 0;
  const totalPerUnit = baseRate + rentStabilizedSurcharge + ll97Surcharge;
  const totalMonthly = totalPerUnit * units;
  const totalAnnual = totalMonthly * 12;

  return {
    baseRate,
    baseRateLabel,
    rentStabilizedSurcharge,
    ll97Surcharge,
    totalPerUnit,
    totalMonthly,
    totalAnnual,
    units,
  };
}

// ============================================================
// Service Catalog
// ============================================================

export interface ServiceItem {
  name: string;
  description: string;
  included: boolean;
}

export const STANDARD_SERVICES: ServiceItem[] = [
  { name: 'Property Management', description: 'Day-to-day building operations, staff oversight, vendor management', included: true },
  { name: 'Financial Management', description: 'Budgeting, accounts payable/receivable, monthly board reporting', included: true },
  { name: 'Violation Resolution', description: 'HPD, DOB, and ECB violation tracking, resolution, and dismissal', included: true },
  { name: 'Maintenance Coordination', description: 'Work order management, preventive maintenance scheduling', included: true },
  { name: 'Resident Communication', description: 'ConciergePlus portal, package tracking, announcements', included: true },
  { name: 'Insurance Administration', description: 'Policy review, claims management, certificate tracking', included: true },
  { name: 'Capital Planning', description: 'Reserve fund analysis, project management, contractor procurement', included: true },
  { name: 'Compliance & Reporting', description: 'Annual filings, Local Law compliance, DHCR submissions', included: true },
];

export const PREMIUM_SERVICES: ServiceItem[] = [
  { name: 'LL97 Energy Compliance', description: 'Carbon emissions tracking, retrofit planning, penalty avoidance strategy', included: false },
  { name: 'Rent Stabilization Admin', description: 'DHCR filings, MCI applications, rent roll management', included: false },
  { name: 'Construction Management', description: 'Major capital project oversight, bid solicitation, schedule management', included: false },
  { name: 'Legal Coordination', description: 'Attorney liaison for building-related legal matters', included: false },
];

// ============================================================
// Proposal Data Structure
// ============================================================

export interface ProposalSection {
  id: string;
  title: string;
  enabled: boolean;
}

export const DEFAULT_SECTIONS: ProposalSection[] = [
  { id: 'executive_summary', title: 'Executive Summary', enabled: true },
  { id: 'building_analysis', title: 'Building Analysis', enabled: true },
  { id: 'management_assessment', title: 'Current Management Assessment', enabled: true },
  { id: 'services_overview', title: 'Camelot Services Overview', enabled: true },
  { id: 'pricing', title: 'Pricing Estimate', enabled: true },
  { id: 'why_camelot', title: 'Why Camelot', enabled: true },
  { id: 'next_steps', title: 'Next Steps', enabled: true },
];

export interface ProposalData {
  // Meta
  generatedAt: string;
  proposalNumber: string;

  // Building
  buildingAddress: string;
  buildingName?: string;
  buildingType: string;
  borough?: string;
  neighborhood?: string;
  units: number;
  yearBuilt?: number;
  stories?: number;
  buildingClass?: string;

  // Contact
  contactName?: string;
  contactEmail?: string;

  // Analysis
  violationsCount: number;
  openViolationsCount: number;
  lastViolationDate?: string;
  energyStarScore?: number;
  siteEUI?: number;
  ghgEmissions?: number;
  currentManagement?: string;
  dofOwner?: string;
  marketValue?: number;
  assessedValue?: number;

  // Scoring
  score: number;
  grade: string;
  signals: string[];

  // Sections
  sections: ProposalSection[];

  // Pricing
  pricing: PricingBreakdown;

  // Services
  standardServices: ServiceItem[];
  premiumServices: ServiceItem[];

  // Company
  company: typeof CAMELOT_INFO;
  advantages: typeof COMPETITIVE_ADVANTAGES;
}

// ============================================================
// Proposal Options
// ============================================================

export interface ProposalOptions {
  contactName?: string;
  contactEmail?: string;
  rentStabilized?: boolean;
  ll97Services?: boolean;
  sections?: ProposalSection[];
  customPricingPerUnit?: number;
}

// ============================================================
// Generator
// ============================================================

function generateProposalNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `CML-${y}${m}${d}-${seq}`;
}

export function generateProposalData(
  building: Building,
  options?: ProposalOptions
): ProposalData {
  const units = building.units || 1;

  // Determine if rent stabilized or LL97 applies based on building data or options
  const rentStabilized = options?.rentStabilized ?? (building.type === 'rental' && units >= 6);
  const ll97Services =
    options?.ll97Services ??
    (building.energy_star_score != null && building.energy_star_score < 50);

  const pricing = options?.customPricingPerUnit
    ? {
        baseRate: options.customPricingPerUnit,
        baseRateLabel: 'Custom',
        rentStabilizedSurcharge: rentStabilized ? 5 : 0,
        ll97Surcharge: ll97Services ? 3 : 0,
        totalPerUnit:
          options.customPricingPerUnit + (rentStabilized ? 5 : 0) + (ll97Services ? 3 : 0),
        totalMonthly:
          (options.customPricingPerUnit + (rentStabilized ? 5 : 0) + (ll97Services ? 3 : 0)) *
          units,
        totalAnnual:
          (options.customPricingPerUnit + (rentStabilized ? 5 : 0) + (ll97Services ? 3 : 0)) *
          units *
          12,
        units,
      }
    : calculatePricing(units, { rentStabilized, ll97Services });

  // Build premium services with correct "included" flags
  const premiumServices = PREMIUM_SERVICES.map((s) => ({
    ...s,
    included:
      (s.name === 'LL97 Energy Compliance' && ll97Services) ||
      (s.name === 'Rent Stabilization Admin' && rentStabilized) ||
      s.included,
  }));

  // Pick first suitable contact if none provided
  const contact: Contact | undefined =
    options?.contactName
      ? undefined
      : building.contacts?.find((c) => c.email) ?? building.contacts?.[0];

  const sections = options?.sections ?? DEFAULT_SECTIONS;

  return {
    generatedAt: new Date().toISOString(),
    proposalNumber: generateProposalNumber(),

    buildingAddress: building.address,
    buildingName: building.name,
    buildingType: building.type,
    borough: building.borough,
    neighborhood: building.region,
    units,
    yearBuilt: building.year_built,
    stories: building.stories,
    buildingClass: building.building_class,

    contactName: options?.contactName ?? contact?.name,
    contactEmail: options?.contactEmail ?? contact?.email,

    violationsCount: building.violations_count ?? 0,
    openViolationsCount: building.open_violations_count ?? 0,
    lastViolationDate: building.last_violation_date,
    energyStarScore: building.energy_star_score,
    siteEUI: building.site_eui,
    ghgEmissions: building.ghg_emissions,
    currentManagement: building.current_management,
    dofOwner: building.dof_owner,
    marketValue: building.market_value,
    assessedValue: building.assessed_value,

    score: building.score,
    grade: building.grade,
    signals: building.signals ?? [],

    sections,
    pricing,

    standardServices: [...STANDARD_SERVICES],
    premiumServices,

    company: CAMELOT_INFO,
    advantages: COMPETITIVE_ADVANTAGES,
  };
}
