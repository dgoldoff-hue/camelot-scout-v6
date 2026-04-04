/**
 * Contact Enrichment — Apollo.io and Prospeo integration
 */

import type { Contact } from '@/types';

const APOLLO_BASE = 'https://api.apollo.io/v1';
const PROSPEO_BASE = 'https://api.prospeo.io';

/**
 * Search for contacts associated with a building/company via Apollo.io
 */
export async function enrichWithApollo(params: {
  companyName?: string;
  address?: string;
  domain?: string;
}): Promise<Contact[]> {
  const apiKey = import.meta.env.VITE_APOLLO_API_KEY;
  if (!apiKey) {
    console.warn('Apollo.io API key not configured');
    return [];
  }

  try {
    // Search for organization first
    const orgRes = await fetch(`${APOLLO_BASE}/organizations/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_organization_name: params.companyName || params.address,
        page: 1,
        per_page: 5,
      }),
    });

    if (!orgRes.ok) {
      console.error('Apollo org search failed:', orgRes.status);
      return [];
    }

    const orgData = await orgRes.json();
    const org = orgData.organizations?.[0];
    if (!org) return [];

    // Search for people at the organization
    const peopleRes = await fetch(`${APOLLO_BASE}/people/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_organization_id: org.id,
        page: 1,
        per_page: 25,
        person_titles: [
          'board president',
          'president',
          'treasurer',
          'secretary',
          'board member',
          'director',
          'property manager',
          'managing agent',
          'superintendent',
          'owner',
          'principal',
        ],
      }),
    });

    if (!peopleRes.ok) {
      console.error('Apollo people search failed:', peopleRes.status);
      return [];
    }

    const peopleData = await peopleRes.json();
    return (peopleData.people || []).map((p: any) => ({
      name: `${p.first_name} ${p.last_name}`,
      role: p.title || 'Unknown',
      email: p.email,
      phone: p.phone_numbers?.[0]?.sanitized_number,
      linkedin: p.linkedin_url,
      source: 'apollo',
      verified_at: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Apollo enrichment error:', err);
    return [];
  }
}

/**
 * Verify/find email via Prospeo
 */
export async function enrichWithProspeo(params: {
  firstName?: string;
  lastName?: string;
  company?: string;
  domain?: string;
}): Promise<{ email?: string; phone?: string }> {
  const apiKey = import.meta.env.VITE_PROSPEO_API_KEY;
  if (!apiKey) {
    console.warn('Prospeo API key not configured');
    return {};
  }

  try {
    const res = await fetch(`${PROSPEO_BASE}/email-finder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': apiKey,
      },
      body: JSON.stringify({
        first_name: params.firstName,
        last_name: params.lastName,
        company: params.company,
        domain: params.domain,
      }),
    });

    if (!res.ok) return {};
    const data = await res.json();
    return {
      email: data.email,
      phone: data.phone,
    };
  } catch (err) {
    console.error('Prospeo enrichment error:', err);
    return {};
  }
}

/**
 * Enrich a building's contacts by trying Apollo first, then Prospeo fallback
 */
export async function enrichBuildingContacts(params: {
  buildingName?: string;
  address: string;
  currentManagement?: string;
}): Promise<Contact[]> {
  // Try Apollo first
  let contacts = await enrichWithApollo({
    companyName: params.currentManagement || params.buildingName,
    address: params.address,
  });

  // For each contact without email, try Prospeo
  for (const contact of contacts) {
    if (!contact.email && contact.name) {
      const [firstName, ...lastParts] = contact.name.split(' ');
      const lastName = lastParts.join(' ');
      if (firstName && lastName) {
        const prospeoResult = await enrichWithProspeo({
          firstName,
          lastName,
          company: params.currentManagement || params.buildingName,
        });
        if (prospeoResult.email) contact.email = prospeoResult.email;
        if (prospeoResult.phone && !contact.phone) contact.phone = prospeoResult.phone;
      }
    }
  }

  return contacts;
}

/**
 * Check if enrichment APIs are configured
 */
export function isEnrichmentConfigured(): { apollo: boolean; prospeo: boolean } {
  return {
    apollo: !!import.meta.env.VITE_APOLLO_API_KEY,
    prospeo: !!import.meta.env.VITE_PROSPEO_API_KEY,
  };
}
