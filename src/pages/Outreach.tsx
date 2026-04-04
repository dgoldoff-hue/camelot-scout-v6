import { useState, useMemo } from 'react';
import { useBuildings } from '@/hooks/useBuildings';
import { renderOutreachEmail, getAvailableVariables } from '@/lib/email-templates';
import type { OutreachTemplate, Building, Contact } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Mail, FileText, Clock, Plus, Send, Eye, Edit, Copy,
  Building2, User, Sparkles, ChevronDown, Search, Loader2,
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
501 Madison Avenue, Suite 1400
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

export default function Outreach() {
  const { buildings } = useBuildings();
  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<OutreachTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OutreachTemplate | null>(null);

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

  // Demo activity log
  const activityLog = [
    { date: '2026-04-03', action: 'Email sent', building: 'The Bromley', contact: 'Margaret Chen', status: 'sent' },
    { date: '2026-04-02', action: 'Email opened', building: 'Lincoln Towers', contact: 'Susan Katz', status: 'opened' },
    { date: '2026-04-01', action: 'Email bounced', building: 'Beekman Tower', contact: 'info@beekman.com', status: 'bounced' },
    { date: '2026-03-30', action: 'Reply received', building: '785 Park Avenue', contact: 'Elizabeth Warren', status: 'replied' },
    { date: '2026-03-28', action: 'Email sent', building: 'The Horizon', contact: 'David Park', status: 'sent' },
  ];

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
              <button className="flex items-center gap-2 bg-camelot-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-camelot-gold-dark">
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
            <h2 className="text-lg font-bold mb-4">Outreach Activity Log</h2>
            <div className="space-y-3">
              {activityLog.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    item.status === 'sent' && 'bg-blue-500',
                    item.status === 'opened' && 'bg-green-500',
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
    </div>
  );
}
