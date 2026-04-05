import { useState, useCallback } from 'react';
import { Sword, FileText, Download, Eye, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { generateAgreement, DEFAULT_INPUT, ASSET_CLASS_LABELS, type AgreementInput, type AssetClass } from '@/lib/excalibur';
import { buildMasterReport, type MasterReportData } from '@/lib/camelot-report';
import { openBrochureForPrint, downloadAsHTML } from '@/lib/pdf-generator';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function Agreements() {
  const [input, setInput] = useState<AgreementInput>({ ...DEFAULT_INPUT });
  const [jackieLoading, setJackieLoading] = useState(false);
  const [jackieData, setJackieData] = useState<MasterReportData | null>(null);
  const [generated, setGenerated] = useState(false);

  const update = (patch: Partial<AgreementInput>) => setInput(prev => ({ ...prev, ...patch }));

  // Auto-populate from Jackie
  const pullFromJackie = useCallback(async () => {
    if (!input.propertyAddress.trim()) {
      toast.error('Enter a property address first');
      return;
    }
    setJackieLoading(true);
    try {
      const data = await buildMasterReport(input.propertyAddress.trim());
      setJackieData(data);
      update({
        jackieData: data,
        tieredPricing: data.tieredPricing,
        units: data.units || input.units,
        blockLot: data.bbl ? `BBL: ${data.bbl}` : input.blockLot,
        isRentStabilized: data.isRentStabilized || input.isRentStabilized,
        buildingType: data.propertyType ? `${data.units} ${data.propertyType} Units${data.isRentStabilized ? ' · Rent Stabilized' : ''}` : input.buildingType,
      });
      toast.success(`Pulled data for ${data.buildingName || input.propertyAddress}`);
    } catch (err) {
      toast.error('Failed to pull Jackie data — fill in manually');
      console.error(err);
    } finally {
      setJackieLoading(false);
    }
  }, [input.propertyAddress, input.units, input.blockLot, input.isRentStabilized, input.buildingType]);

  // Generate agreement
  const handleGenerate = () => {
    if (!input.clientName.trim() && !input.propertyAddress.trim()) {
      toast.error('Enter at least a client name or address');
      return;
    }
    setGenerated(true);
    toast.success('Agreement generated');
  };

  const handlePreview = () => {
    const html = generateAgreement(input);
    openBrochureForPrint(html, `Camelot-Agreement-${input.clientName || 'Draft'}`);
  };

  const handleDownload = () => {
    const html = generateAgreement(input);
    const filename = `Camelot-Agreement-${(input.clientName || 'Draft').replace(/[^a-zA-Z0-9]/g, '-')}.html`;
    downloadAsHTML(html, filename);
    toast.success('Agreement downloaded');
  };

  // Auto-generate all fields from Jackie data
  const autoFill = () => {
    if (!jackieData) {
      toast.error('Pull Jackie data first');
      return;
    }
    const d = jackieData;
    update({
      units: d.units || input.units,
      blockLot: d.bbl ? `BBL: ${d.bbl}` : input.blockLot,
      isRentStabilized: d.isRentStabilized,
      buildingType: `${d.units} ${d.propertyType} Units${d.isRentStabilized ? ' · Rent Stabilized' : ''}`,
      propertyCity: 'New York',
      propertyState: 'NY',
      tieredPricing: d.tieredPricing,
    });
    toast.success('Auto-filled from Jackie data');
  };

  const tierOptions: Array<{ key: AgreementInput['selectedTier']; label: string; desc: string }> = [
    { key: 'classic', label: 'Camelot Classic', desc: 'Full management, standard tech' },
    { key: 'intelligence', label: 'Camelot Intelligence ⭐', desc: 'AI portal, zero bank fees, market reports' },
    { key: 'premier', label: 'Camelot Premier', desc: 'White-glove, dedicated PM, insurance rebid' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-camelot-gold rounded-lg flex items-center justify-center">
          <Sword size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excalibur</h1>
          <p className="text-gray-500 text-sm">Agreement Engine — Generate branded property management agreements by asset class</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border shadow-sm divide-y">

        {/* SECTION: Asset Class */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Agreement Type</h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(ASSET_CLASS_LABELS) as [AssetClass, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => update({ assetClass: key })}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left',
                  input.assetClass === key
                    ? 'bg-camelot-gold text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: Property Address + Jackie Pull */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Property</h2>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Property address (e.g., 553 W 187th St)"
              value={input.propertyAddress}
              onChange={e => update({ propertyAddress: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
            />
            <button
              onClick={pullFromJackie}
              disabled={jackieLoading || !input.propertyAddress.trim()}
              className="bg-camelot-gold/10 text-camelot-gold px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-camelot-gold/20 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {jackieLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Pull from Jackie
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="City" value={input.propertyCity} onChange={e => update({ propertyCity: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            <input type="text" placeholder="State" value={input.propertyState} onChange={e => update({ propertyState: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            <input type="text" placeholder="Zip" value={input.propertyZip} onChange={e => update({ propertyZip: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <input type="number" placeholder="Units" value={input.units || ''} onChange={e => update({ units: parseInt(e.target.value) || 0 })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            <input type="text" placeholder="Block/Lot (e.g., Block 2145, Lot 32)" value={input.blockLot} onChange={e => update({ blockLot: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            <input type="text" placeholder="Building type description" value={input.buildingType} onChange={e => update({ buildingType: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
          </div>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={input.isRentStabilized} onChange={e => update({ isRentStabilized: e.target.checked })} className="rounded border-gray-300 text-camelot-gold focus:ring-camelot-gold" />
              Rent Stabilized
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={input.isUnion} onChange={e => update({ isUnion: e.target.checked })} className="rounded border-gray-300 text-camelot-gold focus:ring-camelot-gold" />
              Union (32BJ)
            </label>
          </div>
          {jackieData && (
            <button onClick={autoFill} className="mt-3 text-xs text-camelot-gold hover:underline flex items-center gap-1">
              <Sparkles size={12} /> Auto-fill remaining fields from Jackie data
            </button>
          )}
        </div>

        {/* SECTION: Client / Parties */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Client (Owner)</h2>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Client name (e.g., Jose Ramon Tur)" value={input.clientName} onChange={e => update({ clientName: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            <input type="text" placeholder="Entity name (if different)" value={input.clientEntityName} onChange={e => update({ clientEntityName: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
          </div>
        </div>

        {/* SECTION: Agreement Terms */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Agreement Terms</h2>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Effective Date</label>
              <input type="date" value={input.effectiveDate} onChange={e => update({ effectiveDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Initial Term (years)</label>
              <select value={input.initialTermYears} onChange={e => update({ initialTermYears: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50">
                <option value={1}>1 Year</option>
                <option value={2}>2 Years</option>
                <option value={3}>3 Years</option>
                <option value={5}>5 Years</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Termination Notice (days)</label>
              <select value={input.terminationNoticeDays} onChange={e => update({ terminationNoticeDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50">
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={120}>120 Days</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Annual Increase (%)</label>
              <select value={input.annualIncrease} onChange={e => update({ annualIncrease: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50">
                <option value={3}>3%</option>
                <option value={4}>4%</option>
                <option value={5}>5%</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION: Pricing Tier */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pricing</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {tierOptions.map(t => {
              const pricing = input.tieredPricing;
              const perUnit = pricing ? pricing[t.key].perUnit : null;
              return (
                <button
                  key={t.key}
                  onClick={() => update({ selectedTier: t.key, customMonthlyFee: null })}
                  className={cn(
                    'p-4 rounded-lg text-left transition-all border-2',
                    input.selectedTier === t.key
                      ? t.key === 'intelligence' ? 'bg-camelot-gold/10 border-camelot-gold' : 'bg-gray-50 border-gray-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                  {perUnit && <div className="text-lg font-bold text-camelot-gold mt-2">${perUnit}/unit/mo</div>}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Custom Monthly Fee Override (optional)</label>
              <input type="number" placeholder="Leave blank for auto-calculated" value={input.customMonthlyFee || ''} onChange={e => update({ customMonthlyFee: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Startup / Onboarding Fee (optional)</label>
              <input type="number" placeholder="$0" value={input.startupFee || ''} onChange={e => update({ startupFee: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50" />
            </div>
          </div>
        </div>

        {/* SECTION: Special Terms */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Special Terms (Optional)</h2>
          <textarea
            placeholder="Any special terms, conditions, or notes to include in the agreement..."
            value={input.specialTerms}
            onChange={e => update({ specialTerms: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-6 flex gap-3">
          <button
            onClick={handleGenerate}
            className="bg-camelot-gold text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-camelot-gold-light transition-all flex items-center gap-2 shadow-lg shadow-camelot-gold/20"
          >
            <Sword size={16} /> Generate Agreement
          </button>
          {generated && (
            <>
              <button onClick={handlePreview} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Eye size={16} /> Preview / Print
              </button>
              <button onClick={handleDownload} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Download size={16} /> Download HTML
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preview Summary */}
      {generated && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Agreement Summary</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium">{ASSET_CLASS_LABELS[input.assetClass]}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Client:</span><span className="font-medium">{input.clientName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Property:</span><span className="font-medium">{input.propertyAddress || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Units:</span><span className="font-medium">{input.units || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tier:</span><span className="font-medium text-camelot-gold">{input.selectedTier === 'classic' ? 'Classic' : input.selectedTier === 'intelligence' ? 'Intelligence ⭐' : 'Premier'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Monthly Fee:</span><span className="font-bold text-camelot-gold">${(input.customMonthlyFee || (input.tieredPricing ? input.tieredPricing[input.selectedTier].monthly : 0)).toLocaleString()}/mo</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Term:</span><span className="font-medium">{input.initialTermYears} year(s), {input.annualIncrease}% annual increase</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rent Stabilized:</span><span className="font-medium">{input.isRentStabilized ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
