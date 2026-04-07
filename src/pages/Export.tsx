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
      // Open formatted PDF report in new window with print dialog (same approach as PropertyDetail)
      const w = window.open('', '_blank');
      if (!w) { toast.error('Pop-up blocked — allow pop-ups for this site'); setIsExporting(false); return; }

      const buildingRows = toExport.map((b) => `
        <tr>
          <td>${b.name || b.address}</td>
          <td>${b.address}</td>
          <td>${b.borough || '—'}</td>
          <td>${b.units || '—'}</td>
          <td><span class="grade grade-${b.grade}">${b.grade}</span></td>
          <td><strong>${b.score}</strong>/100</td>
          <td style="color:#dc2626">${b.open_violations_count || 0}</td>
          <td>${b.violations_count || 0}</td>
          <td>${b.current_management || 'Unknown'}</td>
          <td>${b.market_value ? '$' + (b.market_value / 1000000).toFixed(1) + 'M' : '—'}</td>
          <td class="stage">${b.pipeline_stage}</td>
          <td>${(b.contacts || []).map((c) => c.name).join(', ') || '—'}</td>
        </tr>
      `).join('');

      const stageCounts: Record<string, number> = {};
      toExport.forEach((b) => { stageCounts[b.pipeline_stage] = (stageCounts[b.pipeline_stage] || 0) + 1; });
      const avgScore = toExport.length ? Math.round(toExport.reduce((s, b) => s + b.score, 0) / toExport.length) : 0;
      const totalUnits = toExport.reduce((s, b) => s + (b.units || 0), 0);
      const totalOpenViolations = toExport.reduce((s, b) => s + (b.open_violations_count || 0), 0);
      const gradeA = toExport.filter((b) => b.grade === 'A').length;
      const gradeB = toExport.filter((b) => b.grade === 'B').length;
      const gradeC = toExport.filter((b) => b.grade === 'C').length;

      w.document.write(`<!DOCTYPE html><html><head><title>Camelot Scout Export — ${toExport.length} Buildings</title>
        <style>
          body{font-family:'Inter',system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#1a1f36;font-size:13px}
          h1{color:#1a1f36;border-bottom:3px solid #C5A55A;padding-bottom:10px}
          h2{color:#C5A55A;margin-top:30px}
          .logo{color:#C5A55A;font-size:12px;letter-spacing:2px;margin-bottom:4px}
          .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
          .summary-card{background:#f9fafb;border-radius:10px;padding:14px;text-align:center}
          .summary-card .value{font-size:24px;font-weight:700;color:#1a1f36}
          .summary-card .label{font-size:11px;color:#6b7280;margin-top:2px}
          table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
          td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb}
          th{background:#f9fafb;font-weight:600;white-space:nowrap}
          .grade{display:inline-block;padding:2px 10px;border-radius:12px;font-weight:700;font-size:11px;color:#fff}
          .grade-A{background:#22c55e}.grade-B{background:#eab308}.grade-C{background:#9ca3af}
          .stage{text-transform:capitalize;font-size:11px}
          @media print{body{margin:20px;font-size:11px}}
        </style></head><body>
        <div class="logo">CAMELOT SCOUT • PROPERTY INTELLIGENCE</div>
        <h1>Pipeline Export Report — ${toExport.length} Buildings</h1>
        <p style="color:#6b7280">Generated ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>

        <div class="summary-grid">
          <div class="summary-card"><div class="value">${toExport.length}</div><div class="label">Buildings</div></div>
          <div class="summary-card"><div class="value">${totalUnits.toLocaleString()}</div><div class="label">Total Units</div></div>
          <div class="summary-card"><div class="value">${avgScore}</div><div class="label">Avg Score</div></div>
          <div class="summary-card"><div class="value" style="color:#dc2626">${totalOpenViolations}</div><div class="label">Open Violations</div></div>
        </div>

        <h2>Pipeline Distribution</h2>
        <p>${Object.entries(stageCounts).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join(' &nbsp;•&nbsp; ')}</p>
        <p>Grades: <strong>A:</strong> ${gradeA} &nbsp;•&nbsp; <strong>B:</strong> ${gradeB} &nbsp;•&nbsp; <strong>C:</strong> ${gradeC}</p>

        <h2>Building Details</h2>
        <table>
          <thead><tr><th>Name</th><th>Address</th><th>Borough</th><th>Units</th><th>Grade</th><th>Score</th><th>Open Viol.</th><th>Total Viol.</th><th>Management</th><th>Market Val</th><th>Stage</th><th>Contacts</th></tr></thead>
          <tbody>${buildingRows}</tbody>
        </table>

        <hr style="margin-top:40px;border-color:#C5A55A">
        <p style="font-size:10px;color:#9ca3af">Generated by Camelot OS • Camelot Realty Group • 477 Madison Avenue, 6th Fl, NYC 10022</p>
      </body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 500);
      toast.success(`PDF report generated for ${toExport.length} buildings`);
    } else if (exportFormat === 'email') {
      // Open mailto: to team with formatted summary
      const recipients = 'dgoldoff@camelot.nyc,sam@camelot.nyc,carl@camelot.nyc,luigi@camelot.nyc';
      const subject = encodeURIComponent(`Camelot Scout Export — ${toExport.length} Buildings (${new Date().toLocaleDateString()})`);

      const stageCounts: Record<string, number> = {};
      toExport.forEach((b) => { stageCounts[b.pipeline_stage] = (stageCounts[b.pipeline_stage] || 0) + 1; });
      const avgScore = toExport.length ? Math.round(toExport.reduce((s, b) => s + b.score, 0) / toExport.length) : 0;
      const totalUnits = toExport.reduce((s, b) => s + (b.units || 0), 0);
      const totalOpenViolations = toExport.reduce((s, b) => s + (b.open_violations_count || 0), 0);

      let bodyText = `Camelot Scout Pipeline Export\n`;
      bodyText += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      bodyText += `═══════════════════════════════════\n\n`;
      bodyText += `SUMMARY\n`;
      bodyText += `• Buildings: ${toExport.length}\n`;
      bodyText += `• Total Units: ${totalUnits.toLocaleString()}\n`;
      bodyText += `• Average Score: ${avgScore}/100\n`;
      bodyText += `• Open Violations: ${totalOpenViolations}\n`;
      bodyText += `• Pipeline: ${Object.entries(stageCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}\n\n`;
      bodyText += `═══════════════════════════════════\n\n`;
      bodyText += `TOP BUILDINGS\n\n`;

      const sorted = [...toExport].sort((a, b) => b.score - a.score);
      sorted.slice(0, 15).forEach((b, i) => {
        bodyText += `${i + 1}. ${b.name || b.address}\n`;
        bodyText += `   ${b.address}${b.borough ? ' — ' + b.borough : ''}\n`;
        bodyText += `   Grade: ${b.grade} | Score: ${b.score} | Units: ${b.units || '?'} | Stage: ${b.pipeline_stage}\n`;
        bodyText += `   Violations: ${b.open_violations_count || 0} open / ${b.violations_count || 0} total\n`;
        bodyText += `   Management: ${b.current_management || 'Unknown'}\n`;
        if (b.contacts?.length) {
          bodyText += `   Contacts: ${b.contacts.map((c) => `${c.name} (${c.role})`).join(', ')}\n`;
        }
        bodyText += `\n`;
      });

      if (sorted.length > 15) {
        bodyText += `... and ${sorted.length - 15} more buildings\n\n`;
      }

      bodyText += `═══════════════════════════════════\n`;
      bodyText += `Camelot Scout v6 • Camelot Realty Group`;

      const body = encodeURIComponent(bodyText);
      window.open(`mailto:${recipients}?subject=${subject}&body=${body}`, '_self');
      toast.success(`Email report opened for ${toExport.length} buildings → David, Sam, Carl, Luigi`);
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
