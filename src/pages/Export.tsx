import { useState, useMemo } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { cn, formatCurrency } from '@/lib/utils';
import type { Building } from '@/types';
import { Download, FileText, FileSpreadsheet, Mail, CheckSquare, Square, Search } from 'lucide-react';
import toast from 'react-hot-toast';

type ExportFormat = 'csv' | 'pdf' | 'email';

export default function Export() {
  const { buildings, selectedBuildings, toggleSelected, selectAll, clearSelection } = useBuildings();
  const [searchText, setSearchText] = useState('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const activeBuildings = useMemo(() => {
    let result = buildings.filter((b) => b.status === 'active');
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [buildings, searchText]);

  const selectedList = useMemo(
    () => activeBuildings.filter((b) => selectedBuildings.has(b.id)),
    [activeBuildings, selectedBuildings]
  );

  const generateCSV = (buildings: Building[]): string => {
    const headers = [
      'Address', 'Name', 'Borough', 'Region', 'Units', 'Type', 'Grade', 'Score',
      'Violations (Total)', 'Violations (Open)', 'Current Management',
      'Market Value', 'Assessed Value', 'Year Built', 'Energy Star Score',
      'Pipeline Stage', 'Contact Names', 'Contact Phones', 'Contact Emails',
    ];

    const rows = buildings.map((b) => [
      `"${b.address}"`,
      `"${b.name || ''}"`,
      `"${b.borough || ''}"`,
      `"${b.region || ''}"`,
      b.units || '',
      b.type,
      b.grade,
      b.score,
      b.violations_count,
      b.open_violations_count,
      `"${b.current_management || ''}"`,
      b.market_value || '',
      b.assessed_value || '',
      b.year_built || '',
      b.energy_star_score || '',
      b.pipeline_stage,
      `"${(b.contacts || []).map((c) => `${c.name} (${c.role})`).join('; ')}"`,
      `"${(b.contacts || []).map((c) => c.phone || '').filter(Boolean).join('; ')}"`,
      `"${(b.contacts || []).map((c) => c.email || '').filter(Boolean).join('; ')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleExport = () => {
    const toExport = selectedList.length > 0 ? selectedList : activeBuildings;

    if (toExport.length === 0) {
      toast.error('No buildings to export');
      return;
    }

    setIsExporting(true);

    if (exportFormat === 'csv') {
      const csv = generateCSV(toExport);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camelot-scout-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${toExport.length} buildings as CSV`);
    } else if (exportFormat === 'pdf') {
      toast.success('PDF export would generate a formatted report (requires @react-pdf/renderer)');
    } else if (exportFormat === 'email') {
      toast.success('Email report would be sent to: David, Sam, Carl, Luigi');
    }

    setIsExporting(false);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download size={24} className="text-camelot-gold" /> Export
        </h1>
        <p className="text-sm text-gray-500 mt-1">Export building data in various formats</p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Building Selection */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Select Buildings</h2>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-xs text-camelot-gold hover:underline">Select All</button>
                <button onClick={clearSelection} className="text-xs text-gray-500 hover:underline">Clear</button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search buildings..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-[60vh] overflow-y-auto">
              {activeBuildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => toggleSelected(b.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors',
                    selectedBuildings.has(b.id) && 'bg-camelot-gold/5'
                  )}
                >
                  {selectedBuildings.has(b.id) ? (
                    <CheckSquare size={16} className="text-camelot-gold flex-shrink-0" />
                  ) : (
                    <Square size={16} className="text-gray-300 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name || b.address}</p>
                    <p className="text-xs text-gray-400">{b.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium">{b.grade} • {b.score}</p>
                    <p className="text-xs text-gray-400">{b.units || '—'} units</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h2 className="text-lg font-bold mb-4">Export Options</h2>

            <div className="space-y-3 mb-6">
              {[
                { key: 'csv' as ExportFormat, label: 'CSV Export', desc: 'Full data spreadsheet with all fields', icon: FileSpreadsheet },
                { key: 'pdf' as ExportFormat, label: 'PDF Report', desc: 'Formatted report with building details', icon: FileText },
                { key: 'email' as ExportFormat, label: 'Email Report', desc: 'Send summary to team (David, Sam, Carl, Luigi)', icon: Mail },
              ].map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setExportFormat(key)}
                  className={cn(
                    'w-full p-4 rounded-xl border text-left transition-all',
                    exportFormat === key
                      ? 'border-camelot-gold bg-camelot-gold/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={exportFormat === key ? 'text-camelot-gold' : 'text-gray-400'} />
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium mb-2">Export Summary</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Buildings: {selectedList.length > 0 ? selectedList.length : activeBuildings.length} {selectedList.length > 0 ? '(selected)' : '(all)'}</p>
                <p>Format: {exportFormat.toUpperCase()}</p>
                <p>Includes: addresses, contacts, violations, financials, scores</p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-camelot-gold text-white py-3 rounded-xl font-semibold hover:bg-camelot-gold-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export {selectedList.length > 0 ? selectedList.length : activeBuildings.length} Buildings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
