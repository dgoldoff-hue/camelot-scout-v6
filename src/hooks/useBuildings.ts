import { useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useBuildingsStore } from '@/lib/store';
import type { Building, PipelineStage } from '@/types';

// Demo data for when Supabase isn't configured
const DEMO_BUILDINGS: Building[] = [
  {
    id: '1',
    address: '301 East 79th Street',
    name: 'The Bromley',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 126,
    type: 'co-op',
    year_built: 1960,
    grade: 'A',
    score: 82,
    signals: ['High violation count', 'Large building', 'No established management'],
    contacts: [
      {
        name: 'Margaret Chen',
        role: 'board_president',
        phone: '(212) 555-0101',
        email: 'mchen@gmail.com',
        linkedin_url: 'https://www.linkedin.com/in/margaret-chen-nyc/',
        company: 'Chen Capital Advisors',
      },
      {
        name: 'Robert Williams',
        role: 'board_treasurer',
        phone: '(212) 555-0102',
        email: 'rwilliams@outlook.com',
        facebook_url: 'https://www.facebook.com/robert.williams.nyc',
      },
      {
        name: 'Carlos Rodriguez',
        role: 'super',
        phone: '(212) 555-0103',
        notes: 'On-site Mon–Fri, 8am–5pm',
      },
      {
        name: 'Building Front Desk',
        role: 'front_desk',
        phone: '(212) 555-0100',
        notes: '24/7 staffed lobby',
      },
    ],
    enriched_data: {},
    building_class: 'D4',
    current_management: 'Unknown',
    source: 'nyc_open_data',
    status: 'active',
    tags: ['high-priority'],
    pipeline_stage: 'discovered',
    pipeline_moved_at: new Date().toISOString(),
    violations_count: 47,
    open_violations_count: 12,
    market_value: 45000000,
    assessed_value: 18900000,
    energy_star_score: 42,
    site_eui: 128.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    address: '520 East 72nd Street',
    name: 'The Horizon',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 94,
    type: 'condo',
    year_built: 1975,
    grade: 'A',
    score: 78,
    signals: ['Moderate violations', 'Mid-size building', 'Small management firm'],
    contacts: [
      { name: 'David Park', role: 'board_president', email: 'dpark@yahoo.com' },
      { name: 'Linda Torres', role: 'managing_agent', phone: '(212) 555-0201', email: 'ltorres@mgmt.com', company: 'Apex Property Solutions' },
    ],
    enriched_data: {},
    building_class: 'R3',
    current_management: 'Apex Property Solutions',
    source: 'nyc_open_data',
    status: 'active',
    tags: [],
    pipeline_stage: 'scored',
    pipeline_moved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    violations_count: 28,
    open_violations_count: 6,
    market_value: 38000000,
    assessed_value: 15200000,
    energy_star_score: 58,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    address: '155 West 68th Street',
    name: 'Lincoln Towers',
    borough: 'Manhattan',
    region: 'Upper West Side',
    units: 210,
    type: 'co-op',
    year_built: 1963,
    grade: 'A',
    score: 88,
    signals: ['Very high violation count', 'Large building', 'Very old building', 'Low Energy Star score'],
    contacts: [
      {
        name: 'Susan Katz',
        role: 'board_president',
        phone: '(212) 555-0301',
        email: 'skatz@gmail.com',
        linkedin_url: 'https://www.linkedin.com/in/susan-katz-esq/',
        company: 'Katz & Associates LLP',
        notes: 'Attorney — responsive via email',
      },
      {
        name: 'Michael Green',
        role: 'board_secretary',
        email: 'mgreen@law.com',
        instagram_url: 'https://www.instagram.com/mikegreen_nyc/',
      },
      {
        name: 'Jose Martinez',
        role: 'super',
        phone: '(212) 555-0303',
        notes: 'Has been super for 12+ years. Very knowledgeable.',
      },
      {
        name: 'Anna Kim',
        role: 'resident_manager',
        phone: '(212) 555-0304',
        email: 'akim@lincolntowers.com',
        company: 'Lincoln Towers Co-op',
        linkedin_url: 'https://www.linkedin.com/in/anna-kim-property-mgr/',
      },
      {
        name: 'Lobby Front Desk',
        role: 'front_desk',
        phone: '(212) 555-0300',
        notes: 'Staffed 7am–11pm daily',
      },
    ],
    enriched_data: {},
    building_class: 'D4',
    current_management: 'Self-managed',
    source: 'nyc_open_data',
    status: 'active',
    tags: ['high-priority', 'self-managed'],
    pipeline_stage: 'contacted',
    pipeline_moved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    violations_count: 89,
    open_violations_count: 23,
    market_value: 72000000,
    assessed_value: 28800000,
    energy_star_score: 35,
    site_eui: 155.2,
    ghg_emissions: 1250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    address: '250 West 50th Street',
    name: 'Worldwide Plaza',
    borough: 'Manhattan',
    region: 'Midtown West',
    units: 175,
    type: 'condo',
    year_built: 1989,
    grade: 'B',
    score: 65,
    signals: ['Moderate violations', 'Large building'],
    contacts: [
      { name: 'James Wilson', role: 'board_president', email: 'jwilson@finance.com' },
      { name: 'Patricia Moore', role: 'board_treasurer', phone: '(212) 555-0402' },
    ],
    enriched_data: {},
    building_class: 'D4',
    current_management: 'Zeckendorf Development',
    source: 'nyc_open_data',
    status: 'active',
    tags: [],
    pipeline_stage: 'nurture',
    pipeline_moved_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    violations_count: 31,
    open_violations_count: 8,
    market_value: 55000000,
    assessed_value: 22000000,
    energy_star_score: 71,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    address: '200 East 95th Street',
    name: 'Monte Carlo',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 68,
    type: 'rental',
    year_built: 1985,
    grade: 'B',
    score: 58,
    signals: ['Moderate violations', 'Small management firm'],
    contacts: [
      { name: 'Anthony Russo', role: 'owner', phone: '(212) 555-0501', email: 'arusso@realty.com', company: 'Russo Realty LLC' },
    ],
    enriched_data: {},
    building_class: 'D1',
    current_management: 'Russo Realty LLC',
    source: 'nyc_open_data',
    status: 'active',
    tags: [],
    pipeline_stage: 'proposal',
    pipeline_moved_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    violations_count: 19,
    open_violations_count: 4,
    market_value: 22000000,
    assessed_value: 8800000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    address: '345 East 86th Street',
    name: 'The Trafalgar',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 152,
    type: 'co-op',
    year_built: 1954,
    grade: 'A',
    score: 85,
    signals: ['High violation count', 'Large building', 'Very old building', 'No established management'],
    contacts: [
      { name: 'Helen Ng', role: 'board_president', phone: '(212) 555-0601', email: 'hng@gmail.com' },
      { name: 'Frank DeLuca', role: 'super', phone: '(212) 555-0602' },
    ],
    enriched_data: {},
    building_class: 'D4',
    current_management: 'Unknown',
    source: 'nyc_open_data',
    status: 'active',
    tags: ['high-priority'],
    pipeline_stage: 'discovered',
    pipeline_moved_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    violations_count: 64,
    open_violations_count: 18,
    market_value: 48000000,
    assessed_value: 19200000,
    energy_star_score: 38,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    address: '100 Beekman Street',
    name: 'Beekman Tower',
    borough: 'Manhattan',
    region: 'Financial District',
    units: 45,
    type: 'condo',
    year_built: 2010,
    grade: 'C',
    score: 35,
    signals: ['Few violations', 'Newer building'],
    contacts: [],
    enriched_data: {},
    current_management: 'FirstService Residential',
    source: 'nyc_open_data',
    status: 'active',
    tags: [],
    pipeline_stage: 'discovered',
    violations_count: 5,
    open_violations_count: 1,
    market_value: 32000000,
    assessed_value: 12800000,
    energy_star_score: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    address: '401 East 60th Street',
    name: 'The Pavilion',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 88,
    type: 'co-op',
    year_built: 1968,
    grade: 'B',
    score: 72,
    signals: ['Moderate violations', 'Mid-size building', 'Old building'],
    contacts: [
      { name: 'Richard Stern', role: 'board_president', email: 'rstern@sternlaw.com', phone: '(212) 555-0801', company: 'Stern Law Group' },
      { name: 'Martha Johnson', role: 'board_treasurer', email: 'mjohnson@gmail.com' },
      { name: 'Victor Petrov', role: 'super', phone: '(212) 555-0803' },
    ],
    enriched_data: {},
    building_class: 'D0',
    current_management: 'Maxwell Kates Inc',
    source: 'nyc_open_data',
    status: 'active',
    tags: [],
    pipeline_stage: 'scored',
    pipeline_moved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    violations_count: 33,
    open_violations_count: 9,
    market_value: 35000000,
    assessed_value: 14000000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    address: '785 Park Avenue',
    name: '785 Park Avenue Corp',
    borough: 'Manhattan',
    region: 'Upper East Side',
    units: 42,
    type: 'co-op',
    year_built: 1930,
    grade: 'A',
    score: 76,
    signals: ['Very old building', 'High maintenance needs', 'No established management'],
    contacts: [
      { name: 'Elizabeth Warren', role: 'board_president', email: 'ewarren@gmail.com' },
    ],
    enriched_data: {},
    building_class: 'D4',
    current_management: 'Self-managed',
    source: 'nyc_open_data',
    status: 'active',
    tags: ['self-managed', 'park-avenue'],
    pipeline_stage: 'negotiation',
    pipeline_moved_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    violations_count: 22,
    open_violations_count: 5,
    market_value: 65000000,
    assessed_value: 26000000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    address: '180 Riverside Drive',
    name: 'The Riviera',
    borough: 'Manhattan',
    region: 'Upper West Side',
    units: 112,
    type: 'co-op',
    year_built: 1925,
    grade: 'A',
    score: 90,
    signals: ['Very high violations', 'Large building', 'Very old building', 'Self-managed', 'Low Energy Star'],
    contacts: [
      {
        name: 'George Papadopoulos',
        role: 'board_president',
        phone: '(212) 555-1001',
        email: 'gpapad@gmail.com',
        linkedin_url: 'https://www.linkedin.com/in/george-papadopoulos-re/',
        company: 'Papadopoulos Holdings',
      },
      {
        name: 'Sandra Lee',
        role: 'board_treasurer',
        email: 'slee@accounting.com',
        company: 'Lee & Partners CPA',
      },
      {
        name: 'Raymond Cruz',
        role: 'board_secretary',
        phone: '(212) 555-1003',
      },
      {
        name: 'Vladimir Petrov',
        role: 'super',
        phone: '(212) 555-1004',
        notes: 'On-site super. Prefers calls over text.',
      },
      {
        name: 'Riverside Realty Group',
        role: 'managing_agent',
        phone: '(212) 555-1010',
        email: 'info@riversiderealty.com',
        company: 'Riverside Realty Group LLC',
      },
    ],
    enriched_data: {},
    building_class: 'D0',
    current_management: 'Self-managed',
    source: 'nyc_open_data',
    status: 'active',
    tags: ['high-priority', 'self-managed'],
    pipeline_stage: 'won',
    pipeline_moved_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    violations_count: 98,
    open_violations_count: 31,
    market_value: 52000000,
    assessed_value: 20800000,
    energy_star_score: 29,
    site_eui: 172.3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useBuildings() {
  const store = useBuildingsStore();

  const loadBuildings = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);

    if (!isSupabaseConfigured()) {
      // Use demo data
      store.setBuildings(DEMO_BUILDINGS);
      store.setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scout_buildings')
        .select('*')
        .eq('status', 'active')
        .order('score', { ascending: false });

      if (error) throw error;
      store.setBuildings(data || []);
    } catch (err: any) {
      console.error('Failed to load buildings:', err);
      store.setError(err.message);
      // Fall back to demo data
      store.setBuildings(DEMO_BUILDINGS);
    } finally {
      store.setLoading(false);
    }
  }, []);

  const saveBuildingToSupabase = useCallback(async (building: Partial<Building>) => {
    if (!isSupabaseConfigured()) {
      // In demo mode, just update local state
      if (building.id) {
        store.updateBuilding(building.id, building);
      }
      return building;
    }

    try {
      if (building.id) {
        const { data, error } = await supabase
          .from('scout_buildings')
          .update(building)
          .eq('id', building.id)
          .select()
          .single();
        if (error) throw error;
        store.updateBuilding(building.id, data);
        return data;
      } else {
        const { data, error } = await supabase
          .from('scout_buildings')
          .insert(building)
          .select()
          .single();
        if (error) throw error;
        store.addBuildings([data]);
        return data;
      }
    } catch (err: any) {
      console.error('Failed to save building:', err);
      throw err;
    }
  }, []);

  const moveToPipeline = useCallback(async (id: string, stage: PipelineStage) => {
    store.updateBuilding(id, {
      pipeline_stage: stage,
      pipeline_moved_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured()) {
      await supabase
        .from('scout_buildings')
        .update({ pipeline_stage: stage, pipeline_moved_at: new Date().toISOString() })
        .eq('id', id);
    }
  }, []);

  const archiveBuilding = useCallback(async (id: string, reason?: string) => {
    store.updateBuilding(id, {
      status: 'archived',
      archive_reason: reason,
      archived_at: new Date().toISOString(),
    });

    if (isSupabaseConfigured()) {
      await supabase
        .from('scout_buildings')
        .update({
          status: 'archived',
          archive_reason: reason,
          archived_at: new Date().toISOString(),
        })
        .eq('id', id);
    }
  }, []);

  const restoreBuilding = useCallback(async (id: string) => {
    store.updateBuilding(id, {
      status: 'active',
      archive_reason: undefined,
      archived_at: undefined,
    });

    if (isSupabaseConfigured()) {
      await supabase
        .from('scout_buildings')
        .update({ status: 'active', archive_reason: null, archived_at: null })
        .eq('id', id);
    }
  }, []);

  // Get filtered and sorted buildings
  const getFilteredBuildings = useCallback(() => {
    let result = [...store.buildings].filter((b) => b.status === 'active');

    const { filters } = store;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.borough?.toLowerCase().includes(q) ||
          b.region?.toLowerCase().includes(q)
      );
    }

    if (filters.regions.length > 0) {
      result = result.filter(
        (b) => filters.regions.includes(b.borough || '') || filters.regions.includes(b.region || '')
      );
    }

    if (filters.buildingTypes.length > 0) {
      result = result.filter((b) => filters.buildingTypes.includes(b.type));
    }

    if (filters.grades.length > 0) {
      result = result.filter((b) => filters.grades.includes(b.grade));
    }

    if (filters.minUnits) {
      result = result.filter((b) => (b.units || 0) >= filters.minUnits!);
    }
    if (filters.maxUnits) {
      result = result.filter((b) => (b.units || 0) <= filters.maxUnits!);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case 'score':
          cmp = a.score - b.score;
          break;
        case 'violations':
          cmp = a.violations_count - b.violations_count;
          break;
        case 'units':
          cmp = (a.units || 0) - (b.units || 0);
          break;
        case 'newest':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return filters.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [store.buildings, store.filters]);

  return {
    buildings: store.buildings,
    selectedBuildings: store.selectedBuildings,
    activeBuilding: store.activeBuilding,
    isLoading: store.isLoading,
    error: store.error,
    filters: store.filters,
    loadBuildings,
    saveBuildingToSupabase,
    moveToPipeline,
    archiveBuilding,
    restoreBuilding,
    getFilteredBuildings,
    setActiveBuilding: store.setActiveBuilding,
    toggleSelected: store.toggleSelected,
    selectAll: store.selectAll,
    clearSelection: store.clearSelection,
    setFilters: store.setFilters,
    updateBuilding: store.updateBuilding,
  };
}
