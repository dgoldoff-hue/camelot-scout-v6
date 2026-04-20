h/**
 * Government Data APIs — Additional NYC & NY State endpoints
 * All endpoints are free and require no API key.
 */

// ============================================================
// Types
// ============================================================

export interface NYDOSCorporation {
  current_entity_name: string;
  dos_id: string;
  entity_formation_date?: string;
  county?: string;
  dos_process_name?: string;
  dos_process_address_1?: string;
  dos_process_address_2?: string;
  jurisdiction?: string;
  entity_type_desc?: string;
}

export interface ECBViolation {
  ecb_violation_number: string;
  ecb_violation_status: string;
  bin?: string;
  boro?: string;
  block?: string;
  lot?: string;
  hearing_date?: string;
  hearing_time?: string;
  violation_type?: string;
  penalty_balance_due?: string;
  violation_date?: string;
  respondent_name?: string;
  violation_description?: string;
  scheduled_hearing_date?: string;
}

export interface HousingLitigation {
  litigationid: string;
  buildingid?: string;
  boroid?: string;
  housenumber?: string;
  streetname?: string;
  casetype?: string;
  caseopendate?: string;
  casestatus?: string;
  statusdate?: string;
}

export interface RentStabilization {
  borough?: string;
  block?: string;
  lot?: string;
  building_address?: string;
  postcode?: string;
  uc2007?: string;
  est2007?: string;
  dhcr2009?: string;
  abat2009?: string;
  cd?: string;
  [key: string]: string | undefined; // varying field names
}

// ============================================================
// Endpoints
// ============================================================

const NY_DOS_ENDPOINT = 'https://data.ny.gov/resource/n9v6-gdp6.json';
const NYC_ECB_ENDPOINT = 'https://data.cityofnewyork.us/resource/6bgk-3dad.json';
const NYC_LITIGATION_ENDPOINT = 'https://data.cityofnewyork.us/resource/59kj-x8nc.json';
const NYC_RENT_STAB_ENDPOINT = 'https://data.cityofnewyork.us/resource/4xyc-jm4k.json';

// ============================================================
// 1. NY Secretary of State — Active Corporations
// ============================================================

/**
 * Search NY DOS Active Corporations by name.
 * Finds corporate entities, LLCs, etc. — useful for finding
 * the principals behind management companies.
 */
export async function searchNYDOSCorporation(name: string): Promise<NYDOSCorporation[]> {
  try {
    const upperName = name.toUpperCase().replace(/'/g, "''");
    const url = `${NY_DOS_ENDPOINT}?$limit=50&$where=upper(current_entity_name) like '%25${encodeURIComponent(upperName)}%25'`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NY DOS API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('NY DOS Corporation search error:', err);
    return [];
  }
}

// ============================================================
// 2. NYC ECB/OATH Violations
// ============================================================

/**
 * Fetch ECB/OATH violations by BBL (boro, block, lot).
 * Environmental/building code violations — separate from HPD.
 */
export async function fetchECBViolations(boro: string, block: string, lot: string): Promise<ECBViolation[]> {
  try {
    const where = `boro='${boro}' AND block='${block.padStart(5, '0')}' AND lot='${lot.padStart(4, '0')}'`;
    const url = `${NYC_ECB_ENDPOINT}?$limit=200&$order=violation_date DESC&$where=${encodeURIComponent(where)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ECB API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('ECB Violations fetch error:', err);
    return [];
  }
}

// ============================================================
// 3. NYC Housing Litigation
// ============================================================

/**
 * Fetch Housing Litigation cases for a building.
 * Buildings in active housing litigation are desperate for new management.
 */
export async function fetchHousingLitigation(boroid: string, housenumber: string, streetname: string): Promise<HousingLitigation[]> {
  try {
    const upperStreet = streetname.toUpperCase().replace(/'/g, "''");
    const where = `boroid='${boroid}' AND housenumber='${housenumber}' AND upper(streetname) like '%25${encodeURIComponent(upperStreet)}%25'`;
    const url = `${NYC_LITIGATION_ENDPOINT}?$limit=100&$order=caseopendate DESC&$where=${encodeURIComponent(where)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Housing Litigation API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Housing Litigation fetch error:', err);
    return [];
  }
}

// ============================================================
// 4. NYC Rent Stabilization
// ============================================================

/**
 * Fetch Rent Stabilization data for a BBL.
 * Identifies rent-stabilized buildings (more complex to manage = opportunity).
 */
export async function fetchRentStabilization(boro: string, block: string, lot: string): Promise<RentStabilization[]> {
  try {
    const boroStr = boro.toString();
    // The rent stabilization dataset uses borough, block, lot
    const where = `borough='${boroStr}' AND block='${block}' AND lot='${lot}'`;
    const url = `${NYC_RENT_STAB_ENDPOINT}?$limit=10&$where=${encodeURIComponent(where)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rent Stabilization API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Rent Stabilization fetch error:', err);
    return [];
  }
}

// ============================================================
// 5. External Record Links (FL/NJ/CT)
// ============================================================

export interface ExternalRecordLink {
  label: string;
  url: string;
  icon: string; // emoji
  state: string;
}

/**
 * Generate external record deep links based on building state/region.
 */
export function generateExternalLinks(params: {
  ownerName?: string;
  address?: string;
  state?: string; // NY, FL, NJ, CT
  region?: string;
}): ExternalRecordLink[] {
  const links: ExternalRecordLink[] = [];
  const { ownerName, address, state, region } = params;
  const name = encodeURIComponent(ownerName || '');
  const addr = encodeURIComponent(address || '');

  // Always show NY DOS if we have an owner name
  if (ownerName) {
    links.push({
      label: 'NY DOS',
      url: `https://appext20.dos.ny.gov/corp_public/CORPSEARCH.ENTITY_SEARCH_ENTRY`,
      icon: '🏛️',
      state: 'NY',
    });
  }

  // Determine if building is in Florida or FL links are relevant
  const isFL = state === 'FL' || (region || '').toLowerCase().includes('miami')
    || (region || '').toLowerCase().includes('florida')
    || (region || '').toLowerCase().includes('broward')
    || (region || '').toLowerCase().includes('palm beach');

  const isNJ = state === 'NJ' || (region || '').toLowerCase().includes('jersey');
  const isCT = state === 'CT' || (region || '').toLowerCase().includes('connecticut');

  if (isFL) {
    if (ownerName) {
      links.push({
        label: 'FL Sunbiz',
        url: `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName?searchNameOrder=${name}&searchTerm=${name}`,
        icon: '🌴',
        state: 'FL',
      });
    }
    if (address) {
      links.push({
        label: 'Miami-Dade PA',
        url: `https://www.miamidade.gov/Apps/PA/PApublicServiceSearch/PropertySearch.aspx?q=${addr}`,
        icon: '🏠',
        state: 'FL',
      });
      links.push({
        label: 'Broward PA',
        url: `https://bcpa.net/RecSearch.asp?SearchBy=Address&txtAddress=${addr}`,
        icon: '🏠',
        state: 'FL',
      });
      links.push({
        label: 'Palm Beach PA',
        url: `https://www.pbcgov.org/papa/Searches/PropertySearch.aspx?q=${addr}`,
        icon: '🏠',
        state: 'FL',
      });
    }
  }

  if (isNJ && ownerName) {
    links.push({
      label: 'NJ Business',
      url: `https://www.njportal.com/DOR/BusinessNameSearch/Search/BusinessName?searchTerm=${name}`,
      icon: '🏢',
      state: 'NJ',
    });
  }

  if (isCT && ownerName) {
    links.push({
      label: 'CT Business',
      url: `https://service.ct.gov/business/s/onlinebusinesssearch?q=${name}`,
      icon: '🏢',
      state: 'CT',
    });
  }

  return links;
}

// ============================================================
// Helpers for scoring
// ============================================================

/**
 * Calculate total ECB penalty balance from violations.
 */
export function totalECBPenaltyBalance(violations: ECBViolation[]): number {
  return violations.reduce((sum, v) => {
    return sum + (parseFloat(v.penalty_balance_due || '0') || 0);
  }, 0);
}

/**
 * Check if there are active housing litigation cases.
 */
export function hasActiveLitigation(litigations: HousingLitigation[]): boolean {
  return litigations.some(
    (l) => l.casestatus?.toLowerCase() === 'open' || l.casestatus?.toLowerCase() === 'active'
  );
}

/**
 * Check if building is rent stabilized from the dataset.
 */
export function isRentStabilized(rentStab: RentStabilization[]): boolean {
  return rentStab.length > 0;
}
