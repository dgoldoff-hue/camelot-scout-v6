import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, Bookmark, Upload, GitBranch, Mail, MessageSquare,
  Archive, Download, Bot, Settings, ChevronLeft, ChevronRight, Castle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Discover',
    items: [
      { label: 'Search', href: '/', icon: <Search size={18} /> },
      { label: 'Results', href: '/results', icon: <LayoutGrid size={18} /> },
      { label: 'Saved', href: '/saved', icon: <Bookmark size={18} /> },
      { label: 'Import', href: '/import', icon: <Upload size={18} /> },
    ],
  },
  {
    title: 'Kill Chain',
    items: [
      { label: 'Pipeline', href: '/pipeline', icon: <GitBranch size={18} /> },
      { label: 'Outreach', href: '/outreach', icon: <Mail size={18} /> },
      { label: 'Scout AI', href: '/chat', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Archive', href: '/archive', icon: <Archive size={18} /> },
      { label: 'Export', href: '/export', icon: <Download size={18} /> },
      { label: 'AI Bots', href: '/bots', icon: <Bot size={18} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
    ],
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-camelot-navy text-white transition-all duration-300 sidebar-scroll',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex-shrink-0 w-8 h-8 bg-camelot-gold rounded-lg flex items-center justify-center">
            <Castle size={18} className="text-camelot-navy" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-bold text-sm tracking-wider">CAMELOT SCOUT</h1>
              <p className="text-[10px] text-gray-400 tracking-widest">v6 • PROPERTY INTELLIGENCE</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              {!sidebarCollapsed && (
                <p className="px-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
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
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all',
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
              <div className="flex-shrink-0 w-9 h-9 bg-camelot-gold rounded-full flex items-center justify-center text-camelot-navy font-bold text-xs">
                {currentUser.initials}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-camelot-gold capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
