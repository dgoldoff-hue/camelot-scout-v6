import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { REGIONS } from '@/lib/regions';
import { fetchFullBuildingReport } from '@/lib/nyc-api';
import { calculateScore } from '@/lib/scoring';
import { useBuildingsStore } from '@/lib/store';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { BuildingType, Building } from '@/types';
import toast from 'react-hot-toast';
import {
  Search as SearchIcon, MapPin, ChevronDown, ChevronRight, Building2,
  Loader2, Zap, AlertTriangle, DollarSign, Calendar, X, Filter,
  Activity, TrendingUp, Users, Award,
} from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const addBuildings = useBuildingsStore((s) => s.addBuildings);
  const setFilters = useBuildingsStore((s) => s.setFilters);

  // Quick report state
  const [quickAddress, setQuickAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Region selection
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [minUnits, setMinUnits] = useState('');
  const [maxUnits, setMaxUnits] = useState('');
  const [yearBuiltMin, setYearBuiltMin] = useState('');
  const [yearBuiltMax, setYearBuiltMax] = useState('');
  const [violationThreshold, setViolationThreshold] = useState('');

  // Quick Building Report
  const handleQuickReport = async () => {
    if (!quickAddress.trim()) return;
    setIsSearching(true);
    setReportData(null);
    try {
      const data = await fetchFullBuildingReport(quickAddress.trim());
      setReportData(data);

      // Calculate score
      const score = calculateScore({
        violations_count: data.violations.total,
        open_violations_count: data.violations.open,
        units: data.dof?.units,
        current_management: data.registration?.managementCompany,
        year_built: data.dof?.yearBuilt,
        has_recent_permits: data.permits.hasRecent,
        energy_star_score: data.energy?.energyStarScore ?? undefined,
        site_eui: data.energy?.siteEUI ?? undefined,
      });
      setReportData({ ...data, score });

      toast.success('Building report generated');
    } catch (err) {
      toast.error('Failed to fetch building data');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Region toggling
  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleRegion = (area: string) => {
    setSelectedRegions((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleAllInGroup = (group: typeof REGIONS[0]) => {
    const allSelected = group.areas.every((a) => selectedRegions.includes(a));
    if (allSelected) {
      setSelectedRegions((prev) => prev.filter((a) => !group.areas.includes(a)));
    } else {
      setSelectedRegions((prev) => [...new Set([...prev, ...group.areas])]);
    }
  };

  const toggleBuildingType = (type: BuildingType) => {
    setBuildingTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Run Scan
  const handleScan = () => {
    // Set filters and navigate to results
    setFilters({
      regions: selectedRegions,
      buildingTypes,
      minUnits: minUnits ? parseInt(minUnits) : undefined,
      maxUnits: maxUnits ? parseInt(maxUnits) : undefined,
      yearBuiltMin: yearBuiltMin ? parseInt(yearBuiltMin) : undefined,
      yearBuiltMax: yearBuiltMax ? parseInt(yearBuiltMax) : undefined,
      violationThreshold: violationThreshold ? parseInt(violationThreshold) : undefined,
    } as any);
    toast.success(`Scan started for ${selectedRegions.length} area(s)`);
    navigate('/results');
  };

  // Add quick report building to database
  const handleAddToScout = () => {
    if (!reportData) return;
    const building: Partial<Building> = {
      id: crypto.randomUUID(),
      address: quickAddress,
      name: reportData.energy?.propertyName || quickAddress,
      units: reportData.dof?.units,
      type: 'co-op',
      year_built: reportData.dof?.yearBuilt,
      grade: reportData.score?.grade || 'C',
      score: reportData.score?.total || 0,
      signals: reportData.score?.signals || [],
      contacts: [],
      enriched_data: reportData,
      current_management: reportData.registration?.managementCompany || 'Unknown',
      source: 'nyc_open_data',
      status: 'active',
      tags: [],
      pipeline_stage: 'discovered',
      pipeline_moved_at: new Date().toISOString(),
      violations_count: reportData.violations?.total || 0,
      open_violations_count: reportData.violations?.open || 0,
      market_value: reportData.dof?.marketValue,
      assessed_value: reportData.dof?.assessedValue,
      land_value: reportData.dof?.landValue,
      tax_class: reportData.dof?.taxClass,
      dof_owner: reportData.dof?.owner,
      bbl: reportData.dof?.bbl,
      energy_star_score: reportData.energy?.energyStarScore,
      site_eui: reportData.energy?.siteEUI,
      ghg_emissions: reportData.energy?.ghgEmissions,
      lot_area: reportData.dof?.lotArea,
      building_area: reportData.dof?.buildingArea,
      stories: reportData.dof?.stories,
      building_class: reportData.dof?.buildingClass,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBuildings([building as Building]);
    toast.success('Building added to Scout database');
    navigate('/results');
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-camelot-navy text-white px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">
            🏰 Property Intelligence
          </h1>
          <p className="text-gray-400 mb-6">
            Search any NYC address for instant building reports, or scan entire regions for leads.
          </p>

          {/* Quick Building Report */}
          <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
            <h2 className="text-sm font-semibold text-camelot-gold uppercase tracking-wider mb-3">
              Quick Building Report
            </h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickReport()}
                  placeholder="Enter any NYC address (e.g., 301 East 79th Street)"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                />
              </div>
              <button
                onClick={handleQuickReport}
                disabled={!quickAddress.trim() || isSearching}
                className="bg-camelot-gold text-camelot-navy px-6 py-3 rounded-xl font-semibold hover:bg-camelot-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <SearchIcon size={16} />}
                Search
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { icon: Building2, label: 'Properties', value: '130+' },
              { icon: DollarSign, label: 'Transactions', value: '$500M+' },
              { icon: Calendar, label: 'Years', value: '20+' },
              { icon: TrendingUp, label: 'AUM', value: '$1.5B+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center bg-white/5 rounded-xl p-3 border border-white/10">
                <Icon size={20} className="mx-auto text-camelot-gold mb-1" />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Report Results */}
      {reportData && (
        <div className="max-w-5xl mx-auto px-8 -mt-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Building Report: {quickAddress}</h3>
                {reportData.energy?.propertyName && (
                  <p className="text-sm text-gray-500">{reportData.energy.propertyName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddToScout}
                  className="bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark transition-colors"
                >
                  + Add to Scout
                </button>
                <button onClick={() => setReportData(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Score */}
            {reportData.score && (
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2',
                  reportData.score.grade === 'A' ? 'bg-green-50 text-green-600 border-green-200' :
                  reportData.score.grade === 'B' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                )}>
                  {reportData.score.grade}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead Score</p>
                  <p className="text-2xl font-bold">{reportData.score.total}/100</p>
                </div>
                <div className="ml-auto flex flex-wrap gap-1 max-w-md">
                  {reportData.score.signals.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Data Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* DOF Data */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <DollarSign size={12} /> Property Assessment
                </h4>
                <div className="space-y-1.5">
                  {reportData.dof ? (
                    <>
                      <InfoRow label="Owner" value={reportData.dof.owner || '—'} />
                      <InfoRow label="Market Value" value={formatCurrency(reportData.dof.marketValue)} />
                      <InfoRow label="Assessed Value" value={formatCurrency(reportData.dof.assessedValue)} />
                      <InfoRow label="Land Value" value={formatCurrency(reportData.dof.landValue)} />
                      <InfoRow label="Year Built" value={reportData.dof.yearBuilt || '—'} />
                      <InfoRow label="Units" value={reportData.dof.units || '—'} />
                      <InfoRow label="Lot Area" value={reportData.dof.lotArea ? `${formatNumber(reportData.dof.lotArea)} sf` : '—'} />
                      <InfoRow label="Tax Class" value={reportData.dof.taxClass || '—'} />
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">No DOF data found</p>
                  )}
                </div>
              </div>

              {/* Violations */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> HPD Violations
                </h4>
                <div className="space-y-1.5">
                  <InfoRow label="Total" value={String(reportData.violations.total)} highlight={reportData.violations.total > 20} />
                  <InfoRow label="Open" value={String(reportData.violations.open)} highlight={reportData.violations.open > 5} />
                  <InfoRow label="Last Violation" value={reportData.violations.lastDate ? new Date(reportData.violations.lastDate).toLocaleDateString() : '—'} />
                </div>
                {reportData.registration && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Users size={12} /> Registration
                    </h4>
                    <InfoRow label="Owner" value={reportData.registration.owner || '—'} />
                    <InfoRow label="Management" value={reportData.registration.managementCompany || '—'} />
                  </div>
                )}
              </div>

              {/* Energy & Permits */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Zap size={12} /> Energy / LL97
                </h4>
                <div className="space-y-1.5">
                  {reportData.energy ? (
                    <>
                      <InfoRow label="Energy Star" value={String(reportData.energy.energyStarScore ?? '—')} />
                      <InfoRow label="Site EUI" value={reportData.energy.siteEUI ? `${reportData.energy.siteEUI} kBtu/ft²` : '—'} />
                      <InfoRow label="GHG Emissions" value={reportData.energy.ghgEmissions ? `${reportData.energy.ghgEmissions} MT` : '—'} />
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">No energy data found</p>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Activity size={12} /> DOB Permits
                  </h4>
                  <InfoRow label="Total Permits" value={String(reportData.permits.count)} />
                  <InfoRow label="Recent Activity" value={reportData.permits.hasRecent ? 'Yes' : 'No'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region Selector + Filters */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Region Selector - takes 2 columns */}
          <div className="col-span-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-camelot-gold" /> Region Selector
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select areas to scan. NYC boroughs have live government data; other regions use AI-powered research.
            </p>

            {selectedRegions.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-gray-500">{selectedRegions.length} selected:</span>
                {selectedRegions.slice(0, 8).map((area) => (
                  <span key={area} className="text-xs bg-camelot-gold/10 text-camelot-gold px-2 py-1 rounded-full flex items-center gap-1">
                    {area}
                    <button onClick={() => toggleRegion(area)} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedRegions.length > 8 && (
                  <span className="text-xs text-gray-400">+{selectedRegions.length - 8} more</span>
                )}
                <button
                  onClick={() => setSelectedRegions([])}
                  className="text-xs text-red-500 hover:underline ml-2"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
              {REGIONS.map((group) => {
                const isExpanded = expandedGroups.has(group.name);
                const selectedCount = group.areas.filter((a) => selectedRegions.includes(a)).length;
                const allSelected = selectedCount === group.areas.length;

                return (
                  <div key={group.name} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="font-medium text-sm">{group.name}</span>
                        <span className="text-xs text-gray-400">({group.areas.length} areas)</span>
                        {group.tag && (
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                            group.tag === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          )}>
                            {group.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-xs bg-camelot-gold text-white px-1.5 py-0.5 rounded-full">
                            {selectedCount}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-gray-100">
                        <button
                          onClick={() => toggleAllInGroup(group)}
                          className="text-xs text-camelot-gold hover:underline my-2"
                        >
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                        <div className="grid grid-cols-3 gap-1">
                          {group.areas.map((area) => (
                            <label
                              key={area}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors',
                                selectedRegions.includes(area)
                                  ? 'bg-camelot-gold/10 text-camelot-gold'
                                  : 'hover:bg-gray-50'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selectedRegions.includes(area)}
                                onChange={() => toggleRegion(area)}
                                className="rounded border-gray-300 text-camelot-gold focus:ring-camelot-gold"
                              />
                              {area}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Filters */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Filter size={20} className="text-camelot-gold" /> Filters
            </h2>

            {/* Building Type */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Building Type</label>
              <div className="space-y-1">
                {(['co-op', 'condo', 'rental', 'mixed-use'] as BuildingType[]).map((type) => (
                  <label
                    key={type}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                      buildingTypes.includes(type)
                        ? 'bg-camelot-gold/10 text-camelot-gold'
                        : 'hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={buildingTypes.includes(type)}
                      onChange={() => toggleBuildingType(type)}
                      className="rounded border-gray-300 text-camelot-gold focus:ring-camelot-gold"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Unit Range */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Unit Count</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minUnits}
                  onChange={(e) => setMinUnits(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
                <input
                  type="number"
                  value={maxUnits}
                  onChange={(e) => setMaxUnits(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
              </div>
            </div>

            {/* Year Built */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Year Built</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={yearBuiltMin}
                  onChange={(e) => setYearBuiltMin(e.target.value)}
                  placeholder="From"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
                <input
                  type="number"
                  value={yearBuiltMax}
                  onChange={(e) => setYearBuiltMax(e.target.value)}
                  placeholder="To"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
              </div>
            </div>

            {/* Violation Threshold */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Min. Violations</label>
              <input
                type="number"
                value={violationThreshold}
                onChange={(e) => setViolationThreshold(e.target.value)}
                placeholder="e.g., 10"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
              />
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={selectedRegions.length === 0}
              className="w-full bg-camelot-gold text-white py-3 rounded-xl font-semibold hover:bg-camelot-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <SearchIcon size={18} />
              Scan {selectedRegions.length} Area{selectedRegions.length !== 1 ? 's' : ''}
            </button>
            {selectedRegions.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">Select at least one area to scan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-medium', highlight && 'text-red-600 font-bold')}>{value}</span>
    </div>
  );
}
