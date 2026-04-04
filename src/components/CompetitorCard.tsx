import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { CompetitorProfile, HealthGrade } from '@/lib/competitors';
import {
  Building2, AlertTriangle, Users, TrendingDown, ChevronDown, ChevronUp,
  Shield, Target,
} from 'lucide-react';

// ============================================================
// Health Grade Styling
// ============================================================

const GRADE_STYLES: Record<HealthGrade, { bg: string; text: string; border: string; label: string }> = {
  A: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', label: 'Excellent' },
  B: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', label: 'Good' },
  C: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/30', label: 'Fair' },
  D: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', label: 'Poor' },
  F: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', label: 'Critical' },
};

function gradeIndicatorColor(grade: HealthGrade): string {
  switch (grade) {
    case 'A': return 'bg-green-500';
    case 'B': return 'bg-emerald-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-orange-500';
    case 'F': return 'bg-red-500';
  }
}

// ============================================================
// Violation Distribution Bar Chart
// ============================================================

function ViolationBarChart({ distribution }: { distribution: { classA: number; classB: number; classC: number } }) {
  const total = distribution.classA + distribution.classB + distribution.classC;
  if (total === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-2">No violation data</div>
    );
  }

  const pctA = (distribution.classA / total) * 100;
  const pctB = (distribution.classB / total) * 100;
  const pctC = (distribution.classC / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-700/50 rounded-full h-3 overflow-hidden flex">
          {pctC > 0 && (
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${pctC}%` }}
              title={`Class C (Hazardous): ${distribution.classC}`}
            />
          )}
          {pctB > 0 && (
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${pctB}%` }}
              title={`Class B (Hazardous): ${distribution.classB}`}
            />
          )}
          {pctA > 0 && (
            <div
              className="bg-yellow-500 h-full transition-all duration-500"
              style={{ width: `${pctA}%` }}
              title={`Class A (Non-Hazardous): ${distribution.classA}`}
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="text-gray-400">C: {distribution.classC}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          <span className="text-gray-400">B: {distribution.classB}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          <span className="text-gray-400">A: {distribution.classA}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CompetitorCard Component
// ============================================================

interface CompetitorCardProps {
  profile: CompetitorProfile;
  onViewVulnerable?: (profile: CompetitorProfile) => void;
  compact?: boolean;
}

export default function CompetitorCard({ profile, onViewVulnerable, compact }: CompetitorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = GRADE_STYLES[profile.grade];

  if (compact) {
    return (
      <div className="bg-camelot-navy-light border border-gray-700/50 rounded-lg p-3 hover:border-camelot-gold/30 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', gradeIndicatorColor(profile.grade))} />
            <span className="text-sm font-medium text-white truncate">{profile.name}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400">{profile.buildingCount} bldgs</span>
            <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', style.bg, style.text)}>
              {profile.grade}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-camelot-navy-light border border-gray-700/50 rounded-xl overflow-hidden hover:border-camelot-gold/30 transition-all duration-200">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{profile.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Portfolio health as of {new Date(profile.fetchedAt).toLocaleDateString()}
            </p>
          </div>
          {/* Grade Badge */}
          <div className={cn(
            'flex flex-col items-center px-3 py-2 rounded-lg border',
            style.bg, style.border
          )}>
            <span className={cn('text-2xl font-black', style.text)}>{profile.grade}</span>
            <span className={cn('text-[10px] font-medium', style.text)}>{style.label}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-camelot-navy/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Building2 size={12} />
              <span className="text-[10px] uppercase tracking-wide">Buildings</span>
            </div>
            <p className="text-lg font-bold text-white">{profile.buildingCount}</p>
          </div>
          <div className="bg-camelot-navy/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <Users size={12} />
              <span className="text-[10px] uppercase tracking-wide">Units</span>
            </div>
            <p className="text-lg font-bold text-white">{profile.totalUnits.toLocaleString()}</p>
          </div>
          <div className="bg-camelot-navy/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <AlertTriangle size={12} />
              <span className="text-[10px] uppercase tracking-wide">Avg Viol/Unit</span>
            </div>
            <p className={cn(
              'text-lg font-bold',
              profile.avgViolationsPerUnit > 2 ? 'text-red-400' :
              profile.avgViolationsPerUnit > 1 ? 'text-orange-400' :
              profile.avgViolationsPerUnit > 0.5 ? 'text-yellow-400' : 'text-green-400'
            )}>
              {profile.avgViolationsPerUnit}
            </p>
          </div>
          <div className="bg-camelot-navy/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
              <TrendingDown size={12} />
              <span className="text-[10px] uppercase tracking-wide">Open Viols</span>
            </div>
            <p className={cn(
              'text-lg font-bold',
              profile.totalOpenViolations > 50 ? 'text-red-400' :
              profile.totalOpenViolations > 20 ? 'text-orange-400' : 'text-white'
            )}>
              {profile.totalOpenViolations}
            </p>
          </div>
        </div>

        {/* Violation Distribution */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Violation Distribution</p>
          <ViolationBarChart distribution={profile.violationDistribution} />
        </div>

        {/* Health Score Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Portfolio Health Score</span>
            <span className="text-xs font-bold text-white">{profile.avgScore}/100</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                profile.avgScore >= 80 ? 'bg-green-500' :
                profile.avgScore >= 65 ? 'bg-emerald-500' :
                profile.avgScore >= 50 ? 'bg-yellow-500' :
                profile.avgScore >= 35 ? 'bg-orange-500' : 'bg-red-500'
              )}
              style={{ width: `${profile.avgScore}%` }}
            />
          </div>
        </div>

        {/* ECB Penalties */}
        {profile.ecbPenalties > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
            <Shield size={14} className="text-red-400" />
            <span className="text-xs text-red-400">
              ECB Penalty Balance: <strong>${profile.ecbPenalties.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Expandable: Worst Buildings */}
      {profile.worstBuildings.length > 0 && (
        <div className="border-t border-gray-700/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-3 flex items-center justify-between text-xs text-gray-400 hover:bg-camelot-navy/30 transition-colors"
          >
            <span>Worst Buildings ({profile.worstBuildings.length})</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-2">
              {profile.worstBuildings.slice(0, 5).map((b, i) => (
                <div
                  key={b.buildingId || i}
                  className="flex items-center justify-between bg-camelot-navy/50 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{b.address}</p>
                    <p className="text-[10px] text-gray-500">{b.borough} • {b.units} units</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-red-400">{b.openViolations} open</span>
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      GRADE_STYLES[b.grade].bg,
                      GRADE_STYLES[b.grade].text,
                    )}>
                      {b.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <div className="border-t border-gray-700/50 px-5 py-3 bg-camelot-navy/30">
        <button
          onClick={() => onViewVulnerable?.(profile)}
          className="flex items-center gap-2 text-xs font-medium text-camelot-gold hover:text-camelot-gold-light transition-colors"
        >
          <Target size={14} />
          View Vulnerable Buildings
        </button>
      </div>
    </div>
  );
}
