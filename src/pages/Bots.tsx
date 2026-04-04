import { useState } from 'react';
import type { Bot, BotRun, BotStatus } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Bot as BotIcon, Play, Pause, AlertCircle, Clock, CheckCircle,
  Phone, RefreshCw, Activity, Sparkles, Settings, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEMO_BOTS: Bot[] = [
  {
    id: '1', name: 'Cold Caller Bot', type: 'cold_caller',
    description: 'Auto-generates call scripts for top-scoring leads. Prioritizes buildings with high violation counts and no current management.',
    status: 'idle', config: {}, tasks_completed: 47, tasks_queued: 12,
    last_run_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: '', updated_at: '',
  },
  {
    id: '2', name: 'Follow-Up Bot', type: 'follow_up',
    description: 'Monitors the nurture pipeline and suggests follow-up actions based on time-in-stage and engagement signals.',
    status: 'active', config: {}, tasks_completed: 23, tasks_queued: 5,
    last_run_at: new Date(Date.now() - 1800000).toISOString(),
    created_at: '', updated_at: '',
  },
  {
    id: '3', name: 'System Health Bot', type: 'system_health',
    description: 'Monitors API connections, data freshness, and system performance. Alerts on failures.',
    status: 'active', config: {}, tasks_completed: 156, tasks_queued: 0,
    last_run_at: new Date(Date.now() - 900000).toISOString(),
    created_at: '', updated_at: '',
  },
  {
    id: '4', name: 'Auto-Enrichment Bot', type: 'auto_enrichment',
    description: 'Automatically enriches new buildings with Apollo/Prospeo contact data and NYC API information.',
    status: 'paused', config: {}, tasks_completed: 89, tasks_queued: 31,
    error_message: 'Apollo.io API key not configured',
    last_run_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: '', updated_at: '',
  },
];

const DEMO_RUNS: BotRun[] = [
  { id: '1', bot_id: '2', status: 'completed', results: { processed: 5, actions_suggested: 3 }, started_at: new Date(Date.now() - 1800000).toISOString(), completed_at: new Date(Date.now() - 1700000).toISOString() },
  { id: '2', bot_id: '3', status: 'completed', results: { apis_checked: 4, all_healthy: true }, started_at: new Date(Date.now() - 900000).toISOString(), completed_at: new Date(Date.now() - 895000).toISOString() },
  { id: '3', bot_id: '1', status: 'completed', results: { scripts_generated: 3, top_lead: 'The Bromley' }, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3500000).toISOString() },
  { id: '4', bot_id: '4', status: 'failed', results: {}, started_at: new Date(Date.now() - 86400000).toISOString(), error: 'Apollo.io API key not configured' },
];

const BOT_ICONS: Record<string, any> = {
  cold_caller: Phone,
  follow_up: RefreshCw,
  system_health: Activity,
  auto_enrichment: Sparkles,
};

const STATUS_CONFIG: Record<BotStatus, { color: string; bg: string; label: string }> = {
  active: { color: 'text-green-600', bg: 'bg-green-100', label: 'Active' },
  paused: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Paused' },
  error: { color: 'text-red-600', bg: 'bg-red-100', label: 'Error' },
  idle: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Idle' },
};

export default function Bots() {
  const [bots, setBots] = useState(DEMO_BOTS);
  const [expandedBot, setExpandedBot] = useState<string | null>(null);

  const toggleBot = (id: string) => {
    setBots((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const newStatus: BotStatus = b.status === 'active' ? 'paused' : 'active';
        toast.success(`${b.name} ${newStatus === 'active' ? 'started' : 'paused'}`);
        return { ...b, status: newStatus };
      })
    );
  };

  const runBot = (id: string) => {
    setBots((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        toast.success(`${b.name} running...`);
        return { ...b, status: 'active', last_run_at: new Date().toISOString() };
      })
    );
  };

  const botRuns = (botId: string) => DEMO_RUNS.filter((r) => r.bot_id === botId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BotIcon size={24} className="text-camelot-gold" /> AI Bots
        </h1>
        <p className="text-sm text-gray-500 mt-1">Automated agents that work in the background</p>
      </div>

      <div className="p-8">
        {/* Bot Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bots.map((bot) => {
            const Icon = BOT_ICONS[bot.type] || BotIcon;
            const statusConfig = STATUS_CONFIG[bot.status];
            const runs = botRuns(bot.id);
            const isExpanded = expandedBot === bot.id;

            return (
              <div key={bot.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Bot Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-camelot-navy rounded-xl flex items-center justify-center">
                        <Icon size={24} className="text-camelot-gold" />
                      </div>
                      <div>
                        <h3 className="font-bold">{bot.name}</h3>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          statusConfig.bg, statusConfig.color
                        )}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleBot(bot.id)}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors',
                        bot.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                          bot.status === 'active' ? 'translate-x-6' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{bot.description}</p>

                  {bot.error_message && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">
                      <AlertCircle size={14} /> {bot.error_message}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{bot.tasks_completed}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Completed</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold">{bot.tasks_queued}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Queued</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs font-medium">{bot.last_run_at ? formatDate(bot.last_run_at) : 'Never'}</p>
                      <p className="text-[10px] text-gray-500 uppercase">Last Run</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => runBot(bot.id)}
                      className="flex items-center gap-1 text-xs bg-camelot-gold/10 text-camelot-gold px-3 py-1.5 rounded-lg hover:bg-camelot-gold/20"
                    >
                      <Play size={12} /> Run Now
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                      <Settings size={12} /> Configure
                    </button>
                    <button
                      onClick={() => setExpandedBot(isExpanded ? null : bot.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 ml-auto"
                    >
                      <Clock size={12} /> History
                      <ChevronDown size={12} className={cn('transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Run History */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Run History</h4>
                    {runs.length === 0 ? (
                      <p className="text-xs text-gray-400">No runs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {runs.map((run) => (
                          <div key={run.id} className="flex items-center gap-3 text-xs bg-white p-2 rounded-lg">
                            {run.status === 'completed' ? (
                              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium capitalize">{run.status}</p>
                              {run.error && <p className="text-red-500">{run.error}</p>}
                              {Object.keys(run.results).length > 0 && (
                                <p className="text-gray-400">
                                  {Object.entries(run.results).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-gray-400">{formatDate(run.started_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
