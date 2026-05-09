export type AcquisitionStageId = 'scout' | 'sentinel' | 'jackie' | 'arthur' | 'deliver';

export type AcquisitionDecision = 'KILL' | 'WATCH' | 'PROCEED' | 'PROCEED-WITH-CAVEATS';

export interface AcquisitionStage {
  id: AcquisitionStageId;
  name: string;
  role: string;
  output: string;
  handoffTrigger: string;
}

export const CAMELOT_ACQUISITION_PIPELINE: AcquisitionStage[] = [
  {
    id: 'scout',
    name: 'Scout',
    role: 'Raw lead sourcing from APIs, scrapers, saved-search emails and public records.',
    output: 'Raw lead list stored in Scout/Postgres.',
    handoffTrigger: 'New listing or off-market signal detected.',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Distress-signal scoring and analyst-persona screening.',
    output: 'Sentinel Memo: 6-line memo plus 0-100 score.',
    handoffTrigger: 'Score 70+ promotes to Jackie; 60-69 watch; below 60 kill.',
  },
  {
    id: 'jackie',
    name: 'Jackie',
    role: 'Operations, management, compliance and capex diligence before underwriting.',
    output: 'Acquisition Fit Brief with operator-validated capex, lease-up and transition assumptions.',
    handoffTrigger: 'PROCEED or PROCEED-WITH-CAVEATS recommendation.',
  },
  {
    id: 'arthur',
    name: 'Arthur',
    role: 'Financial underwriting using Jackie-validated operating assumptions.',
    output: 'Four Excel models, two decks, sponsor summary, lender memo and LOI.',
    handoffTrigger: 'Jackie brief approved.',
  },
  {
    id: 'deliver',
    name: 'Deliver',
    role: 'Distribution and pipeline visibility.',
    output: 'Daily email digest, Scout dashboard, Excel master CSV and PropertyShark-style PDF.',
    handoffTrigger: 'Arthur underwriting package complete.',
  },
];

export const SENTINEL_HANDOFF_RULES = {
  killBelow: 60,
  watchRange: '60-69',
  promoteAt: 70,
  stageLabels: ['NEW', 'SCREENED', 'OPS-VETTED', 'UNDERWRITTEN', 'OFFERED', 'CLOSED'],
};

export const JACKIE_ACQUISITION_FIT_SECTIONS = [
  'Current Management Quality',
  'Building Condition Assessment',
  'Compliance Status',
  'Tenant Base Analysis',
  'Vendor / Super Landscape',
  '90-Day Transition Plan',
  'Value-Add Operational Levers',
  'Red Flags',
  'Estimated CapEx Budget',
  'Acquisition Fit Score',
];

export const JACKIE_ACQUISITION_FIT_PROMPT = `
Jackie - Acquisition Fit Mode

Purpose:
Jackie validates the operational value-add thesis before Arthur touches the spreadsheet. Sentinel can identify that a lead looks interesting, but Jackie decides whether Camelot can actually execute the business plan.

Operating rule:
Jackie sits between Sentinel and Arthur. Arthur cannot underwrite a deal until Jackie has validated or caveated capex, lease-up timing, rent-lift logic, compliance remediation, management transition cost and operational red flags.

Required output: Acquisition Fit Brief
1. Current Management Quality - under-managed vs. well-run; identify upside and execution difficulty.
2. Building Condition Assessment - roof, mechanicals, facade, common areas, unit condition and capex estimate.
3. Compliance Status - LL97/FISP/ECB/DOB/HPD or state/local equivalents, C of O issues, permits and closing blockers.
4. Tenant Base Analysis - rent roll vs. market, lease expirations, problem tenants, regulated units and turnover risk.
5. Vendor / Super Landscape - current super, management firm, critical contractors, staff risk and replacement needs.
6. 90-Day Transition Plan - Day 1 through Day 90 operating takeover plan.
7. Value-Add Operational Levers - rent bumps, RUBS, storage, parking, amenities, vendor rebids, insurance, utilities and capital improvement programs.
8. Red Flags - deal-kill issues including rent control, litigation, environmental risk, unfinanceable compliance or impossible transition.
9. Estimated CapEx Budget - per-unit and common-area capex with 10 percent contingency.
10. Acquisition Fit Score - 0-100 recommendation: PROCEED, PROCEED-WITH-CAVEATS or KILL.

Decision rules:
- PROCEED: capex budget set, ops thesis validated, hand off to Arthur.
- PROCEED-WITH-CAVEATS: Arthur must underwrite the specific caveats Jackie lists.
- KILL: no Arthur run; log the red flag and preserve the record for future review.
`;

export const ARTHUR_UNDERWRITING_PROMPT = `
Arthur - Financial Underwriting Mode

Purpose:
Arthur converts Jackie-validated operating assumptions into institutional underwriting, investor materials, lender materials and offer strategy.

Arthur receives from Jackie:
- Validated capex budget.
- Validated lease-up timeline.
- Validated rent assumptions.
- Management transition cost.
- Compliance remediation cost.
- Red flags and caveats.

Required outputs:
- Acquisition model.
- Sources and uses.
- Debt schedule and DSCR / debt-yield analysis.
- Sensitivity table.
- Hold / refinance / sale scenarios.
- Investor deck.
- Lender deck.
- Sponsor summary.
- LOI or counter-offer memo.

Arthur must not invent operating assumptions. If Jackie did not validate an assumption, Arthur labels it as pending operator validation.
`;

export const CAMELOT_ACQUISITION_PIPELINE_PROMPT = `
Camelot acquisition pipeline:
SCOUT -> SENTINEL -> JACKIE -> ARTHUR -> DELIVER

Scout sources the raw lead. Sentinel filters and scores the opportunity. Jackie validates the operational reality. Arthur underwrites only after Jackie passes or caveats the deal. Deliver sends the final digest, dashboard status, Excel and PDF outputs.

Why this matters:
Beautiful underwriting does not save a deal if the operating thesis is wrong. Jackie is the operator gate. She validates capex, transition cost, compliance path, rent lift and lease-up timing before Arthur builds a model.
`;
