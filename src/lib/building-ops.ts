/**
 * Building Operations Detection
 * Determines union status, doorman, front desk, elevator, and building class descriptions.
 */

import type { BuildingOperations } from '@/types';

/** Building class → human-readable description */
const BUILDING_CLASS_MAP: Record<string, string> = {
  A0: 'One Family Cape Cod',
  A1: 'One Family Detached',
  A2: 'One Family Attached',
  A3: 'One Family Semi-Detached',
  A4: 'One Family Row',
  A5: 'One Family Attached or Semi-Detached',
  A6: 'One Family Summer Cottage',
  A7: 'One Family Mansion',
  A8: 'One Family Bungalow',
  A9: 'One Family (Other)',
  B1: 'Two Family Brick',
  B2: 'Two Family Frame',
  B3: 'Two Family (Other)',
  B9: 'Two Family (Other)',
  C0: 'Walk-Up Apartments',
  C1: 'Walk-Up Apartments (over 6 families, fireproof)',
  C2: 'Walk-Up Apartments (over 6 families, non-fireproof)',
  C3: 'Walk-Up Apartments (over 6 families, with stores)',
  C4: 'Walk-Up Apartments (old law tenement)',
  C5: 'Walk-Up Apartments (converted dwelling)',
  C6: 'Walk-Up Co-op',
  C7: 'Walk-Up Condo',
  C8: 'Walk-Up (over 6, with stores)',
  C9: 'Walk-Up Apartments (Other)',
  D0: 'Elevator Co-op',
  D1: 'Elevator Apartments (semi-fireproof)',
  D2: 'Elevator Apartments (fireproof, no doorman)',
  D3: 'Elevator Apartments (fireproof, no doorman)',
  D4: 'Elevator Apartments (doorman)',
  D5: 'Elevator Apartments (converted)',
  D6: 'Elevator Co-op (with stores)',
  D7: 'Elevator Apartments (semi-fireproof, with stores)',
  D8: 'Elevator Apartments (loft)',
  D9: 'Elevator Apartments (Other)',
  R0: 'Condo (residential unit)',
  R1: 'Condo (residential, up to 3 stories)',
  R2: 'Condo (residential, 4–6 stories)',
  R3: 'Condo (residential, 7–24 stories)',
  R4: 'Condo (residential, 25+ stories)',
  R5: 'Condo (misc. commercial)',
  R6: 'Condo (residential, converted)',
  R7: 'Condo (commercial only)',
  R8: 'Condo (multi-use)',
  R9: 'Condo (Other)',
  S0: 'Residential (primarily 1 family)',
  S1: 'Residential (primarily 2 family)',
  S2: 'Residential (primarily 3+ family)',
  S3: 'Residential (mixed types)',
  S4: 'Residential (co-op, converted)',
  S5: 'Residential (co-op, other)',
  S9: 'Residential (Other)',
};

/**
 * Detect building operations characteristics from building class and unit count.
 */
export function detectBuildingOperations(
  buildingClass?: string | null,
  units?: number | null,
): BuildingOperations {
  const bc = (buildingClass || '').toUpperCase().trim();
  const unitCount = units || 0;

  // Elevator detection: D-class or R3/R4 (high-rise condos)
  const isElevator = bc.startsWith('D') || bc === 'R3' || bc === 'R4';

  // Doorman: D4 specifically = elevator with doorman
  const hasDoorman = bc === 'D4';

  // Front desk: doorman buildings or 100+ units typically have one
  const hasFrontDesk = hasDoorman || unitCount >= 100;

  // Union status: Buildings with 100+ units OR certain elevator classes (D4, D7, D9) are likely 32BJ SEIU
  const isLikelyUnion = unitCount >= 100 || bc === 'D4' || bc === 'D7' || bc === 'D9';

  let unionStatus: BuildingOperations['unionStatus'] = 'unknown';
  let unionLabel = 'Unknown';

  if (bc.startsWith('D') || bc.startsWith('R') || bc.startsWith('C') || unitCount >= 10) {
    // We have enough info to make an assessment
    if (isLikelyUnion) {
      unionStatus = 'likely_union';
      unionLabel = '🏛 Likely Union (32BJ)';
    } else {
      unionStatus = 'likely_non_union';
      unionLabel = '🏢 Likely Non-Union';
    }
  }

  // Building class description
  const buildingClassDescription = BUILDING_CLASS_MAP[bc] || (bc ? `Class ${bc}` : 'Unknown');

  return {
    unionStatus,
    unionLabel,
    hasDoorman,
    hasFrontDesk,
    hasElevator: isElevator,
    buildingClassDescription,
    buildingClass: bc,
  };
}

/**
 * Get a short label for doorman status.
 */
export function getDoormanLabel(ops: BuildingOperations): string {
  return ops.hasDoorman ? '🚪 Doorman Building' : 'No Doorman';
}

/**
 * Get a short label for front desk status.
 */
export function getFrontDeskLabel(ops: BuildingOperations): string {
  return ops.hasFrontDesk ? '📞 Has Front Desk' : 'No Front Desk';
}
