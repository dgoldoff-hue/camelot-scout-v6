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
