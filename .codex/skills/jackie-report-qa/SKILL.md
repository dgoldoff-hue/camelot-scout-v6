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
