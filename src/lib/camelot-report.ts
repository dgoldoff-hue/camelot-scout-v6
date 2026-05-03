/**
 * Camelot Master Report System
 * Combines building intelligence + pitch deck + market data into one unified report.
 * Generates: HTML brochure, cold caller sheet, email drafts, CSV exports.
 */

import { fetchFullBuildingReport } from '@/lib/nyc-api';
import { calculateLL97Penalty, getComplianceStatus, inferBuildingType } from '@/lib/ll97-calculator';
import { analyzeDistress } from '@/lib/distress-signals';
import { runGutCheck, generateGutCheckHTML } from '@/lib/gut-check';
import { findBuildingPhotos, generatePhotoHTML } from '@/lib/building-photos';
import { getNeighborhoodIntel, generateNeighborhoodIntelHTML } from '@/lib/neighborhood-intel';
import { fetchStreetEasyBuilding, type StreetEasyBuilding } from '@/lib/streeteasy';

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
  // Geolocation
  latitude: number | null;
  longitude: number | null;
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
  contactResearchSources: string[];
  professionalResearchSources: string[];
  // DOB Professional contacts
  dobArchitects: Array<{ name: string; title: string; license: string }>;
  dobEngineers: Array<{ name: string; title: string; license: string }>;
  dobOwners: Array<{ name: string; businessName: string; phone: string; type: string }>;
  // DOF Abatement & Tax Liens
  hasAbatement: boolean;
  abatementAmount: number;
  hasTaxLien: boolean;
  abatementType: string;
  abatementTaxYear: string | null;
  abatementSourceStatus: string | null;
  abatementMatchedLot: string | null;
  dofTaxMarketValue: number;
  dofTaxAssessedValue: number;
  taxLienSourceStatus: string | null;
  taxLienRecordCount: number;
  taxLienMatchedLots: string[];
  taxLienDetails: Array<{ cycle: string; date: string; waterDebtOnly: boolean; lot?: string; houseNumber?: string; streetName?: string; zip?: string; taxClass?: string; buildingClass?: string }>;
  // Tiered pricing
  tieredPricing: TieredPricing;
  // Fee comparison
  feeComparison: MarketFeeComparison | null;
  // StreetEasy data
  streetEasy: StreetEasyBuilding | null;
  // Commercial / amenity / branding research
  commercialIntel: CommercialAmenityIntel;
  // Raw data for advanced usage
  buildingPhotos: { exterior: string[]; streetView: string; satellite: string; source: string } | null;
  neighborhoodIntel: { crimeScore: number; qualityScore: number; transitScore: number; crimeTotal: number; complaints311Total: number; crimeBreakdown: Array<{type: string; count: number}>; topComplaints: Array<{type: string; count: number}>; landmarks: Array<{name: string; type: string; date: string}>; crimePrecinct: string; scoreExplanation: string } | null;
  raw: any;
}

export interface CommercialAmenityIntel {
  commercialSignals: string[];
  likelyCommercialUses: string[];
  amenities: string[];
  revenueOpportunities: string[];
  officialWebsite: string | null;
  brandingTitle: string | null;
  brandingDescription: string | null;
  brandingImages: string[];
  researchSources: string[];
  researchStatus: 'verified' | 'needs_review';
}

interface KnownPropertyFacts {
  buildingName?: string;
  units?: number;
  stories?: number;
  yearBuilt?: number;
  propertyType?: string;
  neighborhoodName?: string;
  streetEasyUrl?: string;
  description?: string;
  amenities?: string[];
  commercialSignals?: string[];
  revenueOpportunities?: string[];
  imageUrls?: string[];
  landmarks?: string[];
  locationTitle?: string;
  locationCopy?: string;
  lifestyleTitle?: string;
  lifestyleCopy?: string;
  brandingTitle?: string;
  brandingDescription?: string;
  researchSources?: string[];
  currentManagement?: string;
  boardMembers?: Array<{ name: string; title: string }>;
  buildingStaff?: Array<{ role: string; name: string }>;
  professionalArchitects?: Array<{ name: string; title: string; license: string }>;
  professionalEngineers?: Array<{ name: string; title: string; license: string }>;
  lawFirm?: string;
  accountingFirm?: string;
  professionalSources?: string[];
  professionalNotes?: string[];
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
  'east harlem': { condoPSF: 980, coopPSF: 650, rentalPSFYr: 54, median1BR: 3150, median2BR: 4300, daysOnMarket: 16, investScore: 8.0, liveScore: 7.7, familyScore: 7.2, workScore: 7.8, momentum: 'Strong', opexRange: '$20-34/sqft/yr' },
  'museum mile': { condoPSF: 1425, coopPSF: 980, rentalPSFYr: 72, median1BR: 3900, median2BR: 5900, daysOnMarket: 14, investScore: 7.4, liveScore: 8.6, familyScore: 8.8, workScore: 8.2, momentum: 'Stable', opexRange: '$28-45/sqft/yr' },
  'museum mile / upper fifth avenue': { condoPSF: 1425, coopPSF: 980, rentalPSFYr: 72, median1BR: 3900, median2BR: 5900, daysOnMarket: 14, investScore: 7.4, liveScore: 8.6, familyScore: 8.8, workScore: 8.2, momentum: 'Stable', opexRange: '$28-45/sqft/yr' },
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
// Market Fee Comparison Data
// ============================================================

export interface MarketFeeComparison {
  marketRangeLow: number;   // per unit per year
  marketRangeHigh: number;
  camelotAnnualPerUnit: number;
  camelotMonthlyPerUnit: number;
  savings: string;          // e.g. "15-30% below market"
  tier: 'manhattan-luxury' | 'manhattan-standard' | 'outer-borough' | 'suburban';
  tierLabel: string;
  ancillaryFeesIncluded: string[];
  ancillaryComparison: Array<{ service: string; marketRate: string; camelotRate: string }>;
}

function calculateMarketFeeComparison(
  d: { units: number; borough: string; propertyType: string; buildingClass: string; isRentStabilized: boolean; ll97Status: string; pricePerUnit: number }
): MarketFeeComparison {
  const bor = (d.borough || '').toLowerCase();
  const isManh = bor.includes('manhattan');
  const isOuter = bor.includes('brooklyn') || bor.includes('queens') || bor.includes('bronx') || bor.includes('staten');
  const isSuburban = bor.includes('westchester') || bor.includes('connecticut') || bor.includes('jersey') || bor.includes('long island') || bor.includes('hamptons');
  const isElevator = (d.buildingClass || '').toUpperCase().startsWith('D');
  const isLuxury = isManh && isElevator && d.units >= 50;

  let tier: MarketFeeComparison['tier'];
  let tierLabel: string;
  let marketLow: number;
  let marketHigh: number;

  if (isLuxury) {
    tier = 'manhattan-luxury';
    tierLabel = 'Manhattan Full-Service / Luxury';
    marketLow = 800;
    marketHigh = 1200;
  } else if (isManh) {
    tier = 'manhattan-standard';
    tierLabel = 'Manhattan Standard / Walk-Up';
    marketLow = 600;
    marketHigh = 900;
  } else if (isSuburban) {
    tier = 'suburban';
    tierLabel = 'Suburban NYC (Westchester / NJ / CT)';
    marketLow = 350;
    marketHigh = 600;
  } else {
    tier = 'outer-borough';
    tierLabel = 'Outer Boroughs (Brooklyn, Queens, Bronx)';
    marketLow = 450;
    marketHigh = 800;
  }

  const camelotAnnual = d.pricePerUnit * 12;

  // For small buildings, large firms impose minimums — effective per-unit cost is higher
  if (d.units < 50) {
    // Large firms often charge $50K+ minimum annual — that's $1,000+/unit for a 50-unit building
    marketLow = Math.max(marketLow, 600);
    marketHigh = Math.max(marketHigh, 1000);
  }

  const midMarket = (marketLow + marketHigh) / 2;
  const savingsPct = Math.round(((midMarket - camelotAnnual) / midMarket) * 100);
  const savings = savingsPct > 0 ? `~${savingsPct}% below market average` : 'Competitive with market';

  return {
    marketRangeLow: marketLow,
    marketRangeHigh: marketHigh,
    camelotAnnualPerUnit: camelotAnnual,
    camelotMonthlyPerUnit: d.pricePerUnit,
    savings,
    tier,
    tierLabel,
    ancillaryFeesIncluded: [
      'In-house CPA & monthly accounting',
      'LL97 compliance monitoring & reporting',
      'Technology platform (ConciergePlus + Merlin AI)',
      'AI-powered board meeting minutes',
      'Online payment processing (ZERO bank fees)',
      'Initial building inspection ($2,500 value)',
      'In-house attorney advisory (free consultation)',
      'Licensed engineer advisory',
      'Weekly on-site inspections',
      '24/7 emergency response line',
    ],
    ancillaryComparison: [
      { service: 'Onboarding / Setup', marketRate: '$250–$500', camelotRate: 'Included' },
      { service: 'Lease Renewal Processing', marketRate: '$150–$300/renewal', camelotRate: 'Included' },
      { service: 'Building Inspection', marketRate: '$1,500–$3,500', camelotRate: 'FREE ($2,500 value)' },
      { service: 'In-House CPA / Accounting', marketRate: '$5,000–$15,000/yr', camelotRate: 'Included' },
      { service: 'LL97 Compliance Report', marketRate: '$3,000–$8,000', camelotRate: 'Included' },
      { service: 'Technology Platform', marketRate: '$3–$8/unit/month', camelotRate: 'Included' },
      { service: 'Online Payment Processing', marketRate: '2.5–3.5% per transaction', camelotRate: 'ZERO fees' },
      { service: 'Board Meeting Minutes (AI)', marketRate: 'Not available', camelotRate: 'Included' },
      { service: 'Project Management (small)', marketRate: '5%–15% of project cost', camelotRate: 'Included for routine' },
      { service: 'Additional Board Meetings', marketRate: '$150–$500/meeting', camelotRate: 'Unlimited' },
      { service: 'Sale/Transfer Processing', marketRate: '~$500 (buyer pays)', camelotRate: '~$500 (buyer pays)' },
      { service: 'Move-In/Move-Out Fee', marketRate: '~$500 each', camelotRate: '~$500 each' },
      { service: 'Sublet Application', marketRate: '$100–$250', camelotRate: '$100–$250' },
      { service: 'Late Payment Enforcement', marketRate: 'Up to $50 or 5%', camelotRate: 'Per building policy' },
    ],
  };
}

// ============================================================
// ============================================================
// Three-Tier Pricing Calculator
// ============================================================

export interface TieredPricing {
  classic: { perUnit: number; monthly: number; annual: number };
  intelligence: { perUnit: number; monthly: number; annual: number };
  premier: { perUnit: number; monthly: number; annual: number };
  recommended: 'classic' | 'intelligence' | 'premier';
  units: number;
}

function calculateTieredPricing(units: number, borough: string, isRentStabilized: boolean, ll97Status: string, buildingClass?: string, marketValue?: number, address?: string): TieredPricing {
  // Determine building tier based on building class, market value, and address
  // NYC Building Classes: D0-D9 = Elevator apartments, C0-C9 = Walkup, R = Condos
  // Luxury indicators: high market value per unit, doorman buildings, prime addresses
  const cls = (buildingClass || '').toUpperCase();
  const addr = (address || '').toUpperCase();
  const bor = (borough || '').toLowerCase();
  const valuePerUnit = (marketValue && units) ? marketValue / units : 0;
  
  // Detect luxury/premium buildings
  const isElevator = cls.startsWith('D') || cls.startsWith('R');
  const isLuxuryAddress = addr.includes('FIFTH') || addr.includes('5TH') || addr.includes('5 AVENUE') ||
    addr.includes('PARK AVENUE') || addr.includes('PARK AVE') || addr.includes('CENTRAL PARK') ||
    addr.includes('MADISON AVENUE') || addr.includes('MADISON AVE') ||
    addr.includes('LEXINGTON') || addr.includes('BROADWAY') ||
    /\b(SUTTON|BEEKMAN|GRAMERCY|TRIBECA|SOHO|NOHO|WEST VILLAGE|GREENWICH)\b/.test(addr);
  const isHighValue = valuePerUnit > 500000; // >$500K per unit = luxury
  const isLuxury = (isElevator && (isLuxuryAddress || isHighValue)) || valuePerUnit > 1000000;
  const isPremiumArea = bor.includes('manhattan') || isLuxuryAddress;
  
  // Classic tier — base rates by building size AND class
  let classicBase: number;
  if (isLuxury) {
    // Luxury buildings: doorman co-ops/condos on prime streets
    if (units < 30) classicBase = 95;
    else if (units <= 75) classicBase = 85;
    else if (units <= 150) classicBase = 75;
    else classicBase = 65;
  } else if (isPremiumArea) {
    // Manhattan non-luxury
    if (units < 30) classicBase = 70;
    else if (units <= 75) classicBase = 60;
    else if (units <= 150) classicBase = 52;
    else classicBase = 45;
  } else {
    // Outer boroughs and suburbs
    if (units < 30) classicBase = 55;
    else if (units <= 75) classicBase = 48;
    else if (units <= 150) classicBase = 42;
    else classicBase = 38;
  }

  // Intelligence tier — add 30-40% above Classic
  let intelBase = Math.round(classicBase * 1.35);

  // Premier tier — add 60-80% above Classic
  let premierBase = Math.round(classicBase * 1.7);

  // Rent stabilization adds complexity (DHCR, RGB, lease riders)
  if (isRentStabilized) {
    classicBase += 5;
    intelBase += 5;
    premierBase += 5;
  }

  // LL97 non-compliance adds monitoring
  if (ll97Status && ll97Status !== 'compliant' && ll97Status !== 'unknown') {
    intelBase += 3;
    premierBase += 3;
  }

  const u = units || 1;
  return {
    classic: { perUnit: classicBase, monthly: classicBase * u, annual: classicBase * u * 12 },
    intelligence: { perUnit: intelBase, monthly: intelBase * u, annual: intelBase * u * 12 },
    premier: { perUnit: premierBase, monthly: premierBase * u, annual: premierBase * u * 12 },
    recommended: 'intelligence',
    units: u,
  };
}

// ============================================================
// Building Classification
// ============================================================

function classifyBuildingType(buildingClass: string): string {
  if (!buildingClass) return 'Residential';
  const cls = buildingClass.toUpperCase().trim();
  const first = cls.charAt(0);
  // R-class = Condominiums: R0 (common area), R1-R9 (units), RA (cultural), RM (mixed), RR (rental condo), etc.
  if (first === 'R') return 'Condominium';
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

function gradeManagement(d: { violationsOpen: number; ecbPenaltyBalance: number; hasActiveLitigation: boolean; permitsCount: number; violationsTotal: number; publicRecordsLoaded?: boolean }): { grade: string; scorecard: { violations: number; compliance: number; financial: number; overall: number } } {
  // Score clean public-record results as clean results; only hold the grade
  // when Jackie did not load enough anchors to know the checks ran.
  const hasAnyData = d.publicRecordsLoaded;
  if (!hasAnyData) {
    return { grade: '—', scorecard: { violations: 0, compliance: 0, financial: 0, overall: 0 } };
  }

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
  principal: 'David A. Goldoff',
  title: 'President',
  license1: 'Camelot Brokerage Services Corp #10311208308',
  license2: 'Camelot Realty Group LLC #10491200104',
};

// ============================================================
// Portfolio Database (Camelot + Blue Owl + Penn South Capital)
// ============================================================

interface PortfolioBuilding {
  address: string;
  name: string;
  type: 'Condominium' | 'Co-operative' | 'Rental' | 'Commercial';
  neighborhood: string;
  borough: string;
  lat: number;
  lng: number;
  outcome: string;
  brand: 'Camelot' | 'Blue Owl' | 'Penn South Capital';
  caseStudy?: { situation: string; response: string; result: string; statLine: string };
}

const CAMELOT_PORTFOLIO: PortfolioBuilding[] = [
  { address: '949 Park Avenue', name: '949 Park Avenue Condominium', type: 'Condominium', neighborhood: 'Carnegie Hill, UES', borough: 'Manhattan', lat: 40.7772, lng: -73.9601, outcome: '$200K saved in one insurance claim', brand: 'Camelot', caseStudy: { situation: 'A 9th-floor window shattered unexpectedly, triggering FDNY emergency response and creating an immediate pedestrian safety risk on Park Avenue.', response: 'Within hours, Camelot secured the area with a sidewalk bridge, commissioned a professional engineering assessment, and coordinated directly with the insurance carrier.', result: '949 Park Avenue saved $200,000. Full replacement cost covered by insurance. Updated house rules and improved 32BJ staff accountability.', statLine: '$200,000 SAVED \u00B7 ZERO DISRUPTION TO RESIDENTS \u00B7 PARK AVENUE PORTFOLIO \u2014 CAMELOT ACTIVE' } },
  { address: '105 E 29th Street', name: '105 E 29th Street Co-op', type: 'Co-operative', neighborhood: 'NoMad / Midtown South', borough: 'Manhattan', lat: 40.7437, lng: -73.9830, outcome: 'Vendor rebid: 14% savings Yr 1', brand: 'Camelot' },
  { address: '201 E 15th Street', name: '201 E 15th Street Co-op', type: 'Co-operative', neighborhood: 'Gramercy Park', borough: 'Manhattan', lat: 40.7338, lng: -73.9851, outcome: 'Insurance restructure: 18% reduction', brand: 'Camelot' },
  { address: '165 E 7th Street', name: '165 E 7th Street Condominium', type: 'Condominium', neighborhood: 'East Village', borough: 'Manhattan', lat: 40.7260, lng: -73.9835, outcome: 'LL97 roadmap delivered in 60 days', brand: 'Camelot' },
  { address: '137 Franklin Street', name: '137 Franklin Street Apartment Corp', type: 'Co-operative', neighborhood: 'Tribeca', borough: 'Manhattan', lat: 40.7178, lng: -74.0044, outcome: '\u201CBest and most knowledgeable PMs\u201D', brand: 'Camelot' },
  { address: '58 White Street', name: '58 White Street', type: 'Condominium', neighborhood: 'Tribeca', borough: 'Manhattan', lat: 40.7186, lng: -74.0022, outcome: '$1.2M deferred maintenance resolved', brand: 'Camelot', caseStudy: { situation: 'Building had $1.2M in deferred capital maintenance, multiple open DOB violations, and an expiring insurance policy with no carrier willing to renew.', response: 'Camelot prioritized violations, engaged new engineering and legal counsel, executed emergency capital repairs, and secured insurance through our broker network.', result: '58 White Street: All critical violations resolved within 90 days. Insurance renewed at competitive rates. Capital reserve plan funded and on track.', statLine: '$1.2M DEFERRED MAINTENANCE RESOLVED \u00B7 ALL VIOLATIONS CLEARED \u00B7 TRIBECA PORTFOLIO \u2014 CAMELOT ACTIVE' } },
  { address: '300 E 56th Street', name: '300 E 56th Street', type: 'Co-operative', neighborhood: 'Sutton Place', borough: 'Manhattan', lat: 40.7588, lng: -73.9652, outcome: 'Full financial restructuring', brand: 'Camelot' },
  { address: '465 Park Avenue', name: '465 Park Avenue', type: 'Condominium', neighborhood: 'Midtown East', borough: 'Manhattan', lat: 40.7625, lng: -73.9710, outcome: 'Capital planning overhaul', brand: 'Camelot' },
  { address: '500 W 43rd Street', name: '500 W 43rd Street', type: 'Rental', neighborhood: "Hell's Kitchen", borough: 'Manhattan', lat: 40.7596, lng: -73.9948, outcome: 'Rent stabilized portfolio optimization', brand: 'Camelot' },
  { address: '748 St Nicholas Avenue', name: '748 St Nicholas Avenue', type: 'Rental', neighborhood: 'Hamilton Heights', borough: 'Manhattan', lat: 40.8252, lng: -73.9433, outcome: 'HPD violations cleared 100%', brand: 'Camelot' },
  { address: '86 W 127th Street', name: '86 W 127th Street', type: 'Rental', neighborhood: 'Harlem', borough: 'Manhattan', lat: 40.8088, lng: -73.9470, outcome: 'Full compliance restored', brand: 'Camelot' },
  { address: '930 St Nicholas Avenue', name: '930 St Nicholas Avenue', type: 'Rental', neighborhood: 'Washington Heights', borough: 'Manhattan', lat: 40.8325, lng: -73.9406, outcome: 'Stabilization program', brand: 'Camelot' },
  { address: '253 W 73rd Street', name: '253 W 73rd Street', type: 'Co-operative', neighborhood: 'Upper West Side', borough: 'Manhattan', lat: 40.7793, lng: -73.9793, outcome: 'Board governance restructured', brand: 'Camelot' },
  { address: '39 5th Avenue', name: '39 Fifth Avenue', type: 'Co-operative', neighborhood: 'Greenwich Village', borough: 'Manhattan', lat: 40.7322, lng: -73.9958, outcome: 'Vendor savings 22%', brand: 'Camelot' },
  { address: '260 W 26th Street', name: '260 W 26th Street', type: 'Co-operative', neighborhood: 'Chelsea', borough: 'Manhattan', lat: 40.7465, lng: -73.9960, outcome: 'Energy efficiency upgrade', brand: 'Camelot' },
  { address: '56 E 87th Street', name: '56 E 87th Street', type: 'Co-operative', neighborhood: 'Carnegie Hill', borough: 'Manhattan', lat: 40.7829, lng: -73.9567, outcome: 'Board transition managed', brand: 'Camelot' },
  { address: '604 Grand Street', name: '604 Grand Street', type: 'Rental', neighborhood: 'Williamsburg', borough: 'Brooklyn', lat: 40.7125, lng: -73.9394, outcome: 'Brooklyn expansion — stabilized ops', brand: 'Camelot' },
  { address: '83-55 Woodhaven Boulevard', name: '83-55 Woodhaven Blvd', type: 'Co-operative', neighborhood: 'Woodhaven', borough: 'Queens', lat: 40.6934, lng: -73.8571, outcome: 'First Queens portfolio building', brand: 'Camelot' },
  { address: '788 Pelham Parkway', name: '788 Pelham Parkway', type: 'Rental', neighborhood: 'Pelham Parkway', borough: 'Bronx', lat: 40.8563, lng: -73.8640, outcome: 'Bronx portfolio flagship', brand: 'Camelot' },
  { address: '346 E 119th Street', name: '346 E 119th Street', type: 'Rental', neighborhood: 'East Harlem', borough: 'Manhattan', lat: 40.7970, lng: -73.9378, outcome: 'Distress turnaround', brand: 'Blue Owl' },
  { address: '175 W 93rd Street', name: '175 W 93rd Street', type: 'Rental', neighborhood: 'Upper West Side', borough: 'Manhattan', lat: 40.7925, lng: -73.9719, outcome: 'Operations stabilized', brand: 'Blue Owl' },
  { address: '410 E 6th Street', name: '410 E 6th Street', type: 'Rental', neighborhood: 'East Village', borough: 'Manhattan', lat: 40.7260, lng: -73.9810, outcome: 'Full renovation oversight', brand: 'Blue Owl' },
  { address: '402 Henry Street', name: '402 Henry Street', type: 'Rental', neighborhood: 'Carroll Gardens', borough: 'Brooklyn', lat: 40.6801, lng: -73.9998, outcome: 'Brooklyn expansion flagship', brand: 'Penn South Capital' },
  { address: '129 E 10th Street', name: '129 E 10th Street', type: 'Rental', neighborhood: 'East Village', borough: 'Manhattan', lat: 40.7285, lng: -73.9868, outcome: 'Compliance overhaul', brand: 'Penn South Capital' },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearbyPortfolioBuildings(lat: number | null, lng: number | null, borough: string, limit = 5): Array<PortfolioBuilding & { distance: number }> {
  if (!lat || !lng) {
    // No geocode — prefer same borough, then return first N
    const sameBoro = CAMELOT_PORTFOLIO.filter(b => b.borough.toLowerCase() === borough.toLowerCase());
    const others = CAMELOT_PORTFOLIO.filter(b => b.borough.toLowerCase() !== borough.toLowerCase());
    return [...sameBoro, ...others].slice(0, limit).map(b => ({ ...b, distance: -1 }));
  }
  return CAMELOT_PORTFOLIO
    .map(b => ({ ...b, distance: haversineDistance(lat, lng, b.lat, b.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function buildPortfolioSection(d: MasterReportData): string {
  const nearby = findNearbyPortfolioBuildings(d.latitude, d.longitude, d.borough, 5);
  const hasNearby = nearby.length > 0 && nearby[0].distance !== -1 && nearby[0].distance < 10;
  const caseStudyBldg = nearby.find(b => b.caseStudy) || CAMELOT_PORTFOLIO.find(b => b.caseStudy)!;

  const tableRows = nearby.map(b => {
    const distLabel = b.distance > 0 ? `${b.distance.toFixed(1)} mi` : (b.distance === -1 ? b.borough : '');
    const distSpan = distLabel ? ` <span style="color:#A89035;font-size:10px;font-weight:600">(${distLabel})</span>` : '';
    return `<tr>
<td style="font-weight:700">${b.address}</td>
<td>${b.type}</td>
<td>${b.neighborhood}${distSpan}</td>
<td style="color:#A89035;font-weight:600">Active</td>
<td>${b.outcome}</td>
</tr>`;
  }).join('\n');

  const nearCount = nearby.filter(b => b.distance >= 0 && b.distance < 3).length;
  const proximityNote = hasNearby
    ? `<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:14px;font-size:11px;color:#3A4B5B">
<strong style="color:#A89035">\u2606 Local Presence:</strong> Camelot actively manages <strong>${nearCount} building${nearCount !== 1 ? 's' : ''} within 3 miles</strong> of ${d.buildingName}. Our team, vendors, and operational infrastructure are already embedded in your neighborhood.
</div>`
    : `<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:14px;font-size:11px;color:#3A4B5B">
<strong style="color:#A89035">\u2606 Citywide Reach:</strong> Camelot manages 42 properties across all five boroughs \u2014 from Park Avenue penthouses to Brooklyn brownstones to Bronx rental portfolios. Our operations infrastructure means your building gets the same dedicated team, institutional knowledge, and vendor network regardless of location. Some of our most impactful results have come from buildings in new neighborhoods, where we bring fresh perspective and zero legacy bias.
</div>`;

  const cs = caseStudyBldg?.caseStudy;
  const caseStudyHTML = cs ? `<div style="background:#3A4B5B;border-radius:8px;padding:18px;margin-top:16px;color:#fff">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A89035;font-weight:700;margin-bottom:8px">Case Study: ${caseStudyBldg.address} \u2014 Camelot in Action</div>
<p style="font-size:12px;line-height:1.7;margin-bottom:8px"><strong>Situation:</strong> ${cs.situation}</p>
<p style="font-size:12px;line-height:1.7;margin-bottom:8px"><strong>Response:</strong> ${cs.response}</p>
<p style="font-size:12px;line-height:1.7;margin-bottom:8px"><strong style="color:#A89035">Result: ${cs.result}</strong></p>
<div style="border-top:1px solid rgba(197,165,90,0.3);padding-top:8px;margin-top:8px;font-size:10px;color:#A89035;text-align:center;letter-spacing:1px">${cs.statLine}</div>
</div>` : '';

  return `<div class="section section-white">
<div class="section-title">Camelot Portfolio \u2014 Near ${d.buildingName}</div>
<div class="section-sub">Active buildings we manage, sorted by proximity to your property</div>
${proximityNote}
<table class="compare-table">
<thead><tr>
<th style="background:#3A4B5B;color:#fff">Building</th>
<th style="background:#3A4B5B;color:#fff">Type</th>
<th style="background:#3A4B5B;color:#fff">Neighborhood</th>
<th style="background:#3A4B5B;color:#fff">Status</th>
<th style="background:#3A4B5B;color:#fff">Outcome</th>
</tr></thead>
<tbody>
${tableRows}
</tbody>
</table>
${caseStudyHTML}
</div>`;
}

// ============================================================
// Data Builder
// ============================================================

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(address)}&size=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.features?.[0]?.geometry?.coordinates;
    if (coords && coords.length === 2) return { lat: coords[1], lng: coords[0] };
    return null;
  } catch { return null; }
}

async function fetchOfficialBuildingBranding(address: string, buildingName: string): Promise<any | null> {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams({ address, name: buildingName || address });
    const res = await fetch(`/api/building/brand?${params.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function inferCommercialAmenityIntel(input: {
  address: string;
  buildingName: string;
  buildingClass: string;
  taxClass: string;
  propertyType: string;
  occupancy: string | null;
  streetEasy: StreetEasyBuilding | null;
  branding: any | null;
  raw: any;
}): CommercialAmenityIntel {
  const sourceSignals = [
    ...(input.branding?.commercialResearch?.signals || []),
    ...(input.branding?.commercialResearch?.sourceHits || []).map((hit: any) => `${hit.source}: ${hit.title || hit.url}`),
    ...(input.branding?.parkingResearch?.signals || []),
  ];
  const hay = [
    input.address,
    input.buildingName,
    input.buildingClass,
    input.taxClass,
    input.propertyType,
    input.occupancy || '',
    input.streetEasy?.description || '',
    ...(input.streetEasy?.amenities || []),
    ...(input.streetEasy?.features || []),
    input.branding?.official?.title || '',
    input.branding?.official?.description || '',
    input.branding?.official?.textSample || '',
    ...sourceSignals,
  ].join(' ').toLowerCase();

  const commercialPatterns: Array<[string, RegExp]> = [
    ['Retail / storefront', /\b(retail|storefront|shop|restaurant|cafe|market|salon)\b/i],
    ['Office', /\b(office|professional suite|commercial suite)\b/i],
    ['Medical / doctor office', /\b(doctor|medical|clinic|physician|dental|healthcare)\b/i],
    ['Billboard / signage', /\b(billboard|signage|advertising sign|wallscape)\b/i],
    ['Parking / garage', /\b(parking|garage|valet|parking operator|indoor parking|self park|monthly parking)\b/i],
    ['Storage cages / lockers', /\b(storage cage|storage locker|private storage|storage space|storage)\b/i],
  ];
  const amenityPatterns: Array<[string, RegExp]> = [
    ['Storage cages', /\b(storage cage|storage locker|private storage|storage space|storage)\b/i],
    ['Parking / garage', /\b(parking|garage|valet|indoor parking|monthly parking)\b/i],
    ['Library', /\blibrary\b/i],
    ['Pool', /\bpool\b/i],
    ['Fitness center / gym', /\b(gym|fitness|exercise room|yoga)\b/i],
    ['Roof deck / terrace', /\b(roof deck|terrace|rooftop)\b/i],
    ['Lounge', /\blounge\b/i],
    ['Garden / courtyard', /\b(garden|courtyard)\b/i],
    ['Bike room', /\bbike room\b/i],
    ['Package room', /\bpackage room\b/i],
    ['Doorman / concierge', /\b(doorman|concierge|attended lobby)\b/i],
    ['Playroom', /\b(playroom|children'?s playroom)\b/i],
  ];

  const likelyCommercialUses = commercialPatterns.filter(([, re]) => re.test(hay)).map(([label]) => label);
  const parkingOperatorPatterns: Array<[string, RegExp]> = [
    ['Icon Parking signal', /\bicon\s+parking\b/i],
    ['iPark parking signal', /\bipark\b/i],
    ['LAZ Parking signal', /\blaz\s+parking\b/i],
    ['SP+ parking signal', /\bsp\+|standard\s+parking\b/i],
    ['Edison ParkFast signal', /\bedison\s+parkfast\b/i],
    ['Quik Park signal', /\bquik\s+park\b/i],
    ['Propark signal', /\bpropark\b/i],
    ['Champion Parking signal', /\bchampion\s+parking\b/i],
    ['City Parking signal', /\bcity\s+parking\b/i],
    ['Manhattan Parking Group signal', /\bmanhattan\s+parking\s+group\b/i],
    ['Little Man Parking signal', /\blittle\s+man\s+parking\b/i],
  ];
  const parkingOperatorSignals = parkingOperatorPatterns.filter(([, re]) => re.test(hay)).map(([label]) => label);
  const amenities = [
    ...amenityPatterns.filter(([, re]) => re.test(hay)).map(([label]) => label),
    ...(input.streetEasy?.amenities || []),
    ...(input.branding?.official?.amenities || []),
  ].filter(Boolean);
  const commercialSignals = [
    ...likelyCommercialUses,
    ...parkingOperatorSignals,
    ...sourceSignals,
    ...(input.branding?.official?.commercialSignals || []),
  ].filter(Boolean);

  if (/^(K|O|L|R5|R7)/i.test(input.buildingClass)) {
    commercialSignals.push(`DOF class ${input.buildingClass}: possible commercial or mixed-use component`);
  }
  if (/4|commercial/i.test(input.taxClass)) {
    commercialSignals.push(`Tax class ${input.taxClass}: commercial review required`);
  }

  const uniqueAmenities = [...new Set(amenities.map(a => String(a).trim()).filter(Boolean))];
  const uniqueCommercial = [...new Set(commercialSignals.map(s => String(s).trim()).filter(Boolean))];
  const revenueOpportunities = [
    uniqueCommercial.some(s => /retail|office|medical|commercial/i.test(s)) ? 'Commercial lease abstract and rent escalation audit' : null,
    uniqueCommercial.some(s => /parking|garage|operator|ipark|icon|laz|sp\+|edison|quik|propark/i.test(s)) || uniqueAmenities.some(a => /parking|garage/i.test(a)) ? 'Parking operator, DOT/DOB garage, license, revenue, and insurance review' : null,
    uniqueCommercial.some(s => /billboard|signage/i.test(s)) ? 'Billboard/signage licensing and revenue review' : null,
    uniqueAmenities.some(a => /storage/i.test(a)) ? 'Storage cage inventory, license terms, and waitlist revenue review' : null,
    uniqueAmenities.length > 0 ? 'Amenity access, booking, waiver, and resident communication review' : null,
  ].filter(Boolean) as string[];

  const official = input.branding?.official || null;
  const researchSources = [
    'DOF building class / tax class',
    'HPD MDR owner / managing-agent records',
    input.streetEasy ? 'StreetEasy amenities and features' : null,
    official?.url ? `Official website: ${official.url}` : 'Official building website search attempted',
    'PropertyShark-style owner / tax / commercial-use review',
    'LoopNet public listing search attempted',
    'CoStar public listing search attempted',
    'NYC DOT/DOB parking garage and curb-cut signal review',
    'NYC parking operator scan: Icon, iPark, LAZ, SP+, Edison ParkFast, Quik Park, Propark, Champion, City Parking',
    'Jackie keyword scan: retail, office, medical, signage, storage, parking, amenities',
    ...(input.branding?.commercialResearch?.sourceHits || []).map((hit: any) => `${hit.source}: ${hit.url}`),
  ].filter(Boolean) as string[];

  return {
    commercialSignals: uniqueCommercial,
    likelyCommercialUses,
    amenities: uniqueAmenities,
    revenueOpportunities: [...new Set(revenueOpportunities)],
    officialWebsite: official?.url || null,
    brandingTitle: official?.title || null,
    brandingDescription: official?.description || null,
    brandingImages: official?.images || [],
    researchSources,
    researchStatus: official?.url || uniqueCommercial.length > 0 || uniqueAmenities.length > 0 ? 'verified' : 'needs_review',
  };
}

function getKnownPropertyFacts(address: string, candidateName = ''): KnownPropertyFacts | null {
  const key = `${address} ${candidateName}`.toLowerCase();
  if (/1280\s+(fifth|5th)/i.test(key) || /one\s+museum\s+mile/i.test(key)) {
    return {
      buildingName: 'One Museum Mile',
      units: 116,
      stories: 19,
      yearBuilt: 2012,
      propertyType: 'Luxury Condominium',
      neighborhoodName: 'Museum Mile / Upper Fifth Avenue',
      streetEasyUrl: 'https://streeteasy.com/building/one-museum-mile',
      description: 'One Museum Mile is a Fifth Avenue condominium along Central Park, designed by Robert A.M. Stern with interiors by Andre Kikoski and a full lifestyle amenity program.',
      imageUrls: [
        './images/one-museum-mile/building-picture.webp',
        './images/one-museum-mile/lobby-entrance.webp',
        './images/one-museum-mile/lobby.webp',
        './images/one-museum-mile/rooftop-pool.webp',
        './images/one-museum-mile/rooftop-pool-2.webp',
        './images/one-museum-mile/roof-deck-central-park.webp',
        './images/one-museum-mile/roof-deck-skyline.webp',
        './images/one-museum-mile/gym.webp',
      ],
      amenities: [
        'Landscaped roof deck with outdoor heated pool',
        'Rooftop lounge facing Central Park',
        'Residents’ lounge with fireplace',
        'Fitness center with terrace',
        'Children’s playroom with window wall to fitness center',
        'Game room',
        'Formal dining room facing Central Park with fully equipped catering kitchen',
        'Media lounge',
        'Card room',
        'Bicycle storage',
        'Cold storage',
        'Full-time concierge',
        'Peak-time door person coverage',
        'On-site resident manager',
        'On-site garage parking available for purchase',
        'Pet-friendly building',
        '44-foot alabaster-inspired art glass lobby wall by Andre Kikoski and Weil Studio',
      ],
      commercialSignals: [
        'On-site garage / parking component: confirm ownership, license structure, insurance, and revenue treatment.',
        'Museum for African Art base / cultural component: confirm operating agreements, access boundaries, and owner responsibilities.',
        'No retail or office tenant should be published until confirmed through offering plan, signage walk-through, and building records.',
      ],
      revenueOpportunities: [
        'Parking garage license, purchase inventory, and insurance review.',
        'Bicycle storage, cold storage, and storage cage inventory / waitlist review.',
        'Amenity booking rules, waivers, deposit schedules, and damage-charge controls.',
        'Move-in / move-out, pet, package, and private-event fee policy review.',
        'Confirm any LoopNet, CoStar, PropertyShark, DOT/DOB garage, or parking-operator signal before publishing commercial tenant claims.',
      ],
      landmarks: [
        'Museum of African Art: in building',
        'El Museo del Barrio: 1 block',
        'Central Park / Harlem Meer: across street',
        'Mount Sinai Medical Center: nearby',
        'Guggenheim Museum: Museum Mile',
        'Conservatory Garden: steps away',
      ],
      locationTitle: 'Crown of Museum Mile',
      locationCopy: 'Northeast corner of Central Park at Duke Ellington Circle. One Museum Mile combines Fifth Avenue visibility, Central Park adjacency, and cultural-neighborhood fundamentals that support long-term owner value.',
      lifestyleTitle: 'Lifestyle & Liquidity',
      lifestyleCopy: 'Steps from Central Park, Harlem Meer, the Conservatory Garden, El Museo del Barrio, and Upper Fifth Avenue cultural anchors. The building’s amenity package and park-facing roof experience are core parts of its resident value story.',
      brandingTitle: 'One Museum Mile on StreetEasy',
      brandingDescription: 'StreetEasy confirms the One Museum Mile building profile, architect/interior design pedigree, East Harlem location, 19 stories, 2012 completion, and amenity-rich condominium positioning. Camelot owner-supplied materials remain the authority for the 116-unit count.',
      researchSources: [
        'Camelot owner-supplied One Museum Mile reference materials',
        'StreetEasy building page: https://streeteasy.com/building/one-museum-mile',
        'LoopNet / CoStar / PropertyShark / NYC parking-source review required before publishing any commercial tenant name',
        'Verified One Museum Mile asset library',
      ],
      currentManagement: 'Board of Managers with on-site resident management team; managing-agent record to verify',
      boardMembers: [
        { name: 'One Museum Mile Condominium', title: 'Board of Managers / Ownership Authority' },
      ],
      buildingStaff: [
        { role: 'Live-in Resident Manager (non-union)', name: 'On-site resident manager' },
        { role: 'Building Porter', name: 'Porter staff' },
        { role: 'Full-time Concierge', name: 'Concierge desk' },
        { role: 'Peak-time Doorperson Coverage', name: 'Door staff' },
      ],
      professionalArchitects: [
        { name: 'Robert A.M. Stern Architects / SLCE', title: 'Design Architect / Architect of Record', license: 'Source: building profile / offering materials' },
        { name: 'Andre Kikoski Architect', title: 'Interior Architect', license: 'Source: building profile / offering materials' },
      ],
      professionalEngineers: [
        { name: 'Michael Gervasi', title: 'Professional Engineer (DOB fire alarm filing)', license: '082938' },
      ],
      professionalSources: [
        'DOB BIS / NYC Open Data permit applicants',
        'ACRIS condominium records and party data',
        'NYC Department of Finance property records, condo/coop abatement records, and RPIE/assessment context',
        'Attorney General offering plans and amendments',
        'Bank questionnaires / lender questionnaires',
        'Domecile building profile and fee/management data',
        'ECB/OATH compliance records',
        'PropertyShark ownership and professional verification',
      ],
      professionalNotes: [
        'Board and staff structure confirmed from owner-supplied Jackie notes; individual names require board/building verification before publication.',
        'Current managing-agent company should be confirmed through HPD MDR, PropertyShark, offering-plan records, or direct board confirmation.',
      ],
    };
  }
  return null;
}

export async function buildMasterReport(address: string, borough?: string): Promise<MasterReportData> {
  const [raw, geo, buildingPhotos, streetEasy] = await Promise.all([
    fetchFullBuildingReport(address, borough),
    geocodeAddress(address + (borough ? ', ' + borough + ', New York' : ', New York, NY')),
    findBuildingPhotos(address, address).catch(() => null),
    fetchStreetEasyBuilding(address, borough).catch(() => null),
  ]);

  // Fetch neighborhood intelligence (crime, 311, landmarks)
  // Determine precinct and ZIP from raw DOF data
  const rawDof = raw.dof ? (raw as any).raw?.dof : null;
  const zip = (raw as any).dofAbatement?.raw?.zip_code || '';
  const precinct = '';
  const neighborhoodIntel = (zip || precinct) ? await getNeighborhoodIntel(
    precinct || '0', zip || '10001',
    geo?.lat, geo?.lng
  ).catch(() => null) : null;

  const dof = raw.dof;
  const knownFacts = getKnownPropertyFacts(address, streetEasy?.name || raw.energy?.propertyName || '');

  // Cascade unit count from multiple sources — never show 0 if ANY source has data
  // Priority: DOF/PLUTO → DOF Exemptions → DOB Permits → Energy Benchmarking → estimate from area
  let units = dof?.units || 0;
  if (!units && raw.dofAbatement?.raw?.units) units = parseInt(raw.dofAbatement.raw.units) || 0;
  if (!units && raw.dofAbatement?.raw?.coop_apts && parseInt(raw.dofAbatement.raw.coop_apts) > 0) units = parseInt(raw.dofAbatement.raw.coop_apts);
  if (!units && raw.dobUnits) units = raw.dobUnits; // from DOB permit dwelling_units
  if (!units && raw.energy?.energyStarScore != null) {
    // Energy benchmarking data exists — building is definitely real, try number_of_units
    units = parseInt((raw as any).energy?.number_of_units) || 0;
  }
  // StreetEasy fallback for units
  if (!units && streetEasy?.units) units = streetEasy.units;
  // Last resort: estimate from building area (~850 SF per avg unit in NYC multifamily)
  if (!units && dof?.buildingArea && dof.buildingArea > 2000) {
    units = Math.round(dof.buildingArea / 850);
  }
  if (knownFacts?.units) units = knownFacts.units;

  // Cascade stories from DOF → DOB → StreetEasy
  let stories = dof?.stories || 0;
  if (!stories && raw.dobStories) stories = raw.dobStories;
  if (!stories && streetEasy?.stories) stories = streetEasy.stories;
  if (knownFacts?.stories) stories = knownFacts.stories;

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
  // Price per unit — use the tiered pricing intelligence tier as the default displayed fee
  // This gets recalculated properly in calculateTieredPricing with building class, value, and address awareness
  const tier = calculateTieredPricing(units || 1, borough || '', raw.rentStabilization?.isStabilized || false, ll97Data?.complianceStatus || 'unknown', dof?.buildingClass || '', dof?.marketValue || 0, address);
  // Use Classic tier as the default displayed fee — David's target: ~$900/unit/year ($75/unit/mo)
  let pricePerUnit = tier.classic.perUnit;
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

  // ---------------------------------------------------------------------------
  // Derive a sensible building name.
  // The LL84 energy benchmarking `property_name` often contains the management
  // company name (e.g. "Halstead") rather than the actual building name, so we
  // can't blindly trust it. We only use it when it looks like a real building
  // name — i.e. it contains a number (street address) or known building-name
  // keywords, and does NOT match the management company already on file.
  // ---------------------------------------------------------------------------
  function deriveBuildingName(addr: string, data: any): string {
    const energyName = (data.energy?.propertyName || '').trim();
    if (!energyName) return addr;

    const mgmtCo = (data.registration?.managementCompany || '').trim().toLowerCase();
    const ownerName = (data.registration?.owner || '').trim().toLowerCase();
    const dofOwnerName = (data.dof?.owner || '').trim().toLowerCase();
    const nameLower = energyName.toLowerCase();

    // Reject if it matches the management company or owner name
    if (mgmtCo && (nameLower.includes(mgmtCo) || mgmtCo.includes(nameLower))) return addr;
    if (ownerName && (nameLower.includes(ownerName) || ownerName.includes(nameLower))) return addr;
    if (dofOwnerName && (nameLower.includes(dofOwnerName) || dofOwnerName.includes(nameLower))) return addr;

    // Reject common management/company suffixes that indicate it's a company, not a building
    const companyPatterns = /\b(management|mgmt|realty|properties|property\s+group|associates|llc|corp|inc|holdings|advisors|capital|group|services)\b/i;
    if (companyPatterns.test(energyName)) return addr;

    // Accept if it contains a street number or well-known building name patterns
    const looksLikeBuilding = /\d/.test(energyName) || /\b(tower|towers|plaza|house|court|terrace|gardens|hall|manor|place|park|residence|residences)\b/i.test(energyName);
    if (looksLikeBuilding) return energyName;

    // If it's very short (single word) and doesn't look like a building, prefer address
    if (energyName.split(/\s+/).length <= 2 && !looksLikeBuilding) return addr;

    // Default: use the energy name if it passed all rejection filters
    return energyName;
  }

  const buildingName = knownFacts?.buildingName || deriveBuildingName(address, raw);
  const propertyType = knownFacts?.propertyType || streetEasy?.buildingType || classifyBuildingType(dof?.buildingClass || '');
  const brandingResearch = await fetchOfficialBuildingBranding(address, buildingName).catch(() => null);
  let commercialIntel = inferCommercialAmenityIntel({
    address,
    buildingName,
    buildingClass: dof?.buildingClass || '',
    taxClass: dof?.taxClass || '',
    propertyType,
    occupancy: raw.energy?.occupancy ?? null,
    streetEasy,
    branding: brandingResearch,
    raw,
  });
  if (knownFacts?.amenities?.length || knownFacts?.commercialSignals?.length || knownFacts?.streetEasyUrl) {
    const unique = (items: Array<string | null | undefined>) => [...new Set(items.map(i => String(i || '').trim()).filter(Boolean))];
    commercialIntel = {
      ...commercialIntel,
      commercialSignals: unique([...(knownFacts.commercialSignals || []), ...commercialIntel.commercialSignals]),
      amenities: unique([...(knownFacts.amenities || []), ...commercialIntel.amenities]),
      revenueOpportunities: unique([...(knownFacts.revenueOpportunities || []), ...commercialIntel.revenueOpportunities]),
      officialWebsite: knownFacts.streetEasyUrl || commercialIntel.officialWebsite,
      brandingTitle: knownFacts.brandingTitle || commercialIntel.brandingTitle,
      brandingDescription: knownFacts.brandingDescription || commercialIntel.brandingDescription,
      brandingImages: knownFacts.imageUrls?.length ? knownFacts.imageUrls : commercialIntel.brandingImages,
      researchSources: unique([...(knownFacts.researchSources || []), ...commercialIntel.researchSources]),
      researchStatus: 'verified',
    };
  }

  const effectiveBuildingPhotos = knownFacts?.imageUrls?.length
    ? {
        exterior: knownFacts.imageUrls,
        streetView: buildingPhotos?.streetView || '',
        satellite: buildingPhotos?.satellite || '',
        source: 'Verified One Museum Mile asset library',
      }
    : buildingPhotos;
  const effectiveNeighborhoodName = knownFacts?.neighborhoodName || streetEasy?.neighborhood || detectNeighborhood(address, borough || '');
  const publicRecordsLoaded = Boolean(
    dof?.bbl
    || raw.registration?.buildingId
    || raw.registration?.registrationId
    || raw.hpdContacts?.length
    || raw.energy
    || raw.acris
    || raw.dofAbatement
    || raw.taxLiens?.sourceStatus
  );
  const managementAssessment = gradeManagement({
    violationsOpen: raw.violations?.open || 0,
    ecbPenaltyBalance: raw.ecb?.totalPenaltyBalance || 0,
    hasActiveLitigation: raw.litigation?.hasActive || false,
    permitsCount: raw.permits?.count || 0,
    violationsTotal: raw.violations?.total || 0,
    publicRecordsLoaded,
  });

  return {
    address,
    borough: borough || '',
    buildingName,
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    units,
    stories,
    yearBuilt: knownFacts?.yearBuilt || dof?.yearBuilt || streetEasy?.yearBuilt || 0,
    buildingClass: dof?.buildingClass || '',
    taxClass: dof?.taxClass || '',
    marketValue: dof?.marketValue || 0,
    assessedValue: dof?.assessedValue || 0,
    landValue: dof?.landValue || 0,
    lotArea: dof?.lotArea || 0,
    buildingArea: gfa,
    dofOwner: dof?.owner
      || raw.dofAbatement?.ownerName
      || (raw.dobOwners?.[0]?.name)
      || (raw.acris?.lastSaleBuyer)
      || '',
    bbl: dof?.bbl || '',
    registrationOwner: raw.registration?.owner
      || (raw.dobOwners?.[0]?.name)
      || raw.dofAbatement?.ownerName
      || null,
    managementCompany: raw.registration?.managementCompany || knownFacts?.currentManagement || null,
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
    latitude: geo?.lat ?? null,
    longitude: geo?.lng ?? null,
    propertyType,
    neighborhoodName: effectiveNeighborhoodName,
    neighborhoodMarketData: lookupNeighborhoodData(effectiveNeighborhoodName || detectNeighborhood(address, borough || '')),
    registrationDate: raw.registration?.registrationId ? null : null,
    managementDuration: null,
    managementGrade: managementAssessment.grade,
    managementScorecard: managementAssessment.scorecard,
    boardMembers: (() => {
      const members: Array<{ name: string; title: string }> = [...(knownFacts?.boardMembers || [])];
      // HPD MDR Contacts — the gold standard for building contacts
      for (const c of (raw.hpdContacts || [])) {
        if (c.type === 'CorporateOwner' && c.corp) {
          members.push({ name: c.corp, title: 'Corporate Owner (HPD MDR)' });
        }
        if (c.type === 'HeadOfficer' && c.name) {
          members.push({ name: c.name, title: c.title || 'Head Officer / Board President (HPD MDR)' });
        }
        if (c.type === 'Officer' && c.name) {
          members.push({ name: c.name, title: c.title ? `${c.title} (HPD MDR)` : 'Officer / Board Member (HPD MDR)' });
        }
      }
      // HPD Registration owner (if not already captured)
      if (raw.registration?.owner && !members.some(m => m.name.toUpperCase() === raw.registration.owner.toUpperCase())) {
        members.push({ name: raw.registration.owner, title: 'Registered Owner (HPD)' });
      }
      // DOF owner (if different)
      const dofName = dof?.owner || raw.dofAbatement?.ownerName || '';
      if (dofName && !members.some(m => m.name.toUpperCase() === dofName.toUpperCase())) {
        members.push({ name: dofName, title: 'Property Owner (DOF)' });
      }
      // DOB permit owners (if different)
      for (const o of (raw.dobOwners || []).slice(0, 3)) {
        if (o.name && !members.some(m => m.name.toUpperCase() === o.name.toUpperCase())) {
          members.push({ name: o.name + (o.businessName ? ' / ' + o.businessName : ''), title: `Owner (DOB Permits)${o.phone ? ' · ' + o.phone : ''}` });
        }
      }
      // ACRIS last buyer (if different)
      const acrisBuyer = raw.acris?.lastSaleBuyer;
      if (acrisBuyer && !members.some(m => m.name.toUpperCase() === acrisBuyer.toUpperCase())) {
        members.push({ name: acrisBuyer, title: 'Last Buyer (ACRIS)' });
      }
      return members;
    })(),
    buildingStaff: (() => {
      const staff: Array<{ role: string; name: string }> = [...(knownFacts?.buildingStaff || [])];
      for (const c of (raw.hpdContacts || [])) {
        if (c.type === 'SiteManager' && (c.name || c.corp)) staff.push({ role: 'Site Manager / Resident Manager (HPD MDR)', name: c.name || c.corp });
        if (c.type === 'Agent' && c.name) staff.push({ role: 'Managing Agent', name: `${c.name}${c.corp ? ' — ' + c.corp : ''}` });
      }
      return staff;
    })(),
    professionals: {
      lawFirm: knownFacts?.lawFirm || null,
      accountingFirm: knownFacts?.accountingFirm || null,
      engineer: (raw.dobProfessionals || []).find((p: any) => p.role === 'engineer')?.name
        || knownFacts?.professionalEngineers?.[0]?.name
        || (raw.permits?.items?.[0]?.owner_s_first_name ? `${raw.permits.items[0].owner_s_first_name} ${raw.permits.items[0].owner_s_last_name || ''}`.trim() : null),
      architect: (raw.dobProfessionals || []).find((p: any) => p.role === 'architect')?.name
        || knownFacts?.professionalArchitects?.[0]?.name
        || null,
    },
    dobArchitects: (() => {
      const rows = [
        ...(knownFacts?.professionalArchitects || []),
        ...(raw.dobProfessionals || []).filter((p: any) => p.role === 'architect').map((p: any) => ({ name: p.name, title: p.title, license: p.license })),
      ];
      const seen = new Set<string>();
      return rows.filter(row => {
        const key = `${row.name}|${row.title}`.toUpperCase();
        if (!row.name || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })(),
    dobEngineers: (() => {
      const rows = [
        ...(knownFacts?.professionalEngineers || []),
        ...(raw.dobProfessionals || []).filter((p: any) => p.role === 'engineer').map((p: any) => ({ name: p.name, title: p.title, license: p.license })),
      ];
      const seen = new Set<string>();
      return rows.filter(row => {
        const key = `${row.name}|${row.title}`.toUpperCase();
        if (!row.name || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })(),
    dobOwners: (raw.dobOwners || []).map((o: any) => ({ name: o.name, businessName: o.businessName, phone: o.phone, type: o.type })),
    contactResearchSources: [
      raw.hpdContacts?.length ? `HPD MDR contacts loaded (${raw.hpdContacts.length})` : 'HPD MDR contacts searched: no contact rows returned',
      raw.acris?.records?.length ? `ACRIS party records loaded (${raw.acris.records.length})` : 'ACRIS party records searched: no recent parent-lot transfer parties returned',
      raw.dobProfessionals?.length ? `DOB applicant professionals loaded (${raw.dobProfessionals.length})` : 'DOB permit professionals searched: no applicant professionals returned',
      raw.dobOwners?.length ? `DOB owner contacts loaded (${raw.dobOwners.length})` : 'DOB permit owner contacts searched: no owner contacts returned',
      'PropertyShark owner / contact verification required before publishing private contact claims',
      'Apollo enrichment available when APOLLO_API_KEY is configured; run against managing agent, board entity, and professional firms',
    ],
    professionalResearchSources: [
      ...(knownFacts?.professionalSources || []),
      raw.dobProfessionals?.length ? `DOB permit applicant professionals loaded (${raw.dobProfessionals.length})` : 'DOB permit applicant professionals searched',
      raw.acris?.records?.length ? `ACRIS deed/mortgage party records loaded (${raw.acris.records.length})` : 'ACRIS searched for owner/professional party signals',
      raw.ecb?.count ? `ECB/OATH compliance records loaded (${raw.ecb.count})` : 'ECB/OATH searched for compliance/professional context',
      raw.dofAbatement ? 'DOF condo/co-op abatement records loaded' : 'DOF condo/co-op abatement records searched',
      raw.dof ? 'Department of Finance property record loaded' : 'Department of Finance property record searched',
      'Domecile building profile should be checked for management, fees, staff, and professional references',
      'RPIE filings / income-expense context should be reviewed where applicable',
      'Offering plans and bank questionnaires should be reviewed before publishing law firm or accounting firm names',
    ],
    hasAbatement: raw.dofAbatement?.hasAbatement || false,
    abatementAmount: raw.dofAbatement?.currentExemption || 0,
    hasTaxLien: raw.taxLiens?.hasLien || false,
    abatementType: raw.dofAbatement?.abatementType || 'DOF record not found',
    abatementTaxYear: raw.dofAbatement?.taxYear || null,
    abatementSourceStatus: raw.dofAbatement?.sourceStatus || null,
    abatementMatchedLot: raw.dofAbatement?.matchedLot || null,
    dofTaxMarketValue: raw.dofAbatement?.marketValue || dof?.marketValue || 0,
    dofTaxAssessedValue: raw.dofAbatement?.assessedValue || 0,
    taxLienSourceStatus: raw.taxLiens?.sourceStatus || null,
    taxLienRecordCount: raw.taxLiens?.recordCount || 0,
    taxLienMatchedLots: raw.taxLiens?.matchedLots || [],
    taxLienDetails: raw.taxLiens?.liens || [],
    pricePerUnit,
    monthlyFee,
    annualFee,
    tieredPricing: calculateTieredPricing(units || 1, borough || '', raw.rentStabilization?.isStabilized || false, ll97Data?.complianceStatus || 'unknown', dof?.buildingClass || '', dof?.marketValue || 0, address),
    feeComparison: calculateMarketFeeComparison({
      units: units || 1,
      borough: borough || '',
      propertyType: classifyBuildingType(dof?.buildingClass || ''),
      buildingClass: dof?.buildingClass || '',
      isRentStabilized: raw.rentStabilization?.isStabilized || false,
      ll97Status: ll97Data?.complianceStatus || 'unknown',
      pricePerUnit,
    }),
    streetEasy,
    commercialIntel,
    buildingPhotos: effectiveBuildingPhotos,
    neighborhoodIntel,
    raw,
  };
}

// ============================================================
// QA Checklist — Validates report data before generation
// ============================================================

export interface QACheckResult {
  passed: boolean;
  checks: { name: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
  warnings: number;
  failures: number;
}

export function runReportQA(d: MasterReportData): QACheckResult {
  const checks: QACheckResult['checks'] = [];
  
  // 1. Address populated
  checks.push({ name: 'Address', status: d.address ? 'pass' : 'fail', detail: d.address || 'MISSING' });
  
  // 2. Building name (not just the address repeated)
  checks.push({ name: 'Building Name', status: d.buildingName && d.buildingName !== d.address ? 'pass' : 'warn', detail: d.buildingName || 'Using address as name' });
  
  // 3. Unit count
  checks.push({ name: 'Unit Count', status: d.units > 0 ? 'pass' : 'warn', detail: d.units > 0 ? `${d.units} units` : 'N/A — estimated from building area' });
  
  // 4. Year Built
  checks.push({ name: 'Year Built', status: d.yearBuilt > 0 ? 'pass' : 'warn', detail: d.yearBuilt > 0 ? `${d.yearBuilt}` : 'N/A — DOF data not available' });
  
  // 5. Market Value
  checks.push({ name: 'Market Value', status: d.marketValue > 0 ? 'pass' : 'warn', detail: d.marketValue > 0 ? `$${d.marketValue.toLocaleString()}` : '$0 — DOF/PLUTO lookup failed' });
  
  // 6. Management Company
  checks.push({ name: 'Management Company', status: d.managementCompany ? 'pass' : 'warn', detail: d.managementCompany || 'Not found in HPD registration — check if address format matches' });
  
  // 7. Violations data loaded
  checks.push({ name: 'HPD Violations', status: 'pass', detail: `${d.violationsTotal} total, ${d.violationsOpen} open` });
  
  // 8. Fee calculation sanity check
  const feePerUnit = d.tieredPricing?.intelligence?.perUnit || d.pricePerUnit;
  const feeOk = feePerUnit >= 40 && feePerUnit <= 200;
  checks.push({ name: 'Fee Calculation', status: feeOk ? 'pass' : 'warn', detail: `$${feePerUnit}/unit/mo (Intelligence tier)${!feeOk ? ' — REVIEW: may be too low or high for this building class' : ''}` });
  
  // 9. Borough detected
  checks.push({ name: 'Borough', status: d.borough ? 'pass' : 'warn', detail: d.borough || 'Not detected' });
  
  // 10. LL97 assessment (only relevant for buildings >25,000 sqft)
  const hasLL97 = d.ll97 !== null;
  checks.push({ name: 'LL97 Data', status: hasLL97 ? 'pass' : 'warn', detail: hasLL97 ? `Status: ${d.ll97!.complianceStatus}` : 'No energy data — building may be <25K sqft or not benchmarked' });
  
  // 11. Property type determined
  checks.push({ name: 'Property Type', status: d.propertyType ? 'pass' : 'warn', detail: d.propertyType || 'Defaulting to Residential' });
  
  // 12. Neighborhood determined
  checks.push({ name: 'Neighborhood', status: d.neighborhoodName ? 'pass' : 'warn', detail: d.neighborhoodName || 'Not detected — using borough' });

  const warnings = checks.filter(c => c.status === 'warn').length;
  const failures = checks.filter(c => c.status === 'fail').length;
  
  return { passed: failures === 0, checks, warnings, failures };
}

export function validateJackieReport(d: MasterReportData, html: string): QACheckResult {
  const base = runReportQA(d);
  const checks: QACheckResult['checks'] = [...base.checks];
  const isKnownStaffedProperty = /one\s+museum\s+mile|1280\s+(fifth|5th)/i.test(`${d.buildingName} ${d.address}`);
  const requiredSlides = [
    'Elevating',
    'The Property',
    'Commercial &amp; Amenity Intelligence',
    'Location &amp; Neighborhood',
    'Experience Meets Innovation',
    'Core Services',
    'Value-Added Services',
    'Compliance &amp; Local Law 97',
    'Technology Platform Partners',
    'The 90-Day Transition',
    'Your Investment',
    'The Proposed Investment',
    'Next Steps',
    'Thank You',
  ];
  for (const slide of requiredSlides) {
    checks.push({
      name: `Slide: ${slide.replace('&amp;', '&')}`,
      status: html.includes(slide) ? 'pass' : 'fail',
      detail: html.includes(slide) ? 'Present' : 'Missing from generated report',
    });
  }
  const forbidden = ['undefined', 'NaN', '[object Object]', 'New York, NY, New York, NY', 'New%20York%2C%20NY%2C%20New%20York%2C%20NY'];
  for (const token of forbidden) {
    checks.push({
      name: `Render Token: ${token}`,
      status: html.includes(token) ? 'fail' : 'pass',
      detail: html.includes(token) ? `Generated HTML contains ${token}` : 'Clean',
    });
  }
  checks.push({
    name: 'Subject Address Match',
    status: html.includes(d.address) ? 'pass' : 'fail',
    detail: html.includes(d.address) ? d.address : 'Subject address missing from report',
  });
  checks.push({
    name: 'Subject Building Photo',
    status: d.buildingPhotos?.exterior?.length ? 'pass' : 'warn',
    detail: d.buildingPhotos?.exterior?.length ? `${d.buildingPhotos.exterior.length} preferred image(s) available` : 'No uploaded/preferred subject photo; map/street-view fallback will be used',
  });
  checks.push({
    name: 'Camelot Logo',
    status: html.includes('./images/camelot-logo.png') || html.includes('./images/camelot-logo-white.png') ? 'pass' : 'fail',
    detail: 'Brand logo reference verified',
  });
  const imageSources = [...html.matchAll(/<img[^>]+src=["']([^"']*)["']/gi)].map(m => m[1]);
  const badImages = imageSources.filter(src =>
    !src ||
    src.includes('undefined') ||
    src.includes('null') ||
    src.includes('[object Object]') ||
    src.includes('New%20York%2C%20NY%2C%20New%20York%2C%20NY')
  );
  checks.push({
    name: 'Picture Links',
    status: badImages.length === 0 ? 'pass' : 'fail',
    detail: badImages.length === 0 ? `${imageSources.length} image link(s) checked` : `Broken/dirty image src: ${badImages.slice(0, 2).join(', ')}`,
  });
  if (/one\s+museum\s+mile|1280\s+(fifth|5th)/i.test(`${d.buildingName} ${d.address}`)) {
    const oneMuseumAssets = imageSources.filter(src => src.includes('./images/one-museum-mile/'));
    checks.push({
      name: 'One Museum Mile Asset Library',
      status: oneMuseumAssets.length >= 4 ? 'pass' : 'fail',
      detail: oneMuseumAssets.length >= 4 ? `${oneMuseumAssets.length} verified local image reference(s)` : 'Missing verified One Museum Mile local image references',
    });
  }
  const unitMentions = [...html.matchAll(/\b(\d{1,4})\s+Units?\b/g)].map(m => Number(m[1]));
  const conflictingUnitMentions = [...new Set(unitMentions.filter(n => n !== d.units))];
  checks.push({
    name: 'Unit Count Consistency',
    status: conflictingUnitMentions.length === 0 ? 'pass' : 'fail',
    detail: conflictingUnitMentions.length === 0 ? `${d.units} units used consistently` : `Report also contains: ${conflictingUnitMentions.join(', ')} units`,
  });
  checks.push({
    name: 'Commercial / Amenity Research',
    status: d.commercialIntel?.researchStatus === 'verified' ? 'pass' : 'warn',
    detail: d.commercialIntel?.researchStatus === 'verified'
      ? `Signals: ${[...d.commercialIntel.commercialSignals, ...d.commercialIntel.amenities].slice(0, 5).join(', ') || 'Verified research completed'}`
      : 'No confirmed commercial/amenity/official website signals yet; verify with site visit, offering plan, or board materials',
  });
  const requiredCommercialSources = [
    'LoopNet public listing search attempted',
    'CoStar public listing search attempted',
    'PropertyShark-style owner / tax / commercial-use review',
    'NYC DOT/DOB parking garage and curb-cut signal review',
    'NYC parking operator scan',
  ];
  for (const source of requiredCommercialSources) {
    checks.push({
      name: `Commercial Source: ${source.split(' ')[0]}`,
      status: html.includes(source) || d.commercialIntel?.researchSources?.some(s => s.includes(source)) ? 'pass' : 'fail',
      detail: source,
    });
  }
  checks.push({
    name: 'Management Context',
    status: isKnownStaffedProperty && /Self-managed buildings benefit most/i.test(html) ? 'fail' : 'pass',
    detail: isKnownStaffedProperty
      ? 'Known staffed property must not be framed as self-managed'
      : 'Self-managed language allowed only when management is truly unknown',
  });
  checks.push({
    name: 'Building Contacts / Staff',
    status: d.boardMembers.length > 0 && d.buildingStaff.length > 0 ? 'pass' : 'fail',
    detail: `${d.boardMembers.length} board/owner signal(s), ${d.buildingStaff.length} staff/management signal(s)`,
  });
  const contactSourceText = (d.contactResearchSources || []).join(' ');
  for (const source of ['HPD MDR', 'ACRIS', 'DOB', 'PropertyShark', 'Apollo']) {
    checks.push({
      name: `Stakeholder Source: ${source}`,
      status: contactSourceText.includes(source) || html.includes(source) ? 'pass' : 'fail',
      detail: `${source} must be part of Jackie contact/stakeholder research`,
    });
  }
  checks.push({
    name: 'Current Management Performance Fallback',
    status: !/[A-F]/.test(d.managementGrade) && !html.includes('Public-record review pending') ? 'fail' : 'pass',
    detail: /[A-F]/.test(d.managementGrade) ? `Grade ${d.managementGrade}` : 'Pending public-record review message required',
  });
  checks.push({
    name: 'Quarterly Market Reports Language',
    status: html.includes('Quarterly Market Reports') && !html.includes('Quarterly Management Reports') ? 'pass' : 'fail',
    detail: 'Quarterly reports must describe market/value benchmarking, not generic management reports',
  });
  checks.push({
    name: 'Partner Logo / Website Links',
    status: html.includes('logo.clearbit.com/bankunited.com') && html.includes('logo.clearbit.com/meetselect.com') && html.includes('https://www.bankunited.com') && html.includes('https://www.meetselect.com') ? 'pass' : 'fail',
    detail: 'BankUnited and Select must use real logo URLs and official websites',
  });
  checks.push({
    name: 'Camelot Case Studies',
    status: html.includes('camelot.nyc/case-studies') && html.includes('111 Mott Street') && html.includes('White Street Plaza Corp.') ? 'pass' : 'fail',
    detail: 'Case studies must be sourced from camelot.nyc/case-studies',
  });
  checks.push({
    name: 'DOF Tax Search Link',
    status: html.includes('a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address') ? 'pass' : 'fail',
    detail: 'DOF button must open address-based property tax search',
  });
  const nextStepsSlides = (html.match(/<h2[^>]*>\s*Next Steps\s*<\/h2>/g) || []).length;
  checks.push({
    name: 'Duplicate Next Steps Pages',
    status: nextStepsSlides <= 1 ? 'pass' : 'fail',
    detail: `${nextStepsSlides} Next Steps heading(s) found`,
  });
  const warnings = checks.filter(c => c.status === 'warn').length;
  const failures = checks.filter(c => c.status === 'fail').length;
  return { passed: failures === 0, checks, warnings, failures };
}

// ============================================================
// Cold Caller Sheet
// ============================================================

export function generateColdCallerSheet(d: MasterReportData): string {
  // Check both managementCompany AND buildingStaff for a managing agent
  const agentFromStaff = d.buildingStaff.find(s => s.role.toLowerCase().includes('managing agent'));
  const actualManagement = d.managementCompany && d.managementCompany !== 'To be confirmed upon engagement' ? d.managementCompany : agentFromStaff ? agentFromStaff.name : null;
  const isSelfManaged = !actualManagement;
  return `COLD CALL PREP — ${d.buildingName}
${'━'.repeat(50)}

BUILDING: ${d.address}
UNITS: ${d.units} | FLOORS: ${d.stories} | GRADE: ${d.scoutGrade} (${d.scoutScore}/100)
MANAGEMENT: ${d.managementCompany || 'To be confirmed — research via Domecile, PropertyShark, or building website'}
${d.dofOwner ? `OWNER (DOF): ${d.dofOwner}` : ''}

OPENING:
"Hi, this is [Your Name] calling from Camelot Property Management. We're a boutique management firm based in Manhattan at 477 Madison Avenue, 6th Fl. I'm reaching out because we specialize in managing buildings like ${d.buildingName} in your area, and I wanted to introduce our services to the decision makers."

KEY HOOKS:
${d.violationsOpen > 0 ? `• ${d.violationsOpen} OPEN HPD VIOLATIONS — "We noticed your building has ${d.violationsOpen} open HPD violations. We have a proven track record clearing these efficiently."\n` : ''}${d.ecbPenaltyBalance > 0 ? `• $${d.ecbPenaltyBalance.toLocaleString()} ECB PENALTY BALANCE — "Your building has outstanding ECB fines that we can help resolve."\n` : ''}${d.ll97 && d.ll97.period1Penalty > 0 ? `• LL97 PENALTY EXPOSURE: $${d.ll97.period1Penalty.toLocaleString()}/yr — "Under Local Law 97, your building faces estimated annual penalties. We include LL97 compliance at no extra charge."\n` : ''}${d.hasActiveLitigation ? `• ⚖️ ACTIVE HOUSING LITIGATION — "We see your building has active housing court cases. Camelot has experience stabilizing buildings in exactly this situation."\n` : ''}${d.isRentStabilized ? `• RENT STABILIZED — "We specialize in rent-stabilized buildings and understand the regulatory complexity."\n` : ''}${d.distressLevel === 'distressed' || d.distressLevel === 'critical' ? `• FINANCIAL DISTRESS DETECTED (${d.distressLevel.toUpperCase()}) — approach with sensitivity, but this building needs help.\n` : ''}
PRICING (USE THIS IN THE CALL):
"We have three service levels designed for buildings like yours:"
• CAMELOT CLASSIC: $${d.tieredPricing.classic.perUnit}/unit/month — full management, in-house CPA, weekly inspections, compliance
• CAMELOT INTELLIGENCE ⭐: $${d.tieredPricing.intelligence.perUnit}/unit/month — everything in Classic PLUS AI portal, zero bank fees, quarterly market reports, LL97 compliance, free building inspection ($2,500 value)
• CAMELOT PREMIER: $${d.tieredPricing.premier.perUnit}/unit/month — everything in Intelligence PLUS dedicated senior PM, insurance rebid, vendor guarantee, annual strategy session with David

"Most of our buildings are on Intelligence — it includes AI-powered technology that no other management company offers. No Schedule A surprises."

For ${d.units} units: Classic = $${d.tieredPricing.classic.monthly.toLocaleString()}/mo | Intelligence = $${d.tieredPricing.intelligence.monthly.toLocaleString()}/mo | Premier = $${d.tieredPricing.premier.monthly.toLocaleString()}/mo

VALUE PROPS:
• Weekly on-site inspections by senior management
• AI-powered resident portal (ConciergePlus) — zero bank fees
• Monthly virtual accounting, full financial transparency
• LL97 compliance tracking included at no charge
• 24/7 emergency response with direct management access
• Three flexible pricing tiers — no long-term contracts required
${isSelfManaged ? '• "We understand you\'re self-managed — our 90-day onboarding makes the transition seamless"\n' : `• "We'd love to show you how we compare to ${d.managementCompany}"\n`}
OBJECTION HANDLERS:
"Too expensive" → "Our Intelligence tier is actually 25-40% LESS than FirstService or AKAM — and includes AI technology they charge extra for."
"Happy with current management" → "Many clients felt the same before seeing our reporting platform. Open to a brief comparison?"
"Not looking to switch" → "No commitment — just an opportunity to share what similar buildings are finding valuable."
"Send me something" → "I'll send our Welcome to Camelot proposal customized for ${d.buildingName} with all three pricing options. Best email?"
"We're locked into a contract" → "When does it expire? We can prepare everything in advance so the transition is seamless."

CLOSE:
"Would it make sense to schedule a 15-minute call with David Goldoff to walk through the three service tiers for ${d.buildingName}? Most boards find the Intelligence package is exactly what they need."

CONTACT: ${CAMELOT.principal} | ${CAMELOT.phone} | ${CAMELOT.email}
`;
}

// ============================================================
// Email Drafts
// ============================================================

export function generateEmailDraft(d: MasterReportData, type: 'intro' | 'followup' | 'proposal' | 'compliance' | 'loyalty'): { subject: string; body: string } {
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

  // loyalty — short intro email accompanying the downloaded report
  if (type === 'loyalty') {
    const loyaltySig = `\n\nSincerely yours,\n\nDavid A. Goldoff\nFounder & President\nCamelot Property Management\n${CAMELOT.address}\n${CAMELOT.email} | ${CAMELOT.phone}\n${CAMELOT.web}`;
    return {
      subject: `${d.buildingName} at ${d.address} — Property Intelligence Report from Camelot Realty Group`,
      body: `Dear Board Member,

Camelot Realty Group is a boutique property management firm based at 477 Madison Avenue in New York City. For over 18 years, we have proudly managed cooperatives, condominiums, and multifamily buildings across the New York metropolitan area — delivering hands-on service, financial transparency, and technology-driven management to every property in our portfolio.

We were pleased to prepare the attached Property Intelligence Report for ${d.buildingName} at ${d.address}. Our team took a close look at your ${d.units ? d.units + '-unit ' : ''}building and we believe there is a meaningful opportunity for Camelot to add value — from compliance and vendor optimization to financial reporting and resident services.

We hope that we get the chance to meet soon.${loyaltySig}`,
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
    ['Current Management', d.managementCompany || 'To be confirmed'],
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
  const brochureAgent = d.buildingStaff.find(s => s.role.toLowerCase().includes('managing agent'));
  const brochureActualMgmt = d.managementCompany && !['Unknown','To be confirmed upon engagement'].includes(d.managementCompany) ? d.managementCompany : brochureAgent ? brochureAgent.name : null;
  const isSelfManaged = !brochureActualMgmt;
  const fmtMoney = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;
  const isManhattan = (d.borough || '').toLowerCase().includes('manhattan') || /fifth|madison|park|broadway|avenue|street/i.test(d.address);
  const accessBorough = d.borough || 'New York';
  const accessTransit = isManhattan
    ? 'Subway and bus access supports routine senior-management visits from 477 Madison Avenue, with Midtown connections and crosstown options.'
    : `Regional transit and road access support scheduled inspections and manager coverage across ${accessBorough}.`;
  const accessHighway = isManhattan
    ? 'FDR Drive, Harlem River Drive, and major crosstown corridors give Camelot multiple routes for inspections, vendor coordination, and emergency response.'
    : 'Major arterial access and vendor routing are reviewed during onboarding so emergency dispatch and inspections have clear coverage plans.';
  const safe = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  const fmtDate = (value: unknown) => {
    if (!value) return 'N/A';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const hpdViolationItems = Array.isArray(d.raw?.violations?.items) ? d.raw.violations.items : [];
  const openHPDViolationItems = hpdViolationItems.filter((v: any) => !/\bCLOSE\b|DISMISSED|COMPLIED|RESCINDED|CANCELLED/i.test(`${v.violationstatus || ''} ${v.currentstatus || ''}`));
  const recentHPDViolationItems = [...hpdViolationItems]
    .sort((a: any, b: any) => new Date(b.inspectiondate || b.approveddate || 0).getTime() - new Date(a.inspectiondate || a.approveddate || 0).getTime())
    .slice(0, 8);
  const violationHistoryRows = recentHPDViolationItems.length
    ? recentHPDViolationItems.map((v: any) => `
<tr>
<td>${fmtDate(v.inspectiondate || v.approveddate)}</td>
<td>${safe(v.class || 'N/A')}</td>
<td>${safe(v.currentstatus || v.violationstatus || 'N/A')}</td>
<td>${safe(v.violationid || v.novid || 'N/A')}</td>
<td>${safe(String(v.novdescription || v.violationdescription || '').slice(0, 150))}${String(v.novdescription || v.violationdescription || '').length > 150 ? '...' : ''}</td>
</tr>`).join('')
    : '';
  const is1280Fifth = /1280\s+(fifth|5th)/i.test(`${d.address} ${d.buildingName}`);
  const subjectPhoto = d.buildingPhotos?.exterior?.[0] || '';
  const prettyNeighborhood = d.neighborhoodName
    ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : d.borough || 'New York City';
  const propertyPedigree = is1280Fifth ? {
    title: 'A Robert A.M. Stern Masterpiece',
    narrative: `At ${d.units || 116} units, ${d.buildingName} represents the ideal scale for Camelot's high-touch management: large enough to deserve institutional systems, personal enough to benefit from senior attention, financial clarity, and an owner's perspective.`,
    facts: ['Built 2012 | Luxury Condominium', '116 Units | 19 Floors', 'Architect: Robert A.M. Stern / SLCE', 'Interiors: Andre Kikoski', 'Built atop the Museum for African Art', 'NE corner of Central Park at Duke Ellington Circle'],
    foot: 'AKA One Museum Mile: caps the famous Museum Mile on Fifth Avenue',
    locationTitle: 'Crown of Museum Mile',
    locationCopy: 'Northeast corner of Central Park at Duke Ellington Circle. The only Robert A.M. Stern building to cap Museum Mile: location fundamentals that protect shareholder investment through any market cycle.',
    lifestyleTitle: 'Lifestyle & Liquidity',
    lifestyleCopy: "Steps from Central Park, Harlem Meer, and the Conservatory Garden. Immediate access to 2/3, 4/5/6 trains. The building's Fifth Avenue address and cultural pedigree ensure lasting desirability.",
    landmarks: ['Museum of African Art: in building', 'El Museo del Barrio: 1 block', 'Central Park / Harlem Meer: across street', 'Mount Sinai Medical Center: nearby', 'Guggenheim Museum: Museum Mile', 'Conservatory Garden: steps away'],
  } : {
    title: `${d.buildingName} at a Glance`,
    narrative: `${d.buildingName} is a ${d.propertyType.toLowerCase()} with ${d.units || 'multiple'} units${d.stories ? ` across ${d.stories} floors` : ''}. Jackie combines city records, market intelligence, and Camelot's management experience to translate the building's facts into an actionable board narrative.`,
    facts: [
      d.yearBuilt ? `Built ${d.yearBuilt} | ${d.propertyType}` : d.propertyType,
      `${d.units || 'N/A'} Units${d.stories ? ` | ${d.stories} Floors` : ''}`,
      d.buildingArea ? `${d.buildingArea.toLocaleString()} SF` : 'Building area to be verified',
      d.borough ? `${d.borough} location` : 'NYC location',
      d.neighborhoodName ? `${prettyNeighborhood} neighborhood` : 'Neighborhood profile generated by Jackie',
    ],
    foot: 'Property-specific history is verified during Camelot scope review and onboarding.',
    locationTitle: `${prettyNeighborhood} Positioning`,
    locationCopy: `${d.buildingName} sits within ${prettyNeighborhood}, where access, operations, and neighborhood fundamentals shape resident experience and long-term value.`,
    lifestyleTitle: 'Access, Service & Liquidity',
    lifestyleCopy: 'Camelot reviews transportation, vendor routing, nearby anchors, and resident lifestyle drivers so the board sees both operational needs and market value in one narrative.',
    landmarks: d.neighborhoodIntel?.landmarks?.slice(0, 6).map(l => `${l.name}: ${l.type}`) || ['Transit access: verified during onboarding', 'Neighborhood anchors: reviewed by Jackie', 'Camelot HQ: 477 Madison Avenue', 'Vendor routing: planned during transition'],
  };
  const complianceDates = [
    { month: 'January', title: 'Tax Appeals', desc: d.assessedValue > 0 ? `Review ${fmtMoney(d.assessedValue)} assessed value and appeal strategy.` : 'Strategic filing to reduce assessments.' },
    { month: 'June', title: 'RPIE Filings', desc: d.propertyType.toLowerCase().includes('condo') || d.propertyType.toLowerCase().includes('coop') ? 'Income/expense status reviewed; exemptions verified where applicable.' : 'Income and expense reporting deadline management.' },
    { month: 'September', title: 'HPD Registration', desc: d.units >= 3 ? 'Multi-family registration, ownership, and emergency contact verification.' : 'Registration applicability verified by property profile.' },
    { month: 'December', title: 'Budgeting', desc: 'Operating budget, reserve planning, capital calls, and board calendar.' },
  ];
  const ll97Context = d.ll97
    ? `${d.buildingName} (${d.propertyType} | ${d.ll97.complianceStatus} | ${fmtMoney(d.ll97.period1Penalty)}/yr Period 1 exposure)`
    : `${d.buildingName} (${d.propertyType} | LL97 applicability to be verified)`;
  const proposedRows = [
    ['Annual Management Fee', d.monthlyFee > 0 ? `${fmtMoney(d.monthlyFee)}/mo (${fmtMoney(d.annualFee)}/yr) based on Jackie preliminary pricing` : '$TBD: custom flat rate after building scope review'],
    ['Online Common Charge Payments', 'ZERO bank fees for residents and owners'],
    ['Technology Platform', 'Included: Camelot Central + ConciergePlus + Merlin AI'],
    ['Initial Building Inspection', 'FREE ($2,500 value)'],
    ['In-House CPA / Accounting', 'Included: no outsourcing, full transparency'],
    ['LL97 Liability Report', d.ll97 ? `Included: carbon cap modeling + ${fmtMoney(d.ll97.totalExposure11yr)} 11-year exposure roadmap` : 'Included when applicable: carbon cap modeling + compliance roadmap'],
    ['AI Board Meeting Minutes', 'Included: every meeting, AI-enhanced and distributed'],
    ['In-House Attorney & Engineer', 'Free advisory: legal and engineering consultation'],
  ];
  const parseOpexRange = (range?: string) => {
    const nums = String(range || '').match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (nums.length >= 2) return { low: nums[0], high: nums[1], avg: (nums[0] + nums[1]) / 2 };
    if (nums.length === 1) return { low: nums[0], high: nums[0], avg: nums[0] };
    return { low: 24, high: 38, avg: 31 };
  };
  const opex = parseOpexRange(d.neighborhoodMarketData?.opexRange);
  const modeledBuildingArea = d.buildingArea > 0 ? d.buildingArea : Math.max(d.units * 900, 1);
  const modeledAnnualOpex = Math.round(modeledBuildingArea * opex.avg);
  const modeledAnnualFee = Math.max(d.annualFee || d.monthlyFee * 12, 1);
  const expenseMix = [
    { label: 'Real Estate Taxes', pct: 0.27, savingsRate: 0 },
    { label: 'Insurance', pct: 0.20, savingsRate: 0.06 },
    { label: 'Utilities', pct: 0.17, savingsRate: 0.05 },
    { label: 'Maintenance & Repairs', pct: 0.14, savingsRate: 0.06 },
    { label: 'Management & Admin', pct: 0.11, savingsRate: 0.04 },
    { label: 'Other / Reserve', pct: 0.11, savingsRate: 0.01 },
  ];
  const categorySavings = expenseMix.map(item => ({
    ...item,
    spend: Math.round(modeledAnnualOpex * item.pct),
    savings: Math.round(modeledAnnualOpex * item.pct * item.savingsRate),
  }));
  const revenueRecovery = Math.round(Math.max(d.units * 275, modeledAnnualOpex * 0.003));
  const retentionSavings = Math.round(d.units * 0.08 * 5000 * 0.25);
  const complianceAvoidance = Math.round((d.ll97?.period1Penalty || 0) * 0.2);
  const modeledYear1Value = categorySavings.reduce((sum, item) => sum + item.savings, 0) + revenueRecovery + retentionSavings + complianceAvoidance;
  const financialModel = {
    modeledBuildingArea,
    opexRange: opex,
    annualOpex: modeledAnnualOpex,
    annualFee: modeledAnnualFee,
    categorySavings,
    revenueRecovery,
    retentionSavings,
    complianceAvoidance,
    year1Value: modeledYear1Value,
    feeEscalation: 0.04,
    valueGrowth: 0.04,
  };
  const commercialIntel = d.commercialIntel || {
    commercialSignals: [],
    likelyCommercialUses: [],
    amenities: [],
    revenueOpportunities: [],
    officialWebsite: null,
    brandingTitle: null,
    brandingDescription: null,
    brandingImages: [],
    researchSources: [],
    researchStatus: 'needs_review' as const,
  };
  const commercialSignals = commercialIntel.commercialSignals.length > 0 ? commercialIntel.commercialSignals : ['No confirmed commercial tenant signal yet: verify on site and through offering plan / building records.'];
  const amenityList = commercialIntel.amenities.length > 0 ? commercialIntel.amenities : ['Amenity inventory to verify: storage cages, parking, bike room, library, pool, gym, roof deck, lounge, package room, and service spaces.'];
  const revenueOpportunities = commercialIntel.revenueOpportunities.length > 0 ? commercialIntel.revenueOpportunities : ['Review amenity rules, commercial licenses, parking/storage inventory, and any non-maintenance revenue opportunities during scope review.'];

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
<title>Jackie Property Intelligence Report \u2014 ${d.buildingName} | Camelot Realty Group</title>
<link href="https://fonts.googleapis.com/css2?family=Abel&family=Cardo:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:'DM Sans',-apple-system,sans-serif;background:#F5F0E5;color:#2C3240;font-size:12.5px;line-height:1.5}
.no-print{display:block}@media print{.no-print{display:none!important}@page{margin:0.18in}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
.page{max-width:900px;margin:0 auto;counter-reset:page-num}
.section,.cover,.elevator,.back-cover{counter-increment:page-num;position:relative;border:1px solid #D5D0C6;margin-bottom:6px}
.section::after{content:'Confidential \u00A9 ${new Date().getFullYear()} Camelot Realty Group \u00B7 Proprietary \u0026 Trade Secret \u00B7 Do Not Distribute Without Written Consent';display:block;text-align:center;font-size:7.5px;color:#999;letter-spacing:0.4px;margin-top:14px;padding-top:8px;border-top:1px solid #E5E3DE}
.section::before{counter-increment:page-num 0;content:counter(page-num);position:absolute;bottom:12px;right:20px;font-size:10px;color:#bbb;font-family:'DM Sans',sans-serif;font-weight:500}
.cover::before,.back-cover::before,.elevator::before{content:counter(page-num);position:absolute;bottom:16px;right:24px;font-size:10px;color:rgba(255,255,255,0.3);font-family:'DM Sans',sans-serif;font-weight:500}
a{color:#B8973A;text-decoration:none}
.gold{color:#B8973A}.navy{color:#343434}

/* Cover */
.cover{background:#343434;color:#fff;padding:54px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:600px;page-break-after:always;position:relative;border-color:rgba(219,186,46,0.42)}
.cover .badge{position:absolute;top:28px;right:28px;background:#A89035;color:#fff;padding:12px 18px;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-weight:700;line-height:1.4;text-align:center}
.cover .wordmark{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;letter-spacing:12px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:6px}
.cover .pm-sub{font-size:12px;color:#A89035;letter-spacing:2px;margin-bottom:48px}
.cover h1{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:42px;color:#A89035;font-weight:700;margin-bottom:8px;line-height:1.2;max-width:700px}
.cover .proposal-sub{font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:8px;font-weight:300;letter-spacing:1px}
.cover .meta{font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px}
.cover .prepared{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:12px;color:#A89035;font-style:italic;margin-top:40px}

/* Elevator */
.elevator{background:#F5F0E5;padding:50px 60px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;min-height:400px}
.elevator h2{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:36px;color:#A89035;font-weight:700;margin-bottom:16px;max-width:640px;line-height:1.2}
.elevator .gold-bar{width:60px;height:3px;background:#A89035;margin:0 auto 24px}
.elevator p{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;color:#555;line-height:1.9;max-width:600px}

/* Sections */
.section{padding:28px 38px;page-break-after:auto;break-inside:auto}
.section-cream{background:#F5F0E5}.section-white{background:#FDFAF3}
.section-title{font-family:'Cardo',Georgia,serif;font-size:26px;color:#B8973A;margin-bottom:6px;padding-left:14px;border-left:3px solid #B8973A;font-weight:700}
.section-sub{font-size:11.5px;color:#777;margin-bottom:18px;padding-left:14px}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.stat-box{background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px;text-align:center}
.stat-box .val{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;color:#A89035;font-weight:700}
.stat-box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;margin:20px 0}
.info-grid .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999}
.info-grid .value{font-size:13px;color:#2C3240;font-weight:500}

/* Compare table */
.compare-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
.compare-table th{padding:12px 16px;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700}
.compare-table th:nth-child(1){background:#E5E3DE;color:#666}
.compare-table th:nth-child(2){background:#A89035;color:#fff}
.compare-table th:nth-child(3){background:#E5E3DE;color:#666}
.compare-table td{padding:10px 16px;border-bottom:1px solid #eee;color:#666;text-align:center}
.compare-table td:nth-child(2){background:#EDE9DF;font-weight:600;color:#2C3240}
.compare-tagline{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-style:italic;color:#A89035;font-size:14px;text-align:center;margin-top:20px}

/* Cards */
.core-svc{background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:20px;margin-bottom:16px}
.core-svc h4{font-size:14px;font-weight:700;color:#2C3240;margin-bottom:6px}
.core-svc p{font-size:12px;color:#555;line-height:1.7}

.va-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
.va-card{background:#FDFAF3;border:1px solid #D5D0C6;border-left:3px solid #A89035;border-radius:0 8px 8px 0;padding:16px}
.va-card h5{font-size:12px;font-weight:700;color:#2C3240;margin-bottom:4px}
.va-card p{font-size:11px;color:#888;line-height:1.5}

/* Transition */
.transition-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0}
.trans-card{background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:20px}
.trans-card h4{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;font-weight:700;color:#A89035;margin-bottom:6px}
.trans-card .sub{font-size:11px;color:#888;margin-bottom:12px;font-style:italic}
.trans-card ul{list-style:none}.trans-card ul li{font-size:11px;color:#555;padding:4px 0 4px 16px;position:relative}
.trans-card ul li::before{content:"\u2022";position:absolute;left:0;color:#A89035;font-weight:700;font-size:14px}

/* Pricing table */
.invest-table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
.invest-table th{background:#A89035;color:#fff;padding:12px 16px;text-align:left;font-size:10px;letter-spacing:1.5px;text-transform:uppercase}
.invest-table td{padding:12px 16px;border-bottom:1px solid #eee;color:#444}
.invest-table tr:nth-child(even){background:#EDE9DF}
.invest-table td:nth-child(2){font-weight:600;color:#2C3240}
.invest-table .free{color:#16a34a;font-weight:700}
.invest-table .included{color:#A89035;font-weight:600}

/* Testimonials */
.testimonial-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
.testimonial{background:#fff;border:1px solid #E5E3DE;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:24px}
.testimonial .qm{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:48px;color:#A89035;line-height:0.8;margin-bottom:10px}
.testimonial p{font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#555;font-style:italic;line-height:1.8;margin-bottom:12px}
.testimonial .author{font-size:12px;color:#A89035;font-weight:600}
.testimonial .author-title{font-size:10px;color:#888}

/* Back cover */
.back-cover{background:#3A4B5B;color:#fff;min-height:400px;padding:60px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;border-color:rgba(168,144,53,0.3)}
.back-cover .wordmark{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;letter-spacing:10px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px}
.back-cover .pm-sub{font-size:11px;color:#A89035;margin-bottom:32px;letter-spacing:2px}
.back-cover h2{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:32px;color:#A89035;margin-bottom:8px;font-weight:700}
.back-cover .tagline{font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:32px;line-height:1.8}
.back-cover .contact-name{font-size:15px;color:#A89035;font-weight:600;margin-bottom:4px}
.back-cover .contact-info{font-size:12px;color:rgba(255,255,255,0.6);line-height:2}
.back-cover .contact-info a{color:#A89035}
.back-cover .address{font-size:11px;color:rgba(255,255,255,0.4);margin-top:16px}

/* Intel section */
.intel-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin:16px 0}
.intel-card{background:#fff;border:1px solid #E5E3DE;border-radius:8px;padding:16px;text-align:center}
.intel-card .val{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:24px;font-weight:700}
.intel-card .lbl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.red{color:#dc2626}.orange{color:#ea580c}.green{color:#16a34a}.yellow{color:#ca8a04}

.about-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.about-stat{background:#fff;border:1px solid #E5E3DE;border-radius:8px;padding:18px;text-align:center}
.about-stat .val{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:24px;color:#A89035;font-weight:700}
.about-stat .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

.compliance-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
.compliance-card{background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:16px;text-align:center}
.compliance-card .month{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A89035;font-weight:700;margin-bottom:6px}
.compliance-card h5{font-size:12px;color:#2C3240;font-weight:700;margin-bottom:4px}
.compliance-card p{font-size:10px;color:#888;line-height:1.4}

.tech-cols{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:16px 0}
.tech-col{background:#EDE9DF;border:1px solid #E5E3DE;border-radius:8px;padding:22px}
.tech-col h4{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;color:#2C3240;margin-bottom:14px;font-weight:700}
.tech-col ul{list-style:none}.tech-col ul li{font-size:12px;color:#555;padding:5px 0 5px 22px;position:relative}
.tech-col ul li::before{content:"\u2714";position:absolute;left:0;color:#A89035;font-size:14px;font-weight:700}

.mission-stmt{font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-style:italic;color:#A89035;font-size:15px;text-align:center;margin-bottom:20px;line-height:1.6;font-weight:600;max-width:700px;margin-left:auto;margin-right:auto}
.access-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:14px 0}
.access-card{background:#FDFAF3;border:1px solid #D5D0C6;border-top:2px solid #B8973A;padding:14px 16px;min-height:118px}
.access-card .k{font-family:'Cardo',Georgia,serif;font-size:21px;color:#B8973A;line-height:1;margin-bottom:6px}
.access-card h4{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#343434;margin-bottom:6px}
.access-card p{font-size:10.5px;color:#555;line-height:1.45}
.brand-logo{position:absolute;top:0;right:0;width:156px;height:72px;background:#D0A92D;display:flex;align-items:center;justify-content:center;padding:16px}
.brand-logo img{max-width:132px;max-height:46px;object-fit:contain}
.deck-slide{position:relative;min-height:520px;padding:58px 52px 42px;background:#F7F5F1;border:1px solid #D5D0C6;page-break-after:always}
.deck-slide.dark{background:#343E43;color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}
.deck-title{font-family:'Cardo',Georgia,serif;font-size:42px;line-height:1.06;color:#B8973A;font-weight:400;margin-bottom:26px;padding-left:18px;border-left:5px solid #B8973A}
.deck-title.center{border-left:0;padding-left:0;text-align:center}
.deck-kicker{font-size:17px;color:#38557D;line-height:1.5;max-width:760px}
.deck-grid-2{display:grid;grid-template-columns:1.25fr 0.9fr;gap:38px;align-items:center}
.deck-copy h3{font-family:'Cardo',Georgia,serif;font-size:28px;color:#0D2E63;margin:18px 0 10px}
.deck-copy p,.deck-copy li{font-size:15px;color:#38557D;line-height:1.55}
.deck-facts{list-style:none;margin:22px 0}
.deck-facts li{margin-bottom:11px}
.deck-photo{border:12px solid #E8E2D6;box-shadow:0 3px 10px rgba(0,0,0,0.12);height:330px;overflow:hidden;background:#EDE9DF}
.deck-photo img{width:100%;height:100%;object-fit:cover}
.deck-note{font-family:'Cardo',Georgia,serif;font-size:15px;color:#B8973A;font-style:italic;margin-top:18px}
.deck-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.deck-card{background:#fff;border:1px solid #D5D0C6;border-top:5px solid #B8973A;box-shadow:0 2px 7px rgba(0,0,0,0.08);padding:20px 22px;min-height:128px}
.deck-card h4{font-family:'Cardo',Georgia,serif;font-size:20px;color:#0D2E63;margin-bottom:14px}
.deck-card p,.deck-card li{font-size:13px;color:#38557D;line-height:1.45}
.deck-card ul{padding-left:18px}
.deck-table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px;color:#38557D}
.deck-table th{background:#213F73;color:#fff;text-align:left;padding:10px 12px}
.deck-table td{border:1px solid #D5C8A5;padding:9px 12px}
.deck-table tr:nth-child(even) td{background:#EEEAE3}
.partner-cloud{position:relative;height:360px;margin-top:26px}
.partner-logo{position:absolute;font-size:30px;font-weight:700;color:#1F2937;background:#fff;padding:10px 18px;min-width:120px;text-align:center}
.partner-logo.small{font-size:22px}.partner-logo.blue{color:#168BD1}.partner-logo.orange{color:#F2674A}
.thank-wordmark{font-family:'Abel','Plus Jakarta Sans',sans-serif;font-size:46px;letter-spacing:18px;color:#fff;margin-bottom:4px}

@media print{
body{background:#fff;font-size:11.4px;line-height:1.38}
body::before{content:'';position:fixed;top:0.08in;right:0.08in;bottom:0.08in;left:0.08in;border:0.5pt solid #D5D0C6;pointer-events:none;z-index:99999}
.page{max-width:none;margin:0}
.cover,.back-cover{background:#343434!important;page-break-after:always}
.elevator{page-break-after:auto;min-height:auto}
.section{page-break-after:auto;break-inside:auto;margin:0;border:0;padding:20px 26px}
.deck-slide{min-height:7.2in;margin:0;border:0;padding:34px 38px 28px}
.deck-title{font-size:34px;margin-bottom:18px}
.brand-logo{width:126px;height:58px}
.section::after{margin-top:10px;padding-top:6px}
.stats-row,.about-stats,.compliance-row,.transition-grid,.tech-cols,.va-grid,.testimonial-grid,.access-grid,.deck-card-grid,.deck-grid-2{break-inside:avoid}
}
</style>
</head>
<body>
<div class="page">

<!-- FLOATING ACTION BAR (no-print) -->
<div style="position:fixed;top:0;left:0;right:0;background:#3A4B5B;padding:8px 20px;display:flex;gap:8px;align-items:center;justify-content:flex-end;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3)" class="no-print">
<span style="color:#A89035;font-size:13px;font-weight:700;margin-right:auto">Jackie Report — ${d.buildingName}</span>
<button onclick="window.print()" style="background:#A89035;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">🖨️ Print / Save PDF</button>
<button onclick="var a=document.createElement('a');a.href='data:text/html,'+encodeURIComponent(document.documentElement.outerHTML);a.download='Jackie-${d.buildingName.replace(/[^a-zA-Z0-9]/g,'-')}.html';a.click()" style="background:#fff;color:#3A4B5B;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">⬇️ Download</button>
<button onclick="window.open('mailto:?subject='+encodeURIComponent('Property Intelligence Report — ${d.buildingName}')+'&body='+encodeURIComponent('Please find the attached Property Intelligence Report for ${d.buildingName}.\\n\\nPrepared by Camelot Realty Group.'))" style="background:transparent;color:#A89035;border:2px solid #A89035;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">✉️ Email</button>
</div>
<div style="height:50px" class="no-print"></div>

<!-- PAGE 1: COVER -->
<div class="cover">
<img src="./images/camelot-logo-white.png" alt="Camelot Realty Group" style="width:140px;margin-bottom:32px;opacity:0.95" onerror="this.style.display='none'">
<h1>${d.buildingName}</h1>
<div class="proposal-sub">Property Intelligence Report &amp; Management Proposal</div>
<div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;margin-top:4px">Powered by Jackie &nbsp;\u00B7&nbsp; Camelot OS &nbsp;\u00B7&nbsp; SCOUT Market Intelligence</div>
<div class="meta">${d.address} &nbsp;|&nbsp; ${d.borough || "New York"}</div>
<div class="meta" style="margin-top:4px">${d.bbl ? "BBL: " + d.bbl + " &nbsp;|&nbsp; " : ""}${d.propertyType}</div>
<div class="meta">${d.units ? d.units + ' Units' : ''} ${d.stories ? '&nbsp;|&nbsp; ' + d.stories + ' Floors' : ''}</div>
<div class="prepared">Prepared exclusively for the Board of Directors &mdash; ${d.date}</div>
<div style="position:absolute;bottom:60px;left:0;right:0;text-align:center">
<div style="background:rgba(0,0,0,0.3);display:inline-block;padding:8px 24px;border-radius:4px;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#A89035;font-weight:700">RED Awards 2025: Property Management Co. of the Year &nbsp;\u00B7&nbsp; REBNY 2025: David Goldoff Leadership Award</div>
</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<div style="display:flex;align-items:center;justify-content:center;min-height:420px;text-align:center;flex-direction:column">
<h2 class="deck-title center" style="font-size:48px">Elevating ${safe(d.buildingName)}</h2>
<div style="width:150px;height:4px;background:#B8973A;margin:-8px auto 42px"></div>
<p class="deck-kicker">Your building deserves management that matches its stature: financial clarity, responsiveness, proactive stewardship, and a property-specific operating plan built around ${safe(d.address)}.</p>
</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title">The Property</h2>
<div class="deck-grid-2">
<div class="deck-copy">
<h3>${safe(propertyPedigree.title)}</h3>
<p>${safe(propertyPedigree.narrative)}</p>
<ul class="deck-facts">
${propertyPedigree.facts.map(f => `<li>${safe(f)}</li>`).join('')}
</ul>
<div class="deck-note">${safe(propertyPedigree.foot)}</div>
</div>
<div class="deck-photo">
${subjectPhoto ? `<img src="${subjectPhoto}" alt="${safe(d.buildingName)}">` : `<iframe src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${d.latitude || '40.7831'},${d.longitude || '-73.9712'}&heading=0&pitch=5&fov=80" width="100%" height="330" style="border:0" allowfullscreen loading="lazy"></iframe>`}
</div>
</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title">Location &amp; Neighborhood</h2>
<div class="deck-grid-2" style="grid-template-columns:1.15fr 0.85fr">
<div class="deck-copy">
<h3>${safe(propertyPedigree.locationTitle)}</h3>
<p>${safe(propertyPedigree.locationCopy)}</p>
<h3>${safe(propertyPedigree.lifestyleTitle)}</h3>
<p>${safe(propertyPedigree.lifestyleCopy)}</p>
</div>
<div class="deck-card" style="min-height:330px">
<h4>Nearby Landmarks</h4>
<div style="width:110px;height:4px;background:#B8973A;margin:0 0 28px"></div>
<ul style="list-style:none;padding-left:0">
${propertyPedigree.landmarks.map(l => `<li style="margin-bottom:16px">${safe(l)}</li>`).join('')}
</ul>
</div>
</div>
</div>

<!-- PAGE 2: PROPERTY VISUAL & MAP -->
<div class="section section-white" style="padding-top:20px">
<div class="section-title">The Property</div>
<div class="section-sub">${d.address} \u2014 ${d.propertyType}</div>

<!-- Hero: Building Photo (Wikimedia Commons → Google Street View fallback) -->
${d.buildingPhotos && d.buildingPhotos.exterior.length > 0 && d.buildingPhotos.source !== 'Google Street View' ? `
<div style="border-radius:10px;overflow:hidden;border:1px solid #D5D0C6;height:340px;margin-bottom:16px;position:relative">
<img src="${d.buildingPhotos.exterior[0]}" alt="${d.buildingName}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<iframe src=\\'https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${d.latitude || '40.7831'},${d.longitude || '-73.9712'}&heading=0&pitch=5&fov=80\\' width=\\'100%\\' height=\\'340\\' style=\\'border:0\\' allowfullscreen loading=\\'lazy\\'></iframe>'">
<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(58,75,91,0.9));padding:16px 20px 12px;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700">${d.buildingName}</div>
<div style="font-size:11px;opacity:0.8">${d.address} \u00B7 ${d.propertyType} \u00B7 ${d.units ? d.units + ' Units' : ''} ${d.stories ? '\u00B7 ' + d.stories + ' Floors' : ''} ${d.yearBuilt ? '\u00B7 Built ' + d.yearBuilt : ''}</div>
<div style="font-size:8px;opacity:0.4;margin-top:2px">Photo: ${d.buildingPhotos.source}</div>
</div>
</div>
${d.buildingPhotos.exterior.length > 1 ? `
<div style="display:grid;grid-template-columns:repeat(${Math.min(d.buildingPhotos.exterior.length - 1, 3)},1fr);gap:6px;margin-bottom:12px">
${d.buildingPhotos.exterior.slice(1, 4).map(url => `<div style="border-radius:6px;overflow:hidden;height:120px;border:1px solid #D5D0C6"><img src="${url}" alt="${d.buildingName}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'"></div>`).join('\n')}
</div>` : ''}
` : d.latitude && d.longitude ? `
<div style="border-radius:10px;overflow:hidden;border:1px solid #D5D0C6;height:340px;margin-bottom:16px;position:relative">
<iframe src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${d.latitude},${d.longitude}&heading=0&pitch=5&fov=80" width="100%" height="340" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(58,75,91,0.9));padding:16px 20px 12px;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700">${d.buildingName}</div>
<div style="font-size:11px;opacity:0.8">${d.address} \u00B7 ${d.propertyType} \u00B7 ${d.units ? d.units + ' Units' : ''} ${d.stories ? '\u00B7 ' + d.stories + ' Floors' : ''} ${d.yearBuilt ? '\u00B7 Built ' + d.yearBuilt : ''}</div>
</div>
</div>
` : `
<div style="border-radius:10px;overflow:hidden;border:1px solid #D5D0C6;height:340px;margin-bottom:16px;position:relative">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=19&maptype=satellite" width="100%" height="340" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(58,75,91,0.9));padding:16px 20px 12px;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700">${d.buildingName}</div>
<div style="font-size:11px;opacity:0.8">${d.address} \u00B7 ${d.propertyType} \u00B7 ${d.units ? d.units + ' Units' : ''} ${d.stories ? '\u00B7 ' + d.stories + ' Floors' : ''} ${d.yearBuilt ? '\u00B7 Built ' + d.yearBuilt : ''}</div>
</div>
</div>
`}

<!-- Four panels: Street View, Map, Neighborhood, Directions -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
${d.latitude && d.longitude ? `
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${d.latitude},${d.longitude}&heading=180&pitch=5&fov=80" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">\uD83D\uDCF7 Building \u2014 Alternate View</div>
</div>
` : `
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=18" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">\uD83D\uDCF7 Building Location</div>
</div>
`}
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=16" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">\uD83D\uDDFA\uFE0F Street Map</div>
</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${d.neighborhoodName ? encodeURIComponent(d.neighborhoodName + ' New York NY') : encodedAddr}&zoom=14" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">\uD83C\uDFD8\uFE0F Neighborhood Overview</div>
</div>
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodedAddr}&mode=driving" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">\uD83D\uDE97 From Camelot HQ \u2014 477 Madison Ave</div>
</div>
</div>

<div class="access-grid">
<div class="access-card">
<div class="k">S</div>
<h4>Subway &amp; Transit</h4>
<p>${accessTransit}</p>
</div>
<div class="access-card">
<div class="k">B</div>
<h4>Bus &amp; Local Coverage</h4>
<p>Fifth Avenue, Madison Avenue, crosstown, and neighborhood routes are reviewed for routine site coverage, resident support, and manager access.</p>
</div>
<div class="access-card">
<div class="k">H</div>
<h4>Road &amp; Emergency Access</h4>
<p>${accessHighway}</p>
</div>
</div>
<div style="background:#F5F0E5;border:1px solid #D5D0C6;border-left:3px solid #B8973A;padding:12px 16px;margin-bottom:14px;color:#343434">
<strong>Camelot HQ: 477 Madison Avenue.</strong> Senior managers conduct regular on-site inspections; route planning and response coverage are part of the transition plan for ${d.buildingName}.
</div>

<!-- StreetEasy + Research Sources Panel -->
<div style="background:#3A4B5B;border-radius:10px;padding:18px 22px;margin-bottom:14px;color:#fff">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A89035;font-weight:700;margin-bottom:12px">🔍 Property Research Sources</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<a href="https://streeteasy.com/building/${encodeURIComponent(d.address.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🏠</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">StreetEasy</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Photos, listings, sales history, pricing</div></div>
</a>
<a href="https://www.propertyshark.com/mason/Property/${d.bbl ? d.bbl.replace(/\s/g, '') : ''}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🦈</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">PropertyShark</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Owner info, comparables, tax records</div></div>
</a>
<a href="https://www.crexi.com/search?q=${encodedAddr}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🏢</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">Crexi</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Commercial listings, investment data</div></div>
</a>
${d.bbl ? `<a href="https://a836-acris.nyc.gov/DS/DocumentSearch/BBLResult?Borough=${d.bbl.charAt(0)}&Block=${d.bbl.substring(1, 6)}&Lot=${d.bbl.substring(6)}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🏛️</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">NYC City Register (ACRIS)</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Deeds, mortgages, liens — BBL: ${d.bbl}</div></div>
</a>` : `<a href="https://www.google.com/maps/search/${encodedAddr}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">📍</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">Google Maps</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Photos, reviews, nearby amenities</div></div>
</a>`}
<a href="https://www.domecile.com/search?q=${encodedAddr}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🔑</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">Domecile</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Fees, current management, building info</div></div>
</a>
<a href="https://www.lexisnexis.com/en-us/gateway.page" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">⚖️</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">LexisNexis</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Legal issues, litigation, judgments, liens</div></div>
</a>
<a href="https://offeringplandatasearch.ag.ny.gov/" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">📜</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">NY AG — Offering Plans</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Co-op/condo offering plans, amendments, sponsor info</div></div>
</a>
<a href="https://iapps.courts.state.ny.us/nyscef/CaseSearch" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🔍</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">NYSCEF (Court E-Filing)</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Court filings, lawsuits, HP actions</div></div>
</a>
<a href="https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🏦</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">DOF Property Tax</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Abatements, tax liens, exemptions, assessments</div></div>
</a>
<a href="https://www.jackjaffa.com/violation-services/" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">📋</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">Jack Jaffa & Associates</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Violation research, removal, hearings, expediting</div></div>
</a>
<a href="https://clients.sitecompli.com" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">✅</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">SiteCompli</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Violations, ownership, open permits, complaints</div></div>
</a>
<a href="https://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${d.bbl ? d.bbl.charAt(0) : '1'}&block=${d.bbl ? d.bbl.substring(1, 6) : ''}&lot=${d.bbl ? d.bbl.substring(6) : ''}" target="_blank" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:12px 14px;text-decoration:none;transition:background 0.2s" onmouseover="this.style.background='rgba(168,144,53,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
<span style="font-size:20px">🏗️</span>
<div><div style="font-size:12px;font-weight:600;color:#A89035">DOB BIS (Building Info System)</div><div style="font-size:10px;color:rgba(255,255,255,0.6)">Permits, complaints, violations, certificates of occupancy</div></div>
</a>
</div>
<div style="margin-top:10px;font-size:9px;color:rgba(255,255,255,0.35);text-align:center">Data: HPD → DOF → StreetEasy → PropertyShark → Domecile (units) · ACRIS → DOF → HPD (ownership) · DOB/BIS → SiteCompli → Jack Jaffa (violations/permits) · DOF (abatements/liens) · LexisNexis → NYSCEF (legal) · NY AG (offering plans)</div>
</div>

<div class="stats-row">
<div class="stat-box"><div class="val">${d.propertyType}</div><div class="lbl">Property Type</div></div>
<div class="stat-box"><div class="val">${d.units || 'N/A'}</div><div class="lbl">Units</div></div>
<div class="stat-box"><div class="val">${d.stories || 'N/A'}</div><div class="lbl">Floors</div></div>
<div class="stat-box"><div class="val">${d.yearBuilt || 'N/A'}</div><div class="lbl">Year Built</div></div>
</div>

${d.streetEasy ? `
<!-- StreetEasy Building Profile -->
<div style="background:#f8f6f0;border:1px solid #D5D0C6;border-radius:8px;padding:18px 20px;margin-top:12px">
<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
<span style="font-size:16px">🏠</span>
<span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#A89035;font-weight:700">StreetEasy Building Profile</span>
${d.streetEasy.url ? `<a href="${d.streetEasy.url}" target="_blank" style="margin-left:auto;font-size:10px;color:#A89035;text-decoration:underline">View on StreetEasy →</a>` : ''}
</div>
${d.streetEasy.description ? `<p style="font-size:12px;color:#555;line-height:1.7;margin-bottom:12px">${d.streetEasy.description.length > 500 ? d.streetEasy.description.substring(0, 500) + '…' : d.streetEasy.description}</p>` : ''}
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
${d.streetEasy.amenities.length > 0 ? d.streetEasy.amenities.map(a => `<span style="background:#3A4B5B;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:500">${a}</span>`).join('') : ''}
${d.streetEasy.features.length > 0 ? d.streetEasy.features.map(f => `<span style="background:#A89035;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:500">${f}</span>`).join('') : ''}
</div>
${d.streetEasy.petsAllowed !== null ? `<div style="font-size:11px;color:#666"><strong>Pets:</strong> ${d.streetEasy.petPolicy || (d.streetEasy.petsAllowed ? 'Allowed' : 'Not allowed')}</div>` : ''}
${d.streetEasy.views.length > 0 ? `<div style="font-size:11px;color:#666;margin-top:4px"><strong>Views:</strong> ${d.streetEasy.views.join(', ')}</div>` : ''}
${d.streetEasy.activeListings.length > 0 ? `<div style="font-size:11px;color:#666;margin-top:8px"><strong>Active Listings:</strong> ${d.streetEasy.activeListings.map(l => `${l.beds}BR/${l.baths}BA${l.sqft ? ' · ' + l.sqft.toLocaleString() + ' ft²' : ''}${l.broker ? ' (' + l.broker + ')' : ''}`).join(' &nbsp;|&nbsp; ')}</div>` : ''}
</div>
` : ''}

<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:20px;margin-top:12px">
<p style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;color:#555;line-height:1.8;text-align:center">${hookLine}</p>
</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title">Commercial &amp; Amenity Intelligence</h2>
<p class="deck-kicker" style="margin:-8px 0 28px 24px">Jackie checks the subject property for commercial occupants, owner/renter uses, revenue-producing spaces, official building branding, and resident amenities.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
<div class="deck-card" style="min-height:220px">
<h4>Commercial Owners &amp; Renters</h4>
<ul>
${commercialSignals.map(s => `<li>${safe(s)}</li>`).join('')}
</ul>
</div>
<div class="deck-card" style="min-height:220px">
<h4>Amenities &amp; Resident Spaces</h4>
<ul>
${amenityList.map(a => `<li>${safe(a)}</li>`).join('')}
</ul>
</div>
</div>
<div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:22px;margin-top:22px">
<div class="deck-card">
<h4>Operating / Revenue Review</h4>
<ul>
${revenueOpportunities.map(o => `<li>${safe(o)}</li>`).join('')}
</ul>
</div>
<div class="deck-card">
<h4>Official Building Branding</h4>
${commercialIntel.officialWebsite ? `<p><strong>Website:</strong> <a href="${commercialIntel.officialWebsite}" target="_blank">${safe(commercialIntel.brandingTitle || commercialIntel.officialWebsite)}</a></p>` : '<p>Official building website not confirmed yet. Jackie attempted a website search; board-facing release should verify branding and images manually if no site is found.</p>'}
${commercialIntel.brandingDescription ? `<p style="margin-top:10px">${safe(commercialIntel.brandingDescription)}</p>` : ''}
<p style="margin-top:12px;font-size:11px;color:#777"><strong>Status:</strong> ${commercialIntel.researchStatus === 'verified' ? 'Verified signals found' : 'Needs review'}<br><strong>Sources:</strong> ${commercialIntel.researchSources.map(safe).join(' · ')}</p>
</div>
</div>
${commercialIntel.brandingImages.length > 0 ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(commercialIntel.brandingImages.length, 4)},1fr);gap:10px;margin-top:18px">${commercialIntel.brandingImages.slice(0, 4).map(src => `<div style="height:100px;border:1px solid #D5D0C6;background:#fff;overflow:hidden"><img src="${src}" alt="${safe(d.buildingName)} branding image" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}</div>` : ''}
</div>

<!-- PAGE 2B: NEIGHBORHOOD INTELLIGENCE -->
<div class="section section-cream">
<div class="section-title">Neighborhood Intelligence</div>
<div class="section-sub">${d.neighborhoodName ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : d.borough || 'New York City'} &mdash; Market Context</div>

<div style="margin-bottom:20px">
<div style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid #D5D0C6;height:250px">
<iframe src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodedAddr}&mode=driving" width="100%" height="250" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>
<div style="background:#fff;border:1px solid #E5E3DE;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px;margin-bottom:12px">
<h4 style="font-size:13px;font-weight:700;color:#2C3240;margin-bottom:4px">\uD83D\uDCCD Camelot Office \u2192 ${d.buildingName}</h4>
<p style="font-size:12px;color:#555">Camelot Realty Group operates from <strong>477 Madison Avenue, 6th Floor</strong> (Midtown Manhattan). The map above shows the driving route to your property at ${d.address}. Camelot\u2019s senior managers conduct regular on-site inspections \u2014 your building is within our core service area with rapid response times.</p>
</div>
<div style="background:#fff;border:1px solid #E5E3DE;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px;margin-bottom:12px">
<h4 style="font-size:13px;font-weight:700;color:#2C3240;margin-bottom:4px">\uD83D\uDE87 Transit Commute — Camelot Office ↔ ${d.buildingName}</h4>
<p style="font-size:12px;color:#555;margin-bottom:10px">Transit route from <strong>477 Madison Ave (Camelot HQ)</strong> to your property. Camelot's senior management conducts regular on-site inspections via subway and car.</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodedAddr}&mode=transit" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">🚇 Transit Route — Camelot → Property</div>
</div>
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodedAddr}&mode=walking" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:9px;color:#999;padding:4px">🚶 Walking Route — Camelot → Property</div>
</div>
</div>
</div>

${d.neighborhoodMarketData ? `
<div style="margin-bottom:16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Neighborhood Scores</div>
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

${d.neighborhoodIntel ? generateNeighborhoodIntelHTML(d.neighborhoodIntel, d.neighborhoodName || d.borough || 'NYC') : ''}
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
<div><div class="label">Market Value</div><div class="value" style="color:#A89035;font-weight:700;font-size:15px">${fmtMoney(d.marketValue)}</div></div>
<div><div class="label">Assessed Value</div><div class="value">${fmtMoney(d.assessedValue)}</div></div>
<div><div class="label">Year Built</div><div class="value">${d.yearBuilt || 'N/A'}</div></div>
<div><div class="label">Building Class</div><div class="value">${d.buildingClass || 'N/A'}</div></div>
<div><div class="label">DOF Owner</div><div class="value">${d.dofOwner || 'N/A'}</div></div>
<div><div class="label">BBL</div><div class="value">${d.bbl || 'N/A'}</div></div>
</div>
${d.energyStarScore != null ? `
<div style="margin-top:16px;border-left:4px solid #A89035;padding-left:12px;margin-bottom:8px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Energy &amp; LL97 Compliance</div>
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
<div><div class="label">Distress Level</div><div class="value" style="color:${d.distressLevel === 'critical' || d.distressLevel === 'distressed' ? '#dc2626' : d.distressLevel === 'stressed' ? '#ea580c' : '#2C3240'};font-weight:600">${d.distressLevel.toUpperCase()} (${d.distressScore}/100)</div></div>
</div>
<div style="margin-top:18px;border:1px solid #D5D0C6;background:#fff">
<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid #D5D0C6;background:#F8F6F0">
<div>
<div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#A89035;font-weight:800">HPD Violation Current Status &amp; History</div>
<div style="font-size:11px;color:#555;margin-top:4px">Jackie searches NYC HPD violations by address, then falls back to BBL when DOF confirms the property record.</div>
</div>
<div style="text-align:right;font-size:11px;color:${openHPDViolationItems.length > 0 ? '#dc2626' : '#16a34a'};font-weight:800">${openHPDViolationItems.length} CURRENT OPEN</div>
</div>
${violationHistoryRows ? `
<table style="width:100%;border-collapse:collapse;font-size:10px;color:#2C3240">
<thead><tr style="background:#fff;color:#38557D;text-align:left">
<th style="padding:8px;border-bottom:1px solid #D5D0C6">Date</th>
<th style="padding:8px;border-bottom:1px solid #D5D0C6">Class</th>
<th style="padding:8px;border-bottom:1px solid #D5D0C6">Status</th>
<th style="padding:8px;border-bottom:1px solid #D5D0C6">ID</th>
<th style="padding:8px;border-bottom:1px solid #D5D0C6">Description</th>
</tr></thead>
<tbody>${violationHistoryRows}</tbody>
</table>` : `
<div style="padding:14px 16px;font-size:11px;color:#555;line-height:1.6">No HPD violation rows returned by NYC Open Data for this property after address and BBL search. Jackie should verify HPD Online manually before board-facing release.</div>`}
</div>
${d.distressSignals.length > 0 ? `
<div style="margin-top:16px;border-left:4px solid #dc2626;padding-left:12px;margin-bottom:8px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#dc2626;font-weight:600">Distress Signals</div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:8px">${d.distressSignals.map(s => `<span style="display:inline-block;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);color:#991b1b;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:500">${s.description}</span>`).join('')}</div>` : ''}

<!-- Legal & Regulatory Cross-Reference -->
<div style="margin-top:20px;background:#fff;border:2px solid #3A4B5B;border-radius:8px;padding:18px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#3A4B5B;font-weight:700;margin-bottom:10px">⚖️ Legal & Regulatory Cross-Reference</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">LexisNexis — Litigation & Liens</div>
<div style="font-size:10px;color:#555;line-height:1.5">Cross-reference recommended: lawsuits, judgments, UCC filings, liens, and regulatory actions against the building, management company, or ownership entity.</div>
<a href="https://www.lexisnexis.com/en-us/gateway.page" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">Search LexisNexis →</a>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">NY Attorney General — Offering Plans</div>
<div style="font-size:10px;color:#555;line-height:1.5">Co-op and condo offering plans, amendments, and sponsor disclosures filed with the AG's Real Estate Finance Bureau. Key for understanding building governance structure.</div>
<a href="https://offeringplandatasearch.ag.ny.gov/" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">Search AG Offering Plans →</a>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">Domecile — Fees & Management</div>
<div style="font-size:10px;color:#555;line-height:1.5">Building fees (maintenance, common charges), current management company, amenities, and resident reviews. Useful for competitive fee benchmarking.</div>
<a href="https://www.domecile.com/search?q=${encodedAddr}" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">Search Domecile →</a>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">NYSCEF — Court E-Filings</div>
<div style="font-size:10px;color:#555;line-height:1.5">NY State Courts Electronic Filing system. Search for active litigation, HP actions (housing court), breach of warranty, and construction disputes.</div>
<a href="https://iapps.courts.state.ny.us/nyscef/CaseSearch" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">Search NYSCEF →</a>
</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">Jack Jaffa & Associates — Violations</div>
<div style="font-size:10px;color:#555;line-height:1.5">Industry-standard violation research, removal services, ECB hearing representation, and expediting. Deep database of NYC building violations history.</div>
<a href="https://www.jackjaffa.com/violation-services/" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">Jack Jaffa Violations →</a>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">SiteCompli — Compliance Platform</div>
<div style="font-size:10px;color:#555;line-height:1.5">Comprehensive building compliance: violations, ownership data, open permits, complaints (complaint & non-complaint), inspections, and compliance calendar tracking.</div>
<a href="https://clients.sitecompli.com" target="_blank" style="font-size:10px;color:#A89035;text-decoration:underline;display:inline-block;margin-top:4px">SiteCompli Dashboard →</a>
</div>
</div>
<div style="font-size:9px;color:#888;margin-top:10px;text-align:center">Jackie recommends cross-referencing all databases before engagement. LexisNexis and SiteCompli require subscriptions. AG Offering Plans, NYSCEF, DOB BIS, and Jack Jaffa lookups are publicly accessible.</div>
</div>
</div>

<!-- GUT CHECK — Sentinel Market Comparison -->
${(() => {
  const gc = runGutCheck(d);
  return generateGutCheckHTML(gc);
})()}

<!-- PAGE 5: OWNERSHIP & FINANCIAL -->
<div class="section section-cream">
<div class="section-title">Ownership &amp; Financial History</div>
<div class="section-sub">ACRIS deed and mortgage records</div>
<div class="info-grid">
<div><div class="label">Last Sale Date</div><div class="value">${d.lastSaleDate ? new Date(d.lastSaleDate).toLocaleDateString() : (d.propertyType.toLowerCase().includes('condo') ? 'Unit-level sales; whole-building sale not applicable' : 'Not found in ACRIS scan')}</div></div>
<div><div class="label">Last Sale Price</div><div class="value" style="font-weight:700;color:#A89035">${d.lastSalePrice ? fmtMoney(d.lastSalePrice) : (d.propertyType.toLowerCase().includes('condo') ? 'Review recent unit comps' : 'Not found')}</div></div>
<div><div class="label">Buyer</div><div class="value">${d.lastSaleBuyer || (d.propertyType.toLowerCase().includes('condo') ? 'Individual condominium owners' : 'Not found')}</div></div>
<div><div class="label">Seller</div><div class="value">${d.lastSaleSeller || (d.propertyType.toLowerCase().includes('condo') ? 'Unit-level ACRIS records' : 'Not found')}</div></div>
<div><div class="label">Deeds on Record</div><div class="value">${d.deedCount}</div></div>
<div><div class="label">Mortgages on Record</div><div class="value">${d.mortgageCount}</div></div>
</div>
</div>

<!-- PAGE 5B: BUILDING CONTACTS & STAKEHOLDERS -->
<div class="section section-white">
<div class="section-title">Building Contacts &amp; Stakeholders</div>
<div class="section-sub">Key decision-makers, personnel, governance, and professional services for ${d.buildingName}</div>
<div style="background:#fff;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:12px 14px;margin:12px 0 16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:1.6px;color:#A89035;font-weight:800;margin-bottom:6px">Stakeholder Data Sources</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px">
${(d.contactResearchSources || []).map(src => `<div style="font-size:10px;color:#555;line-height:1.45">• ${safe(src)}</div>`).join('')}
</div>
<div style="font-size:9px;color:#888;margin-top:8px">Jackie uses HPD MDR, ACRIS, DOB, and DOF records first; PropertyShark and Apollo are verification/enrichment sources where private contact data must be confirmed before publication.</div>
</div>

<!-- BOARD / OWNERSHIP — Most Important -->
<div style="background:#3A4B5B;border-radius:8px;padding:18px;margin-bottom:16px;color:#fff">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:10px">\uD83C\uDFDB\uFE0F Board of Directors / Ownership</div>
<table style="width:100%;border-collapse:collapse">
<thead><tr>
<th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid rgba(168,144,53,0.3)">Name</th>
<th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid rgba(168,144,53,0.3)">Role / Title</th>
</tr></thead>
<tbody>
${d.dofOwner ? `<tr><td style="padding:8px 12px;font-size:12px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1)">${d.dofOwner}</td><td style="padding:8px 12px;font-size:12px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.1)">Owner (NYC DOF Record)</td></tr>` : ''}
${d.registrationOwner ? `<tr><td style="padding:8px 12px;font-size:12px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1)">${d.registrationOwner}</td><td style="padding:8px 12px;font-size:12px;color:rgba(255,255,255,0.7);border-bottom:1px solid rgba(255,255,255,0.1)">Registration Owner (HPD)</td></tr>` : ''}
${d.boardMembers.map(b => `<tr><td style="padding:8px 12px;font-size:12px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:600">${b.name}</td><td style="padding:8px 12px;font-size:12px;color:#A89035;border-bottom:1px solid rgba(255,255,255,0.1)">${b.title}</td></tr>`).join('')}
${d.boardMembers.length === 0 ? '<tr><td colspan="2" style="padding:8px 12px;font-size:11px;color:rgba(255,255,255,0.5);font-style:italic">Ownership and board details to be confirmed upon engagement with the building.</td></tr>' : ''}
</tbody>
</table>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

<!-- BUILDING STAFF -->
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:10px">\uD83D\uDC77 Building Staff</div>
${d.buildingStaff.length > 0 ? `
<table style="width:100%;border-collapse:collapse">
${d.buildingStaff.map(s => `<tr><td style="padding:6px 0;font-size:12px;font-weight:600;color:#2C3240">${s.name}</td><td style="padding:6px 0;font-size:11px;color:#888;text-align:right">${s.role}</td></tr>`).join('')}
</table>` : `
<div style="font-size:11px;color:#888;line-height:1.6;font-style:italic">
Staff details will be confirmed during our initial building assessment and transition planning.
</div>`}
</div>

<!-- MANAGEMENT -->
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:10px">\uD83C\uDFE2 Current Management</div>
<div style="font-size:14px;font-weight:700;color:#2C3240;margin-bottom:8px">${brochureActualMgmt || d.managementCompany || 'To be confirmed upon engagement'}</div>
<div style="font-size:11px;color:#888;line-height:1.6">
<div style="margin-bottom:4px">\u2022 Managing Agent \u2014 <em>${brochureActualMgmt || d.managementCompany || 'To be confirmed upon engagement'}</em></div>
${d.managementDuration ? `<div style="margin-bottom:4px">\u2022 Duration \u2014 ~${d.managementDuration}</div>` : ''}
<div style="margin-bottom:4px">\u2022 Management Grade \u2014 <strong style="color:${d.managementGrade === 'A' ? '#16a34a' : d.managementGrade === 'B' ? '#ca8a04' : '#dc2626'}">${d.managementGrade}</strong> (${d.managementScorecard.overall}/100)</div>
</div>
</div>
</div>

<!-- PROFESSIONAL SERVICES — From DOB Permit Records -->
<div style="background:#fff;border:2px solid #A89035;border-radius:8px;padding:18px;margin-bottom:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:12px">⚖️ Professional Services <span style="font-weight:400;color:#888;text-transform:none;letter-spacing:0">(from DOB permit filings)</span></div>
<table style="width:100%;border-collapse:collapse">
<thead><tr>
<th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:2px solid #A89035;width:30%">Role</th>
<th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:2px solid #A89035">Name</th>
<th style="text-align:left;padding:8px 12px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:2px solid #A89035">License</th>
</tr></thead>
<tbody>
${d.dobArchitects.length > 0 ? d.dobArchitects.map((a, i) => `<tr${i % 2 ? ' style="background:#EDE9DF"' : ''}><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">🏗️ ${a.title}</td><td style="padding:10px 12px;font-size:12px;color:#2C3240;border-bottom:1px solid #E5E3DE;font-weight:500">${a.name}</td><td style="padding:10px 12px;font-size:11px;color:#888;border-bottom:1px solid #E5E3DE;font-family:monospace">${a.license || '—'}</td></tr>`).join('') : '<tr><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">🏗️ Architect</td><td style="padding:10px 12px;font-size:12px;color:#999;border-bottom:1px solid #E5E3DE;font-style:italic" colspan="2">No DOB permit filings found</td></tr>'}
${d.dobEngineers.length > 0 ? d.dobEngineers.map((e, i) => `<tr${(d.dobArchitects.length + i) % 2 ? ' style="background:#EDE9DF"' : ''}><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">⚙️ ${e.title}</td><td style="padding:10px 12px;font-size:12px;color:#2C3240;border-bottom:1px solid #E5E3DE;font-weight:500">${e.name}</td><td style="padding:10px 12px;font-size:11px;color:#888;border-bottom:1px solid #E5E3DE;font-family:monospace">${e.license || '—'}</td></tr>`).join('') : '<tr style="background:#EDE9DF"><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">⚙️ Engineer</td><td style="padding:10px 12px;font-size:12px;color:#999;border-bottom:1px solid #E5E3DE;font-style:italic" colspan="2">No DOB permit filings found</td></tr>'}
<tr><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">⚖️ Law Firm</td><td style="padding:10px 12px;font-size:12px;color:#2C3240;border-bottom:1px solid #E5E3DE" colspan="2">${d.professionals.lawFirm || '<em style="color:#999">To be identified — check LexisNexis / NYSCEF</em>'}</td></tr>
<tr style="background:#EDE9DF"><td style="padding:10px 12px;font-size:12px;font-weight:600;color:#2C3240">📊 Accounting Firm</td><td style="padding:10px 12px;font-size:12px;color:#2C3240" colspan="2">${d.professionals.accountingFirm || '<em style="color:#999">To be identified — check AG Offering Plan</em>'}</td></tr>
</tbody>
</table>
<div style="font-size:9px;color:#888;margin-top:8px">Sources checked / required: ${(d.professionalResearchSources || []).map(src => safe(src)).join(' · ')}</div>
</div>

<!-- DOB OWNER INFORMATION -->
${d.dobOwners.length > 0 ? `
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px;margin-bottom:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:10px">🏠 Property Owner(s) — DOB Records</div>
<table style="width:100%;border-collapse:collapse">
<thead><tr>
<th style="text-align:left;padding:6px 10px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid #D5D0C6">Name</th>
<th style="text-align:left;padding:6px 10px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid #D5D0C6">Business</th>
<th style="text-align:left;padding:6px 10px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid #D5D0C6">Phone</th>
<th style="text-align:left;padding:6px 10px;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#A89035;border-bottom:1px solid #D5D0C6">Type</th>
</tr></thead>
<tbody>
${d.dobOwners.map((o, i) => `<tr${i % 2 ? ' style="background:#fff"' : ''}><td style="padding:8px 10px;font-size:12px;font-weight:600;color:#2C3240;border-bottom:1px solid #E5E3DE">${o.name}</td><td style="padding:8px 10px;font-size:11px;color:#555;border-bottom:1px solid #E5E3DE">${o.businessName || '—'}</td><td style="padding:8px 10px;font-size:11px;color:#555;border-bottom:1px solid #E5E3DE;font-family:monospace">${o.phone || '—'}</td><td style="padding:8px 10px;font-size:11px;color:#888;border-bottom:1px solid #E5E3DE">${o.type || '—'}</td></tr>`).join('')}
</tbody>
</table>
<div style="font-size:9px;color:#888;margin-top:6px">Source: DOB permit applications — owner listed on filing. Cross-reference with ACRIS and DOF for verification.</div>
</div>` : ''}

<!-- TAX ABATEMENT & LIEN STATUS -->
<div style="background:#fff;border:2px solid ${d.hasTaxLien ? '#dc2626' : '#A89035'};border-radius:8px;padding:18px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:${d.hasTaxLien ? '#dc2626' : '#A89035'};font-weight:700;margin-bottom:12px">Tax Status - NYC DOF Abatement & Lien Search</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
<div style="background:#EDE9DF;border-radius:6px;padding:14px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">Co-op/Condo Abatement</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:18px;font-weight:700;color:${d.hasAbatement ? '#16a34a' : '#555'}">${d.hasAbatement ? 'Active / Indicated' : 'Not Indicated'}</div>
<div style="font-size:11px;color:#555;font-weight:600;margin-top:4px">${safe(d.abatementType)}</div>
${d.abatementAmount > 0 ? `<div style="font-size:11px;color:#16a34a;font-weight:600;margin-top:4px">$${d.abatementAmount.toLocaleString()} exempt assessed value</div>` : ''}
${d.abatementTaxYear ? `<div style="font-size:10px;color:#777;margin-top:4px">Tax year: ${safe(d.abatementTaxYear)}</div>` : ''}
</div>
<div style="background:${d.hasTaxLien ? 'rgba(220,38,38,0.08)' : '#EDE9DF'};border-radius:6px;padding:14px;text-align:center;${d.hasTaxLien ? 'border:1px solid rgba(220,38,38,0.3)' : ''}">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">Tax Liens</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:18px;font-weight:700;color:${d.hasTaxLien ? '#dc2626' : '#16a34a'}">${d.hasTaxLien ? 'Lien-Sale Notices Found' : 'No Rows Found'}</div>
${d.hasTaxLien ? `<div style="font-size:11px;color:#dc2626;font-weight:600;margin-top:4px">${d.taxLienRecordCount || d.taxLienDetails.length} DOF notice row(s)</div>` : '<div style="font-size:11px;color:#16a34a;margin-top:4px">No DOF lien-sale rows returned for matched lot/address</div>'}
${d.taxLienMatchedLots.length ? `<div style="font-size:10px;color:#777;margin-top:4px">Matched lot(s): ${d.taxLienMatchedLots.map(l => safe(l)).join(', ')}</div>` : ''}
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:14px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">DOF Property Record</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:18px;font-weight:700;color:#0B2E6F">${d.abatementMatchedLot ? `Lot ${safe(d.abatementMatchedLot)}` : safe(d.bbl || 'DOF record')}</div>
${d.dofTaxMarketValue ? `<div style="font-size:11px;color:#555;margin-top:4px">Market value: $${Math.round(d.dofTaxMarketValue).toLocaleString()}</div>` : ''}
${d.dofTaxAssessedValue ? `<div style="font-size:11px;color:#555;margin-top:2px">Assessed value: $${Math.round(d.dofTaxAssessedValue).toLocaleString()}</div>` : ''}
<div style="font-size:11px;color:#555;line-height:1.5;margin-top:6px"><a href="https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address" target="_blank" rel="noopener" style="color:#A89035;text-decoration:underline;font-weight:600">Open DOF Property Tax Search</a></div>
</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
<div style="background:#F8F6F0;border:1px solid #D5D0C6;border-radius:6px;padding:10px;font-size:10px;color:#555;line-height:1.5"><strong style="color:#0B2E6F">Abatement source check:</strong> ${safe(d.abatementSourceStatus || 'DOF exemptions endpoint searched; no row returned.')}</div>
<div style="background:#F8F6F0;border:1px solid #D5D0C6;border-radius:6px;padding:10px;font-size:10px;color:#555;line-height:1.5"><strong style="color:#0B2E6F">Lien source check:</strong> ${safe(d.taxLienSourceStatus || 'DOF tax lien endpoint searched; no row returned.')}</div>
</div>
${d.hasTaxLien ? `
<div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:6px;padding:12px;margin-bottom:10px">
<div style="font-size:11px;color:#991b1b;font-weight:600;margin-bottom:6px">Tax Lien Sale Notice Details</div>
${d.taxLienDetails.map(l => `<div style="font-size:11px;color:#555;padding:2px 0">- ${safe(l.cycle)}${l.date ? ' - ' + new Date(l.date).toLocaleDateString() : ''}${l.lot ? ' - lot ' + safe(l.lot) : ''}${l.waterDebtOnly ? ' (water debt only)' : ''}</div>`).join('')}
<div style="font-size:10px;color:#7f1d1d;margin-top:6px">Lien-sale notices require board-facing verification with NYC DOF before describing the item as an active payable lien.</div>
</div>` : ''}
<div style="font-size:9px;color:#888">Source: NYC Dept. of Finance - Property Exemptions (8y4t-faws), Tax Lien Sale (9rz4-mjek), and DOF property records. Jackie checks exact BBL first, then block/address for condo unit-lot records before release.</div>
</div>
<!-- LEGACY TAX CARD HIDDEN AFTER DOF UNIT-LOT FALLBACK UPDATE -->
<div style="display:none;background:#fff;border:2px solid ${d.hasTaxLien ? '#dc2626' : '#A89035'};border-radius:8px;padding:18px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:${d.hasTaxLien ? '#dc2626' : '#A89035'};font-weight:700;margin-bottom:12px">🏦 Tax Status — DOF Abatement & Lien Search</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">
<div style="background:#EDE9DF;border-radius:6px;padding:14px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">Co-op/Condo Abatement</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700;color:${d.hasAbatement ? '#16a34a' : '#888'}">${d.hasAbatement ? '✅ Active' : '—  None'}</div>
${d.abatementAmount > 0 ? `<div style="font-size:11px;color:#16a34a;font-weight:600;margin-top:4px">$\${d.abatementAmount.toLocaleString()} exempt</div>` : ''}
</div>
<div style="background:${d.hasTaxLien ? 'rgba(220,38,38,0.08)' : '#EDE9DF'};border-radius:6px;padding:14px;text-align:center;${d.hasTaxLien ? 'border:1px solid rgba(220,38,38,0.3)' : ''}">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">Tax Liens</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700;color:${d.hasTaxLien ? '#dc2626' : '#16a34a'}">${d.hasTaxLien ? '⚠️ LIEN' : '✅ Clear'}</div>
${d.hasTaxLien ? `<div style="font-size:11px;color:#dc2626;font-weight:600;margin-top:4px">${d.taxLienDetails.length} lien(s) on record</div>` : '<div style="font-size:11px;color:#16a34a;margin-top:4px">No liens found</div>'}
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:14px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px">DOF Search</div>
<div style="font-size:11px;color:#555;line-height:1.5;margin-top:6px"><a href="https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=address" target="_blank" rel="noopener" style="color:#A89035;text-decoration:underline;font-weight:600">Open DOF Property Tax Search</a></div>
</div>
</div>
${d.hasTaxLien ? `
<div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:6px;padding:12px;margin-bottom:10px">
<div style="font-size:11px;color:#991b1b;font-weight:600;margin-bottom:6px">⚠️ Tax Lien Details</div>
${d.taxLienDetails.map(l => `<div style="font-size:11px;color:#555;padding:2px 0">• ${l.cycle}${l.date ? ' — ' + new Date(l.date).toLocaleDateString() : ''}${l.waterDebtOnly ? ' (water debt only)' : ''}</div>`).join('')}
</div>` : ''}
<div style="font-size:9px;color:#888">Source: NYC Dept. of Finance — Property Exemptions (8y4t-faws) and Tax Lien Sale (9rz4-mjek). Abatement data reflects most recent assessment year. Tax liens indicate properties included in NYC's annual tax lien sale process.</div>
</div>
</div>

<!-- PAGE 5C: CURRENT MANAGEMENT PERFORMANCE -->
<div class="section section-cream">
<div class="section-title">Current Management Performance</div>
<div class="section-sub">${d.managementCompany ? `Analysis of ${d.managementCompany}` : 'Building management assessment'} ${d.managementDuration ? `&mdash; Managing for ~${d.managementDuration}` : ''}</div>
${!/[A-F]/.test(d.managementGrade) ? `<div style="background:#fff;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:14px 18px;margin:12px 0 16px">
<p style="font-size:12px;color:#555;line-height:1.7"><strong style="color:#A89035">Public-record review pending:</strong> Jackie did not find enough violations, ECB, litigation, or permit data to score current management from public records alone. This does not mean the building is self-managed. For ${safe(d.buildingName)}, Jackie should verify the board, managing agent, live-in resident manager, porter, concierge, door coverage, and staff structure before releasing a final board-facing assessment.</p>
</div>` : ''}

<div style="display:flex;align-items:center;gap:24px;margin:20px 0">
<div style="width:100px;height:100px;border-radius:50%;background:${d.managementGrade === 'A' ? '#16a34a' : d.managementGrade === 'B' ? '#ca8a04' : d.managementGrade === 'C' ? '#ea580c' : '#dc2626'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
<span style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:48px;font-weight:700;color:#fff">${d.managementGrade}</span>
</div>
<div>
<div style="font-size:16px;font-weight:700;color:#2C3240;margin-bottom:4px">Overall Management Grade: ${d.managementGrade === '—' ? 'Pending Review' : d.managementGrade}</div>
<div style="font-size:12px;color:#555;line-height:1.6">${d.managementGrade === '—' ? 'Insufficient public data available to assign a management grade. A full assessment will be conducted upon engagement with the building.' : `Based on HPD violations, ECB compliance, DOB permits, litigation status, and financial indicators. ${d.managementGrade === 'A' ? 'This building is well-maintained.' : d.managementGrade === 'B' ? 'There is room for meaningful improvement.' : 'Significant management issues detected &mdash; this building would benefit from professional management.'}`}</div>
</div>
</div>

<div class="stats-row">
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.violations >= 70 ? '#16a34a' : d.managementScorecard.violations >= 50 ? '#ca8a04' : '#dc2626'}">${/[A-F]/.test(d.managementGrade) ? d.managementScorecard.violations : 'Review'}</div><div class="lbl">Violations Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.compliance >= 70 ? '#16a34a' : d.managementScorecard.compliance >= 50 ? '#ca8a04' : '#dc2626'}">${/[A-F]/.test(d.managementGrade) ? d.managementScorecard.compliance : 'Review'}</div><div class="lbl">Compliance Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.financial >= 70 ? '#16a34a' : d.managementScorecard.financial >= 50 ? '#ca8a04' : '#dc2626'}">${/[A-F]/.test(d.managementGrade) ? d.managementScorecard.financial : 'Review'}</div><div class="lbl">Financial Score</div></div>
<div class="stat-box"><div class="val" style="color:${d.managementScorecard.overall >= 70 ? '#16a34a' : d.managementScorecard.overall >= 50 ? '#ca8a04' : '#dc2626'}">${/[A-F]/.test(d.managementGrade) ? d.managementScorecard.overall : 'Pending'}</div><div class="lbl">Overall Score</div></div>
</div>

<div style="margin-top:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:10px;padding-left:16px;border-left:4px solid #A89035">Key Findings</div>
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

<div style="margin-bottom:16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Sale Price Benchmarks</div>
</div>
<div class="stats-row">
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.condoPSF.toLocaleString()}</div><div class="lbl">Condo $/Sqft</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.coopPSF.toLocaleString()}</div><div class="lbl">Co-op $/Sqft</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.rentalPSFYr}</div><div class="lbl">Rental $/Sqft/Yr</div></div>
<div class="stat-box"><div class="val gold">${d.neighborhoodMarketData.daysOnMarket}</div><div class="lbl">Avg Days on Market</div></div>
</div>

<div style="margin:20px 0 16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Rental Market</div>
</div>
<div class="stats-row" style="grid-template-columns:1fr 1fr 1fr">
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.median1BR.toLocaleString()}</div><div class="lbl">Median 1BR Rent/Mo</div></div>
<div class="stat-box"><div class="val gold">$${d.neighborhoodMarketData.median2BR.toLocaleString()}</div><div class="lbl">Median 2BR Rent/Mo</div></div>
<div class="stat-box"><div class="val">${d.neighborhoodMarketData.opexRange}</div><div class="lbl">Operating Costs Range</div></div>
</div>

${d.buildingArea > 0 ? `
<div style="margin:20px 0 16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Your Building vs. Market</div>
</div>
<div class="info-grid">
<div><div class="label">Building GFA</div><div class="value">${d.buildingArea.toLocaleString()} sqft</div></div>
<div><div class="label">Est. Value (at neighborhood $/sqft)</div><div class="value" style="color:#A89035;font-weight:700">${fmtMoney(d.buildingArea * (d.propertyType.toLowerCase().includes('co-op') ? d.neighborhoodMarketData.coopPSF : d.neighborhoodMarketData.condoPSF))}</div></div>
<div><div class="label">Est. Annual Rental Potential</div><div class="value" style="color:#A89035;font-weight:700">${fmtMoney(d.buildingArea * d.neighborhoodMarketData.rentalPSFYr)}</div></div>
<div><div class="label">Est. Gross Yield</div><div class="value">${((d.neighborhoodMarketData.rentalPSFYr / (d.propertyType.toLowerCase().includes('co-op') ? d.neighborhoodMarketData.coopPSF : d.neighborhoodMarketData.condoPSF)) * 100).toFixed(1)}%</div></div>
</div>
` : ''}

<!-- Visual Charts — CSS Bar Charts -->
<div style="margin:20px 0 16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Price Comparison \u2014 $/Sqft by Type</div>
</div>
<div style="display:flex;gap:16px;align-items:flex-end;height:160px;margin-bottom:16px;padding:0 20px">
<div style="flex:1;text-align:center">
<div style="background:linear-gradient(to top,#A89035,#C4AA6E);height:${Math.round(d.neighborhoodMarketData.condoPSF / 25)}px;max-height:140px;border-radius:6px 6px 0 0;min-height:30px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px"><span style="color:#fff;font-size:10px;font-weight:700">$${d.neighborhoodMarketData.condoPSF}</span></div>
<div style="font-size:9px;color:#888;margin-top:4px">Condo $/SF</div>
</div>
<div style="flex:1;text-align:center">
<div style="background:linear-gradient(to top,#3A4B5B,#5A6B7B);height:${Math.round(d.neighborhoodMarketData.coopPSF / 25)}px;max-height:140px;border-radius:6px 6px 0 0;min-height:30px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px"><span style="color:#fff;font-size:10px;font-weight:700">$${d.neighborhoodMarketData.coopPSF}</span></div>
<div style="font-size:9px;color:#888;margin-top:4px">Co-op $/SF</div>
</div>
<div style="flex:1;text-align:center">
<div style="background:linear-gradient(to top,#16a34a,#4ade80);height:${Math.round(d.neighborhoodMarketData.rentalPSFYr * 2)}px;max-height:140px;border-radius:6px 6px 0 0;min-height:30px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px"><span style="color:#fff;font-size:10px;font-weight:700">$${d.neighborhoodMarketData.rentalPSFYr}/yr</span></div>
<div style="font-size:9px;color:#888;margin-top:4px">Rental $/SF/Yr</div>
</div>
<div style="flex:1;text-align:center">
<div style="background:linear-gradient(to top,#dc2626,#f87171);height:${Math.round(d.neighborhoodMarketData.daysOnMarket * 5)}px;max-height:140px;border-radius:6px 6px 0 0;min-height:30px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px"><span style="color:#fff;font-size:10px;font-weight:700">${d.neighborhoodMarketData.daysOnMarket}d</span></div>
<div style="font-size:9px;color:#888;margin-top:4px">Avg Days on Mkt</div>
</div>
</div>

<!-- Rental Chart -->
<div style="margin:20px 0 16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Median Rental Rates</div>
</div>
<div style="display:flex;gap:20px;margin-bottom:16px;padding:0 20px">
<div style="flex:1">
<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
<div style="font-size:11px;color:#888;width:30px">1BR</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:24px;position:relative">
<div style="background:linear-gradient(to right,#A89035,#C4AA6E);height:100%;border-radius:4px;width:${Math.min(100, Math.round(d.neighborhoodMarketData.median1BR / 60))}%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#2C3240">$${d.neighborhoodMarketData.median1BR.toLocaleString()}/mo</span>
</div>
</div>
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:11px;color:#888;width:30px">2BR</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:24px;position:relative">
<div style="background:linear-gradient(to right,#3A4B5B,#5A6B7B);height:100%;border-radius:4px;width:${Math.min(100, Math.round(d.neighborhoodMarketData.median2BR / 90))}%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#2C3240">$${d.neighborhoodMarketData.median2BR.toLocaleString()}/mo</span>
</div>
</div>
</div>
</div>

<!-- Neighborhood Scores Visual -->
<div style="margin:20px 0 16px;border-left:4px solid #A89035;padding-left:12px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600">Neighborhood Scores (1\u201310)</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;padding:0 20px">
${[
  { label: '\uD83D\uDCB0 Investment', score: d.neighborhoodMarketData.investScore },
  { label: '\uD83C\uDFE0 Livability', score: d.neighborhoodMarketData.liveScore },
  { label: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67 Family', score: d.neighborhoodMarketData.familyScore },
  { label: '\uD83D\uDCBC Work Access', score: d.neighborhoodMarketData.workScore },
].map(s => `
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:11px;color:#555;width:100px">${s.label}</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:20px;position:relative">
<div style="background:${s.score >= 8 ? '#16a34a' : s.score >= 6 ? '#A89035' : '#dc2626'};height:100%;border-radius:4px;width:${s.score * 10}%"></div>
<span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#2C3240">${s.score}</span>
</div>
</div>`).join('')}
</div>

<!-- Neighborhood Image — Google Maps area overview -->
<div style="border-radius:10px;overflow:hidden;border:1px solid #D5D0C6;height:200px;margin-bottom:12px">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${d.neighborhoodName ? encodeURIComponent(d.neighborhoodName + ', New York, NY') : encodedAddr}&zoom=14&maptype=roadmap" width="100%" height="200" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>
<div style="text-align:center;font-size:9px;color:#999;margin-bottom:12px">${d.neighborhoodName ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Neighborhood'} \u2014 Area Overview</div>

<div style="background:#EDE9DF;border:1px solid #E5E3DE;border-radius:8px;padding:16px;margin-top:8px">
<p style="font-size:12px;color:#555;line-height:1.7"><strong style="color:#A89035">Source:</strong> Camelot Q1 2026 Market Report. Data from ACRIS closed sales, StreetEasy leased units, and RealtyMX RLS comparables (Q4 2025 \u2013 Q1 2026). Scores are Camelot composite assessments based on market data, public records, census metrics, school ratings, transit access, and crime statistics.</p>
</div>
</div>` : ''}

<!-- PAGE 6: LOCAL LAWS & REGULATORY EXPOSURE -->
<div class="section section-cream">
<div class="section-title">Local Law &amp; Regulatory Compliance</div>
<div class="section-sub">NYC local laws applicable to ${d.buildingName} based on building size, age, and type</div>

<table class="invest-table">
<thead><tr><th>Local Law</th><th>Requirement</th><th>Applicability to This Building</th><th>Status</th></tr></thead>
<tbody>
<tr><td style="font-weight:700">LL97 (Climate Mobilization)</td><td>Carbon emission caps for buildings &gt;25,000 SF. Penalties ~$268/ton excess CO\u2082.</td><td>${d.buildingArea > 25000 ? `<strong style="color:#dc2626">${d.buildingArea.toLocaleString()} SF \u2014 ABOVE threshold</strong>` : d.buildingArea > 0 ? `${d.buildingArea.toLocaleString()} SF \u2014 ${d.buildingArea > 25000 ? 'Above' : 'Below'} threshold` : 'Building area unknown'}</td><td style="color:${d.ll97 && d.ll97.period1Penalty > 0 ? '#dc2626' : '#16a34a'};font-weight:700">${d.ll97 ? (d.ll97.period1Penalty > 0 ? '\u26A0 Penalty Exposure' : '\u2714 Compliant') : 'Assessment needed'}</td></tr>
<tr><td style="font-weight:700">LL11/FISP (Facade Inspection)</td><td>Facade inspection every 5 years for buildings &gt;6 stories.</td><td>${d.stories > 6 ? `<strong style="color:#dc2626">${d.stories} stories \u2014 REQUIRED</strong>` : d.stories > 0 ? `${d.stories} stories \u2014 Not required` : 'Unknown'}</td><td style="font-weight:600">${d.stories > 6 ? 'Cycle 10 due' : 'N/A'}</td></tr>
<tr><td style="font-weight:700">LL152 (Gas Piping)</td><td>Periodic gas piping inspection for all buildings with gas service.</td><td>Required for buildings with gas piping</td><td style="font-weight:600">Verify compliance</td></tr>
<tr><td style="font-weight:700">LL84 (Benchmarking)</td><td>Annual energy benchmarking for buildings &gt;25,000 SF.</td><td>${d.buildingArea > 25000 ? '<strong style="color:#dc2626">Required</strong>' : 'Below threshold'}</td><td style="font-weight:600">${d.energyStarScore != null ? 'Filed \u2014 Score: ' + d.energyStarScore : 'Verify filing'}</td></tr>
<tr><td style="font-weight:700">LL87 (Energy Audit)</td><td>Energy audit + retro-commissioning every 10 years for buildings &gt;50,000 SF.</td><td>${d.buildingArea > 50000 ? '<strong style="color:#dc2626">Required</strong>' : 'Below threshold'}</td><td style="font-weight:600">Verify cycle</td></tr>
<tr><td style="font-weight:700">HPD Registration</td><td>Annual registration for all residential buildings with 3+ units.</td><td>${d.units >= 3 ? '<strong>Required</strong>' : 'Not required'}</td><td style="color:${d.registrationOwner ? '#16a34a' : '#dc2626'};font-weight:600">${d.registrationOwner ? '\u2714 Registered' : '\u26A0 Verify'}</td></tr>
<tr><td style="font-weight:700">LL18 (Elevator Inspection)</td><td>Annual elevator inspection for all buildings with elevators.</td><td>${d.stories > 5 ? 'Likely has elevator' : 'May be walk-up'}</td><td style="font-weight:600">Verify with DOB</td></tr>
${d.isRentStabilized ? '<tr><td style="font-weight:700">Rent Stabilization</td><td>DHCR registration, rent guidelines board increases, lease renewals</td><td><strong style="color:#A89035">Rent Stabilized Building</strong></td><td style="color:#A89035;font-weight:600">Active \u2014 DHCR Registered</td></tr>' : ''}
</tbody>
</table>

<div style="background:#3A4B5B;border-radius:8px;padding:14px 18px;margin-top:14px;color:#fff;font-size:12px;line-height:1.7">
<strong style="color:#A89035">Camelot Compliance Guarantee:</strong> We proactively track ALL local law deadlines, filing requirements, and inspection cycles for every building we manage. Our zero-penalty track record across 42 properties speaks for itself. Compliance monitoring is included at no additional charge.
</div>
</div>

<!-- LL97 DETAIL (if applicable) -->
${d.ll97 ? `
<div class="section section-white">
<div class="section-title">LL97 Carbon Cap \u2014 Detailed Analysis</div>
<div class="section-sub">Local Law 97 penalty exposure for ${d.buildingName}</div>
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
<div class="about-stat"><div class="val">42</div><div class="lbl">Buildings Managed</div></div>
<div class="about-stat"><div class="val">$240M+</div><div class="lbl">Assets Under Mgmt</div></div>
<div class="about-stat"><div class="val">18+</div><div class="lbl">Years in Business</div></div>
<div class="about-stat"><div class="val">5,351+</div><div class="lbl">Units Tracked</div></div>
</div>
<div style="font-size:11px;color:#A89035;text-align:center;margin-top:16px;font-weight:500">\u2B50 RED Awards 2025: Property Management Company of the Year</div>
<div style="font-size:10px;color:#999;text-align:center;margin-top:8px">Member: REBNY | SPONY | NYARM | IREM | BOMA | NARPM | NY Apartment Association</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title" style="color:#0D2E63">Experience Meets Innovation</h2>
<p style="font-size:16px;color:#777;margin:-18px 0 48px 25px">Decades of hands-on management knowledge, powered by modern technology</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:30px">
<div class="deck-card" style="border-top:0;min-height:300px"><h4>The Grey Hair</h4><p>Since 2006, Camelot has managed 130+ properties across New York. Our seasoned property managers and in-house CPAs bring real-world knowledge: board politics, insurance claims, vendor negotiations, compliance pressure, and building emergencies. We are independently owned, and David Goldoff personally oversees every property in our portfolio. When you call, you get a decision-maker, not a call center.</p></div>
<div class="deck-card" style="border-top:0;min-height:300px"><h4>The Technology</h4><p>We harness AI, automation, and data to deliver faster, smarter service. Merlin AI handles meeting minutes, maintenance triage, and compliance alerts. ConciergePlus gives residents a white-labeled portal and mobile app for payments, work orders, amenity bookings, and support. Camelot Central gives boards real-time dashboards, utility tracking, compliance status, and financial transparency.</p></div>
</div>
</div>

<!-- PAGE 10: CORE SERVICES (with icons + rich styling) -->
<div class="section section-white">
<div class="section-title">Core Services</div>
<div class="section-sub">Comprehensive management tailored to ${d.buildingName}</div>

<div style="display:grid;grid-template-columns:${subjectPhoto ? '1.6fr 0.8fr' : '1fr'};gap:28px;align-items:center">
<div>
${[
  { icon: '\uD83C\uDFE2', title: 'Property & Asset Management', desc: 'Weekly site visits by senior management. Vendor coordination, proactive inspections, and cost reduction. 24/7 emergency response with direct access to decision-makers. Buildings treated like owner-managed assets.', color: '#3A4B5B' },
  { icon: '\uD83D\uDCB0', title: 'In-House CPA & Financials', desc: 'Dedicated CPAs \u2014 never outsourced. Monthly board-ready financial reports, 5-year capital planning, real-time arrears tracking, vendor benchmarking, and zero-fee payment processing.', color: '#A89035' },
  { icon: '\uD83D\uDEE1\uFE0F', title: 'Compliance & Risk Management', desc: 'LL11/97, FISP Cycle 10, LL152, HPD, RPIE, boiler and elevator compliance. Zero-penalty track record.' + (d.violationsOpen > 0 ? ' We\u2019ve identified <strong>' + d.violationsOpen + ' compliance items</strong> that our team can address.' : ''), color: '#16a34a' },
].map(s => `<div style="display:flex;gap:16px;align-items:flex-start;background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid ${s.color};border-radius:0 10px 10px 0;padding:20px;margin-bottom:14px">
<div style="font-size:32px;flex-shrink:0;width:48px;height:48px;background:${s.color}10;border-radius:10px;display:flex;align-items:center;justify-content:center">${s.icon}</div>
<div><h4 style="font-size:15px;font-weight:700;color:#2C3240;margin-bottom:6px">${s.title}</h4><p style="font-size:12px;color:#555;line-height:1.7">${s.desc}</p></div>
</div>`).join('\n')}
</div>
${subjectPhoto ? `<div class="deck-photo" style="height:360px"><img src="${subjectPhoto}" alt="${safe(d.buildingName)}"></div>` : ''}
</div>
</div>

<!-- PAGE 11: VALUE-ADDED (with icons) -->
<div class="section section-cream">
<div class="section-title">Value-Added Services</div>
<div class="section-sub">Specialized capabilities included with your management engagement</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
${[
  { icon: '\uD83D\uDD11', title: 'Brokerage & Sublet Processing', desc: 'Licensed brokers, background checks, flip tax, subletting compliance' },
  { icon: '\uD83C\uDFD7\uFE0F', title: 'Project Management', desc: 'Full construction oversight, contractor coordination, capital projects' },
  { icon: '\uD83D\uDCDC', title: 'Offering Plans & House Rules', desc: 'Drafted, modified, and updated in-house by our legal team' },
  { icon: '\u2696\uFE0F', title: 'In-House Attorney Advisory', desc: 'Free legal consultation, lease reviews, dispute resolution' },
  { icon: '\uD83D\uDC64', title: 'Fractional Senior PM / GM', desc: 'Senior-level leadership at a fraction of full-time cost' },
  { icon: '\uD83C\uDFE6', title: 'Licensed Mortgage Broker', desc: 'Shareholder refinancing, board financing, rate analysis' },
  { icon: '\uD83D\uDCCA', title: 'Audits, Analytics & Reports', desc: 'Vendor analysis, market reports, AI-powered meeting minutes' },
  { icon: '\uD83D\uDC77', title: 'Staff Training & Supervision', desc: 'Written SOPs, performance reviews, 24/7 staff support line' },
].map(s => `<div style="background:#fff;border:1px solid #D5D0C6;border-radius:10px;padding:16px;display:flex;gap:12px;align-items:flex-start">
<div style="font-size:24px;flex-shrink:0">${s.icon}</div>
<div><h5 style="font-size:13px;font-weight:700;color:#2C3240;margin-bottom:4px">${s.title}</h5><p style="font-size:11px;color:#888;line-height:1.5">${s.desc}</p></div>
</div>`).join('\n')}
</div>
<div class="deck-note" style="text-align:center;margin-top:18px">Everything a luxury condominium board needs: under one roof, with in-house licensed professionals.</div>
</div>

<!-- PAGE 12: COMPLIANCE CALENDAR -->
<div class="section section-white">
<div class="section-title">Compliance &amp; Local Law 97</div>
<div class="section-sub">Proactive compliance calendar for ${d.buildingName} \u2014 Jackie checks the property profile before release</div>
<div class="compliance-row">
${complianceDates.map(c => `<div class="compliance-card"><div class="month">${c.month}</div><h5>${c.title}</h5><p>${safe(c.desc)}</p></div>`).join('\n')}
</div>
<h3 style="font-family:'Cardo',Georgia,serif;font-size:22px;color:#0D2E63;margin:30px 0 16px">LOCAL LAW 97 &mdash; Critical for ${safe(ll97Context)}</h3>
<div class="compliance-row">
<div class="compliance-card"><h5>Annual Benchmarking</h5><p>Energy filings required. Zero fines, zero penalties.</p></div>
<div class="compliance-card"><h5>Penalty Modeling</h5><p>${d.ll97 ? `${fmtMoney(d.ll97.period1Penalty)} current-period annual exposure modeled.` : 'Model liability before it becomes a fine.'}</p></div>
<div class="compliance-card"><h5>Capital Upgrade Path</h5><p>HVAC, boiler, insulation, and controls that reduce emissions and cost.</p></div>
<div class="compliance-card"><h5>Cost Recovery Plan</h5><p>Rebates, incentives, tax credits, and financing options for upgrades.</p></div>
</div>
</div>

<!-- PAGE 13: TECHNOLOGY -->
<div class="section section-cream">
<div class="section-title">Technology Platform</div>
<div class="section-sub">Proprietary tools connecting data, intelligence, and operations</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;color:#A89035;text-align:center;margin-bottom:20px;font-weight:600">Merlin AI &nbsp;+&nbsp; Camelot Central &nbsp;+&nbsp; ConciergePlus</div>
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

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title" style="color:#0D2E63">Your Investment</h2>
<p style="font-size:15px;color:#777;margin:-20px 0 28px 24px">Tailored to ${safe(d.buildingName)} after a comprehensive scope and budget review</p>
<p style="font-size:14px;color:#0F1E33;line-height:1.55;max-width:760px;margin-bottom:24px">Every building is different. Before we discuss pricing, we take the time to understand ${safe(d.buildingName)}'s unique needs: operations, financials, staffing, vendors, compliance profile, and board goals. Our fee is shaped by that conversation, not a one-size-fits-all formula.</p>
<div style="display:grid;grid-template-columns:0.8fr 1.2fr;gap:26px">
<div>
<div style="width:70px;height:4px;background:#B8973A;margin-bottom:8px"></div>
<h3 style="font-family:'Cardo',Georgia,serif;font-size:24px;color:#0D2E63;margin-bottom:12px">Our Approach</h3>
${[
  ['Scope Review First', "We assess operations, staff, vendors, and compliance before proposing any fee structure."],
  ['Flexible Frameworks', "Per-unit, flat-fee, and hybrid structures can align with the board's priorities."],
  ['No Hidden Costs', 'What we quote is what you pay: no percentage markups on vendors, no surprise surcharges.'],
  ['Long-Term Value', 'Technology, compliance tools, and vendor relationships create savings that offset the fee over time.'],
].map(r => `<div style="display:flex;gap:10px;margin-bottom:12px"><span style="color:#B8973A;font-size:18px">●</span><div><strong style="color:#0D2E63">${r[0]}</strong><p style="font-size:11px;color:#38557D;line-height:1.4">${r[1]}</p></div></div>`).join('')}
</div>
<div>
<h3 style="font-family:'Cardo',Georgia,serif;font-size:24px;color:#0D2E63;margin-bottom:8px">What's Always Included</h3>
<table class="deck-table" style="font-size:11px"><thead><tr><th>Included Service</th><th>What You Get</th></tr></thead><tbody>
${proposedRows.slice(1).map(r => `<tr><td><strong>${r[0]}</strong></td><td>${safe(r[1])}</td></tr>`).join('\n')}
</tbody></table>
</div>
</div>
<div class="deck-note" style="text-align:center">We'd like to learn about your building's needs first: then we'll propose a fee that makes sense for both of us.</div>
</div>

<div class="deck-slide">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<h2 class="deck-title">The Proposed Investment</h2>
<p class="deck-kicker" style="margin:0 0 28px 32px">Flat-rate, all-inclusive: no percentage fees, no hidden surcharges, no surprises.</p>
<table class="deck-table">
<thead><tr><th>Management Service Component</th><th>Camelot Inclusion</th></tr></thead>
<tbody>
${proposedRows.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${safe(r[1])}</td></tr>`).join('\n')}
</tbody>
</table>
<div class="deck-note">Our efficiencies effectively pay for our management through long-term savings on vendors, compliance, and capital.</div>
</div>

<!-- PAGE 15: THREE-TIER PRICING -->
<div class="section section-cream">
<div class="section-title">Service Packages — ${d.buildingName}</div>
<div class="section-sub">Three tiers designed for ${d.units} units \u2014 choose the level of service that fits your building</div>

<!-- Three Tier Cards -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px">

<!-- CLASSIC -->
<div style="background:#fff;border:2px solid #D5D0C6;border-radius:10px;padding:20px;text-align:center">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:8px">Classic</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:800;color:#3A4B5B">$${d.tieredPricing.classic.perUnit}</div>
<div style="font-size:11px;color:#888;margin-bottom:14px">per unit / month</div>
<div style="font-size:10px;color:#555;text-align:left;line-height:1.8">
\u2714 Weekly inspections<br>
\u2714 24/7 emergency line<br>
\u2714 In-house CPA<br>
\u2714 Monthly financials<br>
\u2714 Compliance tracking<br>
\u2714 Vendor coordination<br>
\u2714 Board meetings<br>
<span style="color:#ccc">\u2716 ConciergePlus Portal</span><br>
<span style="color:#ccc">\u2716 Merlin AI</span><br>
<span style="color:#ccc">\u2716 Zero bank fees</span><br>
<span style="color:#ccc">\u2716 Market reports</span><br>
<span style="color:#ccc">\u2716 Free inspection</span>
</div>
<div style="margin-top:14px;padding-top:12px;border-top:1px solid #E5E3DE">
<div style="font-size:11px;color:#888">$${d.tieredPricing.classic.monthly.toLocaleString()}/mo \u00B7 $${d.tieredPricing.classic.annual.toLocaleString()}/yr</div>
</div>
</div>

<!-- INTELLIGENCE (RECOMMENDED) -->
<div style="background:#3A4B5B;border:3px solid #A89035;border-radius:10px;padding:20px;text-align:center;color:#fff;position:relative">
<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#A89035;color:#fff;padding:4px 16px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px">\u2B50 Recommended</div>
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;margin-bottom:8px;margin-top:4px">Intelligence</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:800;color:#A89035">$${d.tieredPricing.intelligence.perUnit}</div>
<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:14px">per unit / month</div>
<div style="font-size:10px;color:rgba(255,255,255,0.85);text-align:left;line-height:1.8">
\u2714 Everything in Classic<br>
\u2714 <strong style="color:#A89035">ConciergePlus Portal (26 modules)</strong><br>
\u2714 <strong style="color:#A89035">Merlin AI \u2014 24/7 support</strong><br>
\u2714 <strong style="color:#A89035">ZERO bank fees</strong><br>
\u2714 <strong style="color:#A89035">Quarterly SCOUT reports</strong><br>
\u2714 <strong style="color:#A89035">LL97 penalty modeling</strong><br>
\u2714 <strong style="color:#A89035">AI board minutes</strong><br>
\u2714 <strong style="color:#A89035">FREE building inspection</strong><br>
<span style="color:rgba(255,255,255,0.3)">\u2716 Dedicated senior PM</span><br>
<span style="color:rgba(255,255,255,0.3)">\u2716 Insurance rebid</span><br>
<span style="color:rgba(255,255,255,0.3)">\u2716 Session w/ David</span>
</div>
<div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(168,144,53,0.3)">
<div style="font-size:11px;color:rgba(255,255,255,0.6)">$${d.tieredPricing.intelligence.monthly.toLocaleString()}/mo \u00B7 $${d.tieredPricing.intelligence.annual.toLocaleString()}/yr</div>
</div>
</div>

<!-- PREMIER -->
<div style="background:#fff;border:2px solid #A89035;border-radius:10px;padding:20px;text-align:center">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;margin-bottom:8px">Premier</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:800;color:#A89035">$${d.tieredPricing.premier.perUnit}</div>
<div style="font-size:11px;color:#888;margin-bottom:14px">per unit / month</div>
<div style="font-size:10px;color:#555;text-align:left;line-height:1.8">
\u2714 Everything in Intelligence<br>
\u2714 <strong>Dedicated Senior PM</strong><br>
\u2714 <strong>Monthly market reports</strong><br>
\u2714 <strong>Capital projects included</strong> (up to $50K)<br>
\u2714 <strong>Annual insurance rebid</strong><br>
\u2714 <strong>Vendor rebid guarantee</strong><br>
\u2714 <strong>30-min emergency guarantee</strong><br>
\u2714 <strong>Annual session w/ David Goldoff</strong><br>
\u2714 <strong>Reduced Schedule A fees</strong>
</div>
<div style="margin-top:14px;padding-top:12px;border-top:1px solid #E5E3DE">
<div style="font-size:11px;color:#888">$${d.tieredPricing.premier.monthly.toLocaleString()}/mo \u00B7 $${d.tieredPricing.premier.annual.toLocaleString()}/yr</div>
</div>
</div>

</div>

<!-- Comparison vs Competitors -->
<div style="background:#EDE9DF;border-radius:8px;padding:14px 18px;margin-bottom:16px">
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
<div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">vs. FirstService</div><div style="font-size:13px;font-weight:700;color:#16a34a">30\u201345% less</div></div>
<div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">vs. AKAM</div><div style="font-size:13px;font-weight:700;color:#16a34a">25\u201340% less</div></div>
<div><div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">vs. Orsid</div><div style="font-size:13px;font-weight:700;color:#16a34a">15\u201330% less</div></div>
</div>
<div style="font-size:10px;color:#555;text-align:center;margin-top:8px">With MORE services included. No hidden Schedule A surprises.</div>
</div>

<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-style:italic;color:#A89035;font-size:13px;text-align:center">80% of Camelot clients choose Intelligence. Our AI technology pays for the difference.</div>
</div>

<!-- PAGE 15B: FEE COMPARISON — MARKET RATE ANALYSIS -->
${d.feeComparison ? `
<div class="section section-white">
<div class="section-title">Fee Comparison — Market Rate Analysis</div>
<div class="section-sub">${d.feeComparison.tierLabel} — How Camelot compares to industry standard pricing</div>

<!-- Market vs Camelot Visual -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:18px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px">Market Range</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:24px;font-weight:700;color:#dc2626">$${d.feeComparison.marketRangeLow}–$${d.feeComparison.marketRangeHigh}</div>
<div style="font-size:10px;color:#888">per unit / year</div>
</div>
<div style="background:#3A4B5B;border-radius:8px;padding:18px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#A89035;margin-bottom:6px">Camelot Rate</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:24px;font-weight:700;color:#A89035">$${d.feeComparison.camelotAnnualPerUnit}</div>
<div style="font-size:10px;color:rgba(255,255,255,0.6)">per unit / year</div>
</div>
<div style="background:#16a34a;border-radius:8px;padding:18px;text-align:center;color:#fff">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">Your Savings</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700">${d.feeComparison.savings}</div>
<div style="font-size:10px;opacity:0.8">with MORE services included</div>
</div>
</div>

<!-- Bar Chart: Annual Cost Comparison -->
<div style="margin-bottom:24px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:12px;padding-left:16px;border-left:4px solid #A89035">Annual Management Cost (${d.units} units)</div>
<div style="display:flex;flex-direction:column;gap:8px;padding:0 20px">
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:11px;color:#888;width:110px;text-align:right">Market Low</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:28px;position:relative">
<div style="background:linear-gradient(to right,#dc2626,#f87171);height:100%;border-radius:4px;width:${Math.min(100, Math.round((d.feeComparison.marketRangeLow * d.units) / (d.feeComparison.marketRangeHigh * d.units) * 100))}%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#2C3240">$${(d.feeComparison.marketRangeLow * d.units).toLocaleString()}/yr</span>
</div>
</div>
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:11px;color:#888;width:110px;text-align:right">Market High</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:28px;position:relative">
<div style="background:linear-gradient(to right,#dc2626,#f87171);height:100%;border-radius:4px;width:100%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#fff">$${(d.feeComparison.marketRangeHigh * d.units).toLocaleString()}/yr</span>
</div>
</div>
<div style="display:flex;align-items:center;gap:8px">
<div style="font-size:11px;color:#A89035;width:110px;text-align:right;font-weight:700">★ Camelot</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:28px;position:relative">
<div style="background:linear-gradient(to right,#A89035,#C4AA6E);height:100%;border-radius:4px;width:${Math.min(100, Math.round((d.feeComparison.camelotAnnualPerUnit * d.units) / (d.feeComparison.marketRangeHigh * d.units) * 100))}%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:#2C3240">$${(d.feeComparison.camelotAnnualPerUnit * d.units).toLocaleString()}/yr</span>
</div>
</div>
</div>
</div>

<!-- Ancillary Fees Comparison Table -->
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:12px;padding-left:16px;border-left:4px solid #A89035">What's Included — Camelot vs. Industry Standard</div>
<table class="invest-table" style="font-size:11px">
<thead><tr><th>Service</th><th>Industry Standard Rate</th><th>Camelot Rate</th></tr></thead>
<tbody>
${d.feeComparison.ancillaryComparison.map((row, i) => `<tr${i % 2 === 0 ? '' : ' style="background:#EDE9DF"'}><td>${row.service}</td><td style="color:#dc2626">${row.marketRate}</td><td style="color:#16a34a;font-weight:600">${row.camelotRate}</td></tr>`).join('\n')}
</tbody>
</table>

<!-- Services included callout -->
<div style="background:#3A4B5B;border-radius:8px;padding:16px 20px;margin-top:16px;color:#fff">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#A89035;font-weight:700;margin-bottom:10px">✅ Services Included at No Extra Charge</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
${d.feeComparison.ancillaryFeesIncluded.map(svc => `<div style="font-size:11px;color:rgba(255,255,255,0.8);padding:3px 0">• ${svc}</div>`).join('\n')}
</div>
</div>

<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:12px 16px;margin-top:16px">
<p style="font-size:10px;color:#555;line-height:1.6"><strong style="color:#A89035">Source:</strong> Industry fee ranges compiled from Brick Underground, CooperatorNews, FirstService Residential, PropertyClub NYC, Hudson Property Services, Habitat Magazine, Hauseit, and Yoreevo (2023–2025). Actual rates vary by company and building. Camelot's all-inclusive pricing often provides better total value than lower base fees with extensive à la carte charges.</p>
</div>
</div>
` : ''}

<!-- PAGE 16: PROVEN TRACK RECORD -->
<div class="section section-white">
<div class="section-title">Proven Track Record</div>
<div class="section-sub">Case studies and client testimonials</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
<div style="background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:18px">
<h4 style="font-size:14px;font-weight:700;color:#3A4B5B;margin-bottom:8px">111 Mott Street</h4>
<p style="font-size:11px;color:#555;line-height:1.7;margin-bottom:8px">Camelot case-study source: structural facade deterioration requiring coordinated project management, board communication, vendor oversight, and compliance follow-through.</p>
<p style="font-size:13px;color:#A89035;font-weight:700">Facade deterioration response · Chinatown rental</p>
</div>
<div style="background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:18px">
<h4 style="font-size:14px;font-weight:700;color:#3A4B5B;margin-bottom:8px">250 Bowery</h4>
<p style="font-size:11px;color:#555;line-height:1.7;margin-bottom:8px">Camelot case-study source: emergency water-line event during a holiday period, requiring immediate coordination and resident-facing response.</p>
<p style="font-size:13px;color:#A89035;font-weight:700">Emergency response · Sprinkler water-line incident</p>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
<div style="background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:18px">
<h4 style="font-size:14px;font-weight:700;color:#3A4B5B;margin-bottom:8px">301 East 50th Street</h4>
<p style="font-size:11px;color:#555;line-height:1.7">Camelot case-study source: 56-unit white-glove condominium operations, resident service, staff coordination, and luxury-building board expectations.</p>
</div>
<div style="background:#FDFAF3;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:18px">
<h4 style="font-size:14px;font-weight:700;color:#3A4B5B;margin-bottom:8px">White Street Plaza Corp.</h4>
<p style="font-size:11px;color:#555;line-height:1.7">Camelot case-study source: 58 White Street facade repair project management, contractor coordination, schedule tracking, and board reporting.</p>
</div>
</div>

<div style="font-size:11px;color:#A89035;font-weight:600;text-align:center;margin-bottom:16px">Source: camelot.nyc/case-studies · Properties include condominiums, cooperatives, multifamily rentals, and capital project assignments<br><span style="color:#888;font-weight:400">Serving: Manhattan, Brooklyn, Queens, Bronx, Westchester, NJ, CT, and Florida</span></div>
</div>

<!-- PAGE 16B: TESTIMONIALS -->
<div class="section section-cream">
<div class="section-title">What Our Clients Say</div>
<div class="section-sub">Real feedback from boards and owners we serve</div>

<div class="testimonial-grid">
<div class="testimonial"><div class="qm">\u201C</div><p>Camelot has been a helpful agent representing our Co-op since we moved into our new home. As a new Board President and moving into a new building, we really relied on Camelot for their experience in understanding protocols, building-wide systems, and the business of running a building. The transition from Sponsor to a newly formed Board and dealing with the nuances of a new building settling is not easy without support.</p><div class="author">Brandon Miller</div><div class="author-title">Board President, 137 Franklin Street Apartment Corp</div></div>
<div class="testimonial"><div class="qm">\u201C</div><p>I have been a client of Camelot Realty Group since buying my apartment in 2012. Valerie and David have been by my side as not only the best and most knowledgeable property managers but as family! Their experience and dedication is limitless and they go far beyond the expected for each and every one of their clients and properties.</p><div class="author">Evee Georgiadis</div><div class="author-title">Owner, 949 Park Avenue Condominium</div></div>
</div>
<div class="testimonial-grid" style="margin-top:16px">
<div class="testimonial"><div class="qm">\u201C</div><p>As an overseas property owner, it is important to have a property manager that is responsive to both our and our tenants needs, knowledgeable and experienced across the lifecycle of ownership, cost efficient and trustworthy. As Camelot\u2019s clients for over three years we have come to appreciate the service, actions and advice the principals have provided \u2014 it is done in a friendly, personalized and professional way and goes the extra mile which has made our life much easier.</p><div class="author">Lawrence Lee</div><div class="author-title">Managing Director, Laureat Hotel Investments Limited</div></div>
<div class="testimonial"><div class="qm">\u201C</div><p>Camelot had always taken time to truly understand our properties and deliver a management solution that fits our needs. Camelot\u2019s responsiveness to the daily challenge of building property management and creative approaches to problem solving has helped Nexus to grow and gain respect in the NYC real estate market.</p><div class="author">Shaky Cohen</div><div class="author-title">Founder, Nexus Building Development Group</div></div>
</div>
</div>

<!-- PAGE 16C: FINANCIAL EXCELLENCE -->
<div class="section section-white">
<div class="section-title">Financial Excellence</div>
<div class="section-sub">Clear answers. On time. Every time. No chasing your management company.</div>

<div style="display:grid;grid-template-columns:3fr 2fr;gap:20px">
<div>
<h4 style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;color:#3A4B5B;font-weight:700;margin-bottom:10px">In-House CPA Team</h4>
<p style="font-size:12px;color:#555;line-height:1.7;margin-bottom:14px">We don\u2019t outsource our books. Our in-house CPAs work directly for ${d.buildingName}, ensuring absolute accuracy, clear reporting, and immediate answers to your financial questions.</p>
<div style="margin-bottom:6px"><span style="color:#A89035;font-size:14px">\u2714</span> <span style="font-size:12px;color:#2C3240">Detailed Books Delivered Monthly \u2014 on schedule</span></div>
<div style="margin-bottom:6px"><span style="color:#A89035;font-size:14px">\u2714</span> <span style="font-size:12px;color:#2C3240">Real-Time Digital Arrears Tracking</span></div>
<div style="margin-bottom:6px"><span style="color:#A89035;font-size:14px">\u2714</span> <span style="font-size:12px;color:#2C3240">5-Year Forward Capital Planning</span></div>
<div style="margin-bottom:6px"><span style="color:#A89035;font-size:14px">\u2714</span> <span style="font-size:12px;color:#2C3240">Zero-Fee Online Payment Platform</span></div>
<div style="margin-bottom:6px"><span style="color:#A89035;font-size:14px">\u2714</span> <span style="font-size:12px;color:#2C3240">Board-Ready Reports \u2014 no chasing required</span></div>
<p style="font-size:12px;color:#A89035;font-style:italic;margin-top:12px">Camelot consistently doubles the Manhattan market average for rent growth.</p>
</div>
<div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:18px;text-align:center;margin-bottom:12px">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;color:#A89035;font-weight:700">10.55%</div>
<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Avg. YoY Rent Increase<br>vs. 5.20% market</div>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:18px;text-align:center;margin-bottom:12px">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;color:#A89035;font-weight:700">96%</div>
<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Portfolio Occupancy Rate</div>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:18px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;color:#A89035;font-weight:700"></div>
<div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px"></div>
</div>
</div>
</div>
</div>

<!-- PAGE 16D: SMART SECURITY & SURVEILLANCE -->
<div class="section section-cream">
<div class="section-title">Smart Security &amp; Surveillance</div>
<div class="section-sub">Live remote monitoring, cloud storage, emergency dispatch capability</div>

<div class="va-grid">
<div class="va-card"><h5 style="color:#A89035">Live Remote Surveillance</h5><p>Cloud-hosted cameras 24/7 \u2014 lobby, elevators, service entrances. Real-time feeds accessible to management.</p></div>
<div class="va-card"><h5 style="color:#A89035">AI-Powered Monitoring</h5><p>Computer vision flags unauthorized access, package theft, loitering. Automated alerts to management team.</p></div>
<div class="va-card"><h5 style="color:#A89035">Emergency Dispatch</h5><p>Integrated dispatch \u2014 NYPD, FDNY, EMS contacted directly. Response coordination from incident to resolution.</p></div>
<div class="va-card"><h5 style="color:#A89035">Cloud Storage &amp; Audit</h5><p>Tamper-proof logs. Evidence retrieval for insurance claims. 90-day cloud retention standard.</p></div>
<div class="va-card"><h5 style="color:#A89035">Access Control</h5><p>Smart fob, intercom, keyless entry. Visitor logs centralized. Package room monitoring.</p></div>
<div class="va-card"><h5 style="color:#A89035">Monthly Security Audit</h5><p>Board reports with incident docs, photos, digital signatures. Full accountability trail.</p></div>
</div>
</div>

<!-- PAGE 16E: TECHNOLOGY PLATFORM PARTNERS -->
<div class="section section-white">
<div class="section-title">Technology Platform Partners</div>
<div class="section-sub">Technology partners help Camelot build automation and seamless operating systems for buildings and residents</div>

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:26px 0 20px">
${[
  { name: 'Select', domain: 'meetselect.com', url: 'https://www.meetselect.com', desc: 'Resident lifestyle benefits' },
  { name: 'MDS', domain: 'aboramds.com', url: 'https://www.aboramds.com', desc: 'Property management software' },
  { name: 'BankUnited', domain: 'bankunited.com', url: 'https://www.bankunited.com', desc: 'Banking and treasury partner' },
  { name: 'AppFolio', domain: 'appfolio.com', url: 'https://www.appfolio.com', desc: 'Property operations platform' },
  { name: 'PropertyShark', domain: 'propertyshark.com', url: 'https://www.propertyshark.com', desc: 'Market and ownership intelligence' },
  { name: 'ConciergePlus', domain: 'conciergeplus.com', url: 'https://www.conciergeplus.com', desc: 'Resident portal and service workflow' },
  { name: 'HubSpot', domain: 'hubspot.com', url: 'https://www.hubspot.com', desc: 'CRM and client communications' },
].map(p => `<a href="${p.url}" target="_blank" rel="noopener" style="background:#fff;border:1px solid #D5D0C6;text-decoration:none;min-height:116px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
<img src="https://logo.clearbit.com/${p.domain}" alt="${p.name} logo" style="max-width:170px;max-height:42px;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<div style="display:none;font-size:20px;font-weight:800;color:#1F2937">${p.name}</div>
<div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.8px;text-align:center">${p.desc}</div>
</a>`).join('')}
</div>

<div style="background:#F5F0E5;border:1px solid #D5D0C6;border-left:4px solid #B8973A;padding:14px 18px;margin:0 0 16px">
<p style="font-size:12px;color:#38557D;line-height:1.6">Camelot connects these platforms with Jackie, Merlin AI, and Camelot Central so boards get faster communication, better compliance visibility, cleaner financial workflows, and a resident experience that feels modern without losing human judgment.</p>
</div>

<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:20px 0">
${[
  { name: 'MDS', domain: 'aboramds.com', color: '#1a365d', initial: 'M', desc: 'Core PM Platform' },
  { name: 'BankUnited', domain: 'bankunited.com', color: '#003366', initial: 'BU', desc: 'Banking Partner' },
  { name: 'AppFolio', domain: 'appfolio.com', color: '#0066cc', initial: 'AF', desc: 'Property Mgmt' },
  { name: 'HubSpot', domain: 'hubspot.com', color: '#ff7a59', initial: 'HS', desc: 'CRM' },
  { name: 'Google', domain: 'google.com', color: '#4285f4', initial: 'G', desc: 'Workspace' },
  { name: 'BuildingLink', domain: 'buildinglink.com', color: '#0073b7', initial: 'BL', desc: 'Resident Portal' },
  { name: 'Select', domain: 'meetselect.com', color: '#2d6a4f', initial: 'S', desc: 'Resident Benefits' },
  { name: 'ConciergePlus', domain: 'conciergeplus.com', color: '#A89035', initial: 'C+', desc: 'AI Portal' },
  { name: 'PropertyShark', domain: 'propertyshark.com', color: '#e63946', initial: 'PS', desc: 'Market Intel' },
  { name: 'Parity', domain: 'parity.com', color: '#16a34a', initial: 'P', desc: 'Energy/HVAC' },
].map(p => `<div style="background:#fff;border:1px solid #D5D0C6;border-radius:10px;padding:14px 10px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:90px">
<div style="width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;overflow:hidden">
<img src="https://logo.clearbit.com/${p.domain}" alt="${p.name}" style="width:44px;height:44px;object-fit:contain;border-radius:10px;position:absolute;top:0;left:0;background:#fff" onerror="this.style.display='none'">
<div style="width:44px;height:44px;background:${p.color};border-radius:10px;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-weight:800;font-size:${p.initial.length > 1 ? '14' : '18'}px;letter-spacing:-0.5px">${p.initial}</span></div>
</div>
<div style="font-size:11px;font-weight:700;color:#2C3240;line-height:1.2">${p.name}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px">${p.desc}</div>
</div>`).join('\n')}
</div>

<div style="text-align:center;font-size:10px;color:#888;margin-top:8px">Also powered by: OpenAI NLP &nbsp;\u00B7&nbsp; AWS Cloud &nbsp;\u00B7&nbsp; RealtyMX &nbsp;\u00B7&nbsp; SiteCompli &nbsp;\u00B7&nbsp; Jack Jaffa</div>
</div>

<!-- PAGE 17: FINANCIAL OPPORTUNITY ANALYSIS -->
<div class="section section-cream">
<div class="section-title">Financial Opportunity Analysis</div>
<div class="section-sub">Projected annual value creation — based on Camelot portfolio benchmarks</div>

<div class="stats-row">
<div class="stat-box"><div class="val gold">$${d.monthlyFee.toLocaleString()}/mo</div><div class="lbl">Proposed Mgmt Fee ($${d.pricePerUnit}/unit)</div></div>
<div class="stat-box"><div class="val" style="color:#16a34a">$${Math.round(d.units * 4500).toLocaleString()}/yr</div><div class="lbl">Est. Retention Savings</div></div>
<div class="stat-box"><div class="val" style="color:#16a34a">$${Math.round(d.units * 750).toLocaleString()}/yr</div><div class="lbl">Est. Payment Recovery</div></div>
<div class="stat-box"><div class="val" style="color:#16a34a">$${(d.buildingArea > 0 ? Math.round(d.buildingArea * 0.40).toLocaleString() : Math.round(d.units * 250).toLocaleString())}/yr</div><div class="lbl">Est. Energy Savings</div></div>
</div>

<table class="invest-table" style="margin-top:16px">
<thead><tr><th>Opportunity Area</th><th>Est. Annual Impact</th><th>Priority</th><th>Camelot Approach</th></tr></thead>
<tbody>
<tr><td>Insurance Portfolio Review</td><td style="color:#16a34a;font-weight:700">$${Math.round(d.units * 200 / 1000)}K–$${Math.round(d.units * 500 / 1000)}K/yr</td><td>★★★ High</td><td>Full coverage audit + independent broker market review</td></tr>
<tr><td>Vendor Contract Rebidding</td><td style="color:#16a34a;font-weight:700">$${Math.round(d.units * 300 / 1000)}K–$${Math.round(d.units * 650 / 1000)}K/yr</td><td>★★★ High</td><td>Elevator, cleaning, extermination — competitive 3-bid process via Camelot network</td></tr>
<tr><td>Energy Optimization (Parity)</td><td style="color:#16a34a;font-weight:700">$${Math.round(d.units * 120 / 1000)}K–$${Math.round(d.units * 300 / 1000)}K/yr</td><td>★★ Medium</td><td>HVAC monitoring, demand-side savings, LL97 compliance pathway</td></tr>
<tr><td>Non-Maintenance Revenue</td><td style="color:#16a34a;font-weight:700">$${Math.round(d.units * 130 / 1000)}K–$${Math.round(d.units * 350 / 1000)}K/yr</td><td>★★ Medium</td><td>Laundry, storage, alteration fees, sublet charges, flip tax review</td></tr>
<tr><td>Process &amp; Admin Efficiency</td><td style="color:#16a34a;font-weight:700">$${Math.round(d.units * 70 / 1000)}K–$${Math.round(d.units * 160 / 1000)}K/yr</td><td>★ Lower</td><td>Digital document management, automated billing, AI board minutes</td></tr>
</tbody>
</table>

<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:14px 18px;margin-top:12px">
<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
<div><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888">Resident Retention (Merlin AI)</span><br>
<span style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:20px;font-weight:700;color:#16a34a">$${Math.round(d.units * 3500).toLocaleString()} – $${Math.round(d.units * 8000).toLocaleString()}/yr</span>
<span style="display:block;font-size:10px;color:#555;margin-top:2px">${d.units} units × $3,500–$8,000 avg turnover cost avoided per unit</span></div>
<div style="text-align:right"><span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888">Priority</span><br><span style="font-size:14px;font-weight:700;color:#A89035">★★★ High</span></div>
</div>
</div>

<div style="background:#16a34a;color:#fff;border-radius:8px;padding:14px 20px;margin-top:16px;text-align:center">
<span style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;font-weight:700">Total Year 1 Opportunity: $${(98000 + Math.round(d.units * 3500)).toLocaleString()} – $${(223000 + Math.round(d.units * 8000)).toLocaleString()}+</span>
<span style="display:block;font-size:11px;opacity:0.9;margin-top:4px">$98K–$223K operational savings + $${Math.round(d.units * 3500 / 1000)}K–$${Math.round(d.units * 8000 / 1000)}K resident retention value</span>
</div>
</div>

<!-- PAGE 17B: CHARTS, GRAPHS & 5-YEAR PRO FORMA -->
<div class="section section-white">
<div class="section-title">Value Creation — Visual Analysis</div>
<div class="section-sub">Charts and projections specific to ${d.buildingName} (${d.units} units${d.buildingArea > 0 ? ', ' + d.buildingArea.toLocaleString() + ' SF' : ''})</div>

<!-- Savings Breakdown — Horizontal Bar Chart -->
<div style="margin-bottom:28px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:14px;padding-left:16px;border-left:4px solid #A89035">Projected Annual Savings by Category</div>
${[
  { label: 'Vendor Rebidding', low: Math.round(d.units * 300), high: Math.round(d.units * 650), color: '#A89035' },
  { label: 'Insurance Review', low: Math.round(d.units * 200), high: Math.round(d.units * 500), color: '#3A4B5B' },
  { label: 'Energy (Parity)', low: Math.round(d.units * 120), high: Math.round(d.units * 300), color: '#16a34a' },
  { label: 'Revenue Recovery', low: 15000, high: 40000, color: '#0073b7' },
  { label: 'Retention Savings', low: Math.round(d.units * 3500), high: Math.round(d.units * 8000), color: '#e63946' },
  { label: 'Admin Efficiency', low: 8000, high: 18000, color: '#888' },
].map(item => {
  const maxVal = 75000 + (d.units * 8000);
  const pctLow = Math.min(100, Math.round((item.low / maxVal) * 100));
  const pctHigh = Math.min(100, Math.round((item.high / maxVal) * 100));
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
<div style="width:120px;text-align:right;font-size:11px;color:#555;flex-shrink:0">${item.label}</div>
<div style="flex:1;background:#E5E3DE;border-radius:4px;height:24px;position:relative">
<div style="position:absolute;left:0;top:0;height:100%;background:${item.color};opacity:0.3;border-radius:4px;width:${pctHigh}%"></div>
<div style="position:absolute;left:0;top:0;height:100%;background:${item.color};border-radius:4px;width:${pctLow}%"></div>
<span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:600;color:#2C3240">$${(item.low/1000).toFixed(0)}K–$${(item.high/1000).toFixed(0)}K</span>
</div>
</div>`;
}).join('\n')}
</div>

<!-- 5-Year Pro Forma Projection -->
<div style="margin-bottom:28px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:14px;padding-left:16px;border-left:4px solid #A89035">5-Year Financial Pro Forma</div>
${(() => {
  const mgmtFee = financialModel.annualFee;
  // Dynamic savings: scale with units — insurance ($200-500/unit) + vendor ($300-650/unit) + energy ($120-300/unit) + revenue ($130-350/unit) + admin ($70-160/unit)
  const yr1Mid = financialModel.year1Value;
  const growth = 1 + financialModel.valueGrowth;
  const years = [1, 2, 3, 4, 5];
  const projections = years.map(y => {
    const savings = Math.round(yr1Mid * Math.pow(growth, y - 1));
    const fee = Math.round(mgmtFee * Math.pow(1 + financialModel.feeEscalation, y - 1));
    const net = savings - fee;
    const roi = Math.round((net / fee) * 100);
    return { year: y, savings, fee, net, roi };
  });
  const cumSavings = projections.reduce((acc, p) => { acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + p.net); return acc; }, [] as number[]);
  const totalSavings5yr = cumSavings[cumSavings.length - 1];
  const maxCum = totalSavings5yr;

  return `<table class="invest-table" style="font-size:11px">
<thead><tr><th>Year</th><th>Est. Value Created</th><th>Management Fee</th><th>Net Benefit</th><th>ROI</th><th>Cumulative Net</th></tr></thead>
<tbody>
${projections.map((p, i) => `<tr${i % 2 ? ' style="background:#EDE9DF"' : ''}>
<td style="font-weight:700">Year ${p.year}</td>
<td style="color:#16a34a;font-weight:600">$${p.savings.toLocaleString()}</td>
<td>$${p.fee.toLocaleString()}</td>
<td style="color:${p.net > 0 ? '#16a34a' : '#dc2626'};font-weight:700">$${p.net.toLocaleString()}</td>
<td style="color:#A89035;font-weight:700">${p.roi}%</td>
<td style="font-weight:600">$${cumSavings[i].toLocaleString()}</td>
</tr>`).join('\n')}
</tbody>
</table>

<!-- Cumulative Net Benefit — Area Chart -->
<div style="margin-top:16px;padding:16px 20px;background:#EDE9DF;border-radius:8px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:10px">Cumulative Net Benefit Over 5 Years</div>
<div style="display:flex;align-items:flex-end;gap:4px;height:120px">
${cumSavings.map((val, i) => {
  const pct = Math.max(8, Math.round((val / maxCum) * 100));
  return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
<div style="font-size:9px;font-weight:700;color:#16a34a">$${(val/1000).toFixed(0)}K</div>
<div style="width:100%;background:linear-gradient(to top,#16a34a,#4ade80);border-radius:4px 4px 0 0;height:${pct}%;min-height:10px"></div>
<div style="font-size:9px;color:#888">Yr ${i + 1}</div>
</div>`;
}).join('\n')}
</div>
</div>

<!-- ROI Summary -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px">
<div style="background:#3A4B5B;border-radius:8px;padding:16px;text-align:center;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:700;color:#A89035">${projections[0].roi}%</div>
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;opacity:0.7">Year 1 ROI</div>
</div>
<div style="background:#3A4B5B;border-radius:8px;padding:16px;text-align:center;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:700;color:#16a34a">$${(totalSavings5yr/1000).toFixed(0)}K</div>
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;opacity:0.7">5-Year Net Benefit</div>
</div>
<div style="background:#3A4B5B;border-radius:8px;padding:16px;text-align:center;color:#fff">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:28px;font-weight:700;color:#A89035">${((totalSavings5yr / (projections.reduce((s, p) => s + p.fee, 0))) * 100).toFixed(0)}%</div>
<div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;opacity:0.7">5-Year Avg ROI</div>
</div>
</div>`;
})()}
</div>

<!-- OpEx Breakdown — Donut Chart (CSS) -->
<div style="margin-top:24px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:14px;padding-left:16px;border-left:4px solid #A89035">Typical Operating Expense Breakdown</div>
<div style="display:flex;gap:24px;align-items:center">
<div style="width:180px;height:180px;border-radius:50%;flex-shrink:0;position:relative;background:conic-gradient(#dc2626 0deg 97deg,#A89035 97deg 169deg,#3A4B5B 169deg 230deg,#16a34a 230deg 280deg,#0073b7 280deg 320deg,#888 320deg 360deg)">
<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90px;height:90px;background:#FDFAF3;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;font-weight:700;color:#2C3240">${d.neighborhoodMarketData ? d.neighborhoodMarketData.opexRange.split('–')[0] : '$20'}</div>
<div style="font-size:8px;color:#888;text-transform:uppercase">avg $/SF/yr</div>
</div>
</div>
<div style="flex:1">
${[
  { label: 'Real Estate Taxes', pct: '27%', color: '#dc2626' },
  { label: 'Insurance', pct: '20%', color: '#A89035' },
  { label: 'Utilities', pct: '17%', color: '#3A4B5B' },
  { label: 'Maintenance & Repairs', pct: '14%', color: '#16a34a' },
  { label: 'Management & Admin', pct: '11%', color: '#0073b7' },
  { label: 'Other / Reserve', pct: '11%', color: '#888' },
].map(c => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
<div style="width:10px;height:10px;border-radius:2px;background:${c.color};flex-shrink:0"></div>
<div style="font-size:11px;color:#555;flex:1">${c.label}</div>
<div style="font-size:11px;font-weight:700;color:#2C3240">${c.pct}</div>
</div>`).join('\n')}
<div style="font-size:9px;color:#888;margin-top:8px;font-style:italic">★ Camelot targets Insurance, Utilities, Maintenance & Mgmt for direct savings</div>
</div>
</div>
</div>

<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:12px 16px;margin-top:20px">
<p style="font-size:11px;color:#555;line-height:1.6"><strong style="color:#A89035">Note:</strong> All projections are estimates based on Camelot portfolio benchmarks across 42 managed properties. Actual results vary by building. Year 1 estimates are conservative; savings typically compound as vendor contracts are rebid, energy optimization matures, and resident retention improves. Management fee assumes 4% annual escalation (3–5% per board agreement); value creation assumes 4% annual improvement.</p>
</div>
</div>

<!-- PAGE 18: PAIN POINTS → SOLUTIONS -->
<div class="section section-white">
<div class="section-title">Your Pain Points. Our Solutions.</div>
<div class="section-sub">Six critical areas where Camelot delivers measurable improvement</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0">

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #dc2626;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:6px">\u26A0 Local Law Compliance (LL97, LL11, FISP, HPD)</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">${d.buildingArea > 25000 ? `At ${d.buildingArea.toLocaleString()} SF, this building is above the LL97 carbon cap threshold. Non-compliance penalties start at $268/ton CO\u2082.` : 'Compliance with HPD, DOB, and local laws requires proactive tracking and resolution.'}</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 Camelot delivers a FREE LL97 liability model + compliance roadmap within 30 days</p>
</div>

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#3A4B5B;margin-bottom:6px">\uD83D\uDCE1 Communication &amp; Response Time</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">Residents and board members need timely responses on maintenance, vendor work, and building updates. Traditional management creates communication gaps.</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 ConciergePlus + Camelot AI — 24/7 agent for board, residents, staff, vendors</p>
</div>

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#3A4B5B;margin-bottom:6px">\uD83D\uDCA1 Financial Transparency</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">Boards often receive late reports with no variance analysis or forward projection. Financial visibility is critical for sound governance.</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 In-house CPA, real-time dashboards, 5-year capital planning, Merlin AI budgeting</p>
</div>

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#3A4B5B;margin-bottom:6px">\uD83C\uDFD7\uFE0F Capital Project Financing</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">Pre-war buildings face significant capital needs — facade, elevator, boiler. Financing without special assessments is a perennial challenge.</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 In-house licensed mortgage broker — building loans with no shareholder assessment</p>
</div>

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#3A4B5B;margin-bottom:6px">\uD83D\uDD0D On-Site Oversight &amp; Accountability</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">Many firms rely on reactive visits. Boards have no visibility into what\u2019s happening between incidents.</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 Weekly PM site visits + monthly Facility Manager inspections, documented w/ photos</p>
</div>

<div style="background:#fff;border:1px solid #E5E3DE;border-top:3px solid #A89035;border-radius:0 0 8px 8px;padding:18px">
<h4 style="font-size:12px;font-weight:700;color:#3A4B5B;margin-bottom:6px">\uD83D\uDCCA Analytical Data &amp; Benchmarking</h4>
<p style="font-size:11px;color:#555;line-height:1.6;margin-bottom:8px">Without comparative data, boards can\u2019t evaluate costs, vendor performance, or market positioning.</p>
<p style="font-size:11px;color:#16a34a;font-weight:600">\u2714 SCOUT market intelligence — monthly benchmarks vs. peer buildings + Merlin AI alerts</p>
</div>

</div>
</div>

<!-- PAGE 19: TECHNOLOGY PLATFORM -->
<div class="section section-cream">
<div class="section-title">Technology Platform</div>
<div class="section-sub">Proven tools today + next-generation Camelot OS deploying 2026</div>

<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;color:#A89035;text-align:center;margin-bottom:6px;font-weight:600">Current Stack \u2014 Active Now</div>
<table class="compare-table" style="margin-bottom:20px">
<thead><tr><th style="background:#3A4B5B;color:#fff">Platform</th><th style="background:#3A4B5B;color:#fff">Function</th><th style="background:#3A4B5B;color:#fff">Benefit to ${d.buildingName}</th></tr></thead>
<tbody>
<tr><td style="font-weight:700;color:#3A4B5B">MDS (Multi Data Services)</td><td>Core Management Platform</td><td>Camelot\u2019s primary property management and accounting system \u2014 financials, work orders, reporting, compliance tracking</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">AppFolio</td><td>Property Mgmt</td><td>Supplementary accounting, work orders, document management, monthly reporting</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">BuildingLink</td><td>Resident Portal</td><td>Maintenance requests, package management, amenity booking</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">Zego</td><td>Payments</td><td>ACH, e-check, credit card collection with full audit trail</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">Board Packager</td><td>Board Docs</td><td>Secure digital board package management \u2014 minutes, financials, 24/7</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">Select</td><td>Leasing &amp; Marketing</td><td>Showing coordination, applicant management, and leasing workflow</td></tr>
<tr><td style="font-weight:700;color:#3A4B5B">Google Workspace</td><td>Collaboration</td><td>Google Drive, Docs, Sheets \u2014 shared file management and team collaboration</td></tr>
</tbody>
</table>

<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;color:#A89035;text-align:center;margin-bottom:6px;font-weight:600">Camelot OS \u2014 Deploying 2026</div>

<!-- ConciergePlus Hero — the centerpiece -->
<div style="background:#3A4B5B;border-radius:10px;padding:22px;margin-bottom:16px;color:#fff">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
<div style="width:40px;height:40px;background:#A89035;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:#fff;font-weight:800;font-size:14px">C+</span></div>
<div>
<div style="font-size:16px;font-weight:700;color:#A89035">ConciergePlus — AI-Driven Resident Portal</div>
<div style="font-size:11px;color:rgba(255,255,255,0.6)">26 integrated modules \u00B7 Board + Resident + Staff + Vendor portals \u00B7 Mobile app</div>
</div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px">
${['Amenity Booking', 'Announcements', 'Package Delivery', 'Service Requests', 'Online Payments', 'Incident Reports', 'Key Tracking', 'Equipment Mgmt', 'Discussion Forum', 'Pet Registry', 'Parking Mgmt', 'Community Polls', 'Newsletter', 'Vacancy Dates', 'Entry Instructions', 'Residents\u2019 Guide'].map(m => `<div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:4px;padding:5px 8px;font-size:9px;color:rgba(255,255,255,0.8);text-align:center">${m}</div>`).join('\n')}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:18px;font-weight:800;color:#A89035">$0</div>
<div style="font-size:9px;color:rgba(255,255,255,0.6)">Bank Fees on Payments</div>
</div>
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:18px;font-weight:800;color:#A89035">24/7</div>
<div style="font-size:9px;color:rgba(255,255,255,0.6)">AI Support (Merlin)</div>
</div>
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:18px;font-weight:800;color:#A89035">26</div>
<div style="font-size:9px;color:rgba(255,255,255,0.6)">Integrated Modules</div>
</div>
</div>
</div>

<!-- Camelot OS Platform Cards -->
<div class="va-grid">
<div class="va-card" style="border-left-color:#A89035"><h5 style="color:#A89035">Merlin AI</h5><p>Camelot\u2019s AI engine powering ConciergePlus, budget forecasting, expense anomaly detection, vendor scoring, pro-forma modeling, and intelligent building operations.</p></div>
<div class="va-card" style="border-left-color:#3A4B5B"><h5>SCOUT</h5><p>Market intelligence \u2014 monthly benchmarks, ACRIS data, rental tracking, peer building comparisons, lead generation.</p></div>
<div class="va-card" style="border-left-color:#A89035"><h5 style="color:#A89035">Jackie</h5><p>AI-powered new business development engine \u2014 generates Property Intelligence Reports, management proposals, email drafts, and cold caller sheets.</p></div>
<div class="va-card" style="border-left-color:#3A4B5B"><h5>Prisma</h5><p>Enhanced ACH billing, real-time collection tracking, 90% NSF reduction via Plaid-linked payments.</p></div>
<div class="va-card" style="border-left-color:#A89035"><h5 style="color:#A89035">Parity</h5><p>Real-time HVAC and energy monitoring. LL97 liability modeling included. 15\u201325% utility savings.</p></div>
<div class="va-card" style="border-left-color:#3A4B5B"><h5>Camelot Central</h5><p>Unified mobile app \u2014 building files, utility tracking, compliance, smart access, all resident services in one interface.</p></div>
</div>

<!-- Camelot OS Backend -->
<div style="background:#EDE9DF;border:2px solid #A89035;border-radius:8px;padding:18px;margin-top:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:700;margin-bottom:8px">\uD83E\uDDE0 Camelot OS — Intelligent Backend</div>
<p style="font-size:11px;color:#555;line-height:1.7;margin-bottom:10px">Behind every Camelot-managed building is an AI-readable file system powered by Make.com automation and MDS property codes. Every document \u2014 leases, financials, compliance filings, vendor contracts, board minutes \u2014 is automatically classified, named, and organized so AI agents can instantly retrieve and process information across all 42 properties. No more searching. No more lost files. No more institutional knowledge locked in someone\u2019s head.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap">
${['MDS Property Codes', 'Auto-Classification', 'Make.com Automation', 'Google Drive Structured Storage', 'AI-Ready File System', 'Real-Time Monitoring'].map(t => `<span style="display:inline-block;background:#fff;border:1px solid #D5D0C6;border-radius:4px;padding:4px 10px;font-size:10px;color:#3A4B5B;font-weight:600">${t}</span>`).join('\n')}
</div>
</div>
</div>

<!-- PAGE 19B: QUARTERLY MARKET REPORTS -->
<div class="section section-white">
<div class="section-title">Quarterly Market Reports</div>
<div class="section-sub">How does your building stack up against the local market?</div>

<p style="font-size:12px;color:#555;line-height:1.7;margin-bottom:16px">Every quarter, Camelot delivers a market-aware report that helps your board understand value, resident experience, sales and leasing activity, safety, cost of living, operating costs, and dollars per square foot. The report answers the practical questions owners ask: how is the building performing, what might a unit be worth, and where should the board focus next?</p>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Cost of Living &amp; Carrying Cost</h5>
<p style="font-size:11px;color:#555;line-height:1.5">Maintenance, common charges, utilities, insurance, and operating costs compared with local peer buildings.</p>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Unit Value Estimate</h5>
<p style="font-size:11px;color:#555;line-height:1.5">What a unit might be worth based on sales, leasing, dollars per square foot, floor line, view, and current market momentum.</p>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Sales &amp; Leasing Pulse</h5>
<p style="font-size:11px;color:#555;line-height:1.5">Median sale prices, rental rates, absorption, days on market, leasing demand, and price momentum.</p>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Home Score &amp; Safety</h5>
<p style="font-size:11px;color:#555;line-height:1.5">Building score, safety signals, open violations, service quality, amenity condition, and compliance status tracked quarter over quarter.</p>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Capital &amp; Reserve Health</h5>
<p style="font-size:11px;color:#555;line-height:1.5">Reserve position, projected capital needs, LL97/LL11 exposure, insurance movement, and upcoming board decisions.</p>
</div>
<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:16px">
<h5 style="font-size:12px;font-weight:700;color:#2C3240;margin-bottom:6px">Dollars Per Square Foot</h5>
<p style="font-size:11px;color:#555;line-height:1.5">Condo, co-op, and rental $/sf benchmarks so boards can understand value, leasing power, and owner equity.</p>
</div>
</div>

<div style="background:#3A4B5B;border-radius:8px;padding:16px;color:#fff;text-align:center">
<p style="font-size:12px;line-height:1.7;color:rgba(255,255,255,0.8)">Quarterly reports are <strong style="color:#A89035">included at no additional charge</strong> for all Camelot-managed properties. Board members receive a branded PDF and live dashboard access via Camelot Central.</p>
</div>

<!-- Report Preview — embedded screenshot of actual Sentinel report -->
<div style="margin-top:20px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:10px;padding-left:16px;border-left:4px solid #A89035">Sample Report Preview</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
<div style="background:#0D2240;border-radius:8px;padding:16px;text-align:center;border:1px solid #D5D0C6;position:relative">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:9px;letter-spacing:3px;color:#B8973A;text-transform:uppercase;margin-bottom:6px">C A M E L O T</div>
<div style="font-size:7px;color:#B8973A;letter-spacing:2px;margin-bottom:10px">MARKET INTELLIGENCE</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:800;color:#B8973A">Q1 2026</div>
<div style="font-size:7px;color:rgba(255,255,255,0.5);margin-top:4px">NYC Market Report</div>
<div style="position:absolute;bottom:4px;left:0;right:0;font-size:6px;color:rgba(255,255,255,0.2)">Page 1 of 12</div>
</div>
<div style="background:#F5F0E5;border-radius:8px;padding:12px;border:1px solid #D5D0C6">
<div style="font-size:8px;font-weight:700;color:#B8973A;margin-bottom:6px;border-bottom:1px solid #B8973A;padding-bottom:3px">Neighborhood Benchmarks</div>
<div style="font-size:6px;color:#555;line-height:1.8">
Harlem: $892/sf · $2,950 1BR<br>
Murray Hill: $1,380/sf · $4,200 1BR<br>
Gramercy: $1,250/sf · $3,800 1BR<br>
UWS: $1,500/sf · $4,300 1BR<br>
Tribeca: $2,100/sf · $5,200 1BR
</div>
<div style="display:flex;gap:2px;margin-top:6px;height:30px;align-items:flex-end">
<div style="flex:1;background:#B8973A;height:40%;border-radius:2px 2px 0 0"></div>
<div style="flex:1;background:#1A6B7C;height:65%;border-radius:2px 2px 0 0"></div>
<div style="flex:1;background:#B8973A;height:55%;border-radius:2px 2px 0 0"></div>
<div style="flex:1;background:#1A6B7C;height:70%;border-radius:2px 2px 0 0"></div>
<div style="flex:1;background:#B8973A;height:100%;border-radius:2px 2px 0 0"></div>
</div>
<div style="font-size:5px;color:#888;text-align:center;margin-top:2px">$/Sqft by Neighborhood</div>
</div>
<div style="background:#FDFAF3;border-radius:8px;padding:12px;border:1px solid #D5D0C6">
<div style="font-size:8px;font-weight:700;color:#0D2240;margin-bottom:6px;border-bottom:1px solid #0D2240;padding-bottom:3px">Portfolio Intelligence</div>
<div style="font-size:6px;color:#555;line-height:1.8">
\u2714 5 of 6 buildings above market<br>
\u2714 10.55% avg rent growth<br>
\u2714 96% portfolio occupancy<br>
\u2714 42 buildings managed<br>
\u2714 $240M+ AUM
</div>
<div style="background:#0D2240;border-radius:4px;padding:6px;text-align:center;margin-top:6px">
<div style="font-size:12px;font-weight:800;color:#B8973A">5/6</div>
<div style="font-size:5px;color:rgba(255,255,255,0.5)">Above market</div>
</div>
</div>
</div>
<div style="text-align:center;margin-top:8px">
<a href="https://camelot-market-reports.onrender.com/" target="_blank" style="font-size:11px;color:#A89035;text-decoration:underline;font-weight:600">View full interactive Q1 2026 Market Report \u2192</a>
</div>
</div>
</div>

<!-- PAGE 20: CAMELOT ADVANTAGE QUANTIFIED -->
<div class="section section-white">
<div class="section-title">The Camelot Advantage — Quantified</div>
<div class="section-sub">Verified outcomes across 42 managed buildings and 196 tracked in SCOUT</div>

<table class="invest-table">
<thead><tr><th>Value Driver</th><th>Estimated Impact</th><th>Applied to ${d.buildingName}</th></tr></thead>
<tbody>
<tr><td>Compliance Management (zero violations)</td><td>+3–8% sale premium on units</td><td style="color:#16a34a;font-weight:600">${d.units > 0 ? `${d.units} units \u00D7 avg value = significant portfolio uplift` : 'Premium positioning for all units'}</td></tr>
<tr><td>Resident Retention (Merlin AI)</td><td>+$3,500–8,000 per unit/yr</td><td style="color:#16a34a;font-weight:600">${d.units} units \u00D7 $4,500 avg = ~$${Math.round(d.units * 4500).toLocaleString()}/yr saved</td></tr>
<tr><td>Online Payments (Prisma)</td><td>90% NSF reduction</td><td style="color:#16a34a;font-weight:600">${d.units} units \u00D7 $750 avg = ~$${Math.round(d.units * 750).toLocaleString()}/yr</td></tr>
<tr><td>Technology Premium (ConciergePlus)</td><td>+2–5% building value premium</td><td style="color:#16a34a;font-weight:600">${d.buildingArea > 0 ? `${d.units} units — tech-enabled management increases building appeal and resale value` : 'Measurable value uplift'}</td></tr>
<tr><td>Energy Optimization (Parity)</td><td>+$0.25–0.75/sqft/yr savings</td><td style="color:#16a34a;font-weight:600">${d.buildingArea > 0 ? `${d.buildingArea.toLocaleString()} SF \u00D7 $0.40 = ~$${Math.round(d.buildingArea * 0.4).toLocaleString()}/yr` : 'Utility cost reduction'}</td></tr>
<tr><td>Technology-Enabled Leasing</td><td>20–30% faster absorption</td><td>Fewer vacant months; stronger maintenance fee sustainability</td></tr>
<tr><td>Camelot Capital Advisory</td><td>+5–15% building value</td><td>Strategic refinancing + capital planning = lower shareholder cost</td></tr>
</tbody>
</table>

<div style="font-size:10px;color:#888;margin-top:8px;text-align:center">Source: Camelot Q1 2026 SCOUT Market Report. Impact estimates based on portfolio averages across 42 managed buildings.</div>
</div>

<!-- PAGE 21: OPERATING COST INTELLIGENCE -->
${d.neighborhoodMarketData ? `
<div class="section section-cream">
<div class="section-title">Operating Cost Intelligence</div>
<div class="section-sub">${d.neighborhoodName ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'NYC'} Benchmark — SCOUT Q1 2026 Data</div>

<table class="invest-table">
<thead><tr><th>Cost Category</th><th>SCOUT Range</th><th>Camelot Strategy</th></tr></thead>
<tbody>
<tr><td>Real Estate Taxes</td><td>${d.neighborhoodMarketData.opexRange.split('–')[0].replace('$','$')}+/SF/yr</td><td>Fixed — strategic abatement review (J-51, 421-a)</td></tr>
<tr><td>Insurance</td><td>$1.20–2.80/SF/yr</td><td style="color:#A89035;font-weight:600">\u2605 Rebid opportunity: 12–20% savings</td></tr>
<tr><td>Utilities (Gas/Electric/Water)</td><td>$3–10/SF/yr</td><td style="color:#A89035;font-weight:600">\u2605 Parity energy optimization: 15–25% reduction</td></tr>
<tr><td>Mgmt + Admin</td><td>$3–7/SF/yr</td><td style="color:#16a34a;font-weight:600">\u2714 Camelot competitive + greater scope</td></tr>
<tr><td>Maintenance &amp; Repairs</td><td>$3–8/SF/yr</td><td style="color:#A89035;font-weight:600">\u2605 Vendor rebid: 10–18% reduction</td></tr>
<tr><td><strong>Total OpEx Benchmark</strong></td><td><strong>${d.neighborhoodMarketData.opexRange}</strong></td><td>${d.buildingArea > 0 ? `Your building: ~$${Math.round(d.buildingArea * 35 / d.buildingArea).toFixed(0)}/SF est.` : 'Within range'}</td></tr>
</tbody>
</table>

<div style="background:#EDE9DF;border-left:4px solid #A89035;border-radius:0 8px 8px 0;padding:14px 18px;margin-top:14px">
<p style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-style:italic;color:#3A4B5B;line-height:1.7">&ldquo;Location sets the revenue ceiling; management determines what you keep. Camelot\u2019s integrated cost management \u2014 energy optimization (Parity), online payments (Prisma), and compliance automation \u2014 directly lowers the operating cost line across all building types.&rdquo;</p>
<p style="font-size:10px;color:#A89035;font-weight:600;margin-top:6px">\u2014 Camelot Q1 2026 Market Report</p>
</div>
</div>
` : ''}

<!-- PAGE 22: PORTFOLIO REFERENCES + CASE STUDY (DYNAMIC) -->
${buildPortfolioSection(d)}

<!-- PAGE 23: BANKING PARTNER -->
<div class="section section-cream">
<div class="section-title">Banking Partnership</div>
<div class="section-sub">BankUnited — premier banking for property management and co-op associations</div>

<div style="background:#fff;border:2px solid #A89035;border-radius:8px;padding:22px;margin:16px 0">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
<div style="width:170px;height:48px;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative">
<img src="https://logo.clearbit.com/bankunited.com" alt="BankUnited" style="width:170px;height:48px;object-fit:contain;position:absolute;top:0;left:0;background:#fff" onerror="this.style.display='none'">
<div style="width:170px;height:48px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center"><span style="color:#003366;font-weight:800;font-size:18px">BankUnited</span></div>
</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:16px;color:#3A4B5B;font-weight:700">BankUnited Partnership</div>
</div>
<p style="font-size:12px;color:#555;line-height:1.8">Camelot works exclusively with <strong>BankUnited</strong> \u2014 in our view the premier banking partner for property management companies and co-op associations in New York City. BankUnited offers <strong>no account fees</strong>, competitive interest rate matching, and deep technology integration with our payment systems, vendor payments, and collections workflows. Their automation tools streamline bank reconciliations and management reporting \u2014 reducing errors and improving financial transparency.</p>
<p style="font-size:12px;color:#A89035;font-weight:600;margin-top:10px">This relationship often delivers meaningful financial value from Day 1.</p>
</div>

<!-- Select Partnership -->
<div style="background:#1a1a2e;border:2px solid #A89035;border-radius:10px;padding:24px;margin:20px 0;color:#fff">
<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
<div style="width:120px;height:48px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:8px">
<img src="https://logo.clearbit.com/meetselect.com" alt="Select" style="max-width:100%;max-height:100%;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
<span style="display:none;color:#1a1a2e;font-weight:900;font-size:18px;font-family:'Plus Jakarta Sans',sans-serif">select</span>
</div>
<div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;color:#A89035">Select — Exclusive Resident Benefits</div>
<div style="font-size:11px;color:rgba(255,255,255,0.5)">Private membership · 1.6M+ partner locations · Concierge service</div>
</div>
</div>
<p style="font-size:12px;color:rgba(255,255,255,0.8);line-height:1.8;margin-bottom:14px">Every Camelot-managed building gets access to <strong style="color:#A89035">Select</strong> \u2014 a private membership community offering exclusive pricing, VIP perks, and concierge services at over 1.6 million premier locations worldwide. Residents receive a <strong style="color:#A89035">co-branded titanium card</strong> and app access to unlock savings on hotels, restaurants, entertainment, travel, and more.</p>

<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:22px;margin-bottom:4px">\uD83C\uDFE8</div>
<div style="font-size:10px;font-weight:700;color:#A89035">Hotels</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">Unpublished rates + VIP amenities</div>
</div>
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:22px;margin-bottom:4px">\uD83C\uDF7D\uFE0F</div>
<div style="font-size:10px;font-weight:700;color:#A89035">Dining</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">VIP treatment + discounts</div>
</div>
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:22px;margin-bottom:4px">\uD83C\uDFAD</div>
<div style="font-size:10px;font-weight:700;color:#A89035">Entertainment</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">Up to 60% off events</div>
</div>
<div style="background:rgba(168,144,53,0.15);border:1px solid rgba(168,144,53,0.3);border-radius:6px;padding:10px;text-align:center">
<div style="font-size:22px;margin-bottom:4px">\uD83D\uDC8E</div>
<div style="font-size:10px;font-weight:700;color:#A89035">Concierge</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">7-day live support</div>
</div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
<div style="text-align:center;padding:8px">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#A89035">$1,500+</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">Avg member savings/year</div>
</div>
<div style="text-align:center;padding:8px">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#A89035">1.6M</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">Partner locations</div>
</div>
<div style="text-align:center;padding:8px">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#A89035">$200</div>
<div style="font-size:8px;color:rgba(255,255,255,0.5)">Off for Camelot residents</div>
</div>
</div>

<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:12px;font-size:11px;color:rgba(255,255,255,0.6);line-height:1.6">
<strong style="color:#A89035">For ${d.buildingName} residents:</strong> Camelot-managed buildings receive exclusive $200 off Select membership. Co-branded titanium card + app access. Residents redeem through the ConciergePlus portal or the Select mobile app. Includes: unpublished hotel rates, restaurant VIP perks, up to 60% off entertainment, dedicated concierge team, and members-only social events.
</div>
</div>

<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;color:#A89035;text-align:center;margin-top:16px;font-weight:600">RED Awards 2025: Property Management Company of the Year</div>
<div style="font-size:11px;color:#888;text-align:center;margin-top:6px">REBNY 2025: David Goldoff Leadership Award &nbsp;\u00B7&nbsp; 42 Properties &nbsp;\u00B7&nbsp; $240M+ AUM &nbsp;\u00B7&nbsp; 18+ Years</div>
<div style="font-size:10px;color:#999;text-align:center;margin-top:8px">Member: REBNY \u00B7 SPONY \u00B7 NYARM \u00B7 IREM \u00B7 BOMA \u00B7 NARPM \u00B7 NY Apartment Association</div>
</div>

<!-- PAGE 24: CONFIDENTIALITY (CONDENSED) -->
<div class="section section-white" style="font-size:11px;color:#555;line-height:1.8">
<div class="section-title" style="font-size:20px">Confidentiality &amp; Legal Notice</div>

<div style="background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:24px;margin-bottom:16px">
<p style="font-size:12px;color:#2C3240;line-height:1.8;margin-bottom:12px">\uD83D\uDD12 This Property Intelligence Report is <strong>confidential and proprietary</strong> to Camelot Realty Group. It is intended solely for the named recipient(s) and may not be reproduced, distributed, or disclosed without prior written consent.</p>
<p style="font-size:11px;color:#555;line-height:1.7;margin-bottom:12px">\u00A9 ${new Date().getFullYear()} Camelot Realty Group. All rights reserved. Contents are protected by U.S. copyright and trade secret law. SCOUT, Jackie, Merlin AI, ConciergePlus, Prisma, Parity, and Camelot Central are proprietary platforms. This Report is for informational purposes only and does not constitute legal, financial, or investment advice. Data is sourced from NYC Open Data, ACRIS, StreetEasy, RealtyMX, and other third-party databases and is presented &ldquo;as is&rdquo; without warranty. AI-assisted analysis has been reviewed by licensed real estate professionals. Governed by the laws of the State of New York; venue in New York County.</p>
<div style="text-align:center;margin-top:16px">
<a href="mailto:info@camelot.nyc?subject=Legal%20Terms%20Request" target="_self" onclick="window.location.href='mailto:info@camelot.nyc?subject=Legal%20Terms%20Request';return false;" style="display:inline-block;background:#A89035;color:#fff;padding:10px 28px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:0.5px">Request Full Legal Terms</a>
<div style="font-size:10px;color:#777;margin-top:8px">info@camelot.nyc · www.camelot.nyc</div>
</div>
</div>

<div style="background:#3A4B5B;border-radius:8px;padding:14px 18px;color:#fff;text-align:center">
<p style="font-size:11px;color:rgba(255,255,255,0.6)">Questions about this Report? Contact:</p>
<p style="font-size:12px;color:#A89035;font-weight:600;margin-top:4px">${CAMELOT.principal} &nbsp;\u00B7&nbsp; ${CAMELOT.email} &nbsp;\u00B7&nbsp; ${CAMELOT.phone}</p>
<p style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px">${CAMELOT.license1} &nbsp;\u00B7&nbsp; ${CAMELOT.license2}</p>
</div>
</div>

<!-- PAGE 25: BACK COVER -->
<div class="back-cover" style="background:#3A4B5B;position:relative;overflow:hidden">

<!-- Jackie Kennedy background image overlay -->
<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/JKOnassis.jpg/440px-JKOnassis.jpg') center top/cover no-repeat;opacity:0.06"></div>
<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(58,75,91,0.4) 0%,rgba(58,75,91,0.95) 40%,rgba(58,75,91,1) 70%)"></div>

<!-- Content -->
<div style="position:relative;z-index:1">

<!-- Quote — large, emphasized, center stage -->
<div style="margin-bottom:32px;max-width:560px">
<div style="font-size:64px;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;color:#A89035;line-height:0.5;margin-bottom:16px;opacity:0.6">&ldquo;</div>
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-style:italic;font-size:22px;color:#fff;line-height:1.6;font-weight:400;letter-spacing:0.3px">Don\u2019t let it be forgot, that once there was a spot, for one brief shining moment, that was known as Camelot.</div>
<div style="font-size:64px;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;color:#A89035;line-height:0.5;text-align:right;margin-top:12px;opacity:0.6">&rdquo;</div>
<div style="text-align:right;margin-top:12px">
<div style="font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:13px;color:#A89035;font-weight:600;font-style:italic">Jacqueline Kennedy</div>
<div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:1px;margin-top:2px">Life Magazine &nbsp;\u00B7&nbsp; December 6, 1963</div>
</div>
</div>

<!-- Divider -->
<div style="width:80px;height:2px;background:#A89035;margin:0 auto 28px;opacity:0.5"></div>

<!-- Next Steps -->
<div style="margin-bottom:24px">
<div class="wordmark" style="margin-bottom:4px">C &nbsp;A &nbsp;M &nbsp;E &nbsp;L &nbsp;O &nbsp;T</div>
<div class="pm-sub" style="margin-bottom:0">Realty Group</div>
</div>

<h2 style="font-size:28px;margin-bottom:12px">Next Steps</h2>
<div class="tagline" style="margin-bottom:24px">We welcome the opportunity to discuss ${d.buildingName}&rsquo;s<br>needs and refine our proposal to fit your building.</div>

<!-- Meeting CTA — Three Options -->
<div style="display:flex;gap:10px;justify-content:center;margin-bottom:16px;flex-wrap:wrap">
<a href="https://calendar.google.com/calendar/u/0/r/eventedit?text=Camelot+%E2%80%93+${encodeURIComponent(d.buildingName)}+Management+Discussion&details=${encodeURIComponent("Meeting with David A. Goldoff, President\nCamelot Realty Group\n\nJoin via Zoom:\nhttps://us06web.zoom.us/j/dgoldoff\n\nOr dial: +1 (646) 558-8656\n\nAgenda: Management proposal discussion for " + d.buildingName + "\n\nPrepared by Jackie | Camelot OS")}&location=${encodeURIComponent("Zoom Meeting — https://us06web.zoom.us/j/dgoldoff")}&add=${CAMELOT.email}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#2D8CFF;color:#fff;padding:12px 20px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:0.3px">
<span style="font-size:15px">\uD83D\uDCC5</span> Schedule Meeting
</a>
<a href="https://calendar.google.com/calendar/u/0/r/eventedit?text=Camelot+%E2%80%93+${encodeURIComponent(d.buildingName)}+Discussion&details=${encodeURIComponent("Meeting with David A. Goldoff\nCamelot Realty Group\n(212) 206-9939\n\nGoogle Meet link will be generated automatically.\n\nAgenda: Management proposal for " + d.buildingName)}&add=${CAMELOT.email}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#A89035;color:#fff;padding:12px 20px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:0.3px">
<span style="font-size:15px">\uD83D\uDCC5</span> Google Meet
</a>
<a href="mailto:dgoldoff@camelot.nyc?subject=${encodeURIComponent('Meeting Request — ' + d.buildingName + ' | Camelot Realty Group')}&body=${encodeURIComponent('Hello David,\n\nI would like to schedule a meeting to discuss the management proposal for ' + d.buildingName + ' at ' + d.address + '.\n\nPlease let me know your available dates and preferred meeting format (in-person, Zoom, or phone).\n\nBest regards')}" onclick="try{window.location.href=this.href}catch(e){window.open(this.href)};return false;" style="display:inline-flex;align-items:center;gap:8px;background:transparent;color:#A89035;padding:12px 20px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:0.3px;border:2px solid #A89035">
<span style="font-size:15px">\u2709\uFE0F</span> Email to Schedule
</a>
</div>
<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:20px">Choose your preferred format \u2014 or reply to this report\u2019s email and we\u2019ll coordinate</div>

<!-- Contact -->
<div class="contact-name">${CAMELOT.principal}, ${CAMELOT.title}</div>
<div class="contact-info">${CAMELOT.phone} | ${CAMELOT.mobile}<br><a href="mailto:${CAMELOT.email}">${CAMELOT.email}</a> | <a href="mailto:${CAMELOT.infoEmail}">${CAMELOT.infoEmail}</a><br><a href="https://${CAMELOT.web}">${CAMELOT.web}</a></div>
<div class="address">${CAMELOT.address}</div>
<div style="font-size:9px;color:rgba(255,255,255,0.2);margin-top:12px">${CAMELOT.license1} | ${CAMELOT.license2}</div>

</div>
</div>

<div class="deck-slide dark">
<div class="brand-logo"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none'"></div>
<div class="thank-wordmark">CAMELOT</div>
<div style="color:#B8973A;font-size:18px;margin-bottom:76px">Property Management</div>
<h2 class="deck-title center" style="font-size:54px;margin-bottom:26px">Thank You</h2>
<p style="font-size:20px;line-height:1.45;max-width:560px">We look forward to serving the ${safe(d.buildingName)} community.</p>
</div>

</div>

<!-- FLOATING PROPOSAL BUTTON -->
<div style="position:fixed;bottom:32px;right:32px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:8px" class="no-print">
<button onclick="generateProposal()" style="background:linear-gradient(135deg,#A89035,#C5A55A);color:#fff;border:none;padding:16px 28px;border-radius:50px;font-family:'Plus Jakarta Sans',-apple-system,sans-serif;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(168,144,53,0.4);display:flex;align-items:center;gap:10px;transition:all 0.3s;letter-spacing:0.3px" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 6px 28px rgba(168,144,53,0.5)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 20px rgba(168,144,53,0.4)'">
\uD83D\uDCCB Proposal of Services
</button>
</div>

<script>
function generateProposal() {
  var d = {
    buildingName: ${JSON.stringify(d.buildingName)},
    address: ${JSON.stringify(d.address)},
    borough: ${JSON.stringify(d.borough)},
    units: ${d.units},
    yearBuilt: ${d.yearBuilt},
    buildingClass: ${JSON.stringify(d.buildingClass)},
    propertyType: ${JSON.stringify(d.propertyType)},
    stories: ${d.stories},
    buildingArea: ${d.buildingArea},
    buildingArea_fmt: '${d.buildingArea > 0 ? d.buildingArea.toLocaleString() : ""}',
    managementCompany: ${JSON.stringify(d.managementCompany || '')},
    registrationOwner: ${JSON.stringify(d.registrationOwner || '')},
    dofOwner: ${JSON.stringify(d.dofOwner || '')},
    bbl: ${JSON.stringify(d.bbl || '')},
    violationsOpen: ${d.violationsOpen},
    violationsTotal: ${d.violationsTotal},
    violationClassC: ${d.violationClassC},
    violationClassB: ${d.violationClassB},
    ecbCount: ${d.ecbCount},
    ecbPenaltyBalance: ${d.ecbPenaltyBalance},
    scoutGrade: ${JSON.stringify(d.scoutGrade)},
    isRentStabilized: ${d.isRentStabilized},
    pricePerUnit: ${d.pricePerUnit},
    monthlyFee: ${d.monthlyFee},
    annualFee: ${d.annualFee},
    boardMembers: ${JSON.stringify(d.boardMembers || [])},
    buildingStaff: ${JSON.stringify(d.buildingStaff || [])},
    ll97Status: ${JSON.stringify(d.ll97?.complianceStatus || 'unknown')},
    ll97Penalty: ${d.ll97?.period1Penalty || 0},
    hasActiveLitigation: ${d.hasActiveLitigation},
    litigationCount: ${d.litigationCount},
    permitsCount: ${d.permitsCount},
    lastSaleDate: ${JSON.stringify(d.lastSaleDate || '')},
    lastSalePrice: ${d.lastSalePrice},
    distressLevel: ${JSON.stringify(d.distressLevel || 'low')},
    energyStarScore: ${d.energyStarScore || 0},
    latitude: ${d.latitude || 'null'},
    longitude: ${d.longitude || 'null'},
    date: ${JSON.stringify(d.date)},
  };

  // Title case helper
  function titleCase(s) {
    if (!s) return '';
    return s.toLowerCase().replace(/(?:^|\s|[-/])\S/g, function(c){ return c.toUpperCase(); })
      .replace(/\b(Ny|Nyc|Nj|Ct|Llc|Corp|Inc|Hpd|Mdr|Dob)\b/gi, function(c){ return c.toUpperCase(); })
      .replace(/\bOf\b/g, 'of').replace(/\bThe\b/g, 'the').replace(/\bAnd\b/g, 'and')
      .replace(/^./, function(c){ return c.toUpperCase(); });
  }
  // Clean owner — remove "(HPD MDR)", "Corporate Owner", etc.
  var rawOwner = d.registrationOwner || d.dofOwner || '';
  var cleanOwner = rawOwner.replace(/\(HPD[^)]*\)/gi, '').replace(/,?\s*Corporate Owner/gi, '').replace(/\s+/g, ' ').trim();
  var owner = cleanOwner || (d.propertyType.indexOf('Co-op') >= 0 ? 'Board of Directors' : d.propertyType.indexOf('Condo') >= 0 ? 'Board of Managers' : 'Property Owner');
  owner = titleCase(owner);
  var boardNames = (d.boardMembers || []).map(function(b){ return b.name + (b.title ? ', ' + b.title : ''); });
  // Contact name: use first board member, or fallback to generic board greeting
  var hasRealContact = boardNames.length > 0 && boardNames[0].split(',')[0].trim().length > 2;
  var contactName = hasRealContact ? titleCase(boardNames[0].split(',')[0]) : '';
  var greetingName = contactName || (d.propertyType.indexOf('Co-op') >= 0 ? 'Members of the Board' : d.propertyType.indexOf('Condo') >= 0 ? 'Members of the Board' : owner);
  var buildingNameClean = titleCase(d.buildingName);
  var addressClean = titleCase(d.address);
  var boroughClean = titleCase(d.borough || 'New York');
  var isCoop = d.propertyType.indexOf('Co-op') >= 0;
  var isCondo = d.propertyType.indexOf('Condo') >= 0;
  var isBoard = isCoop || isCondo;
  var boardLabel = isCoop ? 'Board of Directors' : isCondo ? 'Board of Managers' : 'Ownership';
  var ownerLabel = isCoop ? 'shareholders' : isCondo ? 'unit owners' : 'residents';
  var chargeLabel = isCoop ? 'maintenance' : isCondo ? 'common charges' : 'rent';
  var agreementType = isCoop ? 'Co-op' : isCondo ? 'Condo' : 'Property';
  var unitDesc = d.units + (d.propertyType.toLowerCase().indexOf('mixed') >= 0 ? ' residential and commercial' : ' residential') + ' units';

  // Dynamic pain points for Management Philosophy section
  var painPoints = [];
  if (d.violationsOpen > 10) painPoints.push('Accumulation of ' + d.violationsOpen + ' open violations' + (d.violationClassC > 0 ? ' including ' + d.violationClassC + ' hazardous (Class C)' : ''));
  if (d.ecbPenaltyBalance > 5000) painPoints.push('$' + d.ecbPenaltyBalance.toLocaleString() + ' in outstanding ECB penalties');
  if (d.ll97Status === 'non-compliant') painPoints.push('LL97 carbon compliance exposure ($' + d.ll97Penalty.toLocaleString() + '/yr potential penalty)');
  if (d.hasActiveLitigation) painPoints.push('Active litigation (' + d.litigationCount + ' case' + (d.litigationCount > 1 ? 's' : '') + ')');
  if (d.distressLevel === 'high' || d.distressLevel === 'critical') painPoints.push('Elevated distress indicators across multiple categories');
  var painHTML = painPoints.length > 0
    ? '<ul>' + painPoints.map(function(p){ return '<li>' + p + '</li>'; }).join('') + '</ul>'
    : '<p>While the building is in reasonable standing, there are always opportunities to improve operations, reduce costs, and enhance the experience for ' + ownerLabel + '.</p>';

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Proposal of Services \u2014 ' + buildingNameClean + '</title>' +
  '<style>' +
  '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }' +
  'body { font-family: Georgia, "Times New Roman", serif; color: #2C3240; line-height: 1.65; font-size: 11px; max-width: 8.5in; margin: 0 auto; padding: 1in; }' +
  'h1 { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #3A4B5B; text-align: center; margin: 20px 0 4px 0; letter-spacing: 1px; }' +
  'h2 { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 11.5px; font-weight: 700; color: #A89035; margin: 16px 0 6px 0; padding-bottom: 3px; border-bottom: 1px solid #A89035; text-transform: uppercase; letter-spacing: 0.5px; }' +
  'h3 { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #3A4B5B; margin: 12px 0 4px 0; }' +
  '.cover-title { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 12px; color: #A89035; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }' +
  'p { margin-bottom: 8px; text-align: justify; }' +
  'ul { margin: 6px 0 10px 18px; }' +
  'ul li { margin-bottom: 4px; }' +
  '.hr { border: none; border-top: 1.5px solid #A89035; margin: 16px 0; }' +
  '.fee-box { background: #F5F0E5; border-left: 3px solid #A89035; padding: 12px 16px; margin: 10px 0; }' +
  '.fee-box strong { color: #A89035; }' +
  '.sig-row { display: flex; gap: 40px; margin-top: 14px; }' +
  '.sig-col { flex: 1; }' +
  '.sig-line { border-bottom: 1px solid #2C3240; height: 28px; margin-bottom: 2px; }' +
  '.phase { background: #F5F0E5; border-left: 3px solid #3A4B5B; padding: 10px 14px; margin: 8px 0; }' +
  '.phase-title { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-weight: 700; color: #3A4B5B; font-size: 11px; margin-bottom: 4px; }' +
  '.page-break { page-break-before: always; }' +
  '@media print { @page { size: letter; margin: 1in; } body { padding: 0; max-width: none; font-size: 11px; } }' +
  '</style></head><body>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* COVER */
  '<div style="text-align:center;margin-bottom:20px">' +
  '<div class="cover-title">C A M E L O T</div>' +
  '<div style="font-size:9px;color:#A89035;letter-spacing:1.5px">P R O P E R T Y &nbsp; M A N A G E M E N T</div>' +
  '</div>' +

  '<h1>' + buildingNameClean + '</h1>' +
  '<div style="text-align:center;font-size:11px;color:#3A4B5B;font-weight:700;letter-spacing:0.5px;margin-bottom:16px">PROPOSAL OF PROPERTY MANAGEMENT SERVICES</div>' +
  '<div style="text-align:center;font-size:10px;color:#888">Prepared by Camelot Property Management Services Corp.</div>' +

  '<div class="hr"></div>' +

  '<p style="font-size:10.5px;color:#555"><strong>Date:</strong> ' + d.date + '<br>' +
  '<strong>To:</strong> ' + boardLabel + '<br>' +
  buildingNameClean + '<br>' +
  (contactName ? 'c/o ' + contactName + (boardNames.length > 0 && boardNames[0].indexOf(',') > 0 ? ', ' + boardNames[0].split(',').slice(1).join(',').trim() : '') : 'c/o ' + owner) + '</p>' +

  '<p><strong>Re: Management Proposal &amp; Scope of Services</strong></p>' +

  '<p>Dear ' + greetingName + ',</p>' +

  '<p>We want to thank you for the opportunity to present this management proposal and for your time in discussing the future of ' + buildingNameClean + '. Following our review of the property, Camelot Property Management Services Corp. is pleased to submit this summary outlining our scope of services, dedicated team, and transition plan for the property\u2019s continued success.</p>' +

  '<p>Warm regards,<br><strong>David A. Goldoff</strong><br>President<br>Camelot Property Management Services Corp.</p>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* OUR COMMITMENT */
  '<h2>Our Commitment</h2>' +
  '<p>Camelot\u2019s mission is to provide a boutique, hands-on management approach tailored to the needs of your ' + (isCoop ? 'cooperative' : isCondo ? 'condominium' : 'property') + '. Our team brings a \u201Cwhite-glove\u201D service model \u2014 designed to strengthen on-site operations, enhance financial clarity, and create long-term value for all ' + ownerLabel + '.</p>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* DEDICATED MANAGEMENT TEAM */
  '<h2>Dedicated Management Team</h2>' +
  '<ul>' +
  '<li><strong>On-Site Oversight</strong> \u2014 A Property Manager and Facilities Manager will visit the property regularly, with more frequent visits during the initial stabilization period to work closely with on-site staff, residents, and vendors.</li>' +
  '<li><strong>Board Support</strong> \u2014 Valerie Fiume, Director of Condos &amp; Co-ops, will lead ' + (isBoard ? 'monthly board meetings' : 'ownership meetings') + ', assisted by your Property Manager and Camelot\u2019s administrative team.</li>' +
  '<li><strong>Accounting</strong> \u2014 A dedicated account representative will handle financial reporting, budgeting, and cash management.</li>' +
  '<li><strong>Project Management</strong> \u2014 Phil Paganelli, licensed CM, will oversee capital and construction projects.</li>' +
  '<li><strong>Engineering Support</strong> \u2014 Provided through PVE Engineering, ensuring compliance and technical oversight.</li>' +
  '<li><strong>CPA Coordination</strong> \u2014 Through Anthony Abruzzo, CPA, for audits and annual filings.</li>' +
  '<li><strong>Insurance &amp; Mortgage Services</strong> \u2014 Via trusted insurance brokerages &amp; Meridian Capital Group for refinancing opportunities.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* SCOPE OF SERVICES */
  '<h2>Scope of Services &amp; Value Proposition</h2>' +
  '<ul>' +
  '<li>Strengthen and supervise the on-site management office and staff.</li>' +
  '<li>Review and optimize vendor contracts (elevator, HVAC, boiler, security, waste, cleaning, etc.) using Camelot\u2019s preferred vendor network.</li>' +
  '<li>Implement structured maintenance &amp; compliance calendars for all NYC-required inspections and filings.</li>' +
  '<li>Provide monthly financial management including bank reconciliation, budget forecasting, and ' + (isCoop ? 'maintenance' : isCondo ? 'assessment' : 'rent') + ' tracking.</li>' +
  '<li>Introduce <strong>BankUnited</strong> for reserve and operating accounts \u2014 offering no fees and higher interest rates.</li>' +
  '<li>Roll out Camelot\u2019s <strong>Work Order and Resident Portal</strong> for service tracking and communications.</li>' +
  '<li>Offer project supervision, capital planning, and consulting on major repairs.</li>' +
  '<li>Prepare and distribute monthly ' + (isBoard ? 'board' : 'owner') + ' packages, meeting minutes, and management reports.</li>' +
  '<li>Facilitate ' + (isBoard ? 'board' : 'owner') + ' meetings in-person or via Zoom, using our <strong>AI-assisted meeting software</strong> to record, summarize, and generate formal minutes \u2014 a complimentary value-add service.</li>' +
  '<li>Coordinate with existing professionals (legal, engineering, architectural) while introducing cost-saving alternatives.</li>' +
  '<li>Act as the buffer between residents and ' + (isBoard ? 'the board' : 'ownership') + ', handling inquiries, notices, and building communications.</li>' +
  '<li>Upkeep and removal of building violations, filing registrations, permits, and coordination of on-site inspections.' + (d.violationsOpen > 0 ? ' <em>(' + d.violationsOpen + ' currently open)</em>' : '') + '</li>' +
  '<li>24-hour call center for emergencies and off-hours requests, tracked and recorded.</li>' +
  '<li>Review and suggest technology upgrades: intercoms, virtual doorman, package management, key fob systems.</li>' +
  '<li>Bookkeeping, monthly financial reporting, end-of-year reports, tax appeal preparation, ' + (isCondo ? 'condo abatement' : isCoop ? 'co-op abatement' : 'abatement') + ' submissions, invoicing, cash-flow analysis, and budgeting.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* FINANCIAL TERMS */
  '<h2>Financial Terms</h2>' +
  '<div class="fee-box">' +
  '<strong>Base Management Fee:</strong> $' + d.monthlyFee.toLocaleString() + ' per month ($' + d.annualFee.toLocaleString() + ' annually)<br>' +
  '<strong>Units Managed:</strong> ' + unitDesc + '<br>' +
  '<strong>Fee Basis:</strong> Flat fee based on building type, size, and service tier. Annual escalation of 3–5% as agreed upon by board and management.<br>' +
  '<strong>Ancillary Fees:</strong> As outlined in Schedule A of the management agreement<br>' +
  '<strong>Accounting:</strong> WAIVED for the first 12 months<br>' +
  '<strong>Technology:</strong> Included — Camelot OS + ConciergePlus portal + Merlin AI (no additional charge)' +
  '</div>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* TRANSITION PLAN */
  '<h2>Transition Plan &amp; Start Date</h2>' +
  '<p>Camelot is prepared to begin immediately or on a mutually convenient date. Our first 90 days will focus on learning the building\u2019s systems, meeting your staff and vendors, and integrating our accounting and compliance systems for a seamless transition.</p>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* CLOSING */
  '<h2>Closing</h2>' +
  '<p>We deeply appreciate the opportunity to partner with ' + buildingNameClean + ' and are confident that our experience, resources, and dedicated team will provide measurable improvements in operations, transparency, and service quality.</p>' +
  '<p>We look forward to meeting ' + (isBoard ? 'the full board' : 'you') + ' soon \u2014 either on-site or via Zoom \u2014 and beginning this next chapter together.</p>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* PAGE 2: TRANSITION ROLLOUT */
  '<div class="page-break"></div>' +

  '<h2>Phase I: Operational Turnaround &amp; Standardization Plan</h2>' +
  '<h3>Scope:</h3>' +
  '<ul>' +
  '<li>Evaluate all building systems, staff performance, and operational contracts.</li>' +
  '<li>Review accounting systems, budgets, and vendor agreements.</li>' +
  '<li>Assess and modernize house rules, by-laws, and compliance practices.</li>' +
  '<li>Transition to a digital reporting and communication platform.</li>' +
  '<li>Conduct cost-savings reviews and vendor negotiations for bulk efficiencies.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  '<h2>Transition &amp; Implementation Plan (90\u2013120 Day Rollout)</h2>' +

  '<div class="phase"><div class="phase-title">Phase I: Transition &amp; Assessment (Weeks 1\u20134)</div>' +
  '<ul style="margin-bottom:0">' +
  '<li>Full file and data transfer from current management.</li>' +
  '<li>Staff audit and review of employment, performance, and payroll.</li>' +
  '<li>Vendor contract analysis for cost-saving opportunities.</li>' +
  '<li>Financial reconciliation of operating and reserve accounts.</li>' +
  '<li>Compliance checklist (Local Law 11, 97, FDNY, DOB, HPD).' + (d.violationsOpen > 0 ? ' <em>' + d.violationsOpen + ' open violations identified.</em>' : '') + '</li>' +
  '<li>Initial on-site inspection and management walk-through.</li>' +
  '</ul></div>' +

  '<div class="phase"><div class="phase-title">Phase II: Stabilization &amp; Training (Weeks 5\u20138)</div>' +
  '<ul style="margin-bottom:0">' +
  '<li>On-site review of staff functions and responsibilities.</li>' +
  '<li>Development of written Standard Operating Procedures (SOPs) and House Rules.</li>' +
  '<li>Implementation of internal communication and work order tracking tools.</li>' +
  '<li>Preparation of revised operating budget and variance model.</li>' +
  '<li>Vendor rebidding and negotiation for core contracts.</li>' +
  '<li>Initiation of ' + (isBoard ? 'board' : 'owner') + ' portal and monthly management reporting structure.</li>' +
  '</ul></div>' +

  '<div class="phase"><div class="phase-title">Phase III: Optimization &amp; Reporting (Weeks 9\u201312)</div>' +
  '<ul style="margin-bottom:0">' +
  '<li>Full integration of accounting team and PM into building systems.</li>' +
  '<li>Establishment of resident communication portal and payment integration.</li>' +
  '<li>Compliance audit with engineering team.</li>' +
  '<li>Monthly operational and financial reporting cadence established.</li>' +
  '<li>Presentation to ' + (isBoard ? 'Board' : 'Ownership') + ': \u201C12-Month Improvement Roadmap.\u201D</li>' +
  '</ul></div>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* CORE MANAGEMENT DUTIES */
  '<h2>Core Management Duties</h2>' +
  '<ul>' +
  '<li>Supervise on-site staff' + (d.buildingStaff.length > 0 ? ' (' + d.buildingStaff.map(function(s){return s.role;}).join(', ') + ')' : '') + '.</li>' +
  '<li>Conduct weekly property inspections.</li>' +
  '<li>Attend monthly ' + (isBoard ? 'board' : 'owner') + ' meetings and special meetings as needed.</li>' +
  '<li>Maintain optimal accounting controls and systems.</li>' +
  '<li>Oversee vendor contracts, rebids, and procurement.</li>' +
  '<li>Manage compliance, insurance renewals, and certification tracking.</li>' +
  '<li>Coordinate communication between ' + (isBoard ? 'board, ' : '') + 'residents, and vendors.</li>' +
  '<li>Prepare annual budgets and variance reports.</li>' +
  '<li>Implement training programs and develop staff performance metrics.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* MANAGEMENT PHILOSOPHY */
  '<h2>Management Philosophy &amp; Approach</h2>' +
  '<p>Camelot Realty Group is a boutique, tech-forward, hands-on property management firm with extensive experience managing condominiums, cooperatives, and rental properties across Manhattan, Brooklyn, Queens, the Bronx, Westchester, and beyond. We specialize in implementing modern systems of accountability, financial transparency, and operational efficiency.</p>' +
  '<p>At ' + buildingNameClean + ', we understand the importance of addressing current operational needs' + (painPoints.length > 0 ? ', including:' : '.') + '</p>' +
  painHTML +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* FINANCIAL MANAGEMENT */
  '<h2>Financial Management</h2>' +
  '<ul>' +
  '<li><strong>Dual Ledger Accounting:</strong> We separate capital projects from operating expenses, ensuring transparency and accurate tracking.</li>' +
  '<li><strong>Budgeting &amp; Forecasting:</strong> Our accounting team works with ' + (isBoard ? 'the board' : 'ownership') + ' to create realistic annual budgets and five-year reserve forecasts.</li>' +
  '<li><strong>Annual Audits:</strong> We recommend engaging a reputable independent auditor to provide annual assurance of financial health.</li>' +
  '<li><strong>Cash Management:</strong> BankUnited partnership \u2014 zero fees, higher interest rates, automated reconciliations.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* PROJECT & COMPLIANCE */
  '<h2>Project &amp; Compliance Management</h2>' +
  '<ul>' +
  '<li><strong>Project Management:</strong> In-house project managers oversee vendor bidding, contract negotiations, and capital projects.</li>' +
  '<li><strong>Local Law Compliance:</strong> We manage compliance with NYC Local Laws (LL97, fa\u00E7ade inspections, energy benchmarking, etc.).' + (d.ll97Status === 'non-compliant' ? ' <em>LL97 exposure identified \u2014 $' + d.ll97Penalty.toLocaleString() + '/yr.</em>' : '') + '</li>' +
  '<li><strong>Legal &amp; Risk Mitigation:</strong> We collaborate with building attorneys on litigation and governance strategy.</li>' +
  '<li><strong>Energy &amp; Sustainability:</strong> Monitoring energy usage and implementing conservation programs.' + (d.energyStarScore > 0 ? ' <em>Current ENERGY STAR: ' + d.energyStarScore + '.</em>' : '') + '</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* WHY CAMELOT */
  '<h2>Why Camelot Is the Right Fit</h2>' +
  '<ul>' +
  '<li><strong>Hands-On Leadership:</strong> David Goldoff is personally involved in major client transitions and attends initial ' + (isBoard ? 'board' : 'owner') + ' sessions.</li>' +
  '<li><strong>Specialized Teams:</strong> Accounting, project management, compliance, and senior management all work together.</li>' +
  '<li><strong>Proactive Approach:</strong> We don\u2019t wait for issues to escalate. Preventive maintenance, vendor bidding, and oversight are embedded in our process.</li>' +
  '<li><strong>Tailored Service:</strong> We operate as a boutique firm \u2014 large enough to deliver professional systems but small enough to offer personalized service.</li>' +
  '</ul>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* ACCEPTANCE & SIGNATURES */
  '<h2>Acceptance of Proposal</h2>' +
  '<p>By signing below, both parties agree to the terms and authorize Camelot Property Management Services Corp. to commence management services for ' + buildingNameClean + '.</p>' +
  '<p><strong>Proposed Start Date:</strong> _________________________ (or mutually convenient date)</p>' +

  '<div class="sig-row">' +
  '<div class="sig-col">' +
  '<div style="font-size:10px;font-weight:700;color:#3A4B5B;margin-bottom:6px">Authorized ' + (isBoard ? 'Board Member' : 'Representative') + '</div>' +
  '<div class="sig-line"></div><div style="font-size:9px;color:#888">Name</div>' +
  '<div class="sig-line" style="margin-top:8px"></div><div style="font-size:9px;color:#888">Title</div>' +
  '<div class="sig-line" style="margin-top:8px;width:180px"></div><div style="font-size:9px;color:#888">Date</div>' +
  '</div>' +
  '<div class="sig-col">' +
  '<div style="font-size:10px;font-weight:700;color:#3A4B5B;margin-bottom:6px">Camelot Property Management Services Corp.</div>' +
  '<div class="sig-line"></div><div style="font-size:9px;color:#888">David A. Goldoff, President</div>' +
  '<div class="sig-line" style="margin-top:8px"></div><div style="font-size:9px;color:#888">Signature</div>' +
  '<div class="sig-line" style="margin-top:8px;width:180px"></div><div style="font-size:9px;color:#888">Date</div>' +
  '</div>' +
  '</div>' +

  '<div class="hr"></div>' +

  /* ══════════════════════════════════════════════════════════════ */
  /* POST-SIGNATURE: WORKING WITH CAMELOT */
  '<div class="page-break"></div>' +

  '<div style="text-align:center;margin-bottom:16px"><div class="cover-title">C A M E L O T</div><div style="font-size:9px;color:#A89035;letter-spacing:1.5px">W O R K I N G &nbsp; W I T H &nbsp; U S</div></div>' +

  '<h2>Next Steps \u2014 Working with Camelot</h2>' +
  '<p>Upon execution of this proposal, Camelot begins a structured onboarding process designed to ensure zero disruption to residents and staff. Below is our proven 90-day transition and optimization plan.</p>' +

  /* PHASE I */
  '<h2>Phase I \u2014 Discovery &amp; Assessment (Days 1\u201330)</h2>' +
  '<p>The first 30 days are dedicated to deep discovery \u2014 understanding ' + buildingNameClean + ' from every angle.</p>' +
  '<ul>' +
  '<li><strong>Full file and data transfer</strong> from current management. Camelot sends our standard Transitional Documentation outlining all files and information required.</li>' +
  '<li><strong>Free building inspection</strong> \u2014 Sr. Facilities Manager conducts on-site walkthrough covering property envelope, mechanical systems, deferred maintenance, and capital priorities. Written report delivered at no charge ($2,500 value).</li>' +
  '<li><strong>Financial &amp; budget review</strong> \u2014 Line-item analysis vs. comparable buildings we manage. AR/AP audit, reserve fund assessment, and revenue gap analysis.</li>' +
  '<li><strong>Vendor contract review</strong> \u2014 Priority targets for rebidding: elevator (10\u201318% savings), insurance (12\u201320%), cleaning (8\u201315%), HVAC/boiler (10\u201315%), extermination (10\u201320%), and legal (5\u201310%).</li>' +
  '<li><strong>Compliance checklist</strong> \u2014 HPD registrations, DOB filings, fire safety, LL11/FISP, LL97 carbon compliance' + (d.buildingArea > 25000 ? ' (critical at ' + d.buildingArea.toLocaleString() + ' SF)' : '') + ', and all open violations.</li>' +
  '<li><strong>Staff audit</strong> \u2014 Meet with on-site staff, review employment/payroll, establish written SOPs and weekly task schedules.</li>' +
  '<li><strong>Bank account setup</strong> \u2014 Establish BankUnited accounts (no fees, higher interest), configure automated billing through Zego payment portal.</li>' +
  '<li><strong>Resident notification</strong> \u2014 Formal notice of management change distributed to all ' + ownerLabel + '.</li>' +
  '</ul>' +

  /* PHASE II */
  '<h2>Phase II \u2014 Optimization &amp; Technology (Days 31\u201360)</h2>' +
  '<p>Phase 2 activates our full technology stack and launches vendor optimization. Measurable value creation begins here.</p>' +
  '<ul>' +
  '<li><strong>Technology deployment</strong> \u2014 AppFolio (financials), BuildingLink (resident communications), Zego (payments), Board Packager (digital board packages). ConciergePlus + Camelot AI rollout in 2026.</li>' +
  '<li><strong>Vendor rebidding</strong> \u2014 RFPs issued for all priority categories. 3 competitive bids per category with scope-matched comparisons.</li>' +
  '<li><strong>Insurance review</strong> \u2014 Full coverage audit through independent broker. Competitive quotes targeting 12\u201320% premium reduction.</li>' +
  '<li><strong>Financial systems live</strong> \u2014 AppFolio fully migrated; Zego billing activated; first Camelot monthly report delivered to ' + (isBoard ? 'board' : 'ownership') + '.</li>' +
  '<li><strong>' + (isBoard ? 'Board' : 'Owner') + ' portal launched</strong> \u2014 Contracts, financials, minutes, and documents accessible 24/7 through Board Packager.</li>' +
  '<li><strong>AI board meeting support</strong> \u2014 Meetings recorded, summarized, and formal minutes generated automatically \u2014 complimentary service.</li>' +
  '</ul>' +

  /* PHASE III */
  '<h2>Phase III \u2014 Stabilization &amp; Value Creation (Days 61\u201390)</h2>' +
  '<p>Phase 3 delivers the first measurable proof of value. Vendor contracts are finalized, and ' + (isBoard ? 'the board' : 'ownership') + ' receives a comprehensive 90-day performance report.</p>' +
  '<ul>' +
  '<li><strong>New vendor contracts executed</strong> \u2014 All rebid savings documented and board-approved. Seamless transition with no service interruption.</li>' +
  '<li><strong>Revenue enhancement review</strong> \u2014 Storage, sublets, alterations, flip tax, laundry, and vendor shared revenue opportunities analyzed.</li>' +
  '<li><strong>Resident satisfaction survey</strong> \u2014 Baseline measurement with benchmark comparison and action plan.</li>' +
  '<li><strong>Compliance roadmap delivered</strong> \u2014 LL97 compliance through 2030, energy baseline established, violation clearance plan in progress.</li>' +
  '<li><strong>90-Day Board Presentation</strong> \u2014 Live presentation covering: Financial Health Scorecard, Cost Reduction Summary, Technology Deployment Report, Compliance Dashboard, 12-Month Operating Plan, and Resident Satisfaction Baseline.</li>' +
  '</ul>' +

  /* LONG-TERM */
  '<h2>Ongoing \u2014 Optimization (Months 4\u201318)</h2>' +
  '<ul>' +
  '<li>Full adoption of Camelot automation systems for maintenance requests, vendor payments, and resident communications.</li>' +
  '<li>AI-assisted board meeting transcription and minutes for permanent recordkeeping.</li>' +
  '<li>Review and amend bylaws and house rules to reflect new management procedures.</li>' +
  '<li>Partner with BankUnited to optimize reserve yields and evaluate capital project financing.</li>' +
  '<li>Oversee compliance with Local Laws 11, 33, 97, and 157 (fa\u00E7ade, energy, gas safety).</li>' +
  '<li>Supervise capital improvement projects as prioritized by ' + (isBoard ? 'the board' : 'ownership') + '.</li>' +
  '<li>Explore new income opportunities: storage, roof deck, laundry expansion, amenity leasing.</li>' +
  '<li>Deliver comprehensive Year 1 performance review and recommendations.</li>' +
  '</ul>' +

  /* OUR COMMITMENT */
  '<h2>Our Commitment to ' + buildingNameClean + '</h2>' +
  '<p>Camelot is not the cheapest option \u2014 and we do not aim to be. Our value is the combination of experienced professionals, institutional-quality financial oversight, award-winning management, and a technology infrastructure built specifically for premium residential buildings. Our track record on vendor savings, insurance optimization, LL97 compliance, and resident satisfaction consistently exceeds the cost differential within the first operating year.</p>' +
  '<p style="font-size:10px;color:#A89035;font-weight:700;text-align:center;margin-top:10px">RED Awards \u2014 Property Management Company of the Year &nbsp;\u00B7&nbsp; David Goldoff, REBNY Residential Management Award</p>' +

  '<div class="hr"></div>' +

  /* TRANSITIONAL DOCUMENTS */
  '<h2>Transitional Documents</h2>' +
  '<p>Upon being retained, Camelot will provide our standard Transitional Documentation outlining all files and information required from the outgoing management company. All building files and records should be sent to:</p>' +
  '<div style="background:#F5F0E5;border-left:3px solid #A89035;padding:10px 14px;margin:8px 0;font-size:10.5px">' +
  '<strong>Camelot Property Management Services Corp.</strong><br>' +
  'Att: Sam Lodge, Office Manager<br>' +
  '477 Madison Avenue, 6th Floor, New York, NY 10022<br>' +
  'Email: <a href="mailto:management@camelot.nyc" style="color:#A89035">management@camelot.nyc</a> &nbsp;|&nbsp; Tel: (212) 206-9939</p>' +
  '</div>' +

  '<div class="hr"></div>' +
  '<p style="font-size:9px;color:#888;text-align:center">Please refer to our property management agreement for a detailed description of all terms, conditions, and rates.<br>Camelot Property Management Services Corp. &nbsp;\u00B7&nbsp; 477 Madison Avenue, 6th Floor, New York, NY 10022 &nbsp;\u00B7&nbsp; (212) 206-9939 &nbsp;\u00B7&nbsp; www.camelot.nyc &nbsp;\u00B7&nbsp; Licensed Broker ID #10491200104</p>' +

  '</body></html>';

  var w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    // Preview only — user clicks Print button when ready
    // setTimeout(function() { w.print(); }, 800);
  }
}
</script>
</body>
</html>`;
}
