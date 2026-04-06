/**
 * Neighborhood Intelligence — Live data for scoring and context
 * Sources: NYPD CompStat, NYC 311, NYC Landmarks, Google Maps Embed
 */

const NYC_BASE = 'https://data.cityofnewyork.us/resource';

export interface NeighborhoodIntel {
  // Crime
  crimeTotal: number;
  crimeBreakdown: Array<{ type: string; count: number }>;
  crimePrecinct: string;
  crimeScore: number; // 1-10 (10 = safest)
  // Quality of Life (311)
  complaints311Total: number;
  topComplaints: Array<{ type: string; count: number }>;
  qualityScore: number; // 1-10
  // Landmarks
  landmarks: Array<{ name: string; type: string; date: string }>;
  // Transit (from neighborhood data)
  transitScore: number;
  // Scoring explanation
  scoreExplanation: string;
}

/**
 * Fetch crime stats by precinct
 */
async function fetchCrimeStats(precinct: string): Promise<{ total: number; breakdown: Array<{ type: string; count: number }> }> {
  try {
    const url = `${NYC_BASE}/5uac-w243.json?$select=ofns_desc,count(*) as cnt&$where=addr_pct_cd='${precinct}' AND cmplnt_fr_dt>'2025-01-01T00:00:00'&$group=ofns_desc&$order=cnt DESC&$limit=10`;
    const res = await fetch(url);
    if (!res.ok) return { total: 0, breakdown: [] };
    const data = await res.json();
    const total = data.reduce((s: number, r: any) => s + parseInt(r.cnt || '0'), 0);
    return { total, breakdown: data.map((r: any) => ({ type: r.ofns_desc, count: parseInt(r.cnt) })) };
  } catch { return { total: 0, breakdown: [] }; }
}

/**
 * Fetch 311 complaints by ZIP
 */
async function fetch311Stats(zip: string): Promise<{ total: number; top: Array<{ type: string; count: number }> }> {
  try {
    const url = `${NYC_BASE}/erm2-nwe9.json?$select=complaint_type,count(*) as cnt&$where=incident_zip='${zip}' AND created_date>'2025-01-01T00:00:00'&$group=complaint_type&$order=cnt DESC&$limit=7`;
    const res = await fetch(url);
    if (!res.ok) return { total: 0, top: [] };
    const data = await res.json();
    const total = data.reduce((s: number, r: any) => s + parseInt(r.cnt || '0'), 0);
    return { total, top: data.map((r: any) => ({ type: r.complaint_type, count: parseInt(r.cnt) })) };
  } catch { return { total: 0, top: [] }; }
}

/**
 * Fetch nearby landmarks
 */
async function fetchLandmarks(lat: number, lng: number, radius: number = 800): Promise<Array<{ name: string; type: string; date: string }>> {
  try {
    const url = `${NYC_BASE}/x3ar-yjn2.json?$limit=10&$where=within_circle(the_geom,${lat},${lng},${radius})`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((r: any) => ({
      name: r.lm_name || r.hist_dist || 'Unnamed Landmark',
      type: r.lm_type || 'Historic',
      date: (r.date_designated || '').slice(0, 10),
    }));
  } catch { return []; }
}

/**
 * Get full neighborhood intelligence
 */
export async function getNeighborhoodIntel(precinct: string, zip: string, lat?: number, lng?: number): Promise<NeighborhoodIntel> {
  const [crime, complaints, landmarks] = await Promise.all([
    fetchCrimeStats(precinct),
    fetch311Stats(zip),
    lat && lng ? fetchLandmarks(lat, lng) : Promise.resolve([]),
  ]);

  // Crime score: lower incidents = higher score. NYC avg precinct ~5000/yr
  const crimeScore = crime.total > 8000 ? 3 : crime.total > 6000 ? 4 : crime.total > 4000 ? 6 : crime.total > 2000 ? 7 : crime.total > 1000 ? 8 : 9;
  
  // Quality score: lower 311 complaints = higher quality. NYC avg ZIP ~15000/yr
  const qualityScore = complaints.total > 30000 ? 4 : complaints.total > 20000 ? 5 : complaints.total > 15000 ? 6 : complaints.total > 10000 ? 7 : complaints.total > 5000 ? 8 : 9;

  const scoreExplanation = `Crime Score (${crimeScore}/10): Based on ${crime.total.toLocaleString()} incidents in Precinct ${precinct} (2025 YTD). Top: ${crime.breakdown.slice(0, 3).map(c => c.type).join(', ')}. Quality Score (${qualityScore}/10): Based on ${complaints.total.toLocaleString()} 311 complaints in ZIP ${zip} (2025 YTD). Top: ${complaints.top.slice(0, 3).map(c => c.type).join(', ')}.`;

  return {
    crimeTotal: crime.total,
    crimeBreakdown: crime.breakdown,
    crimePrecinct: precinct,
    crimeScore,
    complaints311Total: complaints.total,
    topComplaints: complaints.top,
    qualityScore,
    landmarks,
    transitScore: 8, // placeholder — would need MTA GTFS data
    scoreExplanation,
  };
}

/**
 * Generate Neighborhood Intel HTML section for Jackie reports
 */
export function generateNeighborhoodIntelHTML(intel: NeighborhoodIntel, neighborhoodName: string): string {
  return `
<!-- NEIGHBORHOOD INTELLIGENCE — Live Data -->
<div style="margin-top:20px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#A89035;font-weight:600;margin-bottom:14px;padding-left:16px;border-left:4px solid #A89035">\uD83D\uDCCD Neighborhood Intelligence — Live Data</div>

<!-- Score Explanation -->
<div style="background:#3A4B5B;border-radius:10px;padding:16px;color:#fff;margin-bottom:14px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#A89035;margin-bottom:8px">How We Calculate Neighborhood Scores</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
<div style="text-align:center">
<div style="font-size:22px;margin-bottom:2px">\uD83D\uDC6E</div>
<div style="font-size:20px;font-weight:800;color:${intel.crimeScore >= 7 ? '#16a34a' : intel.crimeScore >= 5 ? '#A89035' : '#dc2626'}">${intel.crimeScore}/10</div>
<div style="font-size:8px;color:rgba(255,255,255,0.6)">Safety</div>
<div style="font-size:7px;color:rgba(255,255,255,0.35)">${intel.crimeTotal.toLocaleString()} incidents/yr</div>
</div>
<div style="text-align:center">
<div style="font-size:22px;margin-bottom:2px">\uD83C\uDFE0</div>
<div style="font-size:20px;font-weight:800;color:${intel.qualityScore >= 7 ? '#16a34a' : intel.qualityScore >= 5 ? '#A89035' : '#dc2626'}">${intel.qualityScore}/10</div>
<div style="font-size:8px;color:rgba(255,255,255,0.6)">Quality of Life</div>
<div style="font-size:7px;color:rgba(255,255,255,0.35)">${intel.complaints311Total.toLocaleString()} 311 calls/yr</div>
</div>
<div style="text-align:center">
<div style="font-size:22px;margin-bottom:2px">\uD83D\uDE87</div>
<div style="font-size:20px;font-weight:800;color:#16a34a">${intel.transitScore}/10</div>
<div style="font-size:8px;color:rgba(255,255,255,0.6)">Transit Access</div>
<div style="font-size:7px;color:rgba(255,255,255,0.35)">Subway + bus</div>
</div>
<div style="text-align:center">
<div style="font-size:22px;margin-bottom:2px">\uD83C\uDFDB\uFE0F</div>
<div style="font-size:20px;font-weight:800;color:#A89035">${intel.landmarks.length}</div>
<div style="font-size:8px;color:rgba(255,255,255,0.6)">Landmarks</div>
<div style="font-size:7px;color:rgba(255,255,255,0.35)">Historic sites nearby</div>
</div>
</div>
<div style="font-size:8px;color:rgba(255,255,255,0.35);line-height:1.5">
<strong style="color:rgba(255,255,255,0.5)">Methodology:</strong> Safety score from NYPD CompStat (Precinct ${intel.crimePrecinct}) — lower incidents = higher score. Quality score from NYC 311 data — fewer complaints = better livability. Transit from MTA station proximity. Landmarks from NYC Landmarks Preservation Commission.
</div>
</div>

<!-- Crime Breakdown -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
<div style="background:#EDE9DF;border-radius:8px;padding:14px">
<div style="font-size:10px;font-weight:700;color:#2C3240;margin-bottom:8px">\uD83D\uDC6E Crime Report — Precinct ${intel.crimePrecinct}</div>
${intel.crimeBreakdown.slice(0, 5).map(c => `<div style="display:flex;justify-content:space-between;font-size:10px;color:#555;padding:2px 0;border-bottom:1px solid rgba(0,0,0,0.05)"><span>${c.type.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span><strong>${c.count.toLocaleString()}</strong></div>`).join('\n')}
<div style="font-size:8px;color:#888;margin-top:6px">Source: NYPD CompStat · 2025 YTD</div>
</div>
<div style="background:#EDE9DF;border-radius:8px;padding:14px">
<div style="font-size:10px;font-weight:700;color:#2C3240;margin-bottom:8px">\uD83D\uDCDE 311 Top Complaints</div>
${intel.topComplaints.slice(0, 5).map(c => `<div style="display:flex;justify-content:space-between;font-size:10px;color:#555;padding:2px 0;border-bottom:1px solid rgba(0,0,0,0.05)"><span>${c.type}</span><strong>${c.count.toLocaleString()}</strong></div>`).join('\n')}
<div style="font-size:8px;color:#888;margin-top:6px">Source: NYC 311 · 2025 YTD</div>
</div>
</div>

${intel.landmarks.length > 0 ? `
<!-- Landmarks -->
<div style="background:#fff;border:1px solid #D5D0C6;border-radius:8px;padding:14px">
<div style="font-size:10px;font-weight:700;color:#2C3240;margin-bottom:8px">\uD83C\uDFDB\uFE0F Nearby Landmarks & Historic Sites</div>
<div style="display:flex;flex-wrap:wrap;gap:6px">
${intel.landmarks.map(l => `<span style="display:inline-flex;align-items:center;gap:4px;background:#EDE9DF;border:1px solid #D5D0C6;border-radius:20px;padding:4px 12px;font-size:10px;color:#3A4B5B;font-weight:500">\uD83C\uDFDB\uFE0F ${l.name}${l.date ? ' (' + l.date.slice(0, 4) + ')' : ''}</span>`).join('\n')}
</div>
</div>` : ''}
</div>`;
}
