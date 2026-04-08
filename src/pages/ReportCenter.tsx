import { useState, useCallback } from 'react';
import { Search, FileText, Download, Mail, Phone, Table2, Link2, Loader2, Eye, Copy, Check, X } from 'lucide-react';
import { buildMasterReport, generateBrochureHTML, generateColdCallerSheet, generateEmailDraft, generateCSVExport, type MasterReportData } from '@/lib/camelot-report';
import { generatePitchReport, generatePitchEmail } from '@/lib/pitch-report';
import { generatePitchDeck } from '@/lib/pitch-deck-pptx';
import { openBrochureForPrint, downloadAsHTML, triggerCSVDownload, copyToClipboard } from '@/lib/pdf-generator';
import toast from 'react-hot-toast';

type EmailType = 'intro' | 'followup' | 'proposal' | 'compliance' | 'loyalty';

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
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

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
    const d = getDataWithPhotos();
    if (!d) return;
    const html = generateBrochureHTML(d);
    openBrochureForPrint(html, `Jackie-Report-${d.buildingName}`);
  };

  const handlePreviewPitch = () => {
    const d = getDataWithPhotos();
    if (!d) return;
    const html = generatePitchReport(d);
    openBrochureForPrint(html, `Camelot-Pitch-${d.buildingName}`);
  };

  const handleDownloadPitchHTML = () => {
    const d = getDataWithPhotos();
    if (!d) return;
    const html = generatePitchReport(d);
    downloadAsHTML(html, `Camelot-Pitch-${(d.buildingName || d.address).replace(/[^a-zA-Z0-9]/g, '-')}.html`);
  };

  const handlePitchEmail = () => {
    const d = getDataWithPhotos();
    if (!d) return;
    const email = generatePitchEmail(d);
    copyToClipboard(email);
    toast.success('Pitch email copied to clipboard');
  };

  const handlePitchDeckPPTX = async () => {
    const d = getDataWithPhotos();
    if (!d) return;
    toast.loading('Generating PowerPoint deck...', { id: 'pptx' });
    try {
      await generatePitchDeck(d);
      toast.success('PowerPoint pitch deck downloaded!', { id: 'pptx' });
    } catch (err) {
      console.error('PPTX generation failed:', err);
      toast.error('Failed to generate PowerPoint deck', { id: 'pptx' });
    }
  };

  const handleDownloadHTML = () => {
    const d = getDataWithPhotos();
    if (!d) return;
    const html = generateBrochureHTML(d);
    downloadAsHTML(html, `Jackie-Report-${d.buildingName.replace(/[^a-zA-Z0-9]/g, '-')}.html`);
  };

  const handleCSV = () => {
    if (!data) return;
    const csv = generateCSVExport(data);
    triggerCSVDownload(csv, `Jackie-Export-${data.buildingName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // Photo upload handler — converts files to data URLs and stores them
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploadedPhotos(prev => [...prev, dataUrl]);
        // Also save to localStorage keyed by address
        if (address.trim()) {
          const key = `camelot_photos_${address.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          existing.push(dataUrl);
          localStorage.setItem(key, JSON.stringify(existing));
        }
        toast.success(`Photo uploaded (${file.name})`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = ''; // reset input
  };

  // Load saved photos when address changes
  const loadSavedPhotos = useCallback(() => {
    if (!address.trim()) return;
    const key = `camelot_photos_${address.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (saved.length > 0) setUploadedPhotos(saved);
  }, [address]);

  // Inject uploaded photos into report data before generating
  const getDataWithPhotos = (): MasterReportData | null => {
    if (!data) return null;
    if (uploadedPhotos.length === 0) return data;
    return {
      ...data,
      buildingPhotos: {
        exterior: uploadedPhotos,
        streetView: data.buildingPhotos?.streetView || '',
        satellite: data.buildingPhotos?.satellite || '',
        source: 'Uploaded by Camelot team',
      },
    };
  };

  const emailDraft = data ? generateEmailDraft(data, emailType) : null;
  const callerSheet = data ? generateColdCallerSheet(data) : '';
  const fmtMoney = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jackie</h1>
        <p className="text-gray-500 mt-1">Camelot&rsquo;s AI pitch engine — Property Intelligence Reports, management proposals, and email drafts. One address, every output.</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text" placeholder="Enter building address (e.g., 200 E 24th St)"
            value={address} onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A89035]/50 focus:border-[#A89035]"
          />
          <select value={borough} onChange={e => setBorough(e.target.value)}
            className="px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A89035]/50">
            <option value="">Borough</option>
            <option value="manhattan">Manhattan</option>
            <option value="brooklyn">Brooklyn</option>
            <option value="queens">Queens</option>
            <option value="bronx">Bronx</option>
            <option value="staten island">Staten Island</option>
          </select>
          <button onClick={generate} disabled={loading || !address.trim()}
            className="px-6 py-3 bg-[#3A4B5B] text-white rounded-lg hover:bg-[#2d3d4d] disabled:opacity-50 flex items-center gap-2 font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Run Jackie
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#A89035] mb-4" />
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
              <p className="text-xl font-bold text-[#A89035]">{fmtMoney(data.marketValue)}</p>
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

          {/* Property Visual — Image + Map + Travel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <iframe src={data.latitude && data.longitude ? `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&location=${data.latitude},${data.longitude}&heading=0&pitch=5&fov=80` : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(data.address)}&zoom=18`} width="100%" height="220" style={{border:0}} allowFullScreen loading="lazy" title="Street View" />
              <div className="p-2 text-center text-xs text-gray-400">Street View — {data.address}</div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <iframe src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(data.address)}&zoom=16`} width="100%" height="220" style={{border:0}} allowFullScreen loading="lazy" title="Map" />
              <div className="p-2 text-center text-xs text-gray-400">Location Map</div>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <iframe src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=477+Madison+Avenue+New+York+NY&destination=${encodeURIComponent(data.address)}&mode=driving`} width="100%" height="220" style={{border:0}} allowFullScreen loading="lazy" title="Travel from Camelot HQ" />
              <div className="p-2 text-center text-xs text-gray-400">Travel from Camelot HQ — 477 Madison Ave</div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Jackie Property Intelligence Report</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handlePreviewPitch} className="px-4 py-2 bg-[#0D2240] text-white rounded-lg hover:bg-[#1a3a5c] text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" /> ✨ Pitch Report (5-Page)
                </button>
                <button onClick={handlePreviewBrochure} className="px-4 py-2 bg-[#A89035] text-white rounded-lg hover:bg-[#8A7A2C] text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Full Report (Internal)
                </button>
                <button onClick={handleDownloadPitchHTML} className="px-4 py-2 bg-[#3A4B5B] text-white rounded-lg hover:bg-[#2d3d4d] text-sm font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download Pitch PDF
                </button>
                <button onClick={handlePitchDeckPPTX} className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9] text-sm font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" /> 📊 PowerPoint Deck
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <div><span className="text-gray-400 text-xs uppercase block">Address</span><span className="font-medium">{data.address}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Type</span><span className="font-medium">{data.propertyType || 'Residential'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Units</span><span className="font-medium">{data.units || 'N/A'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Year Built</span><span className="font-medium">{data.yearBuilt || 'N/A'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Market Value</span><span className="font-medium text-[#A89035]">{fmtMoney(data.marketValue)}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Management</span><span className="font-medium">{data.managementCompany || 'Self-Managed'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Management Grade</span><span className={`font-bold ${data.managementGrade === 'A' ? 'text-green-600' : data.managementGrade === 'B' ? 'text-yellow-600' : 'text-red-600'}`}>{data.managementGrade}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Scout Grade</span><span className="font-bold">{data.scoutGrade} ({data.scoutScore}/100)</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                <div><span className="text-gray-400 text-xs uppercase block">HPD Violations</span><span className={`font-medium ${data.violationsOpen > 5 ? 'text-red-600' : 'text-gray-900'}`}>{data.violationsTotal} total / {data.violationsOpen} open</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">ECB Penalties</span><span className="font-medium text-orange-600">${data.ecbPenaltyBalance.toLocaleString()}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">LL97 Penalty</span><span className={`font-medium ${data.ll97 && data.ll97.period1Penalty > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.ll97 ? `$${data.ll97.period1Penalty.toLocaleString()}/yr` : 'N/A'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Distress Level</span><span className={`font-medium ${data.distressLevel === 'critical' || data.distressLevel === 'distressed' ? 'text-red-600' : 'text-green-600'}`}>{data.distressLevel.toUpperCase()} ({data.distressScore}/100)</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Owner (DOF)</span><span className="font-medium">{data.dofOwner || 'N/A'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Last Sale</span><span className="font-medium">{data.lastSaleDate ? new Date(data.lastSaleDate).toLocaleDateString() : 'N/A'} — {data.lastSalePrice ? fmtMoney(data.lastSalePrice) : 'N/A'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Neighborhood</span><span className="font-medium capitalize">{data.neighborhoodName || data.borough || 'NYC'}</span></div>
                <div><span className="text-gray-400 text-xs uppercase block">Proposed Fee</span><span className="font-medium text-[#A89035]">${data.monthlyFee.toLocaleString()}/mo (${data.pricePerUnit}/unit)</span></div>
              </div>
              {data.distressSignals && data.distressSignals.length > 0 && (
                <div className="mb-4">
                  <span className="text-gray-400 text-xs uppercase block mb-2">Distress Signals</span>
                  <div className="flex flex-wrap gap-2">
                    {data.distressSignals.map((s: any, i: number) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">{s.description}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Building Photos</h2>
            <p className="text-xs text-gray-500 mb-3">Upload exterior, lobby, or interior photos to include in the report. Photos are saved per address.</p>
            <div className="flex items-center gap-3 mb-3">
              <label className="cursor-pointer bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Photos
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
              {uploadedPhotos.length > 0 && (
                <span className="text-xs text-gray-500">{uploadedPhotos.length} photo(s) uploaded</span>
              )}
              {uploadedPhotos.length > 0 && (
                <button
                  onClick={() => {
                    setUploadedPhotos([]);
                    if (address.trim()) {
                      const key = `camelot_photos_${address.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                      localStorage.removeItem(key);
                    }
                    toast.success('Photos cleared');
                  }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >Clear all</button>
              )}
            </div>
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {uploadedPhotos.map((url, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200 h-20">
                    <img src={url} alt={`Building photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const updated = uploadedPhotos.filter((_, idx) => idx !== i);
                        setUploadedPhotos(updated);
                        if (address.trim()) {
                          const key = `camelot_photos_${address.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                          localStorage.setItem(key, JSON.stringify(updated));
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <button onClick={handlePreviewPitch} className="px-4 py-3 bg-[#0D2240] text-white rounded-lg hover:bg-[#1a3a5c] font-medium flex flex-col items-center gap-1 text-sm">
                <Eye className="w-5 h-5" /> ✨ Pitch Report
              </button>
              <button onClick={handlePreviewBrochure} className="px-4 py-3 bg-[#A89035] text-white rounded-lg hover:bg-[#8A7A2C] font-medium flex flex-col items-center gap-1 text-sm">
                <Eye className="w-5 h-5" /> Full Report
              </button>
              <button onClick={handleDownloadPitchHTML} className="px-4 py-3 bg-[#3A4B5B] text-white rounded-lg hover:bg-[#2d3d4d] font-medium flex flex-col items-center gap-1 text-sm">
                <Download className="w-5 h-5" /> Download Pitch
              </button>
              <button onClick={() => setShowEmailModal(true)} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex flex-col items-center gap-1 text-sm">
                <Mail className="w-5 h-5" /> Email Draft
              </button>
              <button onClick={() => setShowCallerModal(true)} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex flex-col items-center gap-1 text-sm">
                <Phone className="w-5 h-5" /> Send to Carl
              </button>
              <button onClick={handleCSV} className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex flex-col items-center gap-1 text-sm">
                <Table2 className="w-5 h-5" /> CSV Export
              </button>
              <button onClick={async () => {
                try {
                  toast.loading('Pushing to HubSpot...');
                  // Use server-side proxy to avoid CORS issues
                  const contactRes = await fetch('/api/hubspot/contacts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ properties: {
                      company: data.buildingName || data.address,
                      address: data.address,
                      city: 'New York',
                      state: data.borough || 'NY',
                      hs_lead_status: 'NEW',
                      notes_last_contacted: `Camelot OS Grade: ${data.scoutGrade} (${data.scoutScore}/100) | Units: ${data.units} | Violations: ${data.violationsTotal} (${data.violationsOpen} open) | Mgmt: ${data.managementCompany || 'Unknown'} | Market Value: $${data.marketValue.toLocaleString()} | Proposed Fee: $${data.monthlyFee}/mo`,
                    }}),
                  });
                  if (!contactRes.ok) { const err = await contactRes.json(); throw new Error(err.message || err.error || contactRes.statusText); }
                  const contact = await contactRes.json();
                  const dealRes = await fetch('/api/hubspot/deals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ properties: {
                      dealname: `Camelot Management — ${data.buildingName || data.address}`,
                      pipeline: 'default',
                      dealstage: 'appointmentscheduled',
                      amount: String(data.annualFee),
                      description: `${data.units} units | ${data.propertyType} | ${data.address} | Grade: ${data.scoutGrade} | Violations: ${data.violationsOpen} open | Distress: ${data.distressLevel}`,
                    }, associations: [{ to: { id: contact.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }] }),
                  });
                  if (!dealRes.ok) { const err = await dealRes.json(); throw new Error(err.message || err.error || dealRes.statusText); }
                  toast.dismiss();
                  toast.success(`Pushed to HubSpot — Contact #${contact.id} + Deal created`);
                } catch (err: any) {
                  toast.dismiss();
                  toast.error(`HubSpot error: ${err.message || 'Unknown error'}`);
                }
              }} className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium flex flex-col items-center gap-1 text-sm">
                <Link2 className="w-5 h-5" /> Push to HubSpot
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
              <div><span className="text-gray-400">Proposed Fee:</span> <span className="font-medium text-[#A89035]">${data.monthlyFee.toLocaleString()}/mo</span></div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="bg-white rounded-xl border p-12 shadow-sm text-center">
          <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">Enter a building address to run Jackie</h3>
          <p className="text-gray-400 mt-1">Jackie pulls live NYC data, generates your Property Intelligence Report, management proposal, email drafts, and cold caller sheet</p>
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
                {(['loyalty', 'intro', 'followup', 'proposal', 'compliance'] as EmailType[]).map(t => (
                  <button key={t} onClick={() => setEmailType(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${emailType === t ? 'bg-[#A89035] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t === 'loyalty' ? 'Report Intro' : t === 'intro' ? 'Introduction' : t === 'followup' ? 'Follow-Up' : t === 'proposal' ? 'Proposal' : 'LL97 Compliance'}
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
                className="mt-4 px-4 py-2 bg-[#3A4B5B] text-white rounded-lg flex items-center gap-2 font-medium">
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
                className="mt-4 px-4 py-2 bg-[#3A4B5B] text-white rounded-lg flex items-center gap-2 font-medium">
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
