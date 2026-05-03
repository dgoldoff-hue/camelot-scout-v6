/**
 * NYC Violation Search — Client-side API for NYC Open Data
 * Pulls HPD, DOB, ECB violations for any address
 */

const BORO_CODES: Record<string, string> = {
  'MANHATTAN': '1', 'MN': '1', 'NEW YORK': '1',
  'BRONX': '2', 'BX': '2',
  'BROOKLYN': '3', 'BK': '3', 'KINGS': '3',
  'QUEENS': '4', 'QN': '4',
  'STATEN ISLAND': '5', 'SI': '5',
};

const NAMED_AVENUE_MAP: Record<string, string> = {
  FIRST: '1',
  SECOND: '2',
  THIRD: '3',
  FOURTH: '4',
  FIFTH: '5',
  SIXTH: '6',
  SEVENTH: '7',
  EIGHTH: '8',
  NINTH: '9',
  TENTH: '10',
  ELEVENTH: '11',
  TWELFTH: '12',
};

const HPD_CLASS_SEVERITY: Record<string, { level: number; label: string; cureDays: number }> = {
  'C': { level: 3, label: 'IMMEDIATELY HAZARDOUS', cureDays: 1 },
  'B': { level: 2, label: 'HAZARDOUS', cureDays: 30 },
  'A': { level: 1, label: 'NON-HAZARDOUS', cureDays: 90 },
};

const PLAYER_MAP: Record<string, string[]> = {
  'LEAD': ['PM', 'Certified Lead Inspector', 'Lead Remediation Contractor', 'Expeditor'],
  'GAS': ['PM', 'Licensed Master Plumber', 'Expeditor'],
  'HEAT': ['PM', 'HVAC Contractor', 'Boiler Technician'],
  'FIRE': ['PM', 'Fire Safety Director', 'Contractor', 'FDNY'],
  'MOLD': ['PM', 'Remediation Contractor'],
  'PEST': ['PM', 'Pest Control'],
  'PLUMB': ['PM', 'Plumber'],
  'ELECT': ['PM', 'Electrician'],
  'DEFAULT_C': ['PM', 'Contractor', 'Expeditor'],
  'DEFAULT_B': ['PM', 'Contractor'],
  'DEFAULT_A': ['PM', 'Superintendent'],
  'DOB': ['Architect', 'Engineer', 'Expeditor'],
  'ECB': ['Attorney', 'Expeditor'],
};

const COST_MAP: Record<string, [number, number]> = {
  'LEAD': [3000, 15000],
  'MOLD': [2000, 10000],
  'PEST': [500, 2500],
  'PLUMB': [1000, 8000],
  'ELECT': [1000, 5000],
  'BOILER': [2000, 15000],
  'HEAT': [2000, 15000],
  'PAINT': [800, 2500],
  'WINDOW': [100, 300],
  'SMOKE': [50, 200],
  'DEFAULT': [1000, 25000],
  'DOB': [3000, 12000],
  'ECB': [1500, 5000],
};

export interface ViolationResult {
  source: string;
  violationClass: string;
  severityLevel: number;
  severityLabel: string;
  violationId: string;
  unit: string;
  description: string;
  status: string;
  isOpen: boolean;
  isOverdue: boolean;
  inspectionDate: string;
  cureDeadline: string | null;
  players: string[];
  costLow: number;
  costHigh: number;
}

export interface ViolationSummary {
  address: string;
  borough: string;
  totalFound: number;
  totalOpen: number;
  hpdOpen: number;
  hpdClassC: number;
  hpdClassB: number;
  hpdClassA: number;
  dobOpen: number;
  ecbOpen: number;
  overdue: number;
  costLow: number;
  costHigh: number;
  players: string[];
  violations: ViolationResult[];
}

async function fetchNYCData(url: string, params: Record<string, string>): Promise<any[]> {
  const query = new URLSearchParams({ ...params, '$limit': '5000' });
  try {
    const resp = await fetch(`${url}?${query}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

function parseAddress(address: string): { houseNum: string; street: string; streetClean: string } {
  let clean = address.toUpperCase().split(',')[0].trim();
  clean = clean.replace(/\bAVE\b/g, 'AVENUE').replace(/\bST\b/g, 'STREET');
  clean = clean.replace(/\bBLVD\b/g, 'BOULEVARD').replace(/\bPL\b/g, 'PLACE').replace(/\bRD\b/g, 'ROAD').replace(/\bDR\b/g, 'DRIVE');
  for (const [word, num] of Object.entries(NAMED_AVENUE_MAP)) {
    clean = clean.replace(new RegExp(`\\b${word}\\s+(AVENUE|AVE)\\b`, 'g'), `${num} AVENUE`);
  }
  clean = clean.replace(/(\d+)\s*(ST|ND|RD|TH)\b/g, '$1');
  clean = clean.replace(/\s+(NEW YORK CITY|NEW YORK|NYC|NY|MANHATTAN|BROOKLYN|QUEENS|BRONX|STATEN ISLAND)\s*$/g, '');
  clean = clean.replace(/\s{2,}/g, ' ').trim();

  const match = clean.match(/\b(\d+[-\d]*)\s+(.+)$/);
  const houseNum = match?.[1] || '';
  const street = (match?.[2] || clean).trim();
  const streetClean = street
    .replace(/\b(STREET|AVENUE|PLACE|ROAD|DRIVE|BOULEVARD|COURT|LANE|TERRACE)\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { houseNum, street, streetClean };
}

function streetLikeClause(field: string, street: string): string {
  const tokens = street
    .replace(/\b(STREET|AVENUE|PLACE|ROAD|DRIVE|BOULEVARD|COURT|LANE|TERRACE)\b/g, '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
  return tokens.map(token => `upper(${field}) like '%${token.replace(/'/g, "''")}%'`).join(' AND ');
}

function getPlayers(desc: string, vClass: string): string[] {
  const d = desc.toUpperCase();
  for (const [key, players] of Object.entries(PLAYER_MAP)) {
    if (key !== 'DEFAULT_C' && key !== 'DEFAULT_B' && key !== 'DEFAULT_A' && key !== 'DOB' && key !== 'ECB' && d.includes(key)) {
      return players;
    }
  }
  if (vClass === 'C') return PLAYER_MAP['DEFAULT_C'];
  if (vClass === 'B') return PLAYER_MAP['DEFAULT_B'];
  return PLAYER_MAP['DEFAULT_A'];
}

function getCost(desc: string, source: string): [number, number] {
  if (source === 'DOB') return COST_MAP['DOB'];
  if (source === 'ECB') return COST_MAP['ECB'];
  const d = desc.toUpperCase();
  for (const [key, cost] of Object.entries(COST_MAP)) {
    if (key !== 'DEFAULT' && key !== 'DOB' && key !== 'ECB' && d.includes(key)) return cost;
  }
  return COST_MAP['DEFAULT'];
}

export async function searchViolations(address: string, borough: string): Promise<ViolationSummary> {
  const boroId = BORO_CODES[borough.toUpperCase()] || borough;
  const { houseNum, street, streetClean } = parseAddress(address);
  const hpdStreetWhere = streetLikeClause('streetname', street);
  const dobStreetWhere = streetLikeClause('street', street);
  const ecbStreetWhere = streetLikeClause('respondent_street', street);

  // Fetch HPD violations
  const hpdData = await fetchNYCData('https://data.cityofnewyork.us/resource/wvxf-dwi5.json', {
    '$where': [
      houseNum ? `housenumber='${houseNum.replace(/'/g, "''")}'` : '',
      `boroid='${boroId}'`,
      hpdStreetWhere,
    ].filter(Boolean).join(' AND '),
  });

  // Fetch DOB violations
  const dobData = await fetchNYCData('https://data.cityofnewyork.us/resource/3h2n-5cm9.json', {
    '$where': [
      houseNum ? `house_number='${houseNum.replace(/'/g, "''")}'` : '',
      `boro='${boroId}'`,
      dobStreetWhere || (streetClean ? `upper(street) like '%${streetClean.replace(/'/g, "''")}%'` : ''),
    ].filter(Boolean).join(' AND '),
  });

  // Fetch ECB violations
  const ecbData = await fetchNYCData('https://data.cityofnewyork.us/resource/6bgk-3dad.json', {
    '$where': [
      houseNum ? `respondent_house_number='${houseNum.replace(/'/g, "''")}'` : '',
      ecbStreetWhere,
    ].filter(Boolean).join(' AND '),
  });

  const now = new Date();
  const violations: ViolationResult[] = [];

  // Process HPD
  for (const v of hpdData) {
    const vClass = (v.violationclass || v.class || '').toUpperCase().trim();
    const status = (v.violationstatus || v.currentstatus || '').toUpperCase();
    const isOpen = ['OPEN', 'NOTICE SENT', 'CIV PENALTY', ''].includes(status) || !status.includes('CLOSE');
    const severity = HPD_CLASS_SEVERITY[vClass] || { level: 0, label: 'UNKNOWN', cureDays: 30 };
    const desc = v.novdescription || v.violationdescription || '';
    const inspDate = v.inspectiondate || v.novissueddate || '';

    let cureDeadline: string | null = null;
    let isOverdue = false;
    if (inspDate) {
      try {
        const d = new Date(inspDate);
        const deadline = new Date(d.getTime() + severity.cureDays * 86400000);
        cureDeadline = deadline.toISOString().split('T')[0];
        isOverdue = deadline < now;
      } catch { /* ignore */ }
    }

    violations.push({
      source: 'HPD',
      violationClass: vClass,
      severityLevel: severity.level,
      severityLabel: severity.label,
      violationId: v.violationid || v.novid || '',
      unit: v.apartment || 'Building',
      description: desc,
      status: isOpen ? 'OPEN' : status,
      isOpen,
      isOverdue: isOpen && isOverdue,
      inspectionDate: inspDate,
      cureDeadline,
      players: getPlayers(desc, vClass),
      ...(() => { const c = getCost(desc, 'HPD'); return { costLow: c[0], costHigh: c[1] }; })(),
    });
  }

  // Process DOB
  for (const v of dobData) {
    const category = (v.violation_category || '').toUpperCase();
    const isOpen = category.includes('ACTIVE') || (!category.includes('DISMISS') && !category.includes('RESOLVE') && !category.includes('V*'));
    const desc = v.violation_type || '';

    violations.push({
      source: 'DOB',
      violationClass: 'DOB',
      severityLevel: 2,
      severityLabel: 'DOB VIOLATION',
      violationId: v.isn_dob_bis_viol || v.violation_number || '',
      unit: 'Building',
      description: desc,
      status: isOpen ? 'ACTIVE' : 'DISMISSED',
      isOpen,
      isOverdue: false,
      inspectionDate: v.issue_date || '',
      cureDeadline: null,
      players: PLAYER_MAP['DOB'],
      costLow: COST_MAP['DOB'][0],
      costHigh: COST_MAP['DOB'][1],
    });
  }

  // Process ECB
  for (const v of ecbData) {
    const status = (v.violation_status || v.status || '').toUpperCase();
    const isOpen = !status.includes('RESOLVE') && !status.includes('DISMISS') && !status.includes('PAID');

    violations.push({
      source: 'ECB',
      violationClass: 'ECB',
      severityLevel: 2,
      severityLabel: 'ECB PENALTY',
      violationId: v.ecb_violation_number || v.isn_dob_bis_viol || '',
      unit: 'Building',
      description: v.violation_description || v.infraction_codes || '',
      status: isOpen ? 'OPEN' : status,
      isOpen,
      isOverdue: isOpen,
      inspectionDate: v.violation_date || '',
      cureDeadline: null,
      players: PLAYER_MAP['ECB'],
      costLow: COST_MAP['ECB'][0],
      costHigh: COST_MAP['ECB'][1],
    });
  }

  // Sort: open first, then by severity desc
  violations.sort((a, b) => {
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    return b.severityLevel - a.severityLevel;
  });

  const openViolations = violations.filter(v => v.isOpen);
  const hpdOpen = openViolations.filter(v => v.source === 'HPD');
  const allPlayers = new Set<string>();
  openViolations.forEach(v => v.players.forEach(p => allPlayers.add(p)));

  return {
    address,
    borough: borough.toUpperCase(),
    totalFound: violations.length,
    totalOpen: openViolations.length,
    hpdOpen: hpdOpen.length,
    hpdClassC: hpdOpen.filter(v => v.violationClass === 'C').length,
    hpdClassB: hpdOpen.filter(v => v.violationClass === 'B').length,
    hpdClassA: hpdOpen.filter(v => v.violationClass === 'A').length,
    dobOpen: openViolations.filter(v => v.source === 'DOB').length,
    ecbOpen: openViolations.filter(v => v.source === 'ECB').length,
    overdue: openViolations.filter(v => v.isOverdue).length,
    costLow: openViolations.reduce((s, v) => s + v.costLow, 0),
    costHigh: openViolations.reduce((s, v) => s + v.costHigh, 0),
    players: Array.from(allPlayers).sort(),
    violations,
  };
}
