/**
 * Trigger Alert Engine
 * Detects ownership changes, 311 surges, violation spikes, and more.
 */

import type { Building } from '@/types';
import { fetch311Complaints } from '@/lib/nyc-311';
import { generateId } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export type AlertType =
  | 'ownership_change'
  | 'violation_spike'
  | 'll97_deadline'
  | '311_surge'
  | 'ecb_penalty'
  | 'abatement_expiring'
  | 'litigation_filed';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  type: AlertType;
  building_id: string;
  building_address: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  data: Record<string, any>;
  created_at: string;
  read: boolean;
}

// ============================================================
// Severity color helper
// ============================================================

export function alertSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

// ============================================================
// Alert icon mapping (lucide icon names for the UI)
// ============================================================

export const ALERT_TYPE_META: Record<AlertType, { label: string; icon: string }> = {
  ownership_change: { label: 'Ownership Change', icon: 'ArrowRightLeft' },
  violation_spike: { label: 'Violation Spike', icon: 'AlertTriangle' },
  ll97_deadline: { label: 'LL97 Deadline', icon: 'Thermometer' },
  '311_surge': { label: '311 Surge', icon: 'Phone' },
  ecb_penalty: { label: 'ECB Penalty', icon: 'DollarSign' },
  abatement_expiring: { label: 'Abatement Expiring', icon: 'Clock' },
  litigation_filed: { label: 'Litigation Filed', icon: 'Scale' },
};

// ============================================================
// Detector: Ownership Changes
// ============================================================

/**
 * Flag buildings sold within the last 6 months.
 * Uses enriched_data.acris.lastSaleDate if available.
 */
export function detectOwnershipChanges(buildings: Building[]): Alert[] {
  const alerts: Alert[] = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const b of buildings) {
    const acris = b.enriched_data?.acris;
    if (!acris?.lastSaleDate) continue;

    const saleDate = new Date(acris.lastSaleDate);
    if (isNaN(saleDate.getTime())) continue;

    if (saleDate > sixMonthsAgo) {
      const monthsAgo = Math.round(
        (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      const buyer = acris.lastSaleBuyer || 'Unknown buyer';
      const seller = acris.lastSaleSeller || 'Unknown seller';
      const price = acris.lastSalePrice
        ? `$${(acris.lastSalePrice / 1_000_000).toFixed(1)}M`
        : 'undisclosed price';

      alerts.push({
        id: generateId(),
        type: 'ownership_change',
        building_id: b.id,
        building_address: b.address,
        title: `Recent Ownership Transfer — ${monthsAgo}mo ago`,
        description: `${b.address} was sold from ${seller} to ${buyer} for ${price}. New owners may be evaluating management.`,
        severity: monthsAgo <= 2 ? 'critical' : monthsAgo <= 4 ? 'high' : 'medium',
        data: {
          saleDate: acris.lastSaleDate,
          salePrice: acris.lastSalePrice,
          buyer,
          seller,
          monthsAgo,
        },
        created_at: new Date().toISOString(),
        read: false,
      });
    }
  }

  return alerts;
}

// ============================================================
// Detector: 311 Surge
// ============================================================

/**
 * Query 311 API for an address. Flag if >10 complaints in 90 days.
 */
export async function detect311Surge(
  address: string,
  borough?: string,
): Promise<Alert | null> {
  try {
    const complaints = await fetch311Complaints(address, borough, 90);
    if (complaints.length <= 10) return null;

    // Group by type for detail
    const typeCounts: Record<string, number> = {};
    for (const c of complaints) {
      typeCounts[c.complaint_type] = (typeCounts[c.complaint_type] || 0) + 1;
    }
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t, n]) => `${t} (${n})`)
      .join(', ');

    const severity: AlertSeverity =
      complaints.length > 30 ? 'critical' : complaints.length > 20 ? 'high' : 'medium';

    return {
      id: generateId(),
      type: '311_surge',
      building_id: '',
      building_address: address,
      title: `311 Complaint Surge — ${complaints.length} in 90 days`,
      description: `${address} has ${complaints.length} complaints in the last 90 days. Top issues: ${topTypes}. This building may be in distress.`,
      severity,
      data: {
        complaintCount: complaints.length,
        typeCounts,
        topTypes,
        period: '90 days',
      },
      created_at: new Date().toISOString(),
      read: false,
    };
  } catch (err) {
    console.error('detect311Surge error:', err);
    return null;
  }
}

// ============================================================
// Detector: Violation Spike
// ============================================================

/**
 * Flag buildings with >5 new violations in the last 30 days.
 * Uses enriched_data.violations for pre-fetched data.
 */
export function detectViolationSpike(building: Building): Alert | null {
  const violations = building.enriched_data?.violations?.items;
  if (!Array.isArray(violations) || violations.length === 0) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentViolations = violations.filter((v: any) => {
    const date = new Date(v.inspectiondate || v.approveddate || '');
    return !isNaN(date.getTime()) && date > thirtyDaysAgo;
  });

  if (recentViolations.length <= 5) return null;

  const classC = recentViolations.filter((v: any) => v.class === 'C').length;
  const classB = recentViolations.filter((v: any) => v.class === 'B').length;

  const severity: AlertSeverity =
    classC >= 3 ? 'critical' : recentViolations.length > 15 ? 'critical' : recentViolations.length > 10 ? 'high' : 'medium';

  return {
    id: generateId(),
    type: 'violation_spike',
    building_id: building.id,
    building_address: building.address,
    title: `Violation Spike — ${recentViolations.length} in 30 days`,
    description: `${building.address} has ${recentViolations.length} new violations in the last 30 days (${classC} Class C, ${classB} Class B). Possible management breakdown.`,
    severity,
    data: {
      recentCount: recentViolations.length,
      classC,
      classB,
      totalOpen: building.open_violations_count,
    },
    created_at: new Date().toISOString(),
    read: false,
  };
}

// ============================================================
// Main: Generate All Alerts
// ============================================================

/**
 * Run all detectors against a set of buildings.
 * Returns combined Alert[] sorted by severity then date.
 */
export async function generateAlerts(buildings: Building[]): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // 1. Ownership changes (sync)
  alerts.push(...detectOwnershipChanges(buildings));

  // 2. Violation spikes (sync)
  for (const b of buildings) {
    const alert = detectViolationSpike(b);
    if (alert) alerts.push(alert);
  }

  // 3. 311 surges (async — batch with concurrency limit)
  const CONCURRENCY = 3;
  const buildingsWithAddresses = buildings.filter((b) => b.address);
  for (let i = 0; i < buildingsWithAddresses.length; i += CONCURRENCY) {
    const batch = buildingsWithAddresses.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((b) => detect311Surge(b.address, b.borough)),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        // Attach building_id to the 311 alert
        const bIdx = buildingsWithAddresses.indexOf(batch[results.indexOf(r)]);
        if (bIdx >= 0) r.value.building_id = buildingsWithAddresses[bIdx].id;
        alerts.push(r.value);
      }
    }
  }

  // Sort: critical first, then by date descending
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  alerts.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return alerts;
}
