import { useState, useCallback } from 'react';
import { fetchLL97Energy } from '@/lib/nyc-api';
import {
  calculateLL97Penalty,
  getComplianceStatus,
  estimateRemediationSavings,
  inferBuildingType,
  EMISSION_LIMITS,
  BUILDING_TYPE_LABELS,
  PERIOD_LABELS,
  PENALTY_PER_TON,
  getCurrentPeriod,
  type LL97BuildingData,
  type LL97BuildingType,
  type LL97PenaltyResult,
  type LL97ComplianceStatus,
  type LL97RemediationEstimate,
} from '@/lib/ll97-calculator';
import { generateComplianceOutreachEmail } from '@/lib/email-templates';
import ComplianceBadge from '@/components/ComplianceBadge';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, MapPin, Loader2, Zap, AlertTriangle, DollarSign,
  Shield, TrendingDown, Mail, Copy, ChevronDown, ChevronUp,
  Building2, Flame, Leaf, BarChart3, Info,
} from 'lucide-react';

type CalculatorMode = 'search' | 'manual';

export default function Compliance() {
  // Search state
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Manual input state
  const [mode, setMode] = useState<CalculatorMode>('search');
  const [buildingType, setBuildingType] = useState<LL97BuildingType>('multifamily');
  const [grossFloorArea, setGrossFloorArea] = useState('');
  const [siteEUI, setSiteEUI] = useState('');
  const [totalEmissions, setTotalEmissions] = useState('');
  const [energyStarScore, setEnergyStarScore] = useState('');

  // Results
  const [penaltyResult, setPenaltyResult] = useState<LL97PenaltyResult | null>(null);
  const [period2Result, setPeriod2Result] = useState<LL97PenaltyResult | null>(null);
  const [remediation, setRemediation] = useState<LL97RemediationEstimate | null>(null);
  const [apiData, setApiData] = useState<any>(null);

  // Email
  const [showEmail, setShowEmail] = useState(false);
  const [emailContent, setEmailContent] = useState<{ subject: string; body: string } | null>(null);

  // Expanded sections
  const [showRemediation, setShowRemediation] = useState(false);

  // Search LL97 benchmarking data for an address
  const handleSearch = useCallback(async () => {
    if (!address.trim()) return;
    setIsSearching(true);
    setPenaltyResult(null);
    setPeriod2Result(null);
    setRemediation(null);
    setApiData(null);
    setShowEmail(false);
    setEmailContent(null);

    try {
      const energyData = await fetchLL97Energy(address.trim());

      if (energyData.length === 0) {
        toast('No LL97 benchmarking data found for this address. Try manual entry.', { icon: '🔍' });
        setMode('manual');
        setIsSearching(false);
        return;
      }

      const record = energyData[0];
      setApiData(record);

      // Auto-populate fields
      const gfa = parseFloat(record.property_gfa_self_reported_ft) || 0;
      const eui = parseFloat(record.site_eui_kbtu_ft) || 0;
      const ghg = parseFloat(record.total_ghg_emissions_metric_tons_co2e) || 0;
      const score = parseInt(record.energy_star_score) || 0;

      setGrossFloorArea(gfa ? String(Math.round(gfa)) : '');
      setSiteEUI(eui ? String(eui) : '');
      setTotalEmissions(ghg ? String(ghg) : '');
      setEnergyStarScore(score ? String(score) : '');

      // Infer building type from occupancy field if possible
      const occupancy = (record.occupancy || '').toLowerCase();
      let inferredType: LL97BuildingType = 'multifamily';
      if (occupancy.includes('office')) inferredType = 'office';
      else if (occupancy.includes('hospital') || occupancy.includes('health')) inferredType = 'healthcare';
      else if (occupancy.includes('retail') || occupancy.includes('store')) inferredType = 'retail';
      else if (occupancy.includes('assembly') || occupancy.includes('worship') || occupancy.includes('entertainment')) inferredType = 'assembly';
      else if (occupancy.includes('multifamily') || occupancy.includes('residential')) inferredType = 'multifamily';
      setBuildingType(inferredType);

      // Calculate
      if (gfa > 0) {
        const buildingData: LL97BuildingData = {
          address: address.trim(),
          buildingType: inferredType,
          grossFloorArea: gfa,
          siteEUI: eui || null,
          totalEmissions: ghg || null,
          energyStarScore: score || null,
        };

        const status = getComplianceStatus(buildingData);
        setPenaltyResult(status.period1);
        setPeriod2Result(status.period2);
        setRemediation(estimateRemediationSavings(buildingData));

        const statusLabel = status.worstStatus;
        if (statusLabel === 'Non-Compliant') {
          toast.error(`Building is Non-Compliant — est. $${status.period1.annualPenalty.toLocaleString()}/yr penalty`);
        } else if (statusLabel === 'At Risk') {
          toast('Building is At Risk for Period 2', { icon: '⚠️' });
        } else {
          toast.success('Building is currently Compliant');
        }
      }
    } catch (err) {
      console.error('LL97 search error:', err);
      toast.error('Failed to fetch LL97 data');
    } finally {
      setIsSearching(false);
    }
  }, [address]);

  // Calculate from manual inputs
  const handleCalculate = useCallback(() => {
    const gfa = parseFloat(grossFloorArea);
    const eui = parseFloat(siteEUI) || null;
    const ghg = parseFloat(totalEmissions) || null;
    const score = parseInt(energyStarScore) || null;

    if (!gfa || gfa <= 0) {
      toast.error('Please enter the Gross Floor Area');
      return;
    }

    if (!eui && !ghg) {
      toast.error('Please enter either Site EUI or Total GHG Emissions');
      return;
    }

    const buildingData: LL97BuildingData = {
      address: address.trim() || 'Manual Entry',
      buildingType,
      grossFloorArea: gfa,
      siteEUI: eui,
      totalEmissions: ghg,
      energyStarScore: score,
    };

    const status = getComplianceStatus(buildingData);
    setPenaltyResult(status.period1);
    setPeriod2Result(status.period2);
    setRemediation(estimateRemediationSavings(buildingData));
    setShowEmail(false);
    setEmailContent(null);

    toast.success('Calculation complete');
  }, [address, buildingType, grossFloorArea, siteEUI, totalEmissions, energyStarScore]);

  // Generate outreach email
  const handleGenerateEmail = useCallback(() => {
    if (!penaltyResult) return;

    const email = generateComplianceOutreachEmail({
      address: address || 'your building',
      annualPenalty: penaltyResult.annualPenalty,
      tenYearExposure: penaltyResult.tenYearExposure + (period2Result?.tenYearExposure || 0),
      complianceStatus: penaltyResult.complianceStatus,
      buildingType: BUILDING_TYPE_LABELS[penaltyResult.buildingType],
      emissionsOverLimit: penaltyResult.emissionsOverLimit,
      energyStarScore: parseInt(energyStarScore) || undefined,
      period2Penalty: period2Result?.annualPenalty,
    });

    setEmailContent(email);
    setShowEmail(true);
  }, [penaltyResult, period2Result, address, energyStarScore]);

  const copyEmail = () => {
    if (!emailContent) return;
    navigator.clipboard.writeText(`Subject: ${emailContent.subject}\n\n${emailContent.body}`);
    toast.success('Email copied to clipboard');
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-camelot-navy text-white px-8 pb-8">
        <div className="max-w-5xl mx-auto pt-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="text-camelot-gold" size={28} />
            LL97 Compliance Engine
          </h1>
          <p className="text-gray-400 mb-6">
            Calculate NYC Local Law 97 carbon penalties, assess compliance risk, and generate outreach for non-compliant buildings.
          </p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('search')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                mode === 'search'
                  ? 'bg-camelot-gold text-camelot-navy shadow-lg shadow-camelot-gold/20'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10',
              )}
            >
              <Search size={15} />
              Search Address
            </button>
            <button
              onClick={() => setMode('manual')}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                mode === 'manual'
                  ? 'bg-camelot-gold text-camelot-navy shadow-lg shadow-camelot-gold/20'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10',
              )}
            >
              <BarChart3 size={15} />
              Manual Calculator
            </button>
          </div>

          {/* Search Bar */}
          {mode === 'search' && (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter any NYC building address (e.g., 1 Penn Plaza)"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 focus:border-camelot-gold transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!address.trim() || isSearching}
                className="bg-camelot-gold text-camelot-navy px-8 py-4 rounded-2xl font-bold text-lg hover:bg-camelot-gold-light transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-camelot-gold/20"
              >
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                Analyze
              </button>
            </div>
          )}

          {/* Manual Input Form */}
          {mode === 'manual' && (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Address (optional)</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Building address"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Building Type</label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value as LL97BuildingType)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  >
                    {Object.entries(BUILDING_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key} className="bg-camelot-navy">{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Gross Floor Area (sq ft) *
                  </label>
                  <input
                    type="number"
                    value={grossFloorArea}
                    onChange={(e) => setGrossFloorArea(e.target.value)}
                    placeholder="e.g., 250000"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Site EUI (kBtu/ft²)
                  </label>
                  <input
                    type="number"
                    value={siteEUI}
                    onChange={(e) => setSiteEUI(e.target.value)}
                    placeholder="e.g., 120"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    GHG Emissions (MT CO2e)
                  </label>
                  <input
                    type="number"
                    value={totalEmissions}
                    onChange={(e) => setTotalEmissions(e.target.value)}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Energy Star Score
                  </label>
                  <input
                    type="number"
                    value={energyStarScore}
                    onChange={(e) => setEnergyStarScore(e.target.value)}
                    placeholder="1–100"
                    min={1}
                    max={100}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-camelot-gold/60 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleCalculate}
                className="bg-camelot-gold text-camelot-navy px-8 py-3 rounded-xl font-bold hover:bg-camelot-gold-light transition-all flex items-center gap-2 shadow-lg shadow-camelot-gold/20"
              >
                <BarChart3 size={18} />
                Calculate Penalty
              </button>
            </div>
          )}

          {/* Quick Reference Card */}
          <div className="mt-6 grid grid-cols-5 gap-3">
            {(Object.entries(EMISSION_LIMITS) as [LL97BuildingType, Record<string, number>][]).map(([type, limits]) => (
              <div key={type} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{BUILDING_TYPE_LABELS[type]}</p>
                <p className="text-sm font-bold text-white">{limits.period1} <span className="text-[10px] text-gray-500">kg/ft²</span></p>
                <p className="text-[10px] text-gray-500">→ {limits.period2} (2030+)</p>
              </div>
            ))}
          </div>

          {/* ====== RESULTS ====== */}
          {penaltyResult && (
            <div className="mt-6 space-y-4 animate-slide-in">
              {/* API Data Card (if from search) */}
              {apiData && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-camelot-gold" /> Benchmarking Data
                    {apiData.property_name && (
                      <span className="text-white font-normal normal-case ml-2">— {apiData.property_name}</span>
                    )}
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    <StatCard
                      label="Energy Star Score"
                      value={apiData.energy_star_score || '—'}
                      subtext={apiData.energy_star_score ? (parseInt(apiData.energy_star_score) >= 75 ? 'Above average' : parseInt(apiData.energy_star_score) >= 50 ? 'Average' : 'Below average') : ''}
                      highlight={apiData.energy_star_score && parseInt(apiData.energy_star_score) < 50}
                    />
                    <StatCard
                      label="Site EUI"
                      value={apiData.site_eui_kbtu_ft ? `${parseFloat(apiData.site_eui_kbtu_ft).toFixed(1)}` : '—'}
                      subtext="kBtu/ft²"
                    />
                    <StatCard
                      label="GHG Emissions"
                      value={apiData.total_ghg_emissions_metric_tons_co2e ? `${parseFloat(apiData.total_ghg_emissions_metric_tons_co2e).toFixed(0)}` : '—'}
                      subtext="MT CO2e"
                    />
                    <StatCard
                      label="Gross Floor Area"
                      value={apiData.property_gfa_self_reported_ft ? formatNumber(Math.round(parseFloat(apiData.property_gfa_self_reported_ft))) : '—'}
                      subtext="sq ft"
                    />
                    <StatCard
                      label="Occupancy Type"
                      value={apiData.occupancy || '—'}
                      subtext=""
                    />
                  </div>
                </div>
              )}

              {/* Main Compliance Card */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Shield size={20} className="text-camelot-gold" />
                      LL97 Compliance Assessment
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{address || 'Manual calculation'}</p>
                  </div>
                  <ComplianceBadge
                    status={penaltyResult.complianceStatus}
                    penalty={penaltyResult.annualPenalty}
                    size="md"
                  />
                </div>

                {/* Period Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <PeriodCard result={penaltyResult} isCurrent />
                  {period2Result && <PeriodCard result={period2Result} />}
                </div>

                {/* Emissions Bar Visual */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Emissions vs. Limit — {PERIOD_LABELS[penaltyResult.period]}
                  </h4>
                  <EmissionsBar result={penaltyResult} />
                  {period2Result && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Emissions vs. Limit — {PERIOD_LABELS[period2Result.period]}
                      </h4>
                      <EmissionsBar result={period2Result} />
                    </div>
                  )}
                </div>

                {/* 10-Year Exposure */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Period 1 Exposure (6yr)</p>
                    <p className="text-2xl font-bold text-red-400">
                      ${penaltyResult.tenYearExposure.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Period 2 Exposure (5yr)</p>
                    <p className="text-2xl font-bold text-red-400">
                      ${(period2Result?.tenYearExposure || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-camelot-gold/10 rounded-xl p-4 border border-camelot-gold/30 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Total 11-Year Exposure</p>
                    <p className="text-2xl font-bold text-camelot-gold">
                      ${(penaltyResult.tenYearExposure + (period2Result?.tenYearExposure || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Remediation Savings */}
                {remediation && remediation.currentPenalty > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <button
                      onClick={() => setShowRemediation(!showRemediation)}
                      className="flex items-center gap-2 text-sm font-semibold text-camelot-gold hover:text-camelot-gold-light transition-colors w-full"
                    >
                      <Leaf size={16} />
                      Remediation Savings Estimate
                      {showRemediation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showRemediation && (
                      <div className="mt-4 grid grid-cols-3 gap-4 animate-fade-in">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">20% Energy Reduction</p>
                          <p className="text-lg font-bold text-green-400">
                            −${remediation.savingsFrom20PctReduction.toLocaleString()}/yr
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining penalty: ${remediation.penaltyAfter20PctReduction.toLocaleString()}/yr
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">40% Energy Reduction</p>
                          <p className="text-lg font-bold text-green-400">
                            −${remediation.savingsFrom40PctReduction.toLocaleString()}/yr
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {remediation.canAchieveComplianceWith40Pct
                              ? '✅ Full compliance achieved'
                              : `Remaining: $${remediation.penaltyAfter40PctReduction.toLocaleString()}/yr`}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">For Full Compliance</p>
                          <p className="text-lg font-bold text-camelot-gold">
                            {remediation.reductionNeededForCompliance != null
                              ? `${remediation.reductionNeededForCompliance}% reduction`
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Energy reduction needed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Generate Email Button */}
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleGenerateEmail}
                    className="bg-camelot-gold text-camelot-navy px-6 py-3 rounded-xl font-bold hover:bg-camelot-gold-light transition-all flex items-center gap-2 shadow-lg shadow-camelot-gold/20"
                  >
                    <Mail size={16} />
                    Generate Compliance Outreach Email
                  </button>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Info size={10} />
                    <span>Uses building data to create a professional outreach email</span>
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              {showEmail && emailContent && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail size={14} className="text-camelot-gold" /> Outreach Email Preview
                    </h3>
                    <button
                      onClick={copyEmail}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-gray-300 transition-colors"
                    >
                      <Copy size={12} />
                      Copy to Clipboard
                    </button>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Subject:</p>
                    <p className="text-sm font-semibold text-white mb-4">{emailContent.subject}</p>
                    <p className="text-xs text-gray-400 mb-1">Body:</p>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {emailContent.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section (below hero) */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="p-5 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={18} className="text-red-500" />
              <h3 className="font-semibold text-sm">What is LL97?</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              NYC Local Law 97 (2019) sets greenhouse gas emission limits for buildings over 25,000 sq ft.
              Buildings exceeding their caps face penalties of <strong>${PENALTY_PER_TON}/metric ton</strong> CO2 per year.
            </p>
          </div>
          <div className="p-5 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <h3 className="font-semibold text-sm">Compliance Periods</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Period 1 (2024–2029):</strong> Initial limits — many buildings will comply.<br />
              <strong>Period 2 (2030–2034):</strong> Significantly stricter limits — penalties jump dramatically for unprepared buildings.
            </p>
          </div>
          <div className="p-5 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} className="text-camelot-gold" />
              <h3 className="font-semibold text-sm">Camelot Can Help</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Camelot Property Management provides compliance consulting, energy audits, capital improvement planning,
              and full-service building management to help owners avoid costly LL97 penalties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({ label, value, subtext, highlight }: {
  label: string; value: string; subtext: string; highlight?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn('text-lg font-bold', highlight ? 'text-red-400' : 'text-white')}>{value}</p>
      {subtext && <p className="text-[10px] text-gray-500">{subtext}</p>}
    </div>
  );
}

function PeriodCard({ result, isCurrent }: { result: LL97PenaltyResult; isCurrent?: boolean }) {
  const isOver = result.emissionsOverLimit > 0;

  return (
    <div className={cn(
      'rounded-xl p-4 border',
      isCurrent ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/10',
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {result.periodLabel}
        </h4>
        {isCurrent && (
          <span className="text-[10px] bg-camelot-gold/20 text-camelot-gold px-2 py-0.5 rounded-full border border-camelot-gold/30">
            Current
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Emissions Limit</span>
          <span className="text-gray-300 font-medium">{result.totalEmissionsLimit.toLocaleString()} MT</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Estimated Emissions</span>
          <span className={cn('font-medium', isOver ? 'text-red-400' : 'text-green-400')}>
            {result.estimatedActualEmissions.toLocaleString()} MT
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Over Limit</span>
          <span className={cn('font-bold', isOver ? 'text-red-400' : 'text-green-400')}>
            {isOver ? `+${result.emissionsOverLimit.toLocaleString()} MT` : '—'}
          </span>
        </div>
        <div className="border-t border-white/10 pt-2 flex justify-between text-xs">
          <span className="text-gray-500 font-semibold">Annual Penalty</span>
          <span className={cn('font-bold text-sm', isOver ? 'text-red-400' : 'text-green-400')}>
            {isOver ? `$${result.annualPenalty.toLocaleString()}` : '$0'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmissionsBar({ result }: { result: LL97PenaltyResult }) {
  if (result.totalEmissionsLimit <= 0) return null;

  const ratio = result.estimatedActualEmissions / result.totalEmissionsLimit;
  const pct = Math.min(ratio * 100, 150); // Cap visual at 150%
  const isOver = ratio > 1;
  const limitPct = Math.min(100 / (pct / 100), 100);

  return (
    <div>
      <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden border border-white/10">
        {/* Emissions bar */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-lg transition-all duration-700',
            isOver ? 'bg-red-500/40' : ratio > 0.9 ? 'bg-yellow-500/40' : 'bg-green-500/40',
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
        {/* Limit line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white/60 z-10"
          style={{ left: `${limitPct}%` }}
        />
        <div
          className="absolute top-0 text-[9px] text-white/60 font-medium z-10 -translate-x-1/2"
          style={{ left: `${limitPct}%` }}
        >
          Limit
        </div>
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
        <span>0 MT</span>
        <span>
          {result.estimatedActualEmissions.toLocaleString()} / {result.totalEmissionsLimit.toLocaleString()} MT
          ({(ratio * 100).toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}
