import { useState, useMemo } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { cn, formatDate } from '@/lib/utils';
import PropertyDetail from '@/components/PropertyDetail';
import type { Building } from '@/types';
import { Archive as ArchiveIcon, RotateCcw, Search, Filter, Building2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Archive() {
  const { buildings, restoreBuilding, updateBuilding } = useBuildings();
  const [detailBuilding, setDetailBuilding] = useState<Building | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterReason, setFilterReason] = useState('all');

  const archivedBuildings = useMemo(() => {
    let result = buildings.filter((b) => b.status === 'archived');

    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.borough?.toLowerCase().includes(q)
      );
    }

    if (filterReason !== 'all') {
      result = result.filter((b) => b.archive_reason === filterReason);
    }

    return result;
  }, [buildings, searchText, filterReason]);

  const reasons = useMemo(() => {
    const all = buildings.filter((b) => b.status === 'archived');
    const r = new Set(all.map((b) => b.archive_reason).filter(Boolean));
    return Array.from(r) as string[];
  }, [buildings]);

  const handleRestore = (id: string) => {
    restoreBuilding(id);
    toast.success('Building restored to active');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArchiveIcon size={24} className="text-camelot-gold" /> Archive
            </h1>
            <p className="text-sm text-gray-500">{archivedBuildings.length} archived properties</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search archived..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
            />
          </div>
          {reasons.length > 0 && (
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Reasons</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="p-8">
        {archivedBuildings.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ArchiveIcon size={64} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-gray-500 mb-2">No archived properties</h3>
            <p className="text-sm">Properties you dismiss or archive will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Building</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Borough</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Units</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Archived</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedBuildings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailBuilding(b)} className="text-left hover:text-camelot-gold">
                        <p className="text-sm font-medium">{b.name || b.address}</p>
                        <p className="text-xs text-gray-400">{b.address}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">{b.borough || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center">{b.units || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center">{b.score}</td>
                    <td className="px-4 py-3 text-sm">{b.archive_reason || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(b.archived_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestore(b.id)}
                        className="flex items-center gap-1 text-xs text-green-600 px-2 py-1.5 rounded-lg hover:bg-green-50 ml-auto"
                      >
                        <RotateCcw size={13} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
