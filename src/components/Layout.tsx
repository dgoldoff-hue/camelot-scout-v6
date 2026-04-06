import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, Bookmark, Upload, GitBranch, Mail, MessageSquare,
  Archive, Download, Bot, Settings, ChevronLeft, ChevronRight,
  BookOpen, HelpCircle, ShieldCheck, Bell, FileText, Swords, Sword, Crown, Eye, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  tourId?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Discover',
    items: [
      { label: 'Search', href: '/', icon: <Search size={18} />, tourId: 'search' },
      { label: 'Results', href: '/results', icon: <LayoutGrid size={18} />, tourId: 'results' },
      { label: 'Saved', href: '/saved', icon: <Bookmark size={18} /> },
      { label: 'Import', href: '/import', icon: <Upload size={18} />, tourId: 'import' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Alerts', href: '/alerts', icon: <Bell size={18} /> },
      { label: 'LL97 Compliance', href: '/compliance', icon: <ShieldCheck size={18} /> },
      { label: 'Competitors', href: '/intelligence', icon: <Swords size={18} /> },
      { label: 'Reports', href: '/reports', icon: <FileText size={18} /> },
      { label: 'Jackie', href: '/report-center', icon: <Crown size={18} /> },
      { label: 'Sentinel', href: '/sentinel', icon: <Eye size={18} /> },
    ],
  },
  {
    title: 'Kill Chain',
    items: [
      { label: 'Pipeline', href: '/pipeline', icon: <GitBranch size={18} />, tourId: 'pipeline' },
      { label: 'Outreach', href: '/outreach', icon: <Mail size={18} />, tourId: 'outreach' },
      { label: 'Instant Proposal', href: '/instant-proposal', icon: <Zap size={18} /> },
      { label: 'Proposals', href: '/proposals', icon: <FileText size={18} /> },
      { label: 'Excalibur', href: '/agreements', icon: <Sword size={18} /> },
      { label: 'Scout AI', href: '/chat', icon: <MessageSquare size={18} />, tourId: 'scout-ai' },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Archive', href: '/archive', icon: <Archive size={18} /> },
      { label: 'Export', href: '/export', icon: <Download size={18} />, tourId: 'export' },
      { label: 'AI Bots', href: '/bots', icon: <Bot size={18} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={18} />, tourId: 'settings' },
    ],
  },
  {
    title: 'Learn',
    items: [
      { label: 'Tutorials', href: '/tutorials', icon: <BookOpen size={18} /> },
    ],
  },
];

interface LayoutProps {
  children: ReactNode;
  onStartTour?: () => void;
}

export default function Layout({ children, onStartTour }: LayoutProps) {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden font-body">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-camelot-navy text-white transition-all duration-300 sidebar-scroll',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-4 py-5 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
          <img
            src="/images/camelot-logo-white.png"
            alt="Camelot"
            className={cn('flex-shrink-0 transition-all', sidebarCollapsed ? 'w-6 h-6 object-contain' : 'h-6 object-contain')}
            onError={(e) => {
              // Fallback if logo doesn't load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!sidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h1 className="font-heading font-bold text-sm tracking-wider text-camelot-gold">SCOUT</h1>
                <p className="text-[10px] text-gray-400 tracking-widest">PROPERTY INTELLIGENCE</p>
              </div>
              {onStartTour && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartTour(); }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-camelot-gold/30 flex items-center justify-center transition-colors"
                  title="Restart guided tour"
                >
                  <HelpCircle size={14} className="text-camelot-gold" />
                </button>
              )}
            </div>
          )}
        </Link>

        {/* Help button when collapsed */}
        {sidebarCollapsed && onStartTour && (
          <button
            onClick={onStartTour}
            className="flex items-center justify-center py-2 text-gray-500 hover:text-camelot-gold transition-colors"
            title="Restart guided tour"
          >
            <HelpCircle size={16} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <p className="px-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-body">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    data-tour={item.tourId}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all font-body',
                      isActive
                        ? 'bg-camelot-gold/20 text-camelot-gold font-medium'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center py-2 border-t border-b border-white/10 text-gray-500 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User profile */}
        {currentUser && (
          <div className={cn('p-4 border-t border-white/10', sidebarCollapsed && 'px-2')}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-camelot-gold rounded-full flex items-center justify-center text-camelot-navy font-bold text-xs font-body">
                {currentUser.initials}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate font-body">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-camelot-gold capitalize font-body">{currentUser.role.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-camelot-cream">
        {children}
      </main>
    </div>
  );
}
