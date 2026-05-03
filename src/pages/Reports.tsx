import { useState, useCallback } from 'react';
import { Search, FileText, Download, Loader2, Eye, Share2, Clock } from 'lucide-react';
import { fetchFullBuildingReport } from '@/lib/nyc-api';
import IntelligenceReportPDF from '@/components/IntelligenceReportPDF';
import LeadCaptureModal from '@/components/LeadCaptureModal';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';

interface GeneratedReport {
  id: string;
  address: string;
  data: any;
  generatedAt: string;
}

function toReportData(address: string, raw: any): any {
  return {
    address,
    borough: raw.dof?.borough || '',
    reportId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    ...raw,
  };
}

export default function Reports() {
  const [address, setAddress] = useState('');
  const [borough, setBorough] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportAddress, setReportAddress] = useState('');
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [downloading, setDownloading] = useState(false);

  const generateReport = useCallback(async () => {
    if (!address.trim()) return;
    setLoading(true);
    setReportData(null);
    try {
      const data = await fetchFullBuildingReport(address, borough || undefined);
      setReportData(data);
      setReportAddress(address);
      const report: GeneratedReport = {
        id: crypto.randomUUID(),
        address,
        data,
        generatedAt: new Date().toISOString(),
      };
      setHistory(prev => [report, ...prev]);
    } catch (err) {
      console.error('Report generation failed:', err);
      toast.error('Report generation failed. Verify the address and borough, then try again.');
    } finally {
      setLoading(false);
    }
  }, [address, borough]);

  const handleDownloadPDF = useCallback(async () => {
    if (!reportData) return;
    if (!leadCaptured) {
      setShowLeadCapture(true);
      return;
    }
    setDownloading(true);
    try {
      const blob = await pdf(
        <IntelligenceReportPDF data={toReportData(reportAddress, reportData)} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Camelot-Intelligence-Report-${reportAddress.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
      toast.error('PDF download failed. Please regenerate the report and try again.');
    } finally {
      setDownloading(false);
    }
  }, [reportData, reportAddress, leadCaptured]);

  const handleLeadCaptured = () => {
    setLeadCaptured(true);
    setShowLeadCapture(false);
  };

  const handleTeamBypass = () => {
    setLeadCaptured(true);
    setShowLeadCapture(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Building Intelligence Reports</h1>
        <p className="text-gray-500 mt-1">Generate professional building intelligence reports from live NYC data</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#C5A55A]" />
          Generate Report
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter building address (e.g., 200 E 24th St)"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateReport()}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C5A55A]/50 focus:border-[#C5A55A]"
          />
          <select
            value={borough}
            onChange={e => setBorough(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C5A55A]/50"
          >
            <option value="">Borough (optional)</option>
            <option value="manhattan">Manhattan</option>
            <option value="brooklyn">Brooklyn</option>
            <option value="queens">Queens</option>
            <option value="bronx">Bronx</option>
            <option value="staten island">Staten Island</option>
          </select>
          <button
            onClick={generateReport}
            disabled={loading || !address.trim()}
            className="px-6 py-3 bg-[#0f1629] text-white rounded-lg hover:bg-[#1a2340] disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Report
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
          <span className="px-2 py-0.5 bg-[#C5A55A]/10 text-[#C5A55A] rounded font-medium">$200 per report</span>
          <span>— Coming Soon (Stripe integration)</span>
        </div>
      </div>

      {/* Report Preview */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#C5A55A] mb-4" />
          <p className="text-gray-500 font-medium">Pulling data from 8 NYC agencies...</p>
          <p className="text-gray-400 text-sm mt-1">HPD • DOB • DOF • LL97 • ACRIS • ECB • Housing Court • Rent Stabilization</p>
        </div>
      )}

      {reportData && !loading && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-[#0f1629] text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Building Intelligence Report</h2>
              <p className="text-gray-300 mt-1">{reportAddress}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-4 py-2 bg-[#C5A55A] text-[#0f1629] rounded-lg hover:bg-[#d4b56a] font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Property Overview */}
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Market Value</p>
              <p className="text-xl font-bold text-gray-900">{reportData.dof?.marketValue ? `$${(reportData.dof.marketValue / 1e6).toFixed(1)}M` : 'To verify'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Units</p>
              <p className="text-xl font-bold text-gray-900">{reportData.dof?.units || 'To verify'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Year Built</p>
              <p className="text-xl font-bold text-gray-900">{reportData.dof?.yearBuilt || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Stories</p>
              <p className="text-xl font-bold text-gray-900">{reportData.dof?.stories || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">HPD Violations</p>
              <p className={`text-xl font-bold ${(reportData.violations?.total || 0) > 10 ? 'text-red-600' : (reportData.violations?.total || 0) > 0 ? 'text-orange-500' : 'text-green-600'}`}>{reportData.violations?.total ?? 'To verify'}</p>
              <p className="text-xs text-gray-400">{reportData.violations?.open ?? 'To verify'} open</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">ECB Violations</p>
              <p className={`text-xl font-bold ${(reportData.ecb?.count || 0) > 0 ? 'text-orange-600' : 'text-green-600'}`}>{reportData.ecb?.count ?? 'To verify'}</p>
              <p className="text-xs text-gray-400">${(reportData.ecb?.totalPenaltyBalance || 0).toLocaleString()} penalties</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">DOB Permits</p>
              <p className="text-xl font-bold text-blue-600">{reportData.permits?.count ?? 'To verify'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Energy Star</p>
              <p className="text-xl font-bold text-green-600">{reportData.energy?.energyStarScore ?? 'N/A'}</p>
            </div>
          </div>

          {/* Registration & Building Details */}
          <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {reportData.registration?.owner && (
              <div><span className="text-gray-400">Owner:</span> <span className="font-medium">{reportData.registration.owner}</span></div>
            )}
            {reportData.registration?.managementCompany && (
              <div><span className="text-gray-400">Management:</span> <span className="font-medium">{reportData.registration.managementCompany}</span></div>
            )}
            {reportData.dof?.owner && (
              <div><span className="text-gray-400">DOF Owner:</span> <span className="font-medium">{reportData.dof.owner}</span></div>
            )}
            {reportData.dof?.bbl && (
              <div><span className="text-gray-400">BBL:</span> <span className="font-medium">{reportData.dof.bbl}</span></div>
            )}
            {reportData.dof?.buildingClass && (
              <div><span className="text-gray-400">Building Class:</span> <span className="font-medium">{reportData.dof.buildingClass}</span></div>
            )}
            {reportData.dof?.taxClass && (
              <div><span className="text-gray-400">Tax Class:</span> <span className="font-medium">{reportData.dof.taxClass}</span></div>
            )}
            {reportData.rentStabilization?.isStabilized && (
              <div className="col-span-2"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">📋 Rent Stabilized</span></div>
            )}
            {reportData.litigation?.hasActive && (
              <div className="col-span-2"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">⚖️ Active Housing Litigation — {reportData.litigation.count} case(s)</span></div>
            )}
          </div>

          {/* Ownership */}
          {reportData.acris && (reportData.acris.deeds || []).length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Ownership History</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {reportData.acris.lastSaleDate && (
                  <p className="text-sm"><span className="font-medium">Last Sale:</span> {new Date(reportData.acris.lastSaleDate).toLocaleDateString()} — ${reportData.acris.lastSalePrice?.toLocaleString()}</p>
                )}
                {reportData.acris.lastSaleBuyer && (
                  <p className="text-sm"><span className="font-medium">Buyer:</span> {reportData.acris.lastSaleBuyer}</p>
                )}
                {reportData.acris.lastSaleSeller && (
                  <p className="text-sm"><span className="font-medium">Seller:</span> {reportData.acris.lastSaleSeller}</p>
                )}
                <p className="text-sm text-gray-500">{(reportData.acris.deeds || []).length} deed(s), {(reportData.acris.mortgages || []).length} mortgage(s) on record</p>
              </div>
            </div>
          )}

          {/* Litigation */}
          {reportData.litigation?.hasActive && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-700">⚖️ Active Housing Litigation — {reportData.litigation.count} case(s)</p>
              </div>
            </div>
          )}

          {/* Rent Stabilization */}
          {reportData.rentStabilization?.isStabilized && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-700">📋 Rent Stabilized Building</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Report History
          </h2>
          <div className="space-y-2">
            {history.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{r.address}</p>
                  <p className="text-xs text-gray-400">{new Date(r.generatedAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => { setReportData(r.data); setReportAddress(r.address); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-sm text-[#C5A55A] hover:text-[#b8983f] font-medium flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm text-center">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No reports generated yet</h3>
          <p className="text-gray-400 mt-1">Enter a building address above to generate a full intelligence report</p>
        </div>
      )}

      {/* Lead Capture Modal */}
      {showLeadCapture && (
        <LeadCaptureModal
          reportId={history[0]?.id || ''}
          address={reportAddress}
          onSubmit={() => handleLeadCaptured()}
          onBypass={handleTeamBypass}
          onClose={() => setShowLeadCapture(false)}
        />
      )}
    </div>
  );
}
