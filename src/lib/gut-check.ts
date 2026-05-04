/**
 * Gut Check — Instant market comparison for any property
 * Compares a building against Sentinel neighborhood benchmarks:
 * - Value ($/sqft vs neighborhood median)
 * - Neighborhood scores (Invest/Live/Family/Work)
 * - Cost per sqft (common charges, maintenance)
 * - Rental and resale $/sqft benchmarks
 */

import { NEIGHBORHOODS, type SentinelInput, DEFAULT_SENTINEL_INPUT, TRACKED_BUILDINGS } from './sentinel-report';
import type { MasterReportData } from './camelot-report';

export interface GutCheckResult {
  buildingName: string;
  address: string;
  neighborhood: string;
  // Value comparison
  buildingPSF: number;
  neighborhoodCondoPSF: number;
  neighborhoodCoopPSF: number;
  valueDiffPct: number;
  valueStatus: 'Above' | 'At Market' | 'Below';
  // Rental benchmarks
  medianRent1BR: number;
  medianRent2BR: number;
  rentalPSFYear: number;
  daysOnMarket: number;
  yoyChange: number;
  momentum: string;
  // Operating costs
  opexRange: string;
  // Scores
  investScore: number;
  liveScore: number;
  familyScore: number;
  workScore: number;
  // Portfolio context
  isInCamelotPortfolio: boolean;
  camelotPerformance: string;
}

/**
 * Run a Gut Check for any building using Jackie report data
 */
export function runGutCheck(data: MasterReportData): GutCheckResult {
  const hoodName = data.neighborhoodName || '';
  let hoodKey = hoodName.toLowerCase();
  if (/one\s+museum\s+mile|1280\s+(fifth|5th)|museum\s+mile/i.test(`${data.buildingName} ${data.address} ${hoodName}`)) {
    hoodKey = 'East Harlem';
  }

  // Find matching neighborhood. If the source stack cannot identify a specific
  // neighborhood, keep the section useful with a borough-level NYC benchmark.
  const matchedHood = NEIGHBORHOODS.find(n => n.name.toLowerCase() === hoodKey.toLowerCase()) ||
    NEIGHBORHOODS.find(n => hoodKey.includes(n.name.toLowerCase().split('/')[0].trim())) ||
    NEIGHBORHOODS.find(n => n.name.toLowerCase().includes(hoodKey.split(' ')[0]));
  const boroughBenchmark = /brooklyn/i.test(data.borough)
    ? NEIGHBORHOODS.find(n => n.name === 'Brooklyn Heights')
    : /queens/i.test(data.borough)
      ? NEIGHBORHOODS.find(n => n.name === 'Long Island City')
      : NEIGHBORHOODS.find(n => n.name === 'Upper East Side');
  const hood = matchedHood || boroughBenchmark || NEIGHBORHOODS[0];

  // Check if building is in Camelot portfolio
  const tracked = TRACKED_BUILDINGS.find(b =>
    data.address.toLowerCase().includes(b.address.toLowerCase().split(',')[0])
  );

  const buildingPSF = data.buildingArea > 0 && data.marketValue > 0
    ? Math.round(data.marketValue / data.buildingArea)
    : (data.propertyType.toLowerCase().includes('co-op') ? hood.coopPSF : hood.condoPSF);

  const neighborhoodPSF = data.propertyType.toLowerCase().includes('co-op') ? hood.coopPSF : hood.condoPSF;

  const valueDiff = neighborhoodPSF > 0 ? ((buildingPSF - neighborhoodPSF) / neighborhoodPSF) * 100 : 0;

  return {
    buildingName: data.buildingName || data.address,
    address: data.address,
    neighborhood: matchedHood?.name || hoodName || `${data.borough || 'NYC'} benchmark`,
    buildingPSF,
    neighborhoodCondoPSF: hood.condoPSF,
    neighborhoodCoopPSF: hood.coopPSF,
    valueDiffPct: Math.round(valueDiff * 10) / 10,
    valueStatus: valueDiff > 3 ? 'Above' : valueDiff < -3 ? 'Below' : 'At Market',
    medianRent1BR: hood.medianRent1BR,
    medianRent2BR: hood.medianRent2BR,
    rentalPSFYear: Math.round((hood.medianRent1BR * 12) / 750), // approx
    daysOnMarket: hood.daysOnMarket,
    yoyChange: hood.yoyChange,
    momentum: hood.momentum,
    opexRange: hood.opexRange,
    investScore: hood.investScore,
    liveScore: hood.liveScore,
    familyScore: hood.familyScore,
    workScore: hood.workScore,
    isInCamelotPortfolio: !!tracked,
    camelotPerformance: tracked?.performance || '',
  };
}

/**
 * Generate Gut Check HTML section (for embedding in Jackie reports)
 */
export function generateGutCheckHTML(gc: GutCheckResult): string {
  const isAbove = gc.valueStatus === 'Above';
  const isBelow = gc.valueStatus === 'Below';
  const statusColor = isAbove ? '#16a34a' : isBelow ? '#dc2626' : '#B8973A';
  const statusIcon = isAbove ? '▲' : isBelow ? '▼' : '●';

  return `
<!-- GUT CHECK — Market Comparison -->
<div class="section section-white" style="border-left:4px solid ${statusColor}">
<div class="section-title" style="color:${statusColor}">Gut Check — Market Comparison</div>
<div class="section-sub">How ${gc.buildingName} stacks up against ${gc.neighborhood} · Powered by Sentinel</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px">
<div style="background:#0D2240;border-radius:8px;padding:16px;text-align:center;color:#fff">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#B8973A;margin-bottom:6px">This Building</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;color:#B8973A">${gc.buildingPSF > 0 ? '$' + gc.buildingPSF.toLocaleString() : 'TBD'}</div>
<div style="font-size:10px;color:rgba(255,255,255,0.6)">est. $/sqft</div>
</div>
<div style="background:#EDE9DF;border-radius:8px;padding:16px;text-align:center">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:6px">${gc.neighborhood} Median</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;color:#2C3240">$${gc.neighborhoodCondoPSF.toLocaleString()}</div>
<div style="font-size:10px;color:#888">condo $/sqft</div>
</div>
<div style="background:${statusColor};border-radius:8px;padding:16px;text-align:center;color:#fff">
<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">Status</div>
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800">${statusIcon} ${gc.valueDiffPct > 0 ? '+' : ''}${gc.valueDiffPct}%</div>
<div style="font-size:10px;opacity:0.8">${gc.valueStatus}</div>
</div>
</div>

<!-- Market Benchmarks -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px">
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:#B8973A">$${gc.medianRent1BR.toLocaleString()}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">Median 1BR Rent</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:#B8973A">$${gc.medianRent2BR.toLocaleString()}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">Median 2BR Rent</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:#2C3240">${gc.daysOnMarket}d</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">Days on Market</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:${gc.yoyChange > 0 ? '#16a34a' : '#dc2626'}">${gc.yoyChange > 0 ? '+' : ''}${gc.yoyChange}%</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">YoY Change</div>
</div>
</div>

<!-- Neighborhood Scores -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px">
<div style="background:#fff;border:1px solid #D5D0C6;border-radius:6px;padding:10px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#B8973A">${gc.investScore}</div>
<div style="font-size:9px;color:#888">💰 Investment</div>
</div>
<div style="background:#fff;border:1px solid #D5D0C6;border-radius:6px;padding:10px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#1A6B7C">${gc.liveScore}</div>
<div style="font-size:9px;color:#888">🏠 Livability</div>
</div>
<div style="background:#fff;border:1px solid #D5D0C6;border-radius:6px;padding:10px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#16a34a">${gc.familyScore}</div>
<div style="font-size:9px;color:#888">👨‍👩‍👧 Family</div>
</div>
<div style="background:#fff;border:1px solid #D5D0C6;border-radius:6px;padding:10px;text-align:center">
<div style="font-size:20px;font-weight:800;color:#0D2240">${gc.workScore}</div>
<div style="font-size:9px;color:#888">💼 Work</div>
</div>
</div>

<!-- Operating Costs + Momentum -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-size:14px;font-weight:700;color:#2C3240">${gc.opexRange}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">OpEx $/SF/Yr</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-size:14px;font-weight:700;color:${gc.momentum === 'Very Strong' || gc.momentum === 'Strong' ? '#16a34a' : '#B8973A'}">${gc.momentum}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">Price Momentum</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:12px;text-align:center">
<div style="font-size:14px;font-weight:700;color:#B8973A">$${gc.neighborhoodCoopPSF.toLocaleString()}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase">Co-op $/SF</div>
</div>
</div>

${gc.isInCamelotPortfolio ? `
<div style="background:#0D2240;border-radius:8px;padding:12px;color:#fff;text-align:center;margin-top:14px">
<span style="color:#B8973A;font-weight:700">🏰 Camelot Portfolio Building</span> — Performance: <strong>${gc.camelotPerformance}</strong>
</div>` : ''}

<div style="font-size:9px;color:#888;text-align:center;margin-top:10px">Gut Check powered by Sentinel · SCOUT Market Intelligence · Camelot OS</div>
</div>`;
}
