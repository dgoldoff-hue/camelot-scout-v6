/**
 * Sentinel Full Report Template
 * Generated from generate_report.py — matches camelot-market-reports.onrender.com exactly
 * 50KB self-contained HTML with Leaflet maps, Chart.js charts, 12 neighborhood cards
 */

export function generateFullSentinelReport(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Camelot Realty Group — Q1 2026 Market Report · Public Edition</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  :root {
    --navy:  #0D2240;
    --gold:  #B8973A;
    --teal:  #1A6B7C;
    --white: #FFFFFF;
    --light: #F5F3EE;
    --text:  #1a1a1a;
    --muted: #555;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; color: var(--text); background: var(--white); }
  h1,h2,h3,h4 { font-family: 'Lora', serif; }

  /* ---- PRINT ---- */
  @media print { .no-print { display: none !important; } }

  /* ---- HERO ---- */
  .hero {
    background: var(--navy);
    color: var(--white);
    padding: 80px 60px 60px;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: var(--gold);
  }
  .hero-logo { font-family: 'Lora', serif; font-size: 1.1rem; letter-spacing: .15em; color: var(--gold); margin-bottom: 40px; text-transform: uppercase; }
  .hero h1 { font-size: 3.2rem; line-height: 1.1; margin-bottom: 16px; }
  .hero h1 em { color: var(--gold); font-style: normal; }
  .hero-quarter { font-size: 1rem; color: rgba(255,255,255,.65); margin-bottom: 32px; letter-spacing: .05em; }
  .hero-meta { display: flex; gap: 48px; flex-wrap: wrap; font-size: .82rem; color: rgba(255,255,255,.55); }
  .hero-meta strong { color: rgba(255,255,255,.85); display: block; margin-bottom: 2px; }
  .hero-tagline { position: absolute; top: 80px; right: 60px; font-size: .78rem; letter-spacing: .12em; color: var(--gold); text-transform: uppercase; opacity: .7; }

  /* ---- PRINT BUTTON ---- */
  .print-btn {
    display: block; text-align: center; padding: 10px 0; background: var(--gold);
    color: var(--white); font-size: .78rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: none; width: 100%; font-family: 'Poppins', sans-serif;
  }

  /* ---- PORTFOLIO STATS ---- */
  .stats-bar {
    background: var(--light);
    display: flex; justify-content: space-around; flex-wrap: wrap;
    padding: 48px 60px; gap: 32px;
    border-bottom: 1px solid #ddd;
  }
  .stat-block { text-align: center; }
  .stat-block .big { font-family: 'Lora', serif; font-size: 2.4rem; color: var(--navy); font-weight: 700; }
  .stat-block .label { font-size: .78rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 4px; }

  /* ---- SECTION ---- */
  .section { padding: 72px 60px; }
  .section.alt { background: var(--light); }
  .section-label { font-size: .72rem; text-transform: uppercase; letter-spacing: .14em; color: var(--gold); margin-bottom: 8px; }
  .section-title { font-size: 2rem; color: var(--navy); margin-bottom: 8px; }
  .section-title em { color: var(--teal); font-style: normal; }
  .section-sub { color: var(--muted); font-size: .92rem; margin-bottom: 40px; max-width: 680px; line-height: 1.6; }
  .gold-rule { width: 48px; height: 3px; background: var(--gold); margin: 12px 0 32px; }

  /* ---- INSIGHTS GRID ---- */
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-top: 40px;
  }
  .insight-card {
    background: var(--navy);
    color: var(--white);
    padding: 32px 28px;
    border-radius: 2px;
    border-left: 4px solid var(--gold);
    position: relative;
  }
  .insight-num { font-size: .72rem; color: var(--gold); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 12px; }
  .insight-text { font-family: 'Lora', serif; font-size: 1.1rem; line-height: 1.45; }

  /* ---- TABLE ---- */
  .data-table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: .88rem; }
  .data-table th { background: var(--navy); color: var(--white); padding: 12px 16px; text-align: left; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
  .data-table td { padding: 12px 16px; border-bottom: 1px solid #e8e4da; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:nth-child(even) td { background: rgba(184,151,58,.05); }
  .current-row td { background: rgba(184,151,58,.12) !important; }

  /* ---- NBHD CARDS ---- */
  .nbhd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 32px; }
  .nbhd-card { background: var(--white); border: 1px solid #e0dbd0; border-radius: 2px; overflow: hidden; }
  .nbhd-header { background: var(--navy); color: var(--white); padding: 18px 20px; }
  .nbhd-name { font-family: 'Lora', serif; font-size: 1.05rem; margin-bottom: 2px; }
  .nbhd-zip { font-size: .75rem; color: rgba(255,255,255,.55); }
  .nbhd-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .nbhd-stat { padding: 12px 16px; border-right: 1px solid #e8e4da; border-bottom: 1px solid #e8e4da; }
  .nbhd-stat:nth-child(even) { border-right: none; }
  .stat-label { font-size: .7rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 2px; }
  .stat-val { font-size: 1.05rem; font-weight: 600; color: var(--navy); }
  .nbhd-tag { padding: 8px 16px; font-size: .75rem; background: rgba(26,107,124,.08); color: var(--teal); font-weight: 600; border-top: 1px solid #e8e4da; }
  .nbhd-tag.scout { background: rgba(184,151,58,.08); color: var(--gold); }

  /* ---- MAP ---- */
  #market-map { height: 480px; border: 1px solid #ddd; margin-top: 32px; }

  /* ---- CHARTS ---- */
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
  .chart-card { background: var(--white); border: 1px solid #e0dbd0; padding: 24px; }
  .chart-title { font-family: 'Lora', serif; font-size: 1rem; color: var(--navy); margin-bottom: 4px; }
  .chart-sub { font-size: .75rem; color: var(--muted); margin-bottom: 16px; }

  /* ---- NOTE BOX ---- */
  .intel-note {
    background: rgba(13,34,64,.04);
    border-left: 4px solid var(--gold);
    padding: 20px 24px;
    margin-top: 32px;
    font-size: .88rem;
    line-height: 1.6;
    color: var(--navy);
  }
  .intel-note strong { color: var(--gold); }

  /* ---- SCORES TABLE ---- */
  .score-overall { font-size: 1.1rem; color: var(--teal); }

  /* ---- CAMELOT ADVANTAGE ---- */
  .advantage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 24px; margin-top: 32px; }
  .adv-card { border: 1px solid #e0dbd0; padding: 24px; }
  .adv-driver { font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--gold); margin-bottom: 8px; }
  .adv-desc { font-size: .88rem; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }
  .adv-impact { font-size: .92rem; color: var(--teal); font-weight: 700; }

  /* ---- BRAND STORY ---- */
  .brand-section { background: var(--navy); color: var(--white); padding: 80px 60px; }
  .brand-section h2 { color: var(--white); margin-bottom: 4px; }
  .brand-section h2 em { color: var(--gold); font-style: normal; }
  .brand-section .gold-rule { background: var(--gold); }
  .brand-section p { color: rgba(255,255,255,.75); line-height: 1.7; font-size: .95rem; max-width: 720px; margin-bottom: 24px; }
  .brand-section blockquote { border-left: 3px solid var(--gold); padding-left: 24px; margin: 32px 0; font-family: 'Lora', serif; font-style: italic; color: rgba(255,255,255,.85); font-size: 1.05rem; line-height: 1.6; }
  .brand-section cite { display: block; margin-top: 8px; font-size: .8rem; color: var(--gold); font-style: normal; letter-spacing: .05em; }
  .os-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
  .os-card { background: rgba(255,255,255,.06); border: 1px solid rgba(184,151,58,.3); padding: 28px; }
  .os-card h4 { color: var(--gold); margin-bottom: 8px; font-family: 'Lora', serif; }
  .os-card p { color: rgba(255,255,255,.65); font-size: .88rem; line-height: 1.6; }

  /* ---- CTA ---- */
  .cta-section { background: var(--light); padding: 80px 60px; text-align: center; }
  .cta-section h2 { color: var(--navy); font-size: 2.2rem; margin-bottom: 12px; }
  .cta-section p { color: var(--muted); max-width: 560px; margin: 0 auto 40px; line-height: 1.6; }
  .cta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 24px; max-width: 800px; margin: 0 auto; }
  .cta-card { background: var(--white); border: 1px solid #e0dbd0; padding: 28px 24px; text-align: left; }
  .cta-card h4 { color: var(--navy); margin-bottom: 8px; }
  .cta-card p { font-size: .85rem; color: var(--muted); line-height: 1.5; }

  /* ---- FOOTER ---- */
  footer { background: var(--navy); color: rgba(255,255,255,.5); padding: 48px 60px; font-size: .8rem; line-height: 1.7; }
  footer strong { color: rgba(255,255,255,.8); }
  footer a { color: var(--gold); text-decoration: none; }
  .footer-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 32px; }
  .footer-logo { font-family: 'Lora', serif; font-size: 1.1rem; color: var(--gold); letter-spacing: .1em; margin-bottom: 8px; }
  .footer-divider { border-top: 1px solid rgba(255,255,255,.1); padding-top: 24px; }
  .disclaimer { font-size: .75rem; color: rgba(255,255,255,.4); margin-top: 20px; max-width: 800px; line-height: 1.6; }

  @media (max-width: 768px) {
    .hero, .section, .stats-bar, .brand-section, .cta-section, footer { padding: 48px 24px; }
    .hero h1 { font-size: 2rem; }
    .hero-tagline { display: none; }
    .os-grid, .charts-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<!-- PRINT BUTTON -->
<button class="print-btn no-print" onclick="window.print()">Save as PDF using your browser's Print → Save as PDF</button>

<!-- HERO -->
<section class="hero">
  <div class="hero-tagline">Boutique. By Design. Powered by Intelligence.</div>
  <div class="hero-logo">Camelot Realty Group</div>
  <h1>New York City<br><em>Residential Market</em><br>Report</h1>
  <div class="hero-quarter">Q1 2026 — January 1 – March 31, 2026</div>
  <div class="hero-meta">
    <div><strong>Data Sources:</strong> RealtyMX API · ACRIS · NYC DOF · StreetEasy · REBNY RLS</div>
    <div><strong>Portfolio:</strong> 6 confirmed buildings · 243+ units tracked</div>
    <div><strong>Published:</strong> April 2026</div>
    <div><strong>Prepared by:</strong> Sentinel / Camelot OS</div>
  </div>
</section>

<!-- STATS BAR -->
<div class="stats-bar">
  <div class="stat-block"><div class="big">42</div><div class="label">Buildings Under Management</div></div>
  <div class="stat-block"><div class="big">5,351+</div><div class="label">Units Tracked · Market Intelligence</div></div>
  <div class="stat-block"><div class="big">$240M+</div><div class="label">Assets Under Management</div></div>
  <div class="stat-block"><div class="big">4</div><div class="label">Markets Covered</div></div>
</div>

<!-- FIVE INSIGHTS -->
<section class="section">
  <div class="section-label">Quarterly Intelligence</div>
  <h2 class="section-title">Q1 2026 <em>Market Insights</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Five data points that define the New York City residential market this quarter, drawn from Camelot's RealtyMX intelligence account, ACRIS public records, and third-party market reports.</p>
  <div class="insights-grid">
    <div class="insight-card"><div class="insight-num">Insight 01 · Building Performance</div><div class="insight-text">5 of 6 tracked buildings beat their neighborhood median $/sqft</div></div>
    <div class="insight-card"><div class="insight-num">Insight 02 · Rental Velocity</div><div class="insight-text">Sub-$3,500/mo 1-BRs clearing in under 14 days — demand outpacing supply</div></div>
    <div class="insight-card"><div class="insight-num">Insight 03 · Rate Sensitivity</div><div class="insight-text">Every 50bps rate drop unlocks 8–10% more buying power</div></div>
    <div class="insight-card"><div class="insight-num">Insight 04 · Rent vs. Buy</div><div class="insight-text">Rent-vs-buy break-even: 20 yrs in Sunnyside, 38+ yrs in Tribeca</div></div>
    <div class="insight-card"><div class="insight-num">Insight 05 · Neighborhood Value Spectrum</div><div class="insight-text">$/sqft ranges from $660 (Sunnyside) to $2,100 (Tribeca/SoHo)</div></div>
  </div>
</section>

<!-- EXECUTIVE SUMMARY -->
<section class="section alt">
  <div class="section-label">Executive Summary</div>
  <h2 class="section-title">Q1 2026 <em>Market Overview</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">The New York City residential real estate market entered 2026 with continued inventory constraints, rising renter demand, and a rate environment that continues to suppress sales volume while keeping rental pricing power firmly with landlords.</p>
  <p class="section-sub">Manhattan rentals remain strong, with median rents in key submarkets — Chelsea, Murray Hill, Harlem, Hell's Kitchen — holding above prior-year levels. The outer boroughs continue to attract residents priced out of core Manhattan. Sunnyside and Woodside in Queens demonstrate particularly strong absorption.</p>
  <p class="section-sub">The co-op and condo sales market remains selective, with buyers favoring pre-war buildings with strong financials and low flip ratios. Dollar-per-square-foot metrics are the primary lens through which this report analyzes building value — enabling building-level comparisons across Camelot's managed portfolio.</p>
</section>

<!-- MAP -->
<section class="section">
  <div class="section-label">Geographic Coverage</div>
  <h2 class="section-title">NYC Portfolio <em>Map</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Camelot's managed buildings and tracked market coverage span the core NYC residential submarkets.</p>
  <div id="market-map"></div>
</section>

<!-- PORTFOLIO INTELLIGENCE TABLE -->
<section class="section alt">
  <div class="section-label">Portfolio Intelligence</div>
  <h2 class="section-title">Camelot-Managed Buildings: <em>Value Analysis</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Each confirmed Camelot building benchmarked against its neighborhood median $/sqft, with annual income potential and value upside modeled at a 10% improvement.</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>Building</th><th>Neighborhood</th><th>Type</th>
        <th>Bldg $/Sqft</th><th>Nbhd Median</th><th>vs. Market</th>
        <th>Annual Income Potential</th><th>Value Upside (10%)</th>
      </tr>
    </thead>
    <tbody>
        <tr>
          <td><strong>Harlem Condominium</strong></td>
          <td>Harlem, Manhattan</td>
          <td>Condo</td>
          <td>$950</td>
          <td>$892</td>
          <td style="color:#2e7d32;font-weight:700">+6.5% ▲</td>
          <td>$1.44M/yr</td>
          <td>$2.62M</td>
        </tr>
        <tr>
          <td><strong>Sunnyside Condominium</strong></td>
          <td>Sunnyside, Queens</td>
          <td>Condo</td>
          <td>$680</td>
          <td>$660</td>
          <td style="color:#2e7d32;font-weight:700">+3.0% ▲</td>
          <td>$1.71M/yr</td>
          <td>$2.77M</td>
        </tr>
        <tr>
          <td><strong>Murray Hill Condominium</strong></td>
          <td>Murray Hill, Manhattan</td>
          <td>Mixed Use</td>
          <td>$1,350</td>
          <td>$1,380</td>
          <td style="color:#c62828;font-weight:700">-2.2% ▼</td>
          <td>$2.01M/yr</td>
          <td>$3.67M</td>
        </tr>
        <tr>
          <td><strong>Washington Heights Co-op</strong></td>
          <td>Washington Heights, Manhattan</td>
          <td>Co-op</td>
          <td>$480</td>
          <td>$440</td>
          <td style="color:#2e7d32;font-weight:700">+9.1% ▲</td>
          <td>$2.00M/yr</td>
          <td>$2.52M</td>
        </tr>
        <tr>
          <td><strong>Stuyvesant/Gramercy Co-op</strong></td>
          <td>Stuyvesant/Gramercy</td>
          <td>Co-op</td>
          <td>$1,100</td>
          <td>$1,050</td>
          <td style="color:#2e7d32;font-weight:700">+4.8% ▲</td>
          <td>$2.91M/yr</td>
          <td>$5.17M</td>
        </tr>
        <tr>
          <td><strong>Hell's Kitchen Condo</strong></td>
          <td>Hell's Kitchen, Manhattan</td>
          <td>Condo</td>
          <td>$1,200</td>
          <td>$1,180</td>
          <td style="color:#2e7d32;font-weight:700">+1.7% ▲</td>
          <td>$0.48M/yr</td>
          <td>$0.86M</td>
        </tr></tbody>
  </table>
  <div class="intel-note">
    <strong>Intelligence Note:</strong> 5 of 6 confirmed Camelot buildings are trading above their neighborhood median $/sqft — a testament to disciplined financial management and proactive capital planning.
  </div>
</section>

<!-- NEIGHBORHOOD BENCHMARKS -->
<section class="section">
  <div class="section-label">Neighborhood Benchmarks</div>
  <h2 class="section-title">Market Comparables <em>by Submarket</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Camelot properties are benchmarked against their immediate submarket — enabling building-level value positioning analysis. Additional submarkets tracked by SCOUT are included for investment coverage.</p>
  <div class="nbhd-grid">
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Harlem / Manhattan Valley</div>
            <div class="nbhd-zip">ZIP 10026–10030</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$892</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$610</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$50</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$2,950/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$3,800/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">18 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Harlem Condominium</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Murray Hill / NoMad</div>
            <div class="nbhd-zip">ZIP 10016</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,380</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$980</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$75</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$4,200/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$6,100/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">12 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Murray Hill Condominium</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Stuyvesant / Gramercy</div>
            <div class="nbhd-zip">ZIP 10003–10009</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,250</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$1,050</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$65</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,800/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$5,600/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">14 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Stuyvesant/Gramercy Co-op</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Hell's Kitchen / Midtown W</div>
            <div class="nbhd-zip">ZIP 10036–10019</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,180</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$880</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$68</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,600/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$5,200/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">16 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Hell's Kitchen Condo</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Washington Heights</div>
            <div class="nbhd-zip">ZIP 10032–10040</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$560</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$440</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$37</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$2,100/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$2,850/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">22 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Washington Heights Co-op</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Sunnyside / Woodside</div>
            <div class="nbhd-zip">ZIP 11104/11377</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$660</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$430</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$41</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$2,400/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$3,100/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">15 days</span></div>
          </div>
          <div class="nbhd-tag">Camelot: Sunnyside Condominium</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Greenpoint</div>
            <div class="nbhd-zip">ZIP 11222</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,020</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$720</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$55</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,200/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$4,400/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">13 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Long Island City</div>
            <div class="nbhd-zip">ZIP 11101</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,090</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$680</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$57</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,450/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$4,700/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">11 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Upper East Side</div>
            <div class="nbhd-zip">ZIP 10021/10065</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,620</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$1,140</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$82</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$4,600/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$7,200/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">14 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Tribeca / SoHo</div>
            <div class="nbhd-zip">ZIP 10013/10012</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$2,100</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$1,480</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$98</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$5,200/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$8,400/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">10 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Brooklyn Heights</div>
            <div class="nbhd-zip">ZIP 11201</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,280</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$980</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$62</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,600/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$5,100/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">12 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div>
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">Park Slope</div>
            <div class="nbhd-zip">ZIP 11215/11217</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">$1,150</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">$820</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">$53</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">$3,100/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">$4,600/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">14 days</span></div>
          </div>
          <div class="nbhd-tag scout">SCOUT Coverage Zone</div>
        </div></div>
</section>

<!-- CHARTS -->
<section class="section alt">
  <div class="section-label">Market Analytics</div>
  <h2 class="section-title">Data Visualization: <em>Q1 2026 Key Indicators</em></h2>
  <div class="gold-rule"></div>
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">Sale Price $/Sqft by Submarket</div>
      <div class="chart-sub">Condo vs. Co-op · Q1 2026</div>
      <canvas id="chart-ppsf"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Median Rental Rates by Submarket</div>
      <div class="chart-sub">1BR and 2BR · Q1 2026</div>
      <canvas id="chart-rent"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Average Days on Market</div>
      <div class="chart-sub">Rental Listings · Q1 2026</div>
      <canvas id="chart-dom"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Rental $/Sqft/Year by Submarket</div>
      <div class="chart-sub">Annual Rental Yield Benchmark · Q1 2026</div>
      <canvas id="chart-yield"></canvas>
    </div>
  </div>
</section>

<!-- RATE ENVIRONMENT -->
<section class="section">
  <div class="section-label">Rate Environment</div>
  <h2 class="section-title">Interest Rates: <em>What They Mean for the Market</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">The interest rate environment is the single most significant macro variable affecting NYC real estate in 2026. Modeled on a $1M purchase at 80% LTV.</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>Mortgage Rate</th><th>Monthly Payment</th><th>Annual Debt Service</th>
        <th>Required Income (28%)</th><th>vs. Renting $4K/mo</th><th>Market Signal</th>
      </tr>
    </thead>
    <tbody>
        <tr class="">
          <td><strong>3.5% (2021 era)</strong></td>
          <td>$3,593/mo</td>
          <td>$43,116</td>
          <td>$153,986</td>
          <td>Favorable buy</td>
          <td><strong>Strong buy signal</strong></td>
        </tr>
        <tr class="">
          <td><strong>5.5% (forecast 2026+)</strong></td>
          <td>$4,542/mo</td>
          <td>$54,504</td>
          <td>$194,657</td>
          <td>Near parity</td>
          <td><strong>Improving</strong></td>
        </tr>
        <tr class="current-row">
          <td><strong>6.75% (Q1 2026 actual)</strong></td>
          <td>$5,186/mo</td>
          <td>$62,232</td>
          <td>$222,257</td>
          <td>Rent favored</td>
          <td><strong>Wait or buy value</strong></td>
        </tr>
        <tr class="">
          <td><strong>7.5% (2023 peak)</strong></td>
          <td>$5,594/mo</td>
          <td>$67,128</td>
          <td>$239,743</td>
          <td>Rent strongly fav.</td>
          <td><strong>Rate sensitive</strong></td>
        </tr></tbody>
  </table>
  <div class="intel-note">
    <strong>Camelot Rate Advisory:</strong> Every 50bps rate reduction unlocks roughly 8–10% more buying power. The most important near-term signal for NYC real estate is the Federal Reserve's rate trajectory. Even at current rates, value-focused submarkets (Harlem, Washington Heights, Queens) represent compelling entry points relative to peak-market pricing.
  </div>
</section>

<!-- NEIGHBORHOOD SCORES -->
<section class="section alt">
  <div class="section-label">Neighborhood Intelligence</div>
  <h2 class="section-title">Market Scores: <em>How Each Neighborhood Rates</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Scored across four dimensions — investment yield potential, livability, family infrastructure, and work access — plus price momentum direction. Scores are proprietary Camelot/SCOUT composite indices.</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>Neighborhood</th><th>💰 Invest</th><th>🏠 Live</th>
        <th>👨‍👩‍👧 Family</th><th>💼 Work Access</th><th>📈 Momentum</th><th>Overall</th>
      </tr>
    </thead>
    <tbody>
        <tr>
          <td><strong>Harlem / Manhattan Valley</strong></td>
          <td>8.2</td>
          <td>7.4</td>
          <td>6.8</td>
          <td>7.6</td>
          <td><strong>↑ Strong</strong></td>
          <td class="score-overall"><strong>7.5</strong></td>
        </tr>
        <tr>
          <td><strong>Murray Hill / NoMad</strong></td>
          <td>7.8</td>
          <td>8.2</td>
          <td>7.0</td>
          <td>9.1</td>
          <td><strong>↑ Moderate</strong></td>
          <td class="score-overall"><strong>8.0</strong></td>
        </tr>
        <tr>
          <td><strong>Stuyvesant / Gramercy</strong></td>
          <td>7.6</td>
          <td>8.4</td>
          <td>7.5</td>
          <td>8.8</td>
          <td><strong>↑ Moderate</strong></td>
          <td class="score-overall"><strong>8.1</strong></td>
        </tr>
        <tr>
          <td><strong>Hell's Kitchen</strong></td>
          <td>7.5</td>
          <td>7.8</td>
          <td>6.2</td>
          <td>9.0</td>
          <td><strong>→ Stable</strong></td>
          <td class="score-overall"><strong>7.6</strong></td>
        </tr>
        <tr>
          <td><strong>Washington Heights</strong></td>
          <td>8.6</td>
          <td>7.2</td>
          <td>7.8</td>
          <td>6.4</td>
          <td><strong>↑↑ Very Strong</strong></td>
          <td class="score-overall"><strong>7.5</strong></td>
        </tr>
        <tr>
          <td><strong>Sunnyside / Woodside</strong></td>
          <td>8.8</td>
          <td>7.6</td>
          <td>8.2</td>
          <td>7.2</td>
          <td><strong>↑↑ Very Strong</strong></td>
          <td class="score-overall"><strong>7.9</strong></td>
        </tr>
        <tr>
          <td><strong>Greenpoint</strong></td>
          <td>8.4</td>
          <td>8.6</td>
          <td>7.9</td>
          <td>7.4</td>
          <td><strong>↑ Strong</strong></td>
          <td class="score-overall"><strong>8.1</strong></td>
        </tr>
        <tr>
          <td><strong>Long Island City</strong></td>
          <td>8.7</td>
          <td>8.0</td>
          <td>7.2</td>
          <td>8.8</td>
          <td><strong>↑↑ Very Strong</strong></td>
          <td class="score-overall"><strong>8.2</strong></td>
        </tr>
        <tr>
          <td><strong>Upper East Side</strong></td>
          <td>6.8</td>
          <td>8.8</td>
          <td>9.2</td>
          <td>8.4</td>
          <td><strong>→ Stable</strong></td>
          <td class="score-overall"><strong>8.3</strong></td>
        </tr>
        <tr>
          <td><strong>Tribeca / SoHo</strong></td>
          <td>6.4</td>
          <td>9.2</td>
          <td>8.4</td>
          <td>8.6</td>
          <td><strong>→ Stable</strong></td>
          <td class="score-overall"><strong>8.2</strong></td>
        </tr>
        <tr>
          <td><strong>Brooklyn Heights</strong></td>
          <td>7.2</td>
          <td>9.0</td>
          <td>8.8</td>
          <td>8.2</td>
          <td><strong>→ Stable</strong></td>
          <td class="score-overall"><strong>8.3</strong></td>
        </tr>
        <tr>
          <td><strong>Park Slope</strong></td>
          <td>7.4</td>
          <td>9.1</td>
          <td>9.4</td>
          <td>7.8</td>
          <td><strong>↑ Moderate</strong></td>
          <td class="score-overall"><strong>8.4</strong></td>
        </tr></tbody>
  </table>
</section>

<!-- CAMELOT ADVANTAGE -->
<section class="section">
  <div class="section-label">The Camelot Advantage</div>
  <h2 class="section-title">How We <em>Protect and Build</em> Your Asset's Value</h2>
  <div class="gold-rule"></div>
  <div class="advantage-grid">
    <div class="adv-card"><div class="adv-driver">Compliance Management</div><div class="adv-desc">Zero open HPD/DOB violations = premium board scorecard, faster unit sales, cleaner financing.</div><div class="adv-impact">+3–8% sale premium</div></div>
    <div class="adv-card"><div class="adv-driver">Resident Retention (MERLIN)</div><div class="adv-desc">AI-powered resident communication reduces turnover — every prevented vacancy saves 1–2 months rent + leasing costs.</div><div class="adv-impact">+$3,500–8,000/unit/yr</div></div>
    <div class="adv-card"><div class="adv-driver">Online Payments (Prisma)</div><div class="adv-desc">90% reduction in NSF returns via Plaid-linked ACH; faster collections improve building cash flow.</div><div class="adv-impact">+$500–1,200/unit/yr</div></div>
    <div class="adv-card"><div class="adv-driver">Technology Premium</div><div class="adv-desc">Smart access, mobile app, amenity booking commands leasing velocity and lifestyle premium.</div><div class="adv-impact">+$50–150/sqft value</div></div>
    <div class="adv-card"><div class="adv-driver">Energy Optimization (Parity)</div><div class="adv-desc">HVAC automation reduces utility costs 15–25% and improves Local Law 97 compliance posture.</div><div class="adv-impact">+$1–3/sqft/yr</div></div>
    <div class="adv-card"><div class="adv-driver">Capital Advisory (SCOUT)</div><div class="adv-desc">Identifies comp premiums; recommends targeted improvements with the highest ROI per dollar spent.</div><div class="adv-impact">+5–15% building value</div></div>
  </div>
</section>

<!-- BRAND STORY -->
<section class="brand-section">
  <div class="section-label" style="color:var(--gold)">Why Camelot</div>
  <h2>Our Standard. <em>Our Difference.</em></h2>
  <div class="gold-rule"></div>
  <blockquote>
    "Don't let it be forgot, that once there was a spot, for one brief shining moment, that was known as Camelot."
    <cite>— Jacqueline Kennedy, Life Magazine, November 29, 1963</cite>
  </blockquote>
  <p>After the loss of President Kennedy, Jackie chose one word to define what his presidency had meant: Camelot — idealism, excellence, glamour, and genuine care. That is what we named our company after. The conviction that the management of a building — someone's home, someone's investment — deserves to be done beautifully, intelligently, and with absolute intention.</p>
  <p>We are not a traditional property management firm. We are a technology-first real estate intelligence operation, boutique by design and institutional in capability. Every building we manage benefits from tools, data, and insight that most management companies simply don't have.</p>

  <div style="margin-top:48px">
    <div class="section-label" style="color:var(--gold)">Introducing</div>
    <h3 style="font-family:'Lora',serif;color:var(--white);font-size:1.8rem;margin-bottom:8px">Camelot OS</h3>
    <div class="gold-rule"></div>
    <p>Beneath every building we manage runs a proprietary intelligence platform built entirely in-house. Camelot OS is the operating system of the modern boutique property management firm.</p>
    <div class="os-grid">
      <div class="os-card"><h4>SCOUT</h4><p>Our real-time market intelligence engine. SCOUT continuously tracks comparable sales, rental absorption, building-level $/sqft, and distressed asset signals across 196 NYC buildings.</p></div>
      <div class="os-card"><h4>Sentinel</h4><p>Our quarterly market intelligence engine — the watchful guardian keeping Camelot's eye on the market. Pulls live RealtyMX data, synthesizes insights, and generates this report automatically.</p></div>
      <div class="os-card"><h4>Merlin</h4><p>Our AI-powered advisory engine. Merlin analyzes building-level performance data to surface actionable recommendations for boards, owners, and investors.</p></div>
      <div class="os-card"><h4>Jackie</h4><p>Our new business development engine. Jackie runs the full pitch workflow — Property Intelligence Report, 90-Day Transition Plan, and board presentation — automatically.</p></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <h2>Is Your Property Performing at Its Full Potential?</h2>
  <p>We offer complimentary market consultations across the New York metro area. Let us show you exactly where your building stands — and where it could be.</p>
  <div class="cta-grid">
    <div class="cta-card"><h4>Board Members</h4><p>Find out what your building is worth and how it benchmarks against comparable buildings in your neighborhood.</p></div>
    <div class="cta-card"><h4>Unit Owners</h4><p>Understand your unit's market value, rental income potential, and how to position it in a competitive market.</p></div>
    <div class="cta-card"><h4>Developers &amp; Investors</h4><p>Institutional-grade analytics on acquisition targets, development comps, and portfolio performance.</p></div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-top">
    <div>
      <div class="footer-logo">Camelot Realty Group</div>
      <div>President/CEO &amp; Licensed Broker</div>
      <div><a href="mailto:info@camelot.nyc">info@camelot.nyc</a></div>
      <div>477 Madison Avenue, 6th Floor, New York, NY 10022</div>
      <div><a href="tel:2122069939">212-206-9939</a></div>
      <div><a href="https://www.camelot.nyc">www.camelot.nyc</a></div>
    </div>
    <div>
      <div><strong>Report Frequency:</strong> Quarterly (Q1–Q4)</div>
      <div><strong>Published:</strong> April 2026</div>
      <div><strong>Data Engine:</strong> Sentinel / Camelot OS</div>
      <div><strong>Market Data:</strong> RealtyMX API · ACRIS · StreetEasy · REBNY RLS</div>
    </div>
  </div>
  <div class="footer-divider">
    <div><strong>Boutique. By Design. Powered by Intelligence.</strong></div>
    <div class="disclaimer">
      © 2026 Camelot Realty Group. All Rights Reserved. This report and all of its contents are the intellectual property of Camelot Realty Group. The information is provided for general informational and educational purposes only and does not constitute investment, financial, or legal advice. Market data is derived from publicly available records and licensed third-party data sources including RealtyMX, ACRIS, and StreetEasy. While Camelot has made reasonable efforts to ensure accuracy, no warranty is made as to completeness or fitness for any particular purpose. Permission requests: <a href="mailto:dgoldoff@camelot.nyc">dgoldoff@camelot.nyc</a>
    </div>
  </div>
</footer>

<!-- MAP + CHART SCRIPTS -->
<script>
// --- MAP ---
const map = L.map('market-map').setView([40.748, -73.985], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const NAVY = '#0D2240', GOLD = '#B8973A', TEAL = '#1A6B7C';

const camelotBuildings = [
  {lat:40.8116, lng:-73.9465, name:"Harlem Condominium", nbhd:"Harlem"},
  {lat:40.7440, lng:-73.9210, name:"Sunnyside Condominium", nbhd:"Sunnyside, Queens"},
  {lat:40.7484, lng:-73.9799, name:"Murray Hill Condominium", nbhd:"Murray Hill"},
  {lat:40.8418, lng:-73.9395, name:"Washington Heights Co-op", nbhd:"Washington Heights"},
  {lat:40.7358, lng:-73.9841, name:"Stuyvesant/Gramercy Co-op", nbhd:"Gramercy"},
  {lat:40.7608, lng:-73.9923, name:"Hell's Kitchen Condo", nbhd:"Hell's Kitchen"},
];

const scoutZones = [
  {lat:40.7195, lng:-73.9971, name:"SoHo / Tribeca", type:"scout"},
  {lat:40.7505, lng:-74.0040, name:"Chelsea / West Village", type:"scout"},
  {lat:40.7274, lng:-73.9799, name:"East Village", type:"scout"},
  {lat:40.7154, lng:-73.9843, name:"Lower East Side", type:"scout"},
  {lat:40.7721, lng:-73.9561, name:"Upper East Side", type:"scout"},
  {lat:40.7282, lng:-73.9553, name:"Greenpoint", type:"scout"},
  {lat:40.7447, lng:-73.9493, name:"Long Island City", type:"scout"},
  {lat:40.6960, lng:-73.9939, name:"Brooklyn Heights", type:"scout"},
  {lat:40.6682, lng:-73.9794, name:"Park Slope", type:"scout"},
];

function markerIcon(color) {
  return L.divIcon({
    html: \`<div style="width:14px;height:14px;border-radius:50%;background:\${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>\`,
    iconSize:[14,14], iconAnchor:[7,7], className:''
  });
}

camelotBuildings.forEach(b => {
  L.marker([b.lat, b.lng], {icon: markerIcon(GOLD)})
    .addTo(map)
    .bindPopup(\`<strong>\${b.name}</strong><br>\${b.nbhd}<br><em>Camelot Managed</em>\`);
});

scoutZones.forEach(z => {
  L.marker([z.lat, z.lng], {icon: markerIcon(TEAL)})
    .addTo(map)
    .bindPopup(\`<strong>\${z.name}</strong><br>SCOUT Coverage Zone\`);
});

// Legend
const legend = L.control({position:'bottomright'});
legend.onAdd = () => {
  const d = L.DomUtil.create('div');
  d.style.cssText = 'background:white;padding:12px 16px;font-family:Poppins,sans-serif;font-size:12px;border:1px solid #ccc';
  d.innerHTML = \`
    <div style="margin-bottom:6px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:\${GOLD};margin-right:8px;vertical-align:middle"></span>Camelot Buildings</div>
    <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:\${TEAL};margin-right:8px;vertical-align:middle"></span>Market Tracked</div>\`;
  return d;
};
legend.addTo(map);

// --- CHARTS ---
const chartLabels = ["Harlem","Murray Hill","Stuyvesant","Hell's Kitchen","Washington Heights","Sunnyside","Greenpoint","Long Island City","Upper East Side","Tribeca","Brooklyn Heights","Park Slope"];
const shortLabels = chartLabels.map(l => l.length > 12 ? l.substring(0,12)+'…' : l);

const chartDefaults = {
  responsive: true,
  plugins: { legend: { labels: { font: { family: 'Poppins', size: 11 } } } },
  scales: { x: { ticks: { font: { family:'Poppins', size:10 }, maxRotation:45 } }, y: { ticks: { font: { family:'Poppins', size:11 } } } }
};

new Chart(document.getElementById('chart-ppsf'), {
  type: 'bar',
  data: {
    labels: shortLabels,
    datasets: [
      { label: 'Condo $/Sqft', data: [892, 1380, 1250, 1180, 560, 660, 1020, 1090, 1620, 2100, 1280, 1150], backgroundColor: 'rgba(13,34,64,0.8)' },
      { label: 'Co-op $/Sqft', data: [610, 980, 1050, 880, 440, 430, 720, 680, 1140, 1480, 980, 820],  backgroundColor: 'rgba(184,151,58,0.7)' }
    ]
  },
  options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display:true, text:'$/Sqft', font:{family:'Poppins'} } } } }
});

new Chart(document.getElementById('chart-rent'), {
  type: 'bar',
  data: {
    labels: shortLabels,
    datasets: [
      { label: '1BR Median Rent', data: [2950, 4200, 3800, 3600, 2100, 2400, 3200, 3450, 4600, 5200, 3600, 3100], backgroundColor: 'rgba(26,107,124,0.8)' },
      { label: '2BR Median Rent', data: [3800, 6100, 5600, 5200, 2850, 3100, 4400, 4700, 7200, 8400, 5100, 4600], backgroundColor: 'rgba(184,151,58,0.7)' }
    ]
  },
  options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display:true, text:'$/Month', font:{family:'Poppins'} } } } }
});

new Chart(document.getElementById('chart-dom'), {
  type: 'bar',
  data: {
    labels: shortLabels,
    datasets: [{ label: 'Avg DOM', data: [18, 12, 14, 16, 22, 15, 13, 11, 14, 10, 12, 14], backgroundColor: 'rgba(13,34,64,0.75)' }]
  },
  options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display:true, text:'Days on Market', font:{family:'Poppins'} } } } }
});

const yieldData = [50, 75, 65, 68, 37, 41, 55, 57, 82, 98, 62, 53];
new Chart(document.getElementById('chart-yield'), {
  type: 'bar',
  data: {
    labels: shortLabels,
    datasets: [{ label: '$/Sqft/Year', data: yieldData, backgroundColor: 'rgba(26,107,124,0.8)' }]
  },
  options: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, title: { display:true, text:'$/Sqft/Year', font:{family:'Poppins'} } } } }
});
</script>

</body>
</html>`;
}
