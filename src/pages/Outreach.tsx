import { useState, useMemo } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { renderOutreachEmail, getAvailableVariables } from '@/lib/email-templates';
import type { OutreachTemplate, Building, Contact } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Mail, FileText, Clock, Plus, Send, Eye, Edit, Copy,
  Building2, User, Sparkles, ChevronDown, Search, Loader2, Phone, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATES: OutreachTemplate[] = [
  {
    id: '1', name: "Cold Outreach — David's Template", subject: 'Property Management Services for {building_name}',
    body: `Dear {contact_name},

My name is David Goldoff, and I'm the principal of Camelot Realty Group. I'm reaching out because I noticed {building_name} at {address} — a {unit_count}-unit {building_type} in {borough} — and I believe we can provide exceptional management services for your property.

With {violations_count} open HPD violations on record, I understand the challenges of maintaining a well-run building in New York City. At Camelot, we take a hands-on approach:

• Personal Attention: I personally oversee every property in our portfolio
• Weekly Inspections: On-site walkthroughs to catch issues before they become violations
• Technology-Forward: We use ConciergePlus for seamless resident communication
• Transparent Financials: Real-time budget tracking with monthly board reporting
• Compliance & Reporting: Proactive violation resolution and regulatory compliance
• Local Resources: 20+ years of vendor relationships across the tri-state area
• Zero Bank Fees: We never charge bank fees — your money works for your building

I'd love to schedule a 15-minute call to discuss how Camelot can serve {building_name}. Would this week work for you?

Best regards,
David Goldoff
Principal, Camelot Realty Group
477 Madison Avenue, 6th Fl
New York, NY 10022`,
    category: 'cold', variables: ['building_name', 'address', 'unit_count', 'building_type', 'borough', 'violations_count', 'contact_name'], is_default: true, created_at: '', updated_at: '',
  },
  {
    id: '2', name: '30-Day Complimentary Service', subject: 'Complimentary Property Evaluation — {building_name}',
    body: `Dear {contact_name},

Following up on my earlier note about {building_name} at {address} — I'd like to offer something unusual:

A complimentary 30-day property evaluation at no cost and no obligation.

During this period, our team will:
• Conduct a full building inspection
• Review your current vendor contracts for savings opportunities
• Audit your HPD violation status and create a resolution plan
• Provide a detailed capital improvement recommendation
• Deliver a comprehensive management proposal

We're confident that once you see the Camelot difference, the decision will be easy. But there's absolutely no pressure — this is our way of demonstrating value upfront.

Shall I schedule a walkthrough this week?

Best regards,
David Goldoff
Camelot Realty Group`,
    category: 'complimentary', variables: ['building_name', 'address', 'contact_name'], is_default: false, created_at: '', updated_at: '',
  },
  {
    id: '3', name: 'Follow-Up Nurture', subject: 'Following Up — {building_name} Management',
    body: `Hi {contact_name},

I wanted to follow up on my previous message regarding management services for {building_name}.

I understand these decisions take time, and I respect that. If it would be helpful, I'm happy to:
• Share references from similar buildings we manage
• Provide a no-obligation property assessment
• Simply answer any questions you might have

Our door is always open. When the timing is right, we'd love to earn your business.

Warm regards,
David Goldoff
Camelot Realty Group`,
    category: 'nurture', variables: ['building_name', 'contact_name'], is_default: false, created_at: '', updated_at: '',
  },
];

type Tab = 'templates' | 'compose' | 'activity';

// Demo outreach log with various statuses for Activity tab + Hot Leads
const DEMO_OUTREACH_LOG = [
  {
    id: 'ol-1', building_id: '3', building_name: 'Lincoln Towers', contact_name: 'Susan Katz',
    contact_email: 'skatz@gmail.com', contact_phone: '(212) 555-0301', contact_role: 'Board President',
    subject: 'Property Management Services for Lincoln Towers', status: 'opened' as const,
    sent_at: '2026-04-02T10:30:00Z', opened_at: '2026-04-02T14:15:00Z', template_name: "Cold Outreach — David's Template",
  },
  {
    id: 'ol-2', building_id: '6', building_name: 'The Trafalgar', contact_name: 'Helen Ng',
    contact_email: 'hng@gmail.com', contact_phone: '(212) 555-0601', contact_role: 'Board President',
    subject: 'Property Management Services for The Trafalgar', status: 'opened' as const,
    sent_at: '2026-04-01T09:00:00Z', opened_at: '2026-04-03T11:22:00Z', template_name: "Cold Outreach — David's Template",
  },
  {
    id: 'ol-3', building_id: '4', building_name: 'Worldwide Plaza', contact_name: 'James Wilson',
    contact_email: 'jwilson@finance.com', contact_phone: undefined, contact_role: 'Board President',
    subject: 'Complimentary Property Evaluation — Worldwide Plaza', status: 'delivered' as const,
    sent_at: '2026-04-03T08:45:00Z', opened_at: undefined, template_name: '30-Day Complimentary Service',
  },
  {
    id: 'ol-4', building_id: '1', building_name: 'The Bromley', contact_name: 'Margaret Chen',
    contact_email: 'mchen@gmail.com', contact_phone: '(212) 555-0101', contact_role: 'Board President',
    subject: 'Property Management Services for The Bromley', status: 'sent' as const,
    sent_at: '2026-04-03T14:00:00Z', opened_at: undefined, template_name: "Cold Outreach — David's Template",
  },
  {
    id: 'ol-5', building_id: '2', building_name: 'The Horizon', contact_name: 'David Park',
    contact_email: 'dpark@yahoo.com', contact_phone: undefined, contact_role: 'Board President',
    subject: 'Following Up — The Horizon Management', status: 'opened' as const,
    sent_at: '2026-03-30T11:00:00Z', opened_at: '2026-04-01T08:05:00Z', template_name: 'Follow-Up Nurture',
  },
  {
    id: 'ol-6', building_id: '7', building_name: 'Beekman Tower', contact_name: 'info@beekman.com',
    contact_email: 'info@beekman.com', contact_phone: undefined, contact_role: 'General',
    subject: 'Property Management Services for Beekman Tower', status: 'bounced' as const,
    sent_at: '2026-04-01T15:30:00Z', opened_at: undefined, template_name: "Cold Outreach — David's Template",
  },
  {
    id: 'ol-7', building_id: '9', building_name: '785 Park Avenue Corp', contact_name: 'Elizabeth Warren',
    contact_email: 'ewarren@gmail.com', contact_phone: undefined, contact_role: 'Board President',
    subject: 'Following Up — 785 Park Avenue Corp Management', status: 'replied' as const,
    sent_at: '2026-03-28T09:00:00Z', opened_at: '2026-03-28T10:30:00Z', template_name: 'Follow-Up Nurture',
  },
];

export default function Outreach() {
  const { buildings } = useBuildings();
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OutreachTemplate | null>(null);

  // New Template modal state
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<string>('cold');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');

  // Compose state
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedContactIdx, setSelectedContactIdx] = useState(0);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [buildingSearch, setBuildingSearch] = useState('');

  const activeBuildings = buildings.filter((b) => b.status === 'active');
  const filteredForCompose = buildingSearch
    ? activeBuildings.filter((b) =>
        b.address.toLowerCase().includes(buildingSearch.toLowerCase()) ||
        b.name?.toLowerCase().includes(buildingSearch.toLowerCase())
      )
    : activeBuildings.slice(0, 20);

  const selectedBuilding = activeBuildings.find((b) => b.id === selectedBuildingId);

  const handleSelectTemplate = (template: OutreachTemplate) => {
    setSelectedTemplate(template);
    if (selectedBuilding) {
      const contact = selectedBuilding.contacts?.[selectedContactIdx];
      const { subject, body } = renderOutreachEmail(template, selectedBuilding, contact);
      setComposeSubject(subject);
      setComposeBody(body);
    } else {
      setComposeSubject(template.subject);
      setComposeBody(template.body);
    }
    setActiveTab('compose');
  };

  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id);
    setBuildingSearch('');
    const building = activeBuildings.find((b) => b.id === id);
    if (building && selectedTemplate) {
      const contact = building.contacts?.[0];
      const { subject, body } = renderOutreachEmail(selectedTemplate, building, contact);
      setComposeSubject(subject);
      setComposeBody(body);
    }
  };

  const handleSend = () => {
    toast.success('Email saved as draft (email sending requires backend configuration)');
  };

  // Hot leads: opened or delivered emails
  const hotLeads = DEMO_OUTREACH_LOG.filter((e) => e.status === 'opened' || e.status === 'delivered');

  // Build activity log from outreach log entries
  const activityLog = [...DEMO_OUTREACH_LOG]
    .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
    .map((entry) => ({
      date: new Date(entry.sent_at).toISOString().slice(0, 10),
      action:
        entry.status === 'opened' ? 'Email opened' :
        entry.status === 'replied' ? 'Reply received' :
        entry.status === 'bounced' ? 'Email bounced' :
        entry.status === 'delivered' ? 'Email delivered' :
        'Email sent',
      building: entry.building_name,
      contact: entry.contact_name,
      status: entry.status,
      email: entry.contact_email,
      phone: entry.contact_phone,
    }));

  const handleSaveNewTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    const variableMatches = (newTemplateSubject + ' ' + newTemplateBody).match(/\{(\w+)\}/g) || [];
    const variables = [...new Set(variableMatches.map((m) => m.replace(/[{}]/g, '')))];
    const newTemplate: OutreachTemplate = {
      id: String(Date.now()),
      name: newTemplateName.trim(),
      subject: newTemplateSubject.trim(),
      body: newTemplateBody.trim(),
      category: newTemplateCategory,
      variables,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setShowNewTemplateModal(false);
    setNewTemplateName('');
    setNewTemplateCategory('cold');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    toast.success(`Template "${newTemplate.name}" created`);
  };

  const handleFollowUp = (entry: typeof DEMO_OUTREACH_LOG[0]) => {
    const subject = encodeURIComponent(`Re: ${entry.subject}`);
    const body = encodeURIComponent(
      `Hi ${entry.contact_name.split(' ')[0]},\n\nI wanted to follow up on my recent email about ${entry.building_name}. I'd love to find 15 minutes to discuss how Camelot can help with your property management needs.\n\nWe offer a complimentary 30-day property evaluation at no cost and no obligation — it's our way of demonstrating value upfront.\n\nWould this week work for a quick call?\n\nBest regards,\nDavid Goldoff\nPrincipal, Camelot Realty Group\n477 Madison Avenue, 6th Fl\nNew York, NY 10022\ndgoldoff@camelot.nyc\n212-206-9939 ext. 701`
    );
    window.open(`mailto:${entry.contact_email}?subject=${subject}&body=${body}`, '_self');
    toast.success(`Follow-up email opened for ${entry.contact_name}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail size={24} className="text-camelot-gold" /> Outreach
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage email templates, compose outreach, and track activity</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-1">
          {([
            { key: 'templates' as Tab, label: 'Templates', icon: FileText },
            { key: 'compose' as Tab, label: 'Compose', icon: Edit },
            { key: 'activity' as Tab, label: 'Activity Log', icon: Clock },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors',
                activeTab === key
                  ? 'border-camelot-gold text-camelot-gold font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Email Templates</h2>
              <button
                onClick={() => setShowNewTemplateModal(true)}
                className="flex items-center gap-2 bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark"
              >
                <Plus size={14} /> New Template
              </button>
            </div>
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.is_default && (
                        <span className="text-[10px] bg-camelot-gold/10 text-camelot-gold px-2 py-0.5 rounded-full">Default</span>
                      )}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{template.category}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Subject: {template.subject}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{template.body.slice(0, 200)}...</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.variables.map((v) => (
                        <span key={v} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{'{'}{v}{'}'}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(previewTemplate?.id === template.id ? null : template)}
                      className="text-xs flex items-center gap-1 text-gray-500 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="text-xs flex items-center gap-1 text-camelot-gold px-2 py-1.5 rounded-lg hover:bg-camelot-gold/10"
                    >
                      <Send size={13} /> Use
                    </button>
                  </div>
                </div>
                {previewTemplate?.id === template.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap border border-gray-200">
                    <p className="font-medium mb-2">Subject: {template.subject}</p>
                    <hr className="my-2" />
                    {template.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold mb-4">Compose Email</h2>

            {/* Building selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Select Building</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={selectedBuilding ? (selectedBuilding.name || selectedBuilding.address) : buildingSearch}
                  onChange={(e) => { setBuildingSearch(e.target.value); setSelectedBuildingId(''); }}
                  placeholder="Search for a building..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
              </div>
              {buildingSearch && !selectedBuilding && (
                <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredForCompose.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBuilding(b.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Building2 size={14} className="text-gray-400" />
                      <span>{b.name || b.address}</span>
                      <span className="text-xs text-gray-400 ml-auto">{b.borough}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact selector */}
            {selectedBuilding && selectedBuilding.contacts?.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Contact</label>
                <select
                  value={selectedContactIdx}
                  onChange={(e) => {
                    setSelectedContactIdx(parseInt(e.target.value));
                    if (selectedTemplate) {
                      const contact = selectedBuilding.contacts[parseInt(e.target.value)];
                      const { subject, body } = renderOutreachEmail(selectedTemplate, selectedBuilding, contact);
                      setComposeSubject(subject);
                      setComposeBody(body);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                >
                  {selectedBuilding.contacts.map((c, i) => (
                    <option key={i} value={i}>{c.name} — {c.role} {c.email ? `(${c.email})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Body</label>
              <textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={16}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 resize-none"
              />
            </div>

            {/* Variables reference */}
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 mb-1">Available variables:</p>
              <div className="flex flex-wrap gap-1">
                {getAvailableVariables().map((v) => (
                  <button
                    key={v.key}
                    onClick={() => {
                      setComposeBody((prev) => prev + `{${v.key}}`);
                    }}
                    className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:border-camelot-gold hover:text-camelot-gold"
                    title={v.description}
                  >
                    {'{'}{v.key}{'}'}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                className="bg-camelot-gold text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark flex items-center gap-2"
              >
                <Send size={14} /> Send / Save Draft
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${composeSubject}\n\n${composeBody}`);
                  toast.success('Copied to clipboard');
                }}
                className="border border-gray-200 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy size={14} /> Copy
              </button>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            {/* Hot Leads Section */}
            {hotLeads.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  🔥 Hot Leads — Opened Emails
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  These contacts opened your email — prioritize follow-up calls and messages.
                </p>
                <div className="space-y-3">
                  {hotLeads.map((entry) => (
                    <div key={entry.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-orange-800">{entry.building_name}</span>
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              entry.status === 'opened' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                            )}>
                              {entry.status === 'opened' ? '👁 Opened' : '✉️ Delivered'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{entry.contact_name}</span>
                            <span className="text-gray-400"> — {entry.contact_role}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Subject: {entry.subject}</p>
                          {entry.opened_at && (
                            <p className="text-xs text-orange-600 mt-1">
                              Opened {new Date(entry.opened_at).toLocaleDateString()} at {new Date(entry.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {entry.contact_phone && (
                            <a
                              href={`tel:${entry.contact_phone}`}
                              className="flex items-center gap-1.5 text-xs font-medium bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Phone size={13} /> Call Now
                            </a>
                          )}
                          <button
                            onClick={() => handleFollowUp(entry)}
                            className="flex items-center gap-1.5 text-xs font-medium bg-camelot-gold text-white px-3 py-2 rounded-lg hover:bg-camelot-gold-dark transition-colors"
                          >
                            <Send size={13} /> Send Follow-Up
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Activity Log */}
            <h2 className="text-lg font-bold mb-4">All Outreach Activity</h2>
            <div className="space-y-3">
              {activityLog.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    item.status === 'sent' && 'bg-blue-500',
                    item.status === 'opened' && 'bg-green-500',
                    item.status === 'delivered' && 'bg-cyan-500',
                    item.status === 'bounced' && 'bg-red-500',
                    item.status === 'replied' && 'bg-purple-500',
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-gray-500">
                      {item.building} → {item.contact}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full capitalize',
                    item.status === 'sent' && 'bg-blue-50 text-blue-600',
                    item.status === 'opened' && 'bg-green-50 text-green-600',
                    item.status === 'delivered' && 'bg-cyan-50 text-cyan-600',
                    item.status === 'bounced' && 'bg-red-50 text-red-600',
                    item.status === 'replied' && 'bg-purple-50 text-purple-600',
                  )}>
                    {item.status}
                  </span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Template Modal */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNewTemplateModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Create New Template</h3>
              <button onClick={() => setShowNewTemplateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Template Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Template Name *</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Board Meeting Follow-Up"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="cold">Cold Outreach</option>
                  <option value="complimentary">Complimentary Service</option>
                  <option value="nurture">Nurture / Follow-Up</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium mb-1 block">Subject Line *</label>
                <input
                  type="text"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="e.g. Property Management Services for {building_name}"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-medium mb-1 block">Body *</label>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  rows={12}
                  placeholder={`Dear {contact_name},\n\nI'm reaching out about {building_name} at {address}...\n\nBest regards,\nDavid Goldoff\nCamelot Realty Group`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 resize-none"
                />
              </div>

              {/* Variable hints */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Available variables (click to insert):</p>
                <div className="flex flex-wrap gap-1">
                  {getAvailableVariables().map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setNewTemplateBody((prev) => prev + `{${v.key}}`)}
                      className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:border-camelot-gold hover:text-camelot-gold"
                      title={v.description}
                    >
                      {'{'}{v.key}{'}'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowNewTemplateModal(false)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewTemplate}
                className="bg-camelot-gold text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark flex items-center gap-2"
              >
                <Plus size={14} /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
