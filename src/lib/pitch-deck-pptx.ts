// @ts-nocheck
/**
 * Camelot OS — PPTX Pitch Deck Generator
 * Generates a professional PowerPoint pitch deck from building data.
 * Uses pptxgenjs for client-side PPTX generation.
 * 
 * The deck is a DIRECT MARKETING tool — building-specific,
 * data-driven, visual, and concise (7-10 slides).
 */

import PptxGenJS from 'pptxgenjs';
import type { MasterReportData } from './camelot-report';

// Camelot brand colors
const NAVY = '0D2240';
const GOLD = 'B8973A';
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F3F4F6';
const DARK_GRAY = '4B5563';
const RED = 'DC2626';
const GREEN = '16A34A';
const AMBER = 'F59E0B';

function fmt$(n: number): string {
  if (!n) return 'N/A';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + Math.round(n).toLocaleString();
  return '$' + n.toFixed(0);
}

export async function generatePitchDeck(d: MasterReportData): Promise<void> {
  const pptx = new PptxGenJS();
  
  pptx.author = 'Camelot Realty Group';
  pptx.company = 'Camelot Property Management Services Corp.';
  pptx.subject = `Property Intelligence — ${d.buildingName || d.address}`;
  pptx.title = `Camelot — ${d.buildingName || d.address}`;
  
  // Set default slide size (widescreen)
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const hood = d.neighborhoodName 
    ? d.neighborhoodName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : d.borough || 'New York';

  // ========== SLIDE 1: COVER ==========
  const slide1 = pptx.addSlide();
  slide1.background = { fill: NAVY };
  
  // Camelot logo text
  slide1.addText('CAMELOT REALTY GROUP', { x: 0.8, y: 0.6, w: 5, h: 0.4, fontSize: 12, color: GOLD, fontFace: 'Arial', bold: true, charSpacing: 4 });
  
  // Title
  slide1.addText('Property Intelligence Report', { x: 0.8, y: 2.0, w: 10, h: 0.7, fontSize: 32, color: WHITE, fontFace: 'Arial', bold: true });
  slide1.addText(d.buildingName || d.address, { x: 0.8, y: 2.8, w: 10, h: 0.6, fontSize: 28, color: GOLD, fontFace: 'Arial', bold: true });
  slide1.addText(`${d.address} · ${hood}`, { x: 0.8, y: 3.5, w: 10, h: 0.4, fontSize: 16, color: 'AAAAAA', fontFace: 'Arial' });
  
  // Stats row
  const stats = [
    { val: d.units ? String(d.units) : '—', lbl: 'Units' },
    { val: String(d.violationsTotal), lbl: 'HPD Violations' },
    { val: String(d.violationsOpen), lbl: 'Open' },
    { val: d.yearBuilt ? String(d.yearBuilt) : '—', lbl: 'Year Built' },
    { val: fmt$(d.marketValue), lbl: 'Market Value' },
  ];
  stats.forEach((s, i) => {
    const x = 0.8 + (i * 2.4);
    slide1.addText(s.val, { x, y: 4.6, w: 2, h: 0.5, fontSize: 24, color: GOLD, fontFace: 'Arial', bold: true, align: 'center' });
    slide1.addText(s.lbl, { x, y: 5.1, w: 2, h: 0.3, fontSize: 10, color: 'AAAAAA', fontFace: 'Arial', align: 'center' });
  });
  
  // Footer
  slide1.addText(`Prepared ${today} · Camelot Realty Group · 57 West 57th Street, Suite 410, NYC 10019 · Powered by Camelot OS`, {
    x: 0.8, y: 6.8, w: 11, h: 0.3, fontSize: 8, color: '666666', fontFace: 'Arial'
  });

  // ========== SLIDE 2: BUILDING SNAPSHOT ==========
  const slide2 = pptx.addSlide();
  slide2.addText([
    { text: '01 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'Building Snapshot', options: { fontSize: 18, color: NAVY, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });
  slide2.addText(`Live data from NYC HPD, DOB, DOF, ACRIS — pulled ${today}`, { x: 0.8, y: 0.95, w: 10, h: 0.3, fontSize: 10, color: DARK_GRAY });

  // Data cards
  const cards = [
    [
      { lbl: 'Address', val: d.address, sub: hood },
      { lbl: 'Units', val: d.units ? String(d.units) : 'N/A', sub: `${d.stories || '—'} stories` },
      { lbl: 'Year Built', val: d.yearBuilt ? String(d.yearBuilt) : 'N/A', sub: d.yearBuilt ? `${new Date().getFullYear() - d.yearBuilt} years old` : '' },
    ],
    [
      { lbl: 'Market Value', val: fmt$(d.marketValue), sub: `Assessed: ${fmt$(d.assessedValue)}` },
      { lbl: 'Management', val: d.managementCompany || 'Self-Managed', sub: '' },
      { lbl: 'Owner (DOF)', val: d.dofOwner || 'N/A', sub: d.lastSaleDate ? `Last sale: ${d.lastSaleDate}` : '' },
    ],
  ];
  
  cards.forEach((row, ri) => {
    row.forEach((card, ci) => {
      const x = 0.8 + (ci * 3.9);
      const y = 1.5 + (ri * 1.6);
      slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.6, h: 1.3, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
      slide2.addText(card.lbl.toUpperCase(), { x: x + 0.2, y: y + 0.15, w: 3.2, h: 0.2, fontSize: 8, color: DARK_GRAY, fontFace: 'Arial', bold: true });
      slide2.addText(card.val, { x: x + 0.2, y: y + 0.4, w: 3.2, h: 0.4, fontSize: 16, color: NAVY, fontFace: 'Arial', bold: true });
      if (card.sub) slide2.addText(card.sub, { x: x + 0.2, y: y + 0.85, w: 3.2, h: 0.2, fontSize: 9, color: DARK_GRAY });
    });
  });

  // ========== SLIDE 3: VIOLATION & COMPLIANCE ==========
  const slide3 = pptx.addSlide();
  slide3.addText([
    { text: '02 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'Violation & Compliance Status', options: { fontSize: 18, color: NAVY, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });

  // Violation stats
  const vStats = [
    { lbl: 'Total Violations', val: String(d.violationsTotal), color: d.violationsTotal > 50 ? RED : d.violationsTotal > 10 ? AMBER : GREEN },
    { lbl: 'Open', val: String(d.violationsOpen), color: d.violationsOpen > 10 ? RED : AMBER },
    { lbl: 'Class C (Critical)', val: String(d.violationClassC), color: d.violationClassC > 0 ? RED : GREEN },
    { lbl: 'ECB Penalties', val: fmt$(d.ecbPenaltyBalance), color: d.ecbPenaltyBalance > 0 ? RED : GREEN },
  ];
  
  vStats.forEach((vs, i) => {
    const x = 0.8 + (i * 3.0);
    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 2.7, h: 1.1, fill: { color: LIGHT_GRAY }, rectRadius: 0.1 });
    slide3.addText(vs.lbl.toUpperCase(), { x: x + 0.1, y: 1.3, w: 2.5, h: 0.2, fontSize: 8, color: DARK_GRAY, align: 'center', bold: true });
    slide3.addText(vs.val, { x: x + 0.1, y: 1.55, w: 2.5, h: 0.4, fontSize: 22, color: vs.color, align: 'center', bold: true });
  });

  // Severity bar chart
  const total = d.violationClassA + d.violationClassB + d.violationClassC;
  if (total > 0) {
    const chartData = [
      { name: 'Class C (Critical)', labels: ['Violations'], values: [d.violationClassC] },
      { name: 'Class B (Hazardous)', labels: ['Violations'], values: [d.violationClassB] },
      { name: 'Class A (Non-Hazardous)', labels: ['Violations'], values: [d.violationClassA] },
    ];
    slide3.addChart(pptx.charts.BAR, chartData, {
      x: 0.8, y: 2.6, w: 11, h: 2.5,
      barDir: 'bar',
      stacked: true,
      chartColors: [RED, AMBER, '3B82F6'],
      showTitle: true,
      title: 'Violation Severity Breakdown',
      titleFontSize: 12,
      showValue: true,
      valueFontSize: 10,
      catAxisHidden: true,
    });
  }

  // LL97 callout
  if (d.ll97 && d.ll97.period1Penalty > 0) {
    slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.8, y: 5.4, w: 11, h: 1.2, fill: { color: 'FEF3C7' }, line: { color: AMBER, width: 1 }, rectRadius: 0.1 });
    slide3.addText('⚠ LL97 CARBON PENALTY EXPOSURE', { x: 1.0, y: 5.5, w: 10, h: 0.3, fontSize: 12, color: '92400E', bold: true });
    slide3.addText(
      `Estimated ${fmt$(d.ll97.period1Penalty)}/year starting 2030 (Period 1) and ${fmt$(d.ll97.period2Penalty)}/year starting 2035 (Period 2). Total 11-year exposure: ${fmt$(d.ll97.totalExposure11yr)}.`,
      { x: 1.0, y: 5.85, w: 10, h: 0.5, fontSize: 11, color: '78350F' }
    );
  }

  // ========== SLIDE 4: PAIN POINTS ==========
  const slide4 = pptx.addSlide();
  slide4.addText([
    { text: '03 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'What We Found — Specific to Your Building', options: { fontSize: 18, color: NAVY, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });

  const painPoints: string[] = [];
  if (d.violationsOpen > 0) painPoints.push(`${d.violationsOpen} open HPD violations requiring resolution — including ${d.violationClassC} Class C (immediately hazardous)`);
  if (d.ll97 && d.ll97.period1Penalty > 0) painPoints.push(`LL97 penalty exposure of ${fmt$(d.ll97.period1Penalty)}/year starting 2030 — proactive compliance planning needed now`);
  if (d.ecbPenaltyBalance > 0) painPoints.push(`${fmt$(d.ecbPenaltyBalance)} in outstanding ECB penalties that need resolution`);
  if (d.permitsCount > 3) painPoints.push(`${d.permitsCount} active DOB permits — capital projects require coordinated oversight`);
  if (!d.managementCompany || d.managementCompany === 'Self-Managed') painPoints.push('No professional management on record — self-managed buildings face increasing regulatory complexity');
  if (painPoints.length === 0) painPoints.push('Building appears well-maintained — Camelot can enhance operational efficiency and add technology-driven services');

  painPoints.forEach((p, i) => {
    const y = 1.2 + (i * 0.8);
    slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 0.8, y, w: 11, h: 0.65, fill: { color: 'FEF2F2' }, rectRadius: 0.05 });
    slide4.addShape(pptx.shapes.RECTANGLE, { x: 0.8, y, w: 0.08, h: 0.65, fill: { color: RED } });
    slide4.addText(`⚠  ${p}`, { x: 1.1, y, w: 10.5, h: 0.65, fontSize: 12, color: '1F2937', valign: 'middle' });
  });

  // ========== SLIDE 5: HOW CAMELOT SOLVES IT ==========
  const slide5 = pptx.addSlide();
  slide5.addText([
    { text: '04 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'How Camelot Solves This', options: { fontSize: 18, color: NAVY, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });

  const solutions = [
    { title: 'Violation Resolution', desc: 'Dedicated compliance team resolves open violations systematically. 1,200+ violations cleared across our portfolio.' },
    { title: 'Camelot OS — AI Monitoring', desc: 'Real-time violation and compliance tracking across HPD, DOB, ECB, LL97, FISP, and 311.' },
    { title: 'LL97 Compliance Planning', desc: 'Energy benchmarking, retro-commissioning coordination, and penalty mitigation strategy.' },
    { title: 'Concierge Plus Portal', desc: '28-module digital platform for amenity booking, packages, service requests, payments, and board communications.' },
    { title: 'BankUnited Treasury', desc: 'Operating and reserve accounts structured for maximum yield. Zero bank fees.' },
    { title: '20+ Years NYC Expertise', desc: '130+ buildings, 1,500+ units, licensed brokerage. We sit in board meetings, not behind a desk.' },
  ];

  solutions.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + (col * 6.0);
    const y = 1.2 + (row * 1.8);
    slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.7, h: 1.5, fill: { color: 'F0FDF4' }, rectRadius: 0.1 });
    slide5.addShape(pptx.shapes.RECTANGLE, { x, y, w: 0.08, h: 1.5, fill: { color: GREEN } });
    slide5.addText(`✓  ${s.title}`, { x: x + 0.3, y: y + 0.15, w: 5.2, h: 0.35, fontSize: 13, color: NAVY, bold: true });
    slide5.addText(s.desc, { x: x + 0.3, y: y + 0.55, w: 5.2, h: 0.7, fontSize: 10, color: DARK_GRAY });
  });

  // ========== SLIDE 6: 90-DAY TRANSITION ==========
  const slide6 = pptx.addSlide();
  slide6.addText([
    { text: '05 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'The First 90 Days — Transition Plan', options: { fontSize: 18, color: NAVY, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });

  const phases = [
    { num: 'Days 1-30', title: 'Assessment & Setup', items: ['Full building inspection', 'Vendor contract review', 'Staff evaluation', 'Bank account setup', 'Portal activation', 'Violation audit'] },
    { num: 'Days 31-60', title: 'Optimization', items: ['Vendor renegotiation', 'Priority violation resolution', 'LL97 compliance assessment', 'Capital improvement planning', 'Financial reporting setup'] },
    { num: 'Days 61-90', title: 'Results & Reporting', items: ['First management report', 'Budget vs. actual analysis', 'Resident satisfaction baseline', 'Board presentation', 'Camelot OS dashboard live'] },
  ];

  phases.forEach((p, i) => {
    const x = 0.8 + (i * 4.0);
    slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.2, w: 3.7, h: 5.5, fill: { color: WHITE }, line: { color: 'E5E7EB', width: 1 }, rectRadius: 0.1 });
    
    // Phase badge
    slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: 1.05, w: 1.8, h: 0.35, fill: { color: GOLD }, rectRadius: 0.15 });
    slide6.addText(p.num, { x: x + 0.3, y: 1.05, w: 1.8, h: 0.35, fontSize: 10, color: WHITE, align: 'center', bold: true });
    
    slide6.addText(p.title, { x: x + 0.2, y: 1.6, w: 3.3, h: 0.35, fontSize: 14, color: NAVY, bold: true });
    
    p.items.forEach((item, j) => {
      slide6.addText(`•  ${item}`, { x: x + 0.2, y: 2.1 + (j * 0.45), w: 3.3, h: 0.35, fontSize: 10, color: DARK_GRAY });
    });
  });

  // ========== SLIDE 7: NEXT STEPS + CTA ==========
  const slide7 = pptx.addSlide();
  slide7.background = { fill: NAVY };
  
  slide7.addText([
    { text: '06 ', options: { fontSize: 18, color: GOLD, bold: true } },
    { text: 'Next Steps', options: { fontSize: 18, color: WHITE, bold: true } },
  ], { x: 0.8, y: 0.4, w: 10, h: 0.5 });
  
  slide7.addText(`We'd welcome the opportunity to discuss how Camelot can serve ${d.buildingName || d.address}`, {
    x: 0.8, y: 1.0, w: 10, h: 0.4, fontSize: 14, color: 'AAAAAA'
  });

  const ctas = [
    { icon: '📞', title: 'Schedule a Call', desc: '15 minutes to discuss your building' },
    { icon: '🏢', title: 'Property Tour', desc: 'Walk the building together' },
    { icon: '📊', title: 'Board Presentation', desc: 'Full presentation to your board' },
  ];

  ctas.forEach((cta, i) => {
    const x = 0.8 + (i * 4.0);
    slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: 3.7, h: 2.0, fill: { color: '1A3A5C' }, line: { color: GOLD, width: i === 1 ? 2 : 0 }, rectRadius: 0.1 });
    slide7.addText(cta.icon, { x, y: 2.0, w: 3.7, h: 0.5, fontSize: 28, align: 'center' });
    slide7.addText(cta.title, { x, y: 2.5, w: 3.7, h: 0.4, fontSize: 14, color: WHITE, align: 'center', bold: true });
    slide7.addText(cta.desc, { x, y: 2.9, w: 3.7, h: 0.3, fontSize: 10, color: 'AAAAAA', align: 'center' });
  });

  // Contact info
  slide7.addText('David A. Goldoff · Principal', { x: 0.8, y: 4.4, w: 11, h: 0.35, fontSize: 16, color: GOLD, align: 'center', bold: true });
  slide7.addText('📧 valerie@camelot.nyc  ·  📞 (212) 206-9939 ext. 701  ·  📱 (646) 523-9068', { x: 0.8, y: 4.8, w: 11, h: 0.3, fontSize: 12, color: WHITE, align: 'center' });
  slide7.addText('57 West 57th Street, Suite 410, New York, NY 10019  ·  camelot.nyc', { x: 0.8, y: 5.15, w: 11, h: 0.3, fontSize: 11, color: 'AAAAAA', align: 'center' });
  
  // Powered by
  slide7.addText('Powered by Camelot OS — The Operating System for Property Management', {
    x: 0.8, y: 6.5, w: 11, h: 0.3, fontSize: 9, color: '666666', align: 'center', italic: true
  });

  // Generate and download
  const fileName = `Camelot-Pitch-${(d.buildingName || d.address).replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-')}`;
  await pptx.writeFile({ fileName });
}
