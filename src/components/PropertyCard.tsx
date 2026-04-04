import { Building } from '@/types';
import { cn, gradeBg, formatCurrency, formatNumber } from '@/lib/utils';
import {
  Eye, Mail, FileDown, Plus, Sparkles, MapPin, Building2,
  AlertTriangle, Users, CheckSquare, Square,
} from 'lucide-react';

interface PropertyCardProps {
  building: Building;
  selected?: boolean;
  onSelect?: () => void;
  onViewDetails?: () => void;
  onEmail?: () => void;
  onEnrich?: () => void;
  onAddToPipeline?: () => void;
}

export default function PropertyCard({
  building,
  selected,
  onSelect,
  onViewDetails,
  onEmail,
  onEnrich,
  onAddToPipeline,
}: PropertyCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group',
        selected ? 'border-camelot-gold ring-2 ring-camelot-gold/20' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {onSelect && (
              <button onClick={onSelect} className="mt-0.5 flex-shrink-0">
                {selected ? (
                  <CheckSquare size={18} className="text-camelot-gold" />
                ) : (
                  <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
                )}
              </button>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {building.name || building.address}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={12} />
                <span className="truncate">{building.address}</span>
              </div>
            </div>
          </div>

          {/* Grade Badge */}
          <div
            className={cn(
              'grade-badge flex-shrink-0 border text-xs',
              gradeBg(building.grade)
            )}
          >
            {building.grade}
          </div>
        </div>

        {/* Borough/Region tag */}
        {(building.borough || building.region) && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs bg-camelot-navy/5 text-camelot-navy px-2 py-0.5 rounded-full">
              {building.borough}
            </span>
            {building.region && building.region !== building.borough && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {building.region}
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <Building2 size={12} />
              <span className="text-[10px] uppercase">Units</span>
            </div>
            <p className="font-semibold text-sm">{building.units || '—'}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <AlertTriangle size={12} />
              <span className="text-[10px] uppercase">Violations</span>
            </div>
            <p className="font-semibold text-sm text-orange-600">{building.violations_count}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <Users size={12} />
              <span className="text-[10px] uppercase">Contacts</span>
            </div>
            <p className="font-semibold text-sm">{building.contacts?.length || 0}</p>
          </div>
        </div>

        {/* Score Bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Lead Score</span>
            <span className="text-xs font-bold">{building.score}/100</span>
          </div>
          <div className="score-bar">
            <div
              className={cn(
                'score-bar-fill',
                building.score >= 75
                  ? 'bg-green-500'
                  : building.score >= 50
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              )}
              style={{ width: `${building.score}%` }}
            />
          </div>
        </div>

        {/* Type & Management */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Type</span>
            <span className="font-medium capitalize">{building.type}</span>
          </div>
          {building.current_management && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Management</span>
              <span className="font-medium truncate max-w-[140px]">{building.current_management}</span>
            </div>
          )}
        </div>

        {/* Signals */}
        {building.signals?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {building.signals.slice(0, 2).map((signal, i) => (
              <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {signal}
              </span>
            ))}
            {building.signals.length > 2 && (
              <span className="text-[10px] text-gray-400">+{building.signals.length - 2} more</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-1 bg-gray-50/50">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md hover:bg-camelot-gold/10 text-camelot-gold font-medium transition-colors"
        >
          <Eye size={13} /> Details
        </button>
        <button
          onClick={onEmail}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
        >
          <Mail size={13} /> Email
        </button>
        <button
          onClick={onEnrich}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md hover:bg-purple-50 text-purple-600 transition-colors"
        >
          <Sparkles size={13} /> Enrich
        </button>
        <button
          onClick={onAddToPipeline}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md hover:bg-green-50 text-green-600 ml-auto transition-colors"
        >
          <Plus size={13} /> Pipeline
        </button>
      </div>
    </div>
  );
}
