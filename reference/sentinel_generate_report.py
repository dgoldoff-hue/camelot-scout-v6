"""
Sentinel — Camelot Realty Group Quarterly NYC Market Report Generator
Produces a fully branded, self-contained HTML market intelligence report.

Usage:
    python generate_report.py --quarter "Q1 2026" --output ./camelot_q1_2026_report.html

    Or with custom data overrides:
    python generate_report.py \
        --quarter "Q2 2026" \
        --insight1 "5 of 6 tracked buildings beat their neighborhood median $/sqft" \
        --insight2 "Sub-$3,500/mo 1-BRs clearing in under 14 days — demand outpacing supply" \
        --insight3 "Every 50bps rate drop unlocks 8-10% more buying power" \
        --insight4 "Rent-vs-buy break-even: 20 yrs in Sunnyside, 38+ yrs in Tribeca" \
        --insight5 "$/sqft ranges from $660 (Sunnyside) to $2,100 (Tribeca/SoHo)" \
        --output ./camelot_q2_2026_report.html
"""

import argparse
import datetime
import os

# ---------------------------------------------------------------------------
# DEFAULT Q1 2026 DATA — update each quarter by passing CLI args
# ---------------------------------------------------------------------------

DEFAULT_DATA = {
    "quarter": "Q1 2026",
    "quarter_period": "January 1 – March 31, 2026",
    "published": "April 2026",
    "mortgage_rate": "6.75%",
    "insight1": "5 of 6 tracked buildings beat their neighborhood median $/sqft",
    "insight2": "Sub-$3,500/mo 1-BRs clearing in under 14 days — demand outpacing supply",
    "insight3": "Every 50bps rate drop unlocks 8–10% more buying power",
    "insight4": "Rent-vs-buy break-even: 20 yrs in Sunnyside, 38+ yrs in Tribeca",
    "insight5": "$/sqft ranges from $660 (Sunnyside) to $2,100 (Tribeca/SoHo)",

    # Portfolio buildings — update as portfolio changes
    "buildings": [
        {"name": "Harlem Condominium",       "neighborhood": "Harlem, Manhattan",            "type": "Condo",    "sqft": 27626, "units": 47,  "ppsf": 950,  "nbhd_median": 892,  "rental_ppsf_yr": 52},
        {"name": "Sunnyside Condominium",     "neighborhood": "Sunnyside, Queens",            "type": "Condo",    "sqft": 40751, "units": 62,  "ppsf": 680,  "nbhd_median": 660,  "rental_ppsf_yr": 42},
        {"name": "Murray Hill Condominium",   "neighborhood": "Murray Hill, Manhattan",       "type": "Mixed Use","sqft": 27198, "units": 28,  "ppsf": 1350, "nbhd_median": 1380, "rental_ppsf_yr": 74},
        {"name": "Washington Heights Co-op",  "neighborhood": "Washington Heights, Manhattan", "type": "Co-op",   "sqft": 52542, "units": 58,  "ppsf": 480,  "nbhd_median": 440,  "rental_ppsf_yr": 38},
        {"name": "Stuyvesant/Gramercy Co-op", "neighborhood": "Stuyvesant/Gramercy",          "type": "Co-op",   "sqft": 47000, "units": 40,  "ppsf": 1100, "nbhd_median": 1050, "rental_ppsf_yr": 62},
        {"name": "Hell's Kitchen Condo",      "neighborhood": "Hell's Kitchen, Manhattan",    "type": "Condo",    "sqft": 7200,  "units": 8,   "ppsf": 1200, "nbhd_median": 1180, "rental_ppsf_yr": 67},
    ],

    # Neighborhood benchmarks
    "neighborhoods": [
        {"name": "Harlem / Manhattan Valley",  "zip": "10026–10030", "condo_ppsf": 892,  "coop_ppsf": 610,  "rental_ppsf_yr": 50, "rent_1br": 2950, "rent_2br": 3800, "dom": 18,  "camelot_bldg": "Harlem Condominium"},
        {"name": "Murray Hill / NoMad",        "zip": "10016",       "condo_ppsf": 1380, "coop_ppsf": 980,  "rental_ppsf_yr": 75, "rent_1br": 4200, "rent_2br": 6100, "dom": 12,  "camelot_bldg": "Murray Hill Condominium"},
        {"name": "Stuyvesant / Gramercy",      "zip": "10003–10009", "condo_ppsf": 1250, "coop_ppsf": 1050, "rental_ppsf_yr": 65, "rent_1br": 3800, "rent_2br": 5600, "dom": 14,  "camelot_bldg": "Stuyvesant/Gramercy Co-op"},
        {"name": "Hell's Kitchen / Midtown W", "zip": "10036–10019", "condo_ppsf": 1180, "coop_ppsf": 880,  "rental_ppsf_yr": 68, "rent_1br": 3600, "rent_2br": 5200, "dom": 16,  "camelot_bldg": "Hell's Kitchen Condo"},
        {"name": "Washington Heights",         "zip": "10032–10040", "condo_ppsf": 560,  "coop_ppsf": 440,  "rental_ppsf_yr": 37, "rent_1br": 2100, "rent_2br": 2850, "dom": 22,  "camelot_bldg": "Washington Heights Co-op"},
        {"name": "Sunnyside / Woodside",       "zip": "11104/11377", "condo_ppsf": 660,  "coop_ppsf": 430,  "rental_ppsf_yr": 41, "rent_1br": 2400, "rent_2br": 3100, "dom": 15,  "camelot_bldg": "Sunnyside Condominium"},
        {"name": "Greenpoint",                 "zip": "11222",       "condo_ppsf": 1020, "coop_ppsf": 720,  "rental_ppsf_yr": 55, "rent_1br": 3200, "rent_2br": 4400, "dom": 13,  "camelot_bldg": None},
        {"name": "Long Island City",           "zip": "11101",       "condo_ppsf": 1090, "coop_ppsf": 680,  "rental_ppsf_yr": 57, "rent_1br": 3450, "rent_2br": 4700, "dom": 11,  "camelot_bldg": None},
        {"name": "Upper East Side",            "zip": "10021/10065", "condo_ppsf": 1620, "coop_ppsf": 1140, "rental_ppsf_yr": 82, "rent_1br": 4600, "rent_2br": 7200, "dom": 14,  "camelot_bldg": None},
        {"name": "Tribeca / SoHo",             "zip": "10013/10012", "condo_ppsf": 2100, "coop_ppsf": 1480, "rental_ppsf_yr": 98, "rent_1br": 5200, "rent_2br": 8400, "dom": 10,  "camelot_bldg": None},
        {"name": "Brooklyn Heights",           "zip": "11201",       "condo_ppsf": 1280, "coop_ppsf": 980,  "rental_ppsf_yr": 62, "rent_1br": 3600, "rent_2br": 5100, "dom": 12,  "camelot_bldg": None},
        {"name": "Park Slope",                 "zip": "11215/11217", "condo_ppsf": 1150, "coop_ppsf": 820,  "rental_ppsf_yr": 53, "rent_1br": 3100, "rent_2br": 4600, "dom": 14,  "camelot_bldg": None},
    ],

    # Rate scenario table
    "rate_scenarios": [
        {"rate": "3.5% (2021 era)",        "monthly": "$3,593", "annual": "$43,116", "income_req": "$153,986", "breakeven": "Favorable buy",     "signal": "Strong buy signal"},
        {"rate": "5.5% (forecast 2026+)",  "monthly": "$4,542", "annual": "$54,504", "income_req": "$194,657", "breakeven": "Near parity",       "signal": "Improving"},
        {"rate": "6.75% (Q1 2026 actual)", "monthly": "$5,186", "annual": "$62,232", "income_req": "$222,257", "breakeven": "Rent favored",      "signal": "Wait or buy value"},
        {"rate": "7.5% (2023 peak)",       "monthly": "$5,594", "annual": "$67,128", "income_req": "$239,743", "breakeven": "Rent strongly fav.", "signal": "Rate sensitive"},
    ],

    # Neighborhood intelligence scores
    "nbhd_scores": [
        {"name": "Harlem / Manhattan Valley", "invest": 8.2, "live": 7.4, "family": 6.8, "work": 7.6, "momentum": "↑ Strong",     "overall": 7.5},
        {"name": "Murray Hill / NoMad",       "invest": 7.8, "live": 8.2, "family": 7.0, "work": 9.1, "momentum": "↑ Moderate",   "overall": 8.0},
        {"name": "Stuyvesant / Gramercy",     "invest": 7.6, "live": 8.4, "family": 7.5, "work": 8.8, "momentum": "↑ Moderate",   "overall": 8.1},
        {"name": "Hell's Kitchen",            "invest": 7.5, "live": 7.8, "family": 6.2, "work": 9.0, "momentum": "→ Stable",      "overall": 7.6},
        {"name": "Washington Heights",        "invest": 8.6, "live": 7.2, "family": 7.8, "work": 6.4, "momentum": "↑↑ Very Strong","overall": 7.5},
        {"name": "Sunnyside / Woodside",      "invest": 8.8, "live": 7.6, "family": 8.2, "work": 7.2, "momentum": "↑↑ Very Strong","overall": 7.9},
        {"name": "Greenpoint",                "invest": 8.4, "live": 8.6, "family": 7.9, "work": 7.4, "momentum": "↑ Strong",      "overall": 8.1},
        {"name": "Long Island City",          "invest": 8.7, "live": 8.0, "family": 7.2, "work": 8.8, "momentum": "↑↑ Very Strong","overall": 8.2},
        {"name": "Upper East Side",           "invest": 6.8, "live": 8.8, "family": 9.2, "work": 8.4, "momentum": "→ Stable",      "overall": 8.3},
        {"name": "Tribeca / SoHo",            "invest": 6.4, "live": 9.2, "family": 8.4, "work": 8.6, "momentum": "→ Stable",      "overall": 8.2},
        {"name": "Brooklyn Heights",          "invest": 7.2, "live": 9.0, "family": 8.8, "work": 8.2, "momentum": "→ Stable",      "overall": 8.3},
        {"name": "Park Slope",                "invest": 7.4, "live": 9.1, "family": 9.4, "work": 7.8, "momentum": "↑ Moderate",    "overall": 8.4},
    ],
}

# ---------------------------------------------------------------------------
# HTML TEMPLATE
# ---------------------------------------------------------------------------

def fmt_currency(n):
    return f"${n:,.0f}"

def pct_vs_market(bldg_ppsf, nbhd_ppsf):
    delta = (bldg_ppsf - nbhd_ppsf) / nbhd_ppsf * 100
    arrow = "▲" if delta >= 0 else "▼"
    color = "#2e7d32" if delta >= 0 else "#c62828"
    return f'<span style="color:{color};font-weight:700">{delta:+.1f}% {arrow}</span>'

def build_buildings_table(buildings):
    rows = ""
    for b in buildings:
        delta = (b["ppsf"] - b["nbhd_median"]) / b["nbhd_median"] * 100
        arrow = "▲" if delta >= 0 else "▼"
        color = "#2e7d32" if delta >= 0 else "#c62828"
        annual_income = b["sqft"] * b["rental_ppsf_yr"]
        upside = b["sqft"] * b["ppsf"] * 0.10
        rows += f"""
        <tr>
          <td><strong>{b['name']}</strong></td>
          <td>{b['neighborhood']}</td>
          <td>{b['type']}</td>
          <td>${b['ppsf']:,}</td>
          <td>${b['nbhd_median']:,}</td>
          <td style="color:{color};font-weight:700">{delta:+.1f}% {arrow}</td>
          <td>${annual_income/1_000_000:.2f}M/yr</td>
          <td>${upside/1_000_000:.2f}M</td>
        </tr>"""
    return rows

def build_nbhd_cards(neighborhoods):
    cards = ""
    for n in neighborhoods:
        tag = ""
        if n.get("camelot_bldg"):
            tag = f'<div class="nbhd-tag">Camelot: {n["camelot_bldg"]}</div>'
        else:
            tag = '<div class="nbhd-tag scout">SCOUT Coverage Zone</div>'
        cards += f"""
        <div class="nbhd-card">
          <div class="nbhd-header">
            <div class="nbhd-name">{n['name']}</div>
            <div class="nbhd-zip">ZIP {n['zip']}</div>
          </div>
          <div class="nbhd-stats">
            <div class="nbhd-stat"><span class="stat-label">Condo $/Sqft</span><span class="stat-val">${n['condo_ppsf']:,}</span></div>
            <div class="nbhd-stat"><span class="stat-label">Co-op $/Sqft</span><span class="stat-val">${n['coop_ppsf']:,}</span></div>
            <div class="nbhd-stat"><span class="stat-label">Rental $/Sqft/Yr</span><span class="stat-val">${n['rental_ppsf_yr']}</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 1BR</span><span class="stat-val">${n['rent_1br']:,}/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Median 2BR</span><span class="stat-val">${n['rent_2br']:,}/mo</span></div>
            <div class="nbhd-stat"><span class="stat-label">Avg DOM</span><span class="stat-val">{n['dom']} days</span></div>
          </div>
          {tag}
        </div>"""
    return cards

def build_rate_table(scenarios):
    rows = ""
    for s in scenarios:
        current = "current-row" if "actual" in s["rate"].lower() else ""
        rows += f"""
        <tr class="{current}">
          <td><strong>{s['rate']}</strong></td>
          <td>{s['monthly']}/mo</td>
          <td>{s['annual']}</td>
          <td>{s['income_req']}</td>
          <td>{s['breakeven']}</td>
          <td><strong>{s['signal']}</strong></td>
        </tr>"""
    return rows

def build_scores_table(scores):
    rows = ""
    for s in scores:
        rows += f"""
        <tr>
          <td><strong>{s['name']}</strong></td>
          <td>{s['invest']}</td>
          <td>{s['live']}</td>
          <td>{s['family']}</td>
          <td>{s['work']}</td>
          <td><strong>{s['momentum']}</strong></td>
          <td class="score-overall"><strong>{s['overall']}</strong></td>
        </tr>"""
    return rows

def build_chart_labels_and_condo(neighborhoods):
    labels = [f'"{n["name"].split("/")[0].strip()}"' for n in neighborhoods]
    condo  = [n["condo_ppsf"] for n in neighborhoods]
    coop   = [n["coop_ppsf"]  for n in neighborhoods]
    rent1  = [n["rent_1br"]   for n in neighborhoods]
    rent2  = [n["rent_2br"]   for n in neighborhoods]
    dom    = [n["dom"]         for n in neighborhoods]
    return (
        "[" + ",".join(labels) + "]",
        str(condo), str(coop), str(rent1), str(rent2), str(dom)
    )

def generate_html(data):
    q = data["quarter"]
    period = data["quarter_period"]
    published = data["published"]
    buildings = data["buildings"]
    neighborhoods = data["neighborhoods"]
    rate_scenarios = data["rate_scenarios"]
    nbhd_scores = data["nbhd_scores"]

    i1, i2, i3, i4, i5 = (
        data["insight1"], data["insight2"], data["insight3"],
        data["insight4"], data["insight5"]
    )

    bldg_table    = build_buildings_table(buildings)
    nbhd_cards    = build_nbhd_cards(neighborhoods)
    rate_table    = build_rate_table(rate_scenarios)
    scores_table  = build_scores_table(nbhd_scores)
    chart_labels, condo_data, coop_data, rent1_data, rent2_data, dom_data = build_chart_labels_and_condo(neighborhoods)

    total_sqft   = sum(b["sqft"] for b in buildings)
    total_units  = sum(b["units"] for b in buildings)

    buildings_above = sum(1 for b in buildings if b["ppsf"] > b["nbhd_median"])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Camelot Realty Group — {q} Market Report · Public Edition</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  :root {{
    --navy:  #0D2240;
    --gold:  #B8973A;
    --teal:  #1A6B7C;
    --white: #FFFFFF;
    --light: #F5F3EE;
    --text:  #1a1a1a;
    --muted: #555;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Poppins', sans-serif; color: var(--text); background: var(--white); }}
  h1,h2,h3,h4 {{ font-family: 'Lora', serif; }}

  /* ---- PRINT ---- */
  @media print {{ .no-print {{ display: none !important; }} }}

  /* ---- HERO ---- */
  .hero {{
    background: var(--navy);
    color: var(--white);
    padding: 80px 60px 60px;
    position: relative;
    overflow: hidden;
  }}
  .hero::after {{
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    background: var(--gold);
  }}
  .hero-logo {{ font-family: 'Lora', serif; font-size: 1.1rem; letter-spacing: .15em; color: var(--gold); margin-bottom: 40px; text-transform: uppercase; }}
  .hero h1 {{ font-size: 3.2rem; line-height: 1.1; margin-bottom: 16px; }}
  .hero h1 em {{ color: var(--gold); font-style: normal; }}
  .hero-quarter {{ font-size: 1rem; color: rgba(255,255,255,.65); margin-bottom: 32px; letter-spacing: .05em; }}
  .hero-meta {{ display: flex; gap: 48px; flex-wrap: wrap; font-size: .82rem; color: rgba(255,255,255,.55); }}
  .hero-meta strong {{ color: rgba(255,255,255,.85); display: block; margin-bottom: 2px; }}
  .hero-tagline {{ position: absolute; top: 80px; right: 60px; font-size: .78rem; letter-spacing: .12em; color: var(--gold); text-transform: uppercase; opacity: .7; }}

  /* ---- PRINT BUTTON ---- */
  .print-btn {{
    display: block; text-align: center; padding: 10px 0; background: var(--gold);
    color: var(--white); font-size: .78rem; letter-spacing: .1em; text-transform: uppercase;
    cursor: pointer; border: none; width: 100%; font-family: 'Poppins', sans-serif;
  }}

  /* ---- PORTFOLIO STATS ---- */
  .stats-bar {{
    background: var(--light);
    display: flex; justify-content: space-around; flex-wrap: wrap;
    padding: 48px 60px; gap: 32px;
    border-bottom: 1px solid #ddd;
  }}
  .stat-block {{ text-align: center; }}
  .stat-block .big {{ font-family: 'Lora', serif; font-size: 2.4rem; color: var(--navy); font-weight: 700; }}
  .stat-block .label {{ font-size: .78rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 4px; }}

  /* ---- SECTION ---- */
  .section {{ padding: 72px 60px; }}
  .section.alt {{ background: var(--light); }}
  .section-label {{ font-size: .72rem; text-transform: uppercase; letter-spacing: .14em; color: var(--gold); margin-bottom: 8px; }}
  .section-title {{ font-size: 2rem; color: var(--navy); margin-bottom: 8px; }}
  .section-title em {{ color: var(--teal); font-style: normal; }}
  .section-sub {{ color: var(--muted); font-size: .92rem; margin-bottom: 40px; max-width: 680px; line-height: 1.6; }}
  .gold-rule {{ width: 48px; height: 3px; background: var(--gold); margin: 12px 0 32px; }}

  /* ---- INSIGHTS GRID ---- */
  .insights-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-top: 40px;
  }}
  .insight-card {{
    background: var(--navy);
    color: var(--white);
    padding: 32px 28px;
    border-radius: 2px;
    border-left: 4px solid var(--gold);
    position: relative;
  }}
  .insight-num {{ font-size: .72rem; color: var(--gold); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 12px; }}
  .insight-text {{ font-family: 'Lora', serif; font-size: 1.1rem; line-height: 1.45; }}

  /* ---- TABLE ---- */
  .data-table {{ width: 100%; border-collapse: collapse; margin-top: 24px; font-size: .88rem; }}
  .data-table th {{ background: var(--navy); color: var(--white); padding: 12px 16px; text-align: left; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }}
  .data-table td {{ padding: 12px 16px; border-bottom: 1px solid #e8e4da; }}
  .data-table tr:last-child td {{ border-bottom: none; }}
  .data-table tr:nth-child(even) td {{ background: rgba(184,151,58,.05); }}
  .current-row td {{ background: rgba(184,151,58,.12) !important; }}

  /* ---- NBHD CARDS ---- */
  .nbhd-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 32px; }}
  .nbhd-card {{ background: var(--white); border: 1px solid #e0dbd0; border-radius: 2px; overflow: hidden; }}
  .nbhd-header {{ background: var(--navy); color: var(--white); padding: 18px 20px; }}
  .nbhd-name {{ font-family: 'Lora', serif; font-size: 1.05rem; margin-bottom: 2px; }}
  .nbhd-zip {{ font-size: .75rem; color: rgba(255,255,255,.55); }}
  .nbhd-stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; }}
  .nbhd-stat {{ padding: 12px 16px; border-right: 1px solid #e8e4da; border-bottom: 1px solid #e8e4da; }}
  .nbhd-stat:nth-child(even) {{ border-right: none; }}
  .stat-label {{ font-size: .7rem; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; display: block; margin-bottom: 2px; }}
  .stat-val {{ font-size: 1.05rem; font-weight: 600; color: var(--navy); }}
  .nbhd-tag {{ padding: 8px 16px; font-size: .75rem; background: rgba(26,107,124,.08); color: var(--teal); font-weight: 600; border-top: 1px solid #e8e4da; }}
  .nbhd-tag.scout {{ background: rgba(184,151,58,.08); color: var(--gold); }}

  /* ---- MAP ---- */
  #market-map {{ height: 480px; border: 1px solid #ddd; margin-top: 32px; }}

  /* ---- CHARTS ---- */
  .charts-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }}
  @media (max-width: 900px) {{ .charts-grid {{ grid-template-columns: 1fr; }} }}
  .chart-card {{ background: var(--white); border: 1px solid #e0dbd0; padding: 24px; }}
  .chart-title {{ font-family: 'Lora', serif; font-size: 1rem; color: var(--navy); margin-bottom: 4px; }}
  .chart-sub {{ font-size: .75rem; color: var(--muted); margin-bottom: 16px; }}

  /* ---- NOTE BOX ---- */
  .intel-note {{
    background: rgba(13,34,64,.04);
    border-left: 4px solid var(--gold);
    padding: 20px 24px;
    margin-top: 32px;
    font-size: .88rem;
    line-height: 1.6;
    color: var(--navy);
  }}
  .intel-note strong {{ color: var(--gold); }}

  /* ---- SCORES TABLE ---- */
  .score-overall {{ font-size: 1.1rem; color: var(--teal); }}

  /* ---- CAMELOT ADVANTAGE ---- */
  .advantage-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 24px; margin-top: 32px; }}
  .adv-card {{ border: 1px solid #e0dbd0; padding: 24px; }}
  .adv-driver {{ font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--gold); margin-bottom: 8px; }}
  .adv-desc {{ font-size: .88rem; color: var(--muted); line-height: 1.5; margin-bottom: 12px; }}
  .adv-impact {{ font-size: .92rem; color: var(--teal); font-weight: 700; }}

  /* ---- BRAND STORY ---- */
  .brand-section {{ background: var(--navy); color: var(--white); padding: 80px 60px; }}
  .brand-section h2 {{ color: var(--white); margin-bottom: 4px; }}
  .brand-section h2 em {{ color: var(--gold); font-style: normal; }}
  .brand-section .gold-rule {{ background: var(--gold); }}
  .brand-section p {{ color: rgba(255,255,255,.75); line-height: 1.7; font-size: .95rem; max-width: 720px; margin-bottom: 24px; }}
  .brand-section blockquote {{ border-left: 3px solid var(--gold); padding-left: 24px; margin: 32px 0; font-family: 'Lora', serif; font-style: italic; color: rgba(255,255,255,.85); font-size: 1.05rem; line-height: 1.6; }}
  .brand-section cite {{ display: block; margin-top: 8px; font-size: .8rem; color: var(--gold); font-style: normal; letter-spacing: .05em; }}
  .os-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }}
  .os-card {{ background: rgba(255,255,255,.06); border: 1px solid rgba(184,151,58,.3); padding: 28px; }}
  .os-card h4 {{ color: var(--gold); margin-bottom: 8px; font-family: 'Lora', serif; }}
  .os-card p {{ color: rgba(255,255,255,.65); font-size: .88rem; line-height: 1.6; }}

  /* ---- CTA ---- */
  .cta-section {{ background: var(--light); padding: 80px 60px; text-align: center; }}
  .cta-section h2 {{ color: var(--navy); font-size: 2.2rem; margin-bottom: 12px; }}
  .cta-section p {{ color: var(--muted); max-width: 560px; margin: 0 auto 40px; line-height: 1.6; }}
  .cta-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 24px; max-width: 800px; margin: 0 auto; }}
  .cta-card {{ background: var(--white); border: 1px solid #e0dbd0; padding: 28px 24px; text-align: left; }}
  .cta-card h4 {{ color: var(--navy); margin-bottom: 8px; }}
  .cta-card p {{ font-size: .85rem; color: var(--muted); line-height: 1.5; }}

  /* ---- FOOTER ---- */
  footer {{ background: var(--navy); color: rgba(255,255,255,.5); padding: 48px 60px; font-size: .8rem; line-height: 1.7; }}
  footer strong {{ color: rgba(255,255,255,.8); }}
  footer a {{ color: var(--gold); text-decoration: none; }}
  .footer-top {{ display: flex; justify-content: space-between; flex-wrap: wrap; gap: 32px; margin-bottom: 32px; }}
  .footer-logo {{ font-family: 'Lora', serif; font-size: 1.1rem; color: var(--gold); letter-spacing: .1em; margin-bottom: 8px; }}
  .footer-divider {{ border-top: 1px solid rgba(255,255,255,.1); padding-top: 24px; }}
  .disclaimer {{ font-size: .75rem; color: rgba(255,255,255,.4); margin-top: 20px; max-width: 800px; line-height: 1.6; }}

  @media (max-width: 768px) {{
    .hero, .section, .stats-bar, .brand-section, .cta-section, footer {{ padding: 48px 24px; }}
    .hero h1 {{ font-size: 2rem; }}
    .hero-tagline {{ display: none; }}
    .os-grid, .charts-grid {{ grid-template-columns: 1fr; }}
  }}
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
  <div class="hero-quarter">{q} — {period}</div>
  <div class="hero-meta">
    <div><strong>Data Sources:</strong> RealtyMX API · ACRIS · NYC DOF · StreetEasy · REBNY RLS</div>
    <div><strong>Portfolio:</strong> {len(buildings)} confirmed buildings · {total_units}+ units tracked</div>
    <div><strong>Published:</strong> {published}</div>
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
  <h2 class="section-title">{q} <em>Market Insights</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Five data points that define the New York City residential market this quarter, drawn from Camelot's RealtyMX intelligence account, ACRIS public records, and third-party market reports.</p>
  <div class="insights-grid">
    <div class="insight-card"><div class="insight-num">Insight 01 · Building Performance</div><div class="insight-text">{i1}</div></div>
    <div class="insight-card"><div class="insight-num">Insight 02 · Rental Velocity</div><div class="insight-text">{i2}</div></div>
    <div class="insight-card"><div class="insight-num">Insight 03 · Rate Sensitivity</div><div class="insight-text">{i3}</div></div>
    <div class="insight-card"><div class="insight-num">Insight 04 · Rent vs. Buy</div><div class="insight-text">{i4}</div></div>
    <div class="insight-card"><div class="insight-num">Insight 05 · Neighborhood Value Spectrum</div><div class="insight-text">{i5}</div></div>
  </div>
</section>

<!-- EXECUTIVE SUMMARY -->
<section class="section alt">
  <div class="section-label">Executive Summary</div>
  <h2 class="section-title">{q} <em>Market Overview</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">The New York City residential real estate market entered {q.split()[1]} with continued inventory constraints, rising renter demand, and a rate environment that continues to suppress sales volume while keeping rental pricing power firmly with landlords.</p>
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
    <tbody>{bldg_table}</tbody>
  </table>
  <div class="intel-note">
    <strong>Intelligence Note:</strong> {buildings_above} of {len(buildings)} confirmed Camelot buildings are trading above their neighborhood median $/sqft — a testament to disciplined financial management and proactive capital planning.
  </div>
</section>

<!-- NEIGHBORHOOD BENCHMARKS -->
<section class="section">
  <div class="section-label">Neighborhood Benchmarks</div>
  <h2 class="section-title">Market Comparables <em>by Submarket</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">Camelot properties are benchmarked against their immediate submarket — enabling building-level value positioning analysis. Additional submarkets tracked by SCOUT are included for investment coverage.</p>
  <div class="nbhd-grid">{nbhd_cards}</div>
</section>

<!-- CHARTS -->
<section class="section alt">
  <div class="section-label">Market Analytics</div>
  <h2 class="section-title">Data Visualization: <em>{q} Key Indicators</em></h2>
  <div class="gold-rule"></div>
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">Sale Price $/Sqft by Submarket</div>
      <div class="chart-sub">Condo vs. Co-op · {q}</div>
      <canvas id="chart-ppsf"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Median Rental Rates by Submarket</div>
      <div class="chart-sub">1BR and 2BR · {q}</div>
      <canvas id="chart-rent"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Average Days on Market</div>
      <div class="chart-sub">Rental Listings · {q}</div>
      <canvas id="chart-dom"></canvas>
    </div>
    <div class="chart-card">
      <div class="chart-title">Rental $/Sqft/Year by Submarket</div>
      <div class="chart-sub">Annual Rental Yield Benchmark · {q}</div>
      <canvas id="chart-yield"></canvas>
    </div>
  </div>
</section>

<!-- RATE ENVIRONMENT -->
<section class="section">
  <div class="section-label">Rate Environment</div>
  <h2 class="section-title">Interest Rates: <em>What They Mean for the Market</em></h2>
  <div class="gold-rule"></div>
  <p class="section-sub">The interest rate environment is the single most significant macro variable affecting NYC real estate in {q.split()[1]}. Modeled on a $1M purchase at 80% LTV.</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>Mortgage Rate</th><th>Monthly Payment</th><th>Annual Debt Service</th>
        <th>Required Income (28%)</th><th>vs. Renting $4K/mo</th><th>Market Signal</th>
      </tr>
    </thead>
    <tbody>{rate_table}</tbody>
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
    <tbody>{scores_table}</tbody>
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
      <div><strong>Published:</strong> {published}</div>
      <div><strong>Data Engine:</strong> Sentinel / Camelot OS</div>
      <div><strong>Market Data:</strong> RealtyMX API · ACRIS · StreetEasy · REBNY RLS</div>
    </div>
  </div>
  <div class="footer-divider">
    <div><strong>Boutique. By Design. Powered by Intelligence.</strong></div>
    <div class="disclaimer">
      © {datetime.datetime.now().year} Camelot Realty Group. All Rights Reserved. This report and all of its contents are the intellectual property of Camelot Realty Group. The information is provided for general informational and educational purposes only and does not constitute investment, financial, or legal advice. Market data is derived from publicly available records and licensed third-party data sources including RealtyMX, ACRIS, and StreetEasy. While Camelot has made reasonable efforts to ensure accuracy, no warranty is made as to completeness or fitness for any particular purpose. Permission requests: <a href="mailto:dgoldoff@camelot.nyc">dgoldoff@camelot.nyc</a>
    </div>
  </div>
</footer>

<!-- MAP + CHART SCRIPTS -->
<script>
// --- MAP ---
const map = L.map('market-map').setView([40.748, -73.985], 12);
L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
  attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}}).addTo(map);

const NAVY = '#0D2240', GOLD = '#B8973A', TEAL = '#1A6B7C';

const camelotBuildings = [
  {{lat:40.8116, lng:-73.9465, name:"Harlem Condominium", nbhd:"Harlem"}},
  {{lat:40.7440, lng:-73.9210, name:"Sunnyside Condominium", nbhd:"Sunnyside, Queens"}},
  {{lat:40.7484, lng:-73.9799, name:"Murray Hill Condominium", nbhd:"Murray Hill"}},
  {{lat:40.8418, lng:-73.9395, name:"Washington Heights Co-op", nbhd:"Washington Heights"}},
  {{lat:40.7358, lng:-73.9841, name:"Stuyvesant/Gramercy Co-op", nbhd:"Gramercy"}},
  {{lat:40.7608, lng:-73.9923, name:"Hell's Kitchen Condo", nbhd:"Hell's Kitchen"}},
];

const scoutZones = [
  {{lat:40.7195, lng:-73.9971, name:"SoHo / Tribeca", type:"scout"}},
  {{lat:40.7505, lng:-74.0040, name:"Chelsea / West Village", type:"scout"}},
  {{lat:40.7274, lng:-73.9799, name:"East Village", type:"scout"}},
  {{lat:40.7154, lng:-73.9843, name:"Lower East Side", type:"scout"}},
  {{lat:40.7721, lng:-73.9561, name:"Upper East Side", type:"scout"}},
  {{lat:40.7282, lng:-73.9553, name:"Greenpoint", type:"scout"}},
  {{lat:40.7447, lng:-73.9493, name:"Long Island City", type:"scout"}},
  {{lat:40.6960, lng:-73.9939, name:"Brooklyn Heights", type:"scout"}},
  {{lat:40.6682, lng:-73.9794, name:"Park Slope", type:"scout"}},
];

function markerIcon(color) {{
  return L.divIcon({{
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${{color}};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize:[14,14], iconAnchor:[7,7], className:''
  }});
}}

camelotBuildings.forEach(b => {{
  L.marker([b.lat, b.lng], {{icon: markerIcon(GOLD)}})
    .addTo(map)
    .bindPopup(`<strong>${{b.name}}</strong><br>${{b.nbhd}}<br><em>Camelot Managed</em>`);
}});

scoutZones.forEach(z => {{
  L.marker([z.lat, z.lng], {{icon: markerIcon(TEAL)}})
    .addTo(map)
    .bindPopup(`<strong>${{z.name}}</strong><br>SCOUT Coverage Zone`);
}});

// Legend
const legend = L.control({{position:'bottomright'}});
legend.onAdd = () => {{
  const d = L.DomUtil.create('div');
  d.style.cssText = 'background:white;padding:12px 16px;font-family:Poppins,sans-serif;font-size:12px;border:1px solid #ccc';
  d.innerHTML = `
    <div style="margin-bottom:6px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${{GOLD}};margin-right:8px;vertical-align:middle"></span>Camelot Buildings</div>
    <div><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${{TEAL}};margin-right:8px;vertical-align:middle"></span>Market Tracked</div>`;
  return d;
}};
legend.addTo(map);

// --- CHARTS ---
const chartLabels = {chart_labels};
const shortLabels = chartLabels.map(l => l.length > 12 ? l.substring(0,12)+'…' : l);

const chartDefaults = {{
  responsive: true,
  plugins: {{ legend: {{ labels: {{ font: {{ family: 'Poppins', size: 11 }} }} }} }},
  scales: {{ x: {{ ticks: {{ font: {{ family:'Poppins', size:10 }}, maxRotation:45 }} }}, y: {{ ticks: {{ font: {{ family:'Poppins', size:11 }} }} }} }}
}};

new Chart(document.getElementById('chart-ppsf'), {{
  type: 'bar',
  data: {{
    labels: shortLabels,
    datasets: [
      {{ label: 'Condo $/Sqft', data: {condo_data}, backgroundColor: 'rgba(13,34,64,0.8)' }},
      {{ label: 'Co-op $/Sqft', data: {coop_data},  backgroundColor: 'rgba(184,151,58,0.7)' }}
    ]
  }},
  options: {{ ...chartDefaults, scales: {{ ...chartDefaults.scales, y: {{ ...chartDefaults.scales.y, title: {{ display:true, text:'$/Sqft', font:{{family:'Poppins'}} }} }} }} }}
}});

new Chart(document.getElementById('chart-rent'), {{
  type: 'bar',
  data: {{
    labels: shortLabels,
    datasets: [
      {{ label: '1BR Median Rent', data: {rent1_data}, backgroundColor: 'rgba(26,107,124,0.8)' }},
      {{ label: '2BR Median Rent', data: {rent2_data}, backgroundColor: 'rgba(184,151,58,0.7)' }}
    ]
  }},
  options: {{ ...chartDefaults, scales: {{ ...chartDefaults.scales, y: {{ ...chartDefaults.scales.y, title: {{ display:true, text:'$/Month', font:{{family:'Poppins'}} }} }} }} }}
}});

new Chart(document.getElementById('chart-dom'), {{
  type: 'bar',
  data: {{
    labels: shortLabels,
    datasets: [{{ label: 'Avg DOM', data: {dom_data}, backgroundColor: 'rgba(13,34,64,0.75)' }}]
  }},
  options: {{ ...chartDefaults, scales: {{ ...chartDefaults.scales, y: {{ ...chartDefaults.scales.y, title: {{ display:true, text:'Days on Market', font:{{family:'Poppins'}} }} }} }} }}
}});

const yieldData = [{', '.join(str(n['rental_ppsf_yr']) for n in DEFAULT_DATA['neighborhoods'])}];
new Chart(document.getElementById('chart-yield'), {{
  type: 'bar',
  data: {{
    labels: shortLabels,
    datasets: [{{ label: '$/Sqft/Year', data: yieldData, backgroundColor: 'rgba(26,107,124,0.8)' }}]
  }},
  options: {{ ...chartDefaults, scales: {{ ...chartDefaults.scales, y: {{ ...chartDefaults.scales.y, title: {{ display:true, text:'$/Sqft/Year', font:{{family:'Poppins'}} }} }} }} }}
}});
</script>

</body>
</html>"""

# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate Camelot Quarterly Market Report HTML")
    parser.add_argument("--quarter",  default=DEFAULT_DATA["quarter"],  help='e.g. "Q2 2026"')
    parser.add_argument("--insight1", default=DEFAULT_DATA["insight1"])
    parser.add_argument("--insight2", default=DEFAULT_DATA["insight2"])
    parser.add_argument("--insight3", default=DEFAULT_DATA["insight3"])
    parser.add_argument("--insight4", default=DEFAULT_DATA["insight4"])
    parser.add_argument("--insight5", default=DEFAULT_DATA["insight5"])
    parser.add_argument("--output",   default="camelot_market_report.html", help="Output HTML file path")
    args = parser.parse_args()

    data = dict(DEFAULT_DATA)
    data["quarter"]  = args.quarter
    data["insight1"] = args.insight1
    data["insight2"] = args.insight2
    data["insight3"] = args.insight3
    data["insight4"] = args.insight4
    data["insight5"] = args.insight5

    # Derive quarter period
    q_map = {"Q1": "January 1 – March 31", "Q2": "April 1 – June 30", "Q3": "July 1 – September 30", "Q4": "October 1 – December 31"}
    qkey  = args.quarter.split()[0] if args.quarter else "Q1"
    year  = args.quarter.split()[1] if len(args.quarter.split()) > 1 else "2026"
    data["quarter_period"] = f"{q_map.get(qkey, 'January 1 – March 31')}, {year}"
    data["published"]      = f"{['', 'April', 'July', 'October', 'January'][int(qkey[1])]} {year}"

    html = generate_html(data)

    output_path = os.path.abspath(args.output)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✅ Report generated: {output_path}")
    print(f"   Quarter : {data['quarter']}")
    print(f"   Period  : {data['quarter_period']}")
    print(f"   Open in your browser to review, then File → Print → Save as PDF.")

if __name__ == "__main__":
    main()
