import { useState, useRef } from 'react';
import { Search, CheckCircle, FileText, Edit3, Download, Printer, Mail, Loader2, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { buildMasterReport, generateBrochureHTML, type MasterReportData } from '@/lib/camelot-report';
import toast from 'react-hot-toast';

type Step = 'search' | 'verify' | 'jackie' | 'draft' | 'export';

const STEPS: { key: Step; label: string; icon: typeof Search }[] = [
  { key: 'search', label: 'Property', icon: Search },
  { key: 'verify', label: 'Verify', icon: CheckCircle },
  { key: 'jackie', label: 'Jackie Report', icon: FileText },
  { key: 'draft', label: 'Review Draft', icon: Edit3 },
  { key: 'export', label: 'Export', icon: Download },
];

export default function InstantProposal() {
  const [step, setStep] = useState<Step>('search');
  const [address, setAddress] = useState('');
  const [borough, setBorough] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<MasterReportData | null>(null);
  const [proposalHTML, setProposalHTML] = useState('');
  const [jackieHTML, setJackieHTML] = useState('');
  const draftRef = useRef<HTMLDivElement>(null);

  const stepIndex = STEPS.findIndex(s => s.key === step);

  // Step 1: Search
  const handleSearch = async () => {
    if (!address.trim()) { toast.error('Enter a property address'); return; }
    setLoading(true);
    try {
      const data = await buildMasterReport(address.trim(), borough || undefined);
      setReportData(data);
      setStep('verify');
      toast.success('Property data loaded');
    } catch (e: any) {
      toast.error('Failed to load property: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2→3: Generate Jackie
  const handleGenerateJackie = async () => {
    if (!reportData) return;
    setLoading(true);
    try {
      const html = generateBrochureHTML(reportData);
      setJackieHTML(html);
      // Extract proposal from the Jackie report's generateProposal script
      setStep('jackie');
      toast.success('Jackie report generated');
    } catch (e: any) {
      toast.error('Failed: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3→4: Generate proposal draft
  const handleGenerateDraft = () => {
    if (!reportData) return;
    // Open the Jackie report in a hidden iframe and trigger generateProposal
    // For now, we'll build the proposal HTML directly
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(jackieHTML);
    iframe.contentDocument?.close();
    // Try to call generateProposal from the iframe context
    try {
      const win = iframe.contentWindow as any;
      if (win && typeof win.generateProposal === 'function') {
        // Intercept window.open
        const origOpen = win.window.open;
        let capturedHTML = '';
        win.window.open = function() {
          return {
            document: {
              write: function(h: string) { capturedHTML = h; },
              close: function() {},
            },
            print: function() {},
          };
        };
        win.generateProposal();
        win.window.open = origOpen;
        if (capturedHTML) {
          setProposalHTML(capturedHTML);
          setStep('draft');
          toast.success('Proposal draft ready for review');
        } else {
          toast.error('Could not generate proposal');
        }
      }
    } catch (e) {
      toast.error('Proposal generation error');
    }
    document.body.removeChild(iframe);
  };

  // Export: Print
  const handlePrint = () => {
    const content = draftRef.current?.innerHTML || proposalHTML;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(content);
      w.document.close();
      setTimeout(() => w.print(), 600);
    }
  };

  // Export: Download PDF (via print)
  const handleDownloadPDF = () => {
    handlePrint(); // Browser print dialog allows Save as PDF
    toast('Use "Save as PDF" in the print dialog');
  };

  // Export: Download HTML
  const handleDownloadHTML = () => {
    const content = draftRef.current?.innerHTML || proposalHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Camelot_Proposal_${reportData?.buildingName?.replace(/[^a-zA-Z0-9]/g, '_') || 'draft'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Proposal downloaded');
  };

  // Export: Email — download PDF first, then open Gmail
  const handleEmail = () => {
    // First trigger PDF download so user has the file
    handlePrint();
    // Then open Gmail after a brief delay
    setTimeout(() => {
      const subject = encodeURIComponent(`Proposal of Services — ${reportData?.buildingName || 'Property'} | Camelot Realty Group`);
      const body = encodeURIComponent(
        `Dear Board,\n\nPlease find attached our Proposal of Property Management Services for ${reportData?.buildingName || 'your property'}.\n\n` +
        `We have taken the time to research your building and are confident that Camelot can deliver measurable improvements in operations, transparency, and service quality.\n\n` +
        `We look forward to meeting with you — either in person or via Zoom — to discuss this proposal further.\n\n` +
        `Warm regards,\nDavid A. Goldoff\nPresident\nCamelot Property Management Services Corp.\n(212) 206-9939 x 701 | (646) 523-9068\ndgoldoff@camelot.nyc | www.camelot.nyc\n477 Madison Avenue, 6th Floor, New York, NY 10022`
      );
      window.open(`https://mail.google.com/mail/?view=cm&su=${subject}&body=${body}`, '_blank');
      toast.success('Step 1: Save the proposal as PDF.\nStep 2: Attach it in Gmail.');
    }, 1000);
  };

  const d = reportData;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-camelot-gold rounded-lg flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-camelot-navy font-heading">Instant Proposal</h1>
          <p className="text-sm text-gray-500">Search → Verify → Jackie Report → Draft → Send</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 bg-gray-50 rounded-xl p-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.key === step;
          const isPast = i < stepIndex;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => isPast ? setStep(s.key) : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${
                  isActive ? 'bg-camelot-gold text-white shadow-md' :
                  isPast ? 'bg-camelot-navy/10 text-camelot-navy cursor-pointer hover:bg-camelot-navy/20' :
                  'bg-white text-gray-400'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Search */}
      {step === 'search' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h2 className="text-lg font-bold text-camelot-navy mb-2">Enter Property Address</h2>
          <p className="text-sm text-gray-500 mb-6">We'll pull all available data from NYC open data sources</p>
          <div className="flex gap-3 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="e.g. 1770 Grand Concourse, Bronx"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
            />
            <select
              value={borough}
              onChange={e => setBorough(e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-xl text-sm bg-white"
            >
              <option value="">Auto-detect</option>
              <option value="Manhattan">Manhattan</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Bronx">Bronx</option>
              <option value="Queens">Queens</option>
              <option value="Staten Island">Staten Island</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-4 px-8 py-3 bg-camelot-gold text-white rounded-xl font-semibold text-sm hover:bg-camelot-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Searching...</> : <><Search size={16} /> Search Property</>}
          </button>
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && d && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-camelot-navy">Verify Property Data</h2>
            <button onClick={() => setStep('search')} className="text-sm text-gray-500 hover:text-camelot-gold flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-camelot-cream rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-camelot-gold">{d.units}</div>
              <div className="text-[10px] text-gray-500 uppercase">Units</div>
            </div>
            <div className="bg-camelot-cream rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-camelot-navy">{d.stories}</div>
              <div className="text-[10px] text-gray-500 uppercase">Stories</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${d.violationsOpen > 20 ? 'bg-red-50' : d.violationsOpen > 5 ? 'bg-amber-50' : 'bg-green-50'}`}>
              <div className={`text-2xl font-bold ${d.violationsOpen > 20 ? 'text-red-600' : d.violationsOpen > 5 ? 'text-amber-600' : 'text-green-600'}`}>{d.violationsOpen}</div>
              <div className="text-[10px] text-gray-500 uppercase">Open Violations</div>
            </div>
            <div className="bg-camelot-cream rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-camelot-navy">{d.scoutGrade}</div>
              <div className="text-[10px] text-gray-500 uppercase">Scout Grade</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Address:</span> <strong>{d.address}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">BBL:</span> <strong>{d.bbl || 'N/A'}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Type:</span> <strong>{d.propertyType}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Year Built:</span> <strong>{d.yearBuilt}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Management:</span> <strong>{d.managementCompany || 'Unknown'}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Owner:</span> <strong>{d.registrationOwner || d.dofOwner || 'Unknown'}</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">Proposed Fee:</span> <strong className="text-camelot-gold">${d.monthlyFee.toLocaleString()}/mo (${d.pricePerUnit}/unit)</strong>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-gray-500">ECB Penalties:</span> <strong>${d.ecbPenaltyBalance.toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Confirm data is accurate before proceeding</p>
            <button
              onClick={handleGenerateJackie}
              disabled={loading}
              className="px-6 py-2.5 bg-camelot-gold text-white rounded-xl font-semibold text-sm hover:bg-camelot-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <>Confirm & Generate Jackie <ChevronRight size={14} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Jackie Report Preview */}
      {step === 'jackie' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-camelot-navy">Jackie Report Generated</h2>
            <button onClick={() => setStep('verify')} className="text-sm text-gray-500 hover:text-camelot-gold flex items-center gap-1">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Jackie report ready — {d?.buildingName}</p>
              <p className="text-xs text-green-600">{d?.units} units · {d?.violationsOpen} violations · Scout Grade {d?.scoutGrade} · Fee ${d?.monthlyFee.toLocaleString()}/mo</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const w = window.open('', '_blank');
                if (w) { w.document.write(jackieHTML); w.document.close(); }
              }}
              className="px-4 py-2 bg-camelot-navy/10 text-camelot-navy rounded-lg text-sm font-semibold hover:bg-camelot-navy/20 transition-colors"
            >
              View Full Jackie Report
            </button>
            <button
              onClick={handleGenerateDraft}
              className="px-6 py-2.5 bg-camelot-gold text-white rounded-xl font-semibold text-sm hover:bg-camelot-gold/90 transition-colors flex items-center gap-2 ml-auto"
            >
              Generate Proposal Draft <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Draft Review (editable) */}
      {step === 'draft' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-camelot-navy">Review & Edit Proposal</h2>
            <div className="flex gap-2">
              <button onClick={() => setStep('jackie')} className="text-sm text-gray-500 hover:text-camelot-gold flex items-center gap-1">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setStep('export')}
                className="px-4 py-2 bg-camelot-gold text-white rounded-lg text-sm font-semibold hover:bg-camelot-gold/90 transition-colors flex items-center gap-1"
              >
                Finalize <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">Click any text below to edit it directly. Changes are preserved when you export.</p>
          <div
            ref={draftRef}
            contentEditable
            suppressContentEditableWarning
            className="border-2 border-gray-200 rounded-xl p-1 max-h-[70vh] overflow-y-auto focus:outline-none focus:border-camelot-gold/50"
            style={{ minHeight: '500px' }}
            dangerouslySetInnerHTML={{ __html: proposalHTML }}
          />
        </div>
      )}

      {/* Step 5: Export */}
      {step === 'export' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-camelot-navy mb-2">Proposal Ready</h2>
          <p className="text-sm text-gray-500 mb-6">{d?.buildingName} — {d?.units} units — ${d?.monthlyFee.toLocaleString()}/month</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <button onClick={handlePrint} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Printer size={24} className="text-camelot-navy" />
              <span className="text-xs font-semibold text-camelot-navy">Print</span>
            </button>
            <button onClick={handleDownloadPDF} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <Download size={24} className="text-camelot-gold" />
              <span className="text-xs font-semibold text-camelot-navy">Save as PDF</span>
            </button>
            <button onClick={handleDownloadHTML} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <FileText size={24} className="text-camelot-navy" />
              <span className="text-xs font-semibold text-camelot-navy">Download HTML</span>
            </button>
            <button onClick={handleEmail} className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-200">
              <Mail size={24} className="text-red-500" />
              <span className="text-xs font-semibold text-camelot-navy">Save PDF + Email</span>
            </button>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => setStep('draft')} className="text-sm text-gray-500 hover:text-camelot-gold flex items-center gap-1">
              <Edit3 size={14} /> Edit Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
