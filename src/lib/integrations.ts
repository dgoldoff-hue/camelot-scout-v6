import type { Building, Contact } from '@/types';

export type LeadTier = 'hot' | 'warm' | 'cold' | 'review';

export interface LeadQualityResult {
  score: number;
  tier: LeadTier;
  missingFields: string[];
  strengths: string[];
  warnings: string[];
}

export interface LeadRoutingResult {
  team: string;
  region: string;
  priority: 'same-day' | '24-48 hours' | 'nurture';
  tags: string[];
}

export interface IntegrationStatus {
  scout: {
    configured: boolean;
    apiUrlSet: boolean;
    workspaceSet: boolean;
    localQueueSize?: number;
  };
  hubspot: {
    configured: boolean;
    dealsEnabled: boolean;
    associationEndpoint: string;
  };
  timestamp: string;
}

export interface IntegrationPushResult {
  status: 'ok' | 'partial' | 'skipped' | 'error';
  quality: LeadQualityResult;
  routing: LeadRoutingResult;
  scout: ServicePushResult;
  hubspot: ServicePushResult;
}

export interface ServicePushResult {
  status: 'ok' | 'skipped' | 'error';
  message: string;
  id?: string;
  url?: string;
  warnings?: string[];
}

export function parseContactName(fullName?: string) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstname: parts[0] || '',
    lastname: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
}

export function normalizePhone(phone?: string) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

export function getPrimaryContact(building: Building): Contact | undefined {
  return (
    building.contacts.find((contact) => contact.email) ||
    building.contacts.find((contact) => contact.phone) ||
    building.contacts[0]
  );
}

export function auditLeadQuality(building: Building): LeadQualityResult {
  const missingFields: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (building.address) score += 15;
  else missingFields.push('property address');

  if (building.units && building.units > 0) {
    score += building.units >= 30 ? 15 : 8;
    strengths.push(`${building.units} units identified`);
  } else {
    missingFields.push('unit count');
  }

  if (building.type) score += 8;
  else missingFields.push('asset class');

  if (building.borough || building.region || building.neighborhood || building.zip_code) {
    score += 8;
    strengths.push('geography available for routing');
  } else {
    missingFields.push('borough / region / zip');
  }

  const primaryContact = getPrimaryContact(building);
  if (primaryContact?.email) {
    score += 18;
    strengths.push('email contact available');
  } else {
    missingFields.push('verified email contact');
  }

  if (primaryContact?.phone || building.contacts.some((contact) => contact.phone)) {
    score += 10;
    strengths.push('phone contact available');
  } else {
    missingFields.push('phone contact');
  }

  if (building.current_management && !/unknown|verify/i.test(building.current_management)) {
    score += 8;
    strengths.push('current management identified');
  } else {
    warnings.push('current management should be verified before a board-facing push');
  }

  if ((building.market_value || 0) > 0 || (building.assessed_value || 0) > 0) {
    score += 6;
    strengths.push('valuation or assessment signal available');
  } else {
    warnings.push('market value is missing or zero');
  }

  if ((building.open_violations_count || 0) > 0 || (building.violations_count || 0) > 0) {
    score += 6;
    strengths.push('compliance pain point available');
  }

  if (building.signals?.length) {
    score += Math.min(6, building.signals.length * 2);
    strengths.push('Scout signal history present');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier: LeadTier =
    missingFields.includes('property address') || missingFields.includes('unit count')
      ? 'review'
      : score >= 76
        ? 'hot'
        : score >= 55
          ? 'warm'
          : 'cold';

  return { score, tier, missingFields, strengths, warnings };
}

export function routeLead(building: Building, quality = auditLeadQuality(building)): LeadRoutingResult {
  const region = building.borough || building.region || building.neighborhood || building.zip_code || 'Unassigned';
  const units = building.units || 0;
  const tags = new Set<string>([
    `tier:${quality.tier}`,
    `region:${region}`,
    `asset:${building.type || 'unknown'}`,
  ]);

  if (units >= 100) tags.add('large-building');
  if ((building.open_violations_count || 0) > 0) tags.add('compliance-pain');
  if (/self/i.test(building.current_management || '')) tags.add('self-managed-review');
  if ((building.market_value || 0) <= 0) tags.add('valuation-needed');

  const team =
    quality.tier === 'hot'
      ? 'David / Jackie priority desk'
      : quality.tier === 'warm'
        ? 'Scout outreach team'
        : quality.tier === 'review'
          ? 'Data quality review'
          : 'Nurture queue';

  const priority =
    quality.tier === 'hot' ? 'same-day' : quality.tier === 'warm' ? '24-48 hours' : 'nurture';

  return { team, region, priority, tags: [...tags] };
}

export function buildIntegrationLeadPayload(building: Building) {
  const contact = getPrimaryContact(building);
  const quality = auditLeadQuality(building);
  const routing = routeLead(building, quality);
  const nameParts = parseContactName(contact?.name);

  return {
    building: {
      id: building.id,
      name: building.name || building.address,
      address: building.address,
      borough: building.borough,
      region: building.region,
      neighborhood: building.neighborhood,
      zip_code: building.zip_code,
      units: building.units,
      type: building.type,
      score: building.score,
      grade: building.grade,
      current_management: building.current_management,
      market_value: building.market_value,
      assessed_value: building.assessed_value,
      violations_count: building.violations_count,
      open_violations_count: building.open_violations_count,
      signals: building.signals || [],
      tags: building.tags || [],
    },
    contact: contact
      ? {
          name: contact.name,
          firstname: nameParts.firstname,
          lastname: nameParts.lastname,
          email: contact.email,
          phone: normalizePhone(contact.phone),
          role: contact.role,
          company: contact.company,
        }
      : undefined,
    quality,
    routing,
  };
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const response = await fetch('/api/integrations/status');
  if (!response.ok) throw new Error(`Integration status failed: ${response.status}`);
  return response.json();
}

export async function pushBuildingToIntegrations(building: Building): Promise<IntegrationPushResult> {
  const response = await fetch('/api/integrations/push-building', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildIntegrationLeadPayload(building)),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && !data?.quality) {
    throw new Error(data?.error || `Integration push failed: ${response.status}`);
  }
  return data;
}
