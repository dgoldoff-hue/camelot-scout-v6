import { useState } from 'react';
import { Eye, Download, Share2, BarChart3, Building2, TrendingUp, DollarSign, MapPin, Loader2 } from 'lucide-react';
import { openBrochureForPrint, downloadAsHTML } from '@/lib/pdf-generator';
import { generateSentinelReport, type SentinelInput, DEFAULT_SENTINEL_INPUT, QUARTERS } from '@/lib/sentinel-report';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function Sentinel() {
  const [input, setInput] = useState<SentinelInput>({ ...DEFAULT_SENTINEL_INPUT });
  const [generated, setGenerated] = useState(false);

  const update = (patch: Partial<SentinelInput>) => setInput(prev => ({ ...prev, ...patch }));

  const handleGenerate = () => {
    setGenerated(true);
    toast.success('Sentinel report generated');
  };

  const handlePreview = () => {
    const html = generateSentinelReport(input);
    openBrochureForPrint(html, `Camelot-Market-Report-${input.quarter}-${input.year}`);
  };

  const handleDownload = () => {
    const html = generateSentinelReport(input);
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
    </div>
  );
}
