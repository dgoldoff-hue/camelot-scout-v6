import { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Mail,
  Map,
  Printer,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { downloadAsHTML, openBrochureForPrint, openEmailDraft } from '@/lib/pdf-generator';
import {
  ARTHUR_CRITERIA_FIELDS,
  DEFAULT_ARTHUR_CRITERIA,
  type ArthurCriteria,
  type ArthurDealType,
  type ArthurProperty,
  arthurDealTypeLabel,
  buildArthurFilename,
  buildArthurModel,
  buildArthurReportHtml,
  downloadArthurExcel,
  sanitizeArthurCriteria,
  searchArthurListings,
} from '@/lib/arthur-underwriting';

const DEAL_TYPES: ArthurDealType[] = [
  'commercial',
  'family_internal',
  'gp_lp',
  'jv',
  'land_lease',
  'new_development',
  'land_purchase',
  'one_to_four_family',
  'walk_up',
  'elevator',
  'mixed_use',
  'hoa_condo_recovery',
];

export default function Arthur() {
  const [criteria, setCriteria] = useState<ArthurCriteria>(DEFAULT_ARTHUR_CRITERIA);
  const [results, setResults] = useState<ArthurProperty[]>(() => searchArthurListings(DEFAULT_ARTHUR_CRITERIA));
  const [selectedId, setSelectedId] = useState(results[0]?.id || '');
  const [isSearching, setIsSearching] = useState(false);

  const selected = useMemo(
    () => results.find((property) => property.id === selectedId) || results[0],
    [results, selectedId]
  );
  const hasNearestResults = results.some((property) => property.matchStatus === 'nearest');
  const model = useMemo(() => selected ? buildArthurModel(selected) : null, [selected]);
  const reportHtml = useMemo(() => selected && model ? buildArthurReportHtml(selected, criteria, model) : '', [selected, criteria, model]);

  const runSearch = () => {
    setIsSearching(true);
    window.setTimeout(() => {
      const next = searchArthurListings(criteria);
      setResults(next);
      setSelectedId(next[0]?.id || '');
      setIsSearching(false);
      const nearest = next.some((property) => property.matchStatus === 'nearest');
      toast.success(nearest ? `${next.length} nearest Arthur candidates shown` : `${next.length} Arthur candidate${next.length === 1 ? '' : 's'} found`);
    }, 300);
  };

  const toggleDealType = (type: ArthurDealType) => {
    setCriteria((prev) => ({
      ...prev,
      dealTypes: prev.dealTypes.includes(type)
        ? prev.dealTypes.filter((item) => item !== type)
        : [...prev.dealTypes, type],
    }));
  };

  const sendToHubSpot = async () => {
    if (!selected) return;
    const quality = { score: Math.round((selected.neighborhoodScore + selected.commuteScore) / 2), tier: 'hot', missingFields: [], strengths: selected.pros, warnings: selected.cons };
    const routing = { team: 'Arthur / acquisitions desk', region: selected.location, priority: 'same-day', tags: ['arthur-underwriting', selected.type, 'investment-candidate'] };
    try {
      const response = await fetch('/api/integrations/push-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building: {
            id: selected.id,
            name: selected.name,
            address: selected.address,
            units: selected.units,
            type: 'mixed-use',
            score: quality.score,
            grade: quality.score >= 76 ? 'A' : 'B',
            current_management: 'Owner / management to verify',
            market_value: selected.askingPrice,
            assessed_value: selected.lastSalePrice,
            violations_count: selected.violations,
            open_violations_count: selected.violations,
            signals: [...selected.pros, ...selected.cons],
            tags: routing.tags,
          },
          contact: {
            name: selected.listingAgent,
            email: '',
            phone: '',
            role: 'listing_agent',
            company: selected.listingSource,
          },
          quality,
          routing,
        }),
      });
      const data = await response.json();
      if (!response.ok && data.status === 'error') throw new Error(data.hubspot?.message || data.scout?.message || 'HubSpot push failed');
      toast.success('Arthur candidate sent through Scout/HubSpot integration workflow');
    } catch (err: any) {
      toast.error(err.message || 'HubSpot workflow failed');
    }
  };

  const emailReport = () => {
    if (!selected) return;
    openEmailDraft({
      to: '',
      subject: `Arthur Investment Report - ${selected.address}`,
      body: `To the investment review team,\n\nAttached/linked is the Arthur Investment Report for ${selected.address}. The opportunity includes ${selected.units} units, estimated base IRR of ${model ? (model.irr * 100).toFixed(1) : 'TBD'}%, and an underwriting package that should be reviewed alongside Jackie operator diligence.\n\nSincerely,\nCamelot`,
    });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 size={25} className="text-camelot-gold" /> Arthur AI Underwriter
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Investment search, acquisition criteria, live underwriting, subject-property report, HubSpot handoff, HTML/PDF/email and editable Excel model.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={runSearch} className="inline-flex items-center gap-2 bg-camelot-navy text-white px-3 py-2 rounded-md text-sm hover:bg-camelot-navy/90">
              {isSearching ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />} Run Listing Search
            </button>
            {selected && (
              <>
                <button onClick={() => openBrochureForPrint(reportHtml, buildArthurFilename(selected, 'html'))} className="action-btn"><Printer size={15} /> Print / Save PDF</button>
                <button onClick={() => downloadAsHTML(reportHtml, buildArthurFilename(selected, 'html'))} className="action-btn"><FileText size={15} /> HTML</button>
                <button onClick={() => downloadArthurExcel(selected, criteria)} className="action-btn"><FileSpreadsheet size={15} /> Excel Model</button>
                <button onClick={emailReport} className="action-btn"><Mail size={15} /> Email</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <section className="grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] gap-5">
          <CriteriaPanel criteria={criteria} setCriteria={setCriteria} toggleDealType={toggleDealType} />
          <div className="space-y-5">
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold flex items-center gap-2"><SlidersHorizontal size={18} className="text-camelot-gold" /> Required Criteria Coverage</h2>
                  <p className="text-xs text-gray-500 mt-1">Arthur asks these questions before and after report generation so assumptions can be changed live.</p>
                </div>
                <span className="text-xs text-camelot-gold font-semibold">{ARTHUR_CRITERIA_FIELDS.length} data points</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {ARTHUR_CRITERIA_FIELDS.map((field) => (
                  <span key={field} className="text-xs bg-camelot-cream border border-gray-200 rounded-full px-3 py-1">{field}</span>
                ))}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Listing Search Results</h2>
                  <p className="text-xs text-gray-500">Pick a property to study. Arthur updates the report and model live.</p>
                </div>
                <span className="text-xs text-gray-500">{results.length} candidates</span>
              </div>
              {hasNearestResults && (
                <div className="mx-4 mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  No exact match was found for the current unit/SF/type range, so Arthur is showing nearest candidates instead of returning an empty report queue.
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="text-left p-3">Property</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-right p-3">Units</th>
                      <th className="text-right p-3">Cap</th>
                      <th className="text-right p-3">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((property) => {
                      const score = Math.round((property.commuteScore + property.neighborhoodScore + (100 - Math.min(80, property.violations))) / 3);
                      const active = selected?.id === property.id;
                      return (
                        <tr
                          key={property.id}
                          onClick={() => setSelectedId(property.id)}
                          className={cn('border-t border-gray-100 cursor-pointer hover:bg-camelot-gold/5', active && 'bg-camelot-gold/10')}
                        >
                          <td className="p-3">
                            <p className="font-semibold">{property.name}</p>
                            <p className="text-xs text-gray-500">{property.address}</p>
                            {property.matchStatus === 'nearest' && <p className="text-[11px] font-semibold text-amber-700 mt-1">Nearest candidate</p>}
                          </td>
                          <td className="p-3">{arthurDealTypeLabel(property.type)}</td>
                          <td className="p-3 text-right">{formatCurrency(property.askingPrice)}</td>
                          <td className="p-3 text-right">{property.units}</td>
                          <td className="p-3 text-right">{(property.capRate * 100).toFixed(1)}%</td>
                          <td className="p-3 text-right font-semibold">{score}/100</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        {selected && model && (
          <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={sendToHubSpot} className="inline-flex items-center gap-2 bg-emerald-700 text-white px-3 py-2 rounded-md text-sm hover:bg-emerald-800">
                    <Send size={15} /> Scout / HubSpot
                  </button>
                  <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selected.address + ' property records')}`, '_blank')} className="action-btn">
                    <ExternalLink size={15} /> Source Search
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                <Metric label="Total Basis" value={formatCurrency(model.totalBasis)} />
                <Metric label="Equity Required" value={formatCurrency(model.equityRequired)} />
                <Metric label="Base IRR" value={`${(model.irr * 100).toFixed(1)}%`} />
                <Metric label="Equity Multiple" value={`${model.equityMultiple.toFixed(2)}x`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
                <iframe title="Subject property map" className="w-full h-72 border border-gray-200 rounded-lg" src={`https://www.google.com/maps?q=${encodeURIComponent(selected.address)}&output=embed`} />
                <iframe title="Subject property street view" className="w-full h-72 border border-gray-200 rounded-lg" src={`https://www.google.com/maps?q=${encodeURIComponent(selected.address)}&output=embed`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                <Card title="Pros">
                  {selected.pros.map((item) => <Bullet key={item} positive>{item}</Bullet>)}
                </Card>
                <Card title="Cons / Caveats">
                  {selected.cons.map((item) => <Bullet key={item}>{item}</Bullet>)}
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                <Card title="Ownership, Zoning & Listing">
                  <Info label="Ownership" value={selected.ownership} />
                  <Info label="Zoning" value={selected.zoning} />
                  <Info label="Violations" value={`${selected.violations}`} />
                  <Info label="Flood Zone" value={selected.floodZone} />
                  <Info label="Listing Agent" value={selected.listingAgent} />
                  <Info label="Last Sale" value={`${formatCurrency(selected.lastSalePrice)} on ${selected.lastSaleDate}`} />
                </Card>
                <Card title="Neighborhood Intelligence">
                  <Info label="Commute Score" value={`${selected.commuteScore}/100`} />
                  <Info label="School Score" value={`${selected.schoolScore}/100`} />
                  <Info label="Crime Score" value={`${selected.crimeScore}/100`} />
                  <Info label="Neighborhood Score" value={`${selected.neighborhoodScore}/100`} />
                  <Info label="Taxes" value={formatCurrency(selected.taxes)} />
                  <Info label="Insurance Estimate" value={formatCurrency(selected.insurance)} />
                </Card>
              </div>
            </div>

            <aside className="space-y-5">
              <Card title="Sensitivity Analysis">
                <div className="space-y-3">
                  {model.sensitivity.map((row) => (
                    <div key={row.caseName} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{row.caseName}</p>
                        <p className="text-camelot-gold font-bold">{(row.irr * 100).toFixed(1)}%</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Exit cap {(row.exitCap * 100).toFixed(2)}% | Growth {(row.rentGrowth * 100).toFixed(1)}% | {row.equityMultiple.toFixed(2)}x</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Comps">
                {selected.comps.map((comp) => (
                  <div key={comp.address} className="border-b border-gray-100 last:border-b-0 py-2">
                    <p className="font-semibold text-sm">{comp.address}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(comp.price)} | {comp.units} units | {(comp.capRate * 100).toFixed(1)}% cap | {comp.distance}</p>
                  </div>
                ))}
              </Card>

              <Card title="Model Inputs">
                <Info label="Purchase Price" value={formatCurrency(model.purchasePrice)} />
                <Info label="Closing Costs" value={formatCurrency(model.closingCosts)} />
                <Info label="Repair Cost" value={formatCurrency(model.repairCost)} />
                <Info label="Loan Amount" value={formatCurrency(model.loanAmount)} />
                <Info label="Stabilized NOI" value={formatCurrency(model.stabilizedNoi)} />
                <Info label="DSCR" value={`${model.dscr.toFixed(2)}x`} />
              </Card>
            </aside>
          </section>
        )}
      </div>

      <style>{`
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
        }
        .action-btn:hover { background: #f9fafb; }
      `}</style>
    </div>
  );
}

function CriteriaPanel({
  criteria,
  setCriteria,
  toggleDealType,
}: {
  criteria: ArthurCriteria;
  setCriteria: React.Dispatch<React.SetStateAction<ArthurCriteria>>;
  toggleDealType: (type: ArthurDealType) => void;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5 h-fit">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold flex items-center gap-2"><Search size={18} className="text-camelot-gold" /> Arthur Search Criteria</h2>
          <p className="text-xs text-gray-500 mt-1">Change assumptions here before or after report generation.</p>
        </div>
        <button
          onClick={() => setCriteria(sanitizeArthurCriteria(DEFAULT_ARTHUR_CRITERIA))}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4 mt-5">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-gray-500">Location</span>
          <input value={criteria.location} onChange={(e) => setCriteria((p) => ({ ...p, location: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wide text-gray-500">Block / Lot</span>
          <input value={criteria.blockLot} onChange={(e) => setCriteria((p) => ({ ...p, blockLot: e.target.value }))} placeholder="Optional BBL, APN, block/lot" className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Min Units" value={criteria.minUnits} onChange={(value) => setCriteria((p) => ({ ...p, minUnits: value }))} />
          <NumberInput label="Max Units" hint="0 = no max" value={criteria.maxUnits} onChange={(value) => setCriteria((p) => ({ ...p, maxUnits: value }))} />
          <NumberInput label="Min SF" value={criteria.minSqft} onChange={(value) => setCriteria((p) => ({ ...p, minSqft: value }))} />
          <NumberInput label="Max SF" hint="0 = no max" value={criteria.maxSqft} onChange={(value) => setCriteria((p) => ({ ...p, maxSqft: value }))} />
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-gray-500">Deal Type</span>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {DEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleDealType(type)}
                className={cn(
                  'text-left text-xs border rounded-md px-2 py-2',
                  criteria.dealTypes.includes(type)
                    ? 'bg-camelot-gold/15 border-camelot-gold text-camelot-dark'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                {arthurDealTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Toggle label="Massing study" checked={criteria.massingStudy} onChange={(value) => setCriteria((p) => ({ ...p, massingStudy: value }))} />
          <Toggle label="Flood zone" checked={criteria.floodZone} onChange={(value) => setCriteria((p) => ({ ...p, floodZone: value }))} />
          <Toggle label="Tax sensitivity" checked={criteria.taxSensitivity} onChange={(value) => setCriteria((p) => ({ ...p, taxSensitivity: value }))} />
          <Toggle label="Insurance estimate" checked={criteria.insuranceEstimate} onChange={(value) => setCriteria((p) => ({ ...p, insuranceEstimate: value }))} />
          <Toggle label="US Census profile" checked={criteria.censusProfile} onChange={(value) => setCriteria((p) => ({ ...p, censusProfile: value }))} />
          <Toggle label="School / crime / neighborhood scores" checked={criteria.schoolCrimeNeighborhoodScores} onChange={(value) => setCriteria((p) => ({ ...p, schoolCrimeNeighborhoodScores: value }))} />
          <Toggle label="Repair and labor cost estimate" checked={criteria.repairCostEstimate} onChange={(value) => setCriteria((p) => ({ ...p, repairCostEstimate: value }))} />
          <Toggle label="Commercial and bridge rates" checked={criteria.includeCommercialRates && criteria.includeBridgeRates} onChange={(value) => setCriteria((p) => ({ ...p, includeCommercialRates: value, includeBridgeRates: value }))} />
          <Toggle label="Investor friendly" checked={criteria.investorFriendly} onChange={(value) => setCriteria((p) => ({ ...p, investorFriendly: value }))} />
        </div>
      </div>
    </section>
  );
}

function NumberInput({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value) || 0)}
        className="mt-1 w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
      />
      {hint && <span className="mt-1 block text-[11px] text-gray-400">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 border border-gray-200 rounded-md px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-camelot-cream">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Bullet({ children, positive = false }: { children: React.ReactNode; positive?: boolean }) {
  return (
    <p className="flex items-start gap-2 text-sm text-gray-600 mb-2">
      <span className={cn('mt-1 w-2 h-2 rounded-full flex-shrink-0', positive ? 'bg-emerald-600' : 'bg-amber-600')} />
      {children}
    </p>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 last:border-b-0 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value || 'To verify'}</span>
    </div>
  );
}
