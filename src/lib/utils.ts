import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  if (!value) return 'N/A';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value.toLocaleString();
}

export function formatDate(date: string | undefined | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function daysInStage(movedAt: string | undefined): number {
  if (!movedAt) return 0;
  const diff = new Date().getTime() - new Date(movedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-500';
    case 'B': return 'text-yellow-500';
    case 'C': return 'text-slate-400';
    default: return 'text-slate-400';
  }
}

export function gradeBg(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'B': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'C': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export function pipelineStageColor(stage: string): string {
  const colors: Record<string, string> = {
    discovered: 'bg-slate-500',
    scored: 'bg-violet-500',
    contacted: 'bg-blue-500',
    nurture: 'bg-amber-500',
    proposal: 'bg-camelot-gold',
    negotiation: 'bg-orange-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };
  return colors[stage] || 'bg-slate-500';
}
