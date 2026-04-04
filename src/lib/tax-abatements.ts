/**
 * J-51 & 421-a Tax Abatement Tracking
 *
 * Queries NYC Open Data for J-51 tax benefits and 421-a exempt properties,
 * detects expiring abatements, and estimates the tax impact on expiration.
 */

// ============================================================
// Types
// ============================================================

export type AbatementType = 'J-51' | '421-a' | 'other';
export type AbatementStatus = 'active' | 'expiring' | 'expired';

export interface TaxAbatement {
  type: AbatementType;
  bbl: string;
  startDate: string;
  expirationDate: string;
  benefitAmount: number;
  status: AbatementStatus;
  yearsRemaining: number;
  estimatedTaxIncrease: number;
}

// Raw API response shapes (NYC Open Data)
interface J51RawRecord {
  borough?: string;
  block?: string;
  lot?: string;
  bbl?: string;
  beg_yr?: string;
  end_yr?: string;
  benefit_amount?: string;
  tax_year?: string;
  tax_benefit?: string;
  [key: string]: string | undefined;
}

interface ExemptPropertyRaw {
  borough?: string;
  block?: string;
  lot?: string;
  bbl?: string;
  exemption_code?: string;
  exemption_code_description?: string;
  begin_date?: string;
  end_date?: string;
  exempt_amount?: string;
  abatement_amount?: string;
  tax_year?: string;
  owner_name?: string;
  [key: string]: string | undefined;
}

// ============================================================
// Endpoints
// ============================================================

const NYC_BASE = 'https://data.cityofnewyork.us/resource';
const J51_ENDPOINT = `${NYC_BASE}/bdjg-jny6.json`;
const EXEMPT_ENDPOINT = `${NYC_BASE}/nbqj-fw2e.json`;

// ============================================================
// Helpers
// ============================================================

/** Pad block/lot to standard widths used by NYC APIs */
function padBlock(block: string): string {
  return block.replace(/\D/g, '').padStart(5, '0');
}

function padLot(lot: string): string {
  return lot.replace(/\D/g, '').padStart(4, '0');
}

/** Build a BBL string from components */
function buildBBL(borough: string, block: string, lot: string): string {
  return `${borough}${padBlock(block)}${padLot(lot)}`;
}

/** Calculate years remaining from an expiration date string */
function calcYearsRemaining(expirationDate: string): number {
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) return 0;
  const now = new Date();
  const diff = exp.getTime() - now.getTime();
  return Math.max(0, diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** Derive abatement status from years remaining */
function deriveStatus(yearsRemaining: number): AbatementStatus {
  if (yearsRemaining <= 0) return 'expired';
  if (yearsRemaining <= 2) return 'expiring';
  return 'active';
}

/**
 * Try to interpret a year-only or date string into an ISO-ish date.
 * J-51 data frequently stores just a year like "2023".
 */
function normalizeDate(raw: string | undefined, yearEnd = false): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // Already looks like a date
  if (trimmed.includes('-') || trimmed.includes('/') || trimmed.includes('T')) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
  // Year only
  const yearMatch = trimmed.match(/^\d{4}$/);
  if (yearMatch) {
    return yearEnd ? `${trimmed}-12-31` : `${trimmed}-01-01`;
  }
  return '';
}

// ============================================================
// API Functions
// ============================================================

/**
 * Fetch J-51 tax benefits for a property by BBL components.
 */
export async function fetchJ51Benefits(
  borough: string,
  block: string,
  lot: string,
): Promise<TaxAbatement[]> {
  try {
    const bbl = buildBBL(borough, block, lot);

    // Try BBL-level first, fallback to borough+block+lot
    const queries = [
      `bbl='${bbl}'`,
      `borough='${borough}' AND block='${padBlock(block)}' AND lot='${padLot(lot)}'`,
      `borough='${borough}' AND block='${block}' AND lot='${lot}'`,
    ];

    let records: J51RawRecord[] = [];

    for (const where of queries) {
      const url = `${J51_ENDPOINT}?$limit=200&$where=${encodeURIComponent(where)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data: J51RawRecord[] = await res.json();
      if (data.length > 0) {
        records = data;
        break;
      }
    }

    if (records.length === 0) return [];

    return records.map((r) => {
      const startDate = normalizeDate(r.beg_yr, false);
      const expirationDate = normalizeDate(r.end_yr, true);
      const benefitAmount = parseFloat(r.benefit_amount || r.tax_benefit || '0') || 0;
      const yearsRemaining = expirationDate ? calcYearsRemaining(expirationDate) : 0;

      return {
        type: 'J-51' as AbatementType,
        bbl: r.bbl || bbl,
        startDate,
        expirationDate,
        benefitAmount,
        status: deriveStatus(yearsRemaining),
        yearsRemaining: Math.round(yearsRemaining * 10) / 10,
        estimatedTaxIncrease: benefitAmount, // best first-pass estimate
      };
    });
  } catch (err) {
    console.error('J-51 Benefits fetch error:', err);
    return [];
  }
}

/**
 * Fetch 421-a exemption data from DOF Exempt Properties.
 *
 * 421-a exemption codes typically begin with "28" or the description
 * contains "421" or "421-A".
 */
export async function fetch421aStatus(
  borough: string,
  block: string,
  lot: string,
): Promise<TaxAbatement[]> {
  try {
    const bbl = buildBBL(borough, block, lot);

    // Query exempt properties for this BBL
    const queries = [
      `bbl='${bbl}'`,
      `borough='${borough}' AND block='${padBlock(block)}' AND lot='${padLot(lot)}'`,
      `borough='${borough}' AND block='${block}' AND lot='${lot}'`,
    ];

    let records: ExemptPropertyRaw[] = [];

    for (const where of queries) {
      const url = `${EXEMPT_ENDPOINT}?$limit=200&$where=${encodeURIComponent(where)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data: ExemptPropertyRaw[] = await res.json();
      if (data.length > 0) {
        records = data;
        break;
      }
    }

    if (records.length === 0) return [];

    // Filter for 421-a related exemptions
    const is421a = (r: ExemptPropertyRaw): boolean => {
      const code = (r.exemption_code || '').trim();
      const desc = (r.exemption_code_description || '').toUpperCase();
      return code.startsWith('28') || desc.includes('421') || desc.includes('421-A') || desc.includes('421A');
    };

    const filtered = records.filter(is421a);

    // If nothing is explicitly 421-a, return all exempt records tagged as 'other'
    const toProcess = filtered.length > 0 ? filtered : records;
    const abatementType: AbatementType = filtered.length > 0 ? '421-a' : 'other';

    return toProcess.map((r) => {
      const startDate = normalizeDate(r.begin_date, false);
      const expirationDate = normalizeDate(r.end_date, true);
      const benefitAmount =
        parseFloat(r.abatement_amount || r.exempt_amount || '0') || 0;
      const yearsRemaining = expirationDate ? calcYearsRemaining(expirationDate) : 0;

      return {
        type: abatementType,
        bbl: r.bbl || bbl,
        startDate,
        expirationDate,
        benefitAmount,
        status: deriveStatus(yearsRemaining),
        yearsRemaining: Math.round(yearsRemaining * 10) / 10,
        estimatedTaxIncrease: benefitAmount,
      };
    });
  } catch (err) {
    console.error('421-a Status fetch error:', err);
    return [];
  }
}

// ============================================================
// Analysis Functions
// ============================================================

/**
 * Flag abatements expiring within 2 years.
 * Returns only the ones in danger-zone.
 */
export function detectExpiringAbatements(abatementData: TaxAbatement[]): TaxAbatement[] {
  return abatementData.filter((a) => a.status === 'expiring');
}

/**
 * Estimate the tax increase when an abatement expires.
 *
 * @param currentTax   - Current annual tax bill ($)
 * @param abatementAmount - Annual benefit / exemption amount ($)
 * @param expirationDate  - When the abatement expires
 * @returns Estimated annual tax increase ($) and effective date
 */
export function calculateTaxImpact(
  currentTax: number,
  abatementAmount: number,
  expirationDate: string,
): { estimatedIncrease: number; newEstimatedTax: number; effectiveDate: string; percentIncrease: number } {
  const estimatedIncrease = abatementAmount;
  const newEstimatedTax = currentTax + abatementAmount;
  const percentIncrease = currentTax > 0 ? (abatementAmount / currentTax) * 100 : 0;

  return {
    estimatedIncrease,
    newEstimatedTax,
    effectiveDate: expirationDate,
    percentIncrease: Math.round(percentIncrease * 10) / 10,
  };
}

/**
 * Convenience: fetch both J-51 and 421-a in parallel.
 */
export async function fetchAllAbatements(
  borough: string,
  block: string,
  lot: string,
): Promise<TaxAbatement[]> {
  const [j51, four21a] = await Promise.all([
    fetchJ51Benefits(borough, block, lot),
    fetch421aStatus(borough, block, lot),
  ]);
  return [...j51, ...four21a];
}
