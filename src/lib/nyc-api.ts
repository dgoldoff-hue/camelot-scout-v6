/**
 * NYC Open Data API Integration
 * All endpoints are free and require no API key.
 */

import type { HPDViolation, DOFProperty, DOBPermit, LL97Energy, ACRISRecord, ACRISParty, ACRISData } from '@/types';
import { detectBuildingOperations } from '@/lib/building-ops';
import {
  fetchECBViolations, fetchHousingLitigation, fetchRentStabilization,
  totalECBPenaltyBalance, hasActiveLitigation, isRentStabilized,
  type ECBViolation, type HousingLitigation, type RentStabilization,
} from '@/lib/gov-apis';

const NYC_BASE = 'https://data.cityofnewyork.us/resource';

// Endpoints
const ENDPOINTS = {
  hpdViolations: `${NYC_BASE}/wvxf-dwi5.json`,
  hpdRegistration: `${NYC_BASE}/tesw-yqqr.json`,
  dobPermits: `${NYC_BASE}/ipu4-2vj7.json`,
  dofProperty: `${NYC_BASE}/64uk-42ks.json`,
  ll97Energy: `${NYC_BASE}/7x5e-2fxh.json`,
  acrisLegals: `${NYC_BASE}/8h5j-fqxa.json`,
  acrisMaster: `${NYC_BASE}/bnx9-e6tj.json`,
  acrisParties: `${NYC_BASE}/636b-3b5g.json`,
};

// Borough name → code mapping for NYC APIs
const BOROUGH_CODES: Record<string, string> = {
  manhattan: '1',
  bronx: '2',
  brooklyn: '3',
  queens: '4',
  'staten island': '5',
};

// ---- Named-number avenue mapping ----
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

/**
 * Strip ordinal suffixes: "79TH" → "79", "1ST" → "1", "2ND" → "2", "3RD" → "3", "21ST" → "21"
 */
function stripOrdinal(word: string): string {
  return word.replace(/(\d+)\s*(ST|ND|RD|TH)\b/gi, '$1');
}

/**
 * Normalize an address for API queries.
 *
 * NYC Open Data stores addresses in various formats:
 *   HPD:  "EAST  79 STREET" (no ordinal, sometimes double-spaces)
 *   DOF:  "301 EAST 79 STREET" or composite address field
 *   DOB:  "EAST 79 STREET" in street_name, house number separate
 *
 * This function produces a normalized form suitable for building
 * flexible LIKE queries rather than exact matches.
 */
function normalizeAddress(address: string): string {
  let norm = address.toUpperCase().trim();

  // Expand common abbreviations
  norm = norm.replace(/\bAVE\b/g, 'AVENUE');
  norm = norm.replace(/\bST\b/g, 'STREET');
  norm = norm.replace(/\bBLVD\b/g, 'BOULEVARD');
  norm = norm.replace(/\bPL\b/g, 'PLACE');
  norm = norm.replace(/\bDR\b/g, 'DRIVE');
  norm = norm.replace(/\bRD\b/g, 'ROAD');
  norm = norm.replace(/\bCT\b/g, 'COURT');
  norm = norm.replace(/\bLN\b/g, 'LANE');

  // Convert named avenues: "FIFTH AVENUE" → "5 AVENUE"
  for (const [word, num] of Object.entries(NAMED_AVENUE_MAP)) {
    norm = norm.replace(new RegExp(`\\b${word}\\s+(AVENUE|AVE)\\b`, 'g'), `${num} AVENUE`);
  }

  // Strip ordinal suffixes: "79TH" → "79", "1ST" → "1" etc.
  norm = stripOrdinal(norm);

  // Remove street type suffixes — we'll search without them for broader matching
  // Keep them in the normalized form but they'll be stripped when building search keys
  // Collapse multiple spaces
  norm = norm.replace(/\s{2,}/g, ' ').trim();

  return norm;
}

/**
 * Parse an address into number and street components.
 * The street portion has ordinals stripped and named avenues converted.
 */
function parseAddress(address: string): { number: string; street: string } {
  const normalized = normalizeAddress(address);
  const match = normalized.match(/^(\d+[-\d]*)\s+(.+?)(?:\s*,.*)?$/);
  if (match) {
    return { number: match[1], street: match[2] };
  }
  return { number: '', street: normalized };
}

/**
 * Build the key search tokens from a street name for LIKE queries.
 * Strips street-type suffixes (STREET, AVENUE, etc.) and returns
 * the essential words that NYC databases are most likely to contain.
 *
 * "EAST 79 STREET" → ["EAST", "79"]
 * "5 AVENUE"       → ["5", "AVENUE"]   (keep AVENUE for numbered avenues)
 * "PARK AVENUE"    → ["PARK", "AVENUE"]
 */
function streetSearchTokens(street: string): string[] {
  const STREET_SUFFIXES = ['STREET', 'BOULEVARD', 'PLACE', 'DRIVE', 'ROAD', 'COURT', 'LANE', 'TERRACE', 'WAY'];
  const words = street.split(/\s+/).filter(Boolean);

  // For numbered avenues like "5 AVENUE", keep AVENUE since it's meaningful
  // For directional + number + STREET patterns, drop STREET
  const isNumberedAvenue = words.length === 2 && /^\d+$/.test(words[0]) && words[1] === 'AVENUE';
  if (isNumberedAvenue) return words;

  // Drop trailing street-type suffix
  const filtered = words.filter((w) => !STREET_SUFFIXES.includes(w));
  return filtered.length > 0 ? filtered : words;
}

/**
 * Build a flexible LIKE pattern from tokens for Socrata $where queries.
 * Joins tokens with '%' wildcards so "EAST 79" becomes "%EAST%79%".
 * This handles double spaces and varied formatting in NYC data.
 */
function buildLikePattern(tokens: string[]): string {
  return '%' + tokens.join('%') + '%';
}

/**
 * Fetch HPD Violations for an address.
 * Uses flexible LIKE matching to handle HPD's formatting (double spaces, no ordinals).
 */
export async function fetchHPDViolations(address: string, borough?: string): Promise<HPDViolation[]> {
  try {
    const { number, street } = parseAddress(address);
    const tokens = streetSearchTokens(street);
    const pattern = buildLikePattern(tokens);

    let where = `upper(streetname) like '${encodeURIComponent(pattern)}'`;
    if (number) {
      where += ` AND housenumber='${number}'`;
    }
    if (borough) {
      const code = BOROUGH_CODES[borough.toLowerCase()];
      if (code) where += ` AND boroid='${code}'`;
    }

    let url = `${ENDPOINTS.hpdViolations}?$limit=200&$where=${where}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD API error: ${res.status}`);
    const results: HPDViolation[] = await res.json();

    // Fallback: if no results and we have a number, try broader match with just the number
    if (results.length === 0 && number && tokens.length > 1) {
      const fallbackWhere = `housenumber='${number}' AND upper(streetname) like '%25${encodeURIComponent(tokens[tokens.length - 1])}%25'`;
      const fallbackUrl = `${ENDPOINTS.hpdViolations}?$limit=200&$where=${fallbackWhere}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    return results;
  } catch (err) {
    console.error('HPD Violations fetch error:', err);
    return [];
  }
}

/**
 * Fetch HPD Building Registration (owner, management company)
 */
export async function fetchHPDRegistration(address: string, borough?: string): Promise<any[]> {
  try {
    const { number, street } = parseAddress(address);
    const tokens = streetSearchTokens(street);
    const pattern = buildLikePattern(tokens);

    let where = `upper(streetname) like '${encodeURIComponent(pattern)}'`;
    if (number) {
      where += ` AND housenumber='${number}'`;
    }
    if (borough) {
      const code = BOROUGH_CODES[borough.toLowerCase()];
      if (code) where += ` AND boroid='${code}'`;
    }

    let url = `${ENDPOINTS.hpdRegistration}?$limit=50&$where=${where}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD Registration API error: ${res.status}`);
    const results = await res.json();

    // Fallback with just the number + last token
    if (results.length === 0 && number && tokens.length > 1) {
      const fallbackWhere = `housenumber='${number}' AND upper(streetname) like '%25${encodeURIComponent(tokens[tokens.length - 1])}%25'`;
      const fallbackUrl = `${ENDPOINTS.hpdRegistration}?$limit=50&$where=${fallbackWhere}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) return await fallbackRes.json();
    }

    return results;
  } catch (err) {
    console.error('HPD Registration fetch error:', err);
    return [];
  }
}

/**
 * Fetch DOF Property Assessment (PLUTO data).
 * DOF/PLUTO stores addresses in a single "address" field with varying formats.
 * We try multiple strategies: full pattern, then number + key tokens, then just number.
 */
export async function fetchDOFProperty(address: string, borough?: string): Promise<DOFProperty[]> {
  try {
    const { number, street } = parseAddress(address);
    const tokens = streetSearchTokens(street);

    // Strategy 1: broad LIKE with number + key tokens → "%301%EAST%79%"
    let pattern: string;
    if (number) {
      pattern = buildLikePattern([number, ...tokens]);
    } else {
      pattern = buildLikePattern(tokens);
    }

    let where = `upper(address) like '${encodeURIComponent(pattern)}'`;
    if (borough) {
      where += ` AND upper(borough)='${borough.toUpperCase()}'`;
    }

    let url = `${ENDPOINTS.dofProperty}?$limit=10&$where=${where}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DOF API error: ${res.status}`);
    const results: DOFProperty[] = await res.json();

    if (results.length > 0) return results;

    // Strategy 2: just number + street number (for "301 ... 79 ...")
    if (number && tokens.length > 0) {
      // Find numeric tokens in the street part (e.g. "79" from "EAST 79")
      const numericTokens = tokens.filter((t) => /^\d+$/.test(t));
      if (numericTokens.length > 0) {
        const fallbackPattern = buildLikePattern([number, ...numericTokens]);
        let fallbackWhere = `upper(address) like '${encodeURIComponent(fallbackPattern)}'`;
        if (borough) fallbackWhere += ` AND upper(borough)='${borough.toUpperCase()}'`;
        const fb = await fetch(`${ENDPOINTS.dofProperty}?$limit=10&$where=${fallbackWhere}`);
        if (fb.ok) {
          const fbResults: DOFProperty[] = await fb.json();
          if (fbResults.length > 0) return fbResults;
        }
      }
    }

    return results;
  } catch (err) {
    console.error('DOF Property fetch error:', err);
    return [];
  }
}

/**
 * Fetch DOB Permits.
 * DOB stores house number in "house__" and street name in "street_name".
 */
export async function fetchDOBPermits(address: string, borough?: string): Promise<DOBPermit[]> {
  try {
    const { number, street } = parseAddress(address);
    const tokens = streetSearchTokens(street);
    const pattern = buildLikePattern(tokens);

    let where = '';
    if (number) {
      where = `upper(house__) like '%25${encodeURIComponent(number)}%25'`;
      where += ` AND upper(street_name) like '${encodeURIComponent(pattern)}'`;
    } else {
      where = `upper(street_name) like '${encodeURIComponent(pattern)}'`;
    }

    let url = `${ENDPOINTS.dobPermits}?$limit=50&$order=filing_date DESC&$where=${where}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`DOB API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('DOB Permits fetch error:', err);
    return [];
  }
}

/**
 * Fetch LL97 Energy Benchmarking Data
 */
export async function fetchLL97Energy(address: string): Promise<LL97Energy[]> {
  try {
    const { number, street } = parseAddress(address);
    const tokens = streetSearchTokens(street);

    let pattern: string;
    if (number) {
      pattern = buildLikePattern([number, ...tokens]);
    } else {
      pattern = buildLikePattern(tokens);
    }

    let url = `${ENDPOINTS.ll97Energy}?$limit=10&$where=upper(address_1) like '${encodeURIComponent(pattern)}'`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`LL97 API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('LL97 Energy fetch error:', err);
    return [];
  }
}

// ---- ACRIS helpers ----

const ACRIS_DOC_TYPES: Record<string, string> = {
  DEED: 'Deed Transfer',
  MTGE: 'Mortgage',
  AGMT: 'Agreement',
  ASST: 'Assignment of Mortgage',
  SAT: 'Satisfaction of Mortgage',
  RPTT: 'Real Property Transfer Tax',
  'AL&R': 'Assignment of Lease & Rents',
  CORRM: 'Correction Mortgage',
  CORRD: 'Correction Deed',
};

const ACRIS_RELEVANT_TYPES = ['DEED', 'MTGE', 'AGMT', 'ASST', 'SAT'];

/**
 * Parse a BBL string into borough, block, lot components
 */
export function parseBBL(bbl: string): { borough: string; block: string; lot: string } | null {
  if (!bbl || bbl.length < 10) return null;
  const clean = bbl.replace(/\D/g, '');
  if (clean.length < 10) return null;
  return {
    borough: clean.substring(0, 1),
    block: clean.substring(1, 6),
    lot: clean.substring(6, 10),
  };
}

/**
 * Fetch ACRIS deed/transfer/mortgage records for a BBL.
 * 1. Query Legals by BBL → get document_ids
 * 2. Query Master for those document_ids (filtered to relevant types)
 * 3. Query Parties for those document_ids
 * 4. Combine into clean ACRISRecord[]
 */
export async function fetchACRISRecords(borough: string, block: string, lot: string): Promise<ACRISData> {
  const acrisUrl = `https://a836-acris.nyc.gov/DS/DocumentSearch/BBLResult?Borough=${borough}&Block=${block.padStart(5, '0')}&Lot=${lot.padStart(4, '0')}`;

  try {
    // 10-year lookback
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const dateStr = tenYearsAgo.toISOString().split('T')[0];

    // Step 1: Query Legals by BBL
    const legalsWhere = `borough='${borough}' AND block='${block}' AND lot='${lot}'`;
    const legalsUrl = `${ENDPOINTS.acrisLegals}?$limit=500&$where=${encodeURIComponent(legalsWhere)}`;
    const legalsRes = await fetch(legalsUrl);
    if (!legalsRes.ok) throw new Error(`ACRIS Legals API error: ${legalsRes.status}`);
    const legals: any[] = await legalsRes.json();

    if (legals.length === 0) {
      return { records: [], deeds: [], mortgages: [], acrisUrl, borough, block, lot };
    }

    // Get unique document_ids
    const docIds = [...new Set(legals.map((l: any) => l.document_id).filter(Boolean))];
    if (docIds.length === 0) {
      return { records: [], deeds: [], mortgages: [], acrisUrl, borough, block, lot };
    }

    // Step 2 & 3: Query Master + Parties in parallel, batching document IDs
    // Socrata has URL length limits, so batch in groups of 30
    const batchSize = 30;
    const batches: string[][] = [];
    for (let i = 0; i < docIds.length; i += batchSize) {
      batches.push(docIds.slice(i, i + batchSize));
    }

    const allMaster: any[] = [];
    const allParties: any[] = [];

    // Process batches (parallelize master + parties within each batch)
    for (const batch of batches) {
      const docIdFilter = batch.map((id) => `document_id='${id}'`).join(' OR ');
      const typeFilter = ACRIS_RELEVANT_TYPES.map((t) => `doc_type='${t}'`).join(' OR ');
      const masterWhere = `(${docIdFilter}) AND (${typeFilter}) AND document_date >= '${dateStr}'`;
      const partiesWhere = docIdFilter;

      const [masterRes, partiesRes] = await Promise.all([
        fetch(`${ENDPOINTS.acrisMaster}?$limit=500&$where=${encodeURIComponent(masterWhere)}`).then((r) =>
          r.ok ? r.json() : []
        ).catch(() => []),
        fetch(`${ENDPOINTS.acrisParties}?$limit=1000&$where=${encodeURIComponent(partiesWhere)}`).then((r) =>
          r.ok ? r.json() : []
        ).catch(() => []),
      ]);

      allMaster.push(...masterRes);
      allParties.push(...partiesRes);
    }

    // Step 4: Build party map (document_id → parties)
    const partyMap = new Map<string, ACRISParty[]>();
    for (const p of allParties) {
      const docId = p.document_id;
      if (!partyMap.has(docId)) partyMap.set(docId, []);
      const partyType: 'buyer' | 'seller' = p.party_type === '1' ? 'buyer' : 'seller';
      const addr = [p.address_1, p.city, p.state, p.zip].filter(Boolean).join(', ') || undefined;
      partyMap.get(docId)!.push({
        type: partyType,
        name: p.name || 'Unknown',
        address: addr,
      });
    }

    // Step 5: Combine master + parties into ACRISRecord[]
    const records: ACRISRecord[] = allMaster
      .map((m: any) => ({
        documentId: m.document_id,
        documentType: m.doc_type,
        documentTypeLabel: ACRIS_DOC_TYPES[m.doc_type] || m.doc_type,
        date: m.document_date || '',
        amount: parseFloat(m.document_amt) || 0,
        recordedDate: m.recorded_datetime || undefined,
        parties: partyMap.get(m.document_id) || [],
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Separate deeds and mortgages
    const deeds = records.filter((r) => r.documentType === 'DEED');
    const mortgages = records.filter((r) => ['MTGE', 'ASST', 'SAT'].includes(r.documentType));

    // Last sale info
    const lastDeed = deeds[0];
    const lastSaleDate = lastDeed?.date;
    const lastSalePrice = lastDeed?.amount || 0;
    const lastSaleBuyer = lastDeed?.parties.find((p) => p.type === 'buyer')?.name;
    const lastSaleSeller = lastDeed?.parties.find((p) => p.type === 'seller')?.name;

    return {
      records,
      deeds,
      mortgages,
      lastSaleDate,
      lastSalePrice,
      lastSaleBuyer,
      lastSaleSeller,
      acrisUrl,
      borough,
      block,
      lot,
    };
  } catch (err) {
    console.error('ACRIS fetch error:', err);
    return { records: [], deeds: [], mortgages: [], acrisUrl, borough, block, lot };
  }
}

/**
 * Fetch ALL NYC data for a building (combined)
 */
export async function fetchFullBuildingReport(address: string, borough?: string) {
  const [violations, registration, dofData, permits, energy] = await Promise.all([
    fetchHPDViolations(address, borough),
    fetchHPDRegistration(address, borough),
    fetchDOFProperty(address, borough),
    fetchDOBPermits(address, borough),
    fetchLL97Energy(address),
  ]);

  // Extract key data from DOF
  const dof = dofData[0];

  // Extract registration info
  const reg = registration[0];

  // Calculate violation stats
  const openViolations = violations.filter(
    (v) => v.currentstatus !== 'CLOSE' && v.violationstatus !== 'Close'
  );

  // Fetch ACRIS + new gov APIs if we have a BBL
  let acris: ACRISData | null = null;
  let ecbViolations: ECBViolation[] = [];
  let housingLitigation: HousingLitigation[] = [];
  let rentStabilization: RentStabilization[] = [];

  if (dof?.bbl) {
    const bblParts = parseBBL(dof.bbl);
    if (bblParts) {
      // Parse address for litigation query
      const parsedAddr = parseAddress(address);
      const boroCode = bblParts.borough;

      // Fetch ACRIS, ECB, Litigation, and Rent Stabilization in parallel
      const [acrisResult, ecbResult, litigationResult, rentStabResult] = await Promise.all([
        fetchACRISRecords(bblParts.borough, bblParts.block, bblParts.lot).catch((err) => {
          console.error('ACRIS fetch in report failed:', err);
          return null;
        }),
        fetchECBViolations(bblParts.borough, bblParts.block, bblParts.lot).catch((err) => {
          console.error('ECB fetch in report failed:', err);
          return [] as ECBViolation[];
        }),
        parsedAddr.number
          ? fetchHousingLitigation(boroCode, parsedAddr.number, parsedAddr.street).catch((err) => {
              console.error('Litigation fetch in report failed:', err);
              return [] as HousingLitigation[];
            })
          : Promise.resolve([] as HousingLitigation[]),
        fetchRentStabilization(bblParts.borough, bblParts.block, bblParts.lot).catch((err) => {
          console.error('Rent stabilization fetch in report failed:', err);
          return [] as RentStabilization[];
        }),
      ]);

      acris = acrisResult;
      ecbViolations = ecbResult;
      housingLitigation = litigationResult;
      rentStabilization = rentStabResult;
    }
  }

  return {
    violations: {
      total: violations.length,
      open: openViolations.length,
      items: violations.slice(0, 50), // Limit for display
      lastDate: violations[0]?.inspectiondate,
    },
    registration: {
      owner: reg?.ownerfirstname
        ? `${reg.ownerfirstname} ${reg.ownerlastname}`
        : reg?.corporationname || null,
      managementCompany: reg?.managementcompany || null,
      registrationId: reg?.registrationid || null,
      buildingId: reg?.buildingid || null,
    },
    dof: dof
      ? {
          bbl: dof.bbl,
          owner: dof.owner,
          marketValue: parseFloat(dof.fullval) || 0,
          assessedValue: parseFloat(dof.avtot) || 0,
          landValue: parseFloat(dof.avland) || 0,
          yearBuilt: parseInt(dof.yearbuilt) || 0,
          units: parseInt(dof.unitsres) || parseInt(dof.unitstotal) || 0,
          lotArea: parseFloat(dof.lotarea) || 0,
          buildingArea: parseFloat(dof.bldgarea) || 0,
          stories: parseInt(dof.numfloors) || 0,
          buildingClass: dof.bldgcl,
          taxClass: dof.taxclass,
        }
      : null,
    permits: {
      count: permits.length,
      items: permits.slice(0, 20),
      hasRecent: permits.some((p) => {
        const date = new Date(p.filing_date);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return date > twoYearsAgo;
      }),
    },
    energy: energy[0]
      ? {
          energyStarScore: parseInt(energy[0].energy_star_score) || null,
          siteEUI: parseFloat(energy[0].site_eui_kbtu_ft) || null,
          ghgEmissions: parseFloat(energy[0].total_ghg_emissions_metric_tons_co2e) || null,
          occupancy: energy[0].occupancy,
          propertyName: energy[0].property_name,
        }
      : null,
    acris,
    ecb: {
      violations: ecbViolations,
      count: ecbViolations.length,
      totalPenaltyBalance: totalECBPenaltyBalance(ecbViolations),
    },
    litigation: {
      cases: housingLitigation,
      count: housingLitigation.length,
      hasActive: hasActiveLitigation(housingLitigation),
    },
    rentStabilization: {
      data: rentStabilization,
      isStabilized: isRentStabilized(rentStabilization),
    },
    buildingOps: detectBuildingOperations(
      dof?.bldgcl,
      parseInt(dof?.unitsres || dof?.unitstotal || '0') || 0,
    ),
  };
}

/**
 * Search HPD Building Registration by owner name
 */
export async function searchByOwnerName(name: string): Promise<any[]> {
  try {
    const upperName = name.toUpperCase().replace(/'/g, "''");
    const parts = upperName.split(/\s+/).filter(Boolean);
    
    // Use HPD Registration Contacts dataset (has owner/agent names)
    const contactsEndpoint = `${NYC_BASE}/feu5-w2e2.json`;
    
    // Build query — search firstname, lastname, and corporationname
    let whereClause: string;
    if (parts.length >= 2) {
      // "David Goldoff" → search first AND last, OR as corporation
      whereClause = `(upper(firstname) like '%25${encodeURIComponent(parts[0])}%25' AND upper(lastname) like '%25${encodeURIComponent(parts[1])}%25') OR upper(corporationname) like '%25${encodeURIComponent(upperName)}%25'`;
    } else {
      // Single word — search last name and corporation
      whereClause = `upper(lastname) like '%25${encodeURIComponent(parts[0])}%25' OR upper(corporationname) like '%25${encodeURIComponent(parts[0])}%25'`;
    }
    
    const url = `${contactsEndpoint}?$limit=200&$where=${whereClause}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD Contacts API error: ${res.status}`);
    const contacts = await res.json();
    
    if (contacts.length === 0) return [];
    
    // Get unique registration IDs
    const regIds = [...new Set(contacts.map((c: any) => c.registrationid))] as string[];
    const limitedRegIds = regIds.slice(0, 50);
    
    // Fetch building info for each registration
    const regQuery = limitedRegIds.map((id) => `registrationid='${id}'`).join(' OR ');
    const buildingsUrl = `${ENDPOINTS.hpdRegistration}?$limit=200&$where=${encodeURIComponent(regQuery)}`;
    const buildingsRes = await fetch(buildingsUrl);
    const buildings = buildingsRes.ok ? await buildingsRes.json() : [];
    
    // Map registration IDs to contact info
    const contactMap = new Map<string, any>();
    for (const c of contacts) {
      if (!contactMap.has(c.registrationid)) {
        contactMap.set(c.registrationid, c);
      }
    }
    
    // Merge building + contact data, deduplicate by address
    const seen = new Set<string>();
    const results: any[] = [];
    for (const b of buildings) {
      const addr = `${b.housenumber} ${b.streetname}`.trim();
      if (seen.has(addr)) continue;
      seen.add(addr);
      const contact = contactMap.get(b.registrationid);
      results.push({
        ...b,
        address: addr,
        ownerName: contact ? `${contact.firstname || ''} ${contact.lastname || ''}`.trim() : '',
        corporationName: contact?.corporationname || '',
        contactType: contact?.type || '',
        managementCompany: contact?.corporationname || '',
      });
    }
    
    return results;
  } catch (err) {
    console.error('Owner name search error:', err);
    return [];
  }
}

/**
 * Search by address + unit number for unit-specific data
 * Returns enriched building context alongside unit-specific violations
 */
export async function searchByUnit(address: string, unit: string): Promise<any> {
  try {
    const { number, street } = parseAddress(address);
    const upperUnit = unit.toUpperCase().replace(/'/g, "''");

    // HPD Violations for this specific unit
    const tokens = streetSearchTokens(street);
    const pattern = buildLikePattern(tokens);
    let violationsUrl = `${ENDPOINTS.hpdViolations}?$limit=200`;
    if (number) {
      violationsUrl += `&$where=upper(apartment)='${encodeURIComponent(upperUnit)}'`;
      violationsUrl += ` AND housenumber='${number}'`;
      violationsUrl += ` AND upper(streetname) like '${encodeURIComponent(pattern)}'`;
    }

    // Fetch unit violations, building DOF data, and registration in parallel
    const [violationsRes, dofData, regData] = await Promise.all([
      fetch(violationsUrl).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchDOFProperty(address),
      fetchHPDRegistration(address),
    ]);

    const violations: HPDViolation[] = violationsRes;
    const openViolations = violations.filter(
      (v) => v.currentstatus !== 'CLOSE' && v.violationstatus !== 'Close'
    );

    const dof = dofData[0];
    const reg = regData[0];

    // Determine building type from building class
    const bldgClass = dof?.bldgcl || '';
    const isCondo = bldgClass.startsWith('R') || bldgClass === 'R4' || bldgClass === 'R9';
    const isCoop = bldgClass === 'D4' || bldgClass === 'D0' || bldgClass.startsWith('D');

    return {
      unit: upperUnit,
      address,
      violations: {
        total: violations.length,
        open: openViolations.length,
        items: violations.slice(0, 50),
        lastDate: violations[0]?.inspectiondate,
      },
      dof: dof
        ? {
            bbl: dof.bbl,
            owner: dof.owner,
            marketValue: parseFloat(dof.fullval) || 0,
            assessedValue: parseFloat(dof.avtot) || 0,
            landValue: parseFloat(dof.avland) || 0,
            yearBuilt: parseInt(dof.yearbuilt) || 0,
            units: parseInt(dof.unitsres) || parseInt(dof.unitstotal) || 0,
            stories: parseInt(dof.numfloors) || 0,
            lotArea: parseFloat(dof.lotarea) || 0,
            buildingArea: parseFloat(dof.bldgarea) || 0,
            buildingClass: dof.bldgcl,
            taxClass: dof.taxclass,
          }
        : null,
      registration: reg
        ? {
            owner: reg.corporationname
              || `${reg.ownerfirstname || ''} ${reg.ownerlastname || ''}`.trim()
              || null,
            managementCompany: reg.managementcompany || null,
          }
        : null,
      buildingType: isCondo ? 'condo' : isCoop ? 'co-op' : 'rental',
      isCondo,
      isCoop,
    };
  } catch (err) {
    console.error('Unit search error:', err);
    return {
      unit, address,
      violations: { total: 0, open: 0, items: [] },
      dof: null, registration: null,
      buildingType: 'unknown', isCondo: false, isCoop: false,
    };
  }
}

/**
 * Search buildings by region using NYC Open Data
 * This searches PLUTO for buildings matching criteria
 */
export async function searchBuildingsByRegion(params: {
  borough?: string;
  minUnits?: number;
  maxUnits?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  buildingClass?: string;
  limit?: number;
}): Promise<DOFProperty[]> {
  try {
    const limit = params.limit || 100;
    let where: string[] = [];

    if (params.borough) {
      where.push(`upper(borough)='${params.borough.toUpperCase()}'`);
    }
    if (params.minUnits) {
      where.push(`unitsres >= '${params.minUnits}'`);
    }
    if (params.maxUnits) {
      where.push(`unitsres <= '${params.maxUnits}'`);
    }
    if (params.yearBuiltMin) {
      where.push(`yearbuilt >= '${params.yearBuiltMin}'`);
    }
    if (params.yearBuiltMax) {
      where.push(`yearbuilt <= '${params.yearBuiltMax}'`);
    }

    let url = `${ENDPOINTS.dofProperty}?$limit=${limit}&$order=fullval DESC`;
    if (where.length) {
      url += `&$where=${where.join(' AND ')}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Search API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Building search error:', err);
    return [];
  }
}
