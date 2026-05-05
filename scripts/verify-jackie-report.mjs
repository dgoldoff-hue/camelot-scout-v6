import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const reportFile = resolve(root, 'src/lib/camelot-report.ts');
const reportCenterFile = resolve(root, 'src/pages/ReportCenter.tsx');
const instantProposalFile = resolve(root, 'src/pages/InstantProposal.tsx');
const propertyDetailFile = resolve(root, 'src/components/PropertyDetail.tsx');
const pitchReportFile = resolve(root, 'src/lib/pitch-report.ts');
const streetEasyFile = resolve(root, 'src/lib/streeteasy.ts');
const nycApiFile = resolve(root, 'src/lib/nyc-api.ts');
const nycViolationsFile = resolve(root, 'src/lib/nyc-violations.ts');
const gutCheckFile = resolve(root, 'src/lib/gut-check.ts');
const source = readFileSync(reportFile, 'utf8');
const streetEasySource = readFileSync(streetEasyFile, 'utf8');
const nycApiSource = readFileSync(nycApiFile, 'utf8');
const nycViolationsSource = readFileSync(nycViolationsFile, 'utf8');
const gutCheckSource = readFileSync(gutCheckFile, 'utf8');
const reportCenter = readFileSync(reportCenterFile, 'utf8');
const instantProposal = readFileSync(instantProposalFile, 'utf8');
const propertyDetail = readFileSync(propertyDetailFile, 'utf8');
const pitchReportSource = readFileSync(pitchReportFile, 'utf8');
const sourceStack = `${source}\n${pitchReportSource}\n${streetEasySource}\n${nycApiSource}\n${nycViolationsSource}\n${gutCheckSource}`;

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
  ['DOB NOW FISP facade coverage', 'DOB NOW Safety / FISP facade filings'],
  ['DOB NOW facade Open Data endpoint', 'xubg-57si'],
  ['Violation address parser normalization', 'streetLikeClause'],
  ['DHCR rent stabilization coverage', 'DHCR / rent stabilization'],
  ['311 service request coverage', '311 Service Requests'],
  ['Court index coverage', 'NYS eCourts / WebCivil'],
  ['LexisNexis legal enrichment coverage', 'LexisNexis legal and claims enrichment'],
  ['All-zero compliance sanity check', 'All automated compliance/lien/litigation/311 sources returned zero'],
  ['Current management score reconciliation gate', 'Current Management Score Reconciliation'],
  ['Current management risk narrative', 'Management Public-Record Risk'],
  ['Management score uses tax liens', 'taxLienRecordCount'],
  ['Management score uses FISP facade issues', 'facadeIssueCount'],
  ['Jackie intel report filename helper', 'buildJackieIntelReportFilename'],
  ['Jackie intel report filename prefix', 'Camelot-Intel-Report-For_'],
  ['Camelot 15 percent fee formula', 'midMarket * 0.85'],
  ['Lease renewal ancillary fee', '$350 per lease'],
  ['Closing ancillary fee', "camelotRate: '$1,500'"],
  ['Alteration agreement ancillary fee', 'Review of Alteration Agreements'],
  ['Corinthian official website', 'https://thecorinthiannyc.com/'],
  ['Corinthian official image', 'The-Corinthian-building-NYC-Condos.jpg'],
  ['345 West 58 display-name guard', '345 West 58th Street, New York, NY 10019'],
  ['AKAM building-name sanitizer', 'cleanBuildingName'],
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
  ['Community partnership report section', 'Community &amp; Industry Partnerships'],
  ['Community partnership local vendors', 'local vendors, community stakeholders'],
  ['Industry collaboration confidentiality', 'while protecting client confidentiality'],
  ['Creative staffing report section', 'Creative Staffing &amp; Operating Model'],
  ['Fractional senior leadership model', 'Fractional Senior Leadership'],
  ['AI virtual assistance staffing support', 'AI &amp; Virtual Assistance'],
  ['Front desk concierge staffing image', './images/services/front-desk-concierge.jpg'],
  ['Front desk concierge staffing copy', 'Front Desk &amp; Concierge Staffing'],
  ['Gut Check borough benchmark fallback', 'borough-level NYC benchmark'],
  ['LL97 missing-data workplan rule', 'the report must flag the missing data and provide the compliance workplan'],
  ['LL97 likely applicable fallback', 'll97LikelyApplicable'],
  ['Jackie focus theme registry', 'REPORT_FOCUS_THEMES'],
  ['Jackie inquiry-driven focus slide', 'Inquiry-Driven Focus'],
  ['Jackie accounting focus monthly reports', 'monthly management reports deployed between the 20th and 25th'],
  ['Jackie focus facts remain source checked', 'the selected focus only changes what Camelot emphasizes'],
  ['Jackie report package registry', 'JACKIE_REPORT_PACKAGES'],
  ['Jackie first email intro package', 'First Email Intro'],
  ['Jackie board meeting deck package', 'Board Meeting Deck'],
  ['Jackie appendix package', 'Appendix: Full Jackie Report'],
  ['Camelot Manhattan minimum fee rule', 'MANHATTAN_MONTHLY_MINIMUM_FEE = 1500'],
  ['Camelot Manhattan preferred minimum fee', 'MANHATTAN_PREFERRED_MINIMUM_FEE = 2000'],
  ['Camelot outer-borough minimum fee rule', 'OUTER_BOROUGH_MONTHLY_MINIMUM_FEE = 1200'],
  ['Camelot outer-borough preferred minimum fee', 'OUTER_BOROUGH_PREFERRED_MINIMUM_FEE = 1500'],
  ['Camelot minimum fee visible in report', 'Camelot minimum:'],
  ['Jackie executive roster slide', 'CAMELOT_EXECUTIVE_TEAM'],
  ['Jackie MDS reporting proof', 'MDS_REPORT_PROOF_POINTS'],
  ['Jackie onboarding checklist proof', 'ONBOARDING_CHECKLIST'],
  ['Jackie agreement fee proof', 'STANDARD_AGREEMENT_PROOF_POINTS'],
  ['Jackie visual route map slide', 'New York Reach'],
  ['Jackie HQ route map source', 'Google Maps route imagery'],
  ['Jackie response chart visual', 'What Boards Care About'],
  ['Jackie intelligence source visual cards', 'compactIntelligenceSources'],
  ['Jackie subject image visual fallback', 'subject-property visual reference'],
  ['Concierge Plus product-suite source', 'https://conciergeplus.com/product-suite/'],
  ['Neighborhood ZIP context model', 'neighborhoodSearchContext'],
  ['ZIP-first context source rule', 'ZIP-first neighborhood context from DOF/HPD/address parsing'],
  ['Neighborhood ZIP QA gate', 'Neighborhood / ZIP Search Context'],
  ['Neighborhood context query used for dynamic search', 'encodedNeighborhoodContext'],
  ['Neighborhood context used for landmarks', 'landmarkNeighborhoodContext'],
  ['Neighborhood context used for broad source links', 'ZIP/neighborhood context → broad searches'],
  ['Domecile broad-context lookup', 'Search Domecile by ZIP / neighborhood context'],
  ['ConciergePlus partner logo', '/images/partners/conciergeplus.svg'],
  ['Select real web asset', 'https://d2e1363xcu3t9u.cloudfront.net/2024/images/share.png'],
  ['Domecile real logo asset', 'https://www.domecile.com/assets/default/domecile_logo_evolve-f47345567bc24e05b97fd7c7f893ef2e897c9679312a2b55776c7d7d5f2d1b7d.svg'],
  ['BuildingLink real logo asset', 'https://www.buildinglink.io/hs-fs/hubfs/Blue-Gold%20Logo%20-%20Transparent%20No%20Tagline.png'],
  ['Camelot final logo', 'https://www.camelot.nyc/wp-content/uploads/2015/03/Camelot-logo-footer-white.png'],
  ['Portfolio image fallback', 'Google Street View reference'],
  ['Portfolio image QA gate', 'Portfolio Building Images'],
  ['StreetEasy photo extraction', 'extractStreetEasyImageUrls'],
  ['StreetEasy photo source rule', 'StreetEasy Photo Source Rule'],
  ['Subject image fallback helper', 'subjectImageOnError'],
  ['Subject image fallback chain helper', 'subjectImageOnErrorChain'],
  ['Subject image candidate stack', 'buildSubjectImageCandidates'],
  ['Subject image fallback chain QA gate', 'Subject Image Fallback Chain'],
  ['Building image source stack rule', 'Building image source stack: uploaded / verified Camelot assets'],
  ['Jacqueline Vanity Fair image', "const JACQUELINE_PORTRAIT_URL = 'https://archive.vanityfair.com/image/spread/20040501/135/0'"],
  ['Jacqueline fallback image', 'JACQUELINE_PORTRAIT_FALLBACK_URL'],
  ['Jacqueline Vanity Fair article', 'VANITY_FAIR_CAMELOT_REFERENCE_URL'],
  ['Jacqueline portrait QA gate', 'Jacqueline Portrait Slide'],
  ['Jacqueline values language', 'grace, stewardship, taste, loyalty, discretion'],
  ['Legal terms URL check', 'LEGAL_TERMS_URL'],
  ['No self-managed without explicit source', 'Self-managed language requires an explicit source'],
];

const failures = requiredTokens
  .filter(([, token]) => !sourceStack.includes(token))
  .map(([label, token]) => `${label}: missing "${token}"`);

const forbiddenTokens = [
  ['old Select card image', 'https://d2e1363xcu3t9u.cloudfront.net/2019/resized/Black_card_without_chip.png'],
  ['old Jacqueline background', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/JKOnassis.jpg/440px-JKOnassis.jpg'],
  ['broken Jacqueline thumb URL', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Jackie_Kennedy_Color_Portrait_%283x4_cropped%29.jpg/512px-Jackie_Kennedy_Color_Portrait_%283x4_cropped%29.jpg'],
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
  ['report center focus controls', 'Jackie Report Focus'],
  ['report center focus notes', 'Optional notes from Get-a-Quote'],
  ['report center package controls', 'Jackie Output Package'],
  ['report center selected package preview', 'Preview Selected Package'],
  ['report center board meeting deck preview', 'Board Meeting Deck (15)'],
  ['report center first email intro preview', 'First Email Intro (6-8)'],
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
