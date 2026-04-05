"""
Sentinel — RealtyMX CSV Export Parser
Parses a CSV export from RealtyMX into structured market data for the quarterly report.

Usage:
    python parse_realtymx_export.py --input ./realtymx_export.csv --type rentals
    python parse_realtymx_export.py --input ./realtymx_export.csv --type sales

Output: prints JSON summary ready to feed into generate_slides.py insights.
"""

import argparse
import csv
import json
import statistics
from collections import defaultdict


# Recognized column name variants from RealtyMX exports
COL_MAP = {
    "address":      ["address", "full_address", "street_address", "building"],
    "neighborhood": ["neighborhood", "nbhd", "area", "submarket"],
    "unit_type":    ["unit_type", "type", "bedrooms", "bed", "br"],
    "price":        ["price", "rent", "asking_price", "list_price", "monthly_rent"],
    "price_sqft":   ["price_per_sqft", "price/sqft", "ppsf", "$/sqft"],
    "sqft":         ["sqft", "size", "square_feet", "sf"],
    "dom":          ["dom", "days_on_market", "days_listed", "market_days"],
    "list_date":    ["list_date", "listed_date", "date_listed", "on_market_date"],
    "status":       ["status", "listing_status"],
}


def find_col(headers, candidates):
    """Find the actual column name from a list of candidates (case-insensitive)."""
    headers_lower = {h.lower().strip(): h for h in headers}
    for c in candidates:
        if c.lower() in headers_lower:
            return headers_lower[c.lower()]
    return None


def parse_float(val):
    if not val:
        return None
    cleaned = val.replace("$", "").replace(",", "").replace("/sqft", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_int(val):
    if not val:
        return None
    try:
        return int(float(val))
    except ValueError:
        return None


def analyze_rentals(rows, col):
    """Produce rental market insights from parsed rows."""
    by_price_band = defaultdict(list)
    by_neighborhood = defaultdict(list)

    for row in rows:
        price = parse_float(row.get(col["price"], ""))
        dom = parse_int(row.get(col["dom"], ""))
        nbhd = row.get(col["neighborhood"], "Unknown").strip()

        if price and dom is not None:
            if price < 2000:
                by_price_band["sub-$2k"].append(dom)
            elif price < 3500:
                by_price_band["$2k-$3.5k"].append(dom)
            elif price < 5000:
                by_price_band["$3.5k-$5k"].append(dom)
            else:
                by_price_band["$5k+"].append(dom)

        if price and nbhd:
            by_neighborhood[nbhd].append(price)

    # Compute average DOM per price band
    dom_by_band = {}
    for band, doms in by_price_band.items():
        dom_by_band[band] = round(statistics.mean(doms), 1)

    # Compute median rent per neighborhood
    median_by_nbhd = {}
    for nbhd, prices in by_neighborhood.items():
        median_by_nbhd[nbhd] = round(statistics.median(prices))

    # Find fastest-moving band
    if dom_by_band:
        fastest_band = min(dom_by_band, key=dom_by_band.get)
        fastest_dom = dom_by_band[fastest_band]
    else:
        fastest_band, fastest_dom = "N/A", 0

    return {
        "total_listings": len(rows),
        "dom_by_price_band": dom_by_band,
        "median_rent_by_neighborhood": median_by_nbhd,
        "fastest_moving_band": fastest_band,
        "fastest_moving_dom": fastest_dom,
        "suggested_insight2": (
            f"Sub-${fastest_band.split('-')[0].replace('sub-', '')}/mo rentals clearing "
            f"in under {int(fastest_dom) + 1} days — demand outpacing supply"
        ),
    }


def analyze_sales(rows, col):
    """Produce sales market insights from parsed rows."""
    by_neighborhood = defaultdict(list)

    for row in rows:
        ppsf = parse_float(row.get(col.get("price_sqft", ""), ""))
        price = parse_float(row.get(col.get("price", ""), ""))
        sqft = parse_float(row.get(col.get("sqft", ""), ""))
        nbhd = row.get(col.get("neighborhood", ""), "Unknown").strip()

        # Derive $/sqft if not directly available
        if not ppsf and price and sqft and sqft > 0:
            ppsf = price / sqft

        if ppsf and nbhd:
            by_neighborhood[nbhd].append(ppsf)

    median_ppsf = {}
    for nbhd, vals in by_neighborhood.items():
        median_ppsf[nbhd] = round(statistics.median(vals))

    if median_ppsf:
        cheapest = min(median_ppsf, key=median_ppsf.get)
        priciest = max(median_ppsf, key=median_ppsf.get)
    else:
        cheapest = priciest = "N/A"

    return {
        "total_listings": len(rows),
        "median_ppsf_by_neighborhood": median_ppsf,
        "cheapest_neighborhood": cheapest,
        "cheapest_ppsf": median_ppsf.get(cheapest, 0),
        "priciest_neighborhood": priciest,
        "priciest_ppsf": median_ppsf.get(priciest, 0),
        "suggested_insight5": (
            f"$/sqft ranges from ${median_ppsf.get(cheapest, 0):,} ({cheapest}) "
            f"to ${median_ppsf.get(priciest, 0):,} ({priciest})"
        ),
    }


def main():
    parser = argparse.ArgumentParser(description="Parse RealtyMX CSV export for quarterly insights")
    parser.add_argument("--input", required=True, help="Path to RealtyMX CSV export file")
    parser.add_argument("--type", choices=["rentals", "sales"], required=True,
                        help="Type of listings to analyze")
    args = parser.parse_args()

    with open(args.input, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = list(reader)

    if not rows:
        print("Error: No rows found in CSV.")
        return

    # Map columns
    col = {}
    for key, candidates in COL_MAP.items():
        matched = find_col(headers, candidates)
        if matched:
            col[key] = matched

    print(f"\nParsed {len(rows)} rows. Detected columns: {list(col.keys())}")

    if args.type == "rentals":
        result = analyze_rentals(rows, col)
    else:
        result = analyze_sales(rows, col)

    print("\n── Market Data Summary ──────────────────────────────────")
    print(json.dumps(result, indent=2))
    print("\nCopy the 'suggested_insight' value into your generate_slides.py call.")


if __name__ == "__main__":
    main()
