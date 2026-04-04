/**
 * Proposals — Generate, preview, manage, and send property management proposals.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  generateProposalData,
  calculatePricing,
  DEFAULT_SECTIONS,
  CAMELOT_INFO,
  type ProposalData,
  type ProposalSection,
  type ProposalOptions,
} from '@/lib/proposal-generator';
import ProposalPDF from '@/components/ProposalPDF';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';
import type { Building } from '@/types';
import {
  FileText,
  Download,
  Send,
  Eye,
  Plus,
  Search,
  Building2,
  DollarSign,
  Calendar,
  User,
  Mail,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  X,
  Trash2,
  RefreshCw,
  Settings2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================
// Types
// ============================================================

interface SavedProposal {
  id: string;
  building_id: string;
  building_address: string;
  contact_name?: string;
  contact_email?: string;
  pricing_per_unit: number;
  total_monthly: number;
  total_annual: number;
  sections: Record<string, any>;
  status: string;
  sent_at?: string;
  viewed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Component
// ============================================================

export default function Proposals() {
  const { buildings, loadBuildings, isLoading: buildingsLoading } = useBuildings();

  // State
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBuildingPicker, setShowBuildingPicker] = useState(false);

  // Options
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [rentStabilized, setRentStabilized] = useState(false);
  const [ll97Services, setLl97Services] = useState(false);
  const [customPricing, setCustomPricing] = useState('');
  const [sections, setSections] = useState<ProposalSection[]>(DEFAULT_SECTIONS.map((s) => ({ ...s })));
  const [showOptions, setShowOptions] = useState(false);

  // Generated proposal
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Saved proposals
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Load buildings on mount
  useEffect(() => {
    loadBuildings();
    loadSavedProposals();
  }, []);

  // Filtered buildings for picker
  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) return buildings.filter((b) => b.status === 'active');
    const q = searchQuery.toLowerCase();
    return buildings
      .filter((b) => b.status === 'active')
      .filter(
        (b) =>
          b.address.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.borough?.toLowerCase().includes(q) ||
          b.region?.toLowerCase().includes(q)
      );
  }, [buildings, searchQuery]);

  // Auto-fill contact when building changes
  useEffect(() => {
    if (selectedBuilding) {
      const contact = selectedBuilding.contacts?.find((c) => c.email) ?? selectedBuilding.contacts?.[0];
      if (contact) {
        setContactName(contact.name || '');
        setContactEmail(contact.email || '');
      } else {
        setContactName('');
        setContactEmail('');
      }
      // Infer options
      setRentStabilized(selectedBuilding.type === 'rental' && (selectedBuilding.units || 0) >= 6);
      setLl97Services(
        selectedBuilding.energy_star_score != null && selectedBuilding.energy_star_score < 50
      );
    }
  }, [selectedBuilding]);

  // Pricing preview
  const pricingPreview = useMemo(() => {
    if (!selectedBuilding) return null;
    const units = selectedBuilding.units || 1;
    const customRate = customPricing ? parseFloat(customPricing) : undefined;
    if (customRate && !isNaN(customRate)) {
      const rs = rentStabilized ? 5 : 0;
      const ll = ll97Services ? 3 : 0;
      const total = customRate + rs + ll;
      return { perUnit: total, monthly: total * units, annual: total * units * 12 };
    }
    const p = calculatePricing(units, { rentStabilized, ll97Services });
    return { perUnit: p.totalPerUnit, monthly: p.totalMonthly, annual: p.totalAnnual };
  }, [selectedBuilding, rentStabilized, ll97Services, customPricing]);

  // Load saved proposals from Supabase
  const loadSavedProposals = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setLoadingProposals(true);
    try {
      const { data, error } = await supabase
        .from('scout_proposals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setSavedProposals(data || []);
    } catch (err: any) {
      console.error('Failed to load proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  // Generate proposal
  const handleGenerate = useCallback(async () => {
    if (!selectedBuilding) return;
    setIsGenerating(true);
    setPreviewUrl(null);

    try {
      const options: ProposalOptions = {
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        rentStabilized,
        ll97Services,
        sections,
        customPricingPerUnit: customPricing ? parseFloat(customPricing) : undefined,
      };

      const data = generateProposalData(selectedBuilding, options);
      setProposalData(data);

      // Save to Supabase
      if (isSupabaseConfigured()) {
        await supabase.from('scout_proposals').insert({
          building_id: selectedBuilding.id,
          building_address: selectedBuilding.address,
          contact_name: data.contactName,
          contact_email: data.contactEmail,
          pricing_per_unit: data.pricing.totalPerUnit,
          total_monthly: data.pricing.totalMonthly,
          total_annual: data.pricing.totalAnnual,
          sections: Object.fromEntries(sections.map((s) => [s.id, s.enabled])),
          status: 'draft',
        });
        loadSavedProposals();
      }

      toast.success('Proposal generated!');
    } catch (err: any) {
      console.error('Failed to generate proposal:', err);
      toast.error('Failed to generate proposal');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedBuilding, contactName, contactEmail, rentStabilized, ll97Services, sections, customPricing]);

  // Preview PDF inline
  const handlePreview = useCallback(async () => {
    if (!proposalData) return;
    setIsPreviewing(true);
    try {
      const blob = await pdf(<ProposalPDF data={proposalData} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      console.error('Failed to preview:', err);
      toast.error('Failed to generate preview');
    } finally {
      setIsPreviewing(false);
    }
  }, [proposalData]);

  // Download PDF
  const handleDownload = useCallback(async () => {
    if (!proposalData) return;
    try {
      const blob = await pdf(<ProposalPDF data={proposalData} />).toBlob();
      const filename = `Camelot-Proposal-${proposalData.buildingAddress.replace(/[^a-zA-Z0-9]/g, '-')}-${proposalData.proposalNumber}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (err: any) {
      console.error('Download failed:', err);
      toast.error('Download failed');
    }
  }, [proposalData]);

  // Send (mailto)
  const handleSend = useCallback(() => {
    if (!proposalData) return;
    const to = proposalData.contactEmail || '';
    const subject = encodeURIComponent(
      `Property Management Proposal — ${proposalData.buildingName || proposalData.buildingAddress}`
    );
    const body = encodeURIComponent(
      `Dear ${proposalData.contactName || 'Board'},\n\nPlease find attached our property management proposal for ${proposalData.buildingName || proposalData.buildingAddress}.\n\nWe would love to schedule a meeting to discuss how Camelot can serve your building.\n\nBest regards,\nCamelot Property Management\n${CAMELOT_INFO.phone}\n${CAMELOT_INFO.website}`
    );
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
    toast.success('Email client opened — attach the downloaded PDF');
  }, [proposalData]);

  // Delete saved proposal
  const handleDeleteProposal = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured()) return;
      try {
        await supabase.from('scout_proposals').delete().eq('id', id);
        setSavedProposals((prev) => prev.filter((p) => p.id !== id));
        toast.success('Proposal deleted');
      } catch (err: any) {
        toast.error('Failed to delete');
      }
    },
    []
  );

  // Toggle section
  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Select building from picker
  const selectBuilding = (b: Building) => {
    setSelectedBuilding(b);
    setShowBuildingPicker(false);
    setSearchQuery('');
    setProposalData(null);
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-camelot-dark">
      {/* Header */}
      <div className="bg-camelot-navy border-b border-camelot-navy-lighter px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText size={24} className="text-camelot-gold" /> Proposals
            </h1>
            <p className="text-sm text-gray-400">Generate professional management proposals</p>
          </div>
          {savedProposals.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FileText size={14} />
              {savedProposals.length} proposal{savedProposals.length !== 1 ? 's' : ''} generated
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 flex gap-6">
        {/* Left Column — Generator */}
        <div className="flex-1 space-y-4">
          {/* Building Picker */}
          <div className="bg-camelot-navy rounded-lg border border-camelot-navy-lighter p-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
              Select Building
            </label>
            <div className="relative">
              <button
                onClick={() => setShowBuildingPicker(!showBuildingPicker)}
                className="w-full flex items-center justify-between bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg px-4 py-3 text-left hover:border-camelot-gold/40 transition-colors"
              >
                {selectedBuilding ? (
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-camelot-gold" />
                    <div>
                      <p className="text-white font-medium">{selectedBuilding.address}</p>
                      <p className="text-xs text-gray-400">
                        {selectedBuilding.units} units • {selectedBuilding.type} •{' '}
                        {selectedBuilding.borough}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Choose a building…</span>
                )}
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showBuildingPicker && (
                <div className="absolute z-50 mt-1 w-full bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg shadow-xl max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-camelot-navy-lighter">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search buildings…"
                        className="w-full bg-camelot-navy border border-camelot-navy-lighter rounded px-8 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-camelot-gold/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {buildingsLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                      </div>
                    ) : filteredBuildings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">No buildings found</div>
                    ) : (
                      filteredBuildings.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => selectBuilding(b)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-camelot-navy-lighter transition-colors',
                            selectedBuilding?.id === b.id && 'bg-camelot-navy-lighter'
                          )}
                        >
                          <Building2 size={16} className="text-gray-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{b.address}</p>
                            <p className="text-xs text-gray-500">
                              {b.units || '?'} units • {b.type} • Score {b.score}
                              {b.open_violations_count ? ` • ${b.open_violations_count} open violations` : ''}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Options */}
          {selectedBuilding && (
            <div className="bg-camelot-navy rounded-lg border border-camelot-navy-lighter p-4 space-y-4">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                    Contact Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Board President"
                      className="w-full bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-camelot-gold/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                    Contact Email
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-camelot-gold/50"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rentStabilized}
                    onChange={(e) => setRentStabilized(e.target.checked)}
                    className="rounded border-gray-600 text-camelot-gold focus:ring-camelot-gold bg-camelot-navy-light"
                  />
                  <span className="text-sm text-gray-300">Rent Stabilized (+$5/unit)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ll97Services}
                    onChange={(e) => setLl97Services(e.target.checked)}
                    className="rounded border-gray-600 text-camelot-gold focus:ring-camelot-gold bg-camelot-navy-light"
                  />
                  <span className="text-sm text-gray-300">LL97 Compliance (+$3/unit)</span>
                </label>
              </div>

              {/* Custom Pricing */}
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                  Custom Base Rate (optional)
                </label>
                <div className="relative w-48">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    value={customPricing}
                    onChange={(e) => setCustomPricing(e.target.value)}
                    placeholder="Auto"
                    className="w-full bg-camelot-navy-light border border-camelot-navy-lighter rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-camelot-gold/50"
                  />
                </div>
              </div>

              {/* Pricing Preview */}
              {pricingPreview && (
                <div className="bg-camelot-navy-light rounded-lg border border-camelot-gold/20 p-3">
                  <p className="text-xs text-camelot-gold font-medium mb-2 uppercase tracking-wider">
                    Pricing Preview
                  </p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-400">Per Unit/Mo</p>
                      <p className="text-lg font-bold text-white">${pricingPreview.perUnit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly</p>
                      <p className="text-lg font-bold text-white">
                        ${pricingPreview.monthly.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Annual</p>
                      <p className="text-lg font-bold text-camelot-gold">
                        ${pricingPreview.annual.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section toggles */}
              <div>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-camelot-gold transition-colors"
                >
                  <Settings2 size={14} />
                  Customize Sections
                  {showOptions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {showOptions && (
                  <div className="mt-2 space-y-1">
                    {sections.map((sec) => (
                      <label
                        key={sec.id}
                        className="flex items-center gap-2 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={sec.enabled}
                          onChange={() => toggleSection(sec.id)}
                          className="rounded border-gray-600 text-camelot-gold focus:ring-camelot-gold bg-camelot-navy-light"
                        />
                        <span className="text-sm text-gray-300">{sec.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-camelot-gold text-camelot-navy font-semibold px-5 py-2.5 rounded-lg hover:bg-camelot-gold-light transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Generate Proposal
                </button>

                {proposalData && (
                  <>
                    <button
                      onClick={handlePreview}
                      disabled={isPreviewing}
                      className="flex items-center gap-2 bg-camelot-navy-light border border-camelot-navy-lighter text-white px-4 py-2.5 rounded-lg hover:border-camelot-gold/40 transition-colors disabled:opacity-50"
                    >
                      {isPreviewing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}
                      Preview
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-camelot-navy-light border border-camelot-navy-lighter text-white px-4 py-2.5 rounded-lg hover:border-camelot-gold/40 transition-colors"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                    <button
                      onClick={handleSend}
                      className="flex items-center gap-2 bg-camelot-navy-light border border-camelot-navy-lighter text-white px-4 py-2.5 rounded-lg hover:border-camelot-gold/40 transition-colors"
                    >
                      <Send size={16} />
                      Send
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PDF Preview */}
          {previewUrl && (
            <div className="bg-camelot-navy rounded-lg border border-camelot-navy-lighter overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-camelot-navy-lighter">
                <p className="text-sm font-medium text-white">Proposal Preview</p>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <iframe
                src={previewUrl}
                className="w-full bg-white"
                style={{ height: '80vh' }}
                title="Proposal Preview"
              />
            </div>
          )}

          {/* Empty state */}
          {!selectedBuilding && (
            <div className="bg-camelot-navy rounded-lg border border-camelot-navy-lighter p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Create a Property Management Proposal
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Select a building above to generate a professional PDF proposal with pricing,
                building analysis, and Camelot's competitive advantages.
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Saved Proposals */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-camelot-navy rounded-lg border border-camelot-navy-lighter">
            <div className="flex items-center justify-between px-4 py-3 border-b border-camelot-navy-lighter">
              <h2 className="text-sm font-medium text-white">Recent Proposals</h2>
              <button
                onClick={loadSavedProposals}
                className="text-gray-400 hover:text-camelot-gold transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
              {loadingProposals ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading…
                </div>
              ) : savedProposals.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <FileText size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">No proposals yet</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {isSupabaseConfigured()
                      ? 'Generated proposals will appear here'
                      : 'Connect Supabase to save proposals'}
                  </p>
                </div>
              ) : (
                savedProposals.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 py-3 border-b border-camelot-navy-lighter hover:bg-camelot-navy-light transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white font-medium truncate">
                          {p.building_address}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-xs font-medium',
                              p.status === 'draft'
                                ? 'bg-gray-500/20 text-gray-400'
                                : p.status === 'sent'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-green-500/20 text-green-400'
                            )}
                          >
                            {p.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            ${p.total_monthly?.toLocaleString()}/mo
                          </span>
                        </div>
                        {p.contact_name && (
                          <p className="text-xs text-gray-500 mt-1">To: {p.contact_name}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-0.5">{formatDate(p.created_at)}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteProposal(p.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all ml-2"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
