/**
 * Tri-State Building Data Generator
 * Generates realistic building entries for Westchester, CT, NJ, Long Island, Hamptons.
 * Marked as "ai_research" source since there's no live government API feed.
 */

import type { Building, BuildingType, Contact } from '@/types';
import { recalculateBuildingScore } from '@/lib/scoring';

interface TriStateBuilding {
  address: string;
  name: string;
  area: string;
  region: string;
  units: number;
  type: BuildingType;
  year_built: number;
  current_management: string;
  market_value: number;
  contacts: Contact[];
  notes: string;
}

const TRISTATE_BUILDINGS: TriStateBuilding[] = [
  // Westchester — White Plains
  { address: '10 City Place, White Plains, NY', name: 'City Center at White Plains', area: 'White Plains', region: 'Westchester', units: 588, type: 'rental', year_built: 2005, current_management: 'AvalonBay Communities', market_value: 250000000, contacts: [{ name: 'Regional Manager', role: 'managing_agent' }], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '1 Westchester Park Drive, White Plains, NY', name: 'Westchester Park Condominiums', area: 'White Plains', region: 'Westchester', units: 164, type: 'condo', year_built: 1980, current_management: 'Unknown', market_value: 65000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '4 Martine Avenue, White Plains, NY', name: 'The Residences at Martine', area: 'White Plains', region: 'Westchester', units: 192, type: 'rental', year_built: 2019, current_management: 'Greystar', market_value: 120000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — New Rochelle
  { address: '360 Huguenot Street, New Rochelle, NY', name: 'Trump Plaza', area: 'New Rochelle', region: 'Westchester', units: 174, type: 'condo', year_built: 2008, current_management: 'Unknown', market_value: 85000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '175 Huguenot Street, New Rochelle, NY', name: 'The Residences at Hartley Park', area: 'New Rochelle', region: 'Westchester', units: 440, type: 'rental', year_built: 2020, current_management: 'Wilder Balter Partners', market_value: 200000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Yonkers
  { address: '1 Warburton Avenue, Yonkers, NY', name: 'River Club at Hudson Park', area: 'Yonkers', region: 'Westchester', units: 514, type: 'rental', year_built: 2005, current_management: 'Collins Enterprises', market_value: 180000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '25 Rockledge Avenue, Yonkers, NY', name: 'The Lofts at Saw Mill River', area: 'Yonkers', region: 'Westchester', units: 132, type: 'rental', year_built: 2015, current_management: 'Unknown', market_value: 55000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Mamaroneck
  { address: '213 Halsey Avenue, Mamaroneck, NY', name: 'Augustin Building', area: 'Mamaroneck', region: 'Westchester', units: 1, type: 'mixed-use', year_built: 1955, current_management: 'Self-Managed', market_value: 2500000, contacts: [{ name: 'David Goldoff', role: 'owner', email: 'dgoldoff@camelot.nyc', phone: '(646) 523-9068' }], notes: '🏘️ Westchester — Camelot acquisition target' },
  // Westchester — Scarsdale / Bronxville
  { address: '3 Pondfield Road, Bronxville, NY', name: 'Pondfield Apartments', area: 'Bronxville', region: 'Westchester', units: 48, type: 'co-op', year_built: 1940, current_management: 'Unknown', market_value: 32000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '1 Scarsdale Road, Tuckahoe, NY', name: 'Scarsdale Manor', area: 'Tuckahoe', region: 'Westchester', units: 96, type: 'co-op', year_built: 1950, current_management: 'Unknown', market_value: 42000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },

  // Westchester — Mount Vernon
  { address: '125 Prospect Avenue, Mount Vernon, NY', name: 'Prospect Hill Co-ops', area: 'Mount Vernon', region: 'Westchester', units: 84, type: 'co-op', year_built: 1958, current_management: 'Unknown', market_value: 28000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  { address: '225 North Columbus Avenue, Mount Vernon, NY', name: 'Columbus Avenue Apartments', area: 'Mount Vernon', region: 'Westchester', units: 110, type: 'rental', year_built: 1972, current_management: 'Unknown', market_value: 35000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Scarsdale
  { address: '20 Overhill Road, Scarsdale, NY', name: 'Overhill Gardens', area: 'Scarsdale', region: 'Westchester', units: 52, type: 'co-op', year_built: 1948, current_management: 'Unknown', market_value: 38000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Eastchester
  { address: '2 Lake Street, Eastchester, NY', name: 'Lake Street Residences', area: 'Eastchester', region: 'Westchester', units: 64, type: 'co-op', year_built: 1960, current_management: 'Unknown', market_value: 22000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Larchmont
  { address: '1 Fountain Square, Larchmont, NY', name: 'Fountain Square Condominiums', area: 'Larchmont', region: 'Westchester', units: 36, type: 'condo', year_built: 1985, current_management: 'Unknown', market_value: 32000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Rye
  { address: '150 Purchase Street, Rye, NY', name: 'Rye Colony Club', area: 'Rye', region: 'Westchester', units: 88, type: 'co-op', year_built: 1965, current_management: 'Unknown', market_value: 48000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Port Chester
  { address: '140 Abendroth Avenue, Port Chester, NY', name: 'Abendroth Park Residences', area: 'Port Chester', region: 'Westchester', units: 72, type: 'rental', year_built: 2017, current_management: 'Unknown', market_value: 32000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Tarrytown
  { address: '100 Riverview Drive, Tarrytown, NY', name: 'Hudson House on the River', area: 'Tarrytown', region: 'Westchester', units: 56, type: 'condo', year_built: 2002, current_management: 'Unknown', market_value: 40000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Dobbs Ferry
  { address: '1 Main Street, Dobbs Ferry, NY', name: 'Rivertowns Square', area: 'Dobbs Ferry', region: 'Westchester', units: 132, type: 'rental', year_built: 2018, current_management: 'Ginsburg Development', market_value: 65000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },
  // Westchester — Hastings-on-Hudson
  { address: '45 Main Street, Hastings-on-Hudson, NY', name: 'Hastings Landing', area: 'Hastings-on-Hudson', region: 'Westchester', units: 48, type: 'condo', year_built: 2008, current_management: 'Unknown', market_value: 28000000, contacts: [], notes: '🏘️ Westchester — AI-researched data (verify independently)' },

  // Hamptons — Sag Harbor
  { address: '2 Main Street, Sag Harbor, NY', name: 'Sag Harbor Wharf Residences', area: 'Sag Harbor', region: 'Hamptons', units: 32, type: 'condo', year_built: 2018, current_management: 'Unknown', market_value: 58000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  { address: '129 Hampton Street, Sag Harbor, NY', name: 'Hampton Street Apartments', area: 'Sag Harbor', region: 'Hamptons', units: 16, type: 'rental', year_built: 1985, current_management: 'Unknown', market_value: 12000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Bridgehampton
  { address: '2462 Montauk Highway, Bridgehampton, NY', name: 'Bridgehampton Commons', area: 'Bridgehampton', region: 'Hamptons', units: 22, type: 'condo', year_built: 2012, current_management: 'Unknown', market_value: 45000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Montauk
  { address: '88 South Emerson Avenue, Montauk, NY', name: 'Montauk Shores Condominiums', area: 'Montauk', region: 'Hamptons', units: 64, type: 'condo', year_built: 1971, current_management: 'Unknown', market_value: 35000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  { address: '20 Surfside Drive, Montauk, NY', name: 'Surfside Apartments', area: 'Montauk', region: 'Hamptons', units: 28, type: 'condo', year_built: 1978, current_management: 'Unknown', market_value: 22000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Westhampton Beach
  { address: '105 Sunset Avenue, Westhampton Beach, NY', name: 'Westhampton Beach Club Residences', area: 'Westhampton Beach', region: 'Hamptons', units: 36, type: 'condo', year_built: 2008, current_management: 'Unknown', market_value: 52000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Amagansett
  { address: '321 Main Street, Amagansett, NY', name: 'Amagansett Square', area: 'Amagansett', region: 'Hamptons', units: 14, type: 'condo', year_built: 2015, current_management: 'Unknown', market_value: 38000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Water Mill
  { address: '670 Montauk Highway, Water Mill, NY', name: 'Water Mill Commons', area: 'Water Mill', region: 'Hamptons', units: 20, type: 'condo', year_built: 2016, current_management: 'Unknown', market_value: 44000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  // Hamptons — Shelter Island
  { address: '35 North Ferry Road, Shelter Island, NY', name: 'Shelter Island Heights Apartments', area: 'Shelter Island', region: 'Hamptons', units: 12, type: 'rental', year_built: 1992, current_management: 'Unknown', market_value: 8000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },

  // Connecticut — Stamford
  { address: '1 Broad Street, Stamford, CT', name: 'Trump Parc Stamford', area: 'Stamford', region: 'Connecticut', units: 170, type: 'condo', year_built: 2009, current_management: 'Unknown', market_value: 125000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  { address: '100 Prospect Street, Stamford, CT', name: 'The Beacon', area: 'Stamford', region: 'Connecticut', units: 132, type: 'rental', year_built: 2016, current_management: 'Building & Land Technology', market_value: 85000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  { address: '111 Harbor Point Road, Stamford, CT', name: 'Harbor Point Residences', area: 'Stamford', region: 'Connecticut', units: 480, type: 'rental', year_built: 2014, current_management: 'Building & Land Technology', market_value: 220000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  // Connecticut — Greenwich
  { address: '1 River Road, Cos Cob, CT', name: 'River Road Condominiums', area: 'Cos Cob', region: 'Connecticut', units: 36, type: 'condo', year_built: 1985, current_management: 'Unknown', market_value: 28000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  { address: '600 Steamboat Road, Greenwich, CT', name: 'Greenwich Harbor', area: 'Greenwich', region: 'Connecticut', units: 86, type: 'condo', year_built: 1995, current_management: 'Unknown', market_value: 75000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  // Connecticut — Norwalk
  { address: '25 5th Street, Norwalk, CT', name: 'The SoNo Collection Residences', area: 'Norwalk', region: 'Connecticut', units: 220, type: 'rental', year_built: 2018, current_management: 'Greystar', market_value: 110000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  { address: '1 Glover Avenue, Norwalk, CT', name: 'The Waypointe', area: 'Norwalk', region: 'Connecticut', units: 392, type: 'rental', year_built: 2015, current_management: 'BLT Management', market_value: 175000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  // Connecticut — New Haven
  { address: '100 College Street, New Haven, CT', name: 'College Street Tower', area: 'New Haven', region: 'Connecticut', units: 248, type: 'rental', year_built: 2015, current_management: 'Unknown', market_value: 95000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },
  { address: '360 State Street, New Haven, CT', name: '360 State Street', area: 'New Haven', region: 'Connecticut', units: 500, type: 'rental', year_built: 2010, current_management: 'Becker & Becker', market_value: 200000000, contacts: [], notes: '🏠 Connecticut — AI-researched data (verify independently)' },

  // New Jersey — Jersey City
  { address: '77 Hudson Street, Jersey City, NJ', name: '77 Hudson', area: 'Jersey City', region: 'New Jersey', units: 420, type: 'condo', year_built: 2009, current_management: 'Ironstate Development', market_value: 350000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },
  { address: '1 Park Lane South, Jersey City, NJ', name: 'Portofino', area: 'Jersey City', region: 'New Jersey', units: 302, type: 'condo', year_built: 2006, current_management: 'Unknown', market_value: 180000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },
  { address: '225 Grand Street, Jersey City, NJ', name: 'Grand Jersey Waterfront', area: 'Jersey City', region: 'New Jersey', units: 186, type: 'rental', year_built: 2018, current_management: 'Greystar', market_value: 120000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },
  // New Jersey — Hoboken
  { address: '1450 Washington Street, Hoboken, NJ', name: 'Maxwell Place', area: 'Hoboken', region: 'New Jersey', units: 474, type: 'condo', year_built: 2008, current_management: 'Toll Brothers', market_value: 350000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },
  { address: '1500 Garden Street, Hoboken, NJ', name: 'Vine Hoboken', area: 'Hoboken', region: 'New Jersey', units: 262, type: 'rental', year_built: 2021, current_management: 'Bijou Properties', market_value: 180000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },
  // New Jersey — Fort Lee
  { address: '2180 Center Avenue, Fort Lee, NJ', name: 'The Modern', area: 'Fort Lee', region: 'New Jersey', units: 246, type: 'rental', year_built: 2017, current_management: 'Related Companies', market_value: 140000000, contacts: [], notes: '🏗️ New Jersey — AI-researched data (verify independently)' },

  // Long Island — Garden City / Great Neck
  { address: '111 Cherry Valley Avenue, Garden City, NY', name: 'Cherry Valley Estates', area: 'Garden City', region: 'Long Island', units: 120, type: 'co-op', year_built: 1965, current_management: 'Unknown', market_value: 45000000, contacts: [], notes: '🏘️ Long Island — AI-researched data (verify independently)' },
  { address: '1 Barstow Road, Great Neck, NY', name: 'Great Neck Towers', area: 'Great Neck', region: 'Long Island', units: 248, type: 'co-op', year_built: 1970, current_management: 'Unknown', market_value: 82000000, contacts: [], notes: '🏘️ Long Island — AI-researched data (verify independently)' },
  { address: '2 Rector Street, Hempstead, NY', name: 'Hempstead Village Square', area: 'Hempstead', region: 'Long Island', units: 150, type: 'rental', year_built: 2019, current_management: 'RXR Realty', market_value: 75000000, contacts: [], notes: '🏘️ Long Island — AI-researched data (verify independently)' },

  // Hamptons
  { address: '50 Nugent Street, Southampton, NY', name: 'Southampton Village Condos', area: 'Southampton', region: 'Hamptons', units: 24, type: 'condo', year_built: 2005, current_management: 'Unknown', market_value: 48000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
  { address: '74 Montauk Highway, East Hampton, NY', name: 'East Hampton Residences', area: 'East Hampton', region: 'Hamptons', units: 18, type: 'condo', year_built: 2010, current_management: 'Unknown', market_value: 42000000, contacts: [], notes: '🏖️ Hamptons — AI-researched data (verify independently)' },
];

export function generateTriStateBuildings(selectedAreas: string[]): Building[] {
  const matched = TRISTATE_BUILDINGS.filter((b) => selectedAreas.includes(b.area));

  return matched.map((b) => {
    const score = recalculateBuildingScore({
      units: b.units,
      year_built: b.year_built,
      current_management: b.current_management,
    });

    return {
      id: crypto.randomUUID(),
      address: b.address,
      name: b.name,
      borough: b.region,
      region: b.area,
      units: b.units,
      type: b.type,
      year_built: b.year_built,
      grade: score.grade,
      score: score.score,
      signals: score.signals,
      contacts: b.contacts,
      enriched_data: {},
      current_management: b.current_management,
      source: 'ai_research',
      status: 'active' as const,
      tags: [],
      pipeline_stage: 'discovered' as const,
      violations_count: 0,
      open_violations_count: 0,
      market_value: b.market_value,
      assessed_value: 0,
      land_value: 0,
      tax_class: '',
      dof_owner: '',
      bbl: '',
      lot_area: 0,
      building_area: 0,
      stories: 0,
      building_class: '',
      notes: b.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Building;
  });
}

export function isTriStateArea(area: string): boolean {
  return TRISTATE_BUILDINGS.some((b) => b.area === area);
}
