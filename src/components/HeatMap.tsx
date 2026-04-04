import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { HeatMapData, NeighborhoodData } from '@/lib/competitors';
import { NYC_NEIGHBORHOODS } from '@/lib/competitors';
import { Map as MapIcon, Flame, Zap, ArrowRightLeft, Phone } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type MetricKey = 'violations' | 'll97' | 'ownership_changes' | '311';

interface HeatMapProps {
  data: HeatMapData | null;
  loading?: boolean;
  onNeighborhoodClick?: (neighborhood: string, borough: string) => void;
}

// ============================================================
// Metric Configuration
// ============================================================

const METRIC_CONFIG: Record<MetricKey, { label: string; icon: typeof Flame; description: string }> = {
  violations: {
    label: 'Violations',
    icon: Flame,
    description: 'HPD violation density',
  },
  ll97: {
    label: 'LL97 Exposure',
    icon: Zap,
    description: 'Local Law 97 energy risk',
  },
  ownership_changes: {
    label: 'Ownership Changes',
    icon: ArrowRightLeft,
    description: 'Recent ACRIS ownership transfers',
  },
  '311': {
    label: '311 Complaints',
    icon: Phone,
    description: 'Building-related 311 complaints',
  },
};

const METRIC_KEYS: MetricKey[] = ['violations', 'll97', 'ownership_changes', '311'];

// ============================================================
// Color Helpers
// ============================================================

/**
 * Get heat color based on intensity (0-1).
 * Goes from dark (low) → gold → orange → red (high).
 */
function heatColor(intensity: number): string {
  if (intensity <= 0) return 'bg-camelot-navy/30';
  if (intensity < 0.15) return 'bg-camelot-gold/10';
  if (intensity < 0.3) return 'bg-camelot-gold/20';
  if (intensity < 0.45) return 'bg-yellow-500/20';
  if (intensity < 0.6) return 'bg-orange-500/20';
  if (intensity < 0.75) return 'bg-orange-500/30';
  if (intensity < 0.9) return 'bg-red-500/25';
  return 'bg-red-500/40';
}

function heatTextColor(intensity: number): string {
  if (intensity <= 0) return 'text-gray-500';
  if (intensity < 0.3) return 'text-camelot-gold/80';
  if (intensity < 0.6) return 'text-yellow-400';
  if (intensity < 0.8) return 'text-orange-400';
  return 'text-red-400';
}

function heatBorderColor(intensity: number): string {
  if (intensity <= 0) return 'border-gray-700/30';
  if (intensity < 0.3) return 'border-camelot-gold/20';
  if (intensity < 0.6) return 'border-yellow-500/30';
  if (intensity < 0.8) return 'border-orange-500/30';
  return 'border-red-500/30';
}

// ============================================================
// Neighborhood Cell
// ============================================================

function NeighborhoodCell({
  neighborhood,
  intensity,
  value,
  selected,
  onClick,
}: {
  neighborhood: string;
  intensity: number;
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-lg border px-3 py-2.5 text-left transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        heatColor(intensity),
        heatBorderColor(intensity),
        selected && 'ring-2 ring-camelot-gold shadow-lg shadow-camelot-gold/10'
      )}
    >
      <p className={cn(
        'text-xs font-medium truncate',
        selected ? 'text-camelot-gold' : heatTextColor(intensity)
      )}>
        {neighborhood}
      </p>
      <p className={cn(
        'text-lg font-bold mt-0.5',
        heatTextColor(intensity)
      )}>
        {value > 0 ? value.toLocaleString() : '—'}
      </p>
    </button>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function HeatMapSkeleton() {
  return (
    <div className="space-y-6">
      {NYC_NEIGHBORHOODS.map((group) => (
        <div key={group.borough}>
          <div className="h-4 w-24 bg-gray-700/50 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {group.neighborhoods.map((n) => (
              <div key={n} className="h-16 bg-gray-700/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// HeatMap Component
// ============================================================

export default function HeatMap({ data, loading, onNeighborhoodClick }: HeatMapProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('violations');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  // Build lookup map for neighborhood data
  const neighborhoodMap = useMemo(() => {
    const map = new Map<string, NeighborhoodData>();
    if (!data) return map;
    for (const n of data.neighborhoods) {
      map.set(n.name, n);
    }
    return map;
  }, [data]);

  // Get value for a neighborhood based on active metric
  const getValue = (name: string): number => {
    const n = neighborhoodMap.get(name);
    if (!n) return 0;
    switch (activeMetric) {
      case 'violations': return n.violations;
      case 'll97': return n.ll97;
      case 'ownership_changes': return n.ownershipChanges;
      case '311': return n.complaints311;
    }
  };

  // Get max value for normalization
  const getMax = (): number => {
    if (!data) return 1;
    switch (activeMetric) {
      case 'violations': return data.maxValues.violations;
      case 'll97': return data.maxValues.ll97;
      case 'ownership_changes': return data.maxValues.ownershipChanges;
      case '311': return data.maxValues.complaints311;
    }
  };

  const handleClick = (neighborhood: string, borough: string) => {
    const isDeselecting = selectedNeighborhood === neighborhood;
    setSelectedNeighborhood(isDeselecting ? null : neighborhood);
    if (!isDeselecting) {
      onNeighborhoodClick?.(neighborhood, borough);
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Toggle */}
      <div className="flex items-center gap-1 bg-camelot-navy/50 rounded-lg p-1">
        {METRIC_KEYS.map((key) => {
          const config = METRIC_CONFIG[key];
          const Icon = config.icon;
          const isActive = activeMetric === key;
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all',
                isActive
                  ? 'bg-camelot-gold/20 text-camelot-gold'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Metric Description */}
      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <MapIcon size={12} />
        {METRIC_CONFIG[activeMetric].description} — click a neighborhood to filter
      </p>

      {/* Grid */}
      {loading ? (
        <HeatMapSkeleton />
      ) : (
        <div className="space-y-6">
          {NYC_NEIGHBORHOODS.map((group) => (
            <div key={group.borough}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.borough}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {group.neighborhoods.map((name) => {
                  const value = getValue(name);
                  const max = getMax();
                  const intensity = max > 0 ? value / max : 0;
                  return (
                    <NeighborhoodCell
                      key={name}
                      neighborhood={name}
                      intensity={intensity}
                      value={value}
                      selected={selectedNeighborhood === name}
                      onClick={() => handleClick(name, group.borough)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Intensity:</span>
        <div className="flex items-center gap-1">
          <div className="w-5 h-3 rounded bg-camelot-navy/30 border border-gray-700/30" />
          <div className="w-5 h-3 rounded bg-camelot-gold/20 border border-camelot-gold/20" />
          <div className="w-5 h-3 rounded bg-yellow-500/20 border border-yellow-500/30" />
          <div className="w-5 h-3 rounded bg-orange-500/25 border border-orange-500/30" />
          <div className="w-5 h-3 rounded bg-red-500/40 border border-red-500/30" />
        </div>
        <span className="text-[10px] text-gray-500">Low → High</span>
      </div>
    </div>
  );
}
