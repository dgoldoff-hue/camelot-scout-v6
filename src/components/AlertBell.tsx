import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Bell icon with unread count badge.
 * Drop into the Layout header — clicks navigate to /alerts.
 */
export default function AlertBell({ unreadCount, onClick, className }: AlertBellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg text-gray-400 hover:text-camelot-gold hover:bg-white/5 transition-colors',
        className,
      )}
      title={unreadCount > 0 ? `${unreadCount} unread alerts` : 'No new alerts'}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-camelot-navy">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
