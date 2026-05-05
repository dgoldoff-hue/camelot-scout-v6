/**
 * Camelot OS — External Pitch Deck (Slide Format)
 * Matches the 155-24 89th Street reference deck design exactly.
 * 16:9 widescreen slides, charcoal cover, cream content, gold accents.
 * 
 * All data is 100% dynamic — pulled live from NYC APIs per address.
 */

import type { MasterReportData } from './camelot-report';

export type JackieReportPackage = 'first_email_intro' | 'board_meeting_deck' | 'appendix_full';

export const JACKIE_REPORT_PACKAGES: Array<{ key: JackieReportPackage; label: string; pages: string; description: string }> = [
  { key: 'first_email_intro', label: 'First Email Intro', pages: '6-8 pages', description: 'Short board-safe teaser for first outreach.' },
  { key: 'board_meeting_deck', label: 'Board Meeting Deck', pages: '15 pages', description: 'Main presentation for live board meetings.' },
  { key: 'appendix_full', label: 'Appendix: Full Jackie Report', pages: 'Full appendix', description: 'Complete source-backed internal and diligence packet.' },
];

const CAMELOT_EXECUTIVE_TEAM = [
  { name: 'David Goldoff', title: 'Founder & President', note: 'Owner-minded leadership, client relationships, compliance strategy' },
  { name: 'Valerie Ann Fiume', title: 'Director of Co-Ops & Condos / Vice President', note: 'Board operations, resident relations, property management execution' },
  { name: 'Anthony Abruzzo, CPA', title: 'Chief Financial Officer, Senior Managing Tax Director', note: 'Financial controls, tax, reporting, accounting oversight' },
  { name: 'Steven Milewicz', title: 'Chief Legal Officer, M&A', note: 'Legal guidance, transactions, acquisitions, governance support' },
  { name: 'Robert Isaacs', title: 'Senior Managing Director, Asset Management & Compliance', note: 'Asset management, compliance, risk and operating standards' },
  { name: 'Anthony Tavaglione', title: 'Senior Controller & Accounting Manager', note: 'Controller-level reporting, accounting workflows, monthly close support' },
  { name: 'Tim Kelly', title: 'Senior Facility Manager', note: 'Facilities, field operations, staff/vendor coordination' },
  { name: 'Eleni Palmeri', title: 'Licensed Real Estate Salesperson', note: 'Sales, leasing, resident-facing market support' },
  { name: 'Jan Cohen', title: 'Expeditor and Registered Real Estate Agent', note: 'Permits, filings, agency follow-up, expediting support' },
];

const CAMELOT_TEAM_SOURCE = 'https://www.camelot.nyc/company-roster/';
const CAMELOT_OUR_TEAM_SOURCE = 'https://www.camelot.nyc/our-team/';
const CAMELOT_CONTACT_NAME = 'David Goldoff';
const CAMELOT_CONTACT_TITLE = 'Founder & President';
const CAMELOT_CONTACT_EMAIL = 'info@camelot.nyc';
const CAMELOT_GENERAL_EMAIL = 'dgoldoff@camelot.nyc';
const CAMELOT_PHONE = '212-206-9939 ext. 701';
const CAMELOT_MOBILE = '646-523-9068';
const CAMELOT_WEBSITE = 'www.camelot.nyc';
const CAMELOT_OFFICE_ADDRESS = '57 West 57th Street, Suite 410, New York, NY 10019';
const CAMELOT_JACQUELINE_QUOTE = "";
const JACKIE_INTELLIGENT_REPORT_NOTE = 'This is an intelligent property introduction developed through Camelot OS by Jackie, Camelot’s report engine. It is designed to be more property-specific, source-aware, and useful than a standard generic introduction.';
const CONCIERGE_PLUS_PRODUCT_SOURCE = 'https://conciergeplus.com/product-suite/';
const CONCIERGE_PLUS_PLATFORM_IMAGE = 'https://pubcdn.conciergeplus.com/wp-content/uploads/2026/05/CP-Platform-Plus-Image-scaled.png';
const CONCIERGE_PLUS_LOGO_IMAGE = 'https://pubcdn.conciergeplus.com/wp-content/uploads/2026/05/PLUS-Logo-01-1024x501.png';

const MDS_REPORT_PROOF_POINTS = [
  'Balance Sheet',
  'Income Statement with Budget',
  'Bank Reconciliation',
  'Cash Disbursements Journal',
  'Aged Delinquency Report',
  'Charges & Collections',
  'Paid Invoice Images',
  'Monthly board package cadence: 20th-25th',
];

const ONBOARDING_CHECKLIST = [
  'Full file and data transfer',
  'Banking, lockbox, payables and arrears setup',
  'Resident portal configuration and notices',
  'Vendor contracts, W-9s, COIs and recurring costs',
  'Compliance calendar: HPD, DOB, DOF, RPIE, LL97, FISP',
  'Staff/vendor roles, SOPs and emergency contacts',
  'First board-ready financial package and transition dashboard',
  '90-day operating review with next-quarter roadmap',
];

const STANDARD_AGREEMENT_PROOF_POINTS = [
  'Custom flat management fee after scope review',
  'Annual escalation discussed and mutually agreed with the board',
  'Additional services are separated from base management compensation',
  'Closing, sublet, alteration, refinance and application services may be charged to the applicable unit owner where permitted',
  'Emergency and special-assignment support can be billed by rate and scope when outside basic services',
];

const PROPERTYSHARK_DILIGENCE_FIELDS = [
  'Owner mailing address / care-of management address',
  'HPD officers, registered owner, managing agent, and prior contact history',
  'DOB permit contacts: owners, applicants, architects, engineers, plumbers, electricians',
  'Unit-level co-op / condo sales and comparable price-per-square-foot signals',
  'Assessment history, current tax bill, tentative tax bill, abatements, and exemptions',
  'Zoning district, zoning map, FAR, max buildable area, and unused air-rights estimate',
  'Historic district / LPC status plus community district, school district, census tract, police and fire proximity',
  'ACRIS document history: deeds, mortgages, satisfactions, assignments, liens, and UCC-style filings',
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

function clientRecipientLabel(d: MasterReportData): string {
  const type = `${d.propertyType || ''} ${d.buildingClass || ''}`.toLowerCase();
  if (/co-?op|cooperative|condo|condominium|c6|c8|r4/.test(type)) return 'Board Members';
  if (/rental|multifamily|landlord|walk-up|walk up|d[0-9]/.test(type)) return 'Landlord';
  return 'Board and Ownership Team';
}

function coverLetterParagraphs(d: MasterReportData): string {
  const building = d.buildingName || d.address;
  const recipient = clientRecipientLabel(d);
  return `<div style="font-family:'Cormorant Garamond',Georgia,serif;color:#1a2744;font-size:18px;line-height:1.58"><p style="margin-bottom:15px"><strong style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px">Dear ${recipient},</strong> thank you for allowing Camelot the opportunity to discuss <strong>${escapeHtml(building)}</strong> and how we may be able to support your property, residents, staff, and ownership goals. Camelot Property Management is a New York-based, hands-on management company that combines experienced property managers, in-house accounting, compliance discipline, and practical proptech to deliver clearer communication, cleaner reporting, faster response, and better day-to-day control.</p><p style="margin-bottom:22px">We serve our clients by becoming a value-added member of the building team: organizing operations, improving vendor oversight, supporting boards and landlords with timely financials, using automation and resident-facing tools where they make sense, and protecting the property with local knowledge and senior attention. We look forward to speaking with you soon and learning where Camelot can be most useful.</p><div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#1a2744;line-height:1.7"><strong>Sincerely yours,</strong><br><br>David A. Goldoff<br>President, Camelot Property Management</div></div>`;
}

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

function cleanFileNamePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function externalDeckCss(): string {
  return `
  @page { size: 13.33in 7.5in; margin: 0; }
  @media print { .deck-action-bar { display:none !important; } .slide { page-break-after: always; margin:0 auto; box-shadow:none; } .slide:last-child { page-break-after: auto; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#fff; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { counter-reset: slide; }
  body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1a1f36; font-size: 16px; line-height: 1.6; background: #e0e0e0; }
  .deck-action-bar { position:sticky;top:0;z-index:50;background:#34444f;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,.18); }
  .deck-action-bar button, .deck-action-bar a { border:0;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer;margin-left:8px; }
  .deck-action-bar .gold { background:#B8973A;color:#fff; }
  .deck-action-bar .white { background:#fff;color:#34444f; }
  .deck-action-bar .outline { background:transparent;color:#F4D26A;border:1px solid #B8973A; }
  .slide { width: 1280px; height: 720px; margin: 20px auto; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background:#FAF8F5; counter-increment: slide; }
  .slide::after { content: counter(slide); position:absolute; right:24px; bottom:16px; font-family: Arial, sans-serif; font-size:10px; color:#7d8490; z-index:9; }
  .slide-dark { background: #34444f; color: #fff; }
  .pad { padding: 54px 64px; }
  .logo-badge { position: absolute; top: 0; right: 0; width: 166px; height: 96px; background: #B8973A; display: flex; align-items: center; justify-content: center; z-index: 4; }
  .logo-badge img { width: 136px; max-height: 62px; object-fit: contain; }
  .logo-badge-text { color:#111827;font-size:15px;font-weight:800;letter-spacing:5px;text-align:center;line-height:1.3; }
  .logo-badge-sub { display:block;font-size:7px;letter-spacing:3px;font-weight:500;margin-top:2px; }
  .section-title { font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-style:italic;font-weight:600;color:#B8973A;line-height:1.05;border-left:5px solid #B8973A;padding-left:20px;margin-bottom:22px; }
  .sub-heading { font-size:22px;font-weight:800;color:#1a2744;margin-bottom:10px; }
  .body-text { font-size:16px;color:#4a5568;line-height:1.7; }
  .small { font-size:12px;color:#6b7280;line-height:1.55; }
  .gold-card { border:1px solid rgba(184,151,58,0.38);border-left:4px solid #B8973A;background:#fff;padding:18px 20px;border-radius:8px;box-shadow:0 12px 28px rgba(26,31,54,0.07); }
  .visual-card { border:1px solid rgba(184,151,58,0.32);background:#fff;border-radius:8px;box-shadow:0 12px 28px rgba(26,31,54,0.08);overflow:hidden; }
  .image-frame { height:260px;background:#EDE9DF;overflow:hidden;position:relative; }
  .image-frame img, .image-frame iframe { width:100%;height:100%;object-fit:cover;display:block;border:0; }
  .image-caption { padding:9px 12px;font-size:10px;color:#6b7280;border-top:1px solid #eee; }
  .stat-box { background:#fff;border:1px solid rgba(184,151,58,0.25);border-radius:10px;padding:18px;text-align:center;box-shadow:0 12px 28px rgba(26,31,54,0.07); }
  .stat-val { font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:700;color:#B8973A;line-height:1; }
  .stat-label { font-size:12px;color:#6b7280;margin-top:5px;text-transform:uppercase;letter-spacing:.8px; }
  .check { display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;color:#1a2744;font-size:14px;line-height:1.45; }
  .check span { width:22px;height:22px;border-radius:50%;background:#B8973A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0; }
  .mini-bar { height:10px;border-radius:999px;background:#E5E7EB;overflow:hidden;margin-top:7px; }
  .mini-bar span { display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#B8973A,#34444f); }
  .icon-tile { width:42px;height:42px;border-radius:10px;background:#F4EFE2;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0; }
  .source-note { position:absolute;bottom:18px;left:64px;right:64px;border-top:1px solid rgba(184,151,58,.25);padding-top:9px;font-size:9px;color:#8a8174; }
  table { width:100%;border-collapse:collapse; }
  th { background:#1a2744;color:#B8973A;padding:10px 14px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px; }
  td { padding:9px 14px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#344054;vertical-align:top; }
  `;
}

function deckShell(title: string, slides: string): string {
  const safeTitle = escapeHtml(title);
  const encodedSubject = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(`Please find the Camelot introduction report for review.\n\nDavid Goldoff\nCamelot Realty Group\n57 West 57th Street, Suite 410, New York, NY 10019\n(212) 206-9939 ext. 701`);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safeTitle}</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"><style>${externalDeckCss()}</style></head><body><div class="deck-action-bar"><div style="font-size:13px;font-weight:900;color:#F4D26A">${safeTitle}</div><div><button class="gold" onclick="setTimeout(function(){window.focus();window.print()},150)">Print / Save PDF</button><button class="white" onclick="var blob=new Blob([document.documentElement.outerHTML],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=document.title.replace(/[^a-zA-Z0-9]+/g,'-')+'.html';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},1000)">Download HTML</button><a class="outline" href="mailto:info@camelot.nyc?cc=dgoldoff@camelot.nyc&subject=${encodedSubject}&body=${encodedBody}">Email</a></div></div>${slides}</body></html>`;
}

function logoBadge(): string {
  return `<div class="logo-badge"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;logo-badge-text&quot;>CAMELOT<span class=&quot;logo-badge-sub&quot;>REALTY GROUP</span></div>'"></div>`;
}

function streetViewImage(d: MasterReportData, size = '900x600'): string {
  const location = d.latitude && d.longitude ? `${d.latitude},${d.longitude}` : `${d.address}, New York, NY`;
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${encodeURIComponent(location)}&fov=85&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
}

function streetViewEmbedUrl(d: MasterReportData): string {
  const location = d.latitude && d.longitude ? `${d.latitude},${d.longitude}` : `${d.address}, New York, NY`;
  return `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${encodeURIComponent(location)}&heading=0&pitch=5&fov=80`;
}

function directionsEmbedUrl(d: MasterReportData): string {
  return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=57+West+57th+Street+Suite+410+New+York+NY+10019&destination=${encodeURIComponent(d.address)}&mode=driving`;
}

function placeEmbedUrl(d: MasterReportData): string {
  const query = d.latitude && d.longitude ? `${d.latitude},${d.longitude}` : `${d.address}, New York, NY`;
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(query)}&zoom=16`;
}

function bestExteriorImage(d: MasterReportData): string {
  return d.buildingPhotos?.exterior?.[0] || d.commercialIntel?.brandingImages?.[0] || d.streetEasy?.photos?.[0] || streetViewImage(d);
}

function staticMapImage(d: MasterReportData, size = '640x360'): string {
  const destination = d.latitude && d.longitude ? `${d.latitude},${d.longitude}` : `${d.address}, New York, NY`;
  return `https://maps.googleapis.com/maps/api/staticmap?size=${size}&scale=2&maptype=roadmap&markers=color:gold%7Clabel:C%7C57+West+57th+Street+Suite+410+New+York+NY+10019&markers=color:red%7Clabel:P%7C${encodeURIComponent(destination)}&path=color:0x34444fff%7Cweight:4%7C57+West+57th+Street+Suite+410+New+York+NY+10019%7C${encodeURIComponent(destination)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
}

function neighborhoodMapImage(d: MasterReportData, size = '640x360'): string {
  const destination = d.latitude && d.longitude ? `${d.latitude},${d.longitude}` : `${d.address}, New York, NY`;
  return `https://maps.googleapis.com/maps/api/staticmap?size=${size}&scale=2&maptype=roadmap&zoom=14&markers=color:red%7Clabel:P%7C${encodeURIComponent(destination)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
}

function imageCard(src: string, alt: string, caption: string, height = 260): string {
  const safeAlt = escapeHtml(alt);
  return `<div class="visual-card"><div class="image-frame" style="height:${height}px"><img src="${src}" alt="${safeAlt}" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=&quot;height:100%;display:flex;align-items:center;justify-content:center;background:#34444f;color:#B8973A;font-size:12px;font-weight:800;text-align:center;padding:16px&quot;>${safeAlt}</div>'"></div><div class="image-caption">${caption}</div></div>`;
}

function propertyImageCard(d: MasterReportData, caption: string, height = 392): string {
  const first = bestExteriorImage(d);
  const safeAlt = escapeHtml(d.buildingName || d.address);
  const iframe = `<iframe src=&quot;${streetViewEmbedUrl(d)}&quot; title=&quot;${safeAlt} street view&quot; allowfullscreen loading=&quot;lazy&quot;></iframe>`;
  return `<div class="visual-card"><div class="image-frame" style="height:${height}px"><img src="${first}" alt="${safeAlt}" onerror="this.style.display='none';this.parentElement.innerHTML='${iframe}'"></div><div class="image-caption">${caption}</div></div>`;
}

function iframeCard(src: string, title: string, caption: string, height = 260): string {
  const safeTitle = escapeHtml(title);
  return `<div class="visual-card"><div class="image-frame" style="height:${height}px"><iframe src="${src}" title="${safeTitle}" allowfullscreen loading="lazy"></iframe></div><div class="image-caption">${caption}</div></div>`;
}

function rawIframeFrame(src: string, title: string): string {
  return `<iframe src="${src}" title="${escapeHtml(title)}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:100%;border:0;display:block"></iframe>`;
}

function landmarkLabels(d: MasterReportData): string[] {
  const live = (d.neighborhoodIntel?.landmarks || []).map(l => `${l.name}${l.type ? ` · ${l.type}` : ''}`);
  const known = (d.raw?.knownFacts?.landmarks || d.raw?.known?.landmarks || []) as string[];
  const fallback = [
    `${neighborhoodName(d)} neighborhood context`,
    'Camelot HQ · 57 West 57th Street',
    'NYC transit and vendor-routing access',
    'LPC / neighborhood landmark review',
  ];
  return Array.from(new Set([...known, ...live, ...fallback])).slice(0, 5);
}

function intelligenceSourceCards(): string {
  const sources = [
    { icon: '🏛', title: 'NYC Records', copy: 'HPD, DOB, DOF, ECB/OATH, ACRIS, LL84/LL97' },
    { icon: '🗺', title: 'Location Intelligence', copy: 'Maps, transit, route timing, landmarks, neighborhood context' },
    { icon: '📊', title: 'Market Intelligence', copy: `StreetEasy, PropertyShark, ${PROPERTYSHARK_DILIGENCE_FIELDS[3]}, tax bills, FAR / air rights, market comps` },
    { icon: '🤝', title: 'Camelot Records', copy: 'Portfolio outcomes, vendor history, accounting cadence, onboarding playbooks' },
  ];
  return sources.map(s => `<div class="gold-card" style="display:flex;gap:12px;align-items:flex-start;min-height:104px"><div class="icon-tile">${s.icon}</div><div><div style="font-size:14px;font-weight:800;color:#1a2744">${s.title}</div><div class="small">${s.copy}</div></div></div>`).join('');
}

function compactIntelligenceSources(): string {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">${intelligenceSourceCards().replace(/min-height:104px/g, 'min-height:74px').replace(/font-size:14px/g, 'font-size:12px')}</div>`;
}

function responseChart(d: MasterReportData): string {
  const rows = [
    ['Senior manager dispatch', 85, 'same day triage'],
    ['Vendor coordination', 75, '24-48 hour scope review'],
    ['Board reporting cadence', 92, 'monthly package by 20th-25th'],
    ['Compliance tracking', 88, 'calendar + source checks'],
  ];
  return `<div class="visual-card" style="padding:18px"><div class="sub-heading" style="font-size:18px">What Boards Care About</div>${rows.map(([label, pct, note]) => `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#1a2744;font-weight:800"><span>${label}</span><span style="color:#B8973A">${note}</span></div><div class="mini-bar"><span style="width:${pct}%"></span></div></div>`).join('')}<div class="small" style="margin-top:12px">Applied to ${d.buildingName || d.address}: proximity, data quality, response process, and reporting consistency are made visible instead of assumed.</div></div>`;
}

function executiveTeamSlide(): string {
  return `<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Executive Team</div><p class="body-text" style="margin-bottom:18px">Camelot's board-facing team combines ownership perspective, property operations, accounting, compliance, legal, brokerage, and facility oversight.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${CAMELOT_EXECUTIVE_TEAM.map((member, index) => `<div class="gold-card" style="min-height:118px;display:flex;gap:12px;align-items:flex-start"><div class="icon-tile">${['🏢','📋','💼','⚖','🛡','📊','🛠','🏙','🗂'][index] || '★'}</div><div><div style="font-size:16px;font-weight:800;color:#1a2744">${member.name}</div><div style="font-size:11px;color:#B8973A;font-weight:800;text-transform:uppercase;letter-spacing:.7px;margin:4px 0">${member.title}</div><div class="small">${member.note}</div></div></div>`).join('')}</div><div class="source-note">Sources: ${CAMELOT_TEAM_SOURCE} · ${CAMELOT_OUR_TEAM_SOURCE}</div></div></div>`;
}

function residentPortalSlide(d: MasterReportData): string {
  return `<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Resident Portal &amp; Automation</div><div style="display:grid;grid-template-columns:1fr .95fr;gap:28px;align-items:center"><div><div class="sub-heading">Plus by Concierge Plus</div><p class="body-text" style="margin-bottom:16px">Plus brings property operations into one connected system: residents, management, payments, communication, service requests, documents, amenity booking, packages, and AI support.</p><div class="gold-card"><div class="check"><span>✓</span><div>Residents can book amenities, submit maintenance requests, pay fees, track packages, and stay connected from one mobile-friendly platform.</div></div><div class="check"><span>✓</span><div>Management gains cleaner visibility, fewer disconnected tools, and daily operational workflows that are easier to track.</div></div><div class="check"><span>✓</span><div>Over 26 modules allow the board to enable what ${d.buildingName || 'the building'} needs without overwhelming residents.</div></div></div></div><div><img src="${CONCIERGE_PLUS_LOGO_IMAGE}" alt="Plus by Concierge Plus" style="width:100%;height:110px;object-fit:contain;margin-bottom:18px"><img src="${CONCIERGE_PLUS_PLATFORM_IMAGE}" alt="Concierge Plus product suite" style="width:100%;height:340px;object-fit:contain"></div></div><div class="source-note">Source: ${CONCIERGE_PLUS_PRODUCT_SOURCE}</div></div></div>`;
}

function mdsAccountingSlide(): string {
  return `<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Accounting &amp; Reporting Proof</div><p class="body-text" style="margin-bottom:16px">Camelot's accounting package is built around board-ready monthly reporting, MDS workflows, clean backup, and a predictable reporting cadence.</p><div style="display:grid;grid-template-columns:.95fr 1.05fr;gap:18px"><div class="gold-card"><div class="sub-heading" style="font-size:20px">Monthly Package Includes</div>${MDS_REPORT_PROOF_POINTS.map(item => `<div class="check"><span>✓</span><div>${item}</div></div>`).join('')}</div><div><div class="visual-card" style="padding:18px;margin-bottom:14px"><div class="sub-heading" style="font-size:18px">Reporting Cadence</div>${[['Close + reconciliation', 80], ['Board package QA', 88], ['Management report delivery', 96], ['Follow-up action list', 76]].map(([label, pct]) => `<div style="margin-bottom:13px"><div style="font-size:12px;font-weight:800;color:#1a2744">${label}</div><div class="mini-bar"><span style="width:${pct}%"></span></div></div>`).join('')}</div><div class="gold-card"><div class="sub-heading" style="font-size:18px">Why It Matters</div><p class="small">Boards should not chase basic financial answers. Camelot can deliver recurring financials, budget comparisons, arrears tracking, disbursement backup, and paid-invoice images so meetings focus on decisions instead of missing data.</p></div></div></div><div class="source-note">Sources: MDS sample report packages uploaded by Camelot · monthly reporting cadence supplied by Camelot.</div></div></div>`;
}

function onboardingChecklistSlide(): string {
  return `<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Onboarding Checklist</div><p class="body-text" style="margin-bottom:16px">The transition is treated like an operating handoff, not just a contract start date.</p><div style="display:grid;grid-template-columns:1fr .9fr;gap:18px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${ONBOARDING_CHECKLIST.map((item, idx) => `<div class="gold-card" style="padding:13px 14px"><div style="font-size:11px;color:#B8973A;font-weight:900;letter-spacing:1px;margin-bottom:3px">STEP ${idx + 1}</div><div style="font-size:13px;font-weight:800;color:#1a2744;line-height:1.35">${item}</div></div>`).join('')}</div><div class="visual-card" style="padding:20px"><div class="sub-heading" style="font-size:20px">90-Day Transition Rhythm</div>${[['Month 1 · Assessment', 34], ['Month 2 · Stabilization', 67], ['Month 3 · Optimization', 100]].map(([label, pct]) => `<div style="margin:20px 0"><div style="font-size:13px;font-weight:900;color:#1a2744">${label}</div><div class="mini-bar" style="height:14px"><span style="width:${pct}%"></span></div></div>`).join('')}<div class="small">Designed to show reliability quickly: files, money, staff, vendors, resident experience, and compliance all get organized into a visible plan.</div></div></div><div class="source-note">Sources: Camelot transition procedures, rental portfolio transition case-study workflow, and Jackie 90-day onboarding model.</div></div></div>`;
}

function standardAgreementSlide(): string {
  return `<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Agreement &amp; Fee Structure</div><p class="body-text" style="margin-bottom:18px">The board-facing proposal should be simple, but backed by a clean agreement structure.</p><div style="display:grid;grid-template-columns:1.05fr .95fr;gap:18px"><div class="gold-card"><div class="sub-heading" style="font-size:20px">Agreement Principles</div>${STANDARD_AGREEMENT_PROOF_POINTS.map(item => `<div class="check"><span>✓</span><div>${item}</div></div>`).join('')}</div><div class="gold-card"><div class="sub-heading" style="font-size:20px">Pricing Position</div><p class="body-text">Camelot should remain transparent on the core management fee, show value against the market, and keep non-core additional services clearly separated so the board understands what is included and what is charged by scope, unit event, or hourly rate.</p></div></div><div class="source-note">Source: Camelot condo/co-op management agreement and proposed rate-sheet template supplied by Camelot.</div></div></div>`;
}

export function generateFirstEmailIntroReport(d: MasterReportData): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const subjectImage = bestExteriorImage(d);
  const hasRisks = d.violationsOpen > 0 || d.ecbPenaltyBalance > 0 || Boolean(d.ll97?.period1Penalty);
  const landmarks = landmarkLabels(d);
  const slides = `
<div class="slide slide-dark"><div style="position:absolute;inset:0;opacity:.48">${rawIframeFrame(streetViewEmbedUrl(d), `${d.buildingName || d.address} street view`)}</div><div style="position:absolute;inset:0;background:linear-gradient(105deg,rgba(34,47,58,.98) 0%,rgba(34,47,58,.74) 48%,rgba(34,47,58,.34) 100%)"></div><div style="position:absolute;right:62px;bottom:58px;width:410px;display:grid;grid-template-columns:1fr 1fr;gap:10px;z-index:2"><div style="height:150px;border:1px solid rgba(244,210,106,.55);box-shadow:0 18px 40px rgba(0,0,0,.28);overflow:hidden;background:#111">${rawIframeFrame(placeEmbedUrl(d), `${neighborhoodName(d)} neighborhood map`)}</div><div style="height:150px;border:1px solid rgba(244,210,106,.55);box-shadow:0 18px 40px rgba(0,0,0,.28);overflow:hidden;background:#111">${rawIframeFrame(directionsEmbedUrl(d), 'Camelot route map')}</div></div><div class="pad" style="position:relative;z-index:3">${logoBadge()}<div style="height:100%;display:flex;flex-direction:column;justify-content:center;max-width:720px"><div style="font-size:13px;color:#B8973A;text-transform:uppercase;letter-spacing:2.5px;font-weight:800">First Email Intro · Camelot Property Management</div><h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:68px;line-height:.95;color:#F4D26A;font-style:italic;margin:12px 0">${d.buildingName || d.address}</h1><p style="font-size:20px;color:rgba(255,255,255,.84);line-height:1.55">A concise Camelot introduction with property imagery, neighborhood context, and a clear next step.</p><div style="margin-top:18px;max-width:620px;border-left:3px solid #B8973A;padding:10px 14px;background:rgba(255,255,255,.08);font-size:11px;color:rgba(255,255,255,.76);line-height:1.55">${JACKIE_INTELLIGENT_REPORT_NOTE}</div><p style="font-size:12px;color:rgba(255,255,255,.58);margin-top:28px">${d.address} · ${neighborhoodName(d)} · ${today}</p></div></div></div>
<div class="slide"><div class="pad" style="padding:56px 86px">${logoBadge()}<div class="section-title" style="margin-bottom:20px">Cover Letter</div><div style="max-width:880px;background:#fff;border:1px solid rgba(184,151,58,.38);border-left:5px solid #B8973A;border-radius:6px;padding:34px 42px;box-shadow:0 14px 28px rgba(26,31,54,.06)">${coverLetterParagraphs(d)}</div><div class="source-note">Prepared by Camelot Property Management for ${d.buildingName || d.address} · ${today}</div></div></div>
<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Property Snapshot &amp; New York Reach</div><div style="display:grid;grid-template-columns:.9fr 1.1fr;gap:18px"><div><div class="gold-card" style="margin-bottom:12px"><div class="sub-heading">Property Snapshot</div><table><tr><td>Units</td><td>${fmtN(d.units)}</td></tr><tr><td>Type</td><td>${d.propertyType || 'Residential'}</td></tr><tr><td>Year Built</td><td>${d.yearBuilt || 'Verify'}</td></tr><tr><td>Current Management</td><td>${d.managementCompany || 'To verify'}</td></tr></table></div><div class="gold-card" style="margin-bottom:12px"><div class="sub-heading">Initial Read</div><p class="body-text">${hasRisks ? `Jackie found public-record signals worth reviewing: ${d.violationsOpen} open HPD violation(s), ${fmt$(d.ecbPenaltyBalance)} ECB balance, and ${d.ll97?.period1Penalty ? fmt$(d.ll97.period1Penalty) + ' LL97 modeled exposure' : 'LL97 context to verify'}.` : `The building appears suitable for a boutique, high-attention management review focused on financial clarity, resident experience, vendor control, and board support.`}</p></div><div class="gold-card" style="padding:12px 14px"><div class="sub-heading" style="font-size:15px;margin-bottom:6px">Nearby Context</div>${landmarks.slice(0, 3).map(l => `<div class="check"><span>•</span><div>${l}</div></div>`).join('')}</div></div><div style="display:grid;grid-template-columns:1fr;gap:12px">${propertyImageCard(d, `${d.buildingName || d.address} · image or Google Street View fallback`, 250)}${iframeCard(directionsEmbedUrl(d), 'Camelot HQ to subject property route map', `Camelot HQ at 57 West 57th Street to ${d.buildingName || d.address}`, 170)}</div></div><div class="source-note">Sources: Embedded Google Maps route · LPC / neighborhood landmark context · Jackie property intelligence · uploaded/verified property assets, official branding images, StreetEasy photos, or embedded Google Street View fallback.</div></div></div>
<div class="slide"><div class="pad">${logoBadge()}<div class="section-title">Camelot In One Page</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px"><div class="stat-box"><div class="stat-val">41</div><div class="stat-label">Buildings</div></div><div class="stat-box"><div class="stat-val">$240M</div><div class="stat-label">AUM</div></div><div class="stat-box"><div class="stat-val">2006</div><div class="stat-label">Founded</div></div><div class="stat-box"><div class="stat-val">NYC</div><div class="stat-label">Local Team</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div class="gold-card"><p class="body-text">Camelot is independent, hands-on, and built for boards that want senior attention, clean reporting, faster response, and a management partner that thinks like an owner.</p><p class="body-text" style="margin-top:10px">We are New Yorkers servicing New Yorkers: licensed brokers in business since 2006, with an in-house CPA, legal leadership, and reporting examples built for co-ops, condos, and rental buildings across NYC, the five boroughs, Riverdale, Westchester, and New Jersey.</p>${compactIntelligenceSources()}</div>${responseChart(d)}</div><div class="source-note">Sources: ${CAMELOT_OUR_TEAM_SOURCE} · ${CAMELOT_TEAM_SOURCE} · NYC Open Data · Google Maps · StreetEasy / public listing images · Camelot sample report package.</div></div></div>
${mdsAccountingSlide()}
${residentPortalSlide(d)}
${onboardingChecklistSlide()}
<div class="slide slide-dark"><div class="pad">${logoBadge()}<div style="height:100%;display:flex;flex-direction:column;justify-content:center;text-align:center;max-width:980px;margin:0 auto"><div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:48px;font-style:italic;color:#B8973A;margin-bottom:14px">Proposed Next Step</div><p style="font-size:20px;line-height:1.55;color:rgba(255,255,255,.86);margin-bottom:24px">We would welcome the opportunity to meet with the board, ownership, or decision-makers for ${d.buildingName || d.address}.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px"><div class="gold-card" style="background:rgba(255,255,255,.96);text-align:left"><div class="sub-heading" style="font-size:18px">Zoom or Google Meet</div><p class="small">Best for a quick first screen share, report review, and Q&amp;A.</p></div><div class="gold-card" style="background:rgba(255,255,255,.96);text-align:left"><div class="sub-heading" style="font-size:18px">Phone Call</div><p class="small">A focused 15-minute call to confirm priorities and timing.</p></div><div class="gold-card" style="background:rgba(255,255,255,.96);text-align:left"><div class="sub-heading" style="font-size:18px">In-Person Meeting</div><p class="small">Camelot can meet near the building or at our New York office.</p></div></div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:6px auto 22px"><a href="https://calendar.google.com/calendar/u/0/r/eventedit?text=Camelot+Management+Discussion+-+${encodeURIComponent(d.buildingName || d.address)}&details=${encodeURIComponent('Please generate a Google Meet link for this Camelot management discussion.\n\nSubject property: ' + (d.buildingName || d.address))}&add=${CAMELOT_CONTACT_EMAIL}" target="_blank" style="background:#B8973A;color:#fff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Google Meet</a><a href="https://zoom.us/start/videomeeting" target="_blank" rel="noopener" style="background:#2D8CFF;color:#fff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Zoom</a><a href="tel:+12122069939;ext=701" style="background:#fff;color:#314655;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Call 212-206-9939 x701</a></div><div style="font-size:15px;color:rgba(255,255,255,.82);line-height:1.9"><strong style="color:#B8973A">${CAMELOT_CONTACT_NAME}, ${CAMELOT_CONTACT_TITLE}</strong><br>${CAMELOT_PHONE} | ${CAMELOT_MOBILE}<br>${CAMELOT_CONTACT_EMAIL} | ${CAMELOT_GENERAL_EMAIL}<br>${CAMELOT_WEBSITE}<br>${CAMELOT_OFFICE_ADDRESS}</div></div></div></div>`;
  return deckShell(`Camelot First Email Intro - ${d.buildingName || d.address}`, slides);
}

export function generateBoardMeetingDeck(d: MasterReportData): string {
  const base = generatePitchReport(d);
  const insert = executiveTeamSlide();
  return base.replace('<!-- SLIDE 13: Next Steps (Dark) -->', `${insert}\n<!-- SLIDE 13: Next Steps (Dark) -->`)
    .replace('Property Intelligence Report', 'Board Meeting Deck')
    .replace('<!-- SLIDE 14: Thank You (Dark) -->', '<!-- SLIDE 15: Thank You (Dark) -->');
}

export function generateJackieReportPackage(d: MasterReportData, reportPackage: JackieReportPackage): string {
  if (reportPackage === 'first_email_intro') return generateFirstEmailIntroReport(d);
  if (reportPackage === 'board_meeting_deck') return generateBoardMeetingDeck(d);
  return '';
}

export function buildJackiePackageFilename(d: MasterReportData, reportPackage: JackieReportPackage, extension = 'html'): string {
  const suffix = reportPackage === 'first_email_intro' ? 'First-Email-Intro' : reportPackage === 'board_meeting_deck' ? 'Board-Meeting-Deck' : 'Full-Jackie-Appendix';
  return `Camelot-${suffix}-${cleanFileNamePart(d.buildingName || d.address)}.${extension}`;
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
  const exteriorImage = d.buildingPhotos?.exterior?.[0] || d.commercialIntel?.brandingImages?.[0] || svUrl;
  const interiorImage = d.buildingPhotos?.interior?.[0] || d.buildingPhotos?.exterior?.[1] || d.commercialIntel?.brandingImages?.[1] || exteriorImage;
  const subjectImage = exteriorImage;
  const factCards = [
    { label: 'Units', value: d.units ? fmtN(d.units) : 'Verify' },
    { label: 'Stories', value: d.stories ? fmtN(d.stories) : 'Verify' },
    { label: 'Built', value: d.yearBuilt ? String(d.yearBuilt) : 'Verify' },
    { label: 'Type', value: d.propertyType || 'Residential' },
  ];
  const amenityHighlights = (d.commercialIntel?.amenities || []).slice(0, 8);
  const sourceLine = d.commercialIntel?.researchSources?.slice(0, 3).join(' · ') || 'NYC public records and market-source review';

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
  .slide-cream { background: radial-gradient(circle at top right, rgba(184,151,58,0.10), transparent 34%), #FAF8F5; }
  .slide-dark { background: #34444f; color: #fff; }
  
  /* Camelot logo badge — top right */
  .logo-badge { position: absolute; top: 0; right: 0; width: 156px; height: 92px; background: #B8973A; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 28px rgba(0,0,0,0.14); z-index: 4; }
  .logo-badge img { width: 132px; max-height: 58px; object-fit: contain; }
  .logo-badge-text { color: #111827; font-family: 'Plus Jakarta Sans'; font-size: 15px; font-weight: 700; letter-spacing: 5px; text-align: center; line-height: 1.3; }
  .logo-badge-sub { font-size: 7px; letter-spacing: 3px; font-weight: 500; display: block; margin-top: 2px; }
  
  /* Section title with gold left bar */
  .section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 46px; font-weight: 600; font-style: italic; color: #B8973A; padding-left: 20px; border-left: 5px solid #B8973A; line-height: 1.05; margin-bottom: 24px; }
  
  /* Navy bold subheading */
  .sub-heading { font-family: 'Plus Jakarta Sans'; font-size: 22px; font-weight: 700; color: #1a2744; margin-bottom: 12px; }
  
  /* Body text */
  .body-text { font-size: 16px; color: #4a5568; line-height: 1.7; }
  .body-italic { font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; color: #B8973A; font-size: 17px; }
  
  /* Gold-bordered cards */
  .gold-card { border: 1px solid rgba(184,151,58,0.45); border-left: 4px solid #B8973A; background: rgba(255,255,255,0.92); padding: 20px 24px; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 14px 32px rgba(26,31,54,0.08); }
  
  /* Stat boxes */
  .stat-box { background: rgba(255,255,255,0.94); border: 1px solid rgba(184,151,58,0.25); border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 12px 28px rgba(26,31,54,0.07); }
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
  .eyebrow { font-size: 12px; color: #B8973A; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 800; margin-bottom: 10px; }
  .hero-title { font-family:'Cormorant Garamond',Georgia,serif; font-size: 62px; color:#F4D26A; font-style: italic; font-weight: 700; line-height: 0.98; max-width: 620px; }
  .hero-card { background: rgba(10,18,30,0.46); border: 1px solid rgba(255,255,255,0.14); border-radius: 14px; padding: 18px 20px; }
  .pill { display:inline-flex; align-items:center; border:1px solid rgba(184,151,58,0.45); background:rgba(184,151,58,0.10); color:#1a2744; border-radius:999px; padding:7px 11px; font-size:12px; font-weight:700; margin:0 8px 8px 0; }
  .photo-frame { position:relative; border-radius:18px; overflow:hidden; box-shadow:0 22px 48px rgba(0,0,0,0.28); border:1px solid rgba(184,151,58,0.55); }
  .photo-frame:after { content:''; position:absolute; inset:0; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.14); pointer-events:none; }
</style>
</head>
<body>

<!-- SLIDE 1: Cover (Dark with Street View background) -->
<div class="slide slide-dark" style="background:linear-gradient(110deg, rgba(20,31,43,0.96) 0%, rgba(20,31,43,0.88) 48%, rgba(20,31,43,0.54) 100%), url('${subjectImage}') center/cover no-repeat; background-size:cover;">
  <div class="logo-badge"><img src="./images/camelot-logo.png" alt="Camelot Realty Group" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;logo-badge-text&quot;>CAMELOT<span class=&quot;logo-badge-sub&quot;>REALTY GROUP</span></div>'"></div>
  <div style="display:flex;height:100%">
    <!-- Left side: text -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:68px 40px 62px 64px">
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
      <div class="photo-frame"><img src="${subjectImage}" style="width:400px;height:500px;object-fit:cover;display:block" onerror="this.src='${svUrl}'" /></div>
    </div>
  </div>
  <div style="position:absolute;bottom:20px;left:60px;right:60px;font-size:11px;color:rgba(255,255,255,0.35);border-top:1px solid rgba(255,255,255,0.1);padding-top:12px">
    Prepared exclusively for the ownership and board of ${d.buildingName || d.address} · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Camelot Realty Group · 57 West 57th Street, Suite 410, NYC · (212) 206-9939 · Powered by Camelot OS
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
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px">
      ${factCards.map(card => `<div class="stat-box" style="padding:14px;text-align:left"><div class="stat-label">${card.label}</div><div class="stat-val" style="font-size:30px">${card.value}</div></div>`).join('')}
    </div>
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
        <div style="display:grid;grid-template-columns:1fr;gap:12px">
          <div class="photo-frame"><img src="${exteriorImage}" style="width:420px;height:180px;object-fit:cover;display:block" onerror="this.src='${svUrl}'" /></div>
          <div class="photo-frame"><img src="${interiorImage}" style="width:420px;height:180px;object-fit:cover;display:block" onerror="this.src='${exteriorImage}'" /></div>
        </div>
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
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:18px">
      <a href="https://calendar.google.com/calendar/u/0/r/eventedit?text=Camelot+Management+Discussion+-+${encodeURIComponent(d.buildingName || d.address)}&details=${encodeURIComponent('Please generate a Google Meet link for this Camelot management discussion.\n\nSubject property: ' + (d.buildingName || d.address))}&add=${CAMELOT_CONTACT_EMAIL}" target="_blank" style="background:#B8973A;color:#fff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Google Meet</a>
      <a href="https://zoom.us/start/videomeeting" target="_blank" rel="noopener" style="background:#2D8CFF;color:#fff;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Zoom</a>
      <a href="tel:+12122069939;ext=701" style="background:#fff;color:#314655;text-decoration:none;border-radius:6px;padding:10px 14px;font-size:12px;font-weight:700">Call 212-206-9939 x701</a>
    </div>
    <div style="font-size:16px;color:rgba(255,255,255,0.7);line-height:2">
      212-206-9939 ext. 701  |  646-523-9068<br>
      info@camelot.nyc<br>
      www.camelot.nyc<br>
      57 West 57th Street, Suite 410, New York, NY 10019
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
57 West 57th Street, Suite 410, New York, NY 10019
(212) 206-9939 ext. 701  |  (646) 523-9068
info@camelot.nyc  |  www.camelot.nyc

RED Awards 2025: PM Company of the Year | REBNY 2025: David Goldoff Leadership Award`;
}




