import { useState, useMemo } from 'react';
import {
  Bell, ArrowRightLeft, AlertTriangle, Thermometer, Phone,
  DollarSign, Clock, Scale, Filter, Check, CheckCheck,
  ChevronDown, ChevronUp, ExternalLink, Sparkles,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useBuildings } from '@/hooks/useBuildings';
import {
  generateAlerts,
  alertSeverityColor,
  ALERT_TYPE_META,
  type Alert,
  type AlertType,
  type AlertSeverity,
} from '@/lib/alerts';

// ============================================================
// Icon resolver
// ============================================================

const ALERT_ICONS: Record<string, React.ReactNode> = {
  ArrowRightLeft: <ArrowRightLeft size={18} />,
  AlertTriangle: <AlertTriangle size={18} />,
  Thermometer: <Thermometer size={18} />,
  Phone: <Phone size={18} />,
  DollarSign: <DollarSign size={18} />,
  Clock: <Clock size={18} />,
  Scale: <Scale size={18} />,
};

function getAlertIcon(type: AlertType): React.ReactNode {
  const meta = ALERT_TYPE_META[type];
  return ALERT_ICONS[meta?.icon] || <Bell size={18} />;
}

// ============================================================
// Severity badge
// ============================================================

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
        alertSeverityColor(severity),
      )}
    >
      {severity}
    </span>
  );
}

// ============================================================
// Filter option lists
// ============================================================

const TYPE_OPTIONS: { value: AlertType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'ownership_change', label: 'Ownership Change' },
  { value: 'violation_spike', label: 'Violation Spike' },
  { value: '311_surge', label: '311 Surge' },
  { value: 'll97_deadline', label: 'LL97 Deadline' },
  { value: 'ecb_penalty', label: 'ECB Penalty' },
  { value: 'abatement_expiring', label: 'Abatement Expiring' },
  { value: 'litigation_filed', label: 'Litigation Filed' },
];

const SEVERITY_OPTIONS: { value: AlertSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const READ_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
] as const;

// ============================================================
// Page Component
// ============================================================

export default function Alerts() {
  const { buildings } = useBuildings();

  // Local alert state (in a real app this would come from Supabase)
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Run scan
  const handleScan = async () => {
    if (buildings.length === 0) return;
    setIsScanning(true);
    try {
      const detected = await generateAlerts(buildings);
      setAlerts(detected);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Filtered alerts
  const filtered = useMemo(() => {
    let list = [...alerts];
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (severityFilter !== 'all') list = list.filter((a) => a.severity === severityFilter);
    if (readFilter === 'unread') list = list.filter((a) => !a.read);
    if (readFilter === 'read') list = list.filter((a) => a.read);
    return list;
  }, [alerts, typeFilter, severityFilter, readFilter]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  // Actions
  const markRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell size={24} className="text-camelot-gold" /> Alerts
            </h1>
            <p className="text-sm text-gray-500">
              Detect ownership transfers, violation spikes, and distress signals
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <CheckCheck size={16} /> Mark All Read
              </button>
            )}
            <button
              onClick={handleScan}
              disabled={isScanning || buildings.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-camelot-gold text-camelot-navy font-semibold rounded-lg hover:bg-camelot-gold-light disabled:opacity-50 transition-colors"
            >
              <Sparkles size={16} />
              {isScanning ? 'Scanning…' : 'Run Scan'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <Bell size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold">{alerts.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
            <AlertTriangle size={16} className="text-red-500" />
            <div>
              <p className="text-xs text-red-500">Critical</p>
              <p className="font-bold text-red-600">
                {alerts.filter((a) => a.severity === 'critical').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-lg">
            <AlertTriangle size={16} className="text-orange-500" />
            <div>
              <p className="text-xs text-orange-500">High</p>
              <p className="font-bold text-orange-600">
                {alerts.filter((a) => a.severity === 'high').length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Bell size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-blue-500">Unread</p>
              <p className="font-bold text-blue-600">{unreadCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          >
            {SEVERITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          >
            {READ_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {(typeFilter !== 'all' || severityFilter !== 'all' || readFilter !== 'all') && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setSeverityFilter('all');
                setReadFilter('all');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Alert Feed */}
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-3">
        {filtered.length === 0 && !isScanning && (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              {alerts.length === 0
                ? 'No alerts — run a scan to detect opportunities'
                : 'No alerts match your filters'}
            </h3>
            <p className="text-sm text-gray-400">
              {alerts.length === 0
                ? 'Scan your saved buildings to detect ownership changes, violation spikes, and 311 complaint surges.'
                : 'Try broadening your filter criteria.'}
            </p>
            {alerts.length === 0 && buildings.length > 0 && (
              <button
                onClick={handleScan}
                className="mt-4 px-4 py-2 bg-camelot-gold text-camelot-navy font-semibold rounded-lg hover:bg-camelot-gold-light transition-colors"
              >
                <Sparkles size={16} className="inline mr-1.5 -mt-0.5" />
                Scan {buildings.length} Buildings
              </button>
            )}
          </div>
        )}

        {isScanning && (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-camelot-gold border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Scanning buildings for alerts…</p>
          </div>
        )}

        {filtered.map((alert) => {
          const isExpanded = expandedId === alert.id;

          return (
            <div
              key={alert.id}
              className={cn(
                'bg-white rounded-xl border transition-all',
                alert.read
                  ? 'border-gray-200'
                  : 'border-camelot-gold/30 shadow-sm',
              )}
            >
              {/* Alert row */}
              <button
                onClick={() => toggleExpand(alert.id)}
                className="w-full text-left px-5 py-4 flex items-start gap-4"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-600'
                      : alert.severity === 'high'
                        ? 'bg-orange-100 text-orange-600'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-blue-100 text-blue-600',
                  )}
                >
                  {getAlertIcon(alert.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        'font-semibold text-sm truncate',
                        alert.read ? 'text-gray-600' : 'text-gray-900',
                      )}
                    >
                      {alert.title}
                    </h3>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-camelot-gold flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{alert.building_address}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{alert.description}</p>
                </div>

                {/* Right side */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="text-[11px] text-gray-400">
                    {formatRelativeTime(alert.created_at)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-gray-600">{alert.description}</p>

                    {/* Data details */}
                    {Object.keys(alert.data).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                          Details
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(alert.data).map(([key, val]) => (
                            <div key={key}>
                              <p className="text-[10px] text-gray-400 uppercase">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-700">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                      {!alert.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead(alert.id);
                          }}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Check size={14} /> Mark as Read
                        </button>
                      )}
                      {alert.building_id && (
                        <a
                          href={`/results?building=${alert.building_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-sm text-camelot-gold hover:text-camelot-gold-light transition-colors"
                        >
                          <ExternalLink size={14} /> View Building
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
