import { useState, useEffect, useCallback } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Shield, Search, Building2, Loader2,
  ChevronDown, ChevronUp, ExternalLink, FileText, RefreshCw,
  AlertCircle, Clock, DollarSign, Users, Calendar,
} from 'lucide-react';

interface ViolationReport {
  id: string;
  address: string;
  borough: string;
  bbl: string;
  report_date: string;
  total_violations: number;
  open_violations: number;
  hpd_open: number;
  hpd_class_c: number;
  hpd_class_b: number;
  hpd_class_a: number;
  dob_open: number;
  ecb_open: number;
  total_penalties: number;
  total_interest: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  overdue_count: number;
  upcoming_hearings: number;
  estimated_timeline: string;
  players_needed: string[];
}

interface Violation {
  id: string;
  report_id: string;
  address: string;
  source: string;
  violation_class: string;
  violation_type: string;
  violation_id: string;
  unit_name: string;
  description: string;
  status: string;
  is_open: boolean;
  is_overdue: boolean;
  severity_level: number;
  severity_label: string;
  inspection_date: string;
  cure_deadline: string;
  penalty_balance: number;
  cost_estimate_low: number;
  cost_estimate_high: number;
  players: string[];
  resolution_status: string;
}

function SeverityBadge({ level, label }: { level: number; label: string }) {
  const colors = {
    3: 'bg-red-500/20 text-red-400 border-red-500/30',
    2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    0: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', colors[level as keyof typeof colors] || colors[0])}>
      {label || `Level ${level}`}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = 'gold' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  const borderColors = {
    gold: 'border-camelot-gold/30',
    red: 'border-red-500/30',
    orange: 'border-orange-500/30',
    green: 'border-green-500/30',
  };
  return (
    <div className={cn('bg-camelot-navy-light rounded-lg p-4 border', borderColors[color as keyof typeof borderColors])}>
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Violations() {
  const [reports, setReports] = useState<ViolationReport[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingViolations, setIsLoadingViolations] = useState(false);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load portfolio summary
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('violation_reports')
        .select('*')
        .order('open_violations', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      toast.error('Failed to load violation reports');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load violations for a specific building
  const loadViolations = useCallback(async (address: string) => {
    setIsLoadingViolations(true);
    setSelectedAddress(address);
    try {
      const report = reports.find(r => r.address === address);
      if (!report) return;

      const { data, error } = await supabase
        .from('violations')
        .select('*')
        .eq('report_id', report.id)
        .eq('is_open', true)
        .order('severity_level', { ascending: false });

      if (error) throw error;
      setViolations(data || []);
    } catch (err: any) {
      toast.error('Failed to load violations');
      console.error(err);
    } finally {
      setIsLoadingViolations(false);
    }
  }, [reports]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Portfolio totals
  const totals = reports.reduce((acc, r) => ({
    open: acc.open + (r.open_violations || 0),
    classC: acc.classC + (r.hpd_class_c || 0),
    classB: acc.classB + (r.hpd_class_b || 0),
    classA: acc.classA + (r.hpd_class_a || 0),
    overdue: acc.overdue + (r.overdue_count || 0),
    costLow: acc.costLow + Number(r.estimated_cost_low || 0),
    costHigh: acc.costHigh + Number(r.estimated_cost_high || 0),
    penalties: acc.penalties + Number(r.total_penalties || 0),
  }), { open: 0, classC: 0, classB: 0, classA: 0, overdue: 0, costLow: 0, costHigh: 0, penalties: 0 });

  // Filter violations
  const filteredViolations = violations.filter(v => {
    if (filterSource !== 'all' && v.source !== filterSource) return false;
    if (filterSeverity !== 'all' && String(v.severity_level) !== filterSeverity) return false;
    if (searchQuery && !v.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !v.violation_id?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-camelot-gold" size={28} />
            Violation & Resolution Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Portfolio-wide violation tracking, analysis, and resolution planning
          </p>
        </div>
        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-4 py-2 bg-camelot-gold/20 text-camelot-gold rounded-lg hover:bg-camelot-gold/30 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={AlertTriangle} label="Open Violations" value={totals.open.toLocaleString()} sub={`${reports.length} buildings`} color="red" />
        <StatCard icon={AlertCircle} label="Class C (Critical)" value={totals.classC} sub="Immediately hazardous" color="red" />
        <StatCard icon={Clock} label="Overdue" value={totals.overdue.toLocaleString()} sub="Past cure deadline" color="orange" />
        <StatCard icon={Shield} label="Class B" value={totals.classB} sub="Hazardous" color="orange" />
        <StatCard icon={DollarSign} label="Est. Cost (Low)" value={formatCurrency(totals.costLow)} sub="Resolution estimate" color="gold" />
        <StatCard icon={DollarSign} label="Est. Cost (High)" value={formatCurrency(totals.costHigh)} sub="Resolution estimate" color="gold" />
      </div>

      {/* Building Cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Buildings</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-camelot-gold" size={32} />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield size={48} className="mx-auto mb-4 opacity-50" />
            <p>No violation reports found.</p>
            <p className="text-sm mt-2">Run a violation scan to populate this dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
              <div
                key={report.id}
                onClick={() => loadViolations(report.address)}
                className={cn(
                  'bg-camelot-navy-light rounded-lg p-4 border cursor-pointer transition-all hover:border-camelot-gold/50',
                  selectedAddress === report.address ? 'border-camelot-gold' : 'border-white/10'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{report.address}</h3>
                    <p className="text-gray-400 text-xs">{report.borough} · {new Date(report.report_date).toLocaleDateString()}</p>
                  </div>
                  <div className={cn(
                    'px-2 py-1 rounded text-xs font-bold',
                    report.hpd_class_c > 0 ? 'bg-red-500/20 text-red-400' : report.open_violations > 100 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                  )}>
                    {report.open_violations} Open
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-red-400 font-bold text-lg">{report.hpd_class_c}</div>
                    <div className="text-gray-500 text-[10px]">Class C</div>
                  </div>
                  <div>
                    <div className="text-orange-400 font-bold text-lg">{report.hpd_class_b}</div>
                    <div className="text-gray-500 text-[10px]">Class B</div>
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold text-lg">{report.hpd_class_a}</div>
                    <div className="text-gray-500 text-[10px]">Class A</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold text-lg">{report.ecb_open}</div>
                    <div className="text-gray-500 text-[10px]">ECB</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-gray-400">
                  <span>Overdue: <span className="text-red-400 font-medium">{report.overdue_count}</span></span>
                  <span>Est: {formatCurrency(Number(report.estimated_cost_low))} - {formatCurrency(Number(report.estimated_cost_high))}</span>
                </div>

                {report.estimated_timeline && (
                  <div className="mt-2 text-xs text-gray-500">
                    <Calendar size={12} className="inline mr-1" />
                    Timeline: {report.estimated_timeline}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violation Detail Table */}
      {selectedAddress && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {selectedAddress} — Open Violations ({filteredViolations.length})
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search violations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-camelot-navy-light border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:border-camelot-gold/50 outline-none"
                />
              </div>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                className="px-3 py-1.5 bg-camelot-navy-light border border-white/10 rounded text-sm text-white outline-none"
              >
                <option value="all">All Sources</option>
                <option value="HPD">HPD</option>
                <option value="DOB">DOB</option>
                <option value="ECB">ECB</option>
              </select>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="px-3 py-1.5 bg-camelot-navy-light border border-white/10 rounded text-sm text-white outline-none"
              >
                <option value="all">All Severity</option>
                <option value="3">Class C (Critical)</option>
                <option value="2">Class B / DOB / ECB</option>
                <option value="1">Class A</option>
              </select>
            </div>
          </div>

          {isLoadingViolations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-camelot-gold" size={32} />
            </div>
          ) : (
            <div className="bg-camelot-navy-light rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Class</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Unit</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Deadline</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Est. Cost</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Players</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.slice(0, 100).map(v => (
                    <tr
                      key={v.id}
                      className={cn(
                        'border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors',
                        v.is_overdue && 'bg-red-500/5'
                      )}
                      onClick={() => setExpandedViolation(expandedViolation === v.id ? null : v.id)}
                    >
                      <td className="px-4 py-2">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          v.source === 'HPD' ? 'bg-purple-500/20 text-purple-400' :
                          v.source === 'DOB' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-orange-500/20 text-orange-400'
                        )}>
                          {v.source}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <SeverityBadge level={v.severity_level} label={v.violation_class || v.severity_label} />
                      </td>
                      <td className="px-4 py-2 text-gray-300 text-xs">{v.unit_name || 'Bldg'}</td>
                      <td className="px-4 py-2 text-gray-300 text-xs max-w-xs truncate">{v.description?.substring(0, 80)}</td>
                      <td className="px-4 py-2 text-xs">
                        {v.cure_deadline ? (
                          <span className={cn(v.is_overdue ? 'text-red-400 font-bold' : 'text-gray-400')}>
                            {new Date(v.cure_deadline).toLocaleDateString()}
                            {v.is_overdue && ' ⚠️'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-300 text-xs">
                        {formatCurrency(Number(v.cost_estimate_low))} - {formatCurrency(Number(v.cost_estimate_high))}
                      </td>
                      <td className="px-4 py-2 text-gray-400 text-xs">
                        {v.players?.slice(0, 2).join(', ')}
                        {v.players?.length > 2 && ` +${v.players.length - 2}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredViolations.length > 100 && (
                <div className="px-4 py-3 text-center text-gray-400 text-sm border-t border-white/10">
                  Showing 100 of {filteredViolations.length} violations
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
