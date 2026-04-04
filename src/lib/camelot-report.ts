/**
 * Camelot Master Report System
 * Combines building intelligence + pitch deck + market data into one unified report.
 * Generates: HTML brochure, cold caller sheet, email drafts, CSV exports.
 */

import { fetchFullBuildingReport } from '@/lib/nyc-api';
import { calculateLL97Penalty, getComplianceStatus, inferBuildingType } from '@/lib/ll97-calculator';
import { analyzeDistress } from '@/lib/distress-signals';

// ============================================================
// Types
// ============================================================

export interface MasterReportData {
  address: string;
  borough: string;
  buildingName: string;
  date: string;
  // DOF
  units: number;
  stories: number;
  yearBuilt: number;
  buildingClass: string;
  taxClass: string;
  marketValue: number;
  assessedValue: number;
  landValue: number;
  lotArea: number;
  buildingArea: number;
  dofOwner: string;
  bbl: string;
  // Registration
  registrationOwner: string | null;
  managementCompany: string | null;
  // Violations
  violationsTotal: number;
  violationsOpen: number;
  violationClassA: number;
  violationClassB: number;
  violationClassC: number;
  lastViolationDate: string | null;
  // ECB
  ecbCount: number;
  ecbPenaltyBalance: number;
  // Permits
  permitsCount: number;
  hasRecentPermits: boolean;
  // Energy / LL97
  energyStarScore: number | null;
  siteEUI: number | null;
  ghgEmissions: number | null;
  occupancy: string | null;
  ll97: {
    period1Penalty: number;
    period2Penalty: number;
    totalExposure11yr: number;
    complianceStatus: string;
    buildingType: string;
    emissionsLimit: number;
    actualEmissions: number;
  } | null;
  // ACRIS
  lastSaleDate: string | null;
  lastSalePrice: number;
  lastSaleBuyer: string | null;
  lastSaleSeller: string | null;
  deedCount: number;
  mortgageCount: number;
  // Litigation
  litigationCount: number;
  hasActiveLitigation: boolean;
  // Rent Stabilization
  isRentStabilized: boolean;
  // Distress
  distressScore: number;
  distressLevel: string;
  distressSignals: Array<{ type: string; description: string; severity: string }>;
  // Scoring
  scoutScore: number;
  scoutGrade: string;
  // 311
  complaint311Count: number;
  // Pricing
  pricePerUnit: number;
  monthlyFee: number;
  annualFee: number;
  // Property classification
  propertyType: string;
  neighborhoodName: string;
  neighborhoodMarketData: NeighborhoodMarketData | null;
  // Management performance
  registrationDate: string | null;
  managementDuration: string | null;
  managementGrade: string;
  managementScorecard: { violations: number; compliance: number; financial: number; overall: number };
  // Building contacts
  boardMembers: Array<{ name: string; title: string }>;
  buildingStaff: Array<{ role: string; name: string }>;
  professionals: { lawFirm: string | null; accountingFirm: string | null; engineer: string | null; architect: string | null };
  // Raw data for advanced usage
  raw: any;
}

// ============================================================
// Neighborhood Market Data (Q1 2026 — from Camelot Market Report)
// ============================================================

export interface NeighborhoodMarketData {
  condoPSF: number; coopPSF: number; rentalPSFYr: number;
  median1BR: number; median2BR: number; daysOnMarket: number;
  investScore: number; liveScore: number; familyScore: number; workScore: number;
  momentum: string; opexRange: string;
}

const NEIGHBORHOOD_MARKET_DATA: Record<string, NeighborhoodMarketData> = {
  'harlem': { condoPSF: 892, coopPSF: 610, rentalPSFYr: 50, median1BR: 2950, median2BR: 3800, daysOnMarket: 18, investScore: 8.2, liveScore: 7.4, familyScore: 6.8, workScore: 7.6, momentum: 'Strong', opexRange: '$19–32/sqft/yr' },
  'manhattan valley': { condoPSF: 892, coopPSF: 610, rentalPSFYr: 50, median1BR: 2950, median2BR: 3800, daysOnMarket: 18, investScore: 8.2, liveScore: 7.4, familyScore: 6.8, workScore: 7.6, momentum: 'Strong', opexRange: '$19–32/sqft/yr' },
  'murray hill': { condoPSF: 1380, coopPSF: 980, rentalPSFYr: 75, median1BR: 4200, median2BR: 6100, daysOnMarket: 12, investScore: 7.8, liveScore: 8.2, familyScore: 7.0, workScore: 9.1, momentum: 'Moderate', opexRange: '$27–42/sqft/yr' },
  'nomad': { condoPSF: 1380, coopPSF: 980, rentalPSFYr: 75, median1BR: 4200, median2BR: 6100, daysOnMarket: 12, investScore: 7.8, liveScore: 8.2, familyScore: 7.0, workScore: 9.1, momentum: 'Moderate', opexRange: '$27–42/sqft/yr' },
  'stuyvesant': { condoPSF: 1250, coopPSF: 1050, rentalPSFYr: 65, median1BR: 3800, median2BR: 5600, daysOnMarket: 14, investScore: 7.6, liveScore: 8.4, familyScore: 7.5, workScore: 8.8, momentum: 'Moderate', opexRange: '$24–38/sqft/yr' },
  'gramercy': { condoPSF: 1250, coopPSF: 1050, rentalPSFYr: 65, median1BR: 3800, median2BR: 5600, daysOnMarket: 14, investScore: 7.6, liveScore: 8.4, familyScore: 7.5, workScore: 8.8, momentum: 'Moderate', opexRange: '$24–38/sqft/yr' },
  'hells kitchen': { condoPSF: 1180, coopPSF: 880, rentalPSFYr: 68, median1BR: 3600, median2BR: 5200, daysOnMarket: 16, investScore: 7.5, liveScore: 7.8, familyScore: 6.2, workScore: 9.0, momentum: 'Stable', opexRange: '$21–36/sqft/yr' },
  "hell's kitchen": { condoPSF: 1180, coopPSF: 880, rentalPSFYr: 68, median1BR: 3600, median2BR: 5200, daysOnMarket: 16, investScore: 7.5, liveScore: 7.8, familyScore: 6.2, workScore: 9.0, momentum: 'Stable', opexRange: '$21–36/sqft/yr' },
  'washington heights': { condoPSF: 560, coopPSF: 440, rentalPSFYr: 37, median1BR: 2100, median2BR: 2850, daysOnMarket: 22, investScore: 8.6, liveScore: 7.2, familyScore: 7.8, workScore: 6.4, momentum: 'Very Strong', opexRange: '$15–27/sqft/yr' },
  'inwood': { condoPSF: 560, coopPSF: 440, rentalPSFYr: 37, median1BR: 2100, median2BR: 2850, daysOnMarket: 22, investScore: 8.6, liveScore: 7.2, familyScore: 7.8, workScore: 6.4, momentum: 'Very Strong', opexRange: '$15–27/sqft/yr' },
  'sunnyside': { condoPSF: 660, coopPSF: 430, rentalPSFYr: 41, median1BR: 2400, median2BR: 3100, daysOnMarket: 15, investScore: 8.8, liveScore: 7.6, familyScore: 8.2, workScore: 7.2, momentum: 'Very Strong', opexRange: '$13–24/sqft/yr' },
  'woodside': { condoPSF: 660, coopPSF: 430, rentalPSFYr: 41, median1BR: 2400, median2BR: 3100, daysOnMarket: 15, investScore: 8.8, liveScore: 7.6, familyScore: 8.2, workScore: 7.2, momentum: 'Very Strong', opexRange: '$13–24/sqft/yr' },
  'greenpoint': { condoPSF: 1020, coopPSF: 720, rentalPSFYr: 55, median1BR: 3200, median2BR: 4400, daysOnMarket: 13, investScore: 8.4, liveScore: 8.6, familyScore: 7.9, workScore: 7.4, momentum: 'Strong', opexRange: '$17–28/sqft/yr' },
  'long island city': { condoPSF: 1090, coopPSF: 680, rentalPSFYr: 57, median1BR: 3450, median2BR: 4700, daysOnMarket: 11, investScore: 8.7, liveScore: 8.0, familyScore: 7.2, workScore: 8.8, momentum: 'Very Strong', opexRange: '$15–27/sqft/yr' },
  'lic': { condoPSF: 1090, coopPSF: 680, rentalPSFYr: 57, median1BR: 3450, median2BR: 4700, daysOnMarket: 11, investScore: 8.7, liveScore: 8.0, familyScore: 7.2, workScore: 8.8, momentum: 'Very Strong', opexRange: '$15–27/sqft/yr' },
  'upper east side': { condoPSF: 1620, coopPSF: 1140, rentalPSFYr: 82, median1BR: 4600, median2BR: 7200, daysOnMarket: 14, investScore: 6.8, liveScore: 8.8, familyScore: 9.2, workScore: 8.4, momentum: 'Stable', opexRange: '$30–50/sqft/yr' },
  'tribeca': { condoPSF: 2100, coopPSF: 1480, rentalPSFYr: 98, median1BR: 5200, median2BR: 8400, daysOnMarket: 10, investScore: 6.4, liveScore: 9.2, familyScore: 8.4, workScore: 8.6, momentum: 'Stable', opexRange: '$33–56/sqft/yr' },
  'soho': { condoPSF: 2100, coopPSF: 1480, rentalPSFYr: 98, median1BR: 5200, median2BR: 8400, daysOnMarket: 10, investScore: 6.4, liveScore: 9.2, familyScore: 8.4, workScore: 8.6, momentum: 'Stable', opexRange: '$33–56/sqft/yr' },
  'brooklyn heights': { condoPSF: 1280, coopPSF: 980, rentalPSFYr: 62, median1BR: 3600, median2BR: 5100, daysOnMarket: 12, investScore: 7.2, liveScore: 9.0, familyScore: 8.8, workScore: 8.2, momentum: 'Stable', opexRange: '$20–34/sqft/yr' },
  'park slope': { condoPSF: 1150, coopPSF: 820, rentalPSFYr: 53, median1BR: 3100, median2BR: 4600, daysOnMarket: 14, investScore: 7.4, liveScore: 9.1, familyScore: 9.4, workScore: 7.8, momentum: 'Moderate', opexRange: '$18–30/sqft/yr' },
  'east village': { condoPSF: 1350, coopPSF: 950, rentalPSFYr: 70, median1BR: 3500, median2BR: 5000, daysOnMarket: 11, investScore: 7.0, liveScore: 8.8, familyScore: 6.5, workScore: 8.5, momentum: 'Moderate', opexRange: '$24–38/sqft/yr' },
  'lower east side': { condoPSF: 1200, coopPSF: 850, rentalPSFYr: 65, median1BR: 3400, median2BR: 4800, daysOnMarket: 13, investScore: 7.5, liveScore: 8.5, familyScore: 6.0, workScore: 8.2, momentum: 'Strong', opexRange: '$22–36/sqft/yr' },
  'chelsea': { condoPSF: 1500, coopPSF: 1100, rentalPSFYr: 78, median1BR: 4100, median2BR: 6000, daysOnMarket: 12, investScore: 7.2, liveScore: 8.6, familyScore: 6.8, workScore: 9.0, momentum: 'Moderate', opexRange: '$27–42/sqft/yr' },
  'west village': { condoPSF: 1800, coopPSF: 1300, rentalPSFYr: 90, median1BR: 4800, median2BR: 7500, daysOnMarket: 11, investScore: 6.5, liveScore: 9.3, familyScore: 7.0, workScore: 8.4, momentum: 'Stable', opexRange: '$30–48/sqft/yr' },
  'astoria': { condoPSF: 700, coopPSF: 480, rentalPSFYr: 44, median1BR: 2500, median2BR: 3300, daysOnMarket: 14, investScore: 8.5, liveScore: 8.0, familyScore: 8.0, workScore: 7.5, momentum: 'Strong', opexRange: '$14–26/sqft/yr' },
  'midtown': { condoPSF: 1600, coopPSF: 1100, rentalPSFYr: 80, median1BR: 4400, median2BR: 6800, daysOnMarket: 13, investScore: 7.0, liveScore: 7.5, familyScore: 5.5, workScore: 9.5, momentum: 'Stable', opexRange: '$28–45/sqft/yr' },
  'upper west side': { condoPSF: 1500, coopPSF: 1050, rentalPSFYr: 75, median1BR: 4300, median2BR: 6500, daysOnMarket: 13, investScore: 7.0, liveScore: 8.9, familyScore: 9.0, workScore: 8.0, momentum: 'Stable', opexRange: '$28–44/sqft/yr' },
  'financial district': { condoPSF: 1400, coopPSF: 1000, rentalPSFYr: 72, median1BR: 4000, median2BR: 5800, daysOnMarket: 12, investScore: 7.3, liveScore: 7.8, familyScore: 6.0, workScore: 9.2, momentum: 'Moderate', opexRange: '$26–42/sqft/yr' },
  'fidi': { condoPSF: 1400, coopPSF: 1000, rentalPSFYr: 72, median1BR: 4000, median2BR: 5800, daysOnMarket: 12, investScore: 7.3, liveScore: 7.8, familyScore: 6.0, workScore: 9.2, momentum: 'Moderate', opexRange: '$26–42/sqft/yr' },
  'bushwick': { condoPSF: 580, coopPSF: 400, rentalPSFYr: 38, median1BR: 2200, median2BR: 2900, daysOnMarket: 16, investScore: 8.8, liveScore: 7.5, familyScore: 7.0, workScore: 7.0, momentum: 'Very Strong', opexRange: '$12–22/sqft/yr' },
  'bed-stuy': { condoPSF: 650, coopPSF: 450, rentalPSFYr: 42, median1BR: 2400, median2BR: 3200, daysOnMarket: 15, investScore: 8.6, liveScore: 7.8, familyScore: 7.5, workScore: 7.2, momentum: 'Strong', opexRange: '$14–25/sqft/yr' },
  'bedford-stuyvesant': { condoPSF: 650, coopPSF: 450, rentalPSFYr: 42, median1BR: 2400, median2BR: 3200, daysOnMarket: 15, investScore: 8.6, liveScore: 7.8, familyScore: 7.5, workScore: 7.2, momentum: 'Strong', opexRange: '$14–25/sqft/yr' },
  'williamsburg': { condoPSF: 1100, coopPSF: 780, rentalPSFYr: 60, median1BR: 3400, median2BR: 4800, daysOnMarket: 12, investScore: 7.8, liveScore: 8.8, familyScore: 7.2, workScore: 7.8, momentum: 'Moderate', opexRange: '$20–34/sqft/yr' },
  'bronx': { condoPSF: 420, coopPSF: 320, rentalPSFYr: 30, median1BR: 1800, median2BR: 2400, daysOnMarket: 20, investScore: 8.5, liveScore: 6.8, familyScore: 7.0, workScore: 6.5, momentum: 'Strong', opexRange: '$12–22/sqft/yr' },
  'jersey city': { condoPSF: 750, coopPSF: 500, rentalPSFYr: 48, median1BR: 2800, median2BR: 3600, daysOnMarket: 14, investScore: 8.5, liveScore: 8.2, familyScore: 7.8, workScore: 8.5, momentum: 'Strong', opexRange: '$14–26/sqft/yr' },
  'hoboken': { condoPSF: 850, coopPSF: 600, rentalPSFYr: 52, median1BR: 3000, median2BR: 4000, daysOnMarket: 12, investScore: 8.0, liveScore: 8.5, familyScore: 8.2, workScore: 8.3, momentum: 'Moderate', opexRange: '$16–28/sqft/yr' },
};

// ============================================================
// Building Classification
// ============================================================

function classifyBuildingType(buildingClass: string): string {
  if (!buildingClass) return 'Residential';
  const cls = buildingClass.toUpperCase().trim();
  const first = cls.charAt(0);
  if (cls.startsWith('R') && cls.length >= 2 && /[0-9]/.test(cls.charAt(1))) return 'Condominium';
  if (first === 'D') return 'Elevator Apartment';
  if (first === 'C') return 'Walk-Up Apartment';
  if (first === 'S') return 'Mixed-Use Residential';
  if (first === 'A') return 'One-Family Dwelling';
  if (first === 'B') return 'Two-Family Dwelling';
  if (first === 'H') return 'Hotel';
  if (first === 'O') return 'Office';
  if (first === 'K' || first === 'L') return 'Commercial / Retail';
  if (first === 'E' || first === 'F' || first === 'G') return 'Industrial / Warehouse';
  if (first === 'M') return 'Religious';
  if (first === 'N') return 'Asylum / Home';
  if (first === 'P') return 'Outdoor Recreation';
  if (first === 'Q') return 'Outdoor Recreation';
  if (first === 'W') return 'Educational';
  return 'Residential';
}

function detectNeighborhood(address: string, borough: string): string {
  const addr = (address + ' ' + borough).toLowerCase();
  // Try to match known neighborhoods from address keywords
  const patterns: [string, RegExp][] = [
    ['harlem', /harlem|w\s*1[12][0-9]|e\s*1[12][0-9]|adam clayton|frederic/i],
    ['washington heights', /washington\s*h|w\s*1[4-9][0-9]|w\s*[12][0-9]{2}/i],
    ['murray hill', /murray|e\s*3[2-9]|park\s*ave.*3[2-9]/i],
    ['gramercy', /gramercy|irving|e\s*2[0-3]/i],
    ['stuyvesant', /stuyvesant|stuyves/i],
    ['chelsea', /chelsea|w\s*1[4-9]\s|w\s*2[0-6]/i],
    ['east village', /east\s*vill|e\s*[2-9]\s/i],
    ['west village', /west\s*vill|w\s*[4-9]\s|bleecker|christopher/i],
    ['lower east side', /lower\s*east|les\b|rivington|delancey|orchard/i],
    ['soho', /soho|spring\s*st|prince\s*st|broome\s*st/i],
    ['tribeca', /tribeca|franklin\s*st|leonard\s*st|hudson\s*st/i],
    ["hell's kitchen", /hell.?s?\s*kitchen|w\s*[3-5][0-9].*(?:10|11)\s*av/i],
    ['midtown', /midtown|w\s*[3-5][0-9]|e\s*[3-5][0-9]/i],
    ['upper east side', /upper\s*east|e\s*[6-9][0-9]|york\s*ave/i],
    ['upper west side', /upper\s*west|w\s*[6-9][0-9]|central\s*park\s*w|columbus|amsterdam/i],
    ['financial district', /financial|fidi|wall\s*st|broad\s*st|water\s*st/i],
    ['greenpoint', /greenpoint|green\s*point/i],
    ['williamsburg', /williamsburg/i],
    ['park slope', /park\s*slope/i],
    ['brooklyn heights', /brooklyn\s*heights/i],
    ['bed-stuy', /bed.?stuy|bedford.?stuyves/i],
    ['bushwick', /bushwick/i],
    ['sunnyside', /sunnyside/i],
    ['woodside', /woodside/i],
    ['astoria', /astoria/i],
    ['long island city', /long\s*island\s*city|lic\b/i],
    ['jersey city', /jersey\s*city/i],
    ['hoboken', /hoboken/i],
  ];
  for (const [name, re] of patterns) {
    if (re.test(addr)) return name;
  }
  // Fallback: use borough
  const b = borough.toLowerCase();
  if (b.includes('manhattan')) return 'midtown';
  if (b.includes('brooklyn')) return 'brooklyn heights';
  if (b.includes('queens')) return 'astoria';
  if (b.includes('bronx')) return 'bronx';
  return '';
}

function lookupNeighborhoodData(neighborhood: string): NeighborhoodMarketData | null {
  if (!neighborhood) return null;
  const key = neighborhood.toLowerCase();
  return NEIGHBORHOOD_MARKET_DATA[key] || null;
}

function gradeManagement(d: { violationsOpen: number; ecbPenaltyBalance: number; hasActiveLitigation: boolean; permitsCount: number; violationsTotal: number }): { grade: string; scorecard: { violations: number; compliance: number; financial: number; overall: number } } {
  // Violations score: fewer = better (out of 100)
  let violScore = 100;
  if (d.violationsOpen > 50) violScore = 15;
  else if (d.violationsOpen > 20) violScore = 30;
  else if (d.violationsOpen > 10) violScore = 50;
  else if (d.violationsOpen > 5) violScore = 65;
  else if (d.violationsOpen > 0) violScore = 80;

  // Compliance score
  let compScore = 100;
  if (d.ecbPenaltyBalance > 50000) compScore = 20;
  else if (d.ecbPenaltyBalance > 20000) compScore = 40;
  else if (d.ecbPenaltyBalance > 5000) compScore = 60;
  else if (d.ecbPenaltyBalance > 0) compScore = 80;

  // Financial score (litigation + penalties)
  let finScore = 100;
  if (d.hasActiveLitigation) finScore -= 30;
  if (d.ecbPenaltyBalance > 10000) finScore -= 20;
  if (d.violationsTotal > 50) finScore -= 15;

  const overall = Math.round((violScore * 0.4) + (compScore * 0.35) + (finScore * 0.25));
  const grade = overall >= 85 ? 'A' : overall >= 70 ? 'B' : overall >= 55 ? 'C' : overall >= 40 ? 'D' : 'F';

  return { grade, scorecard: { violations: violScore, compliance: compScore, financial: Math.max(0, finScore), overall } };
}

// ============================================================
// Constants
// ============================================================

const CAMELOT = {
  name: 'Camelot Realty Group',
  shortName: 'Camelot Realty Group',
  address: '477 Madison Avenue, 6th Fl, New York, NY 10022',
  phone: '(212) 206-9939',
  mobile: '(646) 523-9068',
  email: 'dgoldoff@camelot.nyc',
  infoEmail: 'info@camelot.nyc',
  web: 'www.camelot.nyc',
  principal: 'David Goldoff',
  title: 'Founder & President',
  license1: 'Camelot Brokerage Services Corp #10311208308',
  license2: 'Camelot Realty Group LLC #10491200104',
};

// ============================================================
// Data Builder
// ============================================================

export async function buildMasterReport(address: string, borough?: string): Promise<MasterReportData> {
  const raw = await fetchFullBuildingReport(address, borough);

  const dof = raw.dof;
  const units = dof?.units || 0;
  const gfa = dof?.buildingArea || 0;

  // LL97 Calculation
  let ll97Data: MasterReportData['ll97'] = null;
  if (raw.energy && gfa > 0) {
    const bldgType = inferBuildingType(dof?.buildingClass || '');
    const ll97Input = {
      address,
      buildingType: bldgType as any,
      grossFloorArea: gfa,
      siteEUI: raw.energy.siteEUI || undefined,
      totalEmissions: raw.energy.ghgEmissions || undefined,
      energyStarScore: raw.energy.energyStarScore || undefined,
    };
    const penalty = calculateLL97Penalty(ll97Input);
    const status = getComplianceStatus(ll97Input);
    ll97Data = {
      period1Penalty: penalty.annualPenalty,
      period2Penalty: status.period2?.annualPenalty || 0,
      totalExposure11yr: (penalty.annualPenalty * 6) + ((status.period2?.annualPenalty || 0) * 5),
      complianceStatus: (status.worstStatus ?? penalty.complianceStatus ?? 'unknown') as string,
      buildingType: bldgType || 'multifamily_housing',
      emissionsLimit: penalty.emissionsLimitPerSqFt,
      actualEmissions: penalty.estimatedActualEmissions,
    };
  }

  // Distress
  const distressReport = analyzeDistress({
    acrisData: raw.acris || null,
    dofData: dof ? {
      assessedValue: dof.assessedValue,
      marketValue: dof.marketValue,
      taxClass: dof.taxClass,
      units: dof.units,
      stories: dof.stories,
    } : null,
    violations: raw.violations ? {
      total: raw.violations.total,
      open: raw.violations.open,
      items: raw.violations.items,
    } : null,
    ecbData: raw.ecb ? {
      violations: raw.ecb.violations,
      totalPenaltyBalance: raw.ecb.totalPenaltyBalance,
    } : null,
    litigation: raw.litigation ? {
      cases: raw.litigation.cases,
      hasActive: raw.litigation.hasActive,
    } : null,
  });

  // Violation class breakdown
  const items = raw.violations?.items || [];
  const classA = items.filter((v: any) => v.class === 'A').length;
  const classB = items.filter((v: any) => v.class === 'B').length;
  const classC = items.filter((v: any) => v.class === 'C').length;

  // Pricing
  let pricePerUnit = 50;
  if (units < 30) pricePerUnit = 65;
  else if (units <= 75) pricePerUnit = 50;
  else if (units <= 150) pricePerUnit = 42;
  else pricePerUnit = 35;
  if (raw.rentStabilization?.isStabilized) pricePerUnit += 5;
  if (ll97Data && ll97Data.complianceStatus !== 'compliant') pricePerUnit += 3;
  const monthlyFee = pricePerUnit * (units || 1);
  const annualFee = monthlyFee * 12;

  // Scout scoring (simplified)
  let score = 0;
  const violTotal = raw.violations?.total || 0;
  if (violTotal > 50) score += 30; else if (violTotal > 20) score += 22; else if (violTotal > 10) score += 15; else if (violTotal > 0) score += 8;
  if (units >= 100) score += 20; else if (units >= 50) score += 16; else if (units >= 30) score += 12; else if (units >= 10) score += 8;
  const mgmt = (raw.registration?.managementCompany || '').toLowerCase();
  if (!mgmt || mgmt === 'unknown') score += 20; else score += 10;
  if (raw.ecb?.totalPenaltyBalance > 10000) score += 10; else if (raw.ecb?.count > 0) score += 5;
  if (raw.litigation?.hasActive) score += 15;
  if (raw.rentStabilization?.isStabilized) score += 5;
  const grade = score >= 75 ? 'A' : score >= 50 ? 'B' : 'C';

  return {
    address,
    borough: borough || '',
    buildingName: raw.energy?.propertyName || address,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    units,
    stories: dof?.stories || 0,
    yearBuilt: dof?.yearBuilt || 0,
    buildingClass: dof?.buildingClass || '',
    taxClass: dof?.taxClass || '',
    marketValue: dof?.marketValue || 0,
    assessedValue: dof?.assessedValue || 0,
    landValue: dof?.landValue || 0,
    lotArea: dof?.lotArea || 0,
    buildingArea: gfa,
    dofOwner: dof?.owner || '',
    bbl: dof?.bbl || '',
    registrationOwner: raw.registration?.owner || null,
    managementCompany: raw.registration?.managementCompany || null,
    violationsTotal: raw.violations?.total || 0,
    violationsOpen: raw.violations?.open || 0,
    violationClassA: classA,
    violationClassB: classB,
    violationClassC: classC,
    lastViolationDate: raw.violations?.lastDate || null,
    ecbCount: raw.ecb?.count || 0,
    ecbPenaltyBalance: raw.ecb?.totalPenaltyBalance || 0,
    permitsCount: raw.permits?.count || 0,
    hasRecentPermits: raw.permits?.hasRecent || false,
    energyStarScore: raw.energy?.energyStarScore ?? null,
    siteEUI: raw.energy?.siteEUI ?? null,
    ghgEmissions: raw.energy?.ghgEmissions ?? null,
    occupancy: raw.energy?.occupancy ?? null,
    ll97: ll97Data,
    lastSaleDate: raw.acris?.lastSaleDate || null,
    lastSalePrice: raw.acris?.lastSalePrice || 0,
    lastSaleBuyer: raw.acris?.lastSaleBuyer || null,
    lastSaleSeller: raw.acris?.lastSaleSeller || null,
    deedCount: raw.acris?.deeds?.length || 0,
    mortgageCount: raw.acris?.mortgages?.length || 0,
    litigationCount: raw.litigation?.count || 0,
    hasActiveLitigation: raw.litigation?.hasActive || false,
    isRentStabilized: raw.rentStabilization?.isStabilized || false,
    distressScore: distressReport.score,
    distressLevel: distressReport.level,
    distressSignals: distressReport.signals.map(s => ({ type: s.type, description: s.description, severity: s.severity })),
    scoutScore: score,
    scoutGrade: grade,
    complaint311Count: 0,
    propertyType: classifyBuildingType(dof?.buildingClass || ''),
    neighborhoodName: detectNeighborhood(address, borough || ''),
    neighborhoodMarketData: lookupNeighborhoodData(detectNeighborhood(address, borough || '')),
    registrationDate: raw.registration?.registrationId ? null : null,
    managementDuration: null,
    managementGrade: gradeManagement({
      violationsOpen: raw.violations?.open || 0,
      ecbPenaltyBalance: raw.ecb?.totalPenaltyBalance || 0,
      hasActiveLitigation: raw.litigation?.hasActive || false,
      permitsCount: raw.permits?.count || 0,
      violationsTotal: raw.violations?.total || 0,
    }).grade,
    managementScorecard: gradeManagement({
      violationsOpen: raw.violations?.open || 0,
      ecbPenaltyBalance: raw.ecb?.totalPenaltyBalance || 0,
      hasActiveLitigation: raw.litigation?.hasActive || false,
      permitsCount: raw.permits?.count || 0,
      violationsTotal: raw.violations?.total || 0,
    }).scorecard,
    boardMembers: raw.registration?.owner ? [{ name: raw.registration.owner, title: 'Registered Owner' }] : [],
    buildingStaff: [],
    professionals: {
      lawFirm: null,
      accountingFirm: null,
      engineer: raw.permits?.items?.[0]?.owner_s_first_name ? `${raw.permits.items[0].owner_s_first_name} ${raw.permits.items[0].owner_s_last_name || ''}`.trim() : null,
      architect: null,
    },
    pricePerUnit,
    monthlyFee,
    annualFee,
    raw,
  };
}

// ============================================================
// Cold Caller Sheet
// ============================================================

export function generateColdCallerSheet(d: MasterReportData): string {
  const isSelfManaged = !d.managementCompany || d.managementCompany === 'Unknown' || d.managementCompany === 'Self-Managed';
  return `COLD CALL PREP — ${d.buildingName}
${'━'.repeat(50)}

BUILDING: ${d.address}
UNITS: ${d.units} | FLOORS: ${d.stories} | GRADE: ${d.scoutGrade} (${d.scoutScore}/100)
MANAGEMENT: ${d.managementCompany || 'Self-Managed / Unknown'}
${d.dofOwner ? `OWNER (DOF): ${d.dofOwner}` : ''}

OPENING:
"Hi, this is [Your Name] calling from Camelot Property Management. We're a boutique management firm based in Manhattan at 477 Madison Avenue, 6th Fl. I'm reaching out because we specialize in managing buildings like ${d.buildingName} in your area, and I wanted to introduce our services to the decision makers."

KEY HOOKS:
${d.violationsOpen > 0 ? `• ${d.violationsOpen} OPEN HPD VIOLATIONS — "We noticed your building has ${d.violationsOpen} open HPD violations. We have a proven track record clearing these efficiently."\n` : ''}${d.ecbPenaltyBalance > 0 ? `• $${d.ecbPenaltyBalance.toLocaleString()} ECB PENALTY BALANCE — "Your building has outstanding ECB fines that we can help resolve."\n` : ''}${d.ll97 && d.ll97.period1Penalty > 0 ? `• LL97 PENALTY EXPOSURE: $${d.ll97.period1Penalty.toLocaleString()}/yr — "Under Local Law 97, your building faces estimated annual penalties. We include LL97 compliance at no extra charge."\n` : ''}${d.hasActiveLitigation ? `• ⚖️ ACTIVE HOUSING LITIGATION — "We see your building has active housing court cases. Camelot has experience stabilizing buildings in exactly this situation."\n` : ''}${d.isRentStabilized ? `• RENT STABILIZED — "We specialize in rent-stabilized buildings and understand the regulatory complexity."\n` : ''}${d.distressLevel === 'distressed' || d.distressLevel === 'critical' ? `• FINANCIAL DISTRESS DETECTED (${d.distressLevel.toUpperCase()}) — approach with sensitivity, but this building needs help.\n` : ''}
VALUE PROPS:
• Weekly on-site inspections by senior management
• AI-powered resident portal (ConciergePlus) — zero bank fees
• Monthly virtual accounting, full financial transparency
• LL97 compliance tracking included at no charge
• 24/7 emergency response with direct management access
${isSelfManaged ? '• "We understand you\'re self-managed — our 90-day onboarding makes the transition seamless"\n' : `• "We'd love to show you how we compare to ${d.managementCompany}"\n`}
OBJECTION HANDLERS:
"Happy with current management" → "Many clients felt the same before seeing our reporting platform. Open to a brief comparison?"
"Not looking to switch" → "No commitment — just an opportunity to share what similar buildings are finding valuable."
"Send me something" → "I'll send our Welcome to Camelot proposal customized for ${d.buildingName}. Best email?"

CLOSE:
"Would it make sense to schedule a 15-minute call with David Goldoff to walk through what Camelot could do for ${d.buildingName}?"

CONTACT: ${CAMELOT.principal} | ${CAMELOT.phone} | ${CAMELOT.email}
`;
}

// ============================================================
// Email Drafts
// ============================================================

export function generateEmailDraft(d: MasterReportData, type: 'intro' | 'followup' | 'proposal' | 'compliance'): { subject: string; body: string } {
  const sig = `\n\n${CAMELOT.principal}\n${CAMELOT.title}, ${CAMELOT.shortName}\n${CAMELOT.address}\n${CAMELOT.email} | ${CAMELOT.phone}\n${CAMELOT.web}`;

  if (type === 'intro') {
    return {
      subject: `Introduction — Camelot Property Management | ${d.buildingName}`,
      body: `Dear Board Member,

My name is David Goldoff, and I'm the principal of Camelot Realty Group, a boutique property management firm headquartered at 477 Madison Avenue, 6th Fl in New York City.

I'm reaching out because we specialize in managing buildings like ${d.buildingName}, and I believe we could bring meaningful value to your ${d.units}-unit property.

What makes Camelot different:

• Personal Attention — I personally oversee every property in our portfolio.
• Weekly Inspections — Our team visits each building weekly for thorough on-site inspections.
• Technology-Forward — AI-powered resident portal with zero bank fees for maintenance payments.
• Transparent Financials — Monthly virtual accounting and real-time performance dashboards.
• Compliance Expertise — We actively track LL97, HPD, DOB, and provide full compliance reporting.
${d.violationsOpen > 0 ? `\nI noticed that ${d.buildingName} currently has ${d.violationsOpen} open HPD violations on record. Our compliance team has extensive experience resolving these efficiently.\n` : ''}${d.ll97 && d.ll97.period1Penalty > 0 ? `\nAdditionally, under Local Law 97, your building faces an estimated annual penalty of $${d.ll97.period1Penalty.toLocaleString()}. We include LL97 compliance services at no additional charge.\n` : ''}
I'd welcome the opportunity to introduce Camelot to your board. Would you have 15 minutes for a brief call this week?

Warm regards,${sig}`,
    };
  }

  if (type === 'followup') {
    return {
      subject: `Following Up — Camelot for ${d.buildingName}`,
      body: `Dear Board Member,

I'm following up on my previous outreach regarding property management services for ${d.buildingName}.

Since my last message, I wanted to highlight a few things:
${d.violationsOpen > 0 ? `\n• Compliance: ${d.violationsOpen} open HPD violations on record. Our team resolves these efficiently.` : ''}
• Technology: Our ConciergePlus portal gives board members and residents a complete digital experience.
• Transparency: Monthly virtual accounting, quarterly market reports, and real-time dashboards.
${d.ll97 && d.ll97.period1Penalty > 0 ? `• LL97: Your building's estimated annual penalty is $${d.ll97.period1Penalty.toLocaleString()}. We include compliance services at no extra charge.\n` : ''}
I've prepared a customized management proposal for ${d.buildingName}. Would you have 15 minutes this week for a brief call?

Warm regards,${sig}`,
    };
  }

  if (type === 'proposal') {
    return {
      subject: `Management Proposal — Camelot for ${d.buildingName}`,
      body: `Dear Board Member,

Thank you for your interest in Camelot Property Management. I'm pleased to present our approach for managing ${d.buildingName}, your ${d.units}-unit property.

OUR 90-DAY ONBOARDING:
• Month 1: Full building audit, FREE inspection ($2,500 value), vendor review
• Month 2: SOPs, portal launch, financial migration, vendor optimization
• Month 3: Full technology stack live, reporting cadence, 5-year capital roadmap

ONGOING SERVICES:
• Weekly on-site inspections
• 24/7 emergency response
• In-house CPA and monthly financial reporting
• LL97 compliance tracking and penalty modeling
• ConciergePlus resident portal with zero bank fees

PROPOSED INVESTMENT:
• Management Fee: $${d.monthlyFee.toLocaleString()}/month ($${d.pricePerUnit}/unit)
• Online Payments: ZERO bank fees
• Technology Platform: Included
• Building Inspection: FREE
• LL97 Compliance Report: Included
• In-House Legal Advisory: Free consultation

I'd welcome the opportunity to present this to your board.

Best regards,${sig}`,
    };
  }

  // compliance
  return {
    subject: `Your Building at ${d.address} — LL97 Compliance Alert`,
    body: `Dear Board Member,

I'm writing to bring an urgent matter to your attention regarding ${d.buildingName}.

Under NYC Local Law 97, your building faces significant carbon emission penalties:

• Period 1 (2024-2029): Estimated annual penalty of $${(d.ll97?.period1Penalty || 0).toLocaleString()}
• Period 2 (2030-2034): Estimated annual penalty of $${(d.ll97?.period2Penalty || 0).toLocaleString()}
• Total 11-Year Exposure: $${(d.ll97?.totalExposure11yr || 0).toLocaleString()}
${d.energyStarScore ? `• Current Energy Star Score: ${d.energyStarScore}` : ''}

These penalties are real and enforceable starting NOW. Many building boards are unaware of their exposure until they receive their first penalty notice.

Camelot Property Management includes comprehensive LL97 compliance services at NO additional charge:
• Annual energy benchmarking and filing
• Carbon penalty modeling and forecasting
• Capital upgrade planning (HVAC, boiler, insulation)
• Rebate and incentive capture for energy improvements
• Ongoing monitoring and compliance reporting

We'd like to offer a complimentary LL97 compliance assessment for ${d.buildingName}. Would you have 15 minutes this week to discuss?

Regards,${sig}`,
  };
}

// ============================================================
// CSV Export
// ============================================================

export function generateCSVExport(d: MasterReportData): string {
  const rows: string[][] = [
    ['Field', 'Value'],
    ['Address', d.address],
    ['Borough', d.borough],
    ['Building Name', d.buildingName],
    ['Units', String(d.units)],
    ['Stories', String(d.stories)],
    ['Year Built', String(d.yearBuilt)],
    ['Building Class', d.buildingClass],
    ['Tax Class', d.taxClass],
    ['Market Value', `$${d.marketValue.toLocaleString()}`],
    ['Assessed Value', `$${d.assessedValue.toLocaleString()}`],
    ['Land Value', `$${d.landValue.toLocaleString()}`],
    ['DOF Owner', d.dofOwner],
    ['BBL', d.bbl],
    ['Current Management', d.managementCompany || 'Unknown'],
    ['HPD Violations (Total)', String(d.violationsTotal)],
    ['HPD Violations (Open)', String(d.violationsOpen)],
    ['Class A', String(d.violationClassA)],
    ['Class B', String(d.violationClassB)],
    ['Class C', String(d.violationClassC)],
    ['ECB Violations', String(d.ecbCount)],
    ['ECB Penalty Balance', `$${d.ecbPenaltyBalance.toLocaleString()}`],
    ['DOB Permits', String(d.permitsCount)],
    ['Energy Star Score', d.energyStarScore != null ? String(d.energyStarScore) : 'N/A'],
    ['Site EUI', d.siteEUI != null ? String(d.siteEUI) : 'N/A'],
    ['GHG Emissions', d.ghgEmissions != null ? String(d.ghgEmissions) : 'N/A'],
    ['LL97 Annual Penalty (Period 1)', d.ll97 ? `$${d.ll97.period1Penalty.toLocaleString()}` : 'N/A'],
    ['LL97 Annual Penalty (Period 2)', d.ll97 ? `$${d.ll97.period2Penalty.toLocaleString()}` : 'N/A'],
    ['LL97 11-Year Exposure', d.ll97 ? `$${d.ll97.totalExposure11yr.toLocaleString()}` : 'N/A'],
    ['Last Sale Date', d.lastSaleDate || 'N/A'],
    ['Last Sale Price', d.lastSalePrice ? `$${d.lastSalePrice.toLocaleString()}` : 'N/A'],
    ['Buyer', d.lastSaleBuyer || 'N/A'],
    ['Seller', d.lastSaleSeller || 'N/A'],
    ['Deeds on Record', String(d.deedCount)],
    ['Mortgages on Record', String(d.mortgageCount)],
    ['Active Litigation', d.hasActiveLitigation ? 'YES' : 'No'],
    ['Rent Stabilized', d.isRentStabilized ? 'YES' : 'No'],
    ['Distress Score', String(d.distressScore)],
    ['Distress Level', d.distressLevel],
    ['Scout Score', String(d.scoutScore)],
    ['Scout Grade', d.scoutGrade],
    ['Property Type', d.propertyType],
    ['Neighborhood', d.neighborhoodName],
    ['Management Grade', d.managementGrade],
    ['Management Duration', d.managementDuration || 'N/A'],
    ['Neighborhood Condo $/Sqft', d.neighborhoodMarketData ? `$${d.neighborhoodMarketData.condoPSF}` : 'N/A'],
    ['Neighborhood Co-op $/Sqft', d.neighborhoodMarketData ? `$${d.neighborhoodMarketData.coopPSF}` : 'N/A'],
    ['Neighborhood Median 1BR Rent', d.neighborhoodMarketData ? `$${d.neighborhoodMarketData.median1BR}` : 'N/A'],
    ['Neighborhood Median 2BR Rent', d.neighborhoodMarketData ? `$${d.neighborhoodMarketData.median2BR}` : 'N/A'],
    ['Neighborhood Invest Score', d.neighborhoodMarketData ? String(d.neighborhoodMarketData.investScore) : 'N/A'],
    ['Proposed Price/Unit', `$${d.pricePerUnit}`],
    ['Proposed Monthly Fee', `$${d.monthlyFee.toLocaleString()}`],
    ['Proposed Annual Fee', `$${d.annualFee.toLocaleString()}`],
  ];
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ============================================================
// HTML Brochure Generator (17-page printable pitch deck)
// ============================================================

export function generateBrochureHTML(d: MasterReportData): string {
  const addr = d.address;
  const encodedAddr = encodeURIComponent(addr);
  const isSelfManaged = !d.managementCompany || d.managementCompany === 'Unknown' || d.managementCompany === 'Self-Managed';
  const fmtMoney = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

  const hookLine = isSelfManaged
    ? `Every day, the ${d.units || ''} families at ${d.buildingName} depend on the quality of their building\u2019s management. The right partner brings proactive care, financial clarity, and modern technology \u2014 elevating not just the building, but the lives of everyone who calls it home.`
    : d.violationsOpen > 5
    ? `With ${d.violationsOpen} open violations and evolving compliance requirements, the families at ${d.buildingName} deserve a management partner with proven expertise in compliance resolution, proactive maintenance, and transparent financial stewardship.`
    : `Every day, the ${d.units || ''} families at ${d.buildingName} depend on the quality of their building\u2019s management. The right partner brings proactive care, financial clarity, and modern technology \u2014 elevating not just the building, but the lives of everyone who calls it home.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Camelot Management Proposal \u2014 ${d.buildingName}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:'Inter',-apple-system,sans-serif;background:#FAF8F5;color:#2C3E50;font-size:13px;line-height:1.6}
@media print{@page{margin:0.15in}*{-webkit-print-color-adjust:exact!important}}
.page{max-width:900px;margin:0 auto}
a{color:#C5A55A;text-decoration:none}
.gold{color:#C5A55A}.navy{color:#3D4F5F}

/* Cover */
.cover{background:#3D4F5F;color:#fff;padding:60px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:600px;page-break-after:always;position:relative}
.cover .badge{position:absolute;top:28px;right:28px;background:#C5A55A;color:#fff;padding:12px 18px;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-weight:700;line-height:1.4;text-align:center}
.cover .wordmark{font-family:'Playfair Display',Georgia,serif;font-size:16px;letter-spacing:12px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px}
.cover .pm-sub{font-size:12px;color:#C5A55A;letter-spacing:2px;margin-bottom:48px}
.cover h1{font-family:'Playfair Display',Georgia,serif;font-size:42px;color:#C5A55A;font-weight:700;margin-bottom:8px;line-height:1.2;max-width:700px}
.cover .proposal-sub{font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:8px;font-weight:300;letter-spacing:1px}
.cover .meta{font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px}
.cover .prepared{font-family:'Playfair Display',Georgia,serif;font-size:12px;color:#C5A55A;font-style:italic;margin-top:40px}

/* Elevator */
.elevator{background:#FAF8F5;padding:50px 60px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;min-height:400px}
.elevator h2{font-family:'Playfair Display',Georgia,serif;font-size:36px;color:#C5A55A;font-weight:700;margin-bottom:16px;max-width:640px;line-height:1.2}
.elevator .gold-bar{width:60px;height:3px;background:#C5A55A;margin:0 auto 24px}
.elevator p{font-family:Georgia,serif;font-size:15px;color:#555;line-height:1.9;max-width:600px}

/* Sections */
.section{padding:36px 50px;page-break-after:always}
.section-cream{background:#FAF8F5}.section-white{background:#fff}
.section-title{font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#2C3E50;margin-bottom:6px;padding-left:16px;border-left:4px solid #C5A55A;font-weight:700}
.section-sub{font-size:12px;color:#888;margin-bottom:28px;padding-left:16px}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.stat-box{background:#fff;border:1px solid #E5E3DE;border-radius:8px;padding:16px;text-align:center}
.stat-box .val{font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#C5A55A;font-weight:700}
.stat-box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;margin:20px 0}
.info-grid .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999}
.info-grid .value{font-size:13px;color:#2C3E50;font-weight:500}

/* Compare table */
.compare-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
.compare-table th{padding:12px 16px;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700}
.compare-table th:nth-child(1){background:#E5E3DE;color:#666}
.compare-table th:nth-child(2){background:#C5A55A;color:#fff}
.compare-table th:nth-child(3){background:#E5E3DE;color:#666}
.compare-table td{padding:10px 16px;border-bottom:1px solid #eee;color:#666;text-align:center}
.compare-table td:nth-child(2){background:#FDFBF5;font-weight:600;color:#2C3E50}
.compare-tagline{font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#C5A55A;font-size:14px;text-align:center;margin-top:20px}

/* Cards */
.core-svc{background:#fff;border:1px solid #E5E3DE;border-left:4px solid #C5A55A;border-radius:0 8px 8px 0;padding:20px;margin-bottom:16px}
.core-svc h4{font-size:14px;font-weight:700;color:#2C3E50;margin-bottom:6px}
.core-svc p{font-size:12px;color:#555;line-height:1.7}

.va-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
.va-card{background:#fff;border:1px solid #E5E3DE;border-left:3px solid #C5A55A;border-radius:0 8px 8px 0;padding:16px}
.va-card h5{font-size:12px;font-weight:700;color:#2C3E50;margin-bottom:4px}
.va-card p{font-size:11px;color:#888;line-height:1.5}

/* Transition */
.transition-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}
.trans-card{background:#fff;border:1px solid #E5E3DE;border-top:3px solid #C5A55A;border-radius:0 0 8px 8px;padding:20px}
.trans-card h4{font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:700;color:#C5A55A;margin-bottom:6px}
.trans-card .sub{font-size:11px;color:#888;margin-bottom:12px;font-style:italic}
.trans-card ul{list-style:none}.trans-card ul li{font-size:11px;color:#555;padding:4px 0 4px 16px;position:relative}
.trans-card ul li::before{content:"\u2022";position:absolute;left:0;color:#C5A55A;font-weight:700;font-size:14px}

/* Pricing table */
.invest-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
.invest-table th{background:#C5A55A;color:#fff;padding:12px 16px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}
.invest-table td{padding:12px 16px;border-bottom:1px solid #eee;color:#444}
.invest-table tr:nth-child(even){background:#FDFBF5}
.invest-table td:nth-child(2){font-weight:600;color:#2C3E50}
.invest-table .free{color:#16a34a;font-weight:700}
.invest-table .included{color:#C5A55A;font-weight:600}

/* Testimonials */
.testimonial-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
.testimonial{background:#fff;border:1px solid #E5E3DE;border-left:4px solid #C5A55A;border-radius:0 8px 8px 0;padding:24px}
.testimonial .qm{font-family:'Playfair Display',Georgia,serif;font-size:48px;color:#C5A55A;line-height:0.8;margin-bottom:10px}
.testimonial p{font-family:Georgia,serif;font-size:12px;color:#555;font-style:italic;line-height:1.8;margin-bottom:12px}
.testimonial .author{font-size:12px;color:#C5A55A;font-weight:600}
.testimonial .author-title{font-size:10px;color:#888}

/* Back cover */
.back-cover{background:#3D4F5F;color:#fff;min-height:400px;padding:60px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always}
.back-cover .wordmark{font-family:'Playfair Display',Georgia,serif;font-size:14px;letter-spacing:10px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px}
.back-cover .pm-sub{font-size:11px;color:#C5A55A;margin-bottom:32px;letter-spacing:2px}
.back-cover h2{font-family:'Playfair Display',Georgia,serif;font-size:32px;color:#C5A55A;margin-bottom:8px;font-weight:700}
.back-cover .tagline{font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:32px;line-height:1.8}
.back-cover .contact-name{font-size:15px;color:#C5A55A;font-weight:600;margin-bottom:4px}
.back-cover .contact-info{font-size:12px;color:rgba(255,255,255,0.6);line-height:2}
.back-cover .contact-info a{color:#C5A55A}
.back-cover .address{font-size:11px;color:rgba(255,255,255,0.4);margin-top:16px}

/* Intel section */
.intel-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin:16px 0}
.intel-card{background:#fff;border:1px solid #E5E3DE;border-radius:8px;padding:16px;text-align:center}
.intel-card .val{font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700}
.intel-card .lbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.red{color:#dc2626}.orange{color:#ea580c}.green{color:#16a34a}.yellow{color:#ca8a04}

.about-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.about-stat{background:#fff;border:1px solid #E5E3DE;border-radius:8px;padding:18px;text-align:center}
.about-stat .val{font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#C5A55A;font-weight:700}
.about-stat .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

.compliance-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
.compliance-card{background:#fff;border:1px solid #E5E3DE;border-top:3px solid #C5A55A;border-radius:0 0 8px 8px;padding:16px;text-align:center}
.compliance-card .month{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C5A55A;font-weight:700;margin-bottom:6px}
.compliance-card h5{font-size:12px;color:#2C3E50;font-weight:700;margin-bottom:4px}
.compliance-card p{font-size:10px;color:#888;line-height:1.4}

.tech-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
.tech-col{background:#FDFBF5;border:1px solid #E5E3DE;border-radius:8px;padding:22px}
.tech-col h4{font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#2C3E50;margin-bottom:14px;font-weight:700}
.tech-col ul{list-style:none}.tech-col ul li{font-size:12px;color:#555;padding:5px 0 5px 22px;position:relative}
.tech-col ul li::before{content:"\u2714";position:absolute;left:0;color:#C5A55A;font-size:14px;font-weight:700}

.mission-stmt{font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#C5A55A;font-size:15px;text-align:center;margin-bottom:20px;line-height:1.6;font-weight:600;max-width:700px;margin-left:auto;margin-right:auto}

@media print{
body{background:#fff}
.cover,.back-cover{background:#3D4F5F!important}
.section,.elevator{page-break-after:always}
.section{break-inside:avoid}
}
</style>
</head>
<body>
<div class="page">

<!-- PAGE 1: COVER -->
<div class="cover">
<img src="./images/camelot-logo-white.png" alt="Camelot" style="width:120px;margin-bottom:16px;opacity:0.9" onerror="this.style.display='none'">
<div class="badge">CAMELOT<br>REALTY GROUP</div>
<div class="wordmark">C &nbsp;A &nbsp;M &nbsp;E &nbsp;L &nbsp;O &nbsp;T</div>
<div class="pm-sub">Property Management</div>
<h1>${d.buildingName}</h1>
<div class="proposal-sub">Management Proposal &amp; Building Intelligence Report</div>
<div class="meta">${d.borough} &nbsp;|&nbsp; New York</div>
<div class="meta">${d.units ? d.units + ' Units' : ''} ${d.stories ? '&nbsp;|&nbsp; ' + d.stories + ' Floors' : ''}</div>
<div class="prepared">Prepared exclusively for the Board of Directors &mdash; ${d.date}</div>
</div>

<!-- PAGE 2: PROPERTY VISUAL & MAP -->
<div class="section section-white" style="padding-top:20px">
<div class="section-title">The Property</div>
<div class="section-sub">${d.address} &mdash; ${d.propertyType}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
<div style="border-radius:10px;overflow:hidden;border:1px solid #E5E3DE;height:280px">
<iframe src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${encodedAddr}&fov=60&pitch=10" width="100%" height="280" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>
<div style="border-radius:10px;overflow:hidden;border:1px solid #E5E3DE;height:280px">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=16" width="100%" height="280" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>
</div>
<div class="stats-row">
<div class="stat-box"><div class="val">${d.propertyType}</div><div class="lbl">Property Type</div></div>
<div class="stat-box"><div class="val">${d.units || 'N/A'}</div><div class="lbl">Units</div></div>
<div class="stat-box"><div class="val">${d.stories || 'N/A'}</div><div class="lbl">Floors</div></div>
<div class="stat-box"><div class="val">${d.yearBuilt || 'N/A'}</div><div class="lbl">Year Built</div></div>
</div>
<div style="background:#FDFBF5;border:1px solid #E5E3DE;border-radius:8px;padding:20px;margin-top:12px">
<p style="font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#555;line-height:1.8;text-align:center">${hookLine}</p>
</div>
</div>

<!-- PAGE 2B: NEIGHBORHOOD INTELLIGENCE -->
<div class="section section-cream">
<div class="section-title">Neighborhood Intelligence</div>
<div class="section-sub">${d.neighborhoodName ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : d.borough || 'New York City'} &mdash; Market Context</div>

<div style="margin-bottom:20px">
<div style="background:#fff;border:1px solid #E5E3DE;border-left:4px solid #C5A55A;border-radius:0 8px 8px 0;padding:16px;margin-bottom:12px">
<h4 style="font-size:13px;font-weight:700;color:#2C3E50;margin-bottom:4px">📍 Camelot Office Proximity</h4>
<p style="font-size:12px;color:#555">Camelot Realty Group operates from <strong>477 Madison Avenue, 6th Floor</strong> (Midtown Manhattan). Your property at ${d.address} is within Camelot&rsquo;s core service area, ensuring rapid response times and frequent on-site visits.</p>
</div>
<div style="background:#fff;border:1px solid #E5E3DE;border-left:4px solid #C5A55A;border-radius:0 8px 8px 0;padding:16px;margin-bottom:12px">
<h4 style="font-size:13px;font-weight:700;color:#2C3E50;margin-bottom:4px">🚇 Transit Access</h4>
<p style="font-size:12px;color:#555">New York City subway and bus service provide comprehensive transit coverage to this property. The building is accessible via major subway lines, ensuring convenient access for residents, staff, and management alike.</p>
</div>
</div>

${d.neighborhoodMarketData ? `
<div style="margin-bottom:16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Neighborhood Scores</div>
</div>
<div class="stats-row">
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.investScore}</div><div class="lbl">💰 Invest</div></div>
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.liveScore}</div><div class="lbl">🏠 Live</div></div>
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.familyScore}</div><div class="lbl">👨‍👩‍👧 Family</div></div>
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.workScore}</div><div class="lbl">💼 Work</div></div>
</div>
<div style="text-align:center;font-size:12px;color:#555;margin-top:8px">
Price Momentum: <strong style="color:${d.neighborhoodMarketData.momentum === 'Very Strong' ? '#16a34a' : d.neighborhoodMarketData.momentum === 'Strong' ? '#16a34a' : '#ca8a04'}">${d.neighborhoodMarketData.momentum} ↑</strong>
&nbsp;&nbsp;|&nbsp;&nbsp;Avg Days on Market: <strong>${d.neighborhoodMarketData.daysOnMarket} days</strong>
&nbsp;&nbsp;|&nbsp;&nbsp;Operating Costs: <strong>${d.neighborhoodMarketData.opexRange}</strong>
</div>
` : ''}
</div>

<!-- PAGE 3: PROPERTY OVERVIEW -->
<div class="section section-cream">
<div class="section-title">The Property</div>
<div class="section-sub">Building overview and current intelligence</div>
<div class="stats-row">
<div class="stat-box"><div class="val">${d.units || 'N/A'}</div><div class="lbl">Units</div></div>
<div class="stat-box"><div class="val">${d.stories || 'N/A'}</div><div class="lbl">Floors</div></div>
<div class="stat-box"><div class="val">${d.scoutGrade}</div><div class="lbl">Scout Grade</div></div>
<div class="stat-box"><div class="val">${d.scoutScore}</div><div class="lbl">Scout Score</div></div>
</div>
<div class="info-grid">
<div><div class="label">Address</div><div class="value">${addr}</div></div>
<div><div class="label">Current Management</div><div class="value">${d.managementCompany || 'Self-Managed'}</div></div>
<div><div class="label">Market Value</div><div class="value" style="color:#C5A55A;font-weight:700;font-size:15px">${fmtMoney(d.marketValue)}</div></div>
<div><div class="label">Assessed Value</div><div class="value">${fmtMoney(d.assessedValue)}</div></div>
<div><div class="label">Year Built</div><div class="value">${d.yearBuilt || 'N/A'}</div></div>
<div><div class="label">Building Class</div><div class="value">${d.buildingClass || 'N/A'}</div></div>
<div><div class="label">DOF Owner</div><div class="value">${d.dofOwner || 'N/A'}</div></div>
<div><div class="label">BBL</div><div class="value">${d.bbl || 'N/A'}</div></div>
</div>
${d.energyStarScore != null ? `
<div style="margin-top:16px;border-left:4px solid #C5A55A;padding-left:12px;margin-bottom:8px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Energy &amp; LL97 Compliance</div>
</div>
<div class="stats-row">
<div class="stat-box"><div class="val" style="color:${d.energyStarScore >= 75 ? '#16a34a' : d.energyStarScore >= 50 ? '#ca8a04' : '#dc2626'}">${d.energyStarScore}</div><div class="lbl">Energy Star</div></div>
${d.siteEUI ? `<div class="stat-box"><div class="val">${d.siteEUI.toFixed(1)}</div><div class="lbl">Site EUI</div></div>` : ''}
${d.ghgEmissions ? `<div class="stat-box"><div class="val">${d.ghgEmissions.toFixed(1)}</div><div class="lbl">GHG (tCO\u2082e)</div></div>` : ''}
${d.occupancy ? `<div class="stat-box"><div class="val">${d.occupancy}%</div><div class="lbl">Occupancy</div></div>` : ''}
</div>` : ''}
</div>

<!-- PAGE 4: VIOLATIONS & INTELLIGENCE -->
<div class="section section-white">
<div class="section-title">Building Intelligence</div>
<div class="section-sub">Violations, compliance, and risk signals</div>
<div class="intel-grid">
<div class="intel-card"><div class="val ${d.violationsTotal > 20 ? 'red' : d.violationsTotal > 5 ? 'orange' : 'green'}">${d.violationsTotal}</div><div class="lbl">HPD Violations</div></div>
<div class="intel-card"><div class="val ${d.violationsOpen > 10 ? 'red' : d.violationsOpen > 0 ? 'orange' : 'green'}">${d.violationsOpen}</div><div class="lbl">Open Violations</div></div>
<div class="intel-card"><div class="val ${d.ecbPenaltyBalance > 10000 ? 'red' : d.ecbCount > 0 ? 'orange' : 'green'}">$${d.ecbPenaltyBalance.toLocaleString()}</div><div class="lbl">ECB Penalty Balance</div></div>
</div>
<div class="info-grid">
<div><div class="label">Violation Class A</div><div class="value">${d.violationClassA}</div></div>
<div><div class="label">Violation Class B</div><div class="value">${d.violationClassB}</div></div>
<div><div class="label">Violation Class C</div><div class="value">${d.violationClassC}</div></div>
<div><div class="label">ECB Violations</div><div class="value">${d.ecbCount}</div></div>
<div><div class="label">Active Litigation</div><div class="value" style="color:${d.hasActiveLitigation ? '#dc2626' : '#16a34a'};font-weight:600">${d.hasActiveLitigation ? '\u26A0\uFE0F YES' : '\u2714 None'}</div></div>
<div><div class="label">Rent Stabilized</div><div class="value">${d.isRentStabilized ? '\uD83D\uDCCB Yes' : 'No'}</div></div>
<div><div class="label">DOB Permits</div><div class="value">${d.permitsCount}</div></div>
<div><div class="label">Distress Level</div><div class="value" style="color:${d.distressLevel === 'critical' || d.distressLevel === 'distressed' ? '#dc2626' : d.distressLevel === 'stressed' ? '#ea580c' : '#2C3E50'};font-weight:600">${d.distressLevel.toUpperCase()} (${d.distressScore}/100)</div></div>
</div>
${d.distressSignals.length > 0 ? `
<div style="margin-top:16px;border-left:4px solid #dc2626;padding-left:12px;margin-bottom:8px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#dc2626;font-weight:600">Distress Signals</div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:8px">${d.distressSignals.map(s => `<span style="display:inline-block;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);color:#991b1b;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:500">${s.description}</span>`).join('')}</div>` : ''}
</div>

<!-- PAGE 5: OWNERSHIP & FINANCIAL -->
<div class="section section-cream">
<div class="section-title">Ownership &amp; Financial History</div>
<div class="section-sub">ACRIS deed and mortgage records</div>
<div class="info-grid">
<div><div class="label">Last Sale Date</div><div class="value">${d.lastSaleDate ? new Date(d.lastSaleDate).toLocaleDateString() : 'N/A'}</div></div>
<div><div class="label">Last Sale Price</div><div class="value" style="font-weight:700;color:#C5A55A">${d.lastSalePrice ? fmtMoney(d.lastSalePrice) : 'N/A'}</div></div>
<div><div class="label">Buyer</div><div class="value">${d.lastSaleBuyer || 'N/A'}</div></div>
<div><div class="label">Seller</div><div class="value">${d.lastSaleSeller || 'N/A'}</div></div>
<div><div class="label">Deeds on Record</div><div class="value">${d.deedCount}</div></div>
<div><div class="label">Mortgages on Record</div><div class="value">${d.mortgageCount}</div></div>
</div>
</div>

<!-- PAGE 5B: BUILDING CONTACTS & STAKEHOLDERS -->
<div class="section section-white">
<div class="section-title">Building Contacts &amp; Stakeholders</div>
<div class="section-sub">Key personnel, governance, and professional services</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0">
<div>
<div style="margin-bottom:16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Ownership &amp; Governance</div>
</div>
<div class="info-grid" style="grid-template-columns:1fr">
<div><div class="label">DOF Owner</div><div class="value">${d.dofOwner || 'N/A'}</div></div>
<div><div class="label">Registration Owner</div><div class="value">${d.registrationOwner || 'N/A'}</div></div>
<div><div class="label">Management Company</div><div class="value">${d.managementCompany || 'Self-Managed'}</div></div>
</div>
${d.boardMembers.length > 0 ? `
<div style="margin-top:14px;margin-bottom:8px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999">Board / Officers</div>
${d.boardMembers.map(b => `<div style="background:#FDFBF5;border:1px solid #E5E3DE;border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:12px"><strong>${b.name}</strong> <span style="color:#888;font-size:11px">&mdash; ${b.title}</span></div>`).join('')}
` : '<div style="font-size:11px;color:#888;margin-top:12px">Board member information not available from public records</div>'}
</div>

<div>
<div style="margin-bottom:16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Building Staff</div>
</div>
${d.buildingStaff.length > 0 ? d.buildingStaff.map(s => `<div style="background:#FDFBF5;border:1px solid #E5E3DE;border-radius:6px;padding:8px 12px;margin-bottom:6px;font-size:12px"><strong>${s.name}</strong> <span style="color:#888;font-size:11px">&mdash; ${s.role}</span></div>`).join('') : '<div style="font-size:11px;color:#888">Staff information not available from public records. Typically includes: Superintendent, Resident Manager, Front Desk.</div>'}

<div style="margin-top:20px;margin-bottom:16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Professional Services</div>
</div>
<div class="info-grid" style="grid-template-columns:1fr">
<div><div class="label">Law Firm</div><div class="value">${d.professionals.lawFirm || 'Information available upon engagement'}</div></div>
<div><div class="label">Accounting / Auditor</div><div class="value">${d.professionals.accountingFirm || 'Information available upon engagement'}</div></div>
<div><div class="label">Licensed Engineer</div><div class="value">${d.professionals.engineer || 'Information available upon engagement'}</div></div>
<div><div class="label">Architect</div><div class="value">${d.professionals.architect || 'Information available upon engagement'}</div></div>
</div>
</div>
</div>
</div>

<!-- PAGE 5C: CURRENT MANAGEMENT PERFORMANCE -->
<div class="section section-cream">
<div class="section-title">Current Management Performance</div>
<div class="section-sub">${d.managementCompany ? `Analysis of ${d.managementCompany}` : 'Building management assessment'} ${d.managementDuration ? `&mdash; Managing for ~${d.managementDuration}` : ''}</div>

<div style="display:flex;align-items:center;gap:24px;margin:20px 0">
<div style="width:100px;height:100px;border-radius:50%;background:${d.managementGrade === 'A' ? '#16a34a' : d.managementGrade === 'B' ? '#ca8a04' : d.managementGrade === 'C' ? '#ea580c' : '#dc2626'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
<span style="font-family:'Playfair Display',Georgia,serif;font-size:48px;font-weight:700;color:#fff">${d.managementGrade}</span>
</div>
<div>
<div style="font-size:16px;font-weight:700;color:#2C3E50;margin-bottom:4px">Overall Management Grade: ${d.managementGrade}</div>
<div style="font-size:12px;color:#555;line-height:1.6">Based on HPD violations, ECB compliance, DOB permits, litigation status, and financial indicators. ${d.managementGrade === 'A' ? 'This building is well-maintained.' : d.managementGrade === 'B' ? 'There is room for meaningful improvement.' : 'Significant management issues detected &mdash; this building would benefit from professional management.'}</div>
</div>
</div>

<div class="stats-row">
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.violations >= 70 ? '#16a34a' : d.managementScorecard.violations >= 50 ? '#ca8a04' : '#dc2626'}">${d.managementScorecard.violations}</div><div class="lbl">Violations Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.compliance >= 70 ? '#16a34a' : d.managementScorecard.compliance >= 50 ? '#ca8a04' : '#dc2626'}">${d.managementScorecard.compliance}</div><div class="lbl">Compliance Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.financial >= 70 ? '#16a34a' : d.managementScorecard.financial >= 50 ? '#ca8a04' : '#dc2626'}">${d.managementScorecard.financial}</div><div class="lbl">Financial Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.overall >= 70 ? '#16a34a' : d.managementScorecard.overall >= 50 ? '#ca8a04' : '#dc2626'}">${d.managementScorecard.overall}</div><div class="lbl">Overall Score</div></div>
</div>

<div style="margin-top:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600;margin-bottom:10px;padding-left:16px;border-left:4px solid #C5A55A">Key Findings</div>
<div style="display:flex;flex-wrap:wrap;gap:8px">
${d.violationsOpen > 0 ? `<span style="display:inline-block;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);color:#991b1b;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">⚠️ ${d.violationsOpen} Open HPD Violations</span>` : '<span style="display:inline-block;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);color:#166534;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">✅ No Open HPD Violations</span>'}
${d.ecbPenaltyBalance > 0 ? `<span style="display:inline-block;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);color:#991b1b;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">💰 $${d.ecbPenaltyBalance.toLocaleString()} ECB Penalties Outstanding</span>` : '<span style="display:inline-block;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);color:#166534;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">✅ No ECB Penalties</span>'}
${d.hasActiveLitigation ? '<span style="display:inline-block;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);color:#991b1b;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">⚖️ Active Litigation</span>' : '<span style="display:inline-block;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);color:#166534;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">✅ No Active Litigation</span>'}
${d.hasRecentPermits ? '<span style="display:inline-block;background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.25);color:#166534;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">🔨 Recent DOB Permits Active</span>' : '<span style="display:inline-block;background:rgba(202,138,4,0.08);border:1px solid rgba(202,138,4,0.25);color:#854d0e;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:500">📋 No Recent Permits</span>'}
</div>
</div>
</div>

<!-- PAGE 5D: MARKET CONTEXT & BENCHMARKS -->
${d.neighborhoodMarketData ? `
<div class="section section-white">
<div class="section-title">Market Context &amp; Benchmarks</div>
<div class="section-sub">${d.neighborhoodName ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Local Market'} &mdash; Q1 2026 Data</div>

<div style="margin-bottom:16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Sale Price Benchmarks</div>
</div>
<div class="stats-row">
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.condoPSF.toLocaleString()}</div><div class="lbl">Condo $/Sqft</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.coopPSF.toLocaleString()}</div><div class="lbl">Co-op $/Sqft</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.rentalPSFYr}</div><div class="lbl">Rental $/Sqft/Yr</div></div>
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.daysOnMarket}</div><div class="lbl">Avg Days on Market</div></div>
</div>

<div style="margin:20px 0 16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Rental Market</div>
</div>
<div class="stats-row" style="grid-template-columns:1fr 1fr 1fr">
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.median1BR.toLocaleString()}</div><div class="lbl">Median 1BR Rent/Mo</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.median2BR.toLocaleString()}</div><div class="lbl">Median 2BR Rent/Mo</div></div>
<div class="stat-box"><div class="val">${d.neighborhoodMarketData.opexRange}</div><div class="lbl">Operating Costs Range</div></div>
</div>

${d.buildingArea > 0 ? `
<div style="margin:20px 0 16px;border-left:4px solid #C5A55A;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#C5A55A;font-weight:600">Your Building vs. Market</div>
</div>
<div class="info-grid">
<div><div class="label">Building GFA</div><div class="value">${d.buildingArea.toLocaleString()} sqft</div></div>
<div><div class="label">Est. Value (at neighborhood $/sqft)</div><div class="value" style="color:#C5A55A;font-weight:700">${fmtMoney(d.buildingArea * (d.propertyType.toLowerCase().includes('co-op') ? d.neighborhoodMarketData.coopPSF : d.neighborhoodMarketData.condoPSF))}</div></div>
<div><div class="label">Est. Annual Rental Potential</div><div class="value" style="color:#C5A55A;font-weight:700">${fmtMoney(d.buildingArea * d.neighborhoodMarketData.rentalPSFYr)}</div></div>
<div><div class="label">Est. Gross Yield</div><div class="value">${((d.neighborhoodMarketData.rentalPSFYr / (d.propertyType.toLowerCase().includes('co-op') ? d.neighborhoodMarketData.coopPSF : d.neighborhoodMarketData.condoPSF)) * 100).toFixed(1)}%</div></div>
</div>
` : ''}

<div style="background:#FDFBF5;border:1px solid #E5E3DE;border-radius:8px;padding:16px;margin-top:16px">
<p style="font-size:12px;color:#555;line-height:1.7"><strong style="color:#C5A55A">Source:</strong> Camelot Q1 2026 Market Report. Data from ACRIS closed sales, StreetEasy leased units, and RealtyMX RLS comparables (Q4 2025 – Q1 2026). Scores are Camelot composite assessments based on market data, public records, census metrics, school ratings, transit access, and crime statistics.</p>
</div>
</div>` : ''}

<!-- PAGE 6: LL97 -->
${d.ll97 ? `
<div class="section section-white">
<div class="section-title">LL97 Compliance Analysis</div>
<div class="section-sub">Local Law 97 carbon emission penalty exposure</div>
<div class="stats-row">
<div class="stat-box"><div class="val" style="color:#dc2626">$${d.ll97.period1Penalty.toLocaleString()}</div><div class="lbl">Annual Penalty (2024-2029)</div></div>
<div class="stat-box"><div class="val" style="color:#dc2626">$${d.ll97.period2Penalty.toLocaleString()}</div><div class="lbl">Annual Penalty (2030-2034)</div></div>
<div class="stat-box"><div class="val" style="color:#dc2626">$${d.ll97.totalExposure11yr.toLocaleString()}</div><div class="lbl">11-Year Total Exposure</div></div>
<div class="stat-box"><div class="val" style="color:${d.ll97.complianceStatus === 'compliant' ? '#16a34a' : '#dc2626'}">${d.ll97.complianceStatus.toUpperCase()}</div><div class="lbl">Status</div></div>
</div>
<div class="info-grid">
<div><div class="label">Building Type (LL97)</div><div class="value">${d.ll97.buildingType}</div></div>
<div><div class="label">Emissions Limit</div><div class="value">${d.ll97.emissionsLimit.toFixed(2)} kgCO\u2082e/sqft</div></div>
<div><div class="label">Actual Emissions</div><div class="value">${d.ll97.actualEmissions.toFixed(2)} kgCO\u2082e/sqft</div></div>
<div><div class="label">Building GFA</div><div class="value">${d.buildingArea.toLocaleString()} sqft</div></div>
</div>
<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin-top:16px">
<p style="font-size:12px;color:#991b1b;font-weight:600">Camelot includes LL97 compliance services at NO additional charge: annual benchmarking, penalty modeling, capital upgrade planning, and rebate/incentive capture.</p>
</div>
</div>` : ''}

<!-- PAGE 7: COMPETITOR ANALYSIS -->
<div class="section section-cream">
<div class="section-title">Competitive Position</div>
<div class="section-sub">${isSelfManaged ? 'Self-managed buildings benefit most from professional management' : `Analysis of current management: ${d.managementCompany}`}</div>
${isSelfManaged ? `
<div class="core-svc"><h4>Self-Managed \u2192 Professional Management</h4><p>Many of our most successful client relationships began with self-managed buildings. Our 90-day transition process is designed specifically to make this change seamless, with zero disruption to residents or building operations. You gain: weekly inspections, 24/7 emergency response, in-house CPA, compliance expertise, and technology that elevates every aspect of building life.</p></div>
` : `
<div class="core-svc"><h4>Why Boards Are Switching</h4><p>Buildings managed by large firms often experience: slow response times, junior PMs rotating through, cookie-cutter processes, outsourced accounting, and no proprietary technology. Boards that switch to Camelot consistently report better communication (73%), faster response times (48-hour guarantee vs weeks), and average annual savings of $45,000 in the first 90 days.</p></div>
`}
</div>

<!-- PAGE 8: WHY CAMELOT -->
<div class="section section-white">
<div class="section-title">Why Camelot</div>
<div class="section-sub">The institutional power of a full-service firm. The accountability of a dedicated partner.</div>
<table class="compare-table">
<thead><tr><th>Large Firms</th><th>CAMELOT</th><th>Solo Operators</th></tr></thead>
<tbody>
<tr><td>Your building is one of 500+</td><td><strong>Your building is a priority</strong></td><td>Limited staff, limited hours</td></tr>
<tr><td>Junior PM assigned to you</td><td><strong>Senior leadership on every call</strong></td><td>One person handles everything</td></tr>
<tr><td>Cookie-cutter processes</td><td><strong>Custom strategy for your asset</strong></td><td>Reactive, not proactive</td></tr>
<tr><td>Outsourced accounting</td><td><strong>In-house CPAs, full transparency</strong></td><td>Basic bookkeeping</td></tr>
<tr><td>Slow emergency response</td><td><strong>24/7 direct management line</strong></td><td>Unavailable nights &amp; weekends</td></tr>
<tr><td>No proprietary tech</td><td><strong>Merlin AI + ConciergePlus</strong></td><td>Paper-based systems</td></tr>
</tbody>
</table>
<div class="compare-tagline">Boutique scale. Institutional capability. Owner&rsquo;s mentality.</div>
</div>

<!-- PAGE 9: ABOUT CAMELOT -->
<div class="section section-cream">
<div class="section-title">About Camelot</div>
<div class="section-sub">Who we are and what drives us</div>
<div class="mission-stmt">&ldquo;To protect, enhance, and elevate the value of every property we manage through transparency, precision, and proactive hands-on care.&rdquo;</div>
<p style="font-size:12px;color:#555;line-height:1.7;margin-bottom:20px">Since 2006, Camelot Realty Group has built a reputation as one of New York\u2019s premier boutique property management firms \u2014 blending hands-on service, financial expertise, and innovative technology. We manage condominiums, cooperatives, multifamily rentals, and mixed-use properties across Manhattan, Brooklyn, Queens, Bronx, Westchester, NJ, CT, and Florida. We are independently owned and operated.</p>
<div class="about-stats">
<div class="about-stat"><div class="val">130+</div><div class="lbl">Properties Managed</div></div>
<div class="about-stat"><div class="val">$500M+</div><div class="lbl">Transactions Closed</div></div>
<div class="about-stat"><div class="val">20+</div><div class="lbl">Years in Business</div></div>
<div class="about-stat"><div class="val">1.2M+</div><div class="lbl">Sq Ft Under Mgmt</div></div>
</div>
<div style="font-size:11px;color:#C5A55A;text-align:center;margin-top:16px;font-weight:500">\u2B50 RED Awards 2025: Property Management Company of the Year</div>
<div style="font-size:10px;color:#999;text-align:center;margin-top:8px">Member: REBNY | SPONY | NYARM | IREM | BOMA | NARPM | NY Apartment Association</div>
</div>

<!-- PAGE 10: CORE SERVICES -->
<div class="section section-white">
<div class="section-title">Core Services</div>
<div class="section-sub">Comprehensive management tailored to ${d.buildingName}</div>
<div class="core-svc"><h4>Property &amp; Asset Management</h4><p>Weekly site visits by senior management. Vendor coordination, proactive inspections, and cost reduction. 24/7 emergency response with direct access to decision-makers. Buildings treated like owner-managed assets.</p></div>
<div class="core-svc"><h4>In-House CPA &amp; Financials</h4><p>Dedicated CPAs \u2014 never outsourced. Monthly board-ready financial reports, 5-year capital planning, real-time arrears tracking, vendor benchmarking, and zero-fee payment processing.</p></div>
<div class="core-svc"><h4>Compliance &amp; Risk Management</h4><p>LL11/97, FISP Cycle 10, LL152, HPD, RPIE, boiler and elevator compliance. Zero-penalty track record.${d.violationsOpen > 0 ? ` We\u2019ve identified <strong>${d.violationsOpen} compliance items</strong> that our team can address as part of your transition.` : ''}</p></div>
</div>

<!-- PAGE 11: VALUE-ADDED -->
<div class="section section-cream">
<div class="section-title">Value-Added Services</div>
<div class="section-sub">Specialized capabilities included with your management engagement</div>
<div class="va-grid">
<div class="va-card"><h5>Brokerage &amp; Sublet Processing</h5><p>Licensed brokers, background checks, flip tax, subletting compliance</p></div>
<div class="va-card"><h5>Project Management</h5><p>Full construction oversight, contractor coordination, capital projects</p></div>
<div class="va-card"><h5>Offering Plans &amp; House Rules</h5><p>Drafted, modified, and updated in-house by our legal team</p></div>
<div class="va-card"><h5>In-House Attorney Advisory</h5><p>Free legal consultation, lease reviews, dispute resolution</p></div>
<div class="va-card"><h5>Fractional Senior PM / GM</h5><p>Senior-level leadership at a fraction of full-time cost</p></div>
<div class="va-card"><h5>Licensed Mortgage Broker</h5><p>Shareholder refinancing, board financing, rate analysis</p></div>
<div class="va-card"><h5>Audits, Analytics &amp; Reports</h5><p>Vendor analysis, market reports, AI-powered meeting minutes</p></div>
<div class="va-card"><h5>Staff Training &amp; Supervision</h5><p>Written SOPs, performance reviews, 24/7 staff support line</p></div>
</div>
</div>

<!-- PAGE 12: COMPLIANCE CALENDAR -->
<div class="section section-white">
<div class="section-title">Compliance &amp; Local Law 97</div>
<div class="section-sub">Proactive compliance calendar \u2014 we never let a deadline slip</div>
<div class="compliance-row">
<div class="compliance-card"><div class="month">January</div><h5>Tax Appeals</h5><p>Strategic filing to reduce assessments</p></div>
<div class="compliance-card"><div class="month">June</div><h5>RPIE Filings</h5><p>Income and expense data for NYC Finance</p></div>
<div class="compliance-card"><div class="month">September</div><h5>HPD Registration</h5><p>Multi-family registration compliance</p></div>
<div class="compliance-card"><div class="month">December</div><h5>Budgeting</h5><p>Capital calls, operating budgets, reserves</p></div>
</div>
</div>

<!-- PAGE 13: TECHNOLOGY -->
<div class="section section-cream">
<div class="section-title">Technology Platform</div>
<div class="section-sub">Proprietary tools connecting data, intelligence, and operations</div>
<div style="font-family:'Playfair Display',Georgia,serif;font-size:14px;color:#C5A55A;text-align:center;margin-bottom:20px;font-weight:600">Merlin AI &nbsp;+&nbsp; Camelot Central &nbsp;+&nbsp; ConciergePlus</div>
<div class="tech-cols">
<div class="tech-col"><h4>For Board &amp; Management</h4><ul><li>Group and individual messaging</li><li>Utility usage tracking</li><li>Building files &amp; documents</li><li>Compliance status updates</li><li>AI-powered meeting minutes</li><li>Real-time financial dashboards</li></ul></div>
<div class="tech-col"><h4>For Residents</h4><ul><li>ConciergePlus portal + mobile app</li><li>Pay maintenance \u2014 zero bank fees</li><li>AI chatbot support 24/7</li><li>Book amenities &amp; download docs</li><li>Direct staff contact</li><li>Work order tracking &amp; updates</li></ul></div>
</div>
</div>

<!-- PAGE 14: 90-DAY TRANSITION -->
<div class="section section-white">
<div class="section-title">The 90-Day Transition</div>
<div class="section-sub">A proven onboarding process that minimizes disruption</div>
<div class="transition-grid">
<div class="trans-card"><h4>Month 1: Assessment</h4><div class="sub">Full audit, FREE inspection, staff review</div><ul><li>Full file &amp; data transfer</li><li>FREE building inspection ($2,500 value)</li><li>Staff audit &amp; performance review</li><li>Vendor contract analysis &amp; re-bidding</li><li>Compliance review (LL11, LL97, HPD, FISP)</li></ul></div>
<div class="trans-card"><h4>Month 2: Stabilization</h4><div class="sub">SOPs, vendor re-bid, portal launch</div><ul><li>Written SOPs for all positions</li><li>Work order system configured</li><li>Vendor re-bidding &amp; optimization</li><li>Board portal setup &amp; training</li><li>Financial system migration</li></ul></div>
<div class="trans-card"><h4>Month 3: Optimization</h4><div class="sub">Tech live, reporting, capital roadmap</div><ul><li>Full technology stack operational</li><li>Resident portal &amp; mobile app</li><li>Monthly reporting cadence</li><li>5-Year capital roadmap delivered</li><li>Merlin AI fully operational</li></ul></div>
</div>
</div>

<!-- PAGE 15: PRICING -->
<div class="section section-cream">
<div class="section-title">The Proposed Investment</div>
<div class="section-sub">Flat-rate, all-inclusive \u2014 no percentage fees, no hidden surcharges</div>
<table class="invest-table">
<thead><tr><th>Service Component</th><th>Camelot Inclusion</th></tr></thead>
<tbody>
<tr><td>Annual Management Fee</td><td><strong>$${d.monthlyFee.toLocaleString()}/month</strong> ($${d.pricePerUnit}/unit \u00D7 ${d.units} units)</td></tr>
<tr><td>Online Payments (Maintenance/CC)</td><td class="free">ZERO Bank Fees</td></tr>
<tr><td>Technology Platform</td><td class="included">Included \u2014 Camelot Central + ConciergePlus + Merlin AI</td></tr>
<tr><td>Initial Building Inspection</td><td class="free">FREE ($2,500 value)</td></tr>
<tr><td>In-House CPA / Accounting</td><td class="included">Included \u2014 no outsourcing</td></tr>
<tr><td>LL97 Compliance Report</td><td class="included">Included \u2014 carbon cap modeling + roadmap</td></tr>
<tr><td>AI Board Meeting Minutes</td><td class="included">Included</td></tr>
<tr><td>In-House Attorney &amp; Engineer</td><td class="free">Free Advisory</td></tr>
</tbody>
</table>
<div style="font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#C5A55A;font-size:13px;margin-top:16px;text-align:center">Our efficiencies effectively pay for our management \u2014 through long-term savings on vendors, compliance penalties, and capital expenditures.</div>
</div>

<!-- PAGE 16: TESTIMONIALS -->
<div class="section section-white">
<div class="section-title">What Our Clients Say</div>
<div class="section-sub">Real feedback from boards and owners we serve</div>
<div class="testimonial-grid">
<div class="testimonial"><div class="qm">\u201C</div><p>Camelot has been a helpful agent representing our Co-op since we moved into our new home. We really relied on them for their experience in understanding protocols, building-wide systems, and the business of running a building.</p><div class="author">Brandon Miller</div><div class="author-title">Board President, 137 Franklin Street Apartment Corp</div></div>
<div class="testimonial"><div class="qm">\u201C</div><p>Valerie and David have been by my side as not only the best and most knowledgeable property managers but as family! Their experience and dedication is limitless and they go far beyond the expected.</p><div class="author">Evee Georgiadis</div><div class="author-title">Owner, 949 Park Avenue Condominium</div></div>
</div>
</div>

<!-- PAGE 17: BACK COVER -->
<div class="back-cover">
<img src="./images/camelot-logo-white.png" alt="Camelot" style="width:100px;margin-bottom:12px;opacity:0.85" onerror="this.style.display='none'">
<div class="wordmark">C &nbsp;A &nbsp;M &nbsp;E &nbsp;L &nbsp;O &nbsp;T</div>
<div class="pm-sub">Property Management</div>
<h2>Next Steps</h2>
<div class="tagline">We welcome the opportunity to discuss your needs<br>and refine our proposal to fit ${d.buildingName}&rsquo;s requirements.</div>
<div class="contact-name">${CAMELOT.principal}, ${CAMELOT.title}</div>
<div class="contact-info">${CAMELOT.phone} | ${CAMELOT.mobile}<br><a href="mailto:${CAMELOT.email}">${CAMELOT.email}</a> | <a href="mailto:${CAMELOT.infoEmail}">${CAMELOT.infoEmail}</a><br><a href="https://${CAMELOT.web}">${CAMELOT.web}</a></div>
<div class="address">${CAMELOT.address}</div>
<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-top:12px">${CAMELOT.license1} | ${CAMELOT.license2}</div>
</div>

</div>
</body>
</html>`;
}
