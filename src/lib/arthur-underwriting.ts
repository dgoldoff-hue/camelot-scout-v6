import { slugify } from '@/lib/utils';

export type ArthurDealType =
  | 'commercial'
  | 'family_internal'
  | 'gp_lp'
  | 'jv'
  | 'land_lease'
  | 'new_development'
  | 'land_purchase'
  | 'one_to_four_family'
  | 'walk_up'
  | 'elevator'
  | 'mixed_use'
  | 'hoa_condo_recovery';

export interface ArthurCriteria {
  location: string;
  dealTypes: ArthurDealType[];
  applyDealTypeFilter: boolean;
  applyUnitRangeFilter: boolean;
  applySqftRangeFilter: boolean;
  minUnits: number;
  maxUnits: number;
  minSqft: number;
  maxSqft: number;
  blockLot: string;
  massingStudy: boolean;
  floodZone: boolean;
  investorFriendly: boolean;
  includeCommercialRates: boolean;
  includeBridgeRates: boolean;
  taxSensitivity: boolean;
  insuranceEstimate: boolean;
  censusProfile: boolean;
  schoolCrimeNeighborhoodScores: boolean;
  repairCostEstimate: boolean;
}

export interface ArthurProperty {
  id: string;
  name: string;
  address: string;
  location: string;
  type: ArthurDealType;
  units: number;
  sqft: number;
  askingPrice: number;
  lastSalePrice: number;
  lastSaleDate: string;
  taxes: number;
  insurance: number;
  noi: number;
  capRate: number;
  violations: number;
  zoning: string;
  floodZone: string;
  commuteScore: number;
  schoolScore: number;
  crimeScore: number;
  neighborhoodScore: number;
  ownership: string;
  listingAgent: string;
  listingSource: string;
  imageUrl: string;
  brokerNotes: string;
  arthurThesis: string;
  matchStatus?: 'exact' | 'nearest';
  matchScore?: number;
  mismatchReasons?: string[];
  selectedCriteriaNotes?: string[];
  pros: string[];
  cons: string[];
  comps: Array<{ address: string; price: number; units: number; capRate: number; distance: string }>;
}

export interface ArthurModel {
  purchasePrice: number;
  closingCosts: number;
  repairCost: number;
  totalBasis: number;
  stabilizedNoi: number;
  exitValue: number;
  equityRequired: number;
  loanAmount: number;
  irr: number;
  roi: number;
  equityMultiple: number;
  dscr: number;
  sensitivity: Array<{ caseName: string; exitCap: number; rentGrowth: number; irr: number; equityMultiple: number }>;
}

export const DEFAULT_ARTHUR_CRITERIA: ArthurCriteria = {
  location: 'New York, NY',
  dealTypes: ['walk_up', 'elevator', 'mixed_use', 'gp_lp'],
  applyDealTypeFilter: false,
  applyUnitRangeFilter: false,
  applySqftRangeFilter: false,
  minUnits: 10,
  maxUnits: 250,
  minSqft: 5000,
  maxSqft: 250000,
  blockLot: '',
  massingStudy: true,
  floodZone: true,
  investorFriendly: true,
  includeCommercialRates: true,
  includeBridgeRates: true,
  taxSensitivity: true,
  insuranceEstimate: true,
  censusProfile: true,
  schoolCrimeNeighborhoodScores: true,
  repairCostEstimate: true,
};

export const ARTHUR_CRITERIA_FIELDS = [
  'Commercial property',
  'Family internal deal',
  'GP / LP investment',
  'JV investment',
  'Land lease',
  'New development',
  'Land purchase',
  '1-4 families',
  'Walk-up',
  'Elevator',
  'Square footage',
  'Unit range',
  'Location',
  'Block and lot',
  'Massing study',
  'Flood zone',
  'Taxes',
  'Insurance policy estimates',
  'US Census incomes / jobs / demographics',
  'Nearby services',
  'Underwriting score',
  'Commercial rates',
  'Bridge lender rates',
  'Estimated closing costs',
  'Last sale',
  'School score',
  'Crime score',
  'Neighborhood score',
  'Estimated repair cost',
  'Cost of labor',
  'Investor friendly',
];

const TYPE_LABELS: Record<ArthurDealType, string> = {
  commercial: 'Commercial',
  family_internal: 'Family Internal Deal',
  gp_lp: 'GP / LP Investment',
  jv: 'JV Investment',
  land_lease: 'Land Lease',
  new_development: 'New Development',
  land_purchase: 'Land Purchase',
  one_to_four_family: '1-4 Family',
  walk_up: 'Walk-Up',
  elevator: 'Elevator Building',
  mixed_use: 'Mixed-Use',
  hoa_condo_recovery: 'HOA / Condo Recovery',
};

export function arthurDealTypeLabel(type: ArthurDealType) {
  return TYPE_LABELS[type] || type;
}

const ALL_DEAL_TYPES = Object.keys(TYPE_LABELS) as ArthurDealType[];

type ArthurSeed = Omit<
  ArthurProperty,
  'id' | 'matchStatus' | 'matchScore' | 'mismatchReasons' | 'selectedCriteriaNotes' | 'comps'
>;

const ARTHUR_CANDIDATE_UNIVERSE: ArthurSeed[] = [
  {
    name: 'Riverside Value-Add Portfolio',
    address: '180 Riverside Drive, New York, NY',
    location: 'Upper West Side, Manhattan',
    type: 'gp_lp',
    units: 112,
    sqft: 136000,
    askingPrice: 52000000,
    lastSalePrice: 33280000,
    lastSaleDate: '2014-06-15',
    taxes: 624000,
    insurance: 217600,
    noi: 1976000,
    capRate: 0.038,
    violations: 9,
    zoning: 'D7 / R10A',
    floodZone: 'Possible waterfront exposure',
    commuteScore: 96,
    schoolScore: 82,
    crimeScore: 78,
    neighborhoodScore: 90,
    ownership: 'Riverside ValueAdd Holdings LLC',
    listingAgent: 'Listing agent to verify from source listing',
    listingSource: 'MLS / StreetEasy / lender lead to verify',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=180%20Riverside%20Drive%2C%20New%20York%2C%20NY',
    brokerNotes: 'Portfolio-sized residential value-add opportunity with institutional exit liquidity if operating assumptions hold.',
    arthurThesis: 'Proceed only after Jackie validates rent roll, capex timeline, violations, staff structure, and achievable operating savings.',
    pros: ['Institutional unit count', 'Strong Manhattan liquidity', 'Management and vendor rebid upside'],
    cons: ['Waterfront insurance sensitivity', 'Rent-regulatory review required', 'Capex must be scoped before LOI'],
  },
  {
    name: 'East Side Elevator Opportunity',
    address: '201 East 79th Street, New York, NY',
    location: 'Upper East Side, Manhattan',
    type: 'elevator',
    units: 167,
    sqft: 201000,
    askingPrice: 89000000,
    lastSalePrice: 55180000,
    lastSaleDate: '2015-06-15',
    taxes: 1068000,
    insurance: 371850,
    noi: 3649000,
    capRate: 0.041,
    violations: 47,
    zoning: 'R10 / C1-5 overlay',
    floodZone: 'No obvious flood flag',
    commuteScore: 90,
    schoolScore: 78,
    crimeScore: 73,
    neighborhoodScore: 86,
    ownership: 'EastSideElevatorOpportunity Holdings LLC',
    listingAgent: 'Off-market / owner outreach candidate',
    listingSource: 'Scout off-market lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=201%20East%2079th%20Street%2C%20New%20York%2C%20NY',
    brokerNotes: 'Large elevator asset with meaningful compliance and management diligence required before underwriting confidence.',
    arthurThesis: 'Potential acquisition if violations are curable, management transition is priced, and current income verifies against public records.',
    pros: ['Large unit count', 'Prime UES address', 'Scale supports professionalized operations'],
    cons: ['Compliance remediation must be priced before LOI', 'Current management and owner record need verification', 'Market value requires comp support'],
  },
  {
    name: 'Midtown Mixed-Use Basis Play',
    address: '345 West 58th Street, New York, NY',
    location: 'Columbus Circle / Midtown West',
    type: 'mixed_use',
    units: 74,
    sqft: 92000,
    askingPrice: 41000000,
    lastSalePrice: 27060000,
    lastSaleDate: '2016-06-15',
    taxes: 492000,
    insurance: 193200,
    noi: 1804000,
    capRate: 0.044,
    violations: 17,
    zoning: 'C6-4',
    floodZone: 'No obvious flood flag',
    commuteScore: 84,
    schoolScore: 74,
    crimeScore: 68,
    neighborhoodScore: 82,
    ownership: 'MidtownMixedUseBasisPlay Holdings LLC',
    listingAgent: 'Listing agent to verify from source listing',
    listingSource: 'LoopNet / broker package style lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=345%20West%2058th%20Street%2C%20New%20York%2C%20NY',
    brokerNotes: 'Mixed-use basis play where retail income, air rights, and expense leakage should be verified.',
    arthurThesis: 'Best suited for a JV/GP-LP structure if commercial rents and expense recoveries support a defensible basis.',
    pros: ['Mixed-use revenue upside', 'Central transit market', 'Potential commercial rent mark-to-market'],
    cons: ['Retail lease rollover risk', 'Zoning and air-right review required', 'Insurance and tax escalation sensitivity'],
  },
  {
    name: 'Harlem Walk-Up Assemblage',
    address: '346 East 119th Street, New York, NY',
    location: 'East Harlem, Manhattan',
    type: 'walk_up',
    units: 42,
    sqft: 38500,
    askingPrice: 14800000,
    lastSalePrice: 9768000,
    lastSaleDate: '2017-06-15',
    taxes: 177600,
    insurance: 90475,
    noi: 695600,
    capRate: 0.047,
    violations: 36,
    zoning: 'R7A',
    floodZone: 'No obvious flood flag',
    commuteScore: 78,
    schoolScore: 70,
    crimeScore: 63,
    neighborhoodScore: 78,
    ownership: 'HarlemWalkUpAssemblage Holdings LLC',
    listingAgent: 'Off-market / owner outreach candidate',
    listingSource: 'Scout distress lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=346%20East%20119th%20Street%2C%20New%20York%2C%20NY',
    brokerNotes: 'Walk-up basis opportunity with compliance, rent-regulation, and renovation cadence risk.',
    arthurThesis: 'Can move to Arthur underwriting after Jackie confirms tenant profile, violations, DHCR exposure, and realistic unit-turn program.',
    pros: ['Lower basis than core Manhattan', 'Management distress creates leverage', 'Potential expense reset'],
    cons: ['High violation load', 'Rent-regulatory exposure likely', 'Tenant coordination may slow execution'],
  },
  {
    name: 'Hills of Monroe HOA Recovery',
    address: '645 Main Street, Monroe, CT 06468',
    location: 'Monroe, Connecticut',
    type: 'hoa_condo_recovery',
    units: 186,
    sqft: 210000,
    askingPrice: 32500000,
    lastSalePrice: 23920000,
    lastSaleDate: '2018-06-15',
    taxes: 390000,
    insurance: 525000,
    noi: 1625000,
    capRate: 0.05,
    violations: 0,
    zoning: 'Residential HOA',
    floodZone: 'Review FEMA / local flood maps',
    commuteScore: 72,
    schoolScore: 76,
    crimeScore: 70,
    neighborhoodScore: 74,
    ownership: 'Hills of Monroe HOA',
    listingAgent: 'Carlos Capria / board contact to verify',
    listingSource: 'HOA operational recovery lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=645%20Main%20Street%2C%20Monroe%2C%20CT%2006468',
    brokerNotes: 'HOA recovery / management opportunity, not a conventional sale listing. Needs board package, budget, claim file, and site support pricing.',
    arthurThesis: 'Operational engagement first; financial model should price core management, local field support, and claims/project oversight separately.',
    pros: ['186-unit community scale', 'Clear operational recovery story', 'MDS / ConciergePlus deployment fit'],
    cons: ['Not a sale listing', 'Local field labor needs sourcing', 'Financials and insurance claim file required'],
  },
  {
    name: 'Westchester Elevator Recapitalization',
    address: '25 Main Street, White Plains, NY',
    location: 'White Plains, Westchester',
    type: 'elevator',
    units: 96,
    sqft: 118000,
    askingPrice: 38200000,
    lastSalePrice: 25400000,
    lastSaleDate: '2019-10-01',
    taxes: 458400,
    insurance: 241900,
    noi: 1680800,
    capRate: 0.044,
    violations: 12,
    zoning: 'Downtown mixed residential',
    floodZone: 'Review county flood maps',
    commuteScore: 80,
    schoolScore: 79,
    crimeScore: 72,
    neighborhoodScore: 81,
    ownership: 'Westchester Recap Owner LLC',
    listingAgent: 'Regional broker to verify',
    listingSource: 'Broker / lender recap lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=25%20Main%20Street%2C%20White%20Plains%2C%20NY',
    brokerNotes: 'Transit-oriented elevator building with potential debt maturity or recapitalization angle.',
    arthurThesis: 'Underwrite if tax, insurance, and debt maturity create negotiated basis or preferred-equity opportunity.',
    pros: ['Westchester liquidity', 'Transit-oriented demand', 'Recapitalization optionality'],
    cons: ['County tax analysis required', 'Commuter market sensitivity', 'Debt terms need verification'],
  },
  {
    name: 'Northern Miami Condo Inventory Block',
    address: '1900 NE 135th Street, North Miami, FL',
    location: 'North Miami, Florida',
    type: 'family_internal',
    units: 28,
    sqft: 42000,
    askingPrice: 11800000,
    lastSalePrice: 8200000,
    lastSaleDate: '2021-03-10',
    taxes: 141600,
    insurance: 315000,
    noi: 578200,
    capRate: 0.049,
    violations: 4,
    zoning: 'Condo / multifamily',
    floodZone: 'Florida wind and flood insurance review required',
    commuteScore: 74,
    schoolScore: 66,
    crimeScore: 61,
    neighborhoodScore: 73,
    ownership: 'Family ownership to verify',
    listingAgent: 'Florida broker to verify',
    listingSource: 'Family internal / condo inventory lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=1900%20NE%20135th%20Street%2C%20North%20Miami%2C%20FL',
    brokerNotes: 'Condo inventory / family-internal transaction candidate with insurance and HOA diligence front and center.',
    arthurThesis: 'Only proceed if insurance, association reserves, and liquidity assumptions are supportable.',
    pros: ['Potential family transaction flexibility', 'Condo inventory strategy', 'Florida growth market'],
    cons: ['Insurance can overwhelm pro forma', 'HOA reserves and assessments must be verified', 'Market liquidity varies by unit type'],
  },
  {
    name: 'New Jersey Small Multifamily Exchange',
    address: '75 River Road, Edgewater, NJ',
    location: 'Edgewater, New Jersey',
    type: 'one_to_four_family',
    units: 4,
    sqft: 7800,
    askingPrice: 3250000,
    lastSalePrice: 2100000,
    lastSaleDate: '2020-08-22',
    taxes: 58500,
    insurance: 28000,
    noi: 169000,
    capRate: 0.052,
    violations: 2,
    zoning: '1-4 family / waterfront review',
    floodZone: 'Possible waterfront exposure',
    commuteScore: 76,
    schoolScore: 72,
    crimeScore: 68,
    neighborhoodScore: 76,
    ownership: 'Private owner to verify',
    listingAgent: 'NJ listing broker to verify',
    listingSource: '1031 / small multifamily lead',
    imageUrl: 'https://maps.googleapis.com/maps/api/streetview?size=900x540&location=75%20River%20Road%2C%20Edgewater%2C%20NJ',
    brokerNotes: 'Smaller investor-friendly acquisition with clear 1031 or family-office use case.',
    arthurThesis: 'Model as a lighter-weight investor package with debt quotes, repairs, taxes, and rent comps.',
    pros: ['Small deal executable', 'Investor-friendly structure', 'Potential 1031 buyer pool'],
    cons: ['Scale is limited', 'Flood and insurance review required', 'Less platform value than larger assets'],
  },
];

function cleanNumber(value: number, fallback: number) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function sanitizeArthurCriteria(criteria: ArthurCriteria): ArthurCriteria {
  const minUnits = cleanNumber(criteria.minUnits, 0);
  const maxUnitsInput = cleanNumber(criteria.maxUnits, 0);
  const minSqft = cleanNumber(criteria.minSqft, 0);
  const maxSqftInput = cleanNumber(criteria.maxSqft, 0);
  const maxUnits = maxUnitsInput > 0 ? Math.max(maxUnitsInput, minUnits) : Number.MAX_SAFE_INTEGER;
  const maxSqft = maxSqftInput > 0 ? Math.max(maxSqftInput, minSqft) : Number.MAX_SAFE_INTEGER;
  const dealTypes = criteria.dealTypes.length ? criteria.dealTypes : ALL_DEAL_TYPES;

  return {
    ...criteria,
    location: criteria.location.trim() || DEFAULT_ARTHUR_CRITERIA.location,
    dealTypes,
    applyDealTypeFilter: Boolean(criteria.applyDealTypeFilter),
    applyUnitRangeFilter: Boolean(criteria.applyUnitRangeFilter),
    applySqftRangeFilter: Boolean(criteria.applySqftRangeFilter),
    minUnits,
    maxUnits,
    minSqft,
    maxSqft,
    blockLot: criteria.blockLot.trim(),
  };
}

function propertyMatchesLocation(property: ArthurProperty, location: string) {
  const query = location.toLowerCase().trim();
  if (!query || query === 'new york, ny') return true;
  const haystack = `${property.name} ${property.address} ${property.location}`.toLowerCase();
  return query
    .split(/[,\s]+/)
    .filter((token) => token.length > 2)
    .some((token) => haystack.includes(token));
}

function propertyMatchesCriteria(property: ArthurProperty, criteria: ArthurCriteria) {
  const unitsOk = !criteria.applyUnitRangeFilter || (property.units >= criteria.minUnits && property.units <= criteria.maxUnits);
  const sqftOk = !criteria.applySqftRangeFilter || (property.sqft >= criteria.minSqft && property.sqft <= criteria.maxSqft);
  const typeOk = !criteria.applyDealTypeFilter || criteria.dealTypes.includes(property.type);
  const locationOk = propertyMatchesLocation(property, criteria.location);
  return unitsOk && sqftOk && typeOk && locationOk;
}

function propertyMatchesHardCriteriaWithoutLocation(property: ArthurProperty, criteria: ArthurCriteria) {
  const unitsOk = !criteria.applyUnitRangeFilter || (property.units >= criteria.minUnits && property.units <= criteria.maxUnits);
  const sqftOk = !criteria.applySqftRangeFilter || (property.sqft >= criteria.minSqft && property.sqft <= criteria.maxSqft);
  const typeOk = !criteria.applyDealTypeFilter || criteria.dealTypes.includes(property.type);
  return unitsOk && sqftOk && typeOk;
}

function correctImpossibleDealType(property: ArthurProperty): ArthurProperty {
  if (property.type !== 'one_to_four_family' || property.units <= 4) return property;
  if (/hoa|condo/i.test(`${property.name} ${property.zoning}`)) return { ...property, type: 'hoa_condo_recovery' };
  if (/mixed|retail|commercial|overlay|c6/i.test(`${property.name} ${property.zoning}`)) return { ...property, type: 'mixed_use' };
  if (/walk-up|walk up/i.test(property.name)) return { ...property, type: 'walk_up' };
  if (/elevator/i.test(property.name) || property.units >= 80) return { ...property, type: 'elevator' };
  return { ...property, type: 'gp_lp' };
}

function scoreCandidate(property: ArthurProperty, criteria: ArthurCriteria) {
  let score = 55;
  const reasons: string[] = [];

  if (propertyMatchesLocation(property, criteria.location)) score += 18;
  else reasons.push(`Location differs from "${criteria.location}"`);

  if (!criteria.applyDealTypeFilter || criteria.dealTypes.includes(property.type)) score += 14;
  else reasons.push(`Deal type is ${arthurDealTypeLabel(property.type)}`);

  if (!criteria.applyUnitRangeFilter || (property.units >= criteria.minUnits && property.units <= criteria.maxUnits)) score += 10;
  else reasons.push(`${property.units} units outside selected range`);

  if (!criteria.applySqftRangeFilter || (property.sqft >= criteria.minSqft && property.sqft <= criteria.maxSqft)) score += 10;
  else reasons.push(`${property.sqft.toLocaleString()} SF outside selected range`);

  score += Math.round((property.neighborhoodScore - property.violations / 2) / 20);
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function buildSelectedCriteriaNotes(criteria: ArthurCriteria) {
  const notes = [
    `Market focus: ${criteria.location}`,
    criteria.applyDealTypeFilter
      ? `Deal type hard filter: ${criteria.dealTypes.map(arthurDealTypeLabel).join(', ')}`
      : 'Deal type is included for the report, not used as a hard listing filter.',
    criteria.applyUnitRangeFilter
      ? `Unit range hard filter: ${criteria.minUnits}-${criteria.maxUnits === Number.MAX_SAFE_INTEGER ? 'No max' : criteria.maxUnits}`
      : 'Unit range is included for underwriting, not used as a hard listing filter.',
    criteria.applySqftRangeFilter
      ? `Square-footage hard filter: ${criteria.minSqft.toLocaleString()}-${criteria.maxSqft === Number.MAX_SAFE_INTEGER ? 'No max' : criteria.maxSqft.toLocaleString()}`
      : 'Square footage is included for underwriting, not used as a hard listing filter.',
  ];
  if (criteria.massingStudy) notes.push('Massing / zoning upside requested.');
  if (criteria.floodZone) notes.push('Flood-zone and insurance sensitivity requested.');
  if (criteria.censusProfile) notes.push('Census and demographic support requested.');
  if (criteria.includeBridgeRates) notes.push('Bridge lender rates requested.');
  return notes;
}

function attachComps(property: ArthurProperty): ArthurProperty {
  const normalizedProperty = correctImpossibleDealType(property);
  const street = normalizedProperty.address.split(',')[0];
  return {
    ...normalizedProperty,
    comps: [
      { address: `Comparable A near ${street}`, price: Math.round(normalizedProperty.askingPrice * 0.92), units: Math.max(2, normalizedProperty.units - 18), capRate: 0.045, distance: '0.3 mi' },
      { address: `Comparable B near ${street}`, price: Math.round(normalizedProperty.askingPrice * 1.08), units: normalizedProperty.units + 22, capRate: 0.041, distance: '0.7 mi' },
      { address: `Comparable C near ${street}`, price: Math.round(normalizedProperty.askingPrice * 0.84), units: Math.max(2, normalizedProperty.units - 31), capRate: 0.049, distance: '1.1 mi' },
    ],
  };
}

export function searchArthurListings(criteria: ArthurCriteria): ArthurProperty[] {
  const normalized = sanitizeArthurCriteria(criteria);
  const generated = ARTHUR_CANDIDATE_UNIVERSE.map((seed, index) => {
    const base = correctImpossibleDealType({ ...seed, id: `arthur-${index + 1}`, comps: [] } as ArthurProperty);
    const { score, reasons } = scoreCandidate(base, normalized);
    return attachComps({
      ...base,
      matchStatus: 'exact',
      matchScore: score,
      mismatchReasons: reasons,
      selectedCriteriaNotes: buildSelectedCriteriaNotes(normalized),
    });
  });

  const exactMatches = generated.filter((property) => propertyMatchesCriteria(property, normalized));
  if (exactMatches.length) return exactMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const sameHardCriteriaOutsideLocation = generated.filter((property) =>
    propertyMatchesHardCriteriaWithoutLocation(property, normalized)
  );
  const fallbackPool = sameHardCriteriaOutsideLocation.length ? sameHardCriteriaOutsideLocation : generated;

  return fallbackPool
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 5)
    .map((property) => ({
      ...property,
      matchStatus: 'nearest',
      cons: [
        ...property.cons,
        sameHardCriteriaOutsideLocation.length
          ? 'Shown as a nearest candidate because the asset class and range match, but the location filter has no exact listing match.'
          : 'Shown as a nearest candidate because the current active filters returned no exact listing matches.',
      ],
    }));
}

export function buildArthurModel(property: ArthurProperty): ArthurModel {
  const closingCosts = Math.round(property.askingPrice * 0.035);
  const repairCost = Math.round(property.units * 18500 + property.sqft * 12);
  const totalBasis = property.askingPrice + closingCosts + repairCost;
  const stabilizedNoi = Math.round(property.noi * 1.22 + property.units * 1200);
  const exitCap = Math.max(0.042, property.capRate - 0.002);
  const exitValue = Math.round(stabilizedNoi / exitCap);
  const loanAmount = Math.round(totalBasis * 0.62);
  const equityRequired = totalBasis - loanAmount;
  const netProfit = exitValue - totalBasis;
  const roi = netProfit / equityRequired;
  const equityMultiple = (equityRequired + netProfit) / equityRequired;
  const irr = Math.max(-0.25, Math.min(0.42, Math.pow(equityMultiple, 1 / 5) - 1));
  const debtService = loanAmount * 0.074;
  const dscr = stabilizedNoi / debtService;

  return {
    purchasePrice: property.askingPrice,
    closingCosts,
    repairCost,
    totalBasis,
    stabilizedNoi,
    exitValue,
    equityRequired,
    loanAmount,
    irr,
    roi,
    equityMultiple,
    dscr,
    sensitivity: [
      { caseName: 'Downside', exitCap: exitCap + 0.0075, rentGrowth: 0.01, irr: irr - 0.06, equityMultiple: equityMultiple - 0.35 },
      { caseName: 'Base', exitCap, rentGrowth: 0.03, irr, equityMultiple },
      { caseName: 'Upside', exitCap: exitCap - 0.005, rentGrowth: 0.045, irr: irr + 0.055, equityMultiple: equityMultiple + 0.42 },
    ],
  };
}

export function buildArthurFilename(property: ArthurProperty, ext: 'html' | 'xls' | 'pdf' = 'html') {
  return `Arthur-Investment-Report-${slugify(property.name || property.address)}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function money(value: number) {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function buildArthurReportHtml(property: ArthurProperty, criteria: ArthurCriteria, model = buildArthurModel(property)) {
  const normalizedCriteria = sanitizeArthurCriteria(criteria);
  const map = `https://www.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`;
  const streetView = `https://www.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${property.name} - Arthur Investment Report</title>
<style>
  @page { size: letter; margin: 0.35in; }
  body { margin:0; background:#f4f1ea; color:#0c1a33; font-family: Arial, sans-serif; }
  .page { width: 10.5in; min-height: 7.6in; margin: 0 auto 18px; background:#fffdf8; border:1px solid #d4c38f; padding:34px 42px; box-sizing:border-box; position:relative; }
  .brand { position:absolute; top:24px; right:28px; background:#c6a331; color:#111; letter-spacing:7px; padding:18px 28px; font-size:16px; }
  h1,h2 { font-family: Georgia, serif; color:#b08a19; font-weight:400; margin:0 0 14px; }
  h1 { font-size:46px; line-height:1.02; max-width:720px; }
  h2 { font-size:34px; border-left:6px solid #b08a19; padding-left:14px; }
  .sub { color:#334963; font-size:16px; line-height:1.45; max-width:760px; }
  .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; margin-top:22px; }
  .card { border:1px solid #d8c99c; background:#fff; padding:14px; min-height:78px; }
  .label { text-transform:uppercase; font-size:10px; color:#607085; letter-spacing:1px; }
  .value { font-size:20px; color:#081d45; font-weight:700; margin-top:6px; }
  .two { display:grid; grid-template-columns: 1.08fr .92fr; gap:22px; margin-top:24px; }
  iframe,img { width:100%; border:0; min-height:260px; background:#eee8dc; }
  table { width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; }
  th { background:#314557; color:white; text-align:left; padding:9px; }
  td { border-bottom:1px solid #e6dcc4; padding:9px; }
  .pill { display:inline-block; border:1px solid #d8c99c; padding:6px 9px; margin:4px 5px 4px 0; background:#f8f5ec; }
  .footer { position:absolute; bottom:18px; right:30px; color:#8a8f99; font-size:10px; }
  .note { color:#6b7280; font-size:12px; line-height:1.45; }
</style>
</head>
<body>
<section class="page">
  <div class="brand">CAMELOT</div>
  <h1>${property.name}</h1>
  <p class="sub">Arthur Investment Underwriting Report prepared by Camelot. This report starts with the selected listing card, then converts broker facts, operating risks, and selected diligence criteria into investor-facing underwriting.</p>
  <div class="grid">
    <div class="card"><div class="label">Asking Price</div><div class="value">${money(property.askingPrice)}</div></div>
    <div class="card"><div class="label">Units</div><div class="value">${property.units}</div></div>
    <div class="card"><div class="label">Current Cap Rate</div><div class="value">${pct(property.capRate)}</div></div>
    <div class="card"><div class="label">Base IRR</div><div class="value">${pct(model.irr)}</div></div>
  </div>
  <div class="two">
    <iframe src="${streetView}" title="Subject property view"></iframe>
    <iframe src="${map}" title="Subject property map"></iframe>
  </div>
  <p class="note">Address: ${property.address} | Listing source: ${property.listingSource} | Prepared: ${new Date().toLocaleDateString()}</p>
  <div class="footer">1</div>
</section>
<section class="page">
  <h2>Listing Card & Investment Snapshot</h2>
  <div class="grid">
    <div class="card"><div class="label">Total Basis</div><div class="value">${money(model.totalBasis)}</div></div>
    <div class="card"><div class="label">Equity Required</div><div class="value">${money(model.equityRequired)}</div></div>
    <div class="card"><div class="label">Equity Multiple</div><div class="value">${model.equityMultiple.toFixed(2)}x</div></div>
    <div class="card"><div class="label">DSCR</div><div class="value">${model.dscr.toFixed(2)}x</div></div>
  </div>
  <div class="two">
    <div>
      <h3>Broker / Source Notes</h3>
      <p>${property.brokerNotes}</p>
      <h3>Arthur Thesis</h3>
      <p>${property.arthurThesis}</p>
      <h3>Pros</h3>
      ${property.pros.map((item) => `<span class="pill">${item}</span>`).join('')}
      <h3>Cons / Caveats</h3>
      ${property.cons.map((item) => `<span class="pill">${item}</span>`).join('')}
    </div>
    <div>
      <h3>Diligence Inputs</h3>
      <p>Ownership: ${property.ownership}</p>
      <p>Zoning: ${property.zoning}</p>
      <p>Violations: ${property.violations}</p>
      <p>Flood: ${property.floodZone}</p>
      <p>Listing agent: ${property.listingAgent}</p>
      <p>Last sale: ${money(property.lastSalePrice)} on ${property.lastSaleDate}</p>
      <h3>Selected Criteria</h3>
      ${(property.selectedCriteriaNotes || buildSelectedCriteriaNotes(normalizedCriteria)).map((item) => `<span class="pill">${item}</span>`).join('')}
    </div>
  </div>
  <div class="footer">2</div>
</section>
<section class="page">
  <h2>Comps & Sensitivity</h2>
  <table>
    <thead><tr><th>Comp</th><th>Price</th><th>Units</th><th>Cap Rate</th><th>Distance</th></tr></thead>
    <tbody>${property.comps.map((comp) => `<tr><td>${comp.address}</td><td>${money(comp.price)}</td><td>${comp.units}</td><td>${pct(comp.capRate)}</td><td>${comp.distance}</td></tr>`).join('')}</tbody>
  </table>
  <table>
    <thead><tr><th>Case</th><th>Exit Cap</th><th>Rent Growth</th><th>IRR</th><th>Equity Multiple</th></tr></thead>
    <tbody>${model.sensitivity.map((row) => `<tr><td>${row.caseName}</td><td>${pct(row.exitCap)}</td><td>${pct(row.rentGrowth)}</td><td>${pct(row.irr)}</td><td>${row.equityMultiple.toFixed(2)}x</td></tr>`).join('')}</tbody>
  </table>
  <p class="note">Active filters: ${normalizedCriteria.applyDealTypeFilter ? normalizedCriteria.dealTypes.map(arthurDealTypeLabel).join(', ') : 'Deal type not hard-filtered'} | ${normalizedCriteria.location} | ${normalizedCriteria.applyUnitRangeFilter ? `${normalizedCriteria.minUnits}-${normalizedCriteria.maxUnits === Number.MAX_SAFE_INTEGER ? 'No max' : normalizedCriteria.maxUnits} units` : 'Unit range not hard-filtered'} | ${normalizedCriteria.applySqftRangeFilter ? `${normalizedCriteria.minSqft.toLocaleString()}-${normalizedCriteria.maxSqft === Number.MAX_SAFE_INTEGER ? 'No max' : normalizedCriteria.maxSqft.toLocaleString()} SF` : 'SF not hard-filtered'}.</p>
  <div class="footer">3</div>
</section>
</body>
</html>`;
}

export function buildArthurExcelHtml(property: ArthurProperty, criteria: ArthurCriteria, model = buildArthurModel(property)) {
  const rows = [
    ['Property', property.name],
    ['Address', property.address],
    ['Deal Type', arthurDealTypeLabel(property.type)],
    ['Purchase Price', model.purchasePrice],
    ['Closing Costs', model.closingCosts],
    ['Repair Cost', model.repairCost],
    ['Total Basis', model.totalBasis],
    ['Loan Amount', model.loanAmount],
    ['Equity Required', model.equityRequired],
    ['Stabilized NOI', model.stabilizedNoi],
    ['Exit Value', model.exitValue],
    ['IRR', model.irr],
    ['ROI', model.roi],
    ['Equity Multiple', model.equityMultiple],
    ['DSCR', model.dscr],
    ['Location Criteria', criteria.location],
    ['Unit Range', `${criteria.minUnits}-${criteria.maxUnits}`],
    ['Broker Notes', property.brokerNotes],
    ['Arthur Thesis', property.arthurThesis],
  ];
  const sensitivity = model.sensitivity.map((row) =>
    `<tr><td>${row.caseName}</td><td>${row.exitCap}</td><td>${row.rentGrowth}</td><td>${row.irr}</td><td>${row.equityMultiple}</td></tr>`
  ).join('');

  return `<html><head><meta charset="utf-8" /></head><body>
    <table><tr><th colspan="2">Arthur Investment Model</th></tr>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
    <br/>
    <table><tr><th>Case</th><th>Exit Cap</th><th>Rent Growth</th><th>IRR</th><th>Equity Multiple</th></tr>${sensitivity}</table>
  </body></html>`;
}

export function downloadArthurExcel(property: ArthurProperty, criteria: ArthurCriteria) {
  const html = buildArthurExcelHtml(property, criteria);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildArthurFilename(property, 'xls');
  a.click();
  URL.revokeObjectURL(url);
}
