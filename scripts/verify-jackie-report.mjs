import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const reportFile = resolve(root, 'src/lib/camelot-report.ts');
const reportCenterFile = resolve(root, 'src/pages/ReportCenter.tsx');
const instantProposalFile = resolve(root, 'src/pages/InstantProposal.tsx');
const propertyDetailFile = resolve(root, 'src/components/PropertyDetail.tsx');
const source = readFileSync(reportFile, 'utf8');
const reportCenter = readFileSync(reportCenterFile, 'utf8');
const instantProposal = readFileSync(instantProposalFile, 'utf8');
const propertyDetail = readFileSync(propertyDetailFile, 'utf8');

const requiredTokens = [
  ['201 East 79 known profile', "canonicalAddress: '201 East 79th Street, New York, NY 10075'"],
  ['201 East 79 BBL', "bbl: '1015250001'"],
  ['201 East 79 unit count', 'units: 167'],
  ['201 East 79 mismatch rejection', '3062630070'],
  ['Known property guard check', 'Known Property Guard: 201 East 79th'],
  ['Source conflict release gate', 'Source Conflict Release Gate'],
  ['NYC property-record stack', 'NYC DOB Find Building Data'],
  ['DOF / PROS source', 'NYC DOF / PROS'],
  ['PropertyShark source', 'PropertyShark'],
  ['Violation source coverage table', 'Violation Source Coverage'],
  ['DOB BIS and DOB NOW coverage', 'DOB BIS &amp; DOB NOW'],
  ['DHCR rent stabilization coverage', 'DHCR / rent stabilization'],
  ['311 service request coverage', '311 Service Requests'],
  ['Court index coverage', 'NYS eCourts / WebCivil'],
  ['LexisNexis legal enrichment coverage', 'LexisNexis legal and claims enrichment'],
  ['All-zero compliance sanity check', 'All automated compliance/lien/litigation/311 sources returned zero'],
  ['Commercial source stack', 'NYC vacant storefront data'],
  ['Commercial broker source stack', 'CoStar/LoopNet-style commercial listings'],
  ['Neighborhood source stack', 'Neighborhood scoring source stack'],
  ['LPC landmark fallback rules', 'getLpcLandmarkFallbackLabels'],
  ['Nearby Landmarks QA gate', "name: 'Nearby Landmarks'"],
  ['Miller Samuel market reports', 'Miller Samuel New York City Market Reports'],
  ['Positive pro forma QA gate', 'Positive Value-Creation Pro Forma'],
  ['Controllable savings model', 'Vendor Rebidding & Scope Control'],
  ['Board-time savings model', 'Retention, Risk Avoidance & Board Time Saved'],
  ['Value creation business case', 'The business case for Camelot'],
  ['Competitive switch narrative', 'Why Boards Are Switching'],
  ['Competitive named firm context', 'Orsid/AKAM, FirstService Residential, Douglas Elliman Property Management, Maxwell-Kates, Associa'],
  ['Competitive PE context', 'PE / Acquisition Pressure'],
  ['AKAM acquisition source context', 'Audax Private Equity acquired AKAM'],
  ['ConciergePlus partner logo', '/images/partners/conciergeplus.svg'],
  ['Select real web asset', 'https://d2e1363xcu3t9u.cloudfront.net/2024/images/share.png'],
  ['Camelot final logo', 'https://www.camelot.nyc/wp-content/uploads/2015/03/Camelot-logo-footer-white.png'],
  ['Portfolio image fallback', 'Google Street View reference'],
  ['Portfolio image QA gate', 'Portfolio Building Images'],
  ['Legal terms URL check', 'LEGAL_TERMS_URL'],
  ['No self-managed without explicit source', 'Self-managed language requires an explicit source'],
];

const failures = requiredTokens
  .filter(([, token]) => !source.includes(token))
  .map(([label, token]) => `${label}: missing "${token}"`);

const forbiddenTokens = [
  ['old Select card image', 'https://d2e1363xcu3t9u.cloudfront.net/2019/resized/Black_card_without_chip.png'],
  ['old Jacqueline background', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/JKOnassis.jpg/440px-JKOnassis.jpg'],
];

for (const [label, token] of forbiddenTokens) {
  if (source.includes(token)) failures.push(`${label}: forbidden token still present`);
}

if (failures.length) {
  console.error('Jackie verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const workflowTokens = [
  ['visible release panel', 'Jackie Verified Release'],
  ['locked release language', 'Release locked. Jackie can draft, but cannot publish'],
  ['unlocked release language', 'Release unlocked. Jackie verified'],
  ['pitch preview gated', 'const releaseHtml = generateBrochureHTML(d);'],
  ['release QA computed', 'const releaseQA = useMemo'],
  ['instant proposal validates Jackie', 'validateJackieReport(reportData, fullHtml)'],
  ['instant proposal locks external draft', 'Proposal draft locked until Jackie blockers are cleared'],
  ['property detail validates Jackie', 'validateJackieReport(data, html)'],
  ['property detail remains internal-accessible', 'Jackie internal review opened with'],
];

const workflowSource = [reportCenter, instantProposal, propertyDetail].join('\n');
const workflowFailures = workflowTokens
  .filter(([, token]) => !workflowSource.includes(token))
  .map(([label, token]) => `${label}: missing "${token}"`);

if (instantProposal.includes("Mgmt: {d?.managementCompany || 'Self-Managed'}")) {
  workflowFailures.push('instant proposal self-managed fallback: forbidden token still present');
}

if (workflowFailures.length) {
  console.error('Jackie verified-release workflow check failed:');
  for (const failure of workflowFailures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Jackie verification passed (${requiredTokens.length} source rules + ${workflowTokens.length} workflow rules checked).`);
