import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  fetchCompetitorPortfolio,
  scoreCompetitor,
  findDisplacementTargets,
  fetchHeatMapData,
  KNOWN_COMPETITORS,
  type CompetitorProfile,
  type DisplacementTarget,
  type HeatMapData,
  type CompetitorBuilding,
} from '@/lib/competitors';
import CompetitorCard from '@/components/CompetitorCard';
import HeatMap from '@/components/HeatMap';
import {
  Search, Swords, MapPin, Target, TrendingDown, Building2,
  AlertTriangle, Loader2, RefreshCw, ChevronRight, X, Shield,
} from 'lucide-react';

// ============================================================
// Intelligence Page
// ============================================================

export default function Intelligence() {
  // Competitor search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<CompetitorProfile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pre-loaded competitor list
  const [competitorList, setCompetitorList] = useState<CompetitorProfile[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  // Heat map
  const [heatMapData, setHeatMapData] = useState<HeatMapData | null>(null);
  const [heatMapLoading, setHeatMapLoading] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<{ name: string; borough: string } | null>(null);

  // Displacement targets
  const [displacementTargets, setDisplacementTargets] = useState<DisplacementTarget[]>([]);
  const [displacementLoading, setDisplacementLoading] = useState(false);
  const [displacementCompetitor, setDisplacementCompetitor] = useState<string | null>(null);

  // Vulnerable buildings panel
  const [vulnerableProfile, setVulnerableProfile] = useState<CompetitorProfile | null>(null);

  // ---- Load heat map on mount ----
  useEffect(() => {
    loadHeatMap();
  }, []);

  const loadHeatMap = async () => {
    setHeatMapLoading(true);
    try {
      const data = await fetchHeatMapData();
      setHeatMapData(data);
    } catch (err) {
      console.error('Heat map load error:', err);
    } finally {
      setHeatMapLoading(false);
    }
  };

  // ---- Search competitor ----
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const buildings = await fetchCompetitorPortfolio(searchQuery.trim());
      if (buildings.length === 0) {
        setSearchError(`No buildings found for "${searchQuery}". Try a different company name.`);
        return;
      }
      const profile = scoreCompetitor(buildings);
      profile.name = searchQuery.trim();
      setSearchResult(profile);
    } catch (err) {
      setSearchError('Failed to fetch competitor data. Please try again.');
      console.error('Competitor search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ---- Load pre-populated competitors ----
  const loadCompetitorList = async () => {
    setListLoading(true);
    setLoadedCount(0);
    const profiles: CompetitorProfile[] = [];

    for (const name of KNOWN_COMPETITORS) {
      try {
        const buildings = await fetchCompetitorPortfolio(name);
        const profile = scoreCompetitor(buildings);
        profile.name = name;
        profiles.push(profile);
        setLoadedCount((c) => c + 1);
      } catch (err) {
        console.error(`Failed to load ${name}:`, err);
        setLoadedCount((c) => c + 1);
      }
    }

    setCompetitorList(profiles.sort((a, b) => a.avgScore - b.avgScore)); // worst first
    setListLoading(false);
  };

  // ---- Find displacement targets ----
  const handleFindDisplacement = async (competitorName: string) => {
    setDisplacementLoading(true);
    setDisplacementCompetitor(competitorName);
    setDisplacementTargets([]);

    try {
      const targets = await findDisplacementTargets(competitorName);
      setDisplacementTargets(targets);
    } catch (err) {
      console.error('Displacement search error:', err);
    } finally {
      setDisplacementLoading(false);
    }
  };

  // ---- View vulnerable buildings ----
  const handleViewVulnerable = (profile: CompetitorProfile) => {
    setVulnerableProfile(profile);
  };

  // ---- Neighborhood click ----
  const handleNeighborhoodClick = (name: string, borough: string) => {
    setSelectedNeighborhood({ name, borough });
  };

  return (
    <div className="min-h-screen bg-camelot-dark">
      {/* Header */}
      <div className="bg-camelot-navy border-b border-gray-700/50 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Swords size={24} className="text-camelot-gold" />
            Competitive Intelligence
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Analyze competitor portfolios, identify weak spots, and find displacement opportunities
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-10">
        {/* ============================================ */}
        {/* Section 1: Competitor Search */}
        {/* ============================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Search size={18} className="text-camelot-gold" />
            Competitor Search
          </h2>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter management company name (e.g. AKAM, Orsid Realty)..."
                className="w-full bg-camelot-navy-light border border-gray-700/50 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-camelot-gold/50 focus:ring-1 focus:ring-camelot-gold/30 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className={cn(
                'px-6 py-3 rounded-lg text-sm font-medium transition-all',
                'bg-camelot-gold text-camelot-navy hover:bg-camelot-gold-light',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Analyze
            </button>
          </div>

          {/* Quick competitor buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {KNOWN_COMPETITORS.slice(0, 7).map((name) => (
              <button
                key={name}
                onClick={() => { setSearchQuery(name); }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-gray-700/50 text-gray-400 hover:text-camelot-gold hover:border-camelot-gold/30 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>

          {/* Search error */}
          {searchError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-sm text-red-400">{searchError}</span>
            </div>
          )}

          {/* Search result */}
          {searchResult && (
            <div className="mt-4">
              <CompetitorCard
                profile={searchResult}
                onViewVulnerable={handleViewVulnerable}
              />
            </div>
          )}
        </section>

        {/* ============================================ */}
        {/* Section 2: Pre-loaded Competitor List */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 size={18} className="text-camelot-gold" />
              NYC Competitor Overview
            </h2>
            <button
              onClick={loadCompetitorList}
              disabled={listLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all',
                'border border-gray-700/50 text-gray-400 hover:text-camelot-gold hover:border-camelot-gold/30',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {listLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Loading {loadedCount}/{KNOWN_COMPETITORS.length}...
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  {competitorList.length > 0 ? 'Refresh' : 'Load Competitors'}
                </>
              )}
            </button>
          </div>

          {/* Loading progress */}
          {listLoading && (
            <div className="mb-4">
              <div className="w-full bg-gray-700/30 rounded-full h-1.5">
                <div
                  className="bg-camelot-gold h-full rounded-full transition-all duration-300"
                  style={{ width: `${(loadedCount / KNOWN_COMPETITORS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {competitorList.length === 0 && !listLoading ? (
            <div className="bg-camelot-navy-light border border-gray-700/30 rounded-xl p-8 text-center">
              <Building2 size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Click "Load Competitors" to analyze {KNOWN_COMPETITORS.length} known NYC management companies
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This fetches live data from NYC Open Data — may take 1-2 minutes
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitorList.map((profile) => (
                <CompetitorCard
                  key={profile.name}
                  profile={profile}
                  onViewVulnerable={handleViewVulnerable}
                />
              ))}
            </div>
          )}
        </section>

        {/* ============================================ */}
        {/* Section 3: Geographic Heat Map */}
        {/* ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin size={18} className="text-camelot-gold" />
              NYC Geographic Heat Map
            </h2>
            <button
              onClick={loadHeatMap}
              disabled={heatMapLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-camelot-gold border border-gray-700/50 hover:border-camelot-gold/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={heatMapLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="bg-camelot-navy-light border border-gray-700/50 rounded-xl p-6">
            <HeatMap
              data={heatMapData}
              loading={heatMapLoading}
              onNeighborhoodClick={handleNeighborhoodClick}
            />
          </div>

          {/* Selected Neighborhood Info */}
          {selectedNeighborhood && (
            <div className="mt-3 bg-camelot-navy-light border border-camelot-gold/20 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-camelot-gold" />
                <span className="text-sm text-white font-medium">{selectedNeighborhood.name}</span>
                <span className="text-xs text-gray-400">{selectedNeighborhood.borough}</span>
              </div>
              <button
                onClick={() => setSelectedNeighborhood(null)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </section>

        {/* ============================================ */}
        {/* Section 4: Displacement Opportunities */}
        {/* ============================================ */}
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Target size={18} className="text-camelot-gold" />
            Displacement Opportunities
          </h2>

          {/* Competitor selector for displacement analysis */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-gray-500 self-center mr-1">Analyze:</span>
            {KNOWN_COMPETITORS.map((name) => (
              <button
                key={name}
                onClick={() => handleFindDisplacement(name)}
                disabled={displacementLoading}
                className={cn(
                  'text-[11px] px-3 py-1.5 rounded-full border transition-all',
                  displacementCompetitor === name
                    ? 'border-camelot-gold/50 bg-camelot-gold/10 text-camelot-gold'
                    : 'border-gray-700/50 text-gray-400 hover:text-camelot-gold hover:border-camelot-gold/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Loading */}
          {displacementLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 size={20} className="animate-spin text-camelot-gold" />
              <span className="text-sm text-gray-400">
                Analyzing {displacementCompetitor} portfolio for weaknesses...
              </span>
            </div>
          )}

          {/* No results */}
          {!displacementLoading && displacementCompetitor && displacementTargets.length === 0 && (
            <div className="bg-camelot-navy-light border border-gray-700/30 rounded-xl p-8 text-center">
              <Shield size={32} className="text-green-500/50 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                No vulnerable buildings found for {displacementCompetitor}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Their portfolio appears well-managed, or data is limited
              </p>
            </div>
          )}

          {/* Displacement targets list */}
          {!displacementLoading && displacementTargets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Found <strong className="text-camelot-gold">{displacementTargets.length}</strong> displacement
                opportunities in {displacementCompetitor}'s portfolio
              </p>

              {displacementTargets.map((target, i) => (
                <DisplacementTargetCard key={target.building.buildingId || i} target={target} rank={i + 1} />
              ))}
            </div>
          )}

          {/* No competitor selected */}
          {!displacementCompetitor && !displacementLoading && (
            <div className="bg-camelot-navy-light border border-gray-700/30 rounded-xl p-8 text-center">
              <Target size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Select a competitor above to find their weakest buildings
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Buildings with high violations and low scores are prime displacement targets
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ============================================ */}
      {/* Slide-over: Vulnerable Buildings */}
      {/* ============================================ */}
      {vulnerableProfile && (
        <VulnerableBuildingsPanel
          profile={vulnerableProfile}
          onClose={() => setVulnerableProfile(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Displacement Target Card
// ============================================================

function DisplacementTargetCard({ target, rank }: { target: DisplacementTarget; rank: number }) {
  const { building, reasons, opportunityScore, competitorName } = target;

  return (
    <div className="bg-camelot-navy-light border border-gray-700/50 rounded-lg p-4 hover:border-camelot-gold/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Rank */}
          <div className="w-8 h-8 rounded-full bg-camelot-gold/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-camelot-gold">#{rank}</span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">{building.address}</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              {building.borough} • {building.units} units • Managed by {competitorName}
            </p>

            {/* Reasons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {reasons.map((reason, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunity Score */}
        <div className="flex flex-col items-center flex-shrink-0 ml-4">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border-2',
            opportunityScore >= 75 ? 'border-red-500/50 bg-red-500/10' :
            opportunityScore >= 50 ? 'border-orange-500/50 bg-orange-500/10' :
            'border-yellow-500/50 bg-yellow-500/10'
          )}>
            <span className={cn(
              'text-sm font-bold',
              opportunityScore >= 75 ? 'text-red-400' :
              opportunityScore >= 50 ? 'text-orange-400' :
              'text-yellow-400'
            )}>
              {opportunityScore}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-1">Opportunity</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700/30">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-orange-400" />
          <span className="text-[11px] text-gray-400">
            {building.openViolations} open violations
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={11} className="text-red-400" />
          <span className="text-[11px] text-gray-400">
            {building.violationsPerUnit} viol/unit
          </span>
        </div>
        {building.classCViolations > 0 && (
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-red-500" />
            <span className="text-[11px] text-red-400">
              {building.classCViolations} Class C
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Vulnerable Buildings Slide-Over Panel
// ============================================================

function VulnerableBuildingsPanel({
  profile,
  onClose,
}: {
  profile: CompetitorProfile;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-camelot-navy border-l border-gray-700/50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-camelot-navy border-b border-gray-700/50 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-bold text-white">{profile.name}</h3>
            <p className="text-xs text-gray-400">
              {profile.worstBuildings.length} vulnerable buildings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Building List */}
        <div className="px-6 py-4 space-y-3">
          {profile.worstBuildings.map((b, i) => (
            <div
              key={b.buildingId || i}
              className="bg-camelot-navy-light border border-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">{b.address}</h4>
                  <p className="text-xs text-gray-400">{b.borough} • {b.zip}</p>
                </div>
                <div className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded',
                  b.grade === 'F' ? 'bg-red-500/10 text-red-400' :
                  b.grade === 'D' ? 'bg-orange-500/10 text-orange-400' :
                  b.grade === 'C' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-green-500/10 text-green-400'
                )}>
                  Grade {b.grade}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Units</p>
                  <p className="text-sm font-bold text-white">{b.units}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Open Viols</p>
                  <p className="text-sm font-bold text-red-400">{b.openViolations}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Viol/Unit</p>
                  <p className="text-sm font-bold text-orange-400">{b.violationsPerUnit}</p>
                </div>
              </div>

              {/* Violation breakdown */}
              {(b.classAViolations + b.classBViolations + b.classCViolations > 0) && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-700/30">
                  {b.classCViolations > 0 && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                      {b.classCViolations} Class C
                    </span>
                  )}
                  {b.classBViolations > 0 && (
                    <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                      {b.classBViolations} Class B
                    </span>
                  )}
                  {b.classAViolations > 0 && (
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
                      {b.classAViolations} Class A
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {profile.worstBuildings.length === 0 && (
            <div className="text-center py-8">
              <Shield size={24} className="text-green-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No vulnerable buildings found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
