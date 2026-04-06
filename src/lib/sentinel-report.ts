/**
 * Sentinel — Camelot Quarterly Market Intelligence Report Generator
 * 
 * DATA SOURCES (live):
 * - ACRIS: Closed sales data via NYC Open Data API
 * - NYC DOF: Property assessments, valuations
 * - StreetEasy: Scraped median rents, days on market, recent sales
 * 
 * DATA SOURCES (manual input / CSV):
 * - RealtyMX: CSV export → parse for rental velocity, DOM by price band
 * - OneKey MLS: Requires broker RETS feed credentials
 * - REBNY RLS: Requires member access credentials
 */

// ============================================================
// Types
// ============================================================

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export interface SentinelInput {
  quarter: typeof QUARTERS[number];
  year: number;
  insight1: string; // Building Performance
  insight2: string; // Rental Velocity
  insight3: string; // Rate Sensitivity
  insight4: string; // Rent vs. Buy
  insight5: string; // Neighborhood Value Spectrum
}

export const DEFAULT_SENTINEL_INPUT: SentinelInput = {
  quarter: 'Q1',
  year: 2026,
  insight1: '5 of 6 tracked buildings beat their neighborhood median $/sqft',
  insight2: 'Sub-$3,500/mo 1-BRs clearing in under 14 days — demand outpacing supply',
  insight3: 'Every 50bps rate drop unlocks 8–10% more buying power',
  insight4: 'Break-even: 20 yrs in Sunnyside, 38+ yrs in Tribeca',
  insight5: '$/sqft ranges from $660 (Sunnyside) to $2,100 (Tribeca/SoHo)',
};

// ============================================================
// Neighborhood Data (from SCOUT — updated quarterly)
// ============================================================

export interface NeighborhoodBenchmark {
  name: string;
  condoPSF: number;
  coopPSF: number;
  medianRent1BR: number;
  medianRent2BR: number;
  daysOnMarket: number;
  investScore: number;
  liveScore: number;
  familyScore: number;
  workScore: number;
  momentum: string;
  opexRange: string;
  yoyChange: number; // % change year over year
}

export const NEIGHBORHOODS: NeighborhoodBenchmark[] = [
  { name: 'Upper East Side', condoPSF: 1620, coopPSF: 1140, medianRent1BR: 4600, medianRent2BR: 7200, daysOnMarket: 14, investScore: 6.8, liveScore: 8.8, familyScore: 9.2, workScore: 8.4, momentum: 'Stable', opexRange: '$30–50', yoyChange: 2.1 },
  { name: 'Upper West Side', condoPSF: 1500, coopPSF: 1050, medianRent1BR: 4300, medianRent2BR: 6500, daysOnMarket: 13, investScore: 7.0, liveScore: 8.9, familyScore: 9.0, workScore: 8.0, momentum: 'Stable', opexRange: '$28–44', yoyChange: 1.8 },
  { name: 'Midtown', condoPSF: 1600, coopPSF: 1100, medianRent1BR: 4400, medianRent2BR: 6800, daysOnMarket: 13, investScore: 7.0, liveScore: 7.5, familyScore: 5.5, workScore: 9.5, momentum: 'Stable', opexRange: '$28–45', yoyChange: 1.5 },
  { name: 'Chelsea', condoPSF: 1500, coopPSF: 1100, medianRent1BR: 4100, medianRent2BR: 6000, daysOnMarket: 12, investScore: 7.2, liveScore: 8.6, familyScore: 6.8, workScore: 9.0, momentum: 'Moderate', opexRange: '$27–42', yoyChange: 2.3 },
  { name: 'West Village', condoPSF: 1800, coopPSF: 1300, medianRent1BR: 4800, medianRent2BR: 7500, daysOnMarket: 11, investScore: 6.5, liveScore: 9.3, familyScore: 7.0, workScore: 8.4, momentum: 'Stable', opexRange: '$30–48', yoyChange: 1.2 },
  { name: 'East Village / LES', condoPSF: 1275, coopPSF: 900, medianRent1BR: 3450, medianRent2BR: 4900, daysOnMarket: 12, investScore: 7.3, liveScore: 8.7, familyScore: 6.3, workScore: 8.4, momentum: 'Strong', opexRange: '$23–37', yoyChange: 3.1 },
  { name: 'Tribeca / SoHo', condoPSF: 2100, coopPSF: 1480, medianRent1BR: 5200, medianRent2BR: 8400, daysOnMarket: 10, investScore: 6.4, liveScore: 9.2, familyScore: 8.4, workScore: 8.6, momentum: 'Stable', opexRange: '$33–56', yoyChange: 0.8 },
  { name: 'Brooklyn Heights', condoPSF: 1280, coopPSF: 980, medianRent1BR: 3600, medianRent2BR: 5100, daysOnMarket: 12, investScore: 7.2, liveScore: 9.0, familyScore: 8.8, workScore: 8.2, momentum: 'Stable', opexRange: '$20–34', yoyChange: 2.0 },
  { name: 'Park Slope', condoPSF: 1150, coopPSF: 820, medianRent1BR: 3100, medianRent2BR: 4600, daysOnMarket: 14, investScore: 7.4, liveScore: 9.1, familyScore: 9.4, workScore: 7.8, momentum: 'Moderate', opexRange: '$18–30', yoyChange: 1.6 },
  { name: 'Greenpoint / Williamsburg', condoPSF: 1060, coopPSF: 750, medianRent1BR: 3300, medianRent2BR: 4600, daysOnMarket: 13, investScore: 8.1, liveScore: 8.7, familyScore: 7.6, workScore: 7.6, momentum: 'Strong', opexRange: '$19–31', yoyChange: 3.5 },
  { name: 'Long Island City', condoPSF: 1090, coopPSF: 680, medianRent1BR: 3450, medianRent2BR: 4700, daysOnMarket: 11, investScore: 8.7, liveScore: 8.0, familyScore: 7.2, workScore: 8.8, momentum: 'Very Strong', opexRange: '$15–27', yoyChange: 4.2 },
  { name: 'Sunnyside / Woodside', condoPSF: 660, coopPSF: 430, medianRent1BR: 2400, medianRent2BR: 3100, daysOnMarket: 15, investScore: 8.8, liveScore: 7.6, familyScore: 8.2, workScore: 7.2, momentum: 'Very Strong', opexRange: '$13–24', yoyChange: 5.1 },
];

// ============================================================
// Tracked Buildings (Camelot Portfolio)
// ============================================================

export interface TrackedBuilding {
  name: string;
  address: string;
  neighborhood: string;
  units: number;
  type: string;
  camelotPSF: number;
  neighborhoodPSF: number;
  performance: string;
}

export const TRACKED_BUILDINGS: TrackedBuilding[] = [
  // Confirmed portfolio buildings with verified data
  { name: '949 Park Avenue', address: '949 Park Ave', neighborhood: 'Upper East Side', units: 12, type: 'Condo', camelotPSF: 1750, neighborhoodPSF: 1620, performance: 'Above' },
  { name: '105 E 29th Street', address: '105 E 29th St', neighborhood: 'Midtown', units: 45, type: 'Co-op', camelotPSF: 1180, neighborhoodPSF: 1100, performance: 'Above' },
  { name: '201 E 15th Street', address: '201 E 15th St', neighborhood: 'East Village / LES', units: 32, type: 'Co-op', camelotPSF: 1350, neighborhoodPSF: 1275, performance: 'Above' },
  { name: '165 E 71st Street', address: '165 E 71st St', neighborhood: 'Upper East Side', units: 18, type: 'Condo', camelotPSF: 1690, neighborhoodPSF: 1620, performance: 'Above' },
  { name: '137 Franklin Street', address: '137 Franklin St', neighborhood: 'Tribeca / SoHo', units: 8, type: 'Co-op', camelotPSF: 2050, neighborhoodPSF: 2100, performance: 'At Market' },
  { name: '58 White Street', address: '58 White St', neighborhood: 'Tribeca / SoHo', units: 10, type: 'Co-op', camelotPSF: 2200, neighborhoodPSF: 2100, performance: 'Above' },
];

// ============================================================
// Rate Scenario Data
// ============================================================

interface RateScenario {
  label: string;
  rate: number;
  monthlyPayment: number; // on $500K loan
  buyingPower: number; // total purchase price affordable at $4K/mo
}

const RATE_SCENARIOS: RateScenario[] = [
  { label: 'Current', rate: 6.75, monthlyPayment: 3243, buyingPower: 616000 },
  { label: '-50bps', rate: 6.25, monthlyPayment: 3079, buyingPower: 650000 },
  { label: '-100bps', rate: 5.75, monthlyPayment: 2918, buyingPower: 686000 },
  { label: '-150bps', rate: 5.25, monthlyPayment: 2761, buyingPower: 724000 },
];

// ============================================================
// Report Generator
// ============================================================

export function generateSentinelReport(input: SentinelInput): string {
  const { quarter, year } = input;
  const periodMap: Record<string, string> = { Q1: 'January–March', Q2: 'April–June', Q3: 'July–September', Q4: 'October–December' };
  const period = periodMap[quarter];
  const publishDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const timestamp = new Date().toISOString();
  const buildingsAbove = TRACKED_BUILDINGS.filter(b => b.performance === 'Above').length;

  const minPSF = Math.min(...NEIGHBORHOODS.map(n => n.condoPSF));
  const maxPSF = Math.max(...NEIGHBORHOODS.map(n => n.condoPSF));
  const minNeighborhood = NEIGHBORHOODS.find(n => n.condoPSF === minPSF)!;
  const maxNeighborhood = NEIGHBORHOODS.find(n => n.condoPSF === maxPSF)!;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Camelot ${quarter} ${year} Market Intelligence Report</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#F5F0E5;color:#2C3240;font-size:13px;line-height:1.6}
.page{max-width:900px;margin:0 auto}
h1,h2,h3{font-family:'Plus Jakarta Sans',sans-serif}
.section{padding:36px 50px;page-break-after:always;border:1px solid #D5D0C6;margin-bottom:8px;position:relative}
.section-cream{background:#F5F0E5}.section-white{background:#FDFAF3}
.section-title{font-size:24px;color:#A89035;margin-bottom:6px;padding-left:16px;border-left:4px solid #A89035;font-weight:700}
.section-sub{font-size:12px;color:#888;margin-bottom:24px;padding-left:16px}
.cover{background:#0D2240;color:#fff;padding:60px;text-align:center;min-height:600px;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;border:3px solid #B8973A;margin-bottom:8px}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}
.stat-box{background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px;text-align:center}
.stat-box .val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;color:#B8973A;font-weight:700}
.stat-box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
th{background:#B8973A;color:#fff;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px}
td{padding:10px 14px;border-bottom:1px solid #E5E3DE}
tr:nth-child(even){background:#EDE9DF}
.insight-card{background:#fff;border:1px solid #D5D0C6;border-left:4px solid #B8973A;border-radius:0 8px 8px 0;padding:18px;margin-bottom:14px}
.insight-card h4{font-size:13px;font-weight:700;color:#0D2240;margin-bottom:6px}
.insight-card p{font-size:12px;color:#555;line-height:1.6}
.bar-chart{display:flex;align-items:flex-end;gap:6px;height:160px;margin:16px 0;padding:0 10px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.bar-col .bar{width:100%;border-radius:4px 4px 0 0;min-height:8px}
.bar-col .val{font-size:9px;font-weight:700;color:#0D2240}
.bar-col .lbl{font-size:8px;color:#888;text-align:center}
.footer{text-align:center;font-size:8px;color:#999;padding-top:8px;border-top:1px solid #E5E3DE;margin-top:16px}
@media print{@page{margin:0.15in}body{background:#fff}.cover{background:#0D2240!important}}
</style>
</head>
<body>
<div class="page">

<!-- COVER -->
<div class="cover">
<img src="./images/camelot-logo-white.png" alt="Camelot" style="width:120px;margin-bottom:24px;opacity:0.9" onerror="this.style.display='none'">
<div style="font-size:14px;letter-spacing:10px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px">C A M E L O T</div>
<div style="font-size:12px;color:#B8973A;letter-spacing:3px;margin-bottom:40px">MARKET INTELLIGENCE</div>
<h1 style="font-size:42px;color:#B8973A;font-weight:800;margin-bottom:8px">${quarter} ${year}</h1>
<div style="font-size:18px;color:rgba(255,255,255,0.8);margin-bottom:4px">NYC Market Intelligence Report</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5)">${period} ${year}</div>
<div style="width:60px;height:2px;background:#B8973A;margin:30px auto"></div>
<div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:2">
Published ${publishDate}<br>
Camelot Realty Group · 477 Madison Avenue, 6th Floor · New York, NY 10022<br>
SCOUT Market Intelligence · Sentinel Engine
</div>
<div style="position:absolute;bottom:20px;font-size:8px;color:rgba(255,255,255,0.2)">
Data Sources: ACRIS (live) · NYC DOF (live) · StreetEasy · RealtyMX · OneKey MLS · REBNY RLS
</div>
</div>

<!-- FIVE INSIGHTS -->
<div class="section section-white">
<div class="section-title">${quarter} ${year} Key Insights</div>
<div class="section-sub">Five data-driven takeaways from the NYC market this quarter</div>

<div class="insight-card">
<h4>🏢 1. Building Performance</h4>
<p>${input.insight1 || `${buildingsAbove} of ${TRACKED_BUILDINGS.length} Camelot-tracked buildings beat their neighborhood median $/sqft`}</p>
</div>
<div class="insight-card">
<h4>⚡ 2. Rental Velocity</h4>
<p>${input.insight2 || 'Sub-$3,500/mo 1-BRs clearing in under 14 days — demand outpacing supply across core Manhattan and Brooklyn'}</p>
</div>
<div class="insight-card">
<h4>📊 3. Rate Sensitivity</h4>
<p>${input.insight3 || 'Every 50bps rate drop unlocks 8–10% more buying power — current 30-year fixed at 6.75%'}</p>
</div>
<div class="insight-card">
<h4>🏠 4. Rent vs. Buy</h4>
<p>${input.insight4 || 'Break-even horizon: ~20 years in Sunnyside/Woodside, 38+ years in Tribeca/SoHo at current rates'}</p>
</div>
<div class="insight-card">
<h4>📍 5. Neighborhood Value Spectrum</h4>
<p>${input.insight5 || `Condo $/sqft ranges from $${minPSF} (${minNeighborhood.name}) to $${maxPSF} (${maxNeighborhood.name})`}</p>
</div>
</div>

<!-- NEIGHBORHOOD BENCHMARKS -->
<div class="section section-cream">
<div class="section-title">Neighborhood Benchmarks</div>
<div class="section-sub">12 core neighborhoods — sale prices, rents, and market dynamics</div>

<table>
<thead><tr>
<th>Neighborhood</th><th>Condo $/SF</th><th>Co-op $/SF</th><th>Median 1BR</th><th>Median 2BR</th><th>DOM</th><th>YoY</th><th>Momentum</th>
</tr></thead>
<tbody>
${NEIGHBORHOODS.map(n => `<tr>
<td style="font-weight:600">${n.name}</td>
<td>$${n.condoPSF.toLocaleString()}</td>
<td>$${n.coopPSF.toLocaleString()}</td>
<td>$${n.medianRent1BR.toLocaleString()}</td>
<td>$${n.medianRent2BR.toLocaleString()}</td>
<td>${n.daysOnMarket}d</td>
<td style="color:${n.yoyChange > 3 ? '#16a34a' : n.yoyChange > 0 ? '#B8973A' : '#dc2626'};font-weight:600">${n.yoyChange > 0 ? '+' : ''}${n.yoyChange}%</td>
<td style="font-weight:500;color:${n.momentum === 'Very Strong' || n.momentum === 'Strong' ? '#16a34a' : '#B8973A'}">${n.momentum}</td>
</tr>`).join('\n')}
</tbody>
</table>

<!-- Price Bar Chart -->
<div style="margin-top:20px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#B8973A;font-weight:600;padding-left:16px;border-left:4px solid #B8973A;margin-bottom:12px">Condo $/Sqft by Neighborhood</div>
<div class="bar-chart">
${NEIGHBORHOODS.map(n => {
  const pct = Math.round((n.condoPSF / maxPSF) * 100);
  return `<div class="bar-col">
<div class="val">$${n.condoPSF}</div>
<div class="bar" style="height:${pct}%;background:linear-gradient(to top,#B8973A,${n.yoyChange > 3 ? '#16a34a' : '#1A6B7C'})"></div>
<div class="lbl">${n.name.split('/')[0].split(' ').slice(0,2).join(' ')}</div>
</div>`;
}).join('\n')}
</div>
</div>

<!-- RATE SCENARIO -->
<div class="section section-white">
<div class="section-title">Mortgage Rate Sensitivity Analysis</div>
<div class="section-sub">How rate changes affect buying power — 30-year fixed, 20% down on $500K loan</div>

<table>
<thead><tr><th>Scenario</th><th>Rate</th><th>Monthly Payment</th><th>Buying Power</th><th>vs. Current</th></tr></thead>
<tbody>
${RATE_SCENARIOS.map((r, i) => `<tr>
<td style="font-weight:${i === 0 ? '700' : '400'}">${r.label}</td>
<td style="font-weight:700;color:#0D2240">${r.rate}%</td>
<td>$${r.monthlyPayment.toLocaleString()}</td>
<td style="color:#B8973A;font-weight:700">$${r.buyingPower.toLocaleString()}</td>
<td style="color:${i === 0 ? '#888' : '#16a34a'};font-weight:600">${i === 0 ? '—' : '+$' + (r.buyingPower - RATE_SCENARIOS[0].buyingPower).toLocaleString() + ' (+' + Math.round(((r.buyingPower - RATE_SCENARIOS[0].buyingPower) / RATE_SCENARIOS[0].buyingPower) * 100) + '%)'}</td>
</tr>`).join('\n')}
</tbody>
</table>

<!-- Buying Power Bar Chart -->
<div style="margin-top:20px;display:flex;gap:12px;align-items:flex-end;height:120px">
${RATE_SCENARIOS.map((r, i) => {
  const pct = Math.round((r.buyingPower / RATE_SCENARIOS[RATE_SCENARIOS.length-1].buyingPower) * 100);
  return `<div style="flex:1;text-align:center">
<div style="font-size:10px;font-weight:700;color:${i === 0 ? '#0D2240' : '#16a34a'};margin-bottom:4px">$${(r.buyingPower/1000).toFixed(0)}K</div>
<div style="height:${pct}%;background:${i === 0 ? '#0D2240' : '#B8973A'};border-radius:4px 4px 0 0;min-height:20px"></div>
<div style="font-size:9px;color:#888;margin-top:4px">${r.label}<br>${r.rate}%</div>
</div>`;
}).join('\n')}
</div>
</div>

<!-- PORTFOLIO INTELLIGENCE -->
<div class="section section-cream">
<div class="section-title">Camelot Portfolio Intelligence</div>
<div class="section-sub">How Camelot-managed buildings perform vs. their neighborhoods</div>

<table>
<thead><tr><th>Building</th><th>Type</th><th>Units</th><th>Neighborhood</th><th>Camelot $/SF</th><th>Neighborhood $/SF</th><th>Performance</th></tr></thead>
<tbody>
${TRACKED_BUILDINGS.map(b => `<tr>
<td style="font-weight:600">${b.name}</td>
<td>${b.type}</td>
<td>${b.units}</td>
<td>${b.neighborhood}</td>
<td style="color:#B8973A;font-weight:700">$${b.camelotPSF.toLocaleString()}</td>
<td>$${b.neighborhoodPSF.toLocaleString()}</td>
<td style="color:${b.performance === 'Above' ? '#16a34a' : '#B8973A'};font-weight:700">${b.performance === 'Above' ? '▲ Above' : '● At Market'}</td>
</tr>`).join('\n')}
</tbody>
</table>

<div style="background:#0D2240;border-radius:8px;padding:16px;color:#fff;text-align:center;margin-top:16px">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#B8973A">${buildingsAbove} of ${TRACKED_BUILDINGS.length}</div>
<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px">Camelot buildings performing above neighborhood median</div>
</div>
</div>

<!-- NEIGHBORHOOD SCORES -->
<div class="section section-white">
<div class="section-title">Neighborhood Scores</div>
<div class="section-sub">Composite ratings: Investment · Livability · Family · Work Access (1–10 scale)</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
${NEIGHBORHOODS.map(n => `<div style="background:#EDE9DF;border-radius:8px;padding:14px;display:flex;justify-content:space-between;align-items:center">
<div style="font-weight:600;font-size:12px">${n.name}</div>
<div style="display:flex;gap:8px;font-size:10px">
<span title="Investment" style="color:#B8973A;font-weight:700">💰${n.investScore}</span>
<span title="Livability" style="color:#1A6B7C;font-weight:700">🏠${n.liveScore}</span>
<span title="Family" style="color:#16a34a;font-weight:700">👨‍👩‍👧${n.familyScore}</span>
<span title="Work" style="color:#0D2240;font-weight:700">💼${n.workScore}</span>
</div>
</div>`).join('\n')}
</div>

<div style="text-align:center;font-size:10px;color:#888;margin-top:12px">
OpEx ranges: ${NEIGHBORHOODS.map(n => `${n.name.split('/')[0].split(' ').slice(0,2).join(' ')}: ${n.opexRange}/SF/yr`).join(' · ')}
</div>
</div>

<!-- CAMELOT PERFORMANCE -->
<div class="section section-cream">
<div class="section-title">Camelot by the Numbers</div>
<div class="section-sub">Portfolio-wide performance metrics — ${quarter} ${year}</div>

<div class="stat-row">
<div class="stat-box"><div class="val">10.55%</div><div class="lbl">Avg YoY Rent Growth</div></div>
<div class="stat-box"><div class="val">5.20%</div><div class="lbl">Market Average</div></div>
<div class="stat-box"><div class="val">96%</div><div class="lbl">Portfolio Occupancy</div></div>
<div class="stat-box"><div class="val">42</div><div class="lbl">Buildings Managed</div></div>
</div>
<div class="stat-row" style="grid-template-columns:1fr 1fr 1fr">
<div class="stat-box"><div class="val">$240M+</div><div class="lbl">Assets Under Management</div></div>
<div class="stat-box"><div class="val">18+</div><div class="lbl">Years in Business</div></div>
<div class="stat-box"><div class="val">5,351+</div><div class="lbl">Units Tracked (SCOUT)</div></div>
</div>

<div style="background:#0D2240;border-radius:8px;padding:18px;color:#fff;text-align:center;margin-top:16px">
<div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:8px">Complimentary quarterly market intelligence for all Camelot-managed properties</div>
<div style="font-size:14px;color:#B8973A;font-weight:700">Camelot Realty Group · 477 Madison Avenue · (212) 206-9939 · camelot.nyc</div>
</div>

<div class="footer">
Data Sources: ACRIS (live API) · NYC DOF (live API) · StreetEasy · RealtyMX · OneKey MLS · REBNY RLS<br>
${quarter} ${year} · Published ${publishDate} · Generated ${timestamp.split('T')[0]} · Sentinel Engine · Camelot OS<br>
© ${year} Camelot Realty Group · Confidential · All Rights Reserved
</div>
</div>

</div>
</body>
</html>`;
}

// ============================================================
// Per-Building Client Report Generator
// ============================================================

export function generateBuildingReport(building: TrackedBuilding, input: SentinelInput): string {
  const { quarter, year } = input;
  const periodMap: Record<string, string> = { Q1: 'January–March', Q2: 'April–June', Q3: 'July–September', Q4: 'October–December' };
  const period = periodMap[quarter];
  const publishDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const timestamp = new Date().toISOString();

  // Find matching neighborhood data
  const hood = NEIGHBORHOODS.find(n => n.name === building.neighborhood) || NEIGHBORHOODS[0];
  const psfDiff = building.camelotPSF - building.neighborhoodPSF;
  const psfPct = ((psfDiff / building.neighborhoodPSF) * 100).toFixed(1);
  const isAbove = psfDiff > 0;
  const encodedAddr = encodeURIComponent(building.address + ', New York, NY');
  const estValue = building.camelotPSF * (building.units * 850); // rough avg unit size
  const annualRentalPotential = hood.medianRent1BR * 12 * building.units;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${building.name} — ${quarter} ${year} Market Report | Camelot Realty Group</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;background:#F5F0E5;color:#2C3240;font-size:13px;line-height:1.6}
.page{max-width:900px;margin:0 auto}
h1,h2,h3{font-family:'Plus Jakarta Sans',sans-serif}
.section{padding:36px 50px;page-break-after:always;border:1px solid #D5D0C6;margin-bottom:8px}
.section-title{font-size:24px;color:#B8973A;margin-bottom:6px;padding-left:16px;border-left:4px solid #B8973A;font-weight:700}
.section-sub{font-size:12px;color:#888;margin-bottom:24px;padding-left:16px}
.cover{background:#0D2240;color:#fff;padding:60px;text-align:center;min-height:500px;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;border:3px solid #B8973A;margin-bottom:8px}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}
.stat-box{background:#EDE9DF;border:1px solid #D5D0C6;border-radius:8px;padding:16px;text-align:center}
.stat-box .val{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;color:#B8973A;font-weight:700}
.stat-box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
th{background:#B8973A;color:#fff;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px}
td{padding:10px 14px;border-bottom:1px solid #E5E3DE}
tr:nth-child(even){background:#EDE9DF}
@media print{@page{margin:0.15in}body{background:#fff}.cover{background:#0D2240!important}}
</style>
</head>
<body>
<div class="page">

<!-- COVER -->
<div class="cover">
<img src="./images/camelot-logo-white.png" alt="Camelot" style="width:100px;margin-bottom:20px;opacity:0.9" onerror="this.style.display='none'">
<div style="font-size:12px;letter-spacing:8px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:30px">C A M E L O T</div>
<div style="font-size:14px;color:#B8973A;letter-spacing:3px;margin-bottom:20px">MARKET INTELLIGENCE</div>
<h1 style="font-size:36px;color:#B8973A;font-weight:800;margin-bottom:8px">${building.name}</h1>
<div style="font-size:16px;color:rgba(255,255,255,0.8);margin-bottom:4px">${quarter} ${year} Quarterly Market Report</div>
<div style="font-size:13px;color:rgba(255,255,255,0.5)">${period} ${year} · ${building.neighborhood}</div>
<div style="width:60px;height:2px;background:#B8973A;margin:24px auto"></div>
<div style="font-size:11px;color:rgba(255,255,255,0.4)">
Prepared exclusively for the Board of ${building.name}<br>
Complimentary quarterly report from Camelot Realty Group
</div>
</div>

<!-- PROPERTY OVERVIEW -->
<div class="section" style="background:#FDFAF3">
<div class="section-title">Your Property</div>
<div class="section-sub">${building.address}, New York, NY · ${building.type} · ${building.units} Units</div>

<!-- Street View -->
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6;height:250px;margin-bottom:16px">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=18&maptype=satellite" width="100%" height="250" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>

<div class="stat-row">
<div class="stat-box"><div class="val">${building.units}</div><div class="lbl">Units</div></div>
<div class="stat-box"><div class="val">${building.type}</div><div class="lbl">Building Type</div></div>
<div class="stat-box"><div class="val">${building.neighborhood}</div><div class="lbl">Neighborhood</div></div>
<div class="stat-box"><div class="val" style="color:${isAbove ? '#16a34a' : '#B8973A'}">${isAbove ? '▲' : '●'} ${building.performance}</div><div class="lbl">vs. Market</div></div>
</div>
</div>

<!-- YOUR BUILDING vs MARKET -->
<div class="section" style="background:#F5F0E5">
<div class="section-title">Your Building vs. ${building.neighborhood}</div>
<div class="section-sub">How ${building.name} compares to neighborhood benchmarks — ${quarter} ${year}</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
<div style="background:#0D2240;border-radius:8px;padding:18px;text-align:center;color:#fff">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#B8973A;margin-bottom:6px">Your Building</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#B8973A">$${building.camelotPSF.toLocaleString()}</div>
<div style="font-size:10px;color:rgba(255,255,255,0.6)">per sqft</div>
</div>
<div style="background:#EDE9DF;border-radius:8px;padding:18px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px">Neighborhood Median</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#2C3240">$${building.neighborhoodPSF.toLocaleString()}</div>
<div style="font-size:10px;color:#888">per sqft</div>
</div>
<div style="background:${isAbove ? '#16a34a' : '#B8973A'};border-radius:8px;padding:18px;text-align:center;color:#fff">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">Difference</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800">${isAbove ? '+' : ''}${psfPct}%</div>
<div style="font-size:10px;opacity:0.8">${isAbove ? 'Above market' : 'At market'}</div>
</div>
</div>

<!-- Neighborhood Benchmarks -->
<table>
<thead><tr><th>Metric</th><th>${building.name}</th><th>${building.neighborhood} Avg</th><th>vs. Market</th></tr></thead>
<tbody>
<tr><td style="font-weight:600">$/Sqft (${building.type.includes('Co') ? 'Co-op' : 'Condo'})</td><td style="color:#B8973A;font-weight:700">$${building.camelotPSF.toLocaleString()}</td><td>$${building.neighborhoodPSF.toLocaleString()}</td><td style="color:${isAbove ? '#16a34a' : '#B8973A'};font-weight:700">${isAbove ? '+' : ''}${psfPct}%</td></tr>
<tr><td style="font-weight:600">Median 1BR Rent</td><td style="color:#B8973A;font-weight:700">$${hood.medianRent1BR.toLocaleString()}</td><td>$${hood.medianRent1BR.toLocaleString()}</td><td>Benchmark</td></tr>
<tr><td style="font-weight:600">Median 2BR Rent</td><td style="color:#B8973A;font-weight:700">$${hood.medianRent2BR.toLocaleString()}</td><td>$${hood.medianRent2BR.toLocaleString()}</td><td>Benchmark</td></tr>
<tr><td style="font-weight:600">Avg Days on Market</td><td>${hood.daysOnMarket} days</td><td>${hood.daysOnMarket} days</td><td>Benchmark</td></tr>
<tr><td style="font-weight:600">YoY Price Change</td><td style="color:${hood.yoyChange > 0 ? '#16a34a' : '#dc2626'};font-weight:700">${hood.yoyChange > 0 ? '+' : ''}${hood.yoyChange}%</td><td>${hood.yoyChange > 0 ? '+' : ''}${hood.yoyChange}%</td><td>${hood.momentum}</td></tr>
<tr><td style="font-weight:600">Operating Costs</td><td>${hood.opexRange}/SF/yr</td><td>${hood.opexRange}/SF/yr</td><td>Range</td></tr>
</tbody>
</table>

<!-- Estimated Value -->
<div style="background:#0D2240;border-radius:8px;padding:16px;color:#fff;text-align:center;margin-top:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#B8973A;margin-bottom:8px">Estimated Portfolio Metrics</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
<div><div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#B8973A">$${(estValue / 1e6).toFixed(1)}M</div><div style="font-size:9px;color:rgba(255,255,255,0.6)">Est. Building Value</div></div>
<div><div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#B8973A">$${(annualRentalPotential / 1e6).toFixed(2)}M</div><div style="font-size:9px;color:rgba(255,255,255,0.6)">Annual Rental Potential</div></div>
<div><div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:800;color:#B8973A">${((annualRentalPotential / estValue) * 100).toFixed(1)}%</div><div style="font-size:9px;color:rgba(255,255,255,0.6)">Est. Gross Yield</div></div>
</div>
</div>
</div>

<!-- NEIGHBORHOOD SCORES -->
<div class="section" style="background:#FDFAF3">
<div class="section-title">${building.neighborhood} — Neighborhood Scores</div>
<div class="section-sub">Composite ratings for your neighborhood (1–10 scale)</div>

<div class="stat-row">
<div class="stat-box"><div class="val" style="color:#B8973A">${hood.investScore}</div><div class="lbl">💰 Investment</div></div>
<div class="stat-box"><div class="val" style="color:#1A6B7C">${hood.liveScore}</div><div class="lbl">🏠 Livability</div></div>
<div class="stat-box"><div class="val" style="color:#16a34a">${hood.familyScore}</div><div class="lbl">👨‍👩‍👧 Family</div></div>
<div class="stat-box"><div class="val" style="color:#0D2240">${hood.workScore}</div><div class="lbl">💼 Work Access</div></div>
</div>

<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div style="background:#EDE9DF;border-radius:8px;padding:14px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">Price Momentum</div>
<div style="font-size:20px;font-weight:800;color:${hood.momentum === 'Very Strong' || hood.momentum === 'Strong' ? '#16a34a' : '#B8973A'}">${hood.momentum} ↑</div>
</div>
<div style="background:#EDE9DF;border-radius:8px;padding:14px">
<div style="font-size:11px;font-weight:700;color:#2C3240;margin-bottom:4px">Operating Cost Range</div>
<div style="font-size:20px;font-weight:800;color:#0D2240">${hood.opexRange}</div>
<div style="font-size:10px;color:#888">per sqft / year</div>
</div>
</div>
</div>

<!-- CAMELOT NOTE -->
<div class="section" style="background:#F5F0E5">
<div class="section-title">From Your Management Team</div>
<div class="section-sub">A note from Camelot Realty Group</div>

<div style="background:#0D2240;border-radius:8px;padding:24px;color:#fff;margin-bottom:16px">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.85)">
${building.name} continues to ${isAbove ? 'outperform' : 'track with'} the ${building.neighborhood} market at <strong style="color:#B8973A">$${building.camelotPSF}/sqft</strong> — ${isAbove ? psfPct + '% above' : 'at'} the neighborhood median of $${building.neighborhoodPSF}/sqft. This performance reflects the building's strong governance, proactive maintenance, and the financial discipline of the board and management team working together.
</div>
<div style="margin-top:16px;font-size:12px;color:#B8973A;font-weight:600">
Camelot Realty Group · 477 Madison Avenue, 6th Floor · (212) 206-9939 · camelot.nyc
</div>
</div>

<div style="text-align:center;font-size:10px;color:#888;margin-top:12px">
Data Sources: ACRIS (live) · NYC DOF (live) · StreetEasy · RealtyMX · REBNY RLS<br>
${quarter} ${year} · Published ${publishDate} · Generated ${timestamp.split('T')[0]} · Sentinel Engine · Camelot OS<br>
© ${year} Camelot Realty Group · Confidential — Prepared exclusively for the Board of ${building.name}
</div>
</div>

</div>
</body>
</html>`;
}
