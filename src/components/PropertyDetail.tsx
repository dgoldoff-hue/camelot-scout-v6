import { useState, useEffect } from 'react';
import type {
  Building, Contact, Activity, ContactRole, ContactCategory,
  CONTACT_ROLE_LABELS, CONTACT_ROLE_CATEGORY, CONTACT_CATEGORY_COLORS, BuildingOperations,
} from '@/types';
import {
  CONTACT_ROLE_LABELS as ROLE_LABELS,
  CONTACT_ROLE_CATEGORY as ROLE_CATEGORY,
  CONTACT_CATEGORY_COLORS as CAT_COLORS,
} from '@/types';
import { cn, formatCurrency, formatDate, formatNumber, gradeBg, daysInStage } from '@/lib/utils';
import { fetchFullBuildingReport } from '@/lib/nyc-api';
import { enrichBuildingContacts, isEnrichmentConfigured } from '@/lib/enrichment';
import { calculateScore } from '@/lib/scoring';
import { detectBuildingOperations, getDoormanLabel, getFrontDeskLabel } from '@/lib/building-ops';
import { searchNYDOSCorporation, generateExternalLinks, type NYDOSCorporation, type ExternalRecordLink } from '@/lib/gov-apis';
import toast from 'react-hot-toast';
import {
  X, MapPin, Building2, AlertTriangle, DollarSign, Zap, FileText,
  Clock, StickyNote, Download, Mail, Phone, Linkedin, Plus,
  ExternalLink, Sparkles, RefreshCw, User, Shield, GitBranch, Loader2,
  Facebook, Instagram, ChevronDown, ChevronRight, Landmark, Scale, Bookmark, Link,
} from 'lucide-react';

interface PropertyDetailProps {
  building: Building;
  onClose: () => void;
  onUpdate?: (id: string, data: Partial<Building>) => void;
}

type Tab = 'overview' | 'contacts' | 'violations' | 'financials' | 'ownership' | 'energy' | 'permits' | 'activity' | 'notes';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'contacts', label: 'Contacts', icon: User },
  { key: 'violations', label: 'Violations', icon: AlertTriangle },
  { key: 'financials', label: 'Financials', icon: DollarSign },
  { key: 'ownership', label: 'Ownership / ACRIS', icon: Landmark },
  { key: 'energy', label: 'Energy/LL97', icon: Zap },
  { key: 'permits', label: 'Permits', icon: FileText },
  { key: 'activity', label: 'Activity', icon: Clock },
  { key: 'notes', label: 'Notes', icon: StickyNote },
];

// ---- Contact helpers ----

const CATEGORY_ORDER: ContactCategory[] = ['Board Members', 'Ownership', 'Building Staff', 'Management'];

function resolveCategory(role: string): ContactCategory {
  const r = role as ContactRole;
  if (ROLE_CATEGORY[r]) return ROLE_CATEGORY[r];
  // Legacy free-text mapping
  const lower = role.toLowerCase();
  if (lower.includes('board') || lower.includes('president') || lower.includes('treasurer') || lower.includes('secretary')) return 'Board Members';
  if (lower.includes('owner') || lower.includes('landlord') || lower.includes('developer') || lower.includes('investor')) return 'Ownership';
  if (lower.includes('super') || lower.includes('resident') || lower.includes('front desk') || lower.includes('doorman') || lower.includes('porter')) return 'Building Staff';
  if (lower.includes('manag') || lower.includes('agent')) return 'Management';
  return 'Management';
}

function resolveRoleLabel(role: string): string {
  const r = role as ContactRole;
  if (ROLE_LABELS[r]) return ROLE_LABELS[r];
  return role; // legacy free text
}

function groupContacts(contacts: Contact[]): Record<ContactCategory, Contact[]> {
  const groups: Record<ContactCategory, Contact[]> = {
    'Board Members': [],
    'Ownership': [],
    'Building Staff': [],
    'Management': [],
  };
  for (const c of contacts) {
    const cat = resolveCategory(c.role);
    groups[cat].push(c);
  }
  return groups;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
    </svg>
  );
}

function getSocialLinks(contact: Contact, address?: string) {
  const name = contact.name || '';
  const company = contact.company || '';
  const context = [name, company, address].filter(Boolean).join(' ');

  const linkedinUrl = contact.linkedin_url || contact.linkedin
    || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(context)}`;
  const facebookUrl = contact.facebook_url
    || `https://www.facebook.com/search/people/?q=${encodeURIComponent(name + (company ? ' ' + company : ''))}`;
  const instagramUrl = contact.instagram_url
    || `https://www.instagram.com/explore/tags/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, ''))}/`;

  return { linkedinUrl, facebookUrl, instagramUrl };
}

// ---- Add Contact Form ----

const CONTACT_ROLE_OPTIONS: { value: ContactRole; label: string }[] = [
  { value: 'board_president', label: 'Board President' },
  { value: 'board_treasurer', label: 'Board Treasurer' },
  { value: 'board_secretary', label: 'Board Secretary' },
  { value: 'board_member', label: 'Board Member' },
  { value: 'owner', label: 'Owner' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'developer', label: 'Developer' },
  { value: 'investor', label: 'Investor' },
  { value: 'resident_manager', label: 'Resident Manager' },
  { value: 'super', label: 'Superintendent' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'managing_agent', label: 'Managing Agent' },
  { value: 'doorman', label: 'Doorman' },
];

function AddContactForm({ onAdd, onCancel }: { onAdd: (c: Contact) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Contact>>({ role: 'board_member' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    onAdd({
      name: form.name!.trim(),
      role: form.role || 'board_member',
      phone: form.phone || undefined,
      email: form.email || undefined,
      linkedin_url: form.linkedin_url || undefined,
      facebook_url: form.facebook_url || undefined,
      instagram_url: form.instagram_url || undefined,
      company: form.company || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
      <h4 className="font-semibold text-sm">Add Contact</h4>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Name *"
          value={form.name || ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
          required
        />
        <select
          value={form.role || 'board_member'}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        >
          {CONTACT_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          type="tel"
          placeholder="Phone"
          value={form.phone || ''}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
        <input
          type="text"
          placeholder="Company"
          value={form.company || ''}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
        <input
          type="url"
          placeholder="LinkedIn URL"
          value={form.linkedin_url || ''}
          onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
        <input
          type="url"
          placeholder="Facebook URL"
          value={form.facebook_url || ''}
          onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
        <input
          type="url"
          placeholder="Instagram URL"
          value={form.instagram_url || ''}
          onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
        />
      </div>
      <textarea
        placeholder="Notes"
        value={form.notes || ''}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 h-16 resize-none"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
        <button type="submit" className="px-4 py-1.5 text-sm bg-camelot-gold text-white rounded-lg font-medium hover:bg-camelot-gold-dark transition-colors">
          Add Contact
        </button>
      </div>
    </form>
  );
}

// ---- Main Component ----

export default function PropertyDetail({ building, onClose, onUpdate }: PropertyDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isFetchingNYC, setIsFetchingNYC] = useState(false);
  const [nycData, setNycData] = useState<any>(null);
  const [notes, setNotes] = useState(building.notes || '');

  // Fetch NYC data on mount
  useEffect(() => {
    if (building.address && !nycData) {
      fetchNYCData();
    }
  }, [building.address]);

  const fetchNYCData = async () => {
    setIsFetchingNYC(true);
    try {
      const data = await fetchFullBuildingReport(building.address, building.borough);
      setNycData(data);
      toast.success('NYC data loaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch NYC data');
    } finally {
      setIsFetchingNYC(false);
    }
  };

  const [reportLoading, setReportLoading] = useState(false);

  const handleReportPDF = async () => {
    setReportLoading(true);
    try {
      const { buildMasterReport, generateBrochureHTML, validateJackieReport } = await import('@/lib/camelot-report');
      toast.success('Generating Jackie report...');
      const data = await buildMasterReport(building.address, building.borough || undefined);

      // Merge property card contacts into the report (these are richer than HPD data)
      const cardContacts = building.contacts || [];
      if (cardContacts.length > 0) {
        const boardFromCard = cardContacts
          .filter((c: any) => ['board_president','board_treasurer','board_secretary','board_member','owner','landlord','developer','investor'].includes(c.role))
          .map((c: any) => ({ name: c.name || 'N/A', title: ROLE_LABELS[c.role as keyof typeof ROLE_LABELS] || c.role || 'Contact' }));
        const staffFromCard = cardContacts
          .filter((c: any) => ['resident_manager','super','front_desk','doorman','managing_agent'].includes(c.role))
          .map((c: any) => ({ role: ROLE_LABELS[c.role as keyof typeof ROLE_LABELS] || c.role || 'Staff', name: c.name || 'N/A' }));
        if (boardFromCard.length > 0) data.boardMembers = boardFromCard;
        if (staffFromCard.length > 0) data.buildingStaff = staffFromCard;

        // Extract professionals
        const lawyer = cardContacts.find((c: any) => c.role === 'attorney' || c.company?.toLowerCase().includes('law'));
        const accountant = cardContacts.find((c: any) => c.role === 'accountant' || c.company?.toLowerCase().includes('cpa') || c.company?.toLowerCase().includes('accounting'));
        const engineer = cardContacts.find((c: any) => c.role === 'engineer' || c.company?.toLowerCase().includes('engineer'));
        if (lawyer) data.professionals.lawFirm = lawyer.company || lawyer.name || null;
        if (accountant) data.professionals.accountingFirm = accountant.company || accountant.name || null;
        if (engineer) data.professionals.engineer = engineer.company || engineer.name || null;
      }

      // Also merge enriched data fields the property card has
      if (building.current_management) data.managementCompany = building.current_management;
      if (building.enriched_data?.dof?.owner) data.dofOwner = building.enriched_data.dof.owner;

      const html = generateBrochureHTML(data);
      const qa = validateJackieReport(data, html);
      if (qa.failures > 0) {
        const firstBlockers = qa.checks
          .filter((check) => check.status === 'fail')
          .slice(0, 3)
          .map((check) => `${check.name}: ${check.detail}`)
          .join('; ');
        toast.error(`Jackie internal review opened with ${qa.failures} blocker(s): ${firstBlockers}`, { duration: 9000 });
      } else if (qa.warnings > 0) {
        toast.success(`Jackie internal report opened with ${qa.warnings} review warning(s)`);
      } else {
        toast.success('Jackie report verified and opened');
      }
      const w = window.open('', '_blank');
      if (!w) { toast.error('Pop-up blocked — allow pop-ups for this site'); return; }
      w.document.write(html);
      w.document.close();
    } catch (err) {
      console.error('Jackie report generation failed:', err);
      toast.error('Report generation failed — check console');
    } finally {
      setReportLoading(false);
    }
  };

  const handleEnrich = async () => {
    const config = isEnrichmentConfigured();
    if (!config.apollo && !config.prospeo) {
      toast.error('Configure Apollo.io or Prospeo API keys in Settings');
      return;
    }
    setIsEnriching(true);
    try {
      const contacts = await enrichBuildingContacts({
        buildingName: building.name,
        address: building.address,
        currentManagement: building.current_management,
      });
      if (contacts.length > 0) {
        const merged = [...(building.contacts || []), ...contacts];
        onUpdate?.(building.id, { contacts: merged });
        toast.success(`Found ${contacts.length} contacts`);
      } else {
        toast.error('No new contacts found');
      }
    } catch (err) {
      toast.error('Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddToPipeline = () => {
    onUpdate?.(building.id, { pipeline_stage: 'discovered' as any, pipeline_moved_at: new Date().toISOString() });
    toast.success(`${building.name || building.address} added to Pipeline → Discovered`);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Introduction — Camelot Property Management | ${building.address}`);
    const body = encodeURIComponent(
      `Dear Board,\n\nMy name is David Goldoff, and I'm the principal of Camelot Realty Group, a boutique property management firm headquartered at 57 West 57th Street, Suite 410 in New York City.\n\nI'm reaching out because we specialize in managing ${building.type || 'residential'} buildings like ${building.address}, and I believe we could bring meaningful value to your ${building.units || ''}-unit property.\n\n` +
      (building.enriched_data?.violations?.open ? `I noticed that ${building.address} currently has ${building.enriched_data.violations.open} open HPD violations on record. Our compliance team has extensive experience resolving these efficiently.\n\n` : '') +
      `I'd welcome the opportunity to introduce Camelot to your board. Would you have 15 minutes for a brief call this week?\n\nWarm regards,\n\nDavid Goldoff\nPrincipal, Camelot Realty Group\n57 West 57th Street, Suite 410, New York, NY 10019\nvalerie@camelot.nyc\n212-206-9939 ext. 701 | 646-523-9068`
    );
    const contacts = building.contacts || [];
    const emailTo = contacts.find((c: any) => c.email)?.email || '';
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_self');
    toast.success('Email draft opened');
  };

  const saveNotes = () => {
    onUpdate?.(building.id, { notes });
    toast.success('Notes saved');
  };

  // Score breakdown
  const scoreBreakdown = calculateScore({
    violations_count: building.violations_count,
    open_violations_count: building.open_violations_count,
    units: building.units,
    current_management: building.current_management,
    year_built: building.year_built,
    energy_star_score: building.energy_star_score,
    site_eui: building.site_eui,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-camelot-navy text-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold">{building.name || building.address}</h2>
                <span className={cn('grade-badge text-xs border', gradeBg(building.grade))}>
                  {building.grade}
                </span>
                <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full">
                  Score: {building.score}/100
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1"><MapPin size={14} /> {building.address}</span>
                {building.borough && <span>{building.borough}</span>}
                {building.units && <span>{building.units} units</span>}
                <span className="capitalize">{building.type}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleReportPDF} disabled={reportLoading} className="flex items-center gap-1.5 text-xs bg-camelot-gold text-camelot-navy px-3 py-1.5 rounded-lg font-medium hover:bg-camelot-gold-light transition-colors disabled:opacity-50">
              {reportLoading ? <><Loader2 size={13} className="animate-spin" /> Generating...</> : <><Download size={13} /> Jackie Report</>}
            </button>
            <button onClick={handleSendEmail} className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <Mail size={13} /> Send Email
            </button>
            <button onClick={handleAddToPipeline} className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <GitBranch size={13} /> Add to Pipeline
            </button>
            <button
              onClick={handleEnrich}
              disabled={isEnriching}
              className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              {isEnriching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Enrich Contacts
            </button>
            <button
              onClick={fetchNYCData}
              disabled={isFetchingNYC}
              className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 ml-auto"
            >
              {isFetchingNYC ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Refresh NYC Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap',
                activeTab === key
                  ? 'border-camelot-gold text-camelot-gold font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 tab-content">
          {activeTab === 'overview' && (
            <div>
              {/* Google Maps Embed */}
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(building.address + (building.borough ? ', ' + building.borough + ', NY' : ', New York, NY'))}&output=embed&z=17`}
                  className="w-full h-[200px]"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${building.address}`}
                  allowFullScreen
                />
              </div>

              {/* Status Badges — Litigation, Rent Stabilization */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {nycData?.litigation?.hasActive && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold bg-red-100 text-red-700 px-4 py-2 rounded-xl border border-red-300 animate-pulse">
                    <Scale size={16} /> ⚖️ ACTIVE LITIGATION
                  </span>
                )}
                {nycData?.rentStabilization?.isStabilized && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-blue-100 text-blue-700 px-4 py-2 rounded-xl border border-blue-300">
                    <Bookmark size={16} /> 📋 Rent Stabilized
                  </span>
                )}
                {nycData?.ecb?.count > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-orange-100 text-orange-700 px-3 py-2 rounded-xl border border-orange-300">
                    <AlertTriangle size={14} /> {nycData.ecb.count} ECB Violation{nycData.ecb.count !== 1 ? 's' : ''}
                    {nycData.ecb.totalPenaltyBalance > 0 && ` ($${nycData.ecb.totalPenaltyBalance.toLocaleString()})`}
                  </span>
                )}
              </div>

              {/* External Records Links */}
              <ExternalRecordsSection building={building} nycData={nycData} />

            <div className="grid grid-cols-2 gap-6">
              {/* Building Info */}
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Building Details</h3>
                <div className="space-y-2">
                  {[
                    ['Address', building.address],
                    ['Borough', building.borough || '—'],
                    ['Neighborhood', building.region || '—'],
                    ['Units', building.units?.toString() || '—'],
                    ['Type', building.type],
                    ['Year Built', building.year_built?.toString() || '—'],
                    ['Stories', building.stories?.toString() || nycData?.dof?.stories?.toString() || '—'],
                    ['Lot Area', nycData?.dof?.lotArea ? `${formatNumber(nycData.dof.lotArea)} sq ft` : '—'],
                    ['Building Area', nycData?.dof?.buildingArea ? `${formatNumber(nycData.dof.buildingArea)} sq ft` : '—'],
                    ['Building Class', building.building_class || nycData?.dof?.buildingClass || '—'],
                    ['BBL', building.bbl || nycData?.dof?.bbl || '—'],
                    ['Management', building.current_management || nycData?.registration?.managementCompany || '—'],
                    ['DOF Owner', building.dof_owner || nycData?.dof?.owner || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Breakdown + Building Operations */}
              <div>
                {/* Building Operations Card */}
                <BuildingOperationsCard building={building} nycData={nycData} />

                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3 mt-6">Score Breakdown</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {scoreBreakdown.factors.map((f) => (
                    <div key={f.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{f.name}</span>
                        <span className="font-medium">{f.score}/{f.max}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-camelot-gold rounded-full transition-all"
                          style={{ width: `${(f.score / f.max) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{f.reason}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Score</span>
                      <span className="font-bold text-lg">{scoreBreakdown.total}/100</span>
                    </div>
                  </div>
                </div>

                {/* Signals */}
                {scoreBreakdown.signals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-gray-500 mb-2">Signals</h4>
                    <div className="space-y-1">
                      {scoreBreakdown.signals.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                          <Shield size={14} /> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pipeline Status */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-gray-500 mb-2">Pipeline</h4>
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">{building.pipeline_stage}</span>
                    <span className="text-xs text-gray-400">• {daysInStage(building.pipeline_moved_at)} days</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <ContactsTab
              building={building}
              isEnriching={isEnriching}
              onEnrich={handleEnrich}
              onUpdate={onUpdate}
              nycData={nycData}
            />
          )}

          {activeTab === 'violations' && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{nycData?.violations?.total || building.violations_count}</p>
                  <p className="text-xs text-red-500 mt-1">Total Violations</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{nycData?.violations?.open || building.open_violations_count}</p>
                  <p className="text-xs text-orange-500 mt-1">Open Violations</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-gray-600">{formatDate(nycData?.violations?.lastDate || building.last_violation_date)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last Violation</p>
                </div>
              </div>

              {isFetchingNYC ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                  <p className="text-sm">Loading violations from HPD...</p>
                </div>
              ) : nycData?.violations?.items?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Class</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Apt</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Description</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nycData.violations.items.slice(0, 30).map((v: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-xs">{formatDate(v.inspectiondate)}</td>
                          <td className="py-2">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              v.class === 'C' ? 'bg-red-100 text-red-700' :
                              v.class === 'B' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {v.class}
                            </span>
                          </td>
                          <td className="py-2 text-xs">{v.apartment || '—'}</td>
                          <td className="py-2 text-xs max-w-xs truncate">{v.novdescription || '—'}</td>
                          <td className="py-2 text-xs">{v.currentstatus || v.violationstatus || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-sm">
                  No violation data loaded. Click "Refresh NYC Data" to fetch.
                </p>
              )}

              {/* ECB/OATH Violations Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  ECB/OATH Violations
                  {nycData?.ecb?.count > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {nycData.ecb.count}
                    </span>
                  )}
                  {nycData?.ecb?.totalPenaltyBalance > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      ${nycData.ecb.totalPenaltyBalance.toLocaleString()} penalty
                    </span>
                  )}
                </h3>
                {isFetchingNYC ? (
                  <div className="text-center py-6 text-gray-400">
                    <Loader2 size={20} className="mx-auto animate-spin mb-2" />
                    <p className="text-sm">Loading ECB violations...</p>
                  </div>
                ) : nycData?.ecb?.violations?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-500 font-medium">Violation #</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                          <th className="text-right py-2 text-gray-500 font-medium">Penalty Due</th>
                          <th className="text-left py-2 text-gray-500 font-medium">Hearing Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nycData.ecb.violations.slice(0, 30).map((v: any, i: number) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 text-xs font-mono">{v.ecb_violation_number || '—'}</td>
                            <td className="py-2 text-xs">{v.violation_type || '—'}</td>
                            <td className="py-2">
                              <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded font-medium',
                                v.ecb_violation_status?.toLowerCase() === 'resolve' || v.ecb_violation_status?.toLowerCase() === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              )}>
                                {v.ecb_violation_status || '—'}
                              </span>
                            </td>
                            <td className="py-2 text-xs text-right font-medium">
                              {v.penalty_balance_due ? `$${Number(v.penalty_balance_due).toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2 text-xs">{v.hearing_date ? new Date(v.hearing_date).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-6 text-gray-400 text-sm">
                    No ECB/OATH violations found for this property.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div>
              <h3 className="font-semibold mb-4">DOF Property Assessment</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Market Value', formatCurrency(building.market_value || nycData?.dof?.marketValue)],
                  ['Assessed Value', formatCurrency(building.assessed_value || nycData?.dof?.assessedValue)],
                  ['Land Value', formatCurrency(building.land_value || nycData?.dof?.landValue)],
                  ['Tax Class', building.tax_class || nycData?.dof?.taxClass || '—'],
                  ['DOF Owner', building.dof_owner || nycData?.dof?.owner || '—'],
                  ['BBL', building.bbl || nycData?.dof?.bbl || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ownership' && (
            <OwnershipACRISTab building={building} nycData={nycData} isFetchingNYC={isFetchingNYC} />
          )}

          {activeTab === 'energy' && (
            <div>
              <h3 className="font-semibold mb-4">Energy & LL97 Benchmarking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Energy Star Score</p>
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'text-3xl font-bold',
                      (building.energy_star_score || 0) >= 75 ? 'text-green-600' :
                      (building.energy_star_score || 0) >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {building.energy_star_score || nycData?.energy?.energyStarScore || '—'}
                    </p>
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Site EUI (kBtu/ft²)</p>
                  <p className="text-3xl font-bold">{building.site_eui || nycData?.energy?.siteEUI || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">GHG Emissions (MT CO₂e)</p>
                  <p className="text-3xl font-bold">{building.ghg_emissions || nycData?.energy?.ghgEmissions || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Occupancy</p>
                  <p className="text-3xl font-bold">{building.occupancy_pct || nycData?.energy?.occupancy || '—'}</p>
                </div>
              </div>
              {(!building.energy_star_score && !nycData?.energy) && (
                <p className="text-center text-gray-400 text-sm mt-6">
                  No LL97 benchmarking data available for this building. Click "Refresh NYC Data" to check.
                </p>
              )}
            </div>
          )}

          {activeTab === 'permits' && (
            <div>
              <h3 className="font-semibold mb-4">DOB Permits ({nycData?.permits?.count || 0})</h3>
              {isFetchingNYC ? (
                <div className="text-center py-8 text-gray-400">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2" />
                  <p className="text-sm">Loading permits...</p>
                </div>
              ) : nycData?.permits?.items?.length > 0 ? (
                <div className="space-y-2">
                  {nycData.permits.items.map((p: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{p.job_type || 'Permit'} — {p.permit_type || 'General'}</p>
                          <p className="text-xs text-gray-500 mt-0.5 max-w-lg">{p.job_description || 'No description'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(p.filing_date)}</p>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full mt-1 inline-block',
                            p.job_status === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {p.job_status_descrp || p.permit_status || p.job_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-sm">No permit data loaded.</p>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                {/* Show pipeline stage info as an activity */}
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-camelot-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <GitBranch size={14} className="text-camelot-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Pipeline: {building.pipeline_stage}</p>
                    <p className="text-xs text-gray-500">In stage for {daysInStage(building.pipeline_moved_at)} days</p>
                    <p className="text-xs text-gray-400">Moved {formatDate(building.pipeline_moved_at)}</p>
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Building discovered</p>
                    <p className="text-xs text-gray-500">Source: {building.source || 'NYC Open Data'}</p>
                    <p className="text-xs text-gray-400">{formatDate(building.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h3 className="font-semibold mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                placeholder="Add notes about this property..."
              />
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {building.assigned_to && <span>Assigned to: {building.assigned_to}</span>}
                </div>
                <button
                  onClick={saveNotes}
                  className="bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark transition-colors"
                >
                  Save Notes
                </button>
              </div>
              {building.tags?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {building.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-camelot-gold/10 text-camelot-gold px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// ContactsTab — grouped by category
// ========================================

function ContactsTab({
  building,
  isEnriching,
  onEnrich,
  onUpdate,
  nycData,
}: {
  building: Building;
  isEnriching: boolean;
  onEnrich: () => void;
  onUpdate?: (id: string, data: Partial<Building>) => void;
  nycData: any;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const contacts = building.contacts || [];

  // Compute building ops to potentially auto-add front desk placeholder
  const buildingClass = building.building_class || nycData?.dof?.buildingClass || '';
  const units = building.units || nycData?.dof?.units || 0;
  const ops = detectBuildingOperations(buildingClass, units);

  // Check if there's already a front desk contact
  const hasFrontDeskContact = contacts.some(
    (c) => c.role === 'front_desk' || c.role.toLowerCase().includes('front desk')
  );

  // Build effective contacts list (add front desk placeholder if needed)
  const effectiveContacts = [...contacts];
  if (ops.hasFrontDesk && !hasFrontDeskContact) {
    effectiveContacts.push({
      name: 'Building Front Desk',
      role: 'front_desk',
      phone: undefined, // Will show "Call building front desk"
      notes: 'Call building front desk',
    });
  }

  const grouped = groupContacts(effectiveContacts);

  const handleAddContact = (contact: Contact) => {
    const updatedContacts = [...contacts, contact];
    onUpdate?.(building.id, { contacts: updatedContacts });
    setShowAddForm(false);
    toast.success(`Added ${contact.name}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Contacts ({contacts.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-sm bg-camelot-gold/10 text-camelot-gold px-3 py-1.5 rounded-lg hover:bg-camelot-gold/20 transition-colors"
          >
            <Plus size={14} /> Add Contact
          </button>
          <button
            onClick={onEnrich}
            disabled={isEnriching}
            className="flex items-center gap-1.5 text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {isEnriching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Enrich with Apollo/Prospeo
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddContactForm onAdd={handleAddContact} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {effectiveContacts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No contacts found yet</p>
          <p className="text-sm mt-1">Use "Add Contact" or "Enrich" to find board members, owners, and managers</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map((category) => {
            const catContacts = grouped[category];
            if (catContacts.length === 0) return null;
            const colors = CAT_COLORS[category];

            return (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', colors.bg.replace('bg-', 'bg-').replace('-50', '-500'))} />
                  {category} ({catContacts.length})
                </h4>
                <div className="space-y-2">
                  {catContacts.map((contact, i) => {
                    const social = getSocialLinks(contact, building.address);
                    const roleBadgeColors = colors;

                    return (
                      <div key={`${category}-${i}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-camelot-gold/20 rounded-full flex items-center justify-center text-camelot-gold font-bold text-sm">
                            {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <span className={cn(
                              'inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium mt-0.5',
                              roleBadgeColors.bg, roleBadgeColors.text, roleBadgeColors.border,
                            )}>
                              {resolveRoleLabel(contact.role)}
                            </span>
                            {contact.company && (
                              <p className="text-[10px] text-gray-400 mt-0.5">{contact.company}</p>
                            )}
                            {contact.notes && (
                              <p className="text-[10px] text-gray-400 italic mt-0.5">{contact.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <Phone size={12} /> {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Mail size={12} /> {contact.email}
                            </a>
                          )}
                          {/* Social media icons */}
                          <a
                            href={social.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                            title="LinkedIn"
                          >
                            <LinkedInIcon className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={social.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Facebook"
                          >
                            <FacebookIcon className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={social.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                            title="Instagram"
                          >
                            <InstagramIcon className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NY DOS Corporate Filings for Management Company */}
      <NYDOSSection managementCompany={building.current_management || nycData?.registration?.managementCompany} />
    </div>
  );
}

// ========================================
// OwnershipACRISTab — ACRIS deed & mortgage records
// ========================================

function OwnershipACRISTab({
  building,
  nycData,
  isFetchingNYC,
}: {
  building: Building;
  nycData: any;
  isFetchingNYC: boolean;
}) {
  const acris = nycData?.acris;
  const dof = nycData?.dof;
  const buildingClass = building.building_class || dof?.buildingClass || '';
  const isCondo = buildingClass.startsWith('R');
  const isCoop = buildingClass.startsWith('D');

  return (
    <div>
      {/* Current Owner */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Current Owner</h3>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-camelot-gold/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-camelot-gold" />
            </div>
            <div>
              <p className="font-medium">
                {building.dof_owner || dof?.owner || nycData?.registration?.owner || '—'}
              </p>
              <p className="text-xs text-gray-500">
                DOF Record • BBL: {building.bbl || dof?.bbl || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Condo / Co-op notes */}
      {isCondo && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            🏢 <strong>Condo Building</strong> — Individual unit ownership records available.
            Search by unit BBL in ACRIS for unit-level deed transfers.
          </p>
        </div>
      )}
      {isCoop && (
        <div className="mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-sm text-purple-700">
            🏠 <strong>Co-op Building</strong> — Co-op shares are transferred via proprietary lease
            (not recorded in ACRIS per unit). Records below are for the entire building entity.
          </p>
        </div>
      )}

      {isFetchingNYC ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={24} className="mx-auto animate-spin mb-2" />
          <p className="text-sm">Loading ACRIS records...</p>
        </div>
      ) : !acris || acris.records.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Landmark size={48} className="mx-auto mb-3 opacity-50" />
          <p className="font-medium">No ACRIS records found</p>
          <p className="text-sm mt-1">
            Click "Refresh NYC Data" to fetch, or the property may not have recent deed activity.
          </p>
          {(building.bbl || dof?.bbl) && (
            <a
              href={buildACRISUrl(building.bbl || dof?.bbl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-camelot-gold hover:underline mt-3"
            >
              <ExternalLink size={14} /> Search ACRIS directly
            </a>
          )}
        </div>
      ) : (
        <>
          {/* Last Sale Summary */}
          {acris.lastSaleDate && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-green-700">
                  {acris.lastSalePrice ? `$${Number(acris.lastSalePrice).toLocaleString()}` : '—'}
                </p>
                <p className="text-xs text-green-600 mt-1">Last Sale Price</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-blue-700">
                  {acris.lastSaleDate ? new Date(acris.lastSaleDate).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-blue-600 mt-1">Last Sale Date</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-gray-700 truncate">
                  {acris.lastSaleBuyer || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last Buyer</p>
              </div>
            </div>
          )}

          {/* Transfer History (Deeds) */}
          {acris.deeds.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Transfer History
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{acris.deeds.length}</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Buyer</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Seller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acris.deeds.map((r: any, i: number) => {
                      const buyer = r.parties?.find((p: any) => p.type === 'buyer');
                      const seller = r.parties?.find((p: any) => p.type === 'seller');
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                          <td className="py-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                              {r.documentTypeLabel || r.documentType}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-right font-medium">
                            {r.amount ? `$${Number(r.amount).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 text-xs max-w-[160px] truncate">{buyer?.name || '—'}</td>
                          <td className="py-2 text-xs max-w-[160px] truncate">{seller?.name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mortgage Records */}
          {acris.mortgages.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Mortgage Records
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{acris.mortgages.length}</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Lender / Party</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acris.mortgages.map((r: any, i: number) => {
                      const lender = r.parties?.find((p: any) => p.type === 'buyer') || r.parties?.[0];
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                          <td className="py-2">
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              r.documentType === 'SAT' ? 'bg-gray-100 text-gray-600' :
                              r.documentType === 'ASST' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {r.documentTypeLabel || r.documentType}
                            </span>
                          </td>
                          <td className="py-2 text-xs text-right font-medium">
                            {r.amount ? `$${Number(r.amount).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 text-xs max-w-[200px] truncate">{lender?.name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Link to full ACRIS */}
          <div className="mt-4 text-center">
            <a
              href={acris.acrisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-camelot-gold hover:underline font-medium"
            >
              <ExternalLink size={14} /> View full ACRIS record on NYC.gov
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Build ACRIS URL from a BBL string
 */
function buildACRISUrl(bbl?: string): string {
  if (!bbl) return 'https://a836-acris.nyc.gov/DS/DocumentSearch/Index';
  const clean = bbl.replace(/\D/g, '');
  if (clean.length < 10) return 'https://a836-acris.nyc.gov/DS/DocumentSearch/Index';
  const borough = clean.substring(0, 1);
  const block = clean.substring(1, 6);
  const lot = clean.substring(6, 10);
  return `https://a836-acris.nyc.gov/DS/DocumentSearch/BBLResult?Borough=${borough}&Block=${block}&Lot=${lot}`;
}

// ========================================
// BuildingOperationsCard — overview tab
// ========================================

function BuildingOperationsCard({
  building,
  nycData,
}: {
  building: Building;
  nycData: any;
}) {
  const buildingClass = building.building_class || nycData?.dof?.buildingClass || '';
  const units = building.units || nycData?.dof?.units || 0;
  const ops = detectBuildingOperations(buildingClass, units);

  // Don't render if we have no building class data at all
  if (!buildingClass && !units) return null;

  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">Building Operations</h3>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        {/* Building Class */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-sm text-gray-500">Building Class</span>
          <span className="text-sm font-medium">{buildingClass ? `${buildingClass} — ${ops.buildingClassDescription}` : '—'}</span>
        </div>

        {/* Union Status */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-sm text-gray-500">Union Status</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            ops.unionStatus === 'likely_union'
              ? 'bg-blue-100 text-blue-700'
              : ops.unionStatus === 'likely_non_union'
              ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-100 text-gray-400',
          )}>
            {ops.unionLabel}
          </span>
        </div>

        {/* Doorman */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-sm text-gray-500">Doorman</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            ops.hasDoorman ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
          )}>
            {getDoormanLabel(ops)}
          </span>
        </div>

        {/* Front Desk */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-sm text-gray-500">Front Desk</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            ops.hasFrontDesk ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
          )}>
            {getFrontDeskLabel(ops)}
          </span>
        </div>

        {/* Elevator */}
        <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
          <span className="text-sm text-gray-500">Elevator</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            ops.hasElevator ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
          )}>
            {ops.hasElevator ? '🛗 Yes' : 'No'}
          </span>
        </div>

        {/* Rent Stabilization */}
        <div className="flex justify-between items-center py-1.5">
          <span className="text-sm text-gray-500">Rent Stabilization</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            nycData?.rentStabilization?.isStabilized ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
          )}>
            {nycData?.rentStabilization?.isStabilized ? '📋 Rent Stabilized' : 'Not Stabilized'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// ExternalRecordsSection — deep links to FL/NJ/CT portals + NY DOS
// ========================================

function ExternalRecordsSection({
  building,
  nycData,
}: {
  building: Building;
  nycData: any;
}) {
  const ownerName = building.dof_owner || nycData?.dof?.owner || building.current_management || '';
  const links = generateExternalLinks({
    ownerName,
    address: building.address,
    state: building.region?.includes('Florida') || building.region?.includes('Miami') ? 'FL' :
           building.region?.includes('Jersey') ? 'NJ' :
           building.region?.includes('Connecticut') ? 'CT' : 'NY',
    region: building.region || building.borough || '',
  });

  // Always show NY DOS link for NYC properties
  const hasNYC = building.borough || building.bbl;
  const allLinks = hasNYC ? [
    {
      label: 'NY DOS',
      url: `https://appext20.dos.ny.gov/corp_public/CORPSEARCH.ENTITY_SEARCH_ENTRY`,
      icon: '🏛️',
      state: 'NY',
    },
    {
      label: 'ACRIS',
      url: building.bbl ? buildACRISUrl(building.bbl) : 'https://a836-acris.nyc.gov/DS/DocumentSearch/Index',
      icon: '📜',
      state: 'NY',
    },
    ...links.filter(l => l.label !== 'NY DOS'),
  ] : links;

  if (allLinks.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Link size={14} className="text-camelot-gold" />
        External Records
      </h3>
      <div className="flex flex-wrap gap-2">
        {allLinks.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors"
          >
            <span>{link.icon}</span>
            <span className="font-medium">🔗 {link.label}</span>
            <ExternalLink size={12} className="text-gray-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ========================================
// NYDOSSection — Corporate filings for Contacts tab
// ========================================

function NYDOSSection({ managementCompany }: { managementCompany?: string }) {
  const [dosResults, setDosResults] = useState<NYDOSCorporation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!managementCompany) return;
    setIsSearching(true);
    try {
      const results = await searchNYDOSCorporation(managementCompany);
      setDosResults(results);
      setSearched(true);
    } catch {
      toast.error('NY DOS search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search on mount if management company is known
  useEffect(() => {
    if (managementCompany && managementCompany !== 'Unknown' && !searched) {
      handleSearch();
    }
  }, [managementCompany]);

  if (!managementCompany || managementCompany === 'Unknown') return null;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          🏛️ NY Secretary of State — Corporate Filings
        </h4>
        {!searched && (
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="text-xs text-camelot-gold hover:underline flex items-center gap-1"
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : null}
            Search "{managementCompany}"
          </button>
        )}
      </div>

      {isSearching && (
        <div className="text-center py-4 text-gray-400">
          <Loader2 size={16} className="mx-auto animate-spin mb-1" />
          <p className="text-xs">Searching NY DOS...</p>
        </div>
      )}

      {searched && dosResults.length === 0 && !isSearching && (
        <p className="text-xs text-gray-400">No corporate filings found for "{managementCompany}"</p>
      )}

      {dosResults.length > 0 && (
        <div className="space-y-2">
          {dosResults.slice(0, 5).map((corp, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm font-medium">{corp.current_entity_name}</p>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {corp.dos_id && <p>DOS ID: {corp.dos_id}</p>}
                {corp.dos_process_name && (
                  <p className="font-medium text-gray-700">
                    Process Agent: {corp.dos_process_name}
                  </p>
                )}
                {corp.dos_process_address_1 && (
                  <p>{corp.dos_process_address_1}{corp.dos_process_address_2 ? `, ${corp.dos_process_address_2}` : ''}</p>
                )}
                {corp.entity_formation_date && (
                  <p>Formed: {new Date(corp.entity_formation_date).toLocaleDateString()}</p>
                )}
                {corp.county && <p>County: {corp.county}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
