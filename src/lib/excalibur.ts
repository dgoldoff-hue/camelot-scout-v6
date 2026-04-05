/**
 * Excalibur — Camelot Agreement Engine
 * Generates branded property management agreements by asset class.
 * Pulls building data from Jackie/SCOUT to auto-populate where possible.
 */

import type { MasterReportData, TieredPricing } from './camelot-report';

// ============================================================
// Types
// ============================================================

export type AssetClass = 'rental' | 'condo' | 'coop' | 'new-construction' | 'office' | 'single-tenant';

export interface AgreementInput {
  // Asset class
  assetClass: AssetClass;
  // Parties
  clientName: string;
  clientEntityName: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  // Building details
  units: number;
  blockLot: string;  // e.g., "Block 1234, Lot 56"
  isRentStabilized: boolean;
  isUnion: boolean;
  buildingType: string;  // e.g., "45 Residential Units · All Rent Stabilized"
  // Agreement terms
  effectiveDate: string;  // YYYY-MM-DD
  initialTermYears: number;  // default 2
  renewalTermYears: number;  // default 1
  terminationNoticeDays: number;  // default 90
  annualIncrease: number;  // default 4 (percent)
  // Pricing
  selectedTier: 'classic' | 'intelligence' | 'premier';
  customMonthlyFee: number | null;  // override calculated fee
  startupFee: number;  // default 0
  // Special terms
  specialTerms: string;
  // Jackie data (auto-populated if available)
  jackieData: MasterReportData | null;
  tieredPricing: TieredPricing | null;
}

export const DEFAULT_INPUT: AgreementInput = {
  assetClass: 'rental',
  clientName: '',
  clientEntityName: '',
  propertyAddress: '',
  propertyCity: 'New York',
  propertyState: 'NY',
  propertyZip: '',
  units: 0,
  blockLot: '',
  isRentStabilized: false,
  isUnion: false,
  buildingType: '',
  effectiveDate: new Date().toISOString().slice(0, 10),
  initialTermYears: 2,
  renewalTermYears: 1,
  terminationNoticeDays: 90,
  annualIncrease: 4,
  selectedTier: 'intelligence',
  customMonthlyFee: null,
  startupFee: 0,
  specialTerms: '',
  jackieData: null,
  tieredPricing: null,
};

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  'rental': 'Residential Rental Building',
  'condo': 'Condominium',
  'coop': 'Cooperative (Co-op)',
  'new-construction': 'New Construction Condominium',
  'office': 'Office Building',
  'single-tenant': 'Single Tenant / Individual Unit',
};

// ============================================================
// Constants
// ============================================================

const CAMELOT = {
  name: 'CAMELOT PROPERTY MANAGEMENT SERVICES CORP.',
  shortName: 'Camelot Property Management Services Corp.',
  address: '477 Madison Avenue, 6th Floor, New York, NY 10022',
  phone: '(212) 206-9939 x 701',
  mobile: '(646) 523-9068',
  email: 'dgoldoff@camelot.nyc',
  web: 'www.camelot.nyc',
  principal: 'David A. Goldoff',
  title: 'President',
};

// ============================================================
// Fee Calculator
// ============================================================

function getMonthlyFee(input: AgreementInput): number {
  if (input.customMonthlyFee) return input.customMonthlyFee;
  if (input.tieredPricing) {
    const tier = input.tieredPricing[input.selectedTier];
    return tier.monthly;
  }
  // Fallback: calculate from units
  let perUnit: number;
  const u = input.units || 1;
  switch (input.selectedTier) {
    case 'classic': perUnit = u < 30 ? 50 : u <= 75 ? 45 : u <= 150 ? 40 : 38; break;
    case 'intelligence': perUnit = u < 30 ? 65 : u <= 75 ? 55 : u <= 150 ? 50 : 45; break;
    case 'premier': perUnit = u < 30 ? 85 : u <= 75 ? 75 : u <= 150 ? 70 : 65; break;
  }
  return perUnit * u;
}

function getPerUnit(input: AgreementInput): number {
  const monthly = getMonthlyFee(input);
  return Math.round(monthly / (input.units || 1));
}

// ============================================================
// HTML Agreement Generator
// ============================================================

export function generateRentalAgreement(input: AgreementInput): string {
  const fee = getMonthlyFee(input);
  const perUnit = getPerUnit(input);
  const fullAddr = `${input.propertyAddress}, ${input.propertyCity}, ${input.propertyState} ${input.propertyZip}`.trim();
  const tierLabel = input.selectedTier === 'classic' ? 'Camelot Classic' : input.selectedTier === 'intelligence' ? 'Camelot Intelligence' : 'Camelot Premier';
  const year = new Date(input.effectiveDate || Date.now()).getFullYear();

    const version = `v${new Date().getFullYear()}.${(new Date().getMonth()+1).toString().padStart(2,'0')}.1`;
  const timestamp = new Date().toISOString();
  const encodedAddr = encodeURIComponent(fullAddr);

  const css = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'DM Sans',sans-serif;color:#2C3240;font-size:12px;line-height:1.7;background:#fff}
@media print{@page{margin:0.6in 0.75in;size:letter}body{font-size:11px}}
.page{max-width:750px;margin:0 auto;padding:40px 0;counter-reset:page-num}
h1,h2,h3{font-family:'Plus Jakarta Sans',sans-serif}
.article,.cover{counter-increment:page-num;position:relative}
.page-footer{text-align:center;font-size:8px;color:#bbb;padding-top:8px;border-top:1px solid #E5E3DE;margin-top:16px;display:flex;justify-content:space-between;align-items:center}
.page-footer::after{content:counter(page-num);font-weight:500;font-size:9px;color:#999}
.cover{background:#3A4B5B;color:#fff;padding:60px;text-align:center;min-height:700px;display:flex;flex-direction:column;justify-content:center;align-items:center;page-break-after:always;border:3px solid #A89035}
.cover .wordmark{font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;letter-spacing:12px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:4px}
.cover h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;color:#A89035;font-weight:700;margin:20px 0 8px}
.cover .subtitle{font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:4px}
.cover .meta{font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px}
.cover .prepared{margin-top:40px;font-size:12px;color:#A89035;font-style:italic}
.article{page-break-inside:avoid;margin-bottom:20px}
.article-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;color:#A89035;font-weight:700;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #A89035}
.article-sub{font-size:13px;font-weight:600;color:#3A4B5B;margin:12px 0 6px}
.article p{margin-bottom:8px;text-align:justify}
.footer{text-align:center;font-size:9px;color:#999;padding-top:10px;border-top:1px solid #E5E3DE;margin-top:20px}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
.sig-box{padding-top:20px}
.sig-line{border-bottom:1px solid #2C3240;height:40px;margin-bottom:4px}
.sig-label{font-size:10px;color:#888}
table.schedule{width:100%;border-collapse:collapse;margin:12px 0;font-size:11px}
table.schedule th{background:#A89035;color:#fff;padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px}
table.schedule td{padding:8px 12px;border-bottom:1px solid #E5E3DE}
table.schedule tr:nth-child(even){background:#F5F0E5}
.free{color:#16a34a;font-weight:700}
.included{color:#A89035;font-weight:600}
.tier-badge{display:inline-block;background:#A89035;color:#fff;padding:2px 10px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
</style>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Property Management Agreement — ${input.clientName || 'Client'} | ${CAMELOT.shortName}</title>
${css}
</head>
<body>
<div class="page">

<!-- COVER PAGE -->
<div class="cover">
<img src="./images/camelot-logo-white.png" alt="Camelot" style="width:120px;margin-bottom:24px;opacity:0.9" onerror="this.style.display='none'">
<div class="wordmark">C A M E L O T</div>
<div style="font-size:12px;color:#A89035;letter-spacing:2px;margin-bottom:30px">Property Management Services Corp.</div>
<h1>Property Management Agreement</h1>
<div class="subtitle">For ${ASSET_CLASS_LABELS[input.assetClass]}</div>
<div style="font-size:13px;color:#fff;margin-top:16px;font-weight:600">${CAMELOT.name}</div>
<div class="meta">${CAMELOT.address}</div>
<div class="meta">${CAMELOT.phone} · ${CAMELOT.web}</div>
<div class="prepared">Prepared for: ${input.clientName || '[Client Name]'} — ${year}</div>
<div class="meta" style="margin-top:8px">${fullAddr} · Confidential</div>
<div style="margin-top:20px"><span class="tier-badge">${tierLabel} Package</span></div>
</div>

<!-- PROPERTY VISUAL & MAP -->
<div class="article" style="page-break-before:always">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;color:#A89035;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #A89035">The Property</div>

<!-- Street View Photo -->
${input.jackieData?.latitude && input.jackieData?.longitude ? `
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6;height:250px;margin-bottom:12px;position:relative">
<iframe src="https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${input.jackieData.latitude},${input.jackieData.longitude}&heading=0&pitch=5&fov=80" width="100%" height="250" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(58,75,91,0.9));padding:12px 16px 8px;color:#fff">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700">${fullAddr}</div>
<div style="font-size:10px;opacity:0.7">${input.units || ''} Units ${input.blockLot ? '· ' + input.blockLot : ''}</div>
</div>
</div>
` : `
<div style="border-radius:8px;overflow:hidden;border:1px solid #D5D0C6;height:250px;margin-bottom:12px">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=18&maptype=satellite" width="100%" height="250" style="border:0" allowfullscreen loading="lazy"></iframe>
</div>
`}

<!-- Two maps: Street + Directions to Camelot -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
<div style="border-radius:6px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddr}&zoom=16" width="100%" height="160" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:8px;color:#999;padding:3px">📍 Property Location</div>
</div>
<div style="border-radius:6px;overflow:hidden;border:1px solid #D5D0C6">
<iframe src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodedAddr}&mode=driving" width="100%" height="160" style="border:0" allowfullscreen loading="lazy"></iframe>
<div style="text-align:center;font-size:8px;color:#999;padding:3px">🚗 From Camelot HQ — 477 Madison Ave</div>
</div>
</div>

<!-- Property Details Grid -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px">
<div style="background:#EDE9DF;border-radius:6px;padding:10px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:800;color:#A89035">${input.units || '—'}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Units</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:10px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;color:#3A4B5B">${input.blockLot || '—'}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Block/Lot</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:10px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;color:#3A4B5B">${input.isRentStabilized ? 'Yes' : 'No'}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Rent Stabilized</div>
</div>
<div style="background:#EDE9DF;border-radius:6px;padding:10px;text-align:center">
<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;color:#3A4B5B">${input.isUnion ? '32BJ' : 'Non-Union'}</div>
<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px">Labor Status</div>
</div>
</div>

<div class="page-footer">
<span>${CAMELOT.shortName} · ${CAMELOT.address}</span>
<span>${version} · ${timestamp.split('T')[0]} · Generated by Excalibur AI</span>
</div>
</div>

<!-- PREAMBLE -->
<div class="article">
<p>THIS PROPERTY MANAGEMENT AGREEMENT (the "Agreement") is made as of ${input.effectiveDate ? new Date(input.effectiveDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '________________, ' + year} (the "Effective Date"), by and between:</p>

<p><strong>CLIENT ("Owner"):</strong> ${input.clientEntityName || input.clientName || '[Client Entity Name]'} ("Client")<br>
Property Address: ${fullAddr}<br>
Portfolio: ${input.units || '[___]'} ${input.buildingType || 'Residential Units'}${input.isRentStabilized ? ' · All Rent Stabilized' : ''}${input.blockLot ? '<br>Block/Lot: ' + input.blockLot : ''}</p>

<p><strong>AGENT ("Manager"):</strong> ${CAMELOT.name}, a New York corporation ("Agent"), ${CAMELOT.address} · ${CAMELOT.principal}, ${CAMELOT.title} · ${CAMELOT.mobile} · ${CAMELOT.email}</p>

<p>WHEREAS the Client owns real property known as and located at: ${fullAddr} (the "Property"), consisting of ${input.units || '[___]'} ${input.isRentStabilized ? 'rent-stabilized ' : ''}residential rental units; and</p>
<p>WHEREAS the Client desires to engage the Agent to perform property management services as set forth herein, and the Agent desires to accept such engagement;</p>
<p>NOW, THEREFORE, for good and valuable consideration, the sufficiency of which is hereby acknowledged, the Parties agree as follows:</p>
</div>

<!-- ARTICLE I — DEFINITIONS -->
<div class="article">
<div class="article-title">Article I — Definitions</div>
<p>"Additional Services" shall mean Lease Services, Transfer Services, Financing Services, Hearing Services, Audit Services, Pre-Occupation Services, and Emergency Services, as each are defined in Article VII.</p>
<p>"Client Account" shall mean a bank account, held at an FDIC-insured institution, maintained by the Agent on behalf of and for the benefit of the Client, to receive rent collections and disburse approved operating expenses.</p>
<p>"Emergency Services" shall mean any Additional Services that, by reasonable determination of the Agent, must be performed on an emergency basis to protect the safety of persons or to prevent imminent damage to the Property and cannot await prior written approval.</p>
<p>"Employees" shall mean all persons necessary to be employed or otherwise engaged (including superintendents, porters, handymen, and other building staff) to properly maintain and operate the Property.</p>
<p>"Effective Date" shall mean the date first written above on which this Agreement becomes operative.</p>
<p>"Lease Rate" shall mean the annual or monthly rate of rent charged to a tenant under a lease agreement.</p>
<p>"Reimbursable Expenses" shall mean all reasonable, documented out-of-pocket expenses incurred by the Agent in connection with the Services and Additional Services, to be paid from Client Accounts.</p>
<p>"Residential Unit" shall mean any and all residential dwelling units at the Property subject to this Agreement, including any preferential, market-rate, or rent-stabilized units.</p>
<p>"Services" shall mean the property management duties of the Agent set forth in Article VI of this Agreement, not including the Additional Services.</p>
<p>"Term" shall mean the Initial Period and any renewal period(s) as described in Article II.</p>
<p>"Union Contract" shall mean any collective bargaining agreement or contract with a labor union representing Employees at the Property.</p>
</div>

<!-- ARTICLE II — TERM -->
<div class="article">
<div class="article-title">Article II — Term</div>
<p>The initial period of this Agreement (the "Initial Period") shall commence on the Effective Date and conclude on the ${input.initialTermYears === 1 ? 'one (1) year' : input.initialTermYears === 2 ? 'two (2) year' : input.initialTermYears + ' (' + input.initialTermYears + ') year'} anniversary of the Effective Date, unless sooner terminated in accordance with Article IV hereof.</p>
<p>Upon expiration of the Initial Period, this Agreement shall automatically renew for successive ${input.renewalTermYears === 1 ? 'one (1) year' : input.renewalTermYears + ' (' + input.renewalTermYears + ') year'} terms (each, a "Renewal Term"), unless either Party provides written notice of non-renewal at least ${input.terminationNoticeDays} (${input.terminationNoticeDays}) days prior to the end of the then-current term. The Initial Period and any Renewal Term(s) are collectively referred to herein as the "Term."</p>
<p>The management fee set forth in Article V shall be subject to an annual increase of ${input.annualIncrease} percent (${input.annualIncrease}%) on each anniversary of the Effective Date during the Term.</p>
</div>

<!-- ARTICLE III — EXCLUSIVE AGENCY -->
<div class="article">
<div class="article-title">Article III — Exclusive Agency</div>
<p>During the Term, and absent prior written consent of the Agent, no party other than the Agent shall perform any of the Services at the Property. The Client acknowledges and agrees that the Agent shall serve as the sole and exclusive managing agent for the Property during the Term.</p>
<p>The Agent shall have the authority to act on behalf of the Client in all matters relating to the day-to-day operation and management of the Property, subject to the limitations and requirements set forth in this Agreement.</p>
</div>

<!-- ARTICLE IV — TERMINATION -->
<div class="article">
<div class="article-title">Article IV — Termination</div>
<div class="article-sub">4.1 Termination for Cause.</div>
<p>If either Party is in material breach of this Agreement, the non-breaching Party shall provide written notice of such breach. The breaching Party shall have fifteen (15) business days from receipt of such notice to cure the breach. If the breach is not cured within such period, the non-breaching Party may terminate this Agreement immediately upon written notice.</p>
<div class="article-sub">4.2 Termination for Insolvency.</div>
<p>Either Party may terminate this Agreement immediately upon written notice if the other Party: (i) becomes insolvent or makes a general assignment for the benefit of creditors; (ii) files a voluntary petition in bankruptcy; (iii) has an involuntary petition in bankruptcy filed against it that is not dismissed within sixty (60) days; (iv) has a receiver or trustee appointed for its property; (v) is dissolved or liquidated; or (vi) takes any corporate action for the purposes of any of the foregoing.</p>
<div class="article-sub">4.3 Termination Without Cause.</div>
<p>Either Party may terminate this Agreement without cause upon not less than (i) ${input.terminationNoticeDays} (${input.terminationNoticeDays}) days' written notice during the Initial Period, or (ii) sixty (60) days' written notice during any Renewal Term.</p>
<div class="article-sub">4.4 Obligations Upon Termination.</div>
<p>Upon termination of this Agreement, the Parties shall account to each other with respect to all uncompleted business, and the Agent shall: (a) deliver to the Client all books, records, rent rolls, lease files, and keys relating to the Property; (b) transfer all Client Account funds to an account designated by the Client; (c) provide written notice of termination to all tenants and vendors as directed by the Client; and (d) cooperate fully in transitioning management responsibilities to the Client or a successor manager.</p>
<div class="article-sub">4.5 Termination Fee.</div>
<p>In the event of early termination by the Client without cause during the Initial Period, the Client shall pay the Agent a termination fee equal to three (3) months' management fee at the then-current rate, as liquidated damages and not as a penalty. No termination fee shall apply if termination is for cause by the Client, or upon expiration of the Initial Period or any Renewal Term.</p>
</div>

<!-- ARTICLE V — COMPENSATION -->
<div class="article">
<div class="article-title">Article V — Compensation</div>
<div class="article-sub">5.1 Management Fee.</div>
<p>As consideration for the performance of the Services, the Client shall pay to the Agent a monthly management fee equal to the greater of: (a) ${fee > 0 ? '$' + fee.toLocaleString() : 'the Fixed Monthly Fee set forth in Schedule A'} (${perUnit > 0 ? '$' + perUnit + '/unit × ' + input.units + ' units' : 'as calculated'}), or (b) five percent (5%) of gross monthly rent collected from the Property during such month. The management fee shall be deducted directly from the Client Account on the first business day of each month.</p>
<div class="article-sub">5.2 Accounting & Reporting Fee.</div>
<p>The monthly accounting and reporting fee is WAIVED as a base recurring charge for this engagement. Notwithstanding the foregoing, accounting and reporting services shall be billed at $150/hour when such services are required specifically in connection with: (a) property or financial audits of the Property; (b) tenant rent disputes, rent overcharge proceedings, or arrears litigation; or (c) City agency proceedings involving rent treble charge calculations or DHCR overcharge investigations.</p>
<div class="article-sub">5.3 Technology Fee.</div>
<p>The Client shall pay the Agent a monthly technology fee of Fifty Dollars ($50.00) per month, covering access to the Agent's Merlin AI portfolio intelligence platform, the ConciergePlus resident portal, the owner reporting dashboard, digital work order system, and electronic rent collection infrastructure. As a promotional incentive, the technology fee shall be fully waived for the first six (6) months from the Effective Date of this Agreement.</p>
${input.startupFee > 0 ? `<div class="article-sub">5.4 Startup/Onboarding Fee.</div>
<p>The Client shall pay a one-time onboarding fee of $${input.startupFee.toLocaleString()} upon execution of this Agreement, covering initial property audit, file migration, technology setup, vendor onboarding, and transition coordination.</p>` : ''}
<div class="article-sub">5.${input.startupFee > 0 ? '5' : '4'} Payment for Additional Services.</div>
<p>As consideration for Additional Services rendered, the Client shall pay the Agent the fees set forth in Schedule A (Ancillary Fee Schedule) and Article VII of this Agreement. All such fees shall become due and payable within five (5) business days of the Agent's invoice.</p>
<div class="article-sub">5.${input.startupFee > 0 ? '6' : '5'} Annual Fee Adjustment.</div>
<p>The management fee and all recurring monthly fees shall increase by ${input.annualIncrease} percent (${input.annualIncrease}%) per year, effective on each anniversary of the Effective Date.</p>
<div class="article-sub">5.${input.startupFee > 0 ? '7' : '6'} Interest on Late Payments.</div>
<p>Any invoice or fee that remains unpaid for more than thirty (30) days from the due date shall accrue interest at the rate of one and one-half percent (1.5%) per month (18% per annum), or the maximum rate permitted by law, whichever is less.</p>
</div>

<!-- ARTICLE VI — AGENT'S DUTIES -->
<div class="article">
<div class="article-title">Article VI — Agent's Duties (the "Services")</div>
<p>As consideration for the Compensation, during the Term the Agent shall perform the following Services:</p>
<div class="article-sub">6.1 Regular Repairs and Maintenance.</div>
<p>Agent shall cause the Property to be maintained in such condition as may be deemed advisable, including but not limited to arranging for routine repairs, preventive maintenance, cleaning, and upkeep of the building's common areas, mechanical systems, and exterior. Agent shall use commercially reasonable efforts to obtain competitive pricing from qualified vendors.</p>
<div class="article-sub">6.2 Inspection Visits.</div>
<p>Agent shall make regular visits to and inspections of the Property not less than bi-weekly, and shall provide the Client with written reports of any material conditions observed during such inspections. Agent shall maintain a log of all inspection visits.</p>
<div class="article-sub">6.3 Violations & Regulatory Compliance.</div>
<p>Agent shall monitor, recommend, and with the approval of the Client, cause all necessary acts and things to be done in order to comply with any statute, ordinance, law, order, rule, or regulation affecting the Property, including but not limited to: HPD registration and violation clearance; ${input.isRentStabilized ? 'DHCR rent-stabilization filings and annual registrations; ' : ''}DOB permit management; FDNY inspection coordination; ECB hearing representation; window guard compliance; lead paint disclosure and abatement notices; CO detector notices; Local Law 97 energy compliance monitoring; and any other applicable NYC administrative code requirements.</p>
<div class="article-sub">6.4 Utilities and Service Contracts.</div>
<p>Agent shall enter into, maintain, or renew contracts for electricity, gas, steam, fuel oil, water, telephone, internet, extermination, janitorial, elevator, boiler, and other services necessary for the operation of the Property, at prevailing market rates.</p>
<div class="article-sub">6.5 Rent Collection and Legal Proceedings.</div>
<p>Agent shall bill or cause to be billed all tenants for monthly rent and any additional charges. Agent shall pursue collection of all arrears through written notices, demand letters, and, with Client's authorization, the commencement of non-payment and holdover proceedings in Housing Court.</p>
${input.isRentStabilized ? `<div class="article-sub">6.6 Rent-Stabilization Compliance.</div>
<p>For rent-stabilized buildings, Agent shall: prepare and file annual DHCR Rent Registration statements; prepare and serve all required lease renewal notices (RTP-8) within required timeframes; process tenant lease renewals at the applicable DHCR guidelines rate; maintain complete rent history files for each unit; coordinate Major Capital Improvement (MCI) and Individual Apartment Improvement (IAI) applications as directed; and advise the Client on compliance with applicable rent-stabilization regulations.</p>` : ''}
<div class="article-sub">6.${input.isRentStabilized ? '7' : '6'} Reports and Financial Statements.</div>
<p>Agent shall, on a monthly basis, render a comprehensive operating report including: (a) income and expense statement; (b) bank reconciliation; (c) accounts payable/receivable aging report; (d) rent roll with arrears summary; (e) open violation report; and (f) any other reports reasonably requested by the Client. Annual reports shall include a year-end summary and budget variance analysis.</p>
<div class="article-sub">6.${input.isRentStabilized ? '8' : '7'} Insurance Administration.</div>
<p>Agent shall, at the Client's expense, procure and maintain in full force and effect on behalf of the Client: (a) commercial general liability insurance with limits of not less than $2,000,000 per occurrence and $5,000,000 aggregate; (b) property insurance covering the building for full replacement cost; (c) umbrella/excess liability insurance with limits of not less than $10,000,000; (d) workers' compensation and employer's liability insurance as required by New York law; (e) boiler and machinery coverage; and (f) such other insurance as the Client may reasonably require.</p>
<div class="article-sub">6.${input.isRentStabilized ? '9' : '8'} Emergency Contact.</div>
<p>Agent shall maintain a 24-hour, seven-day-a-week telephone emergency hotline for reporting of and prompt response to emergency conditions at the Property.</p>
<div class="article-sub">6.${input.isRentStabilized ? '10' : '9'} Capital Improvements.</div>
<p>Agent shall assist the Client in identifying, bidding, and supervising capital improvement projects at the Property. Agent shall obtain not less than three (3) competitive bids for any capital project exceeding $5,000 in cost. For projects totaling $25,000 or more, Agent shall be entitled to a construction supervision fee equal to ten percent (10%) of the total project cost. Construction oversight for projects under $25,000 is included in the base management fee.</p>
</div>

<!-- ARTICLES VII-XVII (condensed for all asset classes) -->
<div class="article">
<div class="article-title">Article VII — Additional Services</div>
<p>The following Additional Services are outside the scope of the base Services and shall be billed separately pursuant to Schedule A: Lease Services (exclusive leasing for vacant units), Transfer Services (assignment/transfer processing), Financing Services (mortgage creation at 1% of loan amount, refinancing at 1% of amount refinanced), Hearing Services ($150/hour for non-routine proceedings), Audit Services ($150/hour), Pre-Occupation Services ($150/hour for unit preparation), and Emergency Services ($200/hour for after-hours Agent personnel).</p>
</div>

<div class="article">
<div class="article-title">Article VIII — Additional Fees</div>
<p>Application review fees shall be collected from applicants per applicable law. Regulatory filing fees (1098/1099, RPIE, DHCR registration) shall be billed per Schedule A. Payroll service fees shall be paid from Client Accounts. All brokerage commissions shall be payable to ${CAMELOT.name}.</p>
</div>

<div class="article">
<div class="article-title">Article IX — Protection of the Property Management Company</div>
<p>Agent shall hire, pay, and supervise all Employees. The Client shall not directly hire, terminate, or supervise building Employees or contract with vendors for covered services without the Agent's prior written consent. The Agent shall be entitled to rely upon all information provided by the Client.</p>
</div>

<div class="article">
<div class="article-title">Article X — Indemnification</div>
<p>Client will indemnify the Agent against any liability, damages, costs, or claims arising out of the condition of the Property, acts of the Client or Employees, or third-party claims (other than those arising from the Agent's gross negligence or willful misconduct). The Agent shall indemnify the Client from claims arising from the Agent's gross negligence or willful misconduct.</p>
</div>

<div class="article">
<div class="article-title">Article XI — Authority</div>
<p>Client authorizes the Agent to perform any act reasonably necessary to carry out the Services. Any single expenditure in excess of $2,500 shall require Client's prior written approval, except for Emergency Services or recurring approved expenses.</p>
</div>

<div class="article">
<div class="article-title">Article XII — Bank Accounts</div>
<p>Agent shall establish and maintain separate Client Accounts at an FDIC-insured bank. Transfers exceeding $10,000 require Client approval (except approved recurring expenses and Agent compensation). Agent shall maintain a separate security deposit escrow account per New York State Real Property Law §7-103.</p>
</div>

<div class="article">
<div class="article-title">Articles XIII–XVII</div>
<p><strong>XIII. Licenses:</strong> Agent is duly licensed by the New York State Department of State as a real estate broker and holds all required licenses.</p>
<p><strong>XIV. Miscellaneous:</strong> All notices shall be in writing via certified mail or overnight courier. If any provision is held invalid, remaining provisions continue in full force.</p>
<p><strong>XV. Governing Law:</strong> This Agreement shall be governed by the laws of the State of New York. Venue: New York County.</p>
<p><strong>XVI. Entire Agreement:</strong> This Agreement and all Schedules constitute the entire agreement and supersede all prior understandings.</p>
<p><strong>XVII. Independent Contractor:</strong> The Agent is an independent contractor, not an employee, partner, or joint venturer of the Client.</p>
</div>

${input.specialTerms ? `
<div class="article">
<div class="article-title">Special Terms & Conditions</div>
<p>${input.specialTerms.replace(/\n/g, '</p><p>')}</p>
</div>` : ''}

<!-- SIGNATURE PAGE -->
<div class="article" style="page-break-before:always">
<div class="article-title">Execution</div>
<p>IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of the day and year first written above.</p>
<div class="sig-grid">
<div class="sig-box">
<p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">CLIENT (OWNER)</p>
<p style="font-size:11px;color:#555;margin-bottom:4px">${input.clientEntityName || input.clientName || '[Client Entity Name]'}</p>
<div class="sig-line"></div>
<div class="sig-label">By: ___________________________</div>
<div class="sig-label">Name: ${input.clientName || '___________________________'}</div>
<div class="sig-label">Title: ___________________________</div>
<div class="sig-label">Date: ___________________________</div>
</div>
<div class="sig-box">
<p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">AGENT</p>
<p style="font-size:11px;color:#555;margin-bottom:4px">${CAMELOT.name}</p>
<div class="sig-line"></div>
<div class="sig-label">By: ___________________________</div>
<div class="sig-label">Name: ${CAMELOT.principal}</div>
<div class="sig-label">Title: ${CAMELOT.title}</div>
<div class="sig-label">Date: ___________________________</div>
</div>
</div>
</div>

<!-- SCHEDULE A -->
<div class="article" style="page-break-before:always">
<div class="article-title">Schedule A — Ancillary Fee Schedule (${tierLabel})</div>
<p style="font-size:11px;color:#555;margin-bottom:12px">These fees are charged on an as-needed basis in addition to the monthly management, accounting, and technology fees. All fees subject to annual ${input.annualIncrease}% adjustment.</p>

<table class="schedule">
<thead><tr><th colspan="3">Base Monthly Fees</th></tr></thead>
<tbody>
<tr><td><strong>Management Fee</strong></td><td><strong>$${fee.toLocaleString()}/month</strong> ($${perUnit}/unit × ${input.units} units)</td><td>Greater of fixed fee or 5% of gross rent</td></tr>
<tr><td>Accounting & Reporting</td><td class="free">WAIVED</td><td>$150/hr for audits, disputes & agency proceedings</td></tr>
<tr><td>Technology Fee</td><td>$50/month</td><td class="free">FREE for first 6 months</td></tr>
${input.startupFee > 0 ? `<tr><td>Onboarding Fee</td><td><strong>$${input.startupFee.toLocaleString()}</strong></td><td>One-time startup/transition</td></tr>` : ''}
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Regulatory Filings</th></tr></thead>
<tbody>
${input.isRentStabilized ? '<tr><td>DHCR Annual Rent Registration</td><td>$50/unit</td><td>Per filing year</td></tr>' : ''}
<tr><td>RPIE / RPIE-Exception Filing</td><td>$400 flat</td><td>Real Property Income & Expense</td></tr>
<tr><td>1098 / 1099 Tax Forms</td><td>$25/form</td><td>Per form processed</td></tr>
<tr><td>Client Account Establishment</td><td>$250/account</td><td>One-time per account</td></tr>
<tr><td>HPD Registration (Annual)</td><td class="included">Included</td><td>In base management fee</td></tr>
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Tenant Administration</th></tr></thead>
<tbody>
<tr><td>Lease Application Processing</td><td>$200/application</td><td>Background, credit, verification</td></tr>
<tr><td>Move-In Administration</td><td>$150/unit</td><td>Inspection, key coordination</td></tr>
<tr><td>Move-Out Administration</td><td>$150/unit</td><td>Inspection, deposit reconciliation</td></tr>
<tr><td>Lease Renewal Processing</td><td>$350/unit</td><td>${input.isRentStabilized ? 'DHCR renewal prep, RTP-8 service' : 'Renewal prep and execution'}</td></tr>
<tr><td>Sub-Lease / Assignment Review</td><td>$500/transaction</td><td>Application and approval coordination</td></tr>
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Violations & Legal</th></tr></thead>
<tbody>
<tr><td>Violation Research & Filing</td><td>$95/violation</td><td>HPD, DOB, ECB</td></tr>
<tr><td>Housing Court Preparation</td><td>$150/proceeding</td><td>Non-payment / holdover coordination</td></tr>
<tr><td>Administrative Hearing</td><td>$150/hour</td><td>ECB, DHCR, etc.</td></tr>
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Construction & Capital</th></tr></thead>
<tbody>
<tr><td>Construction Supervision</td><td>10% of project cost</td><td>Projects $25,000+; under $25K included</td></tr>
<tr><td>Pre-Occupation Services</td><td>$150/hour</td><td>Unit prep prior to new tenancy</td></tr>
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Financing & Insurance</th></tr></thead>
<tbody>
<tr><td>Mortgage Creation Fee</td><td>1% of loan amount</td><td>At closing</td></tr>
<tr><td>Refinancing Fee</td><td>1% of amount refinanced</td><td>Or 1% of total new loan</td></tr>
<tr><td>Lender Coordination</td><td>$150–$200/hour</td><td>Separate from creation/refi fee</td></tr>
<tr><td>Insurance Administration</td><td>$450/year</td><td>Professional liability cost-share</td></tr>
</tbody>
</table>

<table class="schedule">
<thead><tr><th colspan="3">Technology & Emergency</th></tr></thead>
<tbody>
<tr><td>Merlin AI Analytics</td><td class="included">Included in Tech Fee</td><td>FREE first 6 months</td></tr>
<tr><td>ConciergePlus Portal</td><td class="included">Included</td><td>Resident portal</td></tr>
<tr><td>Energy Benchmarking (LL84/97)</td><td>$250/year</td><td>Annual filing</td></tr>
<tr><td>Emergency Personnel</td><td>$200/hour</td><td>After-hours Agent staff</td></tr>
<tr><td>Emergency Contractor</td><td>At cost + 15%</td><td>Coordination fee</td></tr>
</tbody>
</table>

<p style="font-size:10px;color:#888;margin-top:12px;text-align:center">All fees subject to annual adjustment of ${input.annualIncrease}% per year on each anniversary of the Effective Date.</p>
</div>

<div class="footer">
${CAMELOT.shortName} · ${CAMELOT.address}<br>
Confidential · © ${year} · All Rights Reserved<br>
<span style="font-size:7px;color:#bbb">${version} · Generated ${timestamp.split('T')[0]} · Created by Excalibur AI · Camelot OS</span>
</div>

</div>
</body>
</html>`;
}

// ============================================================
// Export: Generate agreement by asset class
// ============================================================

export function generateAgreement(input: AgreementInput): string {
  // For now, all asset classes use the rental template as base
  // Condo, co-op, office, etc. will get specialized versions
  switch (input.assetClass) {
    case 'rental':
      return generateRentalAgreement(input);
    case 'condo':
    case 'coop':
    case 'new-construction':
    case 'office':
    case 'single-tenant':
      // TODO: Specialized templates — for now use rental as base
      return generateRentalAgreement(input);
    default:
      return generateRentalAgreement(input);
  }
}
