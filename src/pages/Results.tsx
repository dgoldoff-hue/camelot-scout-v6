import { useState, useMemo } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetail from '@/components/PropertyDetail';
import type { Building, BuildingGrade } from '@/types';
import { cn } from '@/lib/utils';
import {
  LayoutGrid, List, Search, SlidersHorizontal, Download, GitBranch,
  Users, CheckSquare, Square, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Results() {
  const {
    getFilteredBuildings,
    filters,
    setFilters,
    selectedBuildings,
    toggleSelected,
    selectAll,
    clearSelection,
    updateBuilding,
    setActiveBuilding,
  } = useBuildings();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [searchText, setSearchText] = useState('');
  const [gradeFilter, setGradeFilter] = useState<BuildingGrade | 'all'>('all');

  const filteredBuildings = useMemo(() => {
    let results = getFilteredBuildings();

    if (searchText) {
      const q = searchText.toLowerCase();
      results = results.filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.current_management?.toLowerCase().includes(q)
      );
    }

    if (gradeFilter !== 'all') {
      results = results.filter((b) => b.grade === gradeFilter);
    }

    return results;
  }, [getFilteredBuildings, searchText, gradeFilter]);

  const gradeStats = useMemo(() => {
    const all = getFilteredBuildings();
    return {
      all: all.length,
      A: all.filter((b) => b.grade === 'A').length,
      B: all.filter((b) => b.grade === 'B').length,
      C: all.filter((b) => b.grade === 'C').length,
    };
  }, [getFilteredBuildings]);

  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedBuildings.size} buildings...`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Results</h1>
            <p className="text-sm text-gray-500">{filteredBuildings.length} properties found</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-camelot-gold/10 text-camelot-gold' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-camelot-gold/10 text-camelot-gold' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-3">
          {/* Grade tabs */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[
              { key: 'all' as const, label: 'All', count: gradeStats.all },
              { key: 'A' as const, label: 'A', count: gradeStats.A },
              { key: 'B' as const, label: 'B', count: gradeStats.B },
              { key: 'C' as const, label: 'C', count: gradeStats.C },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setGradeFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  gradeFilter === key
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label} <span className="text-xs text-gray-400">({count})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
            />
          </div>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as any })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          >
            <option value="score">Sort by Score</option>
            <option value="violations">Sort by Violations</option>
            <option value="units">Sort by Units</option>
            <option value="newest">Sort by Newest</option>
          </select>

          {/* Bulk actions */}
          {selectedBuildings.size > 0 && (
            <div className="flex items-center gap-2 ml-auto bg-camelot-gold/10 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-medium text-camelot-gold">{selectedBuildings.size} selected</span>
              <button
                onClick={handleBulkExport}
                className="text-xs bg-camelot-gold text-white px-2 py-1 rounded flex items-center gap-1"
              >
                <Download size={12} /> Export
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-8">
        {filteredBuildings.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-500 mb-2">No properties found</h3>
            <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuildings.map((building) => (
              <PropertyCard
                key={building.id}
                building={building}
                selected={selectedBuildings.has(building.id)}
                onSelect={() => toggleSelected(building.id)}
                onViewDetails={() => setDetailBuilding(building)}
                onEmail={() => toast.success('Opening email composer...')}
                onEnrich={() => toast.success('Enrichment started...')}
                onGutCheck={() => {
                  toast.success(`Running Gut Check for ${building.name || building.address}...`);
                  window.open(`#/report-center?address=${encodeURIComponent(building.address)}&gutcheck=true`, '_blank');
                }}
                onAddToPipeline={() => {
                  updateBuilding(building.id, { pipeline_stage: 'scored' });
                  toast.success(`${building.name || building.address} moved to Scored`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    <button onClick={() => selectedBuildings.size > 0 ? clearSelection() : selectAll()}>
                      {selectedBuildings.size > 0 ? <CheckSquare size={14} className="text-camelot-gold" /> : <Square size={14} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Building</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Borough</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Units</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Violations</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Management</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stage</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelected(b.id)}>
                        {selectedBuildings.has(b.id) ? <CheckSquare size={14} className="text-camelot-gold" /> : <Square size={14} className="text-gray-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailBuilding(b)} className="text-left hover:text-camelot-gold transition-colors">
                        <p className="text-sm font-medium">{b.name || b.address}</p>
                        <p className="text-xs text-gray-400">{b.address}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">{b.borough || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center">{b.units || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('grade-badge w-6 h-6 text-[10px] border', {
                        'bg-green-50 text-green-600 border-green-200': b.grade === 'A',
                        'bg-yellow-50 text-yellow-600 border-yellow-200': b.grade === 'B',
                        'bg-gray-50 text-gray-600 border-gray-200': b.grade === 'C',
                      })}>
                        {b.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{b.score}</td>
                    <td className="px-4 py-3 text-sm text-center text-orange-600">{b.violations_count}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[120px]">{b.current_management || '—'}</td>
                    <td className="px-4 py-3 text-xs text-center capitalize">{b.pipeline_stage}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailBuilding(b)}
                        className="text-xs text-camelot-gold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      {detailBuilding && (
        <PropertyDetail
          building={detailBuilding}
          onClose={() => setDetailBuilding(null)}
          onUpdate={updateBuilding}
        />
      )}
    </div>
  );
}
