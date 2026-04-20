import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, Bookmark, Upload, GitBranch, Mail, MessageSquare,
  Archive, Download, Bot, Settings, ChevronLeft, ChevronRight,
  BookOpen, HelpCircle, ShieldCheck, Bell, FileText, Swords, Sword, Crown, Eye, Zap, AlertTriangle,
  Menu, X, Home, UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useTeamStore } from '@/lib/store';
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
    title: 'Scout — New Business',
    items: [
      { label: 'Search', href: '/', icon: <Search size={18} />, tourId: 'search' },
      { label: 'Results & Scoring', href: '/results', icon: <LayoutGrid size={18} />, tourId: 'results' },
      { label: 'Pipeline', href: '/pipeline', icon: <GitBranch size={18} />, tourId: 'pipeline' },
      { label: 'Outreach', href: '/outreach', icon: <Mail size={18} />, tourId: 'outreach' },
      { label: 'Saved', href: '/saved', icon: <Bookmark size={18} /> },
      { label: 'Import', href: '/import', icon: <Upload size={18} />, tourId: 'import' },
    ],
  },
  {
    title: 'Jackie — Pitches',
    items: [
      { label: 'Instant Proposal', href: '/instant-proposal', icon: <Zap size={18} /> },
      { label: 'Proposal Library', href: '/proposals', icon: <FileText size={18} /> },
      { label: 'Jackie Reports', href: '/report-center', icon: <Crown size={18} /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Alerts', href: '/alerts', icon: <Bell size={18} /> },
      { label: 'Shield — Compliance', href: '/compliance', icon: <ShieldCheck size={18} /> },
      { label: 'Violations', href: '/violations', icon: <AlertTriangle size={18} /> },
      { label: 'Competitors', href: '/intelligence', icon: <Swords size={18} /> },
      { label: 'Reports', href: '/reports', icon: <FileText size={18} /> },
      { label: 'Sentinel — Market', href: '/sentinel', icon: <Eye size={18} /> },
    ],
  },
  {
    title: 'Excalibur — Agreements',
    items: [
      { label: 'Generate Agreement', href: '/agreements', icon: <Sword size={18} /> },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Merlin AI', href: '/chat', icon: <MessageSquare size={18} />, tourId: 'scout-ai' },
      { label: 'Archive', href: '/archive', icon: <Archive size={18} /> },
      { label: 'Export', href: '/export', icon: <Download size={18} />, tourId: 'export' },
      { label: 'AI Bots', href: '/bots', icon: <Bot size={18} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={18} />, tourId: 'settings' },
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
  const { members, setCurrentUser } = useTeamStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close switcher dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    if (switcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [switcherOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-4 py-5 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0">
        <img
          src="/images/camelot-logo-white.png"
          alt="Camelot"
          className={cn('flex-shrink-0 transition-all', sidebarCollapsed && !mobileMenuOpen ? 'w-6 h-6 object-contain' : 'h-6 object-contain')}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-sm tracking-wider text-camelot-gold">CAMELOT OS</h1>
              <p className="text-[10px] text-gray-400 tracking-widest">PROPERTY MANAGEMENT SYSTEM</p>
            </div>
            <div className="flex items-center gap-1">
              {onStartTour && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartTour(); }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-camelot-gold/30 flex items-center justify-center transition-colors"
                  title="Restart guided tour"
                >
                  <HelpCircle size={14} className="text-camelot-gold" />
                </button>
              )}
              {/* Mobile close button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors md:hidden"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}
      </Link>

      {/* Help button when collapsed (desktop only) */}
      {sidebarCollapsed && !mobileMenuOpen && onStartTour && (
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
            {(!sidebarCollapsed || mobileMenuOpen) && (
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
                  title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {(!sidebarCollapsed || mobileMenuOpen) && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex items-center justify-center py-2 border-t border-b border-white/10 text-gray-500 hover:text-white transition-colors flex-shrink-0"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* User profile + switcher */}
      {currentUser && (
        <div className={cn('p-4 border-t border-white/10 flex-shrink-0 relative', sidebarCollapsed && !mobileMenuOpen && 'px-2')} ref={switcherRef}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-camelot-gold rounded-full flex items-center justify-center text-camelot-navy font-bold text-xs font-body">
              {currentUser.initials}
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate font-body">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-camelot-gold capitalize font-body">{currentUser.role.replace(/_/g, ' ')}</p>
                </div>
                {members.length > 1 && (
                  <button
                    onClick={() => setSwitcherOpen((v) => !v)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                    title="Switch user"
                  >
                    <UserCircle size={15} className="text-gray-400" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* User switcher dropdown */}
          {switcherOpen && members.length > 1 && (
            <div className="absolute bottom-full left-2 right-2 mb-2 bg-camelot-navy border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Switch User</p>
              </div>
              <div className="py-1 max-h-60 overflow-y-auto">
                {members.filter((m) => m.is_active).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setCurrentUser(m); setSwitcherOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/10',
                      currentUser.id === m.id && 'bg-camelot-gold/20'
                    )}
                  >
                    <div className="w-7 h-7 bg-camelot-gold rounded-full flex items-center justify-center text-camelot-navy font-bold text-[10px] flex-shrink-0">
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{m.role.replace(/_/g, ' ')}</p>
                    </div>
                    {currentUser.id === m.id && (
                      <span className="ml-auto text-[10px] text-camelot-gold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden font-body">
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-camelot-navy text-white px-4 py-3 md:hidden border-b border-white/10">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <img
            src="/images/camelot-logo-white.png"
            alt="Camelot"
            className="h-5 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="font-heading font-bold text-sm tracking-wider text-camelot-gold">CAMELOT OS</span>
        </div>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — desktop: normal flow; mobile: fixed overlay */}
      <aside
        className={cn(
          // Desktop styles
          'hidden md:flex flex-col bg-camelot-navy text-white transition-all duration-300 sidebar-scroll',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-camelot-navy text-white flex flex-col transition-transform duration-300 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-camelot-cream pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
