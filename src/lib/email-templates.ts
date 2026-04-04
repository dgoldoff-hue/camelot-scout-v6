/**
 * Email Template Engine
 * Replaces template variables with building/contact data
 */

import type { Building, Contact, OutreachTemplate } from '@/types';

export interface TemplateVariables {
  building_name: string;
  address: string;
  borough: string;
  unit_count: string;
  building_type: string;
  violations_count: string;
  open_violations: string;
  contact_name: string;
  contact_role: string;
  current_management: string;
  market_value: string;
  score: string;
  grade: string;
  year_built: string;
  energy_star_score: string;
  [key: string]: string;
}

/**
 * Build template variables from a building and contact
 */
export function buildVariables(building: Building, contact?: Contact): TemplateVariables {
  return {
    building_name: building.name || building.address,
    address: building.address,
    borough: building.borough || building.region || '',
    unit_count: String(building.units || 'N/A'),
    building_type: building.type || 'residential',
    violations_count: String(building.violations_count || 0),
    open_violations: String(building.open_violations_count || 0),
    contact_name: contact?.name || 'Board Member',
    contact_role: contact?.role || '',
    current_management: building.current_management || 'current management',
    market_value: building.market_value
      ? `$${(building.market_value / 1000000).toFixed(1)}M`
      : 'N/A',
    score: String(building.score),
    grade: building.grade,
    year_built: String(building.year_built || 'N/A'),
    energy_star_score: String(building.energy_star_score || 'N/A'),
  };
}

/**
 * Replace all {variable} placeholders in a template string
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Render a full outreach email from template + building + contact
 */
export function renderOutreachEmail(
  template: OutreachTemplate,
  building: Building,
  contact?: Contact
): { subject: string; body: string } {
  const vars = buildVariables(building, contact);
  return {
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
  };
}

// ============================================================
// LL97 Compliance Outreach Email
// ============================================================

export interface ComplianceEmailData {
  address: string;
  annualPenalty: number;
  tenYearExposure: number;
  complianceStatus: string;
  buildingType: string;
  emissionsOverLimit: number;
  energyStarScore?: number;
  period2Penalty?: number;
}

/**
 * Generate a professional LL97 compliance outreach email.
 * Highlights the building's estimated penalty and offers Camelot's services.
 */
export function generateComplianceOutreachEmail(data: ComplianceEmailData): { subject: string; body: string } {
  const subject = `Your Building at ${data.address} — LL97 Compliance Alert`;

  const penaltyLine = data.annualPenalty > 0
    ? `Based on publicly available NYC benchmarking data, your building at ${data.address} is currently estimated to face an annual LL97 penalty of $${data.annualPenalty.toLocaleString()}.`
    : `Based on publicly available NYC benchmarking data, your building at ${data.address} is currently close to exceeding its LL97 carbon emission limits.`;

  const exposureLine = data.tenYearExposure > 0
    ? `Over the compliance period, this translates to a total exposure of approximately $${data.tenYearExposure.toLocaleString()}.`
    : '';

  const period2Line = data.period2Penalty && data.period2Penalty > 0
    ? `\n\nImportantly, when Period 2 limits take effect in 2030, the penalty is projected to increase to $${data.period2Penalty.toLocaleString()} per year — making early action critical.`
    : '';

  const energyStarLine = data.energyStarScore
    ? `\n\nYour building's Energy Star score of ${data.energyStarScore} ${data.energyStarScore < 50 ? 'suggests significant room for energy efficiency improvements' : 'indicates a solid baseline, but further optimization may still be needed to avoid penalties'}.`
    : '';

  const body = `Dear Building Owner / Board Member,

I hope this message finds you well. I'm reaching out regarding an important regulatory matter that may impact your property.

${penaltyLine} ${exposureLine}${period2Line}${energyStarLine}

Your building currently exceeds its carbon limit by approximately ${data.emissionsOverLimit.toFixed(1)} metric tons of CO2 — and NYC Local Law 97 imposes a penalty of $268 for every metric ton over the cap.

At Camelot Realty Group, we specialize in helping building owners navigate LL97 compliance. Our services include:

  • Comprehensive energy audits and benchmarking analysis
  • Capital improvement planning to reduce emissions
  • Coordination with engineers, contractors, and utility programs
  • Full-service property management with sustainability built in
  • Compliance tracking and reporting to the city

Many of our clients have reduced their projected penalties by 40–60% through strategic energy retrofits and operational improvements.

I'd welcome the opportunity to discuss your building's specific situation and how we can help you reduce or eliminate these penalties entirely.

Would you be available for a brief call this week?

Best regards,

Camelot Realty Group
477 Madison Avenue, 6th Fl
New York, NY 10022
Phone: (212) 206-9939
Web: www.camelot.nyc`;

  return { subject, body };
}

/**
 * Get list of available template variables with descriptions
 */
export function getAvailableVariables(): { key: string; description: string }[] {
  return [
    { key: 'building_name', description: 'Building name or address' },
    { key: 'address', description: 'Full street address' },
    { key: 'borough', description: 'Borough or region' },
    { key: 'unit_count', description: 'Number of residential units' },
    { key: 'building_type', description: 'Building type (co-op, condo, etc.)' },
    { key: 'violations_count', description: 'Total HPD violations' },
    { key: 'open_violations', description: 'Open/unresolved violations' },
    { key: 'contact_name', description: 'Contact person name' },
    { key: 'contact_role', description: 'Contact person role/title' },
    { key: 'current_management', description: 'Current management company' },
    { key: 'market_value', description: 'DOF market value' },
    { key: 'score', description: 'Lead score (0-100)' },
    { key: 'grade', description: 'Lead grade (A/B/C)' },
    { key: 'year_built', description: 'Year building was constructed' },
    { key: 'energy_star_score', description: 'Energy Star score' },
  ];
}
