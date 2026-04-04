/**
 * Global State Management with Zustand
 */

import { create } from 'zustand';
import type { Building, TeamMember, Folder, Bot, OutreachTemplate, SearchFilters, PipelineStage } from '@/types';

// ============================================================
// Buildings Store
// ============================================================
interface BuildingsState {
  buildings: Building[];
  selectedBuildings: Set<string>;
  activeBuilding: Building | null;
  isLoading: boolean;
  error: string | null;
  filters: SearchFilters;

  setBuildings: (buildings: Building[]) => void;
  addBuildings: (buildings: Building[]) => void;
  updateBuilding: (id: string, data: Partial<Building>) => void;
  removeBuilding: (id: string) => void;
  setActiveBuilding: (building: Building | null) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Persist buildings to localStorage
function saveBuildingsToStorage(buildings: Building[]) {
  try {
    localStorage.setItem('scout_buildings', JSON.stringify(buildings));
  } catch { /* quota exceeded — skip */ }
}
function loadBuildingsFromStorage(): Building[] {
  try {
    const raw = localStorage.getItem('scout_buildings');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export const useBuildingsStore = create<BuildingsState>((set, get) => ({
  buildings: loadBuildingsFromStorage(),
  selectedBuildings: new Set(),
  activeBuilding: null,
  isLoading: false,
  error: null,
  filters: {
    regions: [],
    buildingTypes: [],
    grades: [],
    sortBy: 'score',
    sortOrder: 'desc',
  },

  setBuildings: (buildings) => { saveBuildingsToStorage(buildings); set({ buildings }); },
  addBuildings: (newBuildings) =>
    set((state) => {
      const merged = [...newBuildings, ...state.buildings];
      saveBuildingsToStorage(merged);
      return { buildings: merged };
    }),
  updateBuilding: (id, data) =>
    set((state) => ({
      buildings: state.buildings.map((b) => (b.id === id ? { ...b, ...data } : b)),
      activeBuilding:
        state.activeBuilding?.id === id ? { ...state.activeBuilding, ...data } : state.activeBuilding,
    })),
  removeBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildings: new Set([...state.selectedBuildings].filter((s) => s !== id)),
    })),
  setActiveBuilding: (building) => set({ activeBuilding: building }),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedBuildings);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedBuildings: next };
    }),
  selectAll: () =>
    set((state) => ({
      selectedBuildings: new Set(state.buildings.map((b) => b.id)),
    })),
  clearSelection: () => set({ selectedBuildings: new Set() }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// Team Store
// ============================================================
interface TeamState {
  members: TeamMember[];
  currentUser: TeamMember | null;
  setMembers: (members: TeamMember[]) => void;
  setCurrentUser: (user: TeamMember | null) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  members: [],
  currentUser: null,
  setMembers: (members) => set({ members }),
  setCurrentUser: (currentUser) => set({ currentUser }),
}));

// ============================================================
// UI Store
// ============================================================
interface UIState {
  sidebarCollapsed: boolean;
  propertyDetailOpen: boolean;
  searchPanelOpen: boolean;
  toggleSidebar: () => void;
  setPropertyDetailOpen: (open: boolean) => void;
  setSearchPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  propertyDetailOpen: false,
  searchPanelOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPropertyDetailOpen: (open) => set({ propertyDetailOpen: open }),
  setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),
}));
