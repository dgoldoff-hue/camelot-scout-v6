/**
 * Camelot OS — External Pitch Deck (Slide Format)
 * Matches the 155-24 89th Street reference deck design exactly.
 * 16:9 widescreen slides, charcoal cover, cream content, gold accents.
 * 
 * All data is 100% dynamic — pulled live from NYC APIs per address.
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

function inferBuildingDescription(d: MasterReportData): string {
  const parts: string[] = [];
  if (d.units) parts.push(`${d.units} Units`);
  if (d.propertyType) parts.push(d.propertyType);
  else if (d.isRentStabilized) parts.push('Rent Stabilized');
  if (d.yearBuilt) parts.push(`Est. ${d.yearBuilt}`);
  return parts.join('  |  ') || 'Residential Property';
}

function neighborhoodName(d: MasterReportData): string {
  if (!d.neighborhoodName) return d.borough ? d.borough.charAt(0).toUpperCase() + d.borough.slice(1) : 'New York';
  return d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Generate a widescreen pitch deck matching Camelot's reference design.
 * Opens in browser as printable slides (Ctrl+P → Save as PDF).
 */
export function generatePitchReport(d: MasterReportData): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const hood = neighborhoodName(d);
  const boroDisplay = d.borough ? d.borough.charAt(0).toUpperCase() + d.borough.slice(1) : 'New York';
  const bldgDesc = inferBuildingDescription(d);
  const hasViolations = d.violationsTotal > 0;
  const hasLL97 = d.ll97 && d.ll97.period1Penalty > 0;
  const mgmt = d.managementCompany || 'Self-Managed';
  
  // Street view URLs
  // Use address-based Street View (no geocode dependency)
  const svUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${encodeURIComponent(d.address + ', New York, NY')}&fov=90&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;

  // Dynamic pain points for "A Fresh Set of Eyes" slide
  const hookLines: string[] = [];
  if (d.violationsOpen > 0) hookLines.push(`${d.violationsOpen} open HPD violations that need attention`);
  if (hasLL97) hookLines.push(`LL97 carbon penalty exposure starting 2030`);
  if (d.ecbPenaltyBalance > 0) hookLines.push(`${fmt$(d.ecbPenaltyBalance)} in outstanding ECB penalties`);
  if (d.permitsCount > 3) hookLines.push(`${d.permitsCount} active capital projects requiring oversight`);
  
  const hookText = hookLines.length > 0
    ? `${d.buildingName || d.address} deserves a partner that brings renewed energy, proactive capital planning, and the hands-on attention your community needs — with in-house legal counsel, engineering advisory, and CPAs included at no extra cost.`
    : `${d.buildingName || d.address} deserves a management partner that combines boutique attention with institutional-grade financial and compliance services — with in-house legal counsel, engineering advisory, and CPAs included at no extra cost.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Camelot — Management Proposal — ${d.buildingName || d.address}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: 13.33in 7.5in; margin: 0; }
  @media print { .slide { page-break-after: always; } .slide:last-child { page-break-after: auto; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1a1f36; font-size: 16px; line-height: 1.6; background: #e0e0e0; }
  
  .slide { width: 1280px; height: 720px; margin: 20px auto; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .slide-cream { background: #FAF8F5; }
  .slide-dark { background: #3D4F5F; color: #fff; }
  
  /* Camelot logo badge — top right */
  .logo-badge { position: absolute; top: 0; right: 0; width: 130px; height: 80px; background: #B8973A; display: flex; align-items: center; justify-content: center; }
  .logo-badge-text { color: #fff; font-family: 'Plus Jakarta Sans'; font-size: 14px; font-weight: 700; letter-spacing: 4px; text-align: center; line-height: 1.3; }
  .logo-badge-sub { font-size: 7px; letter-spacing: 3px; font-weight: 400; display: block; margin-top: 2px; }
  
  /* Section title with gold left bar */
  .section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 42px; font-weight: 400; font-style: italic; color: #B8973A; padding-left: 20px; border-left: 4px solid #B8973A; line-height: 1.2; margin-bottom: 24px; }
  
  /* Navy bold subheading */
  .sub-heading { font-family: 'Plus Jakarta Sans'; font-size: 22px; font-weight: 700; color: #1a2744; margin-bottom: 12px; }
  
  /* Body text */
  .body-text { font-size: 16px; color: #4a5568; line-height: 1.7; }
  .body-italic { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #B8973A; font-size: 17px; }
  
  /* Gold-bordered cards */
  .gold-card { border: 1px solid #B8973A; border-left: 4px solid #B8973A; background: #fff; padding: 20px 24px; border-radius: 2px; margin-bottom: 12px; }
  
  /* Stat boxes */
  .stat-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
  .stat-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40px; font-weight: 600; color: #B8973A; }
  .stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
  
  /* Check items */
  .check-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 16px; color: #1a2744; }
  .check-icon { width: 24px; height: 24px; background: #B8973A; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; flex-shrink: 0; }
  
  /* Comparison table */
  .cmp-table { width: 100%; border-collapse: collapse; }
  .cmp-table th { padding: 12px 20px; font-size: 16px; font-weight: 700; text-align: center; }
  .cmp-table th.cml { background: #B8973A; color: #fff; }
  .cmp-table th.other { background: #f3f4f6; color: #6b7280; }
  .cmp-table td { padding: 10px 20px; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
  .cmp-table td.cml { background: #fefdf5; font-weight: 600; color: #1a2744; }
  .cmp-table td.other { color: #6b7280; }
  
  /* Quote card */
  .quote-card { border-left: 4px solid #B8973A; background: #fff; padding: 24px 28px; margin-bottom: 16px; }
  .quote-mark { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 48px; color: #B8973A; line-height: 0.5; }
  .quote-text { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 18px; color: #4a5568; line-height: 1.6; margin: 12px 0; }
  .quote-author { font-weight: 700; color: #B8973A; font-size: 15px; }
  .quote-role { color: #6b7280; font-size: 13px; }
  
  /* Fee table */
  .fee-table { width: 100%; border-collapse: collapse; }
  .fee-table th { background: #1a2744; color: #B8973A; padding: 10px 20px; text-align: left; font-size: 14px; }
  .fee-table td { padding: 10px 20px; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
  .fee-table td.gold { color: #B8973A; font-weight: 600; }
  
  /* Timeline phases */
  .phase-card { background: #fff; border: 1px solid #e5e7eb; border-top: 4px solid #B8973A; padding: 20px; }
  .phase-title { font-size: 18px; font-weight: 700; color: #1a2744; margin-bottom: 8px; }
  .phase-sub { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
  .phase-items { font-size: 14px; color: #4a5568; line-height: 1.8; }
  
  .pad { padding: 50px 60px; }
  .pad-top { padding-top: 50px; }
</style>
</head>
<body>

<!-- SLIDE 1: Cover (Dark with Street View background) -->
<div class="slide slide-dark" style="background:linear-gradient(135deg, rgba(13,34,64,0.85) 0%, rgba(61,79,95,0.80) 100%), url('${svUrl}') center/cover no-repeat; background-size:cover;">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div style="display:flex;height:100%">
    <!-- Left side: text -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px 40px 60px 60px">
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;letter-spacing:10px;font-weight:400;margin-bottom:4px">C A M E L O T</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#B8973A;font-style:italic;margin-bottom:50px">Property Management</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:3px;margin-bottom:10px">Property Intelligence Report</div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:44px;color:#B8973A;font-style:italic;font-weight:600;margin-bottom:12px;line-height:1.15">${d.buildingName || d.address}</div>
      <div style="font-size:16px;color:rgba(255,255,255,0.7);margin-bottom:40px">${d.address} · ${hood} · ${boroDisplay}</div>
      <div style="display:flex;gap:28px">
        <div><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600;color:#B8973A">${d.units || '—'}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Units</div></div>
        <div><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600;color:#B8973A">${d.violationsTotal}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">HPD Violations</div></div>
        <div><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600;color:${d.violationsOpen > 0 ? '#ef4444' : '#B8973A'}">${d.violationsOpen}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Open</div></div>
        <div><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600;color:#B8973A">${d.yearBuilt || '—'}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Year Built</div></div>
        ${d.marketValue ? `<div><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:600;color:#B8973A">${fmt$(d.marketValue)}</div><div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px">Market Value</div></div>` : ''}
      </div>
    </div>
    <!-- Right side: building photo -->
    <div style="flex:0 0 440px;display:flex;align-items:center;justify-content:center;padding:40px 50px 40px 0">
      <img src="${svUrl}" style="width:400px;height:500px;object-fit:cover;border-radius:6px;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:2px solid rgba(184,151,58,0.3)" onerror="this.parentElement.style.display='none'" />
    </div>
  </div>
  <div style="position:absolute;bottom:20px;left:60px;right:60px;font-size:11px;color:rgba(255,255,255,0.35);border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
    Prepared exclusively for the ownership and board of ${d.buildingName || d.address} · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Camelot Realty Group · 501 Madison Avenue, Suite 1400, NYC · (212) 206-9939 · Powered by Camelot OS
  </div>
</div>

<!-- SLIDE 2: A Fresh Set of Eyes -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center;padding:80px 120px">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:52px;font-style:italic;color:#B8973A;margin-bottom:20px">A Fresh Set of Eyes</div>
    <div style="width:60px;height:3px;background:#B8973A;margin-bottom:30px"></div>
    <div style="font-size:18px;color:#4a5568;line-height:1.8;max-width:900px">${hookText}</div>
  </div>
</div>

<!-- SLIDE 3: The Property -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">The Property</div>
    <div style="display:flex;gap:40px">
      <div style="flex:1">
        <div class="sub-heading">${d.buildingName || d.address}</div>
        <div class="body-text" style="margin-bottom:16px">
          ${d.units ? `At ${d.units} units, ${d.buildingName || d.address} is the ideal scale for Camelot's high-touch management — small enough that every ${d.isRentStabilized ? 'tenant' : 'shareholder'} is known by name, large enough to benefit from institutional-grade financial and compliance services.` : `${d.buildingName || d.address} is well-suited for Camelot's hands-on management approach — combining personal attention with institutional-grade services.`}
        </div>
        <div style="font-size:15px;color:#4a5568;line-height:2.2">
          ${d.yearBuilt ? `Built c. ${d.yearBuilt}  |  ` : ''}${d.propertyType || 'Residential'}${d.stories ? `  |  ${d.stories} Stories` : ''}<br>
          ${d.units ? `${d.units} Units  |  ${hood}` : hood}<br>
          ${d.managementCompany ? `Current Management: ${d.managementCompany}` : 'Currently Self-Managed'}<br>
          ${d.marketValue ? `Market Value: ${fmt$(d.marketValue)}` : ''}${d.assessedValue ? `  |  Assessed: ${fmt$(d.assessedValue)}` : ''}<br>
          ${d.dofOwner ? `Owner (DOF): ${d.dofOwner}` : ''}
        </div>
        ${d.isRentStabilized ? `<div class="body-italic" style="margin-top:12px">Rent stabilized — Camelot has deep DHCR & RGB expertise</div>` : ''}
      </div>
      <div style="flex:0 0 420px">
        ${svUrl ? `<img src="${svUrl}" style="width:420px;height:280px;object-fit:cover;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1)" onerror="this.style.display='none'" />` : '<div style="width:420px;height:280px;background:#e5e7eb;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:14px">Building Photo</div>'}
      </div>
    </div>
  </div>
</div>

<!-- SLIDE 4: Building Intelligence (Dynamic Data) -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">Building Intelligence</div>
    <div style="font-size:14px;color:#6b7280;margin-bottom:20px">Live data from NYC HPD, DOB, DOF, ACRIS & Energy Star — ${today}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:24px">
      <div class="stat-box"><div class="stat-val">${d.violationsTotal}</div><div class="stat-label">Total HPD Violations</div></div>
      <div class="stat-box"><div class="stat-val" style="${d.violationsOpen > 10 ? 'color:#dc2626' : ''}">${d.violationsOpen}</div><div class="stat-label">Open Violations</div></div>
      <div class="stat-box"><div class="stat-val">${fmt$(d.ecbPenaltyBalance)}</div><div class="stat-label">ECB Penalties</div></div>
      <div class="stat-box"><div class="stat-val">${d.ll97 ? (d.ll97.complianceStatus === 'compliant' ? '✓' : '⚠') : '—'}</div><div class="stat-label">LL97 Status</div></div>
    </div>
    ${hasViolations ? `
    <div style="display:flex;gap:20px;margin-bottom:16px">
      ${d.violationClassC ? `<div style="flex:${d.violationClassC};background:#dc2626;color:#fff;padding:8px 12px;text-align:center;border-radius:4px;font-size:13px;font-weight:600">${d.violationClassC} Class C — Critical</div>` : ''}
      ${d.violationClassB ? `<div style="flex:${d.violationClassB};background:#f59e0b;color:#fff;padding:8px 12px;text-align:center;border-radius:4px;font-size:13px;font-weight:600">${d.violationClassB} Class B — Hazardous</div>` : ''}
      ${d.violationClassA ? `<div style="flex:${d.violationClassA};background:#3b82f6;color:#fff;padding:8px 12px;text-align:center;border-radius:4px;font-size:13px;font-weight:600">${d.violationClassA} Class A</div>` : ''}
    </div>` : ''}
    ${hasLL97 ? `
    <div style="background:#fefdf5;border:1px solid #B8973A;border-radius:4px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
      <div><strong style="color:#92400e">LL97 Carbon Penalty Exposure</strong><br><span style="font-size:14px;color:#78350f">Penalties begin 2030 — proactive compliance planning needed now</span></div>
      <div style="text-align:right"><div style="font-size:28px;font-weight:700;color:#dc2626">${fmt$(d.ll97!.period1Penalty)}<span style="font-size:14px;color:#6b7280">/year</span></div><div style="font-size:12px;color:#6b7280">11-Year Exposure: ${fmt$(d.ll97!.totalExposure11yr)}</div></div>
    </div>` : ''}
  </div>
</div>

<!-- SLIDE 5: Why Camelot (Comparison Table) -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">Why Camelot</div>
    <div style="font-size:17px;font-weight:700;color:#1a2744;margin-bottom:20px">The institutional power of a full-service firm. The accountability of a dedicated partner.</div>
    <table class="cmp-table">
      <tr><th class="other">Large Firms</th><th class="cml">Camelot</th><th class="other">Solo Operators</th></tr>
      <tr><td class="other">Your building is one of 500+</td><td class="cml">Your building is a priority</td><td class="other">Limited staff, limited hours</td></tr>
      <tr><td class="other">Same PM for decades, no fresh ideas</td><td class="cml">Fresh set of eyes, proactive strategy</td><td class="other">One person handles everything</td></tr>
      <tr><td class="other">Slow response, layers of bureaucracy</td><td class="cml">Direct access to senior leadership</td><td class="other">Unavailable nights & weekends</td></tr>
      <tr><td class="other">No capital improvement planning</td><td class="cml">Capital roadmap + financing guidance</td><td class="other">Reactive, not proactive</td></tr>
      <tr><td class="other">Outsourced accounting, no legal/eng</td><td class="cml">In-house CPAs + free attorney + engineer</td><td class="other">Basic bookkeeping, no advisors</td></tr>
      <tr><td class="other">No proprietary tech</td><td class="cml">Merlin AI + Camelot OS + ConciergePlus</td><td class="other">Paper-based systems</td></tr>
    </table>
    <div class="body-italic" style="margin-top:16px">Boutique scale. Institutional capability. Owner's mentality.</div>
  </div>
</div>

<!-- SLIDE 6: About Camelot -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">About Camelot</div>
    <div style="font-size:17px;font-weight:700;color:#1a2744;margin-bottom:8px">Our mission is simple: to protect, enhance, and elevate the value of every property we manage through transparency, precision, and proactive hands-on care.</div>
    <div class="body-text" style="margin-bottom:24px">Since 2006, Camelot Realty Group has built a reputation as one of New York's premier boutique property management firms — blending hands-on service, financial expertise, and innovative technology to deliver exceptional results.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="stat-box"><div class="stat-val">130+</div><div class="stat-label">Properties Managed</div></div>
      <div class="stat-box"><div class="stat-val">$500M+</div><div class="stat-label">Transactions Closed</div></div>
      <div class="stat-box"><div class="stat-val">18+</div><div class="stat-label">Years in Business</div></div>
      <div class="stat-box"><div class="stat-val">$1.5B+</div><div class="stat-label">Assets Under Management</div></div>
    </div>
    <div style="font-size:14px;color:#B8973A;margin-bottom:4px">⭐ RED Awards 2025: Property Management Company of the Year  |  REBNY 2025: David Goldoff Leadership Award</div>
    <div style="font-size:13px;color:#6b7280">Member: REBNY | SPONY | NYARM | IREM | BOMA | NARPM | NY Apartment Association</div>
  </div>
</div>

<!-- SLIDE 7: Core Services -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">Core Services</div>
    <div class="body-text" style="margin-bottom:20px">Comprehensive management with ${d.propertyType ? d.propertyType.toLowerCase() : 'residential'} expertise and hands-on capital project oversight.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="gold-card"><div class="sub-heading" style="font-size:17px">Property & Asset Management</div><div style="font-size:14px;color:#4a5568">Twice-monthly site visits, vendor coordination, proactive inspections, cost reduction. Buildings treated like owner-managed assets.</div></div>
      <div class="gold-card"><div class="sub-heading" style="font-size:17px">In-House CPA & Financials</div><div style="font-size:14px;color:#4a5568">Dedicated CPAs — never outsourced. Monthly board-ready reports, 5-year capital planning, mortgage financing guidance.</div></div>
      <div class="gold-card"><div class="sub-heading" style="font-size:17px">Compliance & Risk Management</div><div style="font-size:14px;color:#4a5568">HPD, RPIE, boiler registration, fire safety, LL97 compliance. Free engineering advisory on building envelope and local law issues.</div></div>
      <div class="gold-card"><div class="sub-heading" style="font-size:17px">Technology Platform</div><div style="font-size:14px;color:#4a5568">Camelot OS + ConciergePlus + Merlin AI — real-time compliance monitoring, resident portal, AI meeting minutes, zero bank fees.</div></div>
    </div>
  </div>
</div>

<!-- SLIDE 8: Compliance & LL97 -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">Compliance & Local Law 97</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:28px">
      <div class="stat-box"><div style="font-weight:700;color:#1a2744;font-size:15px;margin-bottom:4px">JANUARY</div><div style="font-size:13px;color:#B8973A;font-weight:600">Tax Appeals</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Strategic filing to reduce assessments.</div></div>
      <div class="stat-box"><div style="font-weight:700;color:#1a2744;font-size:15px;margin-bottom:4px">JUNE</div><div style="font-size:13px;color:#B8973A;font-weight:600">RPIE Filings</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Data accuracy for income and expense.</div></div>
      <div class="stat-box"><div style="font-weight:700;color:#1a2744;font-size:15px;margin-bottom:4px">SEPTEMBER</div><div style="font-size:13px;color:#B8973A;font-weight:600">HPD Registration</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Multi-family compliance and status.</div></div>
      <div class="stat-box"><div style="font-weight:700;color:#1a2744;font-size:15px;margin-bottom:4px">DECEMBER</div><div style="font-size:13px;color:#B8973A;font-weight:600">Budgeting</div><div style="font-size:12px;color:#6b7280;margin-top:4px">Capital calls and operating plans.</div></div>
    </div>
    ${hasLL97 || d.permitsCount > 0 ? `
    <div class="sub-heading">Building-Specific Compliance Needs — ${d.buildingName || d.address}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${hasLL97 ? `<div class="gold-card"><strong>LL97 Energy Compliance</strong><br><span style="font-size:14px;color:#4a5568">Estimated penalty: ${fmt$(d.ll97!.period1Penalty)}/year. Camelot develops and executes a compliance roadmap.</span></div>` : ''}
      ${d.violationsOpen > 0 ? `<div class="gold-card"><strong>Violation Resolution</strong><br><span style="font-size:14px;color:#4a5568">${d.violationsOpen} open violations to resolve. Systematic remediation with certified contractors.</span></div>` : ''}
      ${d.permitsCount > 0 ? `<div class="gold-card"><strong>Capital Project Oversight</strong><br><span style="font-size:14px;color:#4a5568">${d.permitsCount} active DOB permits. Full project management, vendor bidding, timeline control.</span></div>` : ''}
      <div class="gold-card"><strong>FISP / Facade Compliance</strong><br><span style="font-size:14px;color:#4a5568">Cycle tracking, engineer coordination, sidewalk shed management.</span></div>
    </div>` : ''}
  </div>
</div>

<!-- SLIDE 9: Technology Platform -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">Technology Platform</div>
    <div class="body-text" style="margin-bottom:20px">Merlin AI + Camelot OS + ConciergePlus — modern tools that respect your ${d.isRentStabilized ? "tenants'" : "shareholders'"} preferences.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div class="gold-card" style="padding:24px">
        <div class="sub-heading">For Board & Management</div>
        <div class="check-item"><div class="check-icon">✓</div> Group and individual messaging</div>
        <div class="check-item"><div class="check-icon">✓</div> Utility usage tracking</div>
        <div class="check-item"><div class="check-icon">✓</div> Building files access</div>
        <div class="check-item"><div class="check-icon">✓</div> Compliance status updates</div>
        <div class="check-item"><div class="check-icon">✓</div> AI-powered meeting minutes</div>
      </div>
      <div class="gold-card" style="padding:24px">
        <div class="sub-heading">For Residents</div>
        <div class="check-item"><div class="check-icon">✓</div> ConciergePlus portal + mobile app</div>
        <div class="check-item"><div class="check-icon">✓</div> Pay maintenance online — zero bank fees</div>
        <div class="check-item"><div class="check-icon">✓</div> AI chatbot support 24/7</div>
        <div class="check-item"><div class="check-icon">✓</div> Download building documents</div>
        <div class="check-item"><div class="check-icon">✓</div> Traditional paper statements still supported</div>
      </div>
    </div>
    <div style="font-size:12px;color:#6b7280;margin-top:16px">Powered by: OpenAI NLP  |  AWS Cloud  |  AppFolio Sync  |  HubSpot CRM  |  RealtyMX  |  PropertyShark</div>
  </div>
</div>

<!-- SLIDE 10: 90-Day Transition -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">The 90-Day Transition</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-bottom:16px">
      <div class="phase-card"><div class="phase-title">Month 1: Assessment</div><div class="phase-sub">Full file audit, FREE systems inspection, and staff performance review.</div><div class="phase-items">• Full file & data transfer<br>• FREE inspection ($2,500 value)<br>• Staff audit<br>• Vendor contract analysis<br>• Compliance review (HPD, boiler, fire)</div></div>
      <div class="phase-card"><div class="phase-title">Month 2: Stabilization</div><div class="phase-sub">Implement SOPs, begin twice-monthly visits, and launch board portal.</div><div class="phase-items">• Staff SOPs implemented<br>• Work orders configured<br>• Vendor re-bidding begins<br>• Board portal setup & training<br>• Capital project scoping begins</div></div>
      <div class="phase-card"><div class="phase-title">Month 3: Optimization</div><div class="phase-sub">Capital improvement roadmap and first quarterly board review.</div><div class="phase-items">• Capital plan + financing options<br>• Resident portal launched<br>• Monthly reporting cadence set<br>• Mortgage pre-qualification if needed<br>• First quarterly board review</div></div>
    </div>
  </div>
</div>

<!-- SLIDE 11: Proposed Investment -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">The Proposed Investment</div>
    <div class="body-text" style="margin-bottom:20px">Flat-rate, all-inclusive — no percentage fees, no hidden surcharges, no surprises.</div>
    <table class="fee-table">
      <tr><th>Management Service Component</th><th>Camelot Inclusion</th></tr>
      <tr><td><strong>Annual Management Fee</strong></td><td class="gold">${d.units && d.tieredPricing ? fmt$(d.tieredPricing.classic.monthly) + '/mo' : '$TBD — Custom flat rate after scope review'}</td></tr>
      <tr><td><strong>Online Maintenance Payments</strong></td><td class="gold">ZERO Bank Fees (paper still supported)</td></tr>
      <tr><td><strong>Technology Platform</strong></td><td>Included — Camelot OS + ConciergePlus + Merlin AI</td></tr>
      <tr><td><strong>Initial Building Inspection</strong></td><td class="gold">FREE ($2,500 value)</td></tr>
      <tr><td><strong>In-House CPA / Accounting</strong></td><td>Included — no outsourcing, full transparency</td></tr>
      <tr><td><strong>Capital Project Management</strong></td><td>Included — full oversight</td></tr>
      <tr><td><strong>AI Board Meeting Minutes</strong></td><td>Included — annual meeting, AI-enhanced</td></tr>
      <tr><td><strong>In-House Attorney & Engineer</strong></td><td>Free Advisory — legal & engineering consultation</td></tr>
    </table>
    <div class="body-italic" style="margin-top:16px">Our efficiencies effectively pay for our management through long-term savings on vendors, compliance, and capital.</div>
  </div>
</div>

<!-- SLIDE 12: What Our Clients Say -->
<div class="slide slide-cream">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div class="pad">
    <div class="section-title">What Our Clients Say</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px">
      <div class="quote-card">
        <div class="quote-mark">❝</div>
        <div class="quote-text">Camelot has been a helpful agent representing our Co-op since we moved into our new home. We really relied on them for their experience in understanding protocols, building-wide systems, and the business of running a building.</div>
        <div class="quote-author">Brandon Miller</div>
        <div class="quote-role">Board President, 137 Franklin Street Apartment Corp</div>
      </div>
      <div class="quote-card">
        <div class="quote-mark">❝</div>
        <div class="quote-text">Valerie and David have been by my side as not only the best and most knowledgeable property managers but as family! Their experience and dedication is limitless and they go far beyond the expected.</div>
        <div class="quote-author">Evee Georgiadis</div>
        <div class="quote-role">Owner, 949 Park Avenue Condominium</div>
      </div>
    </div>
  </div>
</div>

<!-- SLIDE 13: Next Steps (Dark) -->
<div class="slide slide-dark">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center;padding:60px">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:52px;font-style:italic;color:#B8973A;margin-bottom:24px">Next Steps</div>
    <div style="font-size:18px;color:rgba(255,255,255,0.8);margin-bottom:40px">We welcome the opportunity to visit the property<br>and walk through our scope of work and proposed fee.</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:20px;color:#B8973A;margin-bottom:16px">David Goldoff, Founder & President</div>
    <div style="font-size:16px;color:rgba(255,255,255,0.7);line-height:2">
      212-206-9939 ext. 701  |  646-523-9068<br>
      info@camelot.nyc  |  dgoldoff@camelot.nyc<br>
      www.camelot.nyc<br>
      501 Madison Avenue, Suite 1400, New York, NY 10022
    </div>
  </div>
</div>

<!-- SLIDE 14: Thank You (Dark) -->
<div class="slide slide-dark">
  <div class="logo-badge"><div class="logo-badge-text">CAMELOT<span class="logo-badge-sub">REALTY GROUP</span></div></div>
  <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;text-align:center;padding:60px">
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:52px;letter-spacing:12px;font-weight:400;margin-bottom:6px">C A M E L O T</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#B8973A;font-style:italic;margin-bottom:50px">Property Management</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:52px;font-style:italic;color:#B8973A;margin-bottom:20px">Thank You</div>
    <div style="font-size:18px;color:rgba(255,255,255,0.7)">We look forward to serving<br>the ${d.buildingName || d.address} community</div>
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
  
  return `Subject: ${d.buildingName || d.address} — Management Proposal from Camelot Realty Group

Dear Board Members,

My name is David Goldoff, and I'm the founder and president of Camelot Realty Group. I'm reaching out because we recently completed a comprehensive analysis of ${d.buildingName || d.address} at ${d.address}, and I wanted to share what we found.

${hasIssues ? `Our analysis identified several areas that may warrant attention, including ${d.violationsOpen > 0 ? d.violationsOpen + ' open HPD violations' : ''}${d.ll97 && d.ll97.period1Penalty > 0 ? (d.violationsOpen > 0 ? ' and ' : '') + 'LL97 compliance exposure of ' + (d.ll97.period1Penalty > 0 ? '$' + Math.round(d.ll97.period1Penalty).toLocaleString() + '/year starting 2030' : 'pending assessment') : ''}. The attached Property Intelligence Report provides the full details.` : `Your building appears to be well-maintained, and I've attached a Property Intelligence Report with our analysis. Even well-run buildings can benefit from Camelot's technology-driven management approach and institutional-grade compliance services.`}

I'd welcome the opportunity to discuss how Camelot can serve ${d.buildingName || d.address}. We offer a complimentary building inspection ($2,500 value) at no cost and no obligation — our way of demonstrating value upfront.

Would you have 15 minutes this week for a brief conversation?

Best regards,

David A. Goldoff
Founder & President
Camelot Realty Group
501 Madison Avenue, Suite 1400, New York, NY 10022
(212) 206-9939 ext. 701  |  (646) 523-9068
dgoldoff@camelot.nyc  |  www.camelot.nyc

RED Awards 2025: PM Company of the Year | REBNY 2025: David Goldoff Leadership Award`;
}
