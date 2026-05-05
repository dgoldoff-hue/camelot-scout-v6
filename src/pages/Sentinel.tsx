import { useState } from 'react';
import { Eye, Download, Share2, BarChart3, Building2, TrendingUp, DollarSign, MapPin, Loader2 } from 'lucide-react';
import { openBrochureForPrint, downloadAsHTML } from '@/lib/pdf-generator';
import { generateSentinelReport, generateBuildingReport, TRACKED_BUILDINGS, type SentinelInput, DEFAULT_SENTINEL_INPUT, QUARTERS } from '@/lib/sentinel-report';
import { generateFullSentinelReport } from '@/lib/sentinel-full-report';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function Sentinel() {
  const [input, setInput] = useState<SentinelInput>({ ...DEFAULT_SENTINEL_INPUT });
  const [generated, setGenerated] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [buildingGenerated, setBuildingGenerated] = useState(false);

  const update = (patch: Partial<SentinelInput>) => setInput(prev => ({ ...prev, ...patch }));

  const handleGenerate = () => {
    setGenerated(true);
    toast.success('Sentinel report generated');
  };

  const handlePreview = () => {
    const html = generateFullSentinelReport();
    openBrochureForPrint(html, `Camelot-Market-Report-${input.quarter}-${input.year}`);
  };

  const handleDownload = () => {
    const html = generateFullSentinelReport();
    downloadAsHTML(html, `Camelot-Market-Report-${input.quarter}-${input.year}.html`);
    toast.success('Report downloaded');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
          <Eye size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sentinel</h1>
          <p className="text-gray-500 text-sm">Quarterly Market Intelligence — Generate branded NYC market reports for clients and social media</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Tracked Buildings', value: '6' },
          { icon: MapPin, label: 'Neighborhoods', value: '12' },
          { icon: TrendingUp, label: 'Camelot Rent Growth', value: '10.55%' },
          { icon: DollarSign, label: 'Market Avg', value: '5.20%' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border p-4 text-center">
            <Icon size={20} className="mx-auto text-camelot-gold mb-2" />
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm divide-y">

        {/* Quarter Selection */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Report Period</h2>
          <div className="flex gap-3">
            <div className="flex gap-2">
              {QUARTERS.map(q => (
                <button
                  key={q}
                  onClick={() => update({ quarter: q })}
                  className={cn(
                    'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                    input.quarter === q ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >{q}</button>
              ))}
            </div>
            <input
              type="number" value={input.year} onChange={e => update({ year: parseInt(e.target.value) || 2026 })}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
        </div>

        {/* Five Insights */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Five Standard Insights</h2>
          <p className="text-xs text-gray-400 mb-4">Update each quarter with current data. Leave blank to use defaults from SCOUT data.</p>
          {[
            { key: 'insight1' as const, icon: '🏢', label: 'Building Performance', placeholder: 'e.g., 5 of 6 tracked buildings beat their neighborhood median $/sqft' },
            { key: 'insight2' as const, icon: '⚡', label: 'Rental Velocity', placeholder: 'e.g., Sub-$3,500/mo 1-BRs clearing in under 14 days' },
            { key: 'insight3' as const, icon: '📊', label: 'Rate Sensitivity', placeholder: 'e.g., Every 50bps rate drop unlocks 8-10% more buying power' },
            { key: 'insight4' as const, icon: '🏠', label: 'Rent vs. Buy', placeholder: 'e.g., Break-even: 20 yrs in Sunnyside, 38+ yrs in Tribeca' },
            { key: 'insight5' as const, icon: '📍', label: 'Neighborhood Value Spectrum', placeholder: 'e.g., $/sqft ranges from $660 (Sunnyside) to $2,100 (Tribeca)' },
          ].map(({ key, icon, label, placeholder }) => (
            <div key={key} className="mb-3">
              <label className="text-xs text-gray-600 font-medium flex items-center gap-2 mb-1">
                <span>{icon}</span> {label}
              </label>
              <input
                type="text" value={input[key]} onChange={e => update({ [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={handleGenerate}
            className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20"
          >
            <BarChart3 size={16} /> Generate Report
          </button>
          {generated && (
            <>
              <button onClick={handlePreview} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Eye size={16} /> Preview
              </button>
              <button onClick={handleDownload} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download size={16} /> Download
              </button>
            </>
          )}
        </div>
      </div>
      {/* Per-Building Client Reports */}
      <div className="bg-white rounded-xl border shadow-sm divide-y">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Client Building Reports</h2>
          <p className="text-gray-500 text-sm mb-4">Generate per-building market reports for each managed property. Send to boards as a complimentary quarterly service.</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {TRACKED_BUILDINGS.map((b, i) => (
              <button
                key={i}
                onClick={() => { setSelectedBuilding(i); setBuildingGenerated(false); }}
                className={cn(
                  'p-3 rounded-lg text-left transition-all border',
                  selectedBuilding === i ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="font-semibold text-sm">{b.name}</div>
                <div className="text-xs text-gray-500">{b.neighborhood} · {b.type} · {b.units} units</div>
                <div className={cn('text-xs font-bold mt-1', b.performance === 'Above' ? 'text-green-600' : 'text-yellow-600')}>
                  {b.performance === 'Above' ? '▲' : '●'} {b.performance} market · ${b.camelotPSF}/sqft
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedBuilding === null) { toast.error('Select a building first'); return; }
                setBuildingGenerated(true);
                toast.success(`Report generated for ${TRACKED_BUILDINGS[selectedBuilding].name}`);
              }}
              disabled={selectedBuilding === null}
              className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Building2 size={16} /> Generate Building Report
            </button>

            {buildingGenerated && selectedBuilding !== null && (
              <>
                <button
                  onClick={() => {
                    const html = generateBuildingReport(TRACKED_BUILDINGS[selectedBuilding], input);
                    openBrochureForPrint(html, `Camelot-${TRACKED_BUILDINGS[selectedBuilding].name}-${input.quarter}-${input.year}`);
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 flex items-center gap-2"
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={() => {
                    const b = TRACKED_BUILDINGS[selectedBuilding];
                    const html = generateBuildingReport(b, input);
                    downloadAsHTML(html, `Camelot-${b.name.replace(/[^a-zA-Z0-9]/g,'-')}-${input.quarter}-${input.year}.html`);
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 flex items-center gap-2"
                >
                  <Download size={16} /> Download
                </button>
              </>
            )}

            <button
              onClick={() => {
                TRACKED_BUILDINGS.forEach((b, i) => {
                  const html = generateBuildingReport(b, input);
                  setTimeout(() => {
                    downloadAsHTML(html, `Camelot-${b.name.replace(/[^a-zA-Z0-9]/g,'-')}-${input.quarter}-${input.year}.html`);
                  }, i * 500);
                });
                toast.success(`Downloading ${TRACKED_BUILDINGS.length} building reports...`);
              }}
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <Download size={16} /> Download All ({TRACKED_BUILDINGS.length})
            </button>

            <button
              onClick={async () => {
                toast.loading('Generating & emailing all reports...', { id: 'send-all' });
                // Generate all reports and trigger email via mailto
                const reportLinks = TRACKED_BUILDINGS.map(b => b.name).join(', ');
                const subject = encodeURIComponent(`${input.quarter} ${input.year} Quarterly Market Reports — ${TRACKED_BUILDINGS.length} Buildings`);
                const body = encodeURIComponent(
                  `Team,\n\nThe ${input.quarter} ${input.year} quarterly market reports have been generated for all ${TRACKED_BUILDINGS.length} managed buildings:\n\n` +
                  TRACKED_BUILDINGS.map(b => `• ${b.name} — ${b.neighborhood} — ${b.performance === 'Above' ? '▲ Above' : '● At'} market ($${b.camelotPSF}/sqft vs $${b.neighborhoodPSF} neighborhood)`).join('\n') +
                  `\n\nReports are being downloaded to your computer. Please distribute to each building's board via ConciergePlus or MDS.\n\nFull market report available on Scout: https://camelot-scout-v6.onrender.com/sentinel\n\n— Merlin AI\nCamelot OS · Sentinel Engine`
                );
                window.open(`mailto:valerie@camelot.nyc?cc=valerie@camelot.nyc,sam@camelot.nyc&subject=${subject}&body=${body}`);
                // Download all reports
                TRACKED_BUILDINGS.forEach((b, i) => {
                  const html = generateBuildingReport(b, input);
                  setTimeout(() => {
                    downloadAsHTML(html, `Camelot-${b.name.replace(/[^a-zA-Z0-9]/g,'-')}-${input.quarter}-${input.year}.html`);
                  }, i * 500);
                });
                toast.success(`${TRACKED_BUILDINGS.length} reports generated & email drafted`, { id: 'send-all' });
              }}
              className="bg-camelot-gold text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-camelot-gold-light transition-all flex items-center gap-2 ml-auto"
            >
              <Share2 size={16} /> Send to All Clients
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
