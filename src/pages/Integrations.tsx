import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBuildings } from '@/hooks/useBuildings';
import type { Building } from '@/types';
import { cn } from '@/lib/utils';
import { CAMELOT_ACQUISITION_PIPELINE, SENTINEL_HANDOFF_RULES } from '@/lib/acquisition-pipeline';
import { LEAD_GENERATOR_DEPLOYMENT_PROMPT } from '@/lib/scout-ai-doctrines';
import {
  auditLeadQuality,
  getIntegrationStatus,
  pushBuildingToIntegrations,
  routeLead,
  type IntegrationPushResult,
  type IntegrationStatus,
  type LeadQualityResult,
} from '@/lib/integrations';

type PushState = Record<string, IntegrationPushResult | { status: 'running' }>;

export default function Integrations() {
  const { buildings, selectedBuildings, loadBuildings, toggleSelected, selectAll, clearSelection } = useBuildings();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pushState, setPushState] = useState<PushState>({});

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const activeBuildings = useMemo(() => buildings.filter((building) => building.status === 'active'), [buildings]);
  const filteredBuildings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeBuildings;
    return activeBuildings.filter((building) =>
      [building.name, building.address, building.borough, building.region, building.neighborhood]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [activeBuildings, query]);

  const selectedSet = useMemo(() => new Set(selectedBuildings), [selectedBuildings]);
  const exportBuildings = useMemo(
    () => activeBuildings.filter((building) => selectedSet.has(building.id)),
    [activeBuildings, selectedSet]
  );
  const auditRows = useMemo(
    () => (exportBuildings.length ? exportBuildings : filteredBuildings.slice(0, 12)).map((building) => {
      const quality = auditLeadQuality(building);
      return { building, quality, routing: routeLead(building, quality) };
    }),
    [exportBuildings, filteredBuildings]
  );

  const summary = useMemo(() => {
    const rows = auditRows.map((row) => row.quality);
    return {
      hot: rows.filter((row) => row.tier === 'hot').length,
      warm: rows.filter((row) => row.tier === 'warm').length,
      cold: rows.filter((row) => row.tier === 'cold').length,
      review: rows.filter((row) => row.tier === 'review').length,
      avg: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0,
    };
  }, [auditRows]);

  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await getIntegrationStatus();
      setStatus(data);
    } catch (err: any) {
      toast.error(err.message || 'Integration status check failed');
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const pushSelected = async () => {
    const targets = exportBuildings.length ? exportBuildings : filteredBuildings.slice(0, 1);
    if (!targets.length) {
      toast.error('No buildings selected.');
      return;
    }

    toast.loading(`Pushing ${targets.length} lead${targets.length === 1 ? '' : 's'}...`, { id: 'integration-push' });

    for (const building of targets) {
      setPushState((prev) => ({ ...prev, [building.id]: { status: 'running' } }));
      try {
        const result = await pushBuildingToIntegrations(building);
        setPushState((prev) => ({ ...prev, [building.id]: result }));
      } catch (err: any) {
        const quality = auditLeadQuality(building);
        setPushState((prev) => ({
          ...prev,
          [building.id]: {
            status: 'error',
            quality,
            routing: routeLead(building, quality),
            scout: { status: 'error', message: err.message || 'Scout push failed' },
            hubspot: { status: 'error', message: err.message || 'HubSpot push failed' },
          },
        }));
      }
    }

    toast.success('Integration run finished. Review the status table for skips or errors.', { id: 'integration-push' });
  };

  const downloadCsv = () => {
    const rows = auditRows.map(({ building, quality, routing }) => ({
      address: building.address,
      name: building.name || '',
      units: building.units || '',
      type: building.type,
      score: quality.score,
      tier: quality.tier,
      missing: quality.missingFields.join('; '),
      route_team: routing.team,
      route_region: routing.region,
      priority: routing.priority,
      tags: routing.tags.join('; '),
    }));
    const header = Object.keys(rows[0] || { address: '' });
    const csv = [
      header.join(','),
      ...rows.map((row) => header.map((key) => JSON.stringify((row as any)[key] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Camelot-Scout-HubSpot-Lead-Audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch size={25} className="text-camelot-gold" /> Scout + HubSpot Integrations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Lead quality audit, routing, credential health, and push status before Scout or HubSpot receives a lead.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshStatus}
              className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              <RefreshCw size={15} className={cn(statusLoading && 'animate-spin')} /> Check Health
            </button>
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              <Download size={15} /> Download QA CSV
            </button>
            <button
              onClick={pushSelected}
              className="inline-flex items-center gap-2 bg-camelot-navy text-white px-3 py-2 rounded-md text-sm hover:bg-camelot-navy/90"
            >
              <Send size={15} /> Push Selected
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <StatusCard label="Scout API" ok={Boolean(status?.scout.configured)} detail={status?.scout.configured ? 'Configured' : 'Needs SCOUT_API_URL, SCOUT_API_KEY, workspace'} />
          <StatusCard label="HubSpot" ok={Boolean(status?.hubspot.configured)} detail={status?.hubspot.configured ? 'Contacts enabled' : 'Needs HUBSPOT_API_KEY'} />
          <StatusCard label="Lead Quality Avg" ok={summary.avg >= 55} detail={`${summary.avg}/100 across visible audit`} />
          <StatusCard label="Feedback Loop" ok={false} soft detail="Planned: Scout outcomes and HubSpot deal status sync back" />
        </div>

        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-bold">Scout &rarr; Sentinel &rarr; Jackie &rarr; Arthur</h2>
              <p className="text-sm text-gray-500">
                Lead generation now uses an institutional gate sequence: sources first, analyst scoring second, operator validation third, underwriting last.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Sentinel promotes {SENTINEL_HANDOFF_RULES.promoteAt}+ only; Arthur runs after Jackie pass.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
            {CAMELOT_ACQUISITION_PIPELINE.map((stage) => (
              <div key={stage.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="font-semibold">{stage.name}</p>
                <p className="text-xs text-gray-500 mt-1">{stage.output}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold">Lead Quality Audit</h2>
                <p className="text-xs text-gray-500">
                  Select specific buildings or review the visible search results before pushing to Scout and HubSpot.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search building, borough, region..."
                  className="w-full sm:w-72 border border-gray-200 rounded-md px-3 py-2 text-sm"
                />
                <button
                  onClick={selectAll}
                  className="text-sm border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  Select All Active
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="text-left p-3">Lead</th>
                    <th className="text-left p-3">Quality</th>
                    <th className="text-left p-3">Routing</th>
                    <th className="text-left p-3">Gaps</th>
                    <th className="text-left p-3">Push Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.map(({ building, quality, routing }) => {
                    const push = pushState[building.id];
                    return (
                      <tr key={building.id} className="border-t border-gray-100 align-top">
                        <td className="p-3 min-w-[260px]">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedSet.has(building.id)}
                              onChange={() => toggleSelected(building.id)}
                              className="mt-1"
                            />
                            <span>
                              <span className="font-semibold block">{building.name || building.address}</span>
                              <span className="text-xs text-gray-500">{building.address}</span>
                              <span className="text-xs text-gray-400 block">{building.units || 'N/A'} units | {building.type}</span>
                            </span>
                          </label>
                        </td>
                        <td className="p-3 min-w-[150px]">
                          <QualityBadge quality={quality} />
                          <p className="text-xs text-gray-500 mt-1">{quality.strengths.slice(0, 2).join(' | ') || 'Needs enrichment'}</p>
                        </td>
                        <td className="p-3 min-w-[220px]">
                          <p className="font-medium">{routing.team}</p>
                          <p className="text-xs text-gray-500">{routing.region} | {routing.priority}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {routing.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 min-w-[220px]">
                          {quality.missingFields.length ? (
                            <ul className="text-xs text-amber-700 space-y-1">
                              {quality.missingFields.slice(0, 4).map((field) => <li key={field}>- {field}</li>)}
                            </ul>
                          ) : (
                            <span className="text-xs text-emerald-700">No major gaps</span>
                          )}
                        </td>
                        <td className="p-3 min-w-[230px]">
                          <PushStatus push={push} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-camelot-gold" /> What This Adds
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <Feature icon={Sparkles} title="Lead Quality Audit" text="Hot, warm, cold, and review tiers before export." />
                <Feature icon={Route} title="Routing" text="Team, region, priority, and tags generated from the property profile." />
                <Feature icon={Users} title="Data Hygiene" text="Safe name parsing, phone normalization, missing contact fields, and valuation gaps." />
                <Feature icon={GitBranch} title="Lifecycle Ready" text="Built to add two-way Scout and HubSpot outcome sync next." />
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">Lead Generator Prompt</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Deployment doctrine for hybrid batch processing, real-time webhooks, Scout export, HubSpot sync, and Slack monitoring.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(LEAD_GENERATOR_DEPLOYMENT_PROMPT);
                    toast.success('Lead generator deployment prompt copied');
                  }}
                  className="text-xs bg-camelot-gold text-camelot-dark px-3 py-2 rounded-md hover:bg-camelot-gold-light"
                >
                  Copy
                </button>
              </div>
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {LEAD_GENERATOR_DEPLOYMENT_PROMPT.trim()}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="font-bold">Today&apos;s Audit</h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <MiniMetric label="Hot" value={summary.hot} color="text-emerald-700" />
                <MiniMetric label="Warm" value={summary.warm} color="text-amber-700" />
                <MiniMetric label="Cold" value={summary.cold} color="text-gray-700" />
                <MiniMetric label="Review" value={summary.review} color="text-red-700" />
              </div>
            </section>

            <section className="bg-camelot-navy text-white rounded-lg p-5">
              <h2 className="font-bold">Configuration</h2>
              <p className="text-sm text-white/70 mt-2">
                Add these Render environment variables for full mode: SCOUT_API_URL, SCOUT_API_KEY,
                SCOUT_WORKSPACE_ID, HUBSPOT_API_KEY. Deal sync is opt-in with HUBSPOT_CREATE_DEALS,
                HUBSPOT_PIPELINE_ID, and HUBSPOT_DEAL_STAGE_ID.
              </p>
              <a
                href="/api/integrations/status"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-camelot-gold mt-4"
              >
                Open raw status <ExternalLink size={14} />
              </a>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, detail, ok, soft = false }: { label: string; detail: string; ok: boolean; soft?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        {ok ? (
          <CheckCircle size={17} className="text-emerald-600" />
        ) : soft ? (
          <AlertCircle size={17} className="text-amber-600" />
        ) : (
          <AlertCircle size={17} className="text-red-600" />
        )}
      </div>
      <p className="font-semibold mt-2">{ok ? 'Ready' : soft ? 'Next phase' : 'Needs setup'}</p>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

function QualityBadge({ quality }: { quality: LeadQualityResult }) {
  const colors = {
    hot: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warm: 'bg-amber-50 text-amber-700 border-amber-200',
    cold: 'bg-gray-50 text-gray-700 border-gray-200',
    review: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium', colors[quality.tier])}>
      {quality.score}/100 {quality.tier.toUpperCase()}
    </span>
  );
}

function PushStatus({ push }: { push?: PushState[string] }) {
  if (!push) return <span className="text-xs text-gray-400">Not pushed yet</span>;
  if (push.status === 'running') {
    return <span className="inline-flex items-center gap-2 text-xs text-blue-700"><RefreshCw size={13} className="animate-spin" /> Running</span>;
  }

  return (
    <div className="space-y-1 text-xs">
      <p className={cn('font-semibold', push.status === 'ok' ? 'text-emerald-700' : push.status === 'partial' ? 'text-amber-700' : 'text-red-700')}>
        {push.status.toUpperCase()}
      </p>
      <p className="text-gray-600">Scout: {push.scout.message}</p>
      <p className="text-gray-600">HubSpot: {push.hubspot.message}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-camelot-gold/10 rounded-md flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-camelot-gold" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-gray-200 rounded-md p-3">
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}
