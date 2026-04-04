/**
 * NYC Open Data API Integration
 * All endpoints are free and require no API key.
 */

import type { HPDViolation, DOFProperty, DOBPermit, LL97Energy } from '@/types';

const NYC_BASE = 'https://data.cityofnewyork.us/resource';

// Endpoints
const ENDPOINTS = {
  hpdViolations: `${NYC_BASE}/wvxf-dwi5.json`,
  hpdRegistration: `${NYC_BASE}/tesw-yqqr.json`,
  dobPermits: `${NYC_BASE}/ipu4-2vj7.json`,
  dofProperty: `${NYC_BASE}/64uk-42ks.json`,
  ll97Energy: `${NYC_BASE}/7x5e-2fxh.json`,
};

// Borough name → code mapping for NYC APIs
const BOROUGH_CODES: Record<string, string> = {
  manhattan: '1',
  bronx: '2',
  brooklyn: '3',
  queens: '4',
  'staten island': '5',
};

/**
 * Normalize an address for API queries
 */
function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/\bAVE\b/, 'AVENUE')
    .replace(/\bST\b/, 'STREET')
    .replace(/\bBLVD\b/, 'BOULEVARD')
    .replace(/\bPL\b/, 'PLACE')
    .replace(/\bDR\b/, 'DRIVE')
    .replace(/\bRD\b/, 'ROAD')
    .trim();
}

/**
 * Parse an address into number and street
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
 * Fetch HPD Violations for an address
 */
export async function fetchHPDViolations(address: string, borough?: string): Promise<HPDViolation[]> {
  try {
    const { number, street } = parseAddress(address);
    let url = `${ENDPOINTS.hpdViolations}?$limit=200`;

    if (number) {
      url += `&$where=upper(streetname) like '%25${encodeURIComponent(street.split(' ').slice(0, 2).join(' '))}%25'`;
      url += ` AND housenumber='${number}'`;
    } else {
      url += `&$where=upper(streetname) like '%25${encodeURIComponent(street)}%25'`;
    }

    if (borough) {
      const code = BOROUGH_CODES[borough.toLowerCase()];
      if (code) url += ` AND boroid='${code}'`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD API error: ${res.status}`);
    return await res.json();
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
    let url = `${ENDPOINTS.hpdRegistration}?$limit=50`;

    if (number) {
      url += `&$where=upper(streetname) like '%25${encodeURIComponent(street.split(' ').slice(0, 2).join(' '))}%25'`;
      url += ` AND housenumber='${number}'`;
    } else {
      url += `&$where=upper(streetname) like '%25${encodeURIComponent(street)}%25'`;
    }

    if (borough) {
      const code = BOROUGH_CODES[borough.toLowerCase()];
      if (code) url += ` AND boroid='${code}'`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD Registration API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('HPD Registration fetch error:', err);
    return [];
  }
}

/**
 * Fetch DOF Property Assessment (PLUTO data)
 */
export async function fetchDOFProperty(address: string, borough?: string): Promise<DOFProperty[]> {
  try {
    const { number, street } = parseAddress(address);
    let url = `${ENDPOINTS.dofProperty}?$limit=10`;

    if (number && street) {
      url += `&$where=upper(address) like '%25${encodeURIComponent(number + ' ' + street.split(' ').slice(0, 2).join(' '))}%25'`;
    } else {
      url += `&$where=upper(address) like '%25${encodeURIComponent(street)}%25'`;
    }

    if (borough) {
      const boroughUpper = borough.toUpperCase();
      // PLUTO may use different borough field names
      url += ` AND upper(borough)='${boroughUpper}'`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`DOF API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('DOF Property fetch error:', err);
    return [];
  }
}

/**
 * Fetch DOB Permits
 */
export async function fetchDOBPermits(address: string, borough?: string): Promise<DOBPermit[]> {
  try {
    const { number, street } = parseAddress(address);
    let url = `${ENDPOINTS.dobPermits}?$limit=50&$order=filing_date DESC`;

    if (number) {
      url += `&$where=upper(house__) like '%25${encodeURIComponent(number)}%25'`;
      url += ` AND upper(street_name) like '%25${encodeURIComponent(street.split(' ')[0])}%25'`;
    }

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
    let url = `${ENDPOINTS.ll97Energy}?$limit=10`;

    if (number) {
      url += `&$where=upper(address_1) like '%25${encodeURIComponent(number + ' ' + street.split(' ').slice(0, 2).join(' '))}%25'`;
    } else {
      url += `&$where=upper(address_1) like '%25${encodeURIComponent(street)}%25'`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`LL97 API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('LL97 Energy fetch error:', err);
    return [];
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
  };
}

/**
 * Search HPD Building Registration by owner name
 */
export async function searchByOwnerName(name: string): Promise<any[]> {
  try {
    const upperName = name.toUpperCase().replace(/'/g, "''");
    const encoded = encodeURIComponent(upperName);
    const url = `${ENDPOINTS.hpdRegistration}?$limit=100&$where=upper(ownerfirstname) like '%25${encoded}%25' OR upper(ownerlastname) like '%25${encoded}%25' OR upper(corporationname) like '%25${encoded}%25'`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HPD Registration API error: ${res.status}`);
    const data = await res.json();

    // Deduplicate by buildingid
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const row of data) {
      const key = row.buildingid || `${row.housenumber}-${row.streetname}-${row.boroid}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      }
    }
    return unique;
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
    let violationsUrl = `${ENDPOINTS.hpdViolations}?$limit=200`;
    if (number) {
      violationsUrl += `&$where=upper(apartment)='${encodeURIComponent(upperUnit)}'`;
      violationsUrl += ` AND housenumber='${number}'`;
      violationsUrl += ` AND upper(streetname) like '%25${encodeURIComponent(street.split(' ').slice(0, 2).join(' '))}%25'`;
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
