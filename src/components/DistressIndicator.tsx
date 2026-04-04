import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, TrendingDown, Shield } from 'lucide-react';
import type { DistressReport, DistressSignal } from '@/lib/distress-signals';

interface DistressIndicatorProps {
  report: DistressReport;
  compact?: boolean;
}

const LEVEL_COLORS: Record<string, { bg: string; fill: string; text: string; label: string }> = {
  stable:     { bg: 'bg-green-100',  fill: 'bg-green-500',  text: 'text-green-700',  label: 'Stable' },
  watch:      { bg: 'bg-yellow-100', fill: 'bg-yellow-500', text: 'text-yellow-700', label: 'Watch' },
  stressed:   { bg: 'bg-orange-100', fill: 'bg-orange-500', text: 'text-orange-700', label: 'Stressed' },
  distressed: { bg: 'bg-red-100',    fill: 'bg-red-500',    text: 'text-red-700',    label: 'Distressed' },
  critical:   { bg: 'bg-red-200',    fill: 'bg-red-700',    text: 'text-red-800',    label: 'Critical' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function SignalRow({ signal, expanded, onToggle }: { signal: DistressSignal; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${SEVERITY_COLORS[signal.severity] || SEVERITY_COLORS.medium}`}>
            {signal.severity.toUpperCase()}
          </span>
          <span className="text-sm text-gray-700">{signal.type.replace(/_/g, ' ')}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600 mt-2">{signal.description}</p>
          {signal.value !== undefined && (
            <p className="text-xs text-gray-400 mt-1">Value: {typeof signal.value === 'number' ? signal.value.toLocaleString() : String(signal.value)}</p>
          )}
          <p className="text-xs text-gray-400">Source: {signal.source}</p>
        </div>
      )}
    </div>
  );
}

export function DistressIndicator({ report, compact = false }: DistressIndicatorProps) {
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const colors = LEVEL_COLORS[report.level] || LEVEL_COLORS.stable;
  const pct = Math.min(100, Math.max(0, report.score));

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors.fill}`} />
        <span className={`text-sm font-medium ${colors.text}`}>{colors.label}</span>
        <span className="text-xs text-gray-400">{report.score}/100</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {report.level === 'stable' ? <Shield className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
          Financial Distress
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text}`}>
          {colors.label}
        </span>
      </div>

      {/* Gauge */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Stable</span>
          <span>Critical</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${colors.fill}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-center text-lg font-bold mt-2 text-gray-900">{report.score}<span className="text-sm text-gray-400 font-normal"> / 100</span></p>
      </div>

      {/* Summary */}
      {report.summary && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{report.summary}</p>
      )}

      {/* Signals */}
      {report.signals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Distress Signals ({report.signals.length})
          </h4>
          <div className="space-y-1">
            {report.signals.map((s, i) => (
              <SignalRow
                key={i}
                signal={s}
                expanded={expandedSignal === i}
                onToggle={() => setExpandedSignal(expandedSignal === i ? null : i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {report.recommendation && (
        <div className="bg-[#C5A55A]/10 border border-[#C5A55A]/30 rounded-lg p-3">
          <p className="text-sm font-medium text-[#C5A55A]">💡 Recommendation</p>
          <p className="text-sm text-gray-700 mt-1">{report.recommendation}</p>
        </div>
      )}
    </div>
  );
}
