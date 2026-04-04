/**
 * ComplianceBadge — Small badge showing LL97 compliance status.
 * Use on PropertyCard, search results, or anywhere a quick status indicator is needed.
 */

import { cn } from '@/lib/utils';
import type { LL97ComplianceStatus } from '@/lib/ll97-calculator';

interface ComplianceBadgeProps {
  status: LL97ComplianceStatus;
  /** Show the penalty amount alongside the status */
  penalty?: number;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_STYLES: Record<LL97ComplianceStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Compliant': {
    bg: 'bg-green-900/30',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
  'At Risk': {
    bg: 'bg-yellow-900/30',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  'Non-Compliant': {
    bg: 'bg-red-900/30',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
};

/** Light-theme variant for use on white backgrounds (e.g., PropertyCard) */
const STATUS_STYLES_LIGHT: Record<LL97ComplianceStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Compliant': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  'At Risk': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
  'Non-Compliant': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

export default function ComplianceBadge({ status, penalty, size = 'sm', className }: ComplianceBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        styles.bg, styles.text, styles.border,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className,
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', styles.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      LL97: {status}
      {penalty != null && penalty > 0 && (
        <span className="opacity-80">
          (${penalty.toLocaleString()}/yr)
        </span>
      )}
    </span>
  );
}

/**
 * Light-theme variant for use on white/light backgrounds (e.g., PropertyCard in results grid).
 */
export function ComplianceBadgeLight({ status, penalty, size = 'sm', className }: ComplianceBadgeProps) {
  const styles = STATUS_STYLES_LIGHT[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        styles.bg, styles.text, styles.border,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        className,
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', styles.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      LL97: {status}
      {penalty != null && penalty > 0 && (
        <span className="opacity-75">
          (${penalty.toLocaleString()}/yr)
        </span>
      )}
    </span>
  );
}
