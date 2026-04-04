import { useState, useCallback } from 'react';
import { Search, FileText, Download, Mail, Phone, Table2, Link2, Loader2, Eye, Copy, Check, X } from 'lucide-react';
import { buildMasterReport, generateBrochureHTML, generateColdCallerSheet, generateEmailDraft, generateCSVExport, type MasterReportData } from '@/lib/camelot-report';
import { openBrochureForPrint, downloadAsHTML, triggerCSVDownload, copyToClipboard } from '@/lib/pdf-generator';

type EmailType = 'intro' | 'followup' | 'proposal' | 'compliance';

export default function ReportCenter() {
  const [address, setAddress] = useState('');
  const [borough, setBorough] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [data, setData] = useState<MasterReportData | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallerModal, setShowCallerModal] = useState(false);
  const [emailType, setEmailType] = useState<EmailType>('intro');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    if (!address.trim()) return;
    setLoading(true);
    setData(null);
    try {
      setLoadingMsg('Querying HPD violations...');
      await new Promise(r => setTimeout(r, 300));
      setLoadingMsg('Pulling DOF property data...');
      await new Promise(r => setTimeout(r, 200));
      setLoadingMsg('Fetching ACRIS ownership records...');
      const result = await buildMasterReport(address.trim(), borough || undefined);
      setData(result);
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }, [address, borough]);

  const handlePreviewBrochure = () => {
    if (!data) return;
    const html = generateBrochureHTML(data);
    openBrochureForPrint(html, `Camelot-Proposal-${data.buildingName}`);
  };

  const handleDownloadHTML = () => {
    if (!data) return;
    const html = generateBrochureHTML(data);
    downloadAsHTML(html, `Camelot-Proposal-${data.buildingName.replace(/[^a-zA-Z0-9]/g, '-')}.html`);
  };

  const handleCSV = () => {
    if (!data) return;
    const csv = generateCSVExport(data);
    triggerCSVDownload(csv, `Scout-Report-${data.buildingName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const emailDraft = data ? generateEmailDraft(data, emailType) : null;
  const callerSheet = data ? generateColdCallerSheet(data) : '';
  const fmtMoney = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🏰 Report Center</h1>
        <p className="text-gray-500 mt-1">Generate complete management proposals with building intelligence — one search, every output format</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text" placeholder="Enter building address (e.g., 200 E 24th St)"
            value={address} onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C5A55A]/50 focus:border-[#C5A55A]"
          />
          <select value={borough} onChange={e => setBorough(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C5A55A]/50">
            <option value="">Borough</option>
            <option value="manhattan">Manhattan</option>
            <option value="brooklyn">Brooklyn</option>
            <option value="queens">Queens</option>
            <option value="bronx">Bronx</option>
            <option value="staten island">Staten Island</option>
          </select>
          <button onClick={generate} disabled={loading || !address.trim()}
            className="px-6 py-3 bg-[#3D4F5F] text-white rounded-lg hover:bg-[#2d3d4d] disabled:opacity-50 flex items-center gap-2 font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Generate Report
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#C5A55A] mb-4" />
          <p className="text-gray-500 font-medium">{loadingMsg || 'Building your report...'}</p>
          <p className="text-gray-400 text-sm mt-1">HPD • DOB • DOF • LL97 • ACRIS • ECB • Housing Court • Rent Stabilization</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">Market Value</p>
              <p className="text-xl font-bold text-[#C5A55A]">{fmtMoney(data.marketValue)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">Units</p>
              <p className="text-xl font-bold text-gray-900">{data.units || 'N/A'}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">HPD Violations</p>
              <p className={`text-xl font-bold ${data.violationsOpen > 10 ? 'text-red-600' : data.violationsOpen > 0 ? 'text-orange-500' : 'text-green-600'}`}>{data.violationsTotal}</p>
              <p className="text-xs text-gray-400">{data.violationsOpen} open</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">Scout Grade</p>
              <p className={`text-xl font-bold ${data.scoutGrade === 'A' ? 'text-green-600' : data.scoutGrade === 'B' ? 'text-yellow-600' : 'text-gray-500'}`}>{data.scoutGrade}</p>
              <p className="text-xs text-gray-400">{data.scoutScore}/100</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">LL97 Penalty</p>
              <p className={`text-xl font-bold ${data.ll97 && data.ll97.period1Penalty > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.ll97 ? `$${data.ll97.period1Penalty.toLocaleString()}/yr` : 'N/A'}</p>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm text-center">
              <p className="text-xs text-gray-500 uppercase font-medium">Distress</p>
              <p className={`text-xl font-bold ${data.distressLevel === 'critical' || data.distressLevel === 'distressed' ? 'text-red-600' : data.distressLevel === 'stressed' ? 'text-orange-500' : 'text-green-600'}`}>{data.distressLevel.toUpperCase()}</p>
            </div>
          </div>

          {/* Output Buttons */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Output Options</h2>
            <div className="flex flex-wrap gap-3">
              <button onClick={handlePreviewBrochure} className="px-5 py-2.5 bg-[#C5A55A] text-white rounded-lg hover:bg-[#b8983f] font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview & Print PDF
              </button>
              <button onClick={handleDownloadHTML} className="px-5 py-2.5 bg-[#3D4F5F] text-white rounded-lg hover:bg-[#2d3d4d] font-medium flex items-center gap-2">
                <Download className="w-4 h-4" /> Download HTML
              </button>
              <button onClick={() => setShowEmailModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Draft
              </button>
              <button onClick={() => setShowCallerModal(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" /> Cold Caller Sheet
              </button>
              <button onClick={handleCSV} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2">
                <Table2 className="w-4 h-4" /> CSV Export
              </button>
              <button disabled className="px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
                <Link2 className="w-4 h-4" /> CRM Push (Connect HubSpot)
              </button>
            </div>
          </div>

          {/* Building Details */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{data.buildingName}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-400">Address:</span> <span className="font-medium">{data.address}</span></div>
              <div><span className="text-gray-400">Borough:</span> <span className="font-medium">{data.borough}</span></div>
              <div><span className="text-gray-400">Management:</span> <span className="font-medium">{data.managementCompany || 'Self-Managed'}</span></div>
              <div><span className="text-gray-400">Owner (DOF):</span> <span className="font-medium">{data.dofOwner || 'N/A'}</span></div>
              <div><span className="text-gray-400">Year Built:</span> <span className="font-medium">{data.yearBuilt || 'N/A'}</span></div>
              <div><span className="text-gray-400">ECB Penalties:</span> <span className="font-medium text-orange-600">${data.ecbPenaltyBalance.toLocaleString()}</span></div>
              <div><span className="text-gray-400">Last Sale:</span> <span className="font-medium">{data.lastSaleDate ? new Date(data.lastSaleDate).toLocaleDateString() : 'N/A'} — {data.lastSalePrice ? fmtMoney(data.lastSalePrice) : 'N/A'}</span></div>
              <div><span className="text-gray-400">Proposed Fee:</span> <span className="font-medium text-[#C5A55A]">${data.monthlyFee.toLocaleString()}/mo</span></div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm text-center">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">Enter a building address</h3>
          <p className="text-gray-400 mt-1">One search generates your full management proposal + building intelligence report</p>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && emailDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Email Draft</h3>
              <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                {(['intro', 'followup', 'proposal', 'compliance'] as EmailType[]).map(t => (
                  <button key={t} onClick={() => setEmailType(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${emailType === t ? 'bg-[#C5A55A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t === 'intro' ? 'Introduction' : t === 'followup' ? 'Follow-Up' : t === 'proposal' ? 'Proposal' : 'LL97 Compliance'}
                  </button>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Subject</p>
                <p className="text-sm font-medium">{emailDraft.subject}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Body</p>
                <pre className="text-sm whitespace-pre-wrap font-sans text-gray-700">{emailDraft.body}</pre>
              </div>
              <button onClick={() => handleCopy(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`)}
                className="mt-4 px-4 py-2 bg-[#3D4F5F] text-white rounded-lg flex items-center gap-2 font-medium">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cold Caller Modal */}
      {showCallerModal && callerSheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Cold Caller Prep Sheet</h3>
              <button onClick={() => setShowCallerModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <pre className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap font-mono text-gray-700">{callerSheet}</pre>
              <button onClick={() => handleCopy(callerSheet)}
                className="mt-4 px-4 py-2 bg-[#3D4F5F] text-white rounded-lg flex items-center gap-2 font-medium">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
