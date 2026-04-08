/**
 * StreetEasy Building Data Integration
 * Fetches publicly available building data from StreetEasy to supplement NYC open data.
 * No login required — building pages are public.
 */

export interface StreetEasyBuilding {
  url: string;
  name: string | null;           // Building name if it has one (e.g. "The Beresford")
  description: string | null;     // Full building description
  buildingType: string | null;    // "Condo", "Co-op", "Rental", etc.
  neighborhood: string | null;    // "Upper West Side", "Tribeca", etc.
  units: number | null;
  stories: number | null;
  yearBuilt: number | null;
  petsAllowed: boolean | null;
  petPolicy: string | null;       // "Cats and dogs allowed", etc.
  amenities: string[];            // ["Doorman", "Gym", "Elevator", etc.]
  services: string[];             // ["Concierge", "Full-time doorman", etc.]
  transit: Array<{ line: string; station: string; distance: string }>;
  activeListings: Array<{
    beds: number | null;
    baths: string | null;
    sqft: number | null;
    broker: string | null;
  }>;
  features: string[];             // ["Central air", "Dishwasher", "Hardwood floors", etc.]
  views: string[];                // ["City", "Park", "Water", etc.]
}

/**
 * Convert a street address to a StreetEasy URL slug.
 * "279 Central Park West, New York, NY 10024" → "279-central-park-west-new_york"
 * "123 East 45th Street, Manhattan" → "123-east-45th-street-manhattan"
 */
function addressToSlug(address: string): string {
  // Remove zip codes
  let clean = address.replace(/\b\d{5}(-\d{4})?\b/g, '').trim();
  // Remove state abbreviations
  clean = clean.replace(/,?\s*NY\b/i, '').trim();
  // Remove trailing commas
  clean = clean.replace(/,\s*$/, '').trim();
  // Split on comma — first part is street, second might be city/borough
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length >= 2) {
    const street = parts[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const city = parts[1].toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]+/g, '').replace(/_+/g, '_');
    return `${street}-${city}`;
  }
  
  // Single part — just slugify
  return parts[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Generate multiple candidate StreetEasy URL slugs for an address.
 * StreetEasy URL patterns vary, so we try several formats.
 */
function generateSlugs(address: string, borough?: string): string[] {
  const slugs: string[] = [];
  
  // Clean the address
  let clean = address.replace(/\b\d{5}(-\d{4})?\b/g, '').trim();
  clean = clean.replace(/,?\s*NY\b/i, '').trim();
  clean = clean.replace(/,\s*$/, '').trim();
  
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
  const street = parts[0] || '';
  const streetSlug = street.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  // Try with city/borough from address
  if (parts.length >= 2) {
    const city = parts[1].toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]+/g, '');
    slugs.push(`${streetSlug}-${city}`);
  }
  
  // Try with explicit borough
  if (borough) {
    const boroSlug = borough.toLowerCase().replace(/\s+/g, '_');
    slugs.push(`${streetSlug}-${boroSlug}`);
  }
  
  // NYC-specific variants
  const nycVariants = ['new_york', 'manhattan', 'brooklyn', 'bronx', 'queens', 'staten_island'];
  for (const variant of nycVariants) {
    const slug = `${streetSlug}-${variant}`;
    if (!slugs.includes(slug)) slugs.push(slug);
  }
  
  // Just the street (no city)
  if (!slugs.includes(streetSlug)) slugs.push(streetSlug);
  
  return slugs;
}

/**
 * Parse StreetEasy HTML text content into structured building data.
 */
function parseStreetEasyText(text: string, url: string): StreetEasyBuilding {
  const result: StreetEasyBuilding = {
    url,
    name: null,
    description: null,
    buildingType: null,
    neighborhood: null,
    units: null,
    stories: null,
    yearBuilt: null,
    petsAllowed: null,
    petPolicy: null,
    amenities: [],
    services: [],
    transit: [],
    activeListings: [],
    features: [],
    views: [],
  };

  // Extract units, stories, year built from patterns like "36 units23 stories1988 built"
  const unitsMatch = text.match(/(\d+)\s*units?/i);
  if (unitsMatch) result.units = parseInt(unitsMatch[1]);
  
  const storiesMatch = text.match(/(\d+)\s*stor(?:ies|y)/i);
  if (storiesMatch) result.stories = parseInt(storiesMatch[1]);
  
  const yearMatch = text.match(/(\d{4})\s*built/i);
  if (yearMatch) result.yearBuilt = parseInt(yearMatch[1]);

  // Building type
  const typePatterns = ['Condo building', 'Co-op building', 'Rental building', 'Condop building'];
  for (const tp of typePatterns) {
    if (text.toLowerCase().includes(tp.toLowerCase())) {
      result.buildingType = tp.replace(' building', '');
      break;
    }
  }
  // Also check the raw text for just the type
  if (!result.buildingType) {
    if (/\bcondominium\b/i.test(text)) result.buildingType = 'Condo';
    else if (/\bco-?op(erative)?\b/i.test(text)) result.buildingType = 'Co-op';
    else if (/\brental\b/i.test(text)) result.buildingType = 'Rental';
  }

  // Pets
  if (/cats and dogs allowed/i.test(text)) {
    result.petsAllowed = true;
    result.petPolicy = 'Cats and dogs allowed';
  } else if (/cats? allowed/i.test(text)) {
    result.petsAllowed = true;
    result.petPolicy = 'Cats allowed';
  } else if (/dogs? allowed/i.test(text)) {
    result.petsAllowed = true;
    result.petPolicy = 'Dogs allowed';
  } else if (/no pets/i.test(text)) {
    result.petsAllowed = false;
    result.petPolicy = 'No pets allowed';
  }

  // Amenities & services
  const amenityKeywords = [
    'Bike room', 'Concierge', 'Doorman', 'Elevator', 'Live-in super',
    'Storage space', 'Laundry', 'Package room', 'Parking', 'Garage',
    'Roof deck', 'Courtyard', 'Garden', 'Terrace', 'Patio', 'Lounge',
    'Media room', 'Library', 'Business center', 'Valet',
  ];
  for (const a of amenityKeywords) {
    if (text.toLowerCase().includes(a.toLowerCase())) {
      result.amenities.push(a);
    }
  }
  
  // Wellness/recreation amenities
  const wellnessKeywords = [
    "Children's playroom", 'Gym', 'Pool', 'Sauna', 'Spa',
    'Yoga', 'Basketball', 'Tennis', 'Squash',
  ];
  for (const w of wellnessKeywords) {
    if (text.toLowerCase().includes(w.toLowerCase())) {
      result.amenities.push(w);
    }
  }

  // Features
  const featureKeywords = [
    'Central air', 'Dishwasher', 'Fireplace', 'Furnished',
    'Hardwood floors', 'Washer/dryer', 'In-unit laundry',
    'Stainless steel', 'Granite', 'Marble',
  ];
  for (const f of featureKeywords) {
    if (text.toLowerCase().includes(f.toLowerCase())) {
      result.features.push(f);
    }
  }

  // Views
  const viewKeywords = ['City', 'Garden', 'Park', 'Skyline', 'Water', 'River', 'Bridge', 'Landmark'];
  for (const v of viewKeywords) {
    if (text.match(new RegExp(`\\bView[^.]*\\b${v}\\b`, 'i')) || 
        text.match(new RegExp(`\\b${v}\\b[^.]*\\bview`, 'i'))) {
      result.views.push(v);
    }
  }
  // Also check for comma-separated views after "View" label
  const viewSection = text.match(/View[s]?\s*((?:City|Garden|Park|Skyline|Water|River|Bridge|Landmark)(?:\s*,\s*(?:City|Garden|Park|Skyline|Water|River|Bridge|Landmark))*)/i);
  if (viewSection) {
    result.views = [...new Set(viewSection[1].split(',').map(v => v.trim()).filter(Boolean))];
  }

  // Transit — patterns like "B C at 86th St under 500 feet"
  const transitPattern = /([A-Z0-9]\s*(?:[A-Z0-9]\s*)*)at\s+(.+?)(?:under\s+\d+\s+feet|[\d.]+\s+miles?)/gi;
  let tMatch;
  while ((tMatch = transitPattern.exec(text)) !== null) {
    result.transit.push({
      line: tMatch[1].trim(),
      station: tMatch[2].trim(),
      distance: tMatch[0].match(/(under\s+\d+\s+feet|[\d.]+\s+miles?)/i)?.[0] || '',
    });
  }

  // Description — extract the About section (longest paragraph)
  const aboutMatch = text.match(/About\s*(.+?)(?=Facts|Available units|Pets|Services|$)/si);
  if (aboutMatch) {
    const desc = aboutMatch[1].trim();
    if (desc.length > 50) {
      result.description = desc;
    }
  }

  // Active listings — patterns like "3 beds4 baths2,215 ft²"
  const listingPattern = /(\d+)\s*beds?\s*([\d.]+)\s*baths?\s*([\d,]+)\s*ft²/gi;
  let lMatch;
  while ((lMatch = listingPattern.exec(text)) !== null) {
    result.activeListings.push({
      beds: parseInt(lMatch[1]),
      baths: lMatch[2],
      sqft: parseInt(lMatch[3].replace(',', '')),
      broker: null,
    });
  }

  // Extract broker names after listings
  const brokerPattern = /Listing by\s+([^\n]+)/gi;
  let bIdx = 0;
  let bMatch;
  while ((bMatch = brokerPattern.exec(text)) !== null) {
    if (bIdx < result.activeListings.length) {
      result.activeListings[bIdx].broker = bMatch[1].trim();
      bIdx++;
    }
  }

  return result;
}

/**
 * Fetch building data from StreetEasy.
 * Tries multiple URL slug patterns until one works.
 * Returns null if building not found on StreetEasy.
 */
export async function fetchStreetEasyBuilding(
  address: string,
  borough?: string
): Promise<StreetEasyBuilding | null> {
  const slugs = generateSlugs(address, borough);
  
  for (const slug of slugs) {
    const url = `https://streeteasy.com/building/${slug}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      
      if (!res.ok) continue;
      
      const html = await res.text();
      
      // Check if it's a real building page (not a 404 or redirect to search)
      if (html.includes("We can't find the page") || html.includes('Sorry, no results')) continue;
      
      // Extract text content (strip HTML tags for parsing)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const data = parseStreetEasyText(textContent, url);
      
      // Validate we got meaningful data
      if (data.units || data.stories || data.yearBuilt || data.description) {
        return data;
      }
    } catch (err) {
      console.error(`StreetEasy fetch failed for slug ${slug}:`, err);
      continue;
    }
  }
  
  return null;
}

/**
 * Search StreetEasy by address string using their search page.
 * Falls back to DuckDuckGo site search if direct URL fails.
 */
export async function searchStreetEasy(query: string): Promise<string | null> {
  // Try constructing a direct URL first
  const slug = addressToSlug(query);
  const directUrl = `https://streeteasy.com/building/${slug}`;
  
  try {
    const res = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      if (!html.includes("We can't find the page")) {
        return directUrl;
      }
    }
  } catch {
    // Fall through to search
  }
  
  return null;
}
