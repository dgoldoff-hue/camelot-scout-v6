import type { Building, BuildingGrade } from '@/types';

/**
 * Lead Scoring Algorithm for Camelot Scout
 * Score 0-100, Grade A (75+), B (50-74), C (below 50)
 *
 * Factors:
 * - HPD violations count (more = higher score, building needs help)
 * - Building size (30+ units preferred)
 * - Current management (unknown/small = higher score)
 * - Year built (older = more maintenance needs)
 * - Recent DOB permits (activity = capital planning)
 * - Energy compliance (LL97 risk = opportunity)
 */

interface ScoreFactors {
  violations_count?: number;
  open_violations_count?: number;
  units?: number;
  current_management?: string;
  year_built?: number;
  has_recent_permits?: boolean;
  energy_star_score?: number;
  site_eui?: number;
}

interface ScoreBreakdown {
  total: number;
  grade: BuildingGrade;
  factors: { name: string; score: number; max: number; reason: string }[];
  signals: string[];
}

const KNOWN_LARGE_FIRMS = [
  'firstservice residential',
  'related companies',
  'brookfield',
  'greystar',
  'equity residential',
  'avalon bay',
  'cushman & wakefield',
  'cbre',
  'jll',
  'rudin management',
  'sl green',
  'vornado',
  'tishman speyer',
  'silverstein',
  'extell',
  'lefrak',
  'rose associates',
  'glenwood management',
];

export function calculateScore(factors: ScoreFactors): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    total: 0,
    grade: 'C',
    factors: [],
    signals: [],
  };

  // 1. HPD Violations (0-30 points)
  const violations = factors.violations_count || 0;
  const openViolations = factors.open_violations_count || 0;
  let violationScore = 0;
  if (violations > 50) {
    violationScore = 30;
    breakdown.signals.push('High violation count — needs management help');
  } else if (violations > 20) {
    violationScore = 22;
    breakdown.signals.push('Moderate violations');
  } else if (violations > 10) {
    violationScore = 15;
  } else if (violations > 0) {
    violationScore = 8;
  }
  if (openViolations > 10) {
    violationScore = Math.min(30, violationScore + 5);
    breakdown.signals.push(`${openViolations} open violations`);
  }
  breakdown.factors.push({
    name: 'HPD Violations',
    score: violationScore,
    max: 30,
    reason: `${violations} total, ${openViolations} open`,
  });

  // 2. Building Size (0-20 points)
  const units = factors.units || 0;
  let sizeScore = 0;
  if (units >= 100) {
    sizeScore = 20;
    breakdown.signals.push('Large building (100+ units)');
  } else if (units >= 50) {
    sizeScore = 16;
    breakdown.signals.push('Mid-size building (50+ units)');
  } else if (units >= 30) {
    sizeScore = 12;
  } else if (units >= 10) {
    sizeScore = 8;
  } else if (units > 0) {
    sizeScore = 4;
  }
  breakdown.factors.push({
    name: 'Building Size',
    score: sizeScore,
    max: 20,
    reason: `${units} units`,
  });

  // 3. Current Management (0-20 points)
  const mgmt = (factors.current_management || '').toLowerCase().trim();
  let mgmtScore = 0;
  if (!mgmt || mgmt === 'unknown' || mgmt === 'self-managed' || mgmt === 'none') {
    mgmtScore = 20;
    breakdown.signals.push('No established management — prime opportunity');
  } else if (KNOWN_LARGE_FIRMS.some((f) => mgmt.includes(f))) {
    mgmtScore = 5;
    breakdown.signals.push('Managed by large firm — harder to displace');
  } else {
    mgmtScore = 14;
    breakdown.signals.push('Small/mid-size management — competitive opportunity');
  }
  breakdown.factors.push({
    name: 'Current Management',
    score: mgmtScore,
    max: 20,
    reason: mgmt || 'Unknown',
  });

  // 4. Building Age (0-15 points)
  const yearBuilt = factors.year_built || 0;
  const currentYear = new Date().getFullYear();
  let ageScore = 0;
  if (yearBuilt > 0) {
    const age = currentYear - yearBuilt;
    if (age > 80) {
      ageScore = 15;
      breakdown.signals.push('Very old building — high maintenance needs');
    } else if (age > 50) {
      ageScore = 12;
    } else if (age > 30) {
      ageScore = 8;
    } else if (age > 10) {
      ageScore = 5;
    } else {
      ageScore = 2;
    }
  }
  breakdown.factors.push({
    name: 'Building Age',
    score: ageScore,
    max: 15,
    reason: yearBuilt ? `Built ${yearBuilt} (${currentYear - yearBuilt} years)` : 'Unknown',
  });

  // 5. Recent Permits (0-8 points)
  let permitScore = factors.has_recent_permits ? 8 : 0;
  if (factors.has_recent_permits) {
    breakdown.signals.push('Recent DOB permits — active capital planning');
  }
  breakdown.factors.push({
    name: 'DOB Permits',
    score: permitScore,
    max: 8,
    reason: factors.has_recent_permits ? 'Recent permit activity' : 'No recent permits',
  });

  // 6. Energy Compliance (0-7 points)
  let energyScore = 0;
  if (factors.energy_star_score !== undefined) {
    if (factors.energy_star_score < 50) {
      energyScore = 7;
      breakdown.signals.push('Low Energy Star score — LL97 compliance risk');
    } else if (factors.energy_star_score < 75) {
      energyScore = 4;
      breakdown.signals.push('Moderate energy performance');
    } else {
      energyScore = 1;
    }
  } else if (factors.site_eui && factors.site_eui > 100) {
    energyScore = 5;
    breakdown.signals.push('High energy usage — potential LL97 issue');
  }
  breakdown.factors.push({
    name: 'Energy/LL97',
    score: energyScore,
    max: 7,
    reason: factors.energy_star_score !== undefined
      ? `Energy Star: ${factors.energy_star_score}`
      : 'No data',
  });

  // Calculate total
  breakdown.total = breakdown.factors.reduce((sum, f) => sum + f.score, 0);

  // Assign grade
  if (breakdown.total >= 75) {
    breakdown.grade = 'A';
  } else if (breakdown.total >= 50) {
    breakdown.grade = 'B';
  } else {
    breakdown.grade = 'C';
  }

  return breakdown;
}

export function getGradeFromScore(score: number): BuildingGrade {
  if (score >= 75) return 'A';
  if (score >= 50) return 'B';
  return 'C';
}

export function recalculateBuildingScore(building: Partial<Building>): { score: number; grade: BuildingGrade; signals: string[] } {
  const result = calculateScore({
    violations_count: building.violations_count,
    open_violations_count: building.open_violations_count,
    units: building.units,
    current_management: building.current_management,
    year_built: building.year_built,
    has_recent_permits: !!(building.enriched_data as any)?.dob?.recent_permits,
    energy_star_score: building.energy_star_score,
    site_eui: building.site_eui,
  });

  return { score: result.total, grade: result.grade, signals: result.signals };
}
