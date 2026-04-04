import { Clock, AlertTriangle, DollarSign } from 'lucide-react';
import type { TaxAbatement } from '@/lib/tax-abatements';

interface AbatementTimelineProps {
  abatements: TaxAbatement[];
}

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  active:   { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  expiring: { dot: 'bg-red-500 animate-pulse', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  expired:  { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
};

function TimelineCard({ abatement }: { abatement: TaxAbatement }) {
  const style = STATUS_STYLES[abatement.status] || STATUS_STYLES.active;
  const now = new Date();
  const start = abatement.startDate ? new Date(abatement.startDate) : null;
  const end = abatement.expirationDate ? new Date(abatement.expirationDate) : null;

  // Progress calculation
  let progressPct = 0;
  if (start && end) {
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    progressPct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
  }

  return (
    <div className={`rounded-xl border p-5 ${style.bg} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${style.dot}`} />
          <span className="font-bold text-gray-900 text-lg">{abatement.type}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${style.text} uppercase`}>{abatement.status}</span>
        </div>
        {abatement.yearsRemaining !== undefined && abatement.status !== 'expired' && (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className={`font-semibold ${abatement.yearsRemaining <= 2 ? 'text-red-600' : 'text-gray-700'}`}>
              {abatement.yearsRemaining.toFixed(1)} years remaining
            </span>
          </div>
        )}
      </div>

      {/* Timeline bar */}
      {start && end && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{start.getFullYear()}</span>
            <span>{end.getFullYear()}</span>
          </div>
          <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full rounded-full transition-all ${abatement.status === 'expiring' ? 'bg-red-400' : abatement.status === 'expired' ? 'bg-gray-400' : 'bg-green-400'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="relative h-4">
            <div className="absolute text-xs text-gray-400" style={{ left: `${progressPct}%`, transform: 'translateX(-50%)' }}>
              ▲ Today
            </div>
          </div>
        </div>
      )}

      {/* Financial impact */}
      <div className="grid grid-cols-2 gap-3">
        {abatement.benefitAmount > 0 && (
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium">Annual Benefit</p>
            <p className="text-lg font-bold text-gray-900">${abatement.benefitAmount.toLocaleString()}</p>
          </div>
        )}
        {abatement.estimatedTaxIncrease > 0 && (
          <div className="bg-white/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium">Est. Tax Increase on Expiry</p>
            <p className="text-lg font-bold text-red-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {abatement.estimatedTaxIncrease.toLocaleString()}/yr
            </p>
          </div>
        )}
      </div>

      {/* Warning */}
      {abatement.status === 'expiring' && (
        <div className="flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg p-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Expiring Soon</p>
            <p className="text-sm text-red-600">
              This {abatement.type} abatement expires {end ? `on ${end.toLocaleDateString()}` : 'soon'}.
              The building will face an estimated ${abatement.estimatedTaxIncrease.toLocaleString()}/year tax increase.
              Ownership changes are common around abatement expirations — this is a prime prospecting target.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AbatementTimeline({ abatements }: AbatementTimelineProps) {
  if (abatements.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <p className="text-gray-400">No tax abatements found for this property</p>
      </div>
    );
  }

  const expiring = abatements.filter(a => a.status === 'expiring');
  const active = abatements.filter(a => a.status === 'active');
  const expired = abatements.filter(a => a.status === 'expired');

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[#C5A55A]" />
        Tax Abatements
        {expiring.length > 0 && (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
            {expiring.length} expiring
          </span>
        )}
      </h3>
      {[...expiring, ...active, ...expired].map((a, i) => (
        <TimelineCard key={`${a.type}-${a.bbl}-${i}`} abatement={a} />
      ))}
    </div>
  );
}
