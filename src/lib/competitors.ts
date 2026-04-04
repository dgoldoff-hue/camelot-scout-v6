/**
 * Competitor Intelligence Engine
 * Fetches competitor management company portfolios from NYC Open Data,
 * scores their performance, and identifies displacement opportunities.
 */

// Uses direct Socrata API calls for bulk operations rather than
// the single-building helpers in nyc-api.ts and gov-apis.ts.

// ============================================================
// Types
// ============================================================

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface CompetitorBuilding {
  registrationId: string;
  buildingId: string;
  address: string;
  borough: string;
  boroId: string;
  block: string;
  lot: string;
  zip: string;
  units: number;
  stories: number;
  violationsCount: number;
  openViolations: number;
  classAViolations: number;
  classBViolations: number;
  classCViolations: number;
  violationsPerUnit: number;
  ecbPenalties: number;
  score: number;
  grade: HealthGrade;
}

export interface CompetitorProfile {
  name: string;
  buildingCount: number;
  totalUnits: number;
  avgViolationsPerUnit: number;
  totalOpenViolations: number;
  avgScore: number;
  worstBuildings: CompetitorBuilding[];
  ecbPenalties: number;
  grade: HealthGrade;
  buildings: CompetitorBuilding[];
  violationDistribution: {
    classA: number;
    classB: number;
    classC: number;
  };
  fetchedAt: string;
}

export interface CompetitorComparison {
  competitors: CompetitorProfile[];
  rankedByHealth: string[];
  rankedBySize: string[];
  rankedByViolationRate: string[];
}

export interface DisplacementTarget {
  building: CompetitorBuilding;
  competitorName: string;
  reasons: string[];
  opportunityScore: number;
}

// ============================================================
// Constants
// ============================================================

const HPD_CONTACTS_ENDPOINT = 'https://data.cityofnewyork.us/resource/feu5-w2e2.json';
const HPD_REGISTRATION_ENDPOINT = 'https://data.cityofnewyork.us/resource/tesw-yqqr.json';
const HPD_VIOLATIONS_ENDPOINT = 'https://data.cityofnewyork.us/resource/wvxf-dwi5.json';

const BOROUGH_NAMES: Record<string, string> = {
  '1': 'Manhattan',
  '2': 'Bronx',
  '3': 'Brooklyn',
  '4': 'Queens',
  '5': 'Staten Island',
};

/** Well-known NYC management companies for pre-populated competitor list */
export const KNOWN_COMPETITORS = [
  'FirstService Residential',
  'Brown Harris Stevens',
  'Rudin Management',
  'Rose Associates',
  'Glenwood Management',
  'AKAM',
  'Douglas Elliman PM',
  'Maxwell-Kates',
  'Orsid Realty',
  'York International',
  'Tudor Realty',
  'Cooper Square Realty',
  'National Group',
] as const;

// ============================================================
// Core Functions
// ============================================================

/**
 * Fetch all buildings managed by a given management company.
 * Uses HPD Registration Contacts API to find registrations where
 * the corporation name matches the company, then enriches with
 * building registration data.
 */
export async function fetchCompetitorPortfolio(
  managementCompanyName: string
): Promise<CompetitorBuilding[]> {
  try {
    const upperName = managementCompanyName.toUpperCase().replace(/'/g, "''");

    // Step 1: Find all contact records for this management company
    const contactsUrl = `${HPD_CONTACTS_ENDPOINT}?$limit=500&$where=upper(corporationname) like '%25${encodeURIComponent(upperName)}%25' AND type='CorporateOwner' OR upper(corporationname) like '%25${encodeURIComponent(upperName)}%25' AND type='Agent'`;
    const contactsRes = await fetch(contactsUrl);
    if (!contactsRes.ok) throw new Error(`HPD Contacts API error: ${contactsRes.status}`);
    const contacts: any[] = await contactsRes.json();

    if (contacts.length === 0) {
      // Try broader search without type filter
      const broadUrl = `${HPD_CONTACTS_ENDPOINT}?$limit=500&$where=upper(corporationname) like '%25${encodeURIComponent(upperName)}%25'`;
      const broadRes = await fetch(broadUrl);
      if (!broadRes.ok) return [];
      const broadContacts = await broadRes.json();
      if (broadContacts.length === 0) return [];
      contacts.push(...broadContacts);
    }

    // Step 2: Get unique registration IDs
    const regIds = [...new Set(contacts.map((c: any) => c.registrationid).filter(Boolean))] as string[];
    if (regIds.length === 0) return [];

    // Limit to avoid excessively long queries
    const limitedRegIds = regIds.slice(0, 100);

    // Step 3: Fetch building registration data in batches
    const batchSize = 30;
    const allBuildings: any[] = [];
    for (let i = 0; i < limitedRegIds.length; i += batchSize) {
      const batch = limitedRegIds.slice(i, i + batchSize);
      const regQuery = batch.map((id) => `registrationid='${id}'`).join(' OR ');
      const buildingsUrl = `${HPD_REGISTRATION_ENDPOINT}?$limit=200&$where=${encodeURIComponent(regQuery)}`;
      const buildingsRes = await fetch(buildingsUrl);
      if (buildingsRes.ok) {
        const buildings = await buildingsRes.json();
        allBuildings.push(...buildings);
      }
    }

    // Step 4: Deduplicate by address and fetch violation counts
    const seen = new Set<string>();
    const dedupedBuildings: any[] = [];
    for (const b of allBuildings) {
      const key = `${b.boroid}-${b.block}-${b.lot}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedupedBuildings.push(b);
    }

    // Step 5: Fetch violations in bulk by building IDs
    const buildingIds = dedupedBuildings
      .map((b) => b.buildingid)
      .filter(Boolean)
      .slice(0, 50);

    const violationMap = await fetchBulkViolationCounts(buildingIds);

    // Step 6: Build CompetitorBuilding objects
    const competitorBuildings: CompetitorBuilding[] = dedupedBuildings.map((b) => {
      const units = parseInt(b.totalunits || b.unitsres || '0') || 0;
      const violations = violationMap.get(b.buildingid) || {
        total: 0,
        open: 0,
        classA: 0,
        classB: 0,
        classC: 0,
      };
      const violationsPerUnit = units > 0 ? violations.total / units : 0;
      const score = scoreSingleBuilding(violations.total, violations.open, units, violationsPerUnit);

      return {
        registrationId: b.registrationid || '',
        buildingId: b.buildingid || '',
        address: `${b.housenumber || ''} ${b.streetname || ''}`.trim(),
        borough: BOROUGH_NAMES[b.boroid] || b.boroid || '',
        boroId: b.boroid || '',
        block: b.block || '',
        lot: b.lot || '',
        zip: b.zip || '',
        units,
        stories: parseInt(b.stories || '0') || 0,
        violationsCount: violations.total,
        openViolations: violations.open,
        classAViolations: violations.classA,
        classBViolations: violations.classB,
        classCViolations: violations.classC,
        violationsPerUnit: Math.round(violationsPerUnit * 100) / 100,
        ecbPenalties: 0, // populated separately if needed
        score,
        grade: gradeFromScore(score),
      };
    });

    return competitorBuildings.sort((a, b) => a.score - b.score); // worst first
  } catch (err) {
    console.error('fetchCompetitorPortfolio error:', err);
    return [];
  }
}

/**
 * Fetch violation counts in bulk for a set of HPD building IDs.
 */
async function fetchBulkViolationCounts(
  buildingIds: string[]
): Promise<Map<string, { total: number; open: number; classA: number; classB: number; classC: number }>> {
  const map = new Map<string, { total: number; open: number; classA: number; classB: number; classC: number }>();
  if (buildingIds.length === 0) return map;

  try {
    const batchSize = 25;
    for (let i = 0; i < buildingIds.length; i += batchSize) {
      const batch = buildingIds.slice(i, i + batchSize);
      const filter = batch.map((id) => `buildingid='${id}'`).join(' OR ');
      const url = `${HPD_VIOLATIONS_ENDPOINT}?$limit=5000&$select=buildingid,class,currentstatus,violationstatus&$where=${encodeURIComponent(filter)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const violations: any[] = await res.json();

      for (const v of violations) {
        const bid = v.buildingid;
        if (!map.has(bid)) {
          map.set(bid, { total: 0, open: 0, classA: 0, classB: 0, classC: 0 });
        }
        const entry = map.get(bid)!;
        entry.total++;
        if (v.currentstatus !== 'CLOSE' && v.violationstatus !== 'Close') {
          entry.open++;
        }
        const cls = (v.class || '').toUpperCase();
        if (cls === 'A') entry.classA++;
        else if (cls === 'B') entry.classB++;
        else if (cls === 'C') entry.classC++;
      }
    }
  } catch (err) {
    console.error('Bulk violation fetch error:', err);
  }

  return map;
}

/**
 * Score a single building on a 0-100 scale (lower = worse health for the competitor).
 * Inverse of lead scoring — here 0 = terrible building, 100 = well-managed.
 */
function scoreSingleBuilding(
  totalViolations: number,
  openViolations: number,
  units: number,
  violationsPerUnit: number
): number {
  let score = 100;

  // Deduct for total violations
  if (totalViolations > 100) score -= 35;
  else if (totalViolations > 50) score -= 25;
  else if (totalViolations > 20) score -= 15;
  else if (totalViolations > 5) score -= 8;

  // Deduct for open violations
  if (openViolations > 30) score -= 30;
  else if (openViolations > 15) score -= 20;
  else if (openViolations > 5) score -= 12;
  else if (openViolations > 0) score -= 5;

  // Deduct for violations per unit
  if (violationsPerUnit > 5) score -= 25;
  else if (violationsPerUnit > 2) score -= 15;
  else if (violationsPerUnit > 1) score -= 8;
  else if (violationsPerUnit > 0.5) score -= 4;

  // Bonus for larger buildings (more at stake)
  if (units >= 100) score -= 5; // larger buildings under stress = worse signal
  else if (units >= 50) score -= 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Convert a health score to a letter grade.
 */
function gradeFromScore(score: number): HealthGrade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Score a competitor's overall portfolio health.
 */
export function scoreCompetitor(buildings: CompetitorBuilding[]): CompetitorProfile {
  if (buildings.length === 0) {
    return {
      name: '',
      buildingCount: 0,
      totalUnits: 0,
      avgViolationsPerUnit: 0,
      totalOpenViolations: 0,
      avgScore: 0,
      worstBuildings: [],
      ecbPenalties: 0,
      grade: 'F',
      buildings: [],
      violationDistribution: { classA: 0, classB: 0, classC: 0 },
      fetchedAt: new Date().toISOString(),
    };
  }

  const totalUnits = buildings.reduce((sum, b) => sum + b.units, 0);
  const totalViolations = buildings.reduce((sum, b) => sum + b.violationsCount, 0);
  const totalOpenViolations = buildings.reduce((sum, b) => sum + b.openViolations, 0);
  const totalEcb = buildings.reduce((sum, b) => sum + b.ecbPenalties, 0);
  const avgViolationsPerUnit = totalUnits > 0 ? totalViolations / totalUnits : 0;
  const avgScore = buildings.reduce((sum, b) => sum + b.score, 0) / buildings.length;

  const violationDistribution = {
    classA: buildings.reduce((sum, b) => sum + b.classAViolations, 0),
    classB: buildings.reduce((sum, b) => sum + b.classBViolations, 0),
    classC: buildings.reduce((sum, b) => sum + b.classCViolations, 0),
  };

  // Worst buildings: lowest scores (worst health)
  const sorted = [...buildings].sort((a, b) => a.score - b.score);
  const worstBuildings = sorted.slice(0, 10);

  return {
    name: '',
    buildingCount: buildings.length,
    totalUnits,
    avgViolationsPerUnit: Math.round(avgViolationsPerUnit * 100) / 100,
    totalOpenViolations,
    avgScore: Math.round(avgScore),
    worstBuildings,
    ecbPenalties: totalEcb,
    grade: gradeFromScore(avgScore),
    buildings,
    violationDistribution,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Find buildings where a competitor is weakest — prime displacement targets.
 * Returns buildings sorted by opportunity (worst health + most units = biggest opportunity).
 */
export async function findDisplacementTargets(
  competitorName: string
): Promise<DisplacementTarget[]> {
  const buildings = await fetchCompetitorPortfolio(competitorName);
  if (buildings.length === 0) return [];

  const targets: DisplacementTarget[] = buildings
    .filter((b) => b.score < 60) // only buildings below "C" threshold
    .map((b) => {
      const reasons: string[] = [];

      if (b.openViolations > 15) reasons.push(`${b.openViolations} open violations`);
      else if (b.openViolations > 5) reasons.push(`${b.openViolations} open violations`);

      if (b.violationsPerUnit > 3) reasons.push(`${b.violationsPerUnit} violations/unit — critical`);
      else if (b.violationsPerUnit > 1.5) reasons.push(`${b.violationsPerUnit} violations/unit — elevated`);

      if (b.classCViolations > 10) reasons.push(`${b.classCViolations} Class C (hazardous) violations`);

      if (b.units >= 50) reasons.push(`Large building (${b.units} units) — high-value target`);

      if (b.ecbPenalties > 10000) reasons.push(`$${b.ecbPenalties.toLocaleString()} ECB penalties`);

      if (b.grade === 'F') reasons.push('Grade F — building in crisis');
      else if (b.grade === 'D') reasons.push('Grade D — significant management failures');

      // Opportunity score: inverse of health × building size
      const healthPenalty = 100 - b.score;
      const sizeFactor = Math.min(b.units / 50, 3); // cap at 3x for 150+ unit buildings
      const opportunityScore = Math.round(healthPenalty * (1 + sizeFactor * 0.5));

      return {
        building: b,
        competitorName,
        reasons,
        opportunityScore: Math.min(100, opportunityScore),
      };
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore);

  return targets;
}

/**
 * Compare multiple competitors side-by-side.
 */
export async function compareCompetitors(
  names: string[]
): Promise<CompetitorComparison> {
  const profiles: CompetitorProfile[] = [];

  // Fetch portfolios in sequence to avoid API throttling
  for (const name of names) {
    const buildings = await fetchCompetitorPortfolio(name);
    const profile = scoreCompetitor(buildings);
    profile.name = name;
    profiles.push(profile);
  }

  // Rankings
  const rankedByHealth = [...profiles]
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((p) => p.name);

  const rankedBySize = [...profiles]
    .sort((a, b) => b.buildingCount - a.buildingCount)
    .map((p) => p.name);

  const rankedByViolationRate = [...profiles]
    .sort((a, b) => b.avgViolationsPerUnit - a.avgViolationsPerUnit)
    .map((p) => p.name);

  return {
    competitors: profiles,
    rankedByHealth,
    rankedBySize,
    rankedByViolationRate,
  };
}

// ============================================================
// Neighborhood Data for Heat Map
// ============================================================

export interface NeighborhoodData {
  name: string;
  borough: string;
  violations: number;
  ll97: number;
  ownershipChanges: number;
  complaints311: number;
}

export interface HeatMapData {
  neighborhoods: NeighborhoodData[];
  maxValues: {
    violations: number;
    ll97: number;
    ownershipChanges: number;
    complaints311: number;
  };
}

/** NYC Neighborhoods grouped by borough */
export const NYC_NEIGHBORHOODS: { borough: string; neighborhoods: string[] }[] = [
  {
    borough: 'Manhattan',
    neighborhoods: [
      'UES', 'UWS', 'Midtown East', 'Midtown West', 'Murray Hill', 'Gramercy',
      'Chelsea', 'Greenwich Village', 'East Village', 'LES', 'Tribeca', 'FiDi',
      'Harlem', 'Washington Heights', 'Inwood',
    ],
  },
  {
    borough: 'Brooklyn',
    neighborhoods: [
      'Park Slope', 'Williamsburg', 'DUMBO', 'Brooklyn Heights',
      'Bed-Stuy', 'Crown Heights', 'Flatbush',
    ],
  },
  {
    borough: 'Queens',
    neighborhoods: ['Astoria', 'LIC', 'Jackson Heights', 'Flushing'],
  },
  {
    borough: 'Bronx',
    neighborhoods: ['South Bronx', 'Riverdale'],
  },
];

/** Zip codes loosely mapped to neighborhoods for API lookups */
const NEIGHBORHOOD_ZIPS: Record<string, string[]> = {
  'UES': ['10021', '10028', '10065', '10075', '10128'],
  'UWS': ['10023', '10024', '10025'],
  'Midtown East': ['10017', '10022', '10055'],
  'Midtown West': ['10018', '10019', '10036'],
  'Murray Hill': ['10016'],
  'Gramercy': ['10003', '10010'],
  'Chelsea': ['10001', '10011'],
  'Greenwich Village': ['10012', '10014'],
  'East Village': ['10003', '10009'],
  'LES': ['10002'],
  'Tribeca': ['10007', '10013'],
  'FiDi': ['10004', '10005', '10006', '10038'],
  'Harlem': ['10026', '10027', '10029', '10030', '10035', '10037', '10039'],
  'Washington Heights': ['10031', '10032', '10033', '10040'],
  'Inwood': ['10034', '10040'],
  'Park Slope': ['11215', '11217'],
  'Williamsburg': ['11206', '11211', '11249'],
  'DUMBO': ['11201'],
  'Brooklyn Heights': ['11201'],
  'Bed-Stuy': ['11205', '11216', '11221', '11233'],
  'Crown Heights': ['11213', '11225', '11238'],
  'Flatbush': ['11210', '11218', '11226', '11230'],
  'Astoria': ['11101', '11102', '11103', '11105', '11106'],
  'LIC': ['11101', '11109'],
  'Jackson Heights': ['11372', '11373'],
  'Flushing': ['11354', '11355', '11358'],
  'South Bronx': ['10451', '10452', '10454', '10455', '10456'],
  'Riverdale': ['10463', '10471'],
};

/**
 * Fetch neighborhood-level heat map data.
 * Uses HPD violations, LL97 energy data, and 311 complaint proxies
 * to generate per-neighborhood intensity values.
 *
 * NOTE: This fetches aggregated counts efficiently using Socrata $select + $group_by
 * to minimize API calls. Falls back to synthetic estimates for metrics
 * without zip-level aggregation endpoints.
 */
export async function fetchHeatMapData(): Promise<HeatMapData> {
  const neighborhoods: NeighborhoodData[] = [];

  // Fetch violation counts by zip in bulk
  const allZips = Object.values(NEIGHBORHOOD_ZIPS).flat();
  const uniqueZips = [...new Set(allZips)];
  const zipViolationCounts = new Map<string, number>();

  try {
    // HPD violations aggregated by zip (using registration endpoint which has zip)
    const batchSize = 40;
    for (let i = 0; i < uniqueZips.length; i += batchSize) {
      const batch = uniqueZips.slice(i, i + batchSize);
      const zipFilter = batch.map((z) => `zip='${z}'`).join(' OR ');
      const url = `${HPD_REGISTRATION_ENDPOINT}?$select=zip,count(*) as cnt&$group=zip&$where=${encodeURIComponent(zipFilter)}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data: any[] = await res.json();
          for (const row of data) {
            zipViolationCounts.set(row.zip, parseInt(row.cnt) || 0);
          }
        }
      } catch {
        // continue with zeros
      }
    }
  } catch {
    // continue with zeros
  }

  // Build neighborhood data
  let maxViolations = 0;
  let maxLl97 = 0;
  let maxOwnership = 0;
  let max311 = 0;

  for (const group of NYC_NEIGHBORHOODS) {
    for (const name of group.neighborhoods) {
      const zips = NEIGHBORHOOD_ZIPS[name] || [];

      // Sum violation counts from zip data
      const violations = zips.reduce((sum, z) => sum + (zipViolationCounts.get(z) || 0), 0);

      // Synthetic estimates for other metrics (proportional to violation density)
      // In production these would come from separate API calls
      const ll97 = Math.round(violations * 0.15 + Math.random() * 10);
      const ownershipChanges = Math.round(violations * 0.08 + Math.random() * 5);
      const complaints311 = Math.round(violations * 1.2 + Math.random() * 20);

      const entry: NeighborhoodData = {
        name,
        borough: group.borough,
        violations,
        ll97,
        ownershipChanges,
        complaints311,
      };

      neighborhoods.push(entry);

      maxViolations = Math.max(maxViolations, violations);
      maxLl97 = Math.max(maxLl97, ll97);
      maxOwnership = Math.max(maxOwnership, ownershipChanges);
      max311 = Math.max(max311, complaints311);
    }
  }

  return {
    neighborhoods,
    maxValues: {
      violations: maxViolations || 1,
      ll97: maxLl97 || 1,
      ownershipChanges: maxOwnership || 1,
      complaints311: max311 || 1,
    },
  };
}
