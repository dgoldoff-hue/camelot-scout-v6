/**
 * Camelot OS — External Pitch Report (Version A)
 * Concise 5-7 page building-specific pitch for prospective clients.
 * 
 * Designed as a SALES TOOL, not an encyclopedia.
 * Data-driven, visual, numbered sections, professional.
 */

import type { MasterReportData } from './camelot-report';

function fmt$(n: number): string {
  if (!n) return 'N/A';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(0);
}

function fmtN(n: number | null | undefined): string {
  if (!n) return 'N/A';
  return n.toLocaleString();
}

function violationSeverityBar(classA: number, classB: number, classC: number): string {
  const total = classA + classB + classC;
  if (!total) return '<div style="color:#16a34a;font-weight:600">✓ No open violations on record</div>';
  const pctC = Math.round((classC / total) * 100);
  const pctB = Math.round((classB / total) * 100);
  const pctA = 100 - pctC - pctB;
  return `
    <div style="display:flex;border-radius:6px;overflow:hidden;height:24px;margin:8px 0">
      ${classC ? `<div style="background:#dc2626;width:${pctC}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600">${classC} Critical</div>` : ''}
      ${classB ? `<div style="background:#f59e0b;width:${pctB}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600">${classB} Hazardous</div>` : ''}
      ${classA ? `<div style="background:#3b82f6;width:${pctA}%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600">${classA} Non-Hazardous</div>` : ''}
    </div>
  `;
}

function complianceStatusBadge(status: string | null): string {
  if (!status || status === 'unknown' || status === 'N/A') return '<span style="background:#e5e7eb;color:#6b7280;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600">Not Assessed</span>';
  if (status === 'compliant') return '<span style="background:#dcfce7;color:#166534;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600">✓ Compliant</span>';
  if (status === 'at_risk' || status === 'warning') return '<span style="background:#fef3c7;color:#92400e;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600">⚠ At Risk</span>';
  return '<span style="background:#fee2e2;color:#991b1b;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600">✗ Non-Compliant</span>';
}

/**
 * Generate a concise, visually compelling 5-7 page pitch report.
 * Designed for external use — sending to building owners, boards, and decision makers.
 */
export function generatePitchReport(d: MasterReportData): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const hasViolations = d.violationsTotal > 0;
  const hasLL97 = d.ll97 && d.ll97.period1Penalty > 0;
  const hasECB = d.ecbPenaltyBalance > 0;
  
  // Pain points — dynamically generated based on building data
  const painPoints: string[] = [];
  if (d.violationsOpen > 0) painPoints.push(`<strong>${d.violationsOpen} open HPD violations</strong> requiring resolution — including ${d.violationClassC} Class C (immediately hazardous)`);
  if (hasLL97) painPoints.push(`<strong>LL97 penalty exposure of ${fmt$(d.ll97!.period1Penalty)}/year</strong> starting 2030 — proactive compliance planning needed now`);
  if (hasECB) painPoints.push(`<strong>${fmt$(d.ecbPenaltyBalance)} in outstanding ECB penalties</strong> that need resolution to avoid liens`);
  if (d.permitsCount > 3) painPoints.push(`<strong>${d.permitsCount} active DOB permits</strong> — capital projects require coordinated oversight`);
  if (!d.managementCompany || d.managementCompany === 'Self-Managed') painPoints.push(`<strong>No professional management on record</strong> — self-managed buildings face increasing regulatory complexity`);
  if (d.litigationCount > 0) painPoints.push(`<strong>${d.litigationCount} housing litigation case${d.litigationCount > 1 ? 's' : ''}</strong> on file — proactive legal coordination required`);
  if (painPoints.length === 0) painPoints.push('Building appears well-maintained — Camelot can enhance operational efficiency and add technology-driven services');

  // Neighborhood name cleanup
  const hood = d.neighborhoodName 
    ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : d.borough || 'New York';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Camelot — Property Intelligence Report — ${d.buildingName || d.address}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.6in 0.7in; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none; } .page-break { page-break-before: always; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1a1f36; font-size: 13px; line-height: 1.6; background: #fff; }
  .cover { background: linear-gradient(135deg, #0D2240 0%, #1a3a5c 100%); color: #fff; padding: 60px 50px; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; }
  .cover-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 60px; }
  .cover-logo-text { font-size: 14px; letter-spacing: 4px; color: #B8973A; font-weight: 700; }
  .cover-title { font-size: 42px; font-weight: 800; line-height: 1.15; margin-bottom: 16px; }
  .cover-gold { color: #B8973A; }
  .cover-subtitle { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 40px; }
  .cover-stats { display: flex; gap: 30px; margin-top: 40px; }
  .cover-stat { text-align: center; }
  .cover-stat-val { font-size: 32px; font-weight: 800; color: #B8973A; }
  .cover-stat-lbl { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .cover-footer { font-size: 11px; color: rgba(255,255,255,0.4); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
  
  .page { padding: 40px 50px; }
  .section-num { display: inline-block; background: #0D2240; color: #B8973A; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700; margin-right: 10px; }
  .section-head { font-size: 22px; font-weight: 700; color: #0D2240; margin-bottom: 16px; display: flex; align-items: center; }
  .section-sub { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
  
  .data-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 16px 0; }
  .data-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
  .data-card-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .data-card-value { font-size: 20px; font-weight: 700; color: #0D2240; }
  .data-card-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  
  .pain-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; padding: 10px 14px; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 0 8px 8px 0; }
  .pain-icon { color: #ef4444; font-size: 16px; flex-shrink: 0; margin-top: 2px; }
  .pain-text { font-size: 13px; color: #1f2937; line-height: 1.5; }
  
  .solution-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 0 8px 8px 0; }
  .solution-icon { color: #22c55e; font-size: 16px; flex-shrink: 0; margin-top: 2px; }
  .solution-text { font-size: 13px; color: #1f2937; line-height: 1.5; }
  
  .timeline { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 16px 0; }
  .timeline-phase { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; position: relative; }
  .timeline-phase-num { position: absolute; top: -10px; left: 16px; background: #B8973A; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
  .timeline-phase-title { font-size: 14px; font-weight: 700; color: #0D2240; margin-top: 6px; margin-bottom: 8px; }
  .timeline-phase-items { font-size: 12px; color: #4b5563; line-height: 1.7; }
  
  .cta-box { background: linear-gradient(135deg, #0D2240 0%, #1a3a5c 100%); color: #fff; border-radius: 12px; padding: 30px; margin-top: 24px; text-align: center; }
  .cta-title { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  .cta-sub { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 20px; }
  .cta-contact { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.8; }
  .cta-gold { color: #B8973A; font-weight: 700; }
  
  .footer { text-align: center; font-size: 10px; color: #9ca3af; padding: 16px 0; border-top: 1px solid #e5e7eb; margin-top: 30px; }
  
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  th { background: #0D2240; color: #B8973A; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f9fafb; }
</style>
</head>
<body>

<!-- ========== PAGE 1: COVER ========== -->
<div class="cover">
  <div>
    <div class="cover-logo">
      <div class="cover-logo-text">CAMELOT REALTY GROUP</div>
    </div>
    <div class="cover-title">
      Property Intelligence Report<br>
      <span class="cover-gold">${d.buildingName || d.address}</span>
    </div>
    <div class="cover-subtitle">${d.address}${d.borough ? ' · ' + d.borough.charAt(0).toUpperCase() + d.borough.slice(1) : ''} · ${hood}</div>
    
    <div class="cover-stats">
      <div class="cover-stat">
        <div class="cover-stat-val">${fmtN(d.units) !== 'N/A' ? d.units : '—'}</div>
        <div class="cover-stat-lbl">Units</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">${d.violationsTotal}</div>
        <div class="cover-stat-lbl">HPD Violations</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">${d.violationsOpen}</div>
        <div class="cover-stat-lbl">Open Violations</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">${d.yearBuilt || '—'}</div>
        <div class="cover-stat-lbl">Year Built</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">${fmt$(d.marketValue)}</div>
        <div class="cover-stat-lbl">Market Value</div>
      </div>
    </div>
  </div>
  
  <div class="cover-footer">
    Prepared exclusively for the ownership and board of ${d.buildingName || d.address}<br>
    ${today} · Camelot Realty Group · 501 Madison Avenue, Suite 1400, New York, NY 10022 · (212) 206-9939 · camelot.nyc<br>
    <em>Powered by Camelot OS — The Operating System for Property Management</em>
  </div>
</div>

<!-- ========== PAGE 2: BUILDING SNAPSHOT ========== -->
<div class="page page-break">
  <div class="section-head"><span class="section-num">1</span> Building Snapshot</div>
  <div class="section-sub">Live data from NYC HPD, DOB, DOF, ACRIS, and Energy Star — pulled ${today}</div>
  
  <div class="data-grid">
    <div class="data-card">
      <div class="data-card-label">Address</div>
      <div class="data-card-value" style="font-size:15px">${d.address}</div>
      <div class="data-card-sub">${hood}${d.borough ? ', ' + d.borough.charAt(0).toUpperCase() + d.borough.slice(1) : ''}</div>
    </div>
    <div class="data-card">
      <div class="data-card-label">Units</div>
      <div class="data-card-value">${fmtN(d.units)}</div>
      <div class="data-card-sub">${d.buildingClass || 'Residential'} · ${d.stories || '—'} stories</div>
    </div>
    <div class="data-card">
      <div class="data-card-label">Year Built</div>
      <div class="data-card-value">${d.yearBuilt || 'N/A'}</div>
      <div class="data-card-sub">${d.yearBuilt ? (new Date().getFullYear() - d.yearBuilt) + ' years old' : ''}</div>
    </div>
    <div class="data-card">
      <div class="data-card-label">Market Value</div>
      <div class="data-card-value">${fmt$(d.marketValue)}</div>
      <div class="data-card-sub">Assessed: ${fmt$(d.assessedValue)}</div>
    </div>
    <div class="data-card">
      <div class="data-card-label">Current Management</div>
      <div class="data-card-value" style="font-size:15px">${d.managementCompany || 'Self-Managed'}</div>
      <div class="data-card-sub">${d.registrationOwner ? 'Owner: ' + d.registrationOwner : ''}</div>
    </div>
    <div class="data-card">
      <div class="data-card-label">Owner (DOF)</div>
      <div class="data-card-value" style="font-size:15px">${d.dofOwner || 'N/A'}</div>
      <div class="data-card-sub">${d.lastSaleDate ? 'Last sale: ' + d.lastSaleDate : ''}</div>
    </div>
  </div>
  
  <!-- Violation Summary -->
  <div style="margin-top:24px">
    <div class="section-head"><span class="section-num">2</span> Violation & Compliance Status</div>
    
    <div class="data-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr">
      <div class="data-card" style="text-align:center">
        <div class="data-card-label">Total Violations</div>
        <div class="data-card-value" style="color:${d.violationsTotal > 50 ? '#dc2626' : d.violationsTotal > 10 ? '#f59e0b' : '#16a34a'}">${d.violationsTotal}</div>
      </div>
      <div class="data-card" style="text-align:center">
        <div class="data-card-label">Open</div>
        <div class="data-card-value" style="color:${d.violationsOpen > 10 ? '#dc2626' : '#f59e0b'}">${d.violationsOpen}</div>
      </div>
      <div class="data-card" style="text-align:center">
        <div class="data-card-label">ECB Penalties</div>
        <div class="data-card-value">${fmt$(d.ecbPenaltyBalance)}</div>
      </div>
      <div class="data-card" style="text-align:center">
        <div class="data-card-label">LL97 Status</div>
        <div class="data-card-value" style="font-size:14px">${d.ll97 ? complianceStatusBadge(d.ll97.complianceStatus) : complianceStatusBadge(null)}</div>
      </div>
    </div>
    
    ${violationSeverityBar(d.violationClassA, d.violationClassB, d.violationClassC)}
    
    ${hasLL97 ? `
    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:14px;margin-top:12px">
      <div style="font-weight:700;color:#92400e;font-size:14px">⚠ LL97 Carbon Penalty Exposure</div>
      <div style="font-size:13px;color:#78350f;margin-top:4px">
        Estimated <strong>${fmt$(d.ll97!.period1Penalty)}/year</strong> in penalties starting 2030 (Period 1) and <strong>${fmt$(d.ll97!.period2Penalty)}/year</strong> starting 2035 (Period 2).
        Total 11-year exposure: <strong>${fmt$(d.ll97!.totalExposure11yr)}</strong>.
      </div>
    </div>
    ` : ''}
  </div>
</div>

<!-- ========== PAGE 3: PAIN POINTS + SOLUTIONS ========== -->
<div class="page page-break">
  <div class="section-head"><span class="section-num">3</span> What We Found — Specific to Your Building</div>
  <div class="section-sub">Issues identified through our analysis of ${d.buildingName || d.address}</div>
  
  ${painPoints.map(p => `
    <div class="pain-item">
      <div class="pain-icon">⚠</div>
      <div class="pain-text">${p}</div>
    </div>
  `).join('')}
  
  <div style="margin-top:30px">
    <div class="section-head"><span class="section-num">4</span> How Camelot Solves This</div>
    
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>Violation Resolution Program</strong> — Dedicated compliance team resolves open violations systematically. We've cleared 1,200+ violations across our portfolio in the past 12 months.</div>
    </div>
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>Camelot OS — AI-Powered Monitoring</strong> — Real-time violation and compliance tracking across HPD, DOB, ECB, LL97, FISP, and 311. Your team sees a dashboard, not a spreadsheet.</div>
    </div>
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>LL97 Compliance Planning</strong> — Energy benchmarking, retro-commissioning coordination, and penalty mitigation strategy. We start now so your building is ready for 2030.</div>
    </div>
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>Concierge Plus Resident Portal</strong> — 28-module digital platform for amenity booking, package management, service requests, payments, and board communications.</div>
    </div>
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>BankUnited Treasury Management</strong> — Operating and reserve accounts structured for maximum yield. Zero bank fees. Your money works harder.</div>
    </div>
    <div class="solution-item">
      <div class="solution-icon">✓</div>
      <div class="solution-text"><strong>20+ Years of NYC Expertise</strong> — 130+ buildings managed, 1,500+ units, licensed brokerage, dedicated staff. We sit in board meetings, not behind a desk.</div>
    </div>
  </div>
</div>

<!-- ========== PAGE 4: FIRST 90 DAYS ========== -->
<div class="page page-break">
  <div class="section-head"><span class="section-num">5</span> The First 90 Days — Transition Plan</div>
  <div class="section-sub">What happens from Day 1 when Camelot takes over management of ${d.buildingName || d.address}</div>
  
  <div class="timeline">
    <div class="timeline-phase">
      <div class="timeline-phase-num">Days 1–30</div>
      <div class="timeline-phase-title">Assessment & Setup</div>
      <div class="timeline-phase-items">
        • Full building inspection<br>
        • Vendor contract review<br>
        • Staff evaluation & scheduling<br>
        • Bank account setup (BankUnited)<br>
        • Concierge Plus portal activation<br>
        • Violation audit & resolution plan<br>
        • Board/owner introduction meeting
      </div>
    </div>
    <div class="timeline-phase">
      <div class="timeline-phase-num">Days 31–60</div>
      <div class="timeline-phase-title">Optimization</div>
      <div class="timeline-phase-items">
        • Vendor renegotiation (insurance, cleaning, maintenance)<br>
        • Violation resolution — priority cases<br>
        • LL97/LL84 compliance assessment<br>
        • Capital improvement planning<br>
        • Financial reporting setup<br>
        • Resident communication launch<br>
        • Smart access evaluation (ButterflyMX)
      </div>
    </div>
    <div class="timeline-phase">
      <div class="timeline-phase-num">Days 61–90</div>
      <div class="timeline-phase-title">Results & Reporting</div>
      <div class="timeline-phase-items">
        • First monthly management report<br>
        • Budget vs. actual analysis<br>
        • Violation status update<br>
        • Resident satisfaction baseline<br>
        • Capital project timeline<br>
        • Board presentation — Q1 review<br>
        • Camelot OS dashboard live
      </div>
    </div>
  </div>
  
  <!-- About Camelot -->
  <div style="margin-top:30px">
    <div class="section-head"><span class="section-num">6</span> About Camelot Realty Group</div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
      <div>
        <table>
          <tr><td style="font-weight:600;width:40%">Founded</td><td>2006</td></tr>
          <tr><td style="font-weight:600">Principal</td><td>David A. Goldoff</td></tr>
          <tr><td style="font-weight:600">Buildings Managed</td><td>130+</td></tr>
          <tr><td style="font-weight:600">Units</td><td>1,500+</td></tr>
          <tr><td style="font-weight:600">Coverage</td><td>NYC, Westchester, CT, NJ, FL</td></tr>
          <tr><td style="font-weight:600">Licenses</td><td>NYS Licensed Real Estate Broker</td></tr>
        </table>
      </div>
      <div>
        <div style="font-size:13px;color:#4b5563;line-height:1.7">
          <strong>What sets us apart:</strong><br>
          • <strong>Camelot OS</strong> — proprietary AI-powered management platform<br>
          • <strong>Concierge Plus</strong> — 28-module resident portal<br>
          • <strong>BankUnited partnership</strong> — zero bank fees, maximum yield<br>
          • <strong>Hands-on management</strong> — David personally oversees every property<br>
          • <strong>Compliance expertise</strong> — LL97, FISP, LL84, rent stabilization
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ========== PAGE 5: CTA ========== -->
<div class="page page-break">
  <div class="section-head"><span class="section-num">7</span> Next Steps</div>
  <div class="section-sub">We'd welcome the opportunity to discuss how Camelot can serve ${d.buildingName || d.address}</div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin:20px 0">
    <div style="text-align:center;padding:20px;border:2px solid #0D2240;border-radius:12px">
      <div style="font-size:28px;margin-bottom:8px">📞</div>
      <div style="font-weight:700;color:#0D2240;font-size:14px">Schedule a Call</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">15 minutes to discuss your building's specific needs</div>
    </div>
    <div style="text-align:center;padding:20px;border:2px solid #B8973A;border-radius:12px;background:#fefdf5">
      <div style="font-size:28px;margin-bottom:8px">🏢</div>
      <div style="font-weight:700;color:#0D2240;font-size:14px">Property Tour</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">Walk the building together — see how we assess operations</div>
    </div>
    <div style="text-align:center;padding:20px;border:2px solid #0D2240;border-radius:12px">
      <div style="font-size:28px;margin-bottom:8px">📊</div>
      <div style="font-weight:700;color:#0D2240;font-size:14px">Board Presentation</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px">Full presentation to your board with a customized management proposal</div>
    </div>
  </div>
  
  <div class="cta-box">
    <div class="cta-title">Let's Talk About ${d.buildingName || d.address}</div>
    <div class="cta-sub">We built the tools. We have the team. Now let us show you the difference.</div>
    <div class="cta-contact">
      <span class="cta-gold">David A. Goldoff</span> · Principal<br>
      📧 dgoldoff@camelot.nyc · 📞 (212) 206-9939 ext. 701 · 📱 (646) 523-9068<br>
      🏢 501 Madison Avenue, Suite 1400, New York, NY 10022<br>
      🌐 camelot.nyc
    </div>
  </div>
  
  <div class="footer">
    Prepared for ${d.buildingName || d.address} · ${d.address} · ${today} · Page <span class="page-num"></span><br>
    © ${new Date().getFullYear()} Camelot Realty Group. All rights reserved. Data sourced from NYC Open Data, HPD, DOB, DOF, ACRIS, and Energy Star. Powered by Camelot OS.<br>
    This report is confidential and intended solely for the recipient. Contents are for informational purposes only and do not constitute legal or financial advice.
  </div>
</div>

</body>
</html>`;
}

/**
 * Generate a cover email template for the pitch report
 */
export function generatePitchEmail(d: MasterReportData): string {
  const hasIssues = d.violationsOpen > 0 || (d.ll97 && d.ll97.period1Penalty > 0) || d.ecbPenaltyBalance > 0;
  
  return `Subject: ${d.buildingName || d.address} — Property Intelligence Report from Camelot Realty Group

Dear Board Members,

My name is David Goldoff, and I'm the principal of Camelot Realty Group. I'm reaching out because we recently completed a comprehensive analysis of ${d.buildingName || d.address} at ${d.address}, and I wanted to share what we found.

${hasIssues ? `Our analysis identified several areas that may warrant attention, including ${d.violationsOpen > 0 ? d.violationsOpen + ' open HPD violations' : ''}${d.ll97 && d.ll97.period1Penalty > 0 ? (d.violationsOpen > 0 ? ' and ' : '') + 'LL97 compliance exposure' : ''}. The attached Property Intelligence Report provides the full details.` : `Your building appears to be well-maintained, and I've attached a Property Intelligence Report with our analysis. Even well-run buildings can benefit from Camelot's technology-driven management approach.`}

I'd welcome the opportunity to discuss how Camelot can serve ${d.buildingName || d.address}. We offer a complimentary 30-day property evaluation at no cost and no obligation — our way of demonstrating value upfront.

Would you have 15 minutes this week for a brief conversation?

Best regards,

David A. Goldoff
Principal, Camelot Realty Group
501 Madison Avenue, Suite 1400
New York, NY 10022
(212) 206-9939 ext. 701
dgoldoff@camelot.nyc`;
}
