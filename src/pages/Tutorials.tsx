import { useState } from 'react';
import {
  Search, LayoutGrid, GitBranch, Mail, MessageSquare, Upload, Download,
  Settings, ChevronDown, ChevronRight, Clock, BookOpen, Sparkles,
  MapPin, Filter, GripVertical, FileText, Zap,
} from 'lucide-react';

interface Tutorial {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  content: TutorialSection[];
}

interface TutorialSection {
  heading: string;
  steps: string[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    icon: <Sparkles size={24} className="text-camelot-gold" />,
    title: 'Getting Started',
    description: 'Overview of Scout v6 features, navigation, and the search page.',
    time: '2 min',
    content: [
      {
        heading: '🏰 Welcome to Camelot Scout v6',
        steps: [
          'Camelot Scout is your property intelligence platform — it pulls live NYC building data (violations, assessments, permits, energy) and scores properties as potential leads.',
          'The sidebar on the left is your main navigation. It\'s organized into three sections: Discover, Kill Chain, and Manage.',
          'Use the collapse button at the bottom of the sidebar to toggle between full and compact mode.',
        ],
      },
      {
        heading: '📌 Sidebar Sections',
        steps: [
          '**Discover** — Search for buildings, view results, save favorites, and import leads.',
          '**Kill Chain** — Your sales workflow: Pipeline tracking, Outreach (email), and Scout AI assistant.',
          '**Manage** — Archive old leads, export data, configure AI bots, and adjust settings.',
        ],
      },
      {
        heading: '🔍 The Search Page',
        steps: [
          'The Search page is your home base. It has three tabs: Address lookup, Owner Name search, and Unit Lookup.',
          'Below the search bar, you\'ll find the Region Selector for scanning entire neighborhoods.',
          'Quick stats at the top show Camelot\'s portfolio metrics.',
        ],
      },
    ],
  },
  {
    id: 'searching-buildings',
    icon: <Search size={24} className="text-camelot-gold" />,
    title: 'Searching Buildings',
    description: 'Look up any NYC building by address, owner name, or specific unit.',
    time: '3 min',
    content: [
      {
        heading: '📍 Address Search',
        steps: [
          'Click the **Address** tab on the Search page.',
          'Type any NYC street address (e.g., "301 East 79th Street").',
          'Press Enter or click Search. Scout will pull data from 5 NYC Open Data sources simultaneously.',
          'Results appear inline below the search bar — no page navigation needed.',
        ],
      },
      {
        heading: '👤 Owner Name Search',
        steps: [
          'Click the **Owner Name** tab.',
          'Enter an owner or management company name (e.g., "Silverstein Properties").',
          'Scout searches HPD registration records and returns all matching buildings.',
          'Click any result to load the full building report.',
        ],
      },
      {
        heading: '🏠 Unit Lookup',
        steps: [
          'Click the **Unit Lookup** tab.',
          'Enter the building address and apartment number.',
          'Scout returns unit-specific violations plus the building\'s overall context (owner, year built, units, market value).',
          'For condos, individual unit BBL may be available via ACRIS. For co-ops, ownership is via stock shares.',
        ],
      },
      {
        heading: '📊 Reading the Building Report',
        steps: [
          'The **Score** (0-100) tells you how promising this lead is. Grade A (70+) = hot, B (40-69) = warm, C (<40) = cold.',
          '**Property Assessment** — DOF data: owner, market value, assessed value, year built, units.',
          '**HPD Violations** — Total and open violations, last violation date.',
          '**Registration** — Current management company and registered owner.',
          '**Energy/LL97** — Energy Star score, site EUI, GHG emissions.',
          '**DOB Permits** — Recent permit activity signals active investment.',
          'Click **Add to Scout** to save the building to your database and move it into Results.',
        ],
      },
    ],
  },
  {
    id: 'region-scans',
    icon: <MapPin size={24} className="text-camelot-gold" />,
    title: 'Running Region Scans',
    description: 'Scan entire neighborhoods for property leads using filters.',
    time: '2 min',
    content: [
      {
        heading: '🗺️ Selecting Neighborhoods',
        steps: [
          'Scroll down on the Search page to the **Region Selector**.',
          'Regions are grouped by borough (Manhattan, Brooklyn, etc.) and include Florida areas.',
          'Click a group to expand it, then check individual neighborhoods.',
          'Use "Select all" to check every area in a group.',
        ],
      },
      {
        heading: '⚡ LIVE vs AI-Powered Regions',
        steps: [
          'NYC boroughs are tagged **LIVE** — they pull real-time data from government APIs.',
          'Florida and other regions are tagged **AI** — they use AI-researched property data.',
          'LIVE regions return the most accurate, up-to-date information.',
        ],
      },
      {
        heading: '🔧 Advanced Filters',
        steps: [
          'Use the **Filters** panel on the right to narrow your scan.',
          '**Building Type** — Filter by co-op, condo, rental, or mixed-use.',
          '**Unit Count** — Set minimum and maximum unit counts.',
          '**Year Built** — Target older buildings that may need new management.',
          '**Min. Violations** — Find buildings with compliance issues (your sales signal).',
          'Click **Scan** to run the search. Results appear on the Results page.',
        ],
      },
    ],
  },
  {
    id: 'pipeline',
    icon: <GitBranch size={24} className="text-camelot-gold" />,
    title: 'Working the Pipeline',
    description: 'Track leads from discovery to close with the Kanban board.',
    time: '3 min',
    content: [
      {
        heading: '🔀 Pipeline Stages',
        steps: [
          'The Pipeline page shows a Kanban board with 6 stages:',
          '**Discovered** → Buildings you\'ve identified as potential leads.',
          '**Scored** → Leads that have been analyzed and scored.',
          '**Contacted** → You\'ve made initial outreach (email, call, letter).',
          '**Nurture** → In ongoing conversations, building relationship.',
          '**Proposal** → Formal proposal submitted to the board.',
          '**Won** → Contract signed! 🎉',
        ],
      },
      {
        heading: '🖱️ Moving Leads',
        steps: [
          'Drag and drop property cards between columns to advance them.',
          'Each card shows the building name, score, units, and current management.',
          'The pipeline tracks how long each lead has been in its current stage.',
        ],
      },
      {
        heading: '💡 Pipeline Best Practices',
        steps: [
          'Move leads promptly — stale leads in "Contacted" for 30+ days may need a follow-up or archival.',
          'Use the **Archive** page for leads that aren\'t active right now but might be later.',
          'Focus on Grade A and B leads first — they have the highest conversion potential.',
        ],
      },
    ],
  },
  {
    id: 'outreach',
    icon: <Mail size={24} className="text-camelot-gold" />,
    title: 'Outreach & Cold Calling',
    description: 'Email templates, cold calling scripts, and follow-up tracking.',
    time: '4 min',
    content: [
      {
        heading: '📧 Email Templates',
        steps: [
          'Navigate to the **Outreach** page from the sidebar.',
          'Scout includes pre-built email templates for common scenarios: initial introduction, violation follow-up, management transition, and more.',
          'Each template auto-fills with the building\'s data (address, violations, units, management company).',
          'Click a template to preview and customize before sending.',
        ],
      },
      {
        heading: '✏️ Custom Templates',
        steps: [
          'Create your own templates using variables like {{address}}, {{violations}}, {{management}}, {{units}}.',
          'Save custom templates for reuse across your team.',
          'Templates can be used for email, printed letters, or portal messages.',
        ],
      },
      {
        heading: '📞 Cold Calling',
        steps: [
          'The Outreach page includes a cold calling script approach.',
          'Scripts are tailored based on the building\'s score and signals.',
          'Key talking points are highlighted: violation count, management concerns, value proposition.',
          'Log call outcomes to track your conversion rates.',
        ],
      },
      {
        heading: '🔥 Hot Leads & Follow-ups',
        steps: [
          'Track email opens to identify "hot" leads who are engaging with your outreach.',
          'Set follow-up reminders for leads that haven\'t responded.',
          'Best practice: Follow up within 3-5 business days of initial contact.',
          'Vary your approach — email first, then call, then a personalized letter.',
        ],
      },
    ],
  },
  {
    id: 'importing',
    icon: <Upload size={24} className="text-camelot-gold" />,
    title: 'Importing Leads',
    description: 'Import existing lead lists from CSV or Excel files.',
    time: '2 min',
    content: [
      {
        heading: '📥 Supported Formats',
        steps: [
          'Scout supports **CSV** (.csv) and **Excel** (.xlsx, .xls) file imports.',
          'Navigate to **Import** in the sidebar to get started.',
        ],
      },
      {
        heading: '🗂️ Column Mapping',
        steps: [
          'After uploading, Scout will detect your columns and ask you to map them.',
          'Required: Address. Optional: Building name, units, owner, management company, year built, etc.',
          'Scout will try to auto-match common column names (e.g., "Address", "Units", "Owner").',
        ],
      },
      {
        heading: '📊 After Import',
        steps: [
          'Imported buildings appear in your Results page.',
          'Scout will attempt to enrich imported buildings with NYC Open Data (violations, DOF, energy).',
          'Buildings are scored automatically. Grade A/B leads are flagged for immediate outreach.',
        ],
      },
    ],
  },
  {
    id: 'exporting',
    icon: <Download size={24} className="text-camelot-gold" />,
    title: 'Exporting Reports',
    description: 'Generate CSV exports and PDF reports for your team.',
    time: '2 min',
    content: [
      {
        heading: '📋 CSV Export',
        steps: [
          'Navigate to the **Export** page from the sidebar.',
          'Select which buildings to include (all, filtered, or selected).',
          'Choose which fields to export: address, score, violations, contacts, pipeline stage, etc.',
          'Click Export to download a .csv file ready for Excel or Google Sheets.',
        ],
      },
      {
        heading: '📄 PDF Reports',
        steps: [
          'From any building\'s detail view, click **Report PDF** in the action bar.',
          'The PDF includes: building details, score breakdown, violations, contacts, and signals.',
          'Reports are branded with Camelot\'s logo and contact info — ready for presentations.',
        ],
      },
      {
        heading: '📧 Emailing Reports',
        steps: [
          'Use the Export page to generate reports and email them directly to team members.',
          'Schedule weekly pipeline summaries for your team.',
          'Attach PDF reports to board proposals for a professional touch.',
        ],
      },
    ],
  },
  {
    id: 'scout-ai',
    icon: <MessageSquare size={24} className="text-camelot-gold" />,
    title: 'Scout AI Assistant',
    description: 'Use AI to analyze your pipeline, get suggestions, and draft emails.',
    time: '2 min',
    content: [
      {
        heading: '🤖 Quick Actions',
        steps: [
          'Navigate to **Scout AI** in the sidebar to open the chat interface.',
          'Quick action buttons at the top let you instantly run common tasks:',
          '**Pipeline Summary** — Get an overview of your current pipeline status.',
          '**Top Leads** — See your highest-scored buildings that need attention.',
          '**Draft Email** — Generate a personalized outreach email for a specific building.',
          '**Untouched Leads** — Find buildings in your database that haven\'t been contacted yet.',
        ],
      },
      {
        heading: '💬 Chat Interface',
        steps: [
          'Type any question about your pipeline, leads, or strategy.',
          'Examples: "What buildings in the Upper East Side have the most violations?"',
          '"Draft a follow-up email for 301 East 79th Street"',
          '"Which leads have been in Contacted for more than 2 weeks?"',
          'Scout AI has access to your entire building database and can cross-reference data.',
        ],
      },
    ],
  },
];

export default function Tutorials() {
  const [expandedTutorial, setExpandedTutorial] = useState<string | null>(null);

  const toggleTutorial = (id: string) => {
    setExpandedTutorial((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-camelot-navy text-white px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-camelot-gold/20 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-camelot-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Scout Academy</h1>
              <p className="text-gray-400">Learn Camelot Scout — master every feature</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><FileText size={14} /> {TUTORIALS.length} tutorials</span>
            <span className="flex items-center gap-1"><Clock size={14} /> ~20 minutes total</span>
            <span className="flex items-center gap-1"><Zap size={14} /> Interactive walkthroughs</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Tutorial Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {TUTORIALS.map((tutorial) => (
            <button
              key={tutorial.id}
              onClick={() => toggleTutorial(tutorial.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg group ${
                expandedTutorial === tutorial.id
                  ? 'border-camelot-gold bg-camelot-gold/5 shadow-md'
                  : 'border-gray-200 bg-white hover:border-camelot-gold/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  expandedTutorial === tutorial.id ? 'bg-camelot-gold/20' : 'bg-gray-100 group-hover:bg-camelot-gold/10'
                }`}>
                  {tutorial.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{tutorial.title}</h3>
                    <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                      <Clock size={12} /> {tutorial.time}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{tutorial.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Expanded Tutorial Content */}
        {TUTORIALS.map((tutorial) => (
          <div
            key={tutorial.id}
            id={`tutorial-${tutorial.id}`}
            className={`transition-all duration-300 overflow-hidden ${
              expandedTutorial === tutorial.id ? 'max-h-[5000px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Tutorial header */}
              <div className="bg-camelot-navy px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-camelot-gold/20 rounded-lg flex items-center justify-center">
                    {tutorial.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{tutorial.title}</h2>
                    <p className="text-xs text-gray-400">{tutorial.time} read</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedTutorial(null)}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Close ✕
                </button>
              </div>

              {/* Tutorial sections */}
              <div className="p-6 space-y-6">
                {tutorial.content.map((section, si) => (
                  <div key={si}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>
                    <div className="space-y-2.5 pl-1">
                      {section.steps.map((step, stepi) => (
                        <div key={stepi} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-camelot-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-camelot-gold">{stepi + 1}</span>
                          </div>
                          <p
                            className="text-sm text-gray-600 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: step
                                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
                                .replace(/{{(.+?)}}/g, '<code class="bg-gray-100 text-camelot-gold px-1 py-0.5 rounded text-xs">{{$1}}</code>'),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    {si < tutorial.content.length - 1 && (
                      <hr className="mt-6 border-gray-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Footer tip */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">
            💡 Tip: You can restart the guided tour anytime using the <strong>?</strong> button in the sidebar header.
          </p>
        </div>
      </div>
    </div>
  );
}
