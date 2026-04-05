# Camelot OS — Make.com + Google Drive File Migration & Automation Plan
## Version 1.0 | March 2026

### Core System
- Make.com (no-code automation) + Google Drive + Google Sheets
- MDS (Multi Data Services) coding system for properties, residents, vendors
- 42 buildings in portfolio
- Google Sheets = "brain" (routing/lookup for all automation)

### MDS Building Codes (all 42)
48, 58, 61, 68, 71, 105, 110, 117, 129, 130, 165, 165C, 175, 201, 25-27, 253, 26, 260, 283, 300, 346, 39, 402H, 410, 43, 465, 500W, 552, 56, 604, 748, 788, 83-55, 86W, 930, 949, CATCON, PMC, RYA, SUN, VRA

### Folder Structure
```
CAMELOT_OS/
├── 01_BUILDINGS_MASTER/
│   └── [MDS_CODE] - [BUILDING_NAME] - [ADDRESS]/
│       ├── 01_GOVERNANCE
│       ├── 02_FINANCIALS (MDS_REPORT_PACKAGES/YYYY/YYYY-MM)
│       ├── 03_RESIDENTS_UNITS
│       ├── 04_OPERATIONS
│       ├── 05_COMPLIANCE
│       ├── 06_INSURANCE
│       ├── 07_VENDORS
│       ├── 08_LEASING_SALES
│       ├── 09_LEGAL
│       └── 10_AI_INDEX
├── 02_GLOBAL_INDEX
├── 03_MDS_INTAKE
├── 04_SOPS_AND_STANDARDS
├── 05_AI_GOVERNANCE
└── 06_TEMPLATES
```

### File Naming Convention
`[MDS_CODE]_[ENTITY_TYPE]_[DOC_CATEGORY]_[DESCRIPTION]_[DATE].[ext]`

### 5 Make.com Scenarios
1. Folder Structure Creator (run once per building)
2. Legacy File Scanner & Classifier (batch)
3. File Renamer & Mover (human-approved)
4. Ongoing File Monitor (always running)
5. Monthly MDS Report Package Processor (always running)

### Implementation: 3 pilot buildings first → scale to all 42
- Phase 1: Foundation Setup (Week 1)
- Phase 2: Pilot Audit (Week 2)
- Phase 3: Pilot Execution (Week 3)
- Phase 4: Pilot Monitoring (Week 4)
- Phase 5: Scale to All 42 (Weeks 5-8)

### AI Readiness
Clean files = AI can: retrieve docs, look up residents, check vendor compliance, analyze financials, cross-building queries. Bad data = bad automation.
