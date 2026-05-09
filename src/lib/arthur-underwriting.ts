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
  matchStatus?: 'exact' | 'nearest';
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
    minUnits,
    maxUnits,
    minSqft,
    maxSqft,
    blockLot: criteria.blockLot.trim(),
  };
}

function propertyMatchesCriteria(property: ArthurProperty, criteria: ArthurCriteria) {
  const unitsOk = property.units >= criteria.minUnits && property.units <= criteria.maxUnits;
  const sqftOk = property.sqft >= criteria.minSqft && property.sqft <= criteria.maxSqft;
  const typeOk = criteria.dealTypes.includes(property.type);
  return unitsOk && sqftOk && typeOk;
}

export function searchArthurListings(criteria: ArthurCriteria): ArthurProperty[] {
  const normalized = sanitizeArthurCriteria(criteria);
  const city = normalized.location;
  const baseTypes = normalized.dealTypes;
  const seeds = [
    ['Riverside Value-Add Portfolio', '180 Riverside Drive', 112, 136000, 52000000, 'D7 / R10A'],
    ['East Side Elevator Opportunity', '201 East 79th Street', 167, 201000, 89000000, 'R10 / C1-5 overlay'],
    ['Midtown Mixed-Use Basis Play', '345 West 58th Street', 74, 92000, 41000000, 'C6-4'],
    ['Harlem Walk-Up Assemblage', '346 East 119th Street', 42, 38500, 14800000, 'R7A'],
    ['Outer Borough HOA Recovery', '645 Main Street', 186, 210000, 32500000, 'Residential HOA'],
  ];

  const generated = seeds.map(([name, street, units, sqft, price, zoning], index) => {
    const numericUnits = Number(units);
    const numericSqft = Number(sqft);
    const askingPrice = Number(price);
    const type = baseTypes[index % baseTypes.length];
    const noi = Math.round(askingPrice * (0.038 + index * 0.003));
    const violations = index === 1 ? 47 : index === 3 ? 36 : 9 + index * 4;
    return {
      id: `arthur-${index + 1}`,
      name: String(name),
      address: `${street}, ${city}`,
      location: city,
      type,
      units: numericUnits,
      sqft: numericSqft,
      askingPrice,
      lastSalePrice: Math.round(askingPrice * (0.58 + index * 0.04)),
      lastSaleDate: `${2012 + index}-06-15`,
      taxes: Math.round(askingPrice * 0.012),
      insurance: Math.round(numericSqft * (1.6 + index * 0.25)),
      noi,
      capRate: noi / askingPrice,
      violations,
      zoning: String(zoning),
      floodZone: index === 4 ? 'Review FEMA / local flood maps' : index === 0 ? 'Possible waterfront exposure' : 'No obvious flood flag',
      commuteScore: Math.max(68, 96 - index * 6),
      schoolScore: Math.max(55, 82 - index * 4),
      crimeScore: Math.max(48, 78 - index * 5),
      neighborhoodScore: Math.max(62, 90 - index * 4),
      ownership: index === 4 ? 'Association / HOA ownership to verify' : `${String(name).replace(/[^A-Za-z]/g, '')} Holdings LLC`,
      listingAgent: index % 2 === 0 ? 'Listing agent to verify from source listing' : 'Off-market / owner outreach candidate',
      listingSource: index % 2 === 0 ? 'MLS / StreetEasy / LoopNet-style source to verify' : 'Scout off-market lead',
      imageUrl: `https://maps.googleapis.com/maps/api/streetview?size=900x540&location=${encodeURIComponent(`${street}, ${city}`)}`,
      matchStatus: 'exact' as const,
      pros: [
        'Operational improvement runway',
        'Vendor rebid and management transition opportunity',
        'Potential basis advantage if seller motivation is confirmed',
      ],
      cons: [
        violations > 30 ? 'Compliance remediation must be priced before LOI' : 'Public-record diligence still required',
        'Insurance and tax assumptions require document review',
        'Arthur should not proceed without Jackie operator sign-off',
      ],
      comps: [
        { address: `Comparable A near ${street}`, price: Math.round(askingPrice * 0.92), units: Math.max(8, numericUnits - 18), capRate: 0.045, distance: '0.3 mi' },
        { address: `Comparable B near ${street}`, price: Math.round(askingPrice * 1.08), units: numericUnits + 22, capRate: 0.041, distance: '0.7 mi' },
        { address: `Comparable C near ${street}`, price: Math.round(askingPrice * 0.84), units: Math.max(4, numericUnits - 31), capRate: 0.049, distance: '1.1 mi' },
      ],
    };
  });

  const exactMatches = generated.filter((property) => propertyMatchesCriteria(property, normalized));
  if (exactMatches.length) return exactMatches;

  return generated.map((property) => ({
    ...property,
    matchStatus: 'nearest' as const,
    cons: [
      ...property.cons,
      'Shown as a nearest candidate because the current filters returned no exact matches.',
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
  <p class="sub">Arthur Investment Underwriting Report prepared by Camelot. This report begins with Jackie-validated operating discipline and converts the opportunity into investor-facing underwriting.</p>
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
  <h2>Investment Snapshot</h2>
  <div class="grid">
    <div class="card"><div class="label">Total Basis</div><div class="value">${money(model.totalBasis)}</div></div>
    <div class="card"><div class="label">Equity Required</div><div class="value">${money(model.equityRequired)}</div></div>
    <div class="card"><div class="label">Equity Multiple</div><div class="value">${model.equityMultiple.toFixed(2)}x</div></div>
    <div class="card"><div class="label">DSCR</div><div class="value">${model.dscr.toFixed(2)}x</div></div>
  </div>
  <div class="two">
    <div>
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
  <p class="note">Criteria used: ${normalizedCriteria.dealTypes.map(arthurDealTypeLabel).join(', ')} | ${normalizedCriteria.location} | ${normalizedCriteria.minUnits}-${normalizedCriteria.maxUnits === Number.MAX_SAFE_INTEGER ? 'No max' : normalizedCriteria.maxUnits} units | ${normalizedCriteria.minSqft.toLocaleString()}-${normalizedCriteria.maxSqft === Number.MAX_SAFE_INTEGER ? 'No max' : normalizedCriteria.maxSqft.toLocaleString()} SF.</p>
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
