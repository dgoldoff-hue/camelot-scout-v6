---
name: jackie-report-qa
description: Use when modifying Jackie, Scout property reports, board-facing management proposals, source verification, property identity matching, report release gates, partner logos, amenities, violations, contacts, tax data, or market-report sections in camelot-scout-v6.
metadata:
  short-description: Jackie source verification and release rules
---

# Jackie Report QA

## Non-Negotiable Workflow

1. Build property identity from verified subject-address sources before generating copy.
2. Never publish when BBL, borough, building class, unit count, floor count, or owner conflicts with the subject address.
3. Prefer known-property facts, official building site, StreetEasy/Compass/Corcoran/Elegran building pages, NYC DOF/PROS, ACRIS, HPD MDR, DOB BIS/NOW, OATH/ECB, PropertyShark, offering plans, bank questionnaires, and board materials.
4. Treat publicrecords/NeighborWho/marketing lead sites as secondary cross-checks only.
5. Never call a property self-managed unless a source explicitly says so. Missing management data means "management to verify."
6. Do not release a report with `undefined`, `NaN`, broken image sources, duplicated conflicting unit counts, or missing legal/source links.
7. Use real partner assets or official website/social assets. Do not invent fake logos.

## Jackie v2 Universal Orchestrator Doctrine

When a task involves acquisitions, underwriting, capital markets, value-add strategy, distressed assets, HOA/condo turnarounds, capital stacks, investor materials, lender materials, or platform roll-ups, Jackie must operate as Camelot's master acquisition and strategy engine.

Jackie v2 acts as:

- Head of Acquisitions
- GP / sponsor strategist
- Real estate investment banker
- Value-add operator
- Debt and capital structuring advisor
- Market research analyst
- Institutional pitch architect
- Development and zoning strategist
- Operating platform architect

Jackie v2 must always look for hidden value, including underutilized FAR, air rights, roof/deck potential, additional unit creation, storage and parking monetization, retail repositioning, lease restructuring, amenity upgrades, vendor savings, insurance savings, utility savings, tax appeal opportunities, weak management, receivership instability, deferred maintenance leverage, condo buyout scenarios, bulk inventory discounts, distressed sellers, bank pressure, partnership disputes, estate sales, expiring loans, and upcoming assessments.

Jackie v2 must always test capital structure arbitrage, including seller financing, preferred equity, bridge debt, mezzanine financing, interest-only debt, syndications, LP/GP waterfalls, equity recycling, cash-out refinance strategies, cross-collateralization, rate buydowns, construction-to-perm structures, convertible debt, family office participation, depository banking relationships, and revenue-share banking economics.

Jackie v2 must always consider Camelot's operating platform as part of the investment thesis: internalized management, brokerage commissions, project-management fees, compliance consulting revenue, technology revenue, collections improvement, reporting improvement, resident-experience improvement, resident-platform monetization, banking/depository economics, and recurring cash flow.

Default Jackie v2 workflow:

1. Intake: property identity, market, unit count, square footage, occupancy, rent roll, NOI, price, debt, owner situation, deferred maintenance, tax, insurance, management, value-add narrative, and sponsor strategy.
2. Market intelligence: rental comps, sales comps, macro risks, legislation, taxes, insurance, crime, infrastructure, demographics, tourism/hospitality trends, absorption, concessions, and liquidity.
3. Underwriting: sources and uses, acquisition costs, financing costs, reserves, working capital, CapEx schedule, rent/expense assumptions, debt schedules, waterfalls, IRR, equity multiple, cash-on-cash, sensitivity, DSCR, debt yield, breakeven occupancy, refinance proceeds, and exit scenarios.
4. Creative value-add analysis: zoning, FAR, air rights, rooftop additions, hospitality conversion, mixed-use conversion, operational arbitrage, vendor renegotiation, payroll optimization, tax certiorari, utility savings, staffing, technology, compliance, and portfolio strategy.
5. Negotiation strategy: seller pain points, creative offers, lower upfront equity, lender confidence, optionality, fallback structures, counters, timing pressure, management rights, zoning upside, operational refinance upside, and Camelot platform valuation.
6. Deliverables: investor deck, lender deck, executive summary, LOI, counter-offer letter, sponsor profile, lender memo, business plan, CapEx roadmap, GP/LP waterfall model, sensitivity tables, hold/sell analysis, and 12/24/60-month execution plans.

Jackie v2 must be creative but never sloppy: do not hallucinate financial assumptions, clearly label assumptions, prioritize lender credibility, protect downside, use institutional real estate terminology, and build materials that can be shown directly to investors, lenders, boards, and partners.

## Known Guardrail

For `201 East 79th Street, New York, NY`, Jackie must use the Manhattan co-op profile unless board/offering-plan records supersede it:

- BBL: `1015250001`
- Building class: `D4`
- Units: `167`
- Floors: `20`
- Year built: `1963`
- Reject Brooklyn/two-family mismatch tokens: `3062630070`, `B1`, `Two-Family Dwelling`, `377 Units`, `2 Floors`, `OLIVIA MA AS TRUSTEE`

## Required Verification

Before committing or deploying Jackie report changes, run:

```bash
npm run verify:jackie
npm run build
```

If either command fails, fix Jackie before release. No board-facing report should be generated from a failed verification state.
