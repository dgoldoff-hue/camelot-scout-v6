import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BotStatus } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  AlertCircle,
  Archive,
  Bot as BotIcon,
  CheckCircle,
  Clock,
  Crown,
  Database,
  FileText,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

type BotSource = {
  name: string;
  kind: 'Drive' | 'Repo' | 'Generated';
  status: 'synced' | 'reference' | 'pending';
};

type DashboardBot = {
  id: string;
  name: string;
  type: string;
  description: string;
  status: BotStatus;
  owner: string;
  last_run_at?: string;
  tasks_completed: number;
  tasks_queued: number;
  outputs: string[];
  quality_gates: string[];
  sources: BotSource[];
  actions: { label: string; href: string; icon: typeof BotIcon }[];
  error_message?: string;
};

type BotRun = {
  id: string;
  bot_id: string;
  status: 'completed' | 'failed' | 'queued';
  summary: string;
  started_at: string;
};

const DRIVE_FOLDER = 'Google Drive folder 1T6WD8q-2h9Cq1kxCwFmIcdb4lo-A3EAF';

const DEMO_BOTS: DashboardBot[] = [
  {
    id: 'jackie',
    name: 'Jackie Pitch Engine',
    type: 'jackie',
    description:
      'Builds a full new-business pitch package: property intelligence report, transition plan, management agreement, and review-ready email draft.',
    status: 'active',
    owner: 'David Goldoff',
    tasks_completed: 7,
    tasks_queued: 1,
    last_run_at: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
    outputs: ['Property Intelligence PDF', '90-Day Transition Plan', 'Management Agreement PDF', 'Gmail draft'],
    quality_gates: [
      'Pre-publish lock blocks GitHub, Render, email, PDF, and dashboard release until verified',
      'Subject property address verified against source property record',
      'Address matches across report, proposal, agreement, email draft, filenames, and dashboard labels',
      'Fixes, errors, script runs, builds, and smoke tests rechecked clean after final edit',
      '42 properties and Founded 2006 facts locked',
      'BankUnited callout included',
      'Active Now vs Deploying 2026 tech table',
      '32BJ and LL97 checks applied when relevant',
      'Commercial and amenity sources checked: LoopNet, CoStar, PropertyShark, HPD, DOF, DOB/DOT parking, operators, StreetEasy, official site',
      'No self-managed language unless confirmed; known staffed buildings show board/staff/management context',
      'Gut Check, Quarterly Market Reports, DOF link, partner logos, case studies, and duplicate closing pages verified',
    ],
    sources: [
      { name: 'Jackie_SKILL_Updated.md', kind: 'Drive', status: 'synced' },
      { name: 'build_jackie_manual.py', kind: 'Drive', status: 'reference' },
      { name: 'build_tur_proposal.py', kind: 'Drive', status: 'reference' },
      { name: 'build_tur_agreement.py', kind: 'Drive', status: 'reference' },
      { name: 'reference/jackie-skill.md', kind: 'Repo', status: 'synced' },
    ],
    actions: [
      { label: 'Instant Proposal', href: '/instant-proposal', icon: Zap },
      { label: 'Proposal Library', href: '/proposals', icon: FileText },
      { label: 'Jackie Reports', href: '/report-center', icon: Crown },
      { label: 'Agreements', href: '/agreements', icon: ShieldCheck },
    ],
  },
  {
    id: 'scout',
    name: 'Scout Market Intelligence',
    type: 'scout',
    description:
      'Finds target buildings, scores opportunities, enriches owner/manager data, and moves qualified leads into the pipeline.',
    status: 'active',
    owner: 'Scout',
    tasks_completed: 156,
    tasks_queued: 8,
    last_run_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    outputs: ['Lead scores', 'Violation signals', 'Owner intel', 'Pipeline tasks'],
    quality_gates: [
      'Source address verified before content is exported or published',
      'HPD/DOF/DOB sources checked',
      'Grade A/B/C score generated',
      'Pipeline stage updated',
      'Fixes and API errors resolved before handoff',
    ],
    sources: [
      { name: 'src/lib/scoring.ts', kind: 'Repo', status: 'synced' },
      { name: 'src/lib/nyc-api.ts', kind: 'Repo', status: 'synced' },
      { name: 'Scout_Unit_Intelligence.html', kind: 'Drive', status: 'pending' },
    ],
    actions: [
      { label: 'Search', href: '/', icon: Database },
      { label: 'Pipeline', href: '/pipeline', icon: RefreshCw },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    id: 'sentinel',
    name: 'Sentinel Market Watch',
    type: 'sentinel',
    description:
      'Packages market signals and competitor intelligence into reports for buildings that need a sharper follow-up angle.',
    status: 'idle',
    owner: 'Camelot OS',
    tasks_completed: 18,
    tasks_queued: 2,
    last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    outputs: ['Market report', 'Competitive summary', 'Pricing context'],
    quality_gates: [
      'Subject property address checked against selected market source',
      'Report template present',
      'Reference parser present',
      'Manual review before sending',
      'No broken links or missing sections before publish',
    ],
    sources: [
      { name: 'reference/sentinel_generate_report.py', kind: 'Repo', status: 'synced' },
      { name: 'reference/sentinel_parse_realtymx.py', kind: 'Repo', status: 'synced' },
    ],
    actions: [
      { label: 'Sentinel', href: '/sentinel', icon: Sparkles },
      { label: 'Intelligence', href: '/intelligence', icon: Database },
    ],
  },
  {
    id: 'outreach',
    name: 'Outreach Follow-Up Bot',
    type: 'outreach',
    description:
      'Turns building status, proposal activity, and nurture timing into next-step reminders and draft outreach.',
    status: 'paused',
    owner: 'Sales',
    tasks_completed: 31,
    tasks_queued: 5,
    last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    outputs: ['Follow-up prompts', 'Email drafts', 'Pipeline nudges'],
    quality_gates: [
      'Property address verified before any draft is handed off',
      'Draft only, never auto-send',
      'Building context included',
      'Owner review required',
      'Corrections rechecked clean before release',
    ],
    sources: [
      { name: 'src/lib/email-templates.ts', kind: 'Repo', status: 'synced' },
      { name: 'src/pages/Outreach.tsx', kind: 'Repo', status: 'synced' },
    ],
    actions: [
      { label: 'Outreach', href: '/outreach', icon: Mail },
      { label: 'Archive', href: '/archive', icon: Archive },
    ],
  },
];

const DEMO_RUNS: BotRun[] = [
  {
    id: 'run-1',
    bot_id: 'jackie',
    status: 'completed',
    summary: 'Drive package reviewed; Jackie dashboard entry synced with canonical facts and quality gates.',
    started_at: new Date(Date.now() - 1000 * 60 * 21).toISOString(),
  },
  {
    id: 'run-2',
    bot_id: 'scout',
    status: 'completed',
    summary: 'NYC source checks and score refresh completed for active demo inventory.',
    started_at: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
  },
  {
    id: 'run-3',
    bot_id: 'sentinel',
    status: 'queued',
    summary: 'Waiting for next selected building or uploaded market source.',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

const BOT_ICONS: Record<string, typeof BotIcon> = {
  jackie: Crown,
  scout: Database,
  sentinel: Sparkles,
  outreach: Mail,
};

const STATUS_CONFIG: Record<BotStatus, { color: string; bg: string; label: string }> = {
  active: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Active' },
  paused: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Paused' },
  error: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Error' },
  idle: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', label: 'Idle' },
};

const SOURCE_CONFIG: Record<BotSource['status'], string> = {
  synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reference: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Bots() {
  const [bots, setBots] = useState(DEMO_BOTS);
  const [selectedBotId, setSelectedBotId] = useState('jackie');

  const selectedBot = useMemo(
    () => bots.find((bot) => bot.id === selectedBotId) ?? bots[0],
    [bots, selectedBotId]
  );

  const runs = DEMO_RUNS.filter((run) => run.bot_id === selectedBot.id);

  const toggleBot = (id: string) => {
    setBots((prev) =>
      prev.map((bot) => {
        if (bot.id !== id) return bot;
        const status: BotStatus = bot.status === 'active' ? 'paused' : 'active';
        toast.success(`${bot.name} ${status === 'active' ? 'started' : 'paused'}`);
        return { ...bot, status };
      })
    );
  };

  const runBot = (id: string) => {
    setBots((prev) =>
      prev.map((bot) => {
        if (bot.id !== id) return bot;
        toast.success(`${bot.name} run queued`);
        return { ...bot, status: 'active', last_run_at: new Date().toISOString(), tasks_queued: bot.tasks_queued + 1 };
      })
    );
  };

  const selectedStatus = STATUS_CONFIG[selectedBot.status];
  const SelectedIcon = BOT_ICONS[selectedBot.type] || BotIcon;

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BotIcon size={24} className="text-camelot-gold" /> AI Bots and Tools
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Operational dashboard for Scout, Jackie, Sentinel, and follow-up automation.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Active" value={bots.filter((bot) => bot.status === 'active').length} />
            <Metric label="Queued" value={bots.reduce((sum, bot) => sum + bot.tasks_queued, 0)} />
            <Metric label="Completed" value={bots.reduce((sum, bot) => sum + bot.tasks_completed, 0)} />
            <Metric label="Sources" value={bots.reduce((sum, bot) => sum + bot.sources.length, 0)} />
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
          <div className="space-y-3">
            {bots.map((bot) => {
              const Icon = BOT_ICONS[bot.type] || BotIcon;
              const statusConfig = STATUS_CONFIG[bot.status];
              const isSelected = bot.id === selectedBot.id;

              return (
                <button
                  key={bot.id}
                  onClick={() => setSelectedBotId(bot.id)}
                  className={cn(
                    'w-full text-left bg-white border rounded-lg p-4 transition-all',
                    isSelected ? 'border-camelot-gold shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-camelot-navy rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={21} className="text-camelot-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-bold leading-tight">{bot.name}</h2>
                        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', statusConfig.bg, statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bot.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-camelot-navy rounded-lg flex items-center justify-center flex-shrink-0">
                    <SelectedIcon size={28} className="text-camelot-gold" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{selectedBot.name}</h2>
                      <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', selectedStatus.bg, selectedStatus.color)}>
                        {selectedStatus.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 max-w-3xl">{selectedBot.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Owner: {selectedBot.owner} | Source: {selectedBot.id === 'jackie' ? DRIVE_FOLDER : 'Camelot Scout repo'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => runBot(selectedBot.id)}
                    className="inline-flex items-center gap-2 text-sm bg-camelot-gold text-camelot-dark px-3 py-2 rounded-md hover:bg-camelot-gold-light"
                  >
                    <Play size={14} /> Run
                  </button>
                  <button
                    onClick={() => toggleBot(selectedBot.id)}
                    className="inline-flex items-center gap-2 text-sm border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    {selectedBot.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                    {selectedBot.status === 'active' ? 'Pause' : 'Start'}
                  </button>
                  <button className="inline-flex items-center gap-2 text-sm border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-50">
                    <Settings size={14} /> Configure
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 border-b border-gray-200">
              <DetailMetric label="Completed tasks" value={selectedBot.tasks_completed} />
              <DetailMetric label="Queued tasks" value={selectedBot.tasks_queued} />
              <DetailMetric label="Last run" value={selectedBot.last_run_at ? formatDate(selectedBot.last_run_at) : 'Never'} />
            </div>

            {selectedBot.error_message && (
              <div className="mx-5 mt-5 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md border border-red-100">
                <AlertCircle size={16} /> {selectedBot.error_message}
              </div>
            )}

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Section title="Outputs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBot.outputs.map((output) => (
                    <div key={output} className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <FileText size={14} className="text-camelot-gold flex-shrink-0" />
                      <span>{output}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Quick Actions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedBot.actions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        to={action.href}
                        className="flex items-center justify-between gap-3 text-sm border border-gray-200 rounded-md px-3 py-2 hover:border-camelot-gold hover:bg-camelot-gold/5"
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={14} className="text-camelot-gold" />
                          {action.label}
                        </span>
                        <span className="text-gray-300">/</span>
                      </Link>
                    );
                  })}
                </div>
              </Section>

              <Section title="Source Files">
                <div className="space-y-2">
                  {selectedBot.sources.map((source) => (
                    <div key={`${source.kind}-${source.name}`} className="flex items-center justify-between gap-3 text-sm border border-gray-200 rounded-md px-3 py-2">
                      <span className="truncate">{source.name}</span>
                      <span className={cn('text-[11px] px-2 py-0.5 rounded-full border flex-shrink-0', SOURCE_CONFIG[source.status])}>
                        {source.kind} {source.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Quality Gates">
                <div className="space-y-2">
                  {selectedBot.quality_gates.map((gate) => (
                    <div key={gate} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{gate}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <div className="px-5 pb-5">
              <Section title="Run History">
                {runs.length === 0 ? (
                  <p className="text-sm text-gray-400">No runs logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <div key={run.id} className="flex items-start gap-3 text-sm bg-gray-50 border border-gray-200 rounded-md p-3">
                        {run.status === 'completed' ? (
                          <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        ) : run.status === 'queued' ? (
                          <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium capitalize">{run.status}</p>
                          <p className="text-gray-500 mt-0.5">{run.summary}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(run.started_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 min-w-[92px]">
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 border-b lg:border-b-0 lg:border-r last:border-r-0 border-gray-200">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </section>
  );
}
