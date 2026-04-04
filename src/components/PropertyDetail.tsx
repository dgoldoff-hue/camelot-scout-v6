import { useState, useEffect } from 'react';
import type { Building, Contact, Activity } from '@/types';
import { cn, formatCurrency, formatDate, formatNumber, gradeBg, daysInStage } from '@/lib/utils';
import { fetchFullBuildingReport } from '@/lib/nyc-api';
import { enrichBuildingContacts, isEnrichmentConfigured } from '@/lib/enrichment';
import { calculateScore } from '@/lib/scoring';
import toast from 'react-hot-toast';
import {
  X, MapPin, Building2, AlertTriangle, DollarSign, Zap, FileText,
  Clock, StickyNote, Download, Mail, Phone, Linkedin, Plus,
  ExternalLink, Sparkles, RefreshCw, User, Shield, GitBranch, Loader2,
} from 'lucide-react';

interface PropertyDetailProps {
  building: Building;
  onClose: () => void;
  onUpdate?: (id: string, data: Partial<Building>) => void;
}

type Tab = 'overview' | 'contacts' | 'violations' | 'financials' | 'energy' | 'permits' | 'activity' | 'notes';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'contacts', label: 'Contacts', icon: User },
  { key: 'violations', label: 'Violations', icon: AlertTriangle },
  { key: 'financials', label: 'Financials', icon: DollarSign },
  { key: 'energy', label: 'Energy/LL97', icon: Zap },
  { key: 'permits', label: 'Permits', icon: FileText },
  { key: 'activity', label: 'Activity', icon: Clock },
  { key: 'notes', label: 'Notes', icon: StickyNote },
];

export default function PropertyDetail({ building, onClose, onUpdate }: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isFetchingNYC, setIsFetchingNYC] = useState(false);
  const [nycData, setNycData] = useState<any>(null);
  const [notes, setNotes] = useState(building.notes || '');

  // Fetch NYC data on mount
  useEffect(() => {
    if (building.address && !nycData) {
      fetchNYCData();
    }
  }, [building.address]);

  const fetchNYCData = async () => {
    setIsFetchingNYC(true);
    try {
      const data = await fetchFullBuildingReport(building.address, building.borough);
      setNycData(data);
      toast.success('NYC data loaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch NYC data');
    } finally {
      setIsFetchingNYC(false);
    }
  };

  const handleReportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) { toast.error('Pop-up blocked — allow pop-ups for this site'); return; }
    const scores = building.score_breakdown || {};
    const contacts = building.contacts || [];
    const signals = building.signals || [];
    w.document.write(`<!DOCTYPE html><html><head><title>Scout Report — ${building.name || building.address}</title>
      <style>
        body{font-family:'Inter',system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1f36}
        h1{color:#1a1f36;border-bottom:3px solid #C5A55A;padding-bottom:10px}
        h2{color:#C5A55A;margin-top:30px}
        .grade{display:inline-block;padding:4px 16px;border-radius:20px;font-weight:700;font-size:18px;
          background:${building.grade==='A'?'#22c55e':building.grade==='B'?'#eab308':'#9ca3af'};color:#fff}
        .score{font-size:28px;font-weight:700;color:#1a1f36}
        table{width:100%;border-collapse:collapse;margin:10px 0}
        td,th{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb}
        th{background:#f9fafb;font-weight:600}
        .signal{padding:4px 10px;border-radius:12px;font-size:13px;margin:2px;display:inline-block;background:#fef3c7;color:#92400e}
        .header{display:flex;justify-content:space-between;align-items:center}
        .logo{color:#C5A55A;font-size:12px;letter-spacing:2px}
        @media print{body{margin:20px}}
      </style></head><body>
      <div class="logo">CAMELOT SCOUT • PROPERTY INTELLIGENCE</div>
      <div class="header"><h1>${building.name || building.address}</h1>
        <div><span class="grade">${building.grade || '—'}</span> <span class="score">${building.score || 0}/100</span></div></div>
      <p>${building.address}${building.borough ? ' • '+building.borough : ''} • ${building.units || '?'} units • ${building.type || 'Unknown'}</p>
      
      <h2>Building Details</h2>
      <table><tr><th>Year Built</th><td>${building.enriched_data?.dof?.yearBuilt || '—'}</td>
        <th>Management</th><td>${building.current_management || 'Unknown'}</td></tr>
      <tr><th>Market Value</th><td>${building.enriched_data?.dof?.marketValue ? '$'+Number(building.enriched_data.dof.marketValue).toLocaleString() : '—'}</td>
        <th>Tax Class</th><td>${building.enriched_data?.dof?.taxClass || '—'}</td></tr></table>

      <h2>Violations</h2>
      <p><strong>${building.enriched_data?.violations?.total || 0}</strong> total violations, <strong style="color:#dc2626">${building.enriched_data?.violations?.open || 0}</strong> open</p>

      ${contacts.length > 0 ? `<h2>Contacts</h2><table><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th></tr>
        ${contacts.map((c: any) => `<tr><td>${c.name||''}</td><td>${c.role||''}</td><td>${c.email||''}</td><td>${c.phone||''}</td></tr>`).join('')}</table>` : ''}

      ${signals.length > 0 ? `<h2>Signals</h2>${signals.map((s: string) => `<span class="signal">${s}</span>`).join(' ')}` : ''}

      <h2>Score Breakdown</h2>
      <table><tr><th>Factor</th><th>Score</th></tr>
        ${Object.entries(scores).map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>

      <hr style="margin-top:40px;border-color:#C5A55A">
      <p style="font-size:11px;color:#9ca3af">Generated by Camelot Scout v6 • ${new Date().toLocaleDateString()} • Camelot Property Management Corp • 501 Madison Avenue, Suite 1400, NYC</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const handleEnrich = async () => {
    const config = isEnrichmentConfigured();
    if (!config.apollo && !config.prospeo) {
      toast.error('Configure Apollo.io or Prospeo API keys in Settings');
      return;
    }
    setIsEnriching(true);
    try {
      const contacts = await enrichBuildingContacts({
        buildingName: building.name,
        address: building.address,
        currentManagement: building.current_management,
      });
      if (contacts.length > 0) {
        const merged = [...(building.contacts || []), ...contacts];
        onUpdate?.(building.id, { contacts: merged });
        toast.success(`Found ${contacts.length} contacts`);
      } else {
        toast.error('No new contacts found');
      }
    } catch (err) {
      toast.error('Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddToPipeline = () => {
    onUpdate?.(building.id, { pipeline_stage: 'discovered' as any, pipeline_moved_at: new Date().toISOString() });
    toast.success(`${building.name || building.address} added to Pipeline → Discovered`);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Introduction — Camelot Property Management | ${building.address}`);
    const body = encodeURIComponent(
      `Dear Board,\n\nMy name is David Goldoff, and I'm the principal of Camelot Realty Group, a boutique property management firm headquartered at 501 Madison Avenue in New York City.\n\nI'm reaching out because we specialize in managing ${building.type || 'residential'} buildings like ${building.address}, and I believe we could bring meaningful value to your ${building.units || ''}-unit property.\n\n` +
      (building.enriched_data?.violations?.open ? `I noticed that ${building.address} currently has ${building.enriched_data.violations.open} open HPD violations on record. Our compliance team has extensive experience resolving these efficiently.\n\n` : '') +
      `I'd welcome the opportunity to introduce Camelot to your board. Would you have 15 minutes for a brief call this week?\n\nWarm regards,\n\nDavid Goldoff\nPrincipal, Camelot Realty Group\n501 Madison Avenue, Suite 1400, New York, NY 10022\ndgoldoff@camelot.nyc\n212-206-9939 ext. 701 | 646-523-9068`
    );
    const contacts = building.contacts || [];
    const emailTo = contacts.find((c: any) => c.email)?.email || '';
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_self');
    toast.success('Email draft opened');
  };

  const saveNotes = () => {
    onUpdate?.(building.id, { notes });
    toast.success('Notes saved');
  };

  // Score breakdown
  const scoreBreakdown = calculateScore({
    violations_count: building.violations_count,
    open_violations_count: building.open_violations_count,
    units: building.units,
    current_management: building.current_management,
    year_built: building.year_built,
    energy_star_score: building.energy_star_score,
    site_eui: building.site_eui,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-camelot-navy text-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{building.name || building.address}</h2>
                <span className={cn('grade-badge text-xs border', gradeBg(building.grade))}>
                  {building.grade}
                </span>
                <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full">
                  Score: {building.score}/100
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1"><MapPin size={14} /> {building.address}</span>
                {building.borough && <span>{building.borough}</span>}
                {building.units && <span>{building.units} units</span>}
                <span className="capitalize">{building.type}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleReportPDF} className="flex items-center gap-1.5 text-xs bg-camelot-gold text-camelot-navy px-3 py-1.5 rounded-lg font-medium hover:bg-camelot-gold-light transition-colors">
              <Download size={13} /> Report PDF
            </button>
            <button onClick={handleSendEmail} className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <Mail size={13} /> Send Email
            </button>
            <button onClick={handleAddToPipeline} className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <GitBranch size={13} /> Add to Pipeline
            </button>
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {isEnriching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Enrich Contacts
            </button>
            <button
              onClick={fetchNYCData}
              disabled={isFetchingNYC}
              className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 ml-auto"
            >
              {isFetchingNYC ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Refresh NYC Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap',
                activeTab === key
                  ? 'border-camelot-gold text-camelot-gold font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 tab-content">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Building Info */}
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Building Details</h3>
                <div className="space-y-2">
                  {[
                    ['Address', building.address],
                    ['Borough', building.borough || '—'],
                    ['Neighborhood', building.region || '—'],
                    ['Units', building.units?.toString() || '—'],
                    ['Type', building.type],
                    ['Year Built', building.year_built?.toString() || '—'],
                    ['Stories', building.stories?.toString() || nycData?.dof?.stories?.toString() || '—'],
                    ['Lot Area', nycData?.dof?.lotArea ? `${formatNumber(nycData.dof.lotArea)} sq ft` : '—'],
                    ['Building Area', nycData?.dof?.buildingArea ? `${formatNumber(nycData.dof.buildingArea)} sq ft` : '—'],
                    ['Building Class', building.building_class || nycData?.dof?.buildingClass || '—'],
                    ['BBL', building.bbl || nycData?.dof?.bbl || '—'],
                    ['Management', building.current_management || nycData?.registration?.managementCompany || '—'],
                    ['DOF Owner', building.dof_owner || nycData?.dof?.owner || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Score Breakdown</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {scoreBreakdown.factors.map((f) => (
                    <div key={f.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{f.name}</span>
                        <span className="font-medium">{f.score}/{f.max}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-camelot-gold rounded-full transition-all"
                          style={{ width: `${(f.score / f.max) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{f.reason}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Score</span>
                      <span className="font-bold text-lg">{scoreBreakdown.total}/100</span>
                    </div>
                  </div>
                </div>

                {/* Signals */}
                {scoreBreakdown.signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Signals</h4>
                    <div className="space-y-1">
                      {scoreBreakdown.signals.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                          <Shield size={14} /> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipeline Status */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Pipeline</h4>
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">{building.pipeline_stage}</span>
                    <span className="text-xs text-gray-400">• {daysInStage(building.pipeline_moved_at)} days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Contacts ({building.contacts?.length || 0})</h3>
                <button
                  onClick={handleEnrich}
                  disabled={isEnriching}
                  className="flex items-center gap-1.5 text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Enrich with Apollo/Prospeo
                </button>
              </div>

              {(!building.contacts || building.contacts.length === 0) ? (
                <div className="text-center py-12 text-gray-400">
                  <User size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No contacts found yet</p>
                  <p className="text-sm mt-1">Use "Enrich" to find board members, owners, and managers via Apollo.io</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {building.contacts.map((contact, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-camelot-gold/20 rounded-full flex items-center justify-center text-camelot-gold font-bold text-sm">
                          {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.role}</p>
                          {contact.source && (
                            <span className="text-[10px] text-gray-400">via {contact.source}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2.5 py-1.5 rounded-lg hover:bg-green-100"
                          >
                            <Phone size={12} /> {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                          >
                            <Mail size={12} /> {contact.email}
                          </a>
                        )}
                        {contact.linkedin && (
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noopener"
                            className="flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2.5 py-1.5 rounded-lg hover:bg-sky-100"
                          >
                            <Linkedin size={12} /> LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'violations' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{nycData?.violations?.total || building.violations_count}</p>
                  <p className="text-xs text-red-500 mt-1">Total Violations</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{nycData?.violations?.open || building.open_violations_count}</p>
                  <p className="text-xs text-orange-500 mt-1">Open Violations</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-gray-600">{formatDate(nycData?.violations?.lastDate || building.last_violation_date)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last Violation</p>
                </div>
              </div>

              {isFetchingNYC ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                  <p className="text-sm">Loading violations from HPD...</p>
                </div>
              ) : nycData?.violations?.items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Class</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Apt</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nycData.violations.items.slice(0, 30).map((v: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-xs">{formatDate(v.inspectiondate)}</td>
                          <td className="py-2">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              v.class === 'C' ? 'bg-red-100 text-red-700' :
                              v.class === 'B' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {v.class}
                            </span>
                          </td>
                          <td className="py-2 text-xs">{v.apartment || '—'}</td>
                          <td className="py-2 text-xs max-w-xs truncate">{v.novdescription || '—'}</td>
                          <td className="py-2 text-xs">{v.currentstatus || v.violationstatus || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-sm">
                  No violation data loaded. Click "Refresh NYC Data" to fetch.
                </p>
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div>
              <h3 className="font-semibold mb-4">DOF Property Assessment</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Market Value', formatCurrency(building.market_value || nycData?.dof?.marketValue)],
                  ['Assessed Value', formatCurrency(building.assessed_value || nycData?.dof?.assessedValue)],
                  ['Land Value', formatCurrency(building.land_value || nycData?.dof?.landValue)],
                  ['Tax Class', building.tax_class || nycData?.dof?.taxClass || '—'],
                  ['DOF Owner', building.dof_owner || nycData?.dof?.owner || '—'],
                  ['BBL', building.bbl || nycData?.dof?.bbl || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'energy' && (
            <div>
              <h3 className="font-semibold mb-4">Energy & LL97 Benchmarking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Energy Star Score</p>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'text-3xl font-bold',
                      (building.energy_star_score || 0) >= 75 ? 'text-green-600' :
                      (building.energy_star_score || 0) >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {building.energy_star_score || nycData?.energy?.energyStarScore || '—'}
                    </p>
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Site EUI (kBtu/ft²)</p>
                  <p className="text-3xl font-bold">{building.site_eui || nycData?.energy?.siteEUI || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">GHG Emissions (MT CO₂e)</p>
                  <p className="text-3xl font-bold">{building.ghg_emissions || nycData?.energy?.ghgEmissions || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Occupancy</p>
                  <p className="text-3xl font-bold">{building.occupancy_pct || nycData?.energy?.occupancy || '—'}</p>
                </div>
              </div>
              {(!building.energy_star_score && !nycData?.energy) && (
                <p className="text-center text-gray-400 text-sm mt-6">
                  No LL97 benchmarking data available for this building. Click "Refresh NYC Data" to check.
                </p>
              )}
            </div>
          )}

          {activeTab === 'permits' && (
            <div>
              <h3 className="font-semibold mb-4">DOB Permits ({nycData?.permits?.count || 0})</h3>
              {isFetchingNYC ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                  <p className="text-sm">Loading permits...</p>
                </div>
              ) : nycData?.permits?.items?.length > 0 ? (
                <div className="space-y-2">
                  {nycData.permits.items.map((p: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{p.job_type || 'Permit'} — {p.permit_type || 'General'}</p>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-lg">{p.job_description || 'No description'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(p.filing_date)}</p>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full mt-1 inline-block',
                            p.job_status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {p.job_status_descrp || p.permit_status || p.job_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-sm">No permit data loaded.</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                {/* Show pipeline stage info as an activity */}
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-camelot-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <GitBranch size={14} className="text-camelot-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pipeline: {building.pipeline_stage}</p>
                    <p className="text-xs text-gray-500">In stage for {daysInStage(building.pipeline_moved_at)} days</p>
                    <p className="text-xs text-gray-400">Moved {formatDate(building.pipeline_moved_at)}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Building discovered</p>
                    <p className="text-xs text-gray-500">Source: {building.source || 'NYC Open Data'}</p>
                    <p className="text-xs text-gray-400">{formatDate(building.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="font-semibold mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                placeholder="Add notes about this property..."
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {building.assigned_to && <span>Assigned to: {building.assigned_to}</span>}
                </div>
                <button
                  onClick={saveNotes}
                  className="bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark transition-colors"
                >
                  Save Notes
                </button>
              </div>
              {building.tags?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {building.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-camelot-gold/10 text-camelot-gold px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
