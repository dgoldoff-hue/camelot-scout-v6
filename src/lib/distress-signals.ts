/**
 * Financial Distress Detection Engine
 *
 * Analyzes ACRIS, DOF, violation, and ECB data to produce a 0-100
 * distress score with categorised signals. Higher scores mean more
 * financial distress — and therefore more opportunity for outreach.
 */

import type { ACRISData, ACRISRecord } from '@/types';
import type { ECBViolation, HousingLitigation } from '@/lib/gov-apis';
import type { TaxAbatement } from '@/lib/tax-abatements';

// ============================================================
// Types
// ============================================================

export type DistressSignalType =
  | 'heavy_mortgage'
  | 'recent_refinance'
  | 'tax_lien'
  | 'expiring_abatement'
  | 'high_ecb_penalty'
  | 'active_litigation'
  | 'rapid_turnover'
  | 'high_violations'
  | 'multiple_mortgages';

export type DistressLevel = 'stable' | 'watch' | 'stressed' | 'distressed' | 'critical';

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DistressSignal {
  type: DistressSignalType;
  description: string;
  severity: SignalSeverity;
  /** Numeric value tied to the signal (dollar amount, count, etc.) */
  value: number;
  source: string;
}

export interface DistressReport {
  score: number;
  level: DistressLevel;
  signals: DistressSignal[];
  summary: string;
  recommendation: string;
}

// ============================================================
// Input shape — callers can pass partial data
// ============================================================

export interface DistressInput {
  acrisData?: ACRISData | null;
  dofData?: {
    assessedValue?: number;
    marketValue?: number;
    taxClass?: string;
    units?: number;
    stories?: number;
    [key: string]: any;
  } | null;
  violations?: {
    total: number;
    open: number;
    items?: any[];
  } | null;
  ecbData?: {
    violations: ECBViolation[];
    totalPenaltyBalance: number;
  } | null;
  litigation?: {
    cases: HousingLitigation[];
    hasActive: boolean;
  } | null;
  abatements?: TaxAbatement[] | null;
}

// ============================================================
// Signal weights (max contribution to the 0-100 score)
// ============================================================

const WEIGHTS: Record<DistressSignalType, number> = {
  heavy_mortgage: 15,
  multiple_mortgages: 10,
  recent_refinance: 8,
  tax_lien: 20,
  expiring_abatement: 18,
  high_ecb_penalty: 12,
  active_litigation: 15,
  rapid_turnover: 10,
  high_violations: 12,
};

// ============================================================
// Core Analysis
// ============================================================

/**
 * Comprehensive distress analysis.
 *
 * Accepts the various data sources already fetched by the building report
 * and returns a scored distress report.
 */
export function analyzeDistress(input: DistressInput): DistressReport {
  const signals: DistressSignal[] = [];

  // -- 1. Heavy mortgage load / multiple mortgages ---
  analyzeMortgages(input.acrisData, signals);

  // -- 2. Tax lien filings (ACRIS doc types) ---
  analyzeTaxLiens(input.acrisData, signals);

  // -- 3. Expiring abatements ---
  analyzeAbatements(input.abatements, signals);

  // -- 4. High ECB penalty balance ---
  analyzeECB(input.ecbData, signals);

  // -- 5. Active housing litigation ---
  analyzeLitigation(input.litigation, signals);

  // -- 6. Rapid ownership turnover ---
  analyzeTurnover(input.acrisData, signals);

  // -- 7. High violation count relative to building size ---
  analyzeViolations(input.violations, input.dofData, signals);

  const score = calculateDistressScore(signals);
  const level = getDistressLevel(score);
  const summary = buildSummary(signals, score, level);
  const recommendation = buildRecommendation(signals, level);

  return { score, level, signals, summary, recommendation };
}

// ============================================================
// Individual Signal Analyzers
// ============================================================

function analyzeMortgages(acris: ACRISData | null | undefined, signals: DistressSignal[]): void {
  if (!acris) return;

  // Active mortgages = MTGE records without a matching SAT (satisfaction)
  const mortgages = acris.records.filter((r) => r.documentType === 'MTGE');
  const satisfactions = new Set(
    acris.records
      .filter((r) => r.documentType === 'SAT')
      .map((r) => r.parties?.[0]?.name?.toUpperCase() || ''),
  );

  // Count "potentially active" mortgages (no matching SAT by lender name)
  const activeMortgages = mortgages.filter((m) => {
    const lender = m.parties?.find((p) => p.type === 'buyer')?.name?.toUpperCase() || '';
    return !satisfactions.has(lender);
  });

  if (activeMortgages.length >= 3) {
    const totalDebt = activeMortgages.reduce((s, m) => s + m.amount, 0);
    signals.push({
      type: 'multiple_mortgages',
      description: `${activeMortgages.length} potentially active mortgages totaling $${totalDebt.toLocaleString()}`,
      severity: activeMortgages.length >= 5 ? 'critical' : 'high',
      value: totalDebt,
      source: 'ACRIS',
    });
  }

  // Recent refinancing (MTGE or ASST in last 18 months)
  const eighteenMonthsAgo = new Date();
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

  const recentMortgageActivity = acris.records.filter(
    (r) =>
      (r.documentType === 'MTGE' || r.documentType === 'ASST') &&
      new Date(r.date) > eighteenMonthsAgo,
  );

  if (recentMortgageActivity.length >= 2) {
    signals.push({
      type: 'recent_refinance',
      description: `${recentMortgageActivity.length} mortgage transactions in the last 18 months — possible refinancing or debt restructuring`,
      severity: 'medium',
      value: recentMortgageActivity.length,
      source: 'ACRIS',
    });
  }

  // Single very large mortgage relative to market value → heavy mortgage
  const largestMortgage = mortgages.reduce(
    (max, m) => (m.amount > max ? m.amount : max),
    0,
  );
  if (largestMortgage > 0) {
    // Flag if any single mortgage > 80% of total debt is quite large
    // (without market value we still flag >$5M as noteworthy for NYC multifamily)
    if (largestMortgage >= 5_000_000) {
      signals.push({
        type: 'heavy_mortgage',
        description: `Largest mortgage on record: $${largestMortgage.toLocaleString()}`,
        severity: largestMortgage >= 20_000_000 ? 'high' : 'medium',
        value: largestMortgage,
        source: 'ACRIS',
      });
    }
  }
}

function analyzeTaxLiens(acris: ACRISData | null | undefined, signals: DistressSignal[]): void {
  if (!acris) return;

  // Tax lien doc types in ACRIS
  const LIEN_TYPES = ['LIEN', 'TAX LIEN', 'TLIEN', 'FTL', 'FEDTL', 'STLIEN'];

  const liens = acris.records.filter((r) => {
    const type = r.documentType?.toUpperCase() || '';
    const label = r.documentTypeLabel?.toUpperCase() || '';
    return (
      LIEN_TYPES.some((lt) => type.includes(lt) || label.includes(lt)) ||
      label.includes('TAX LIEN') ||
      label.includes('LIEN')
    );
  });

  if (liens.length > 0) {
    const totalLienAmount = liens.reduce((s, l) => s + l.amount, 0);
    signals.push({
      type: 'tax_lien',
      description: `${liens.length} tax lien filing(s) found${totalLienAmount ? ` totaling $${totalLienAmount.toLocaleString()}` : ''}`,
      severity: liens.length >= 3 ? 'critical' : liens.length >= 2 ? 'high' : 'medium',
      value: totalLienAmount || liens.length,
      source: 'ACRIS',
    });
  }
}

function analyzeAbatements(
  abatements: TaxAbatement[] | null | undefined,
  signals: DistressSignal[],
): void {
  if (!abatements || abatements.length === 0) return;

  const expiring = abatements.filter((a) => a.status === 'expiring');
  if (expiring.length === 0) return;

  const totalImpact = expiring.reduce((s, a) => s + a.estimatedTaxIncrease, 0);
  const soonest = expiring.reduce(
    (min, a) => (a.yearsRemaining < min ? a.yearsRemaining : min),
    Infinity,
  );

  signals.push({
    type: 'expiring_abatement',
    description: `${expiring.length} tax abatement(s) expiring within 2 years — estimated $${totalImpact.toLocaleString()} annual tax increase. Soonest expires in ${soonest.toFixed(1)} years.`,
    severity: totalImpact >= 100_000 ? 'critical' : totalImpact >= 25_000 ? 'high' : 'medium',
    value: totalImpact,
    source: 'DOF / NYC Open Data',
  });
}

function analyzeECB(
  ecb: { violations: ECBViolation[]; totalPenaltyBalance: number } | null | undefined,
  signals: DistressSignal[],
): void {
  if (!ecb) return;

  const balance = ecb.totalPenaltyBalance;
  if (balance > 10_000) {
    signals.push({
      type: 'high_ecb_penalty',
      description: `$${balance.toLocaleString()} in outstanding ECB/OATH penalty balance across ${ecb.violations.length} violation(s)`,
      severity: balance >= 100_000 ? 'critical' : balance >= 50_000 ? 'high' : 'medium',
      value: balance,
      source: 'ECB/OATH',
    });
  }
}

function analyzeLitigation(
  litigation: { cases: HousingLitigation[]; hasActive: boolean } | null | undefined,
  signals: DistressSignal[],
): void {
  if (!litigation || !litigation.hasActive) return;

  const activeCases = litigation.cases.filter(
    (c) => c.casestatus?.toLowerCase() === 'open' || c.casestatus?.toLowerCase() === 'active',
  );

  if (activeCases.length > 0) {
    signals.push({
      type: 'active_litigation',
      description: `${activeCases.length} active housing litigation case(s) — types: ${[...new Set(activeCases.map((c) => c.casetype).filter(Boolean))].join(', ') || 'unspecified'}`,
      severity: activeCases.length >= 3 ? 'critical' : 'high',
      value: activeCases.length,
      source: 'HPD Housing Litigation',
    });
  }
}

function analyzeTurnover(acris: ACRISData | null | undefined, signals: DistressSignal[]): void {
  if (!acris) return;

  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const recentDeeds = acris.deeds.filter((d) => new Date(d.date) > fiveYearsAgo);

  if (recentDeeds.length > 2) {
    signals.push({
      type: 'rapid_turnover',
      description: `${recentDeeds.length} ownership transfers in the last 5 years — possible instability`,
      severity: recentDeeds.length >= 4 ? 'high' : 'medium',
      value: recentDeeds.length,
      source: 'ACRIS',
    });
  }
}

function analyzeViolations(
  violations: { total: number; open: number } | null | undefined,
  dof: { units?: number; [key: string]: any } | null | undefined,
  signals: DistressSignal[],
): void {
  if (!violations) return;

  const units = dof?.units || 1;
  const openPerUnit = violations.open / units;

  // Flag if >1 open violation per unit or >50 open violations total
  if (openPerUnit > 1 || violations.open > 50) {
    signals.push({
      type: 'high_violations',
      description: `${violations.open} open violations (${openPerUnit.toFixed(1)} per unit) out of ${violations.total} total`,
      severity: openPerUnit > 3 || violations.open > 100 ? 'critical' : openPerUnit > 2 ? 'high' : 'medium',
      value: violations.open,
      source: 'HPD',
    });
  }
}

// ============================================================
// Scoring
// ============================================================

const SEVERITY_MULTIPLIER: Record<SignalSeverity, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.85,
  critical: 1.0,
};

/**
 * Calculate a 0-100 distress score from an array of signals.
 *
 * Each signal type has a max weight. The severity determines
 * what fraction of that weight is applied. Scores are capped at 100.
 */
export function calculateDistressScore(signals: DistressSignal[]): number {
  if (signals.length === 0) return 0;

  let total = 0;

  // Group by type — take highest severity per type
  const byType = new Map<DistressSignalType, DistressSignal>();
  for (const s of signals) {
    const existing = byType.get(s.type);
    if (!existing || SEVERITY_MULTIPLIER[s.severity] > SEVERITY_MULTIPLIER[existing.severity]) {
      byType.set(s.type, s);
    }
  }

  for (const [type, signal] of byType) {
    const weight = WEIGHTS[type] || 5;
    const multiplier = SEVERITY_MULTIPLIER[signal.severity];
    total += weight * multiplier;
  }

  return Math.min(100, Math.round(total));
}

/**
 * Map a 0-100 score to a human-readable distress level.
 */
export function getDistressLevel(score: number): DistressLevel {
  if (score <= 15) return 'stable';
  if (score <= 35) return 'watch';
  if (score <= 55) return 'stressed';
  if (score <= 75) return 'distressed';
  return 'critical';
}

// ============================================================
// Summary Builders
// ============================================================

function buildSummary(signals: DistressSignal[], score: number, level: DistressLevel): string {
  if (signals.length === 0) {
    return 'No financial distress signals detected. Property appears stable.';
  }

  const critical = signals.filter((s) => s.severity === 'critical').length;
  const high = signals.filter((s) => s.severity === 'high').length;

  const parts: string[] = [
    `Distress score: ${score}/100 (${level}).`,
    `${signals.length} signal${signals.length !== 1 ? 's' : ''} detected.`,
  ];

  if (critical > 0) parts.push(`${critical} critical.`);
  if (high > 0) parts.push(`${high} high severity.`);

  // Highlight top signals
  const topSignals = signals
    .sort((a, b) => SEVERITY_MULTIPLIER[b.severity] - SEVERITY_MULTIPLIER[a.severity])
    .slice(0, 3)
    .map((s) => s.description);

  if (topSignals.length > 0) {
    parts.push('Top concerns: ' + topSignals.join(' | '));
  }

  return parts.join(' ');
}

function buildRecommendation(signals: DistressSignal[], level: DistressLevel): string {
  switch (level) {
    case 'stable':
      return 'No urgent action needed. Standard outreach timing.';
    case 'watch':
      return 'Monitor this property. Consider outreach emphasizing proactive management.';
    case 'stressed':
      return 'Good outreach target. Emphasize compliance expertise and violation resolution in pitch materials.';
    case 'distressed':
      return 'High-priority outreach target. Building ownership is likely under significant financial/regulatory pressure. Lead with crisis management capabilities.';
    case 'critical':
      return 'Immediate outreach recommended. Property shows multiple severe distress indicators. Position as a turnaround partner — compliance, litigation support, and debt restructuring awareness.';
  }
}

// ============================================================
// Convenience: Distress level → color mapping for UI
// ============================================================

export const DISTRESS_LEVEL_COLORS: Record<DistressLevel, { bg: string; text: string; border: string; fill: string }> = {
  stable: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', fill: '#22c55e' },
  watch: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', fill: '#eab308' },
  stressed: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', fill: '#f97316' },
  distressed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', fill: '#ef4444' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', fill: '#dc2626' },
};

export const SEVERITY_COLORS: Record<SignalSeverity, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700' },
  critical: { bg: 'bg-red-100', text: 'text-red-700' },
};
