import type { RegionGroup } from '@/types';

export const REGIONS: RegionGroup[] = [
  {
    name: 'Manhattan',
    tag: 'LIVE',
    areas: [
      'Upper East Side', 'Upper West Side', 'Midtown East', 'Midtown West',
      'Chelsea', 'Gramercy Park', 'Murray Hill', 'East Village',
      'West Village', 'Greenwich Village', 'SoHo', 'Tribeca',
      'Financial District', 'Lower East Side', 'Harlem', 'Washington Heights',
      'Inwood'
    ],
  },
  {
    name: 'Brooklyn',
    tag: 'LIVE',
    areas: [
      'Brooklyn Heights', 'Park Slope', 'Williamsburg', 'DUMBO',
      'Fort Greene', 'Carroll Gardens', 'Cobble Hill', 'Boerum Hill',
      'Prospect Heights', 'Crown Heights', 'Bed-Stuy', 'Bushwick',
      'Bay Ridge', 'Sunset Park'
    ],
  },
  {
    name: 'Queens',
    tag: 'LIVE',
    areas: [
      'Astoria', 'Long Island City', 'Jackson Heights', 'Forest Hills',
      'Flushing', 'Bayside', 'Rego Park', 'Elmhurst',
      'Jamaica', 'Kew Gardens'
    ],
  },
  {
    name: 'Bronx',
    tag: 'LIVE',
    areas: [
      'Riverdale', 'Pelham Bay', 'Morris Park', 'Fordham',
      'Kingsbridge', 'Mott Haven', 'Concourse', 'Throgs Neck'
    ],
  },
  {
    name: 'Staten Island',
    tag: 'LIVE',
    areas: [
      'St. George', 'Todt Hill', 'Great Kills', 'New Dorp',
      'Stapleton', 'Tottenville'
    ],
  },
  {
    name: 'Westchester',
    tag: 'AI-powered research',
    areas: [
      'White Plains', 'New Rochelle', 'Yonkers', 'Mount Vernon',
      'Scarsdale', 'Bronxville', 'Tuckahoe', 'Eastchester',
      'Mamaroneck', 'Larchmont', 'Rye', 'Port Chester',
      'Tarrytown', 'Dobbs Ferry', 'Hastings-on-Hudson'
    ],
  },
  {
    name: 'New Jersey',
    tag: 'AI-powered research',
    areas: [
      'Jersey City', 'Hoboken', 'Fort Lee', 'Edgewater',
      'Weehawken', 'West New York', 'North Bergen', 'Hackensack'
    ],
  },
  {
    name: 'Connecticut',
    tag: 'AI-powered research',
    areas: [
      'Stamford', 'Greenwich', 'Norwalk', 'Bridgeport',
      'New Haven', 'Westport', 'Darien', 'Cos Cob',
      'Old Greenwich'
    ],
  },
  {
    name: 'Long Island',
    tag: 'AI-powered research',
    areas: [
      'Garden City', 'Great Neck', 'Manhasset', 'Roslyn',
      'Oyster Bay', 'Huntington', 'Rockville Centre', 'Hempstead'
    ],
  },
  {
    name: 'Hamptons',
    tag: 'AI-powered research',
    areas: [
      'Southampton', 'East Hampton', 'Sag Harbor', 'Bridgehampton',
      'Montauk', 'Westhampton Beach', 'Amagansett', 'Water Mill',
      'Shelter Island'
    ],
  },
  {
    name: 'Miami',
    tag: 'AI-powered research',
    areas: [
      'Brickell', 'Downtown Miami', 'Wynwood', 'Edgewater',
      'Coconut Grove', 'Coral Gables', 'Design District', 'Little Havana'
    ],
  },
  {
    name: 'Miami Beach',
    tag: 'AI-powered research',
    areas: [
      'South Beach', 'Mid-Beach', 'North Beach', 'Bal Harbour',
      'Surfside', 'Sunny Isles Beach'
    ],
  },
  {
    name: 'North Miami',
    tag: 'AI-powered research',
    areas: [
      'North Miami Beach', 'Aventura', 'North Bay Village',
      'Bay Harbor Islands', 'Indian Creek'
    ],
  },
  {
    name: 'Fort Lauderdale',
    tag: 'AI-powered research',
    areas: [
      'Las Olas', 'Victoria Park', 'Rio Vista', 'Harbor Beach',
      'Lauderdale-by-the-Sea', 'Pompano Beach'
    ],
  },
  {
    name: 'Boca Raton / Delray',
    tag: 'AI-powered research',
    areas: [
      'Boca Raton', 'Delray Beach', 'Highland Beach',
      'Boynton Beach', 'Lake Worth'
    ],
  },
  {
    name: 'Palm Beach',
    tag: 'AI-powered research',
    areas: [
      'Palm Beach', 'West Palm Beach', 'Palm Beach Gardens',
      'Jupiter', 'Singer Island', 'North Palm Beach'
    ],
  },
  {
    name: 'Fashion District',
    tag: 'AI-powered research',
    areas: [
      'Garment District', 'Flower District', 'Fur District', 'Photo District'
    ],
  },
];

export function getRegionByArea(area: string): RegionGroup | undefined {
  return REGIONS.find((r) => r.areas.includes(area));
}

export function isLiveRegion(regionName: string): boolean {
  const region = REGIONS.find((r) => r.name === regionName);
  return region?.tag === 'LIVE';
}

export function getAllAreas(): string[] {
  return REGIONS.flatMap((r) => r.areas);
}

export function getNYCBoroughs(): string[] {
  return ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
}

const FLORIDA_REGION_NAMES = ['Miami', 'Miami Beach', 'North Miami', 'Fort Lauderdale', 'Boca Raton / Delray', 'Palm Beach'];

export function isFloridaRegion(regionName: string): boolean {
  return FLORIDA_REGION_NAMES.includes(regionName);
}

export function isFloridaArea(area: string): boolean {
  return REGIONS
    .filter((r) => FLORIDA_REGION_NAMES.includes(r.name))
    .some((r) => r.areas.includes(area));
}

export function getFloridaAreas(): string[] {
  return REGIONS
    .filter((r) => FLORIDA_REGION_NAMES.includes(r.name))
    .flatMap((r) => r.areas);
}
