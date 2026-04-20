import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  Bookmark,
  Upload,
  GitBranch,
  Mail,
  MessageSquare,
  Archive,
  Download,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Bell,
  FileText,
  Swords,
  Sword,
  Crown,
  Eye,
  Zap,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store';

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
    items
