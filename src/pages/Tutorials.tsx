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
    title: 'Getting Started with Camelot OS',
    description: 'What is Camelot OS? How to navigate the platform. Everything you need to know in 2 minutes.',
    time: '2 min',
    content: [
      {
        heading: '🏰 What Is Camelot OS?',
        steps: [
          'Scout is Camelot\'s property intelligence platform. Think of it like a search engine — but instead of searching the internet, you search **every building in New York City**.',
          'It pulls real data from the city (violations, taxes, permits, energy usage) and organizes it so you can find buildings that need better management.',
          'Camelot OS is used by the Camelot team to find new business, research properties, and generate proposals — all in one place.',
        ],
      },
      {
        heading: '📌 The Sidebar (Left Side)',
        steps: [
          'The sidebar is how you get around Scout. It\'s the dark navy bar on the left side of the screen.',
          '**Discover** — This is where you search for buildings. Type an address, scan a neighborhood, or import a list.',
          '**Intelligence** — Deep research tools. Alerts when buildings get new violations, LL97 carbon compliance checker, competitor tracking, Jackie reports, and Sentinel market reports.',
          '**Kill Chain** — Your sales workflow. Pipeline (track your deals), Outreach (send emails), **Instant Proposal** (generate proposals in minutes), Excalibur (legal agreements), and Scout AI (chat with the assistant).',
          '**Manage** — Archive old leads, export data, bot settings, and app settings.',
          'You can collapse the sidebar by clicking the arrow at the bottom. This gives you more screen space.',
        ],
      },
      {
        heading: '💡 Quick Tips',
        steps: [
          'You can always come back to Search by clicking the Camelot logo at the top of the sidebar.',
          'Most pages have a **?** button in the header — click it for context-specific help.',
          'If you get lost, come back to this Tutorials page anytime.',
        ],
      },
    ],
  },
  {
    id: 'searching-buildings',
    icon: <Search size={24} className="text-camelot-gold" />,
    title: 'Searching Buildings',
    description: 'How to look up any NYC building by address, owner name, or unit number.',
    time: '3 min',
    content: [
      {
        heading: '📍 Step 1: Go to the Search Page',
        steps: [
          'Click **Search** in the sidebar (it\'s the first item under "Discover"). This is your home page.',
          'You\'ll see a search bar at the top with three tabs: **Address**, **Owner Name**, and **Unit Lookup**.',
        ],
      },
      {
        heading: '🏠 Step 2: Search by Address',
        steps: [
          'Click the **Address** tab (it\'s selected by default).',
          'Type any NYC street address. For example: **"301 East 79th Street"** or **"1770 Grand Concourse"**.',
          'Press **Enter** on your keyboard, or click the **Search** button.',
          'Wait a few seconds — Scout is pulling data from 5+ NYC government databases at the same time.',
          'The results will appear right below the search bar. You\'ll see the building\'s name, address, units, violations, and a score.',
        ],
      },
      {
        heading: '👤 Step 3: Search by Owner Name',
        steps: [
          'Click the **Owner Name** tab.',
          'Type a person\'s name or a company name. For example: **"Silverstein Properties"** or **"Jose Tur"**.',
          'Scout searches the city\'s HPD registration records and finds every building they\'re connected to.',
          'Click on any building in the results to see its full details.',
        ],
      },
      {
        heading: '🔢 Step 4: Search by Unit (Advanced)',
        steps: [
          'Click the **Unit Lookup** tab.',
          'This is useful when you know a specific apartment number and want to find the building it\'s in.',
          'Enter the block and lot number, or an address + unit number.',
        ],
      },
      {
        heading: '📊 Understanding Results',
        steps: [
          'Each building result shows: **Name**, **Address**, **Units**, **Violations** (color-coded: green = good, red = bad), and a **Scout Score**.',
          'The Scout Score (A, B, or C) tells you how likely this building needs new management. A = hot lead, C = lower priority.',
          'Click on any building to open its full **Property Detail Card** with all the data.',
        ],
      },
    ],
  },
  {
    id: 'region-scans',
    icon: <MapPin size={24} className="text-camelot-gold" />,
    title: 'Running Region Scans',
    description: 'How to scan an entire neighborhood and find every building that needs help.',
    time: '3 min',
    content: [
      {
        heading: '🗺️ What Is a Region Scan?',
        steps: [
          'Instead of searching one building at a time, a Region Scan searches an **entire neighborhood** all at once.',
          'For example, you can scan "Upper East Side" and Scout will find every building with open violations, high distress scores, or management issues.',
          'This is how Carl and Sam find cold call targets.',
        ],
      },
      {
        heading: '📍 Step 1: Start a Scan',
        steps: [
          'Go to the **Search** page.',
          'Below the search bar, you\'ll see the **Region Selector** — a dropdown that says "Select a region".',
          'Click it and choose a neighborhood (e.g., "Midtown East", "Park Slope", "Pelham Parkway").',
          'Click **Scan Region**.',
        ],
      },
      {
        heading: '📋 Step 2: Review Results',
        steps: [
          'Scout will find 10-50+ buildings in that area and load them into the **Results** page.',
          'Buildings are sorted by Scout Score — the most promising leads appear first.',
          'You can filter results by violations, units, building type, and more.',
        ],
      },
      {
        heading: '💾 Step 3: Save the Best Ones',
        steps: [
          'Click the **bookmark icon** on any building to save it to your Saved list.',
          'Or click **Add to Pipeline** to start working on it as a lead.',
        ],
      },
    ],
  },
  {
    id: 'property-card',
    icon: <FileText size={24} className="text-camelot-gold" />,
    title: 'The Property Detail Card',
    description: 'Everything you see when you click on a building — violations, contacts, financial data, and more.',
    time: '4 min',
    content: [
      {
        heading: '📋 Opening a Property Card',
        steps: [
          'When you click on any building in your Results, Saved, or Pipeline — the **Property Detail Card** opens.',
          'This is the most important screen in Scout. It shows everything we know about the building.',
        ],
      },
      {
        heading: '📊 What You\'ll See',
        steps: [
          '**Header** — Building name, address, borough, units, stories, year built, and building class.',
          '**Violations Tab** — All HPD violations (Class A, B, C), color-coded by severity. Red = bad. Green = resolved.',
          '**Financial Tab** — Tax assessment, market value, last sale price and date, BBL number.',
          '**Energy Tab** — ENERGY STAR score, energy usage, LL97 carbon compliance status.',
          '**Permits Tab** — Active DOB permits, recent construction work, architect and engineer info.',
          '**Contacts Tab** — Board members, owners, managing agent, superintendent — with phone, email, and social media links.',
          '**Distress Signals** — A score from 0-100 showing how much trouble the building is in. Higher = more distressed.',
        ],
      },
      {
        heading: '👥 Contacts & Social Media',
        steps: [
          'The Contacts section shows everyone connected to the building — pulled from HPD registrations and DOB permits.',
          'Each contact has **LinkedIn**, **Facebook**, and **Instagram** search links. These are pre-filled with the person\'s name AND the building address so you find the right person.',
          'You can click **Add Contact** to manually add someone you spoke to.',
          'Click the **Enrich** button to pull more contacts from public records.',
        ],
      },
      {
        heading: '📝 Notes & Pipeline',
        steps: [
          'There\'s a **Notes** section at the bottom where you can write anything about the building.',
          'Click **Add to Pipeline** to start tracking this building as an active lead.',
          'Click **Run Jackie** to generate a full intelligence report.',
        ],
      },
    ],
  },
  {
    id: 'pipeline',
    icon: <GitBranch size={24} className="text-camelot-gold" />,
    title: 'Working the Pipeline',
    description: 'How to track your deals from first contact to signed agreement.',
    time: '3 min',
    content: [
      {
        heading: '📋 What Is the Pipeline?',
        steps: [
          'The Pipeline is your deal tracker. It shows every building you\'re working on, organized by stage.',
          'Think of it like a Kanban board (like Trello) — buildings move from left to right as you make progress.',
        ],
      },
      {
        heading: '📊 The Stages',
        steps: [
          '**Discovered** — You found this building and it looks interesting.',
          '**Contacted** — You\'ve reached out (email, call, or letter).',
          '**Meeting** — You have a meeting scheduled or completed.',
          '**Proposal** — You\'ve sent a Proposal of Services.',
          '**Won** — They signed! 🎉',
          '**Lost** — They said no (for now). You can always try again later.',
        ],
      },
      {
        heading: '🔄 Moving Buildings Between Stages',
        steps: [
          'Click and drag a building card from one column to another.',
          'Or click on a building, then click the **Move to...** button and select the new stage.',
          'The date of the move is automatically recorded.',
        ],
      },
      {
        heading: '💡 Tips',
        steps: [
          'Check your Pipeline every morning. Follow up on buildings in "Contacted" that haven\'t moved in a week.',
          'When you send a proposal, move the building to "Proposal" right away so the team knows.',
          'Buildings in "Won" should have a management agreement generated via **Excalibur**.',
        ],
      },
    ],
  },
  {
    id: 'jackie',
    icon: <Sparkles size={24} className="text-camelot-gold" />,
    title: 'Jackie — Property Intelligence Reports',
    description: 'How to generate a full building intelligence report with financial analysis, charts, and market data.',
    time: '4 min',
    content: [
      {
        heading: '📄 What Is Jackie?',
        steps: [
          'Jackie is Camelot\'s property intelligence report generator. It creates a beautiful, branded report for any NYC building.',
          'The report includes: building data, violations, financial analysis, neighborhood intelligence, fee comparisons, LL97 compliance, technology overview, case studies, and more.',
          'Jackie reports are what you send to boards and owners to show them what you know about their building.',
        ],
      },
      {
        heading: '🚀 Step 1: Open Jackie',
        steps: [
          'Click **Jackie** in the sidebar (under "Intelligence").',
          'You\'ll see a search bar. Type the building address (e.g., **"1770 Grand Concourse"**).',
          'Select the borough if needed (or leave it on auto-detect).',
          'Click **Run Jackie**.',
        ],
      },
      {
        heading: '⏳ Step 2: Wait for the Report',
        steps: [
          'Jackie pulls data from 10+ sources simultaneously — this takes 10-30 seconds.',
          'You\'ll see a loading indicator while it works.',
          'When it\'s done, the full report opens in a new browser tab.',
        ],
      },
      {
        heading: '📊 Step 3: What\'s in the Report',
        steps: [
          '**Cover Page** — Building name, address, BBL, date, Camelot branding.',
          '**Property Overview** — Units, stories, year built, building class, Street View photo.',
          '**Neighborhood Intelligence** — Crime data, 311 complaints, landmarks, transit access.',
          '**Research Sources** — Links to StreetEasy, PropertyShark, ACRIS, DOB BIS.',
          '**Violations & Compliance** — Full HPD violation breakdown, ECB penalties, LL97 status.',
          '**Financial Opportunity Analysis** — How much money Camelot can save this building (insurance, vendors, energy, retention).',
          '**5-Year Pro Forma** — Year-by-year projections of value created vs. management fee.',
          '**Charts & Graphs** — Bar charts, donut charts, ROI cards — all auto-generated from the building\'s data.',
          '**Fee Comparison** — How Camelot pricing compares to AKAM, FirstService, and other big firms.',
          '**Technology Platform** — ConciergePlus, Merlin AI, SCOUT — what residents and boards get.',
          '**Portfolio References** — Nearby Camelot buildings sorted by distance, with case studies.',
          '**Proposal Button** — A floating gold button to generate the Proposal of Services.',
        ],
      },
      {
        heading: '🖨️ Step 4: Save or Print',
        steps: [
          'At the top of the report, there\'s a toolbar with **Print / Save PDF**, **Download**, and **Email** buttons.',
          'Click **Print / Save PDF** to open the print dialog. Choose "Save as PDF" to save it to your computer.',
          'Click **Email** to open a pre-filled email you can send to the board.',
        ],
      },
    ],
  },
  {
    id: 'instant-proposal',
    icon: <Zap size={24} className="text-camelot-gold" />,
    title: 'Instant Proposal',
    description: 'How to generate a Proposal of Services in minutes — from search to signed document.',
    time: '5 min',
    content: [
      {
        heading: '⚡ What Is Instant Proposal?',
        steps: [
          'Instant Proposal is a step-by-step wizard that takes you from a property address to a finished, signable Proposal of Services in about 5 minutes.',
          'The proposal is based on the Boulevard Tenants Corp template — Camelot\'s most comprehensive proposal format.',
          'It auto-fills everything from the building data: address, BBL, violations, pricing, pain points, scope of services, transition plan, and signature blocks.',
        ],
      },
      {
        heading: '📍 Step 1: Enter the Property',
        steps: [
          'Click **⚡ Instant Proposal** in the sidebar (under "Kill Chain").',
          'Type the property address in the search box. For example: **"385 Bleecker Street"** or **"1770 Grand Concourse"**.',
          'Choose the borough from the dropdown, or leave it on "Auto-detect".',
          'Click **Search Property** and wait a few seconds.',
        ],
      },
      {
        heading: '✅ Step 2: Verify the Data',
        steps: [
          'Scout shows you a Property Card with all the key data: units, stories, violations, Scout grade, BBL, type, owner, current management, and the proposed monthly fee.',
          '**This is your chance to check that everything looks right.** If the unit count is wrong or the owner name is off, go back and try a different search.',
          'When you\'re satisfied the data is correct, click **Confirm & Generate Jackie**.',
        ],
      },
      {
        heading: '📄 Step 3: Jackie Report',
        steps: [
          'Scout generates a full Jackie intelligence report in the background.',
          'You\'ll see a green checkmark when it\'s done.',
          'Click **View Full Jackie Report** if you want to see the full report in a new tab.',
          'Click **Generate Proposal Draft** to move to the next step.',
        ],
      },
      {
        heading: '✏️ Step 4: Review & Edit the Draft',
        steps: [
          'The proposal appears on screen in full — exactly as it will look when printed.',
          '**You can click on ANY text to edit it.** Want to change the contact name? Click on it and type. Want to add a sentence? Click where you want it and start typing.',
          'You can delete sections you don\'t need, add custom paragraphs, or fix any details.',
          'Take your time — this is your draft. Nothing is sent until you say so.',
          'When you\'re happy with it, click **Finalize** in the top right.',
        ],
      },
      {
        heading: '📤 Step 5: Export & Send',
        steps: [
          'You now have four options:',
          '**🖨️ Print** — Opens the proposal in a clean window and triggers the print dialog. Great for printing a physical copy.',
          '**📥 Save as PDF** — Same as Print, but choose "Save as PDF" in the print dialog. This saves it as a PDF file on your computer.',
          '**📄 Download HTML** — Saves the proposal as an HTML file you can open in any browser.',
          '**✉️ Email via Gmail** — Opens Gmail with a pre-written email. You\'ll need to attach the PDF you saved in the previous step.',
          'After sending, move the building to the **"Proposal"** stage in your Pipeline.',
        ],
      },
    ],
  },
  {
    id: 'outreach',
    icon: <Mail size={24} className="text-camelot-gold" />,
    title: 'Outreach & Cold Calling',
    description: 'How to send emails and make calls using Scout\'s built-in outreach tools.',
    time: '3 min',
    content: [
      {
        heading: '📧 What Is Outreach?',
        steps: [
          'The Outreach page helps you send professional emails and track phone calls to building contacts.',
          'It uses email templates that are pre-written and branded with Camelot\'s style.',
        ],
      },
      {
        heading: '✉️ Sending an Email',
        steps: [
          'Click **Outreach** in the sidebar.',
          'Select a building from your Pipeline or search for one.',
          'Choose an email template: **Introduction**, **Follow-up**, **Proposal**, or **LL97 Compliance**.',
          'The email is auto-filled with the building\'s data (name, address, violations, etc.).',
          'Review the email, make any changes you want, then click **Send** or **Copy to Gmail**.',
        ],
      },
      {
        heading: '📞 Cold Calling Tips',
        steps: [
          'Scout generates a **Cold Caller Sheet** for each building with talking points.',
          'Open the Jackie report and the Cold Caller Sheet will be available as a separate output.',
          'Key talking points include: number of violations, current management issues, and Camelot\'s three pricing tiers.',
          'Always log your call results in the Pipeline (notes section) so the team knows what happened.',
        ],
      },
    ],
  },
  {
    id: 'alerts',
    icon: <Filter size={24} className="text-camelot-gold" />,
    title: 'Alerts & 311 Complaints',
    description: 'How to set up alerts when buildings get new violations or 311 complaints.',
    time: '2 min',
    content: [
      {
        heading: '🔔 What Are Alerts?',
        steps: [
          'Alerts monitor your saved buildings and notify you when something changes — like new HPD violations, DOB complaints, or 311 calls.',
          'This helps you reach out to boards at exactly the right time ("We noticed your building just received 3 new Class C violations...").',
        ],
      },
      {
        heading: '⚙️ Setting Up Alerts',
        steps: [
          'Click **Alerts** in the sidebar (under "Intelligence").',
          'Any building in your Pipeline or Saved list is automatically monitored.',
          'You\'ll see a dashboard showing recent alerts across all your tracked buildings.',
          'Click on any alert to see the full details and take action (add to pipeline, send outreach, etc.).',
        ],
      },
    ],
  },
  {
    id: 'll97-compliance',
    icon: <Filter size={24} className="text-camelot-gold" />,
    title: 'LL97 Compliance Checker',
    description: 'How to check if a building is exposed to Local Law 97 carbon penalties.',
    time: '2 min',
    content: [
      {
        heading: '🌡️ What Is LL97?',
        steps: [
          'Local Law 97 is NYC\'s carbon emissions law. Buildings over 25,000 square feet must meet carbon limits or pay penalties — starting at $268 per ton of CO₂ over the limit.',
          'This is a huge deal for big buildings. Penalties can be **hundreds of thousands of dollars per year**.',
          'Camelot offers LL97 compliance as a service — which makes it a great reason for boards to switch management.',
        ],
      },
      {
        heading: '📊 Using the LL97 Checker',
        steps: [
          'Click **LL97 Compliance** in the sidebar.',
          'Search for a building by address.',
          'Scout calculates the building\'s emissions vs. the legal limit and shows the estimated penalty.',
          'If the building is non-compliant, this is a major talking point for outreach.',
        ],
      },
    ],
  },
  {
    id: 'competitors',
    icon: <GripVertical size={24} className="text-camelot-gold" />,
    title: 'Competitor Intelligence',
    description: 'How to research competing management companies and find buildings they manage.',
    time: '2 min',
    content: [
      {
        heading: '🔍 What Is Competitor Intelligence?',
        steps: [
          'This tool shows you which management companies are managing buildings in a given area — and how well (or badly) they\'re doing.',
          'You can search for a competitor by name (e.g., "FirstService" or "AKAM") and see every building they manage.',
        ],
      },
      {
        heading: '📊 How to Use It',
        steps: [
          'Click **Competitors** in the sidebar.',
          'Search by management company name or browse by neighborhood.',
          'Scout shows their buildings, violation rates, and a "displacement score" — how likely those buildings are to switch.',
          'High displacement score = unhappy building = good lead for Camelot.',
        ],
      },
    ],
  },
  {
    id: 'sentinel',
    icon: <Filter size={24} className="text-camelot-gold" />,
    title: 'Sentinel — Market Reports',
    description: 'How to generate quarterly market reports for existing Camelot clients.',
    time: '2 min',
    content: [
      {
        heading: '📊 What Is Sentinel?',
        steps: [
          'Sentinel generates quarterly market reports for buildings Camelot already manages.',
          'It shows the board: neighborhood trends, comparable sales, rent data, and how their building compares to the market.',
          'These reports help retain existing clients by showing the value Camelot provides.',
        ],
      },
      {
        heading: '🚀 Generating a Report',
        steps: [
          'Click **Sentinel** in the sidebar.',
          'Choose which buildings to include (or select all).',
          'Click **Generate Reports**.',
          'Reports are created as HTML files that can be downloaded, printed, or emailed.',
        ],
      },
    ],
  },
  {
    id: 'excalibur',
    icon: <GripVertical size={24} className="text-camelot-gold" />,
    title: 'Excalibur — Management Agreements',
    description: 'How to generate a legal management agreement for a new client.',
    time: '3 min',
    content: [
      {
        heading: '⚔️ What Is Excalibur?',
        steps: [
          'Excalibur is Camelot\'s agreement generator. Once a building signs a Proposal of Services, you use Excalibur to generate the formal Management Agreement.',
          'It creates a complete legal document with all terms, conditions, schedules, and signature blocks.',
        ],
      },
      {
        heading: '📝 Generating an Agreement',
        steps: [
          'Click **Excalibur** in the sidebar.',
          'Choose the agreement type: **Rental**, **Co-op**, **Condo**, **Office**, **Retail**, or **Individual Unit**.',
          'Fill in the building details (or they\'ll auto-fill if the building is already in your Pipeline).',
          'Click **Generate**. The agreement opens in a new window.',
          'Review it, then **Print / Save as PDF** or **Download**.',
          'The agreement is designed for DocuSign — send it electronically for signature.',
        ],
      },
      {
        heading: '💡 Tips',
        steps: [
          'Always review the agreement before sending. Check the fee, term length, and building-specific details.',
          'The template includes: insurance requirements, liability terms, indemnification, Schedule A (ancillary fees), and termination clauses.',
          'If you need a custom clause, edit the HTML before printing.',
        ],
      },
    ],
  },
  {
    id: 'importing',
    icon: <Upload size={24} className="text-camelot-gold" />,
    title: 'Importing Leads',
    description: 'How to upload a spreadsheet of buildings into Scout.',
    time: '2 min',
    content: [
      {
        heading: '📤 Why Import?',
        steps: [
          'If you have a list of buildings (from a broker, a lead list, or your own research), you can import them all at once instead of searching one by one.',
        ],
      },
      {
        heading: '📋 Step 1: Prepare Your File',
        steps: [
          'Create a CSV or Excel file with at least one column: **Address**.',
          'Optional columns: Borough, Units, Owner, Management Company.',
          'Save the file on your computer.',
        ],
      },
      {
        heading: '⬆️ Step 2: Upload',
        steps: [
          'Click **Import** in the sidebar.',
          'Click **Choose File** and select your spreadsheet.',
          'Scout will read the addresses and pull live data for each building.',
          'The buildings will appear in your **Results** page, ready to save or add to your Pipeline.',
        ],
      },
    ],
  },
  {
    id: 'exporting',
    icon: <Download size={24} className="text-camelot-gold" />,
    title: 'Exporting Data',
    description: 'How to download your Scout data as a spreadsheet.',
    time: '1 min',
    content: [
      {
        heading: '📥 Exporting Your Data',
        steps: [
          'Click **Export** in the sidebar (under "Manage").',
          'Choose what to export: **All Buildings**, **Pipeline Only**, **Saved Only**, or **Search Results**.',
          'Click **Export CSV**. A spreadsheet file downloads to your computer.',
          'The CSV includes: address, BBL, units, violations, contacts, management company, Scout score, pipeline stage, and more.',
          'You can open this file in Excel or Google Sheets.',
        ],
      },
    ],
  },
  {
    id: 'scout-ai',
    icon: <MessageSquare size={24} className="text-camelot-gold" />,
    title: 'Scout AI Assistant',
    description: 'How to chat with the AI assistant for research, writing, and strategy.',
    time: '2 min',
    content: [
      {
        heading: '🤖 What Is Merlin AI?',
        steps: [
          'Scout AI is a built-in chat assistant. You can ask it questions about buildings, get help writing emails, or brainstorm strategy.',
          'It knows about all the buildings in your Pipeline and can pull live data.',
        ],
      },
      {
        heading: '💬 How to Use It',
        steps: [
          'Click **Scout AI** in the sidebar.',
          'Type your question in plain English. For example:',
          '**"What do we know about 301 East 79th Street?"** — Gets a summary of all data.',
          '**"Write an introduction email for the board at 137 Franklin Street"** — Drafts a professional email.',
          '**"Compare our pricing to AKAM for a 100-unit co-op"** — Gives competitive analysis.',
          '**"What buildings in my pipeline haven\'t been contacted in 2 weeks?"** — Helps you follow up.',
        ],
      },
      {
        heading: '💡 Tips',
        steps: [
          'Be specific. Instead of "help me", say "write a follow-up email for 415 East 6th Street mentioning their 12 open violations".',
          'Scout AI can generate cold caller scripts, email drafts, proposal talking points, and meeting agendas.',
          'It remembers the conversation within the session, so you can say "now make it shorter" or "add the LL97 penalty info".',
        ],
      },
    ],
  },
  {
    id: 'settings',
    icon: <Settings size={24} className="text-camelot-gold" />,
    title: 'Settings & Configuration',
    description: 'How to configure Scout — API keys, preferences, and user profile.',
    time: '1 min',
    content: [
      {
        heading: '⚙️ Settings Page',
        steps: [
          'Click **Settings** in the sidebar (at the bottom, under "Manage").',
          'Here you can configure API keys for external services (RealtyMX, AI providers).',
          'You can also set your default borough, email address, and notification preferences.',
          'If something isn\'t working, check Settings first — an expired API key is usually the culprit.',
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
              <h1 className="text-3xl font-bold">Camelot OS Academy</h1>
              <p className="text-gray-400">Learn Camelot OS — master every feature</p>
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
// Build: 20260406060431
