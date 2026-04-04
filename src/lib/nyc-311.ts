/**
 * NYC 311 Complaint Data Integration
 * Uses NYC Open Data — free, no API key required.
 */

// ============================================================
// Types
// ============================================================

export interface Complaint311 {
  unique_key: string;
  created_date: string;
  complaint_type: string;
  descriptor: string;
  incident_address: string;
  borough: string;
  status: string;
  resolution_description: string;
}

export interface Complaint311Category {
  type: string;
  count: number;
  complaints: Complaint311[];
}

// ============================================================
// Constants
// ============================================================

const ENDPOINT_311 = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

/** Severity weights for distress score calculation */
const SEVERITY_WEIGHTS: Record<string, number> = {
  'HEAT/HOT WATER': 10,
  'PLUMBING': 8,
  'PAINT/PLASTER': 7,
  'ELEVATOR': 9,
  'WATER LEAK': 8,
  'ELECTRIC': 8,
  'GENERAL CONSTRUCTION': 6,
  'DOOR/WINDOW': 5,
  'FLOORING/STAIRS': 6,
  'SAFETY': 10,
  'FIRE SAFETY DIRECTOR - Loss of Certification/Failure to Certify': 10,
  'UNSANITARY CONDITION': 9,
  'PEST CONTROL': 4,
  'NOISE - RESIDENTIAL': 2,
  'NOISE - COMMERCIAL': 2,
  'BLOCKED DRIVEWAY': 1,
};

const BOROUGH_MAP: Record<string, string> = {
  manhattan: 'MANHATTAN',
  bronx: 'BRONX',
  brooklyn: 'BROOKLYN',
  queens: 'QUEENS',
  'staten island': 'STATEN ISLAND',
};

// ============================================================
// API Functions
// ============================================================

/**
 * Fetch 311 complaints for an address.
 * Uses incident_address LIKE pattern for flexible matching.
 */
export async function fetch311Complaints(
  address: string,
  borough?: string,
  daysBack: number = 365,
): Promise<Complaint311[]> {
  try {
    const upperAddr = address.toUpperCase().trim();
    // Extract house number and build a LIKE pattern
    const match = upperAddr.match(/^(\d+[-\d]*)\s+(.+?)(?:\s*,.*)?$/);
    const houseNum = match?.[1] || '';
    const streetPart = match?.[2] || upperAddr;

    // Build flexible pattern: "%301%EAST 79%"
    const pattern = houseNum ? `%${houseNum}%${streetPart}%` : `%${streetPart}%`;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    const dateStr = sinceDate.toISOString().split('T')[0];

    let where = `upper(incident_address) like '${pattern}' AND created_date >= '${dateStr}T00:00:00'`;
    if (borough) {
      const boroughUpper = BOROUGH_MAP[borough.toLowerCase()] || borough.toUpperCase();
      where += ` AND upper(borough)='${boroughUpper}'`;
    }

    const url = `${ENDPOINT_311}?$limit=500&$order=created_date DESC&$where=${encodeURIComponent(where)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`311 API error: ${res.status}`);

    const data: any[] = await res.json();

    return data.map((d) => ({
      unique_key: d.unique_key || '',
      created_date: d.created_date || '',
      complaint_type: d.complaint_type || '',
      descriptor: d.descriptor || '',
      incident_address: d.incident_address || '',
      borough: d.borough || '',
      status: d.status || '',
      resolution_description: d.resolution_description || '',
    }));
  } catch (err) {
    console.error('311 Complaints fetch error:', err);
    return [];
  }
}

/**
 * Group complaints by complaint_type.
 */
export function categorize311Complaints(complaints: Complaint311[]): Complaint311Category[] {
  const map = new Map<string, Complaint311[]>();

  for (const c of complaints) {
    const type = c.complaint_type || 'OTHER';
    if (!map.has(type)) map.set(type, []);
    map.get(type)!.push(c);
  }

  return Array.from(map.entries())
    .map(([type, items]) => ({ type, count: items.length, complaints: items }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate a 0–100 distress score based on 311 complaint volume and severity.
 *
 * Scoring logic:
 *  - Base: volume contribution (capped at 50 points for 50+ complaints)
 *  - Severity: weighted average of complaint types (up to 30 points)
 *  - Recency: bonus for recent complaints in last 30 days (up to 20 points)
 */
export function calculate311Score(complaints: Complaint311[]): number {
  if (complaints.length === 0) return 0;

  // Volume contribution: 1 point per complaint, max 50
  const volumeScore = Math.min(complaints.length, 50);

  // Severity contribution: weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  for (const c of complaints) {
    const weight = SEVERITY_WEIGHTS[c.complaint_type] ?? 3;
    weightedSum += weight;
    totalWeight += 1;
  }
  const avgSeverity = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Scale 0-10 severity to 0-30 points
  const severityScore = (avgSeverity / 10) * 30;

  // Recency: complaints in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = complaints.filter(
    (c) => new Date(c.created_date) > thirtyDaysAgo,
  ).length;
  // Up to 20 points for 20+ recent complaints
  const recencyScore = Math.min(recentCount, 20);

  return Math.min(Math.round(volumeScore + severityScore + recencyScore), 100);
}
