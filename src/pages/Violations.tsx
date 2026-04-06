import { useState, useCallback } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { searchViolations, type ViolationSummary, type ViolationResult } from '@/lib/nyc-violations';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Shield, Search, Loader2, RefreshCw,
  AlertCircle, Clock, DollarSign, Users, Calendar, FileDown, Printer, Mail,
  Building2, MapPin, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

const BOROUGHS = ['MANHATTAN', 'BROOKLYN', 'BRONX', 'QUEENS', 'STATEN ISLAND'];

function SeverityBadge({ level, label }: { level: number; label?: string }) {
  const config: Record<number, { bg: string; text: string }> = {
    3: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
    2: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400' },
    1: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400' },
    0: { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-400' },
  };
  const c = config[level] || config[0];
  return <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', c.bg, c.text)}>{label || `Level ${level}`}</span>;
}

function StatCard({ icon: Icon, label, value, sub, color = 'gold' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  const borders: Record<string, string> = {
    gold: 'border-camelot-gold/30', red: 'border-red-500/30',
    orange: 'border-orange-500/30', green: 'border-green-500/30', blue: 'border-blue-500/30',
  };
  return (
    <div className={cn('bg-camelot-navy-light rounded-lg p-4 border', borders[color] || borders.gold)}>
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-1"><Icon size={14} /><span>{label}</span></div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Violations() {
  const [address, setAddress] = useState('');
  const [borough, setBorough] = useState('BROOKLYN');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ViolationSummary | null>(null);
  const [filterSource, setFilterSource] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterOpen, setFilterOpen] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!address.trim()) { toast.error('Enter an address'); return; }
    setIsSearching(true);
    setResult(null);
    try {
      const data = await searchViolations(address.trim(), borough);
      setResult(data);
      toast.success(`Found ${data.totalFound} violations (${data.totalOpen} open)`);
    } catch (err: any) {
      toast.error('Search failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  }, [address, borough]);

  const filteredViolations = (result?.violations || []).filter(v => {
    if (filterOpen && !v.isOpen) return false;
    if (filterSource !== 'all' && v.source !== filterSource) return false;
    if (filterSeverity !== 'all' && String(v.severityLevel) !== filterSeverity) return false;
    if (searchText && !v.description?.toLowerCase().includes(searchText.toLowerCase()) && !v.violationId?.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const generatePDF = () => {
    if (!result) return;
    const openV = filteredViolations.filter(v => v.isOpen);
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '@page{margin:.6in;size:letter}'
      + 'body{font-family:Arial,sans-serif;font-size:11px;color:#222;line-height:1.4}'
      + '.hdr{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:24px;margin:-.6in -.6in 16px -.6in}'
      + '.hdr h1{margin:0;font-size:22px;color:#c5a253;letter-spacing:1px}'
      + '.hdr h2{margin:4px 0 0;font-size:13px;font-weight:400;color:#ccc}'
      + '.hdr .meta{margin-top:10px;font-size:10px;color:#aaa}'
      + 'h2{color:#1a1a2e;border-bottom:2px solid #c5a253;padding-bottom:4px;margin-top:20px;font-size:14px}'
      + '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}'
      + '.box{background:#f8f6f0;border-left:3px solid #c5a253;padding:8px 10px}'
      + '.box .l{font-size:9px;color:#666;text-transform:uppercase}.box .v{font-size:18px;font-weight:700;color:#1a1a2e}'
      + '.red{border-left-color:#dc3545}.org{border-left-color:#fd7e14}'
      + 'table{width:100%;border-collapse:collapse;margin:8px 0;font-size:9px}'
      + 'th{background:#1a1a2e;color:#fff;padding:4px 6px;text-align:left;font-weight:600}'
      + 'td{padding:3px 6px;border-bottom:1px solid #eee;vertical-align:top}'
      + 'tr:nth-child(even) td{background:#fafafa}'
      + '.badge{display:inline-block;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:700;color:#fff}'
      + '.bc{background:#dc3545}.bb{background:#fd7e14}.ba{background:#ffc107;color:#222}.bd{background:#0d6efd}.be{background:#6c757d}'
      + '.overdue{color:#dc3545;font-weight:700}'
      + '.players{margin:10px 0;columns:3;font-size:10px}'
      + '.footer{margin-top:20px;padding-top:10px;border-top:2px solid #c5a253;font-size:8px;color:#888}'
      + '.footer .co{color:#c5a253;font-weight:700}'
      + '</style></head><body>'
      + '<div class="hdr">'
      + '<div style="font-size:10px;color:#c5a253;font-weight:700;letter-spacing:2px">CAMELOT PROPERTY MANAGEMENT SERVICES CORP.</div>'
      + '<h1>VIOLATION &amp; RESOLUTION REPORT</h1>'
      + `<h2>${result.address} \u2014 ${result.borough}</h2>`
      + `<div class="meta">Report Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>`
      + '</div>'
      + '<h2>EXECUTIVE SUMMARY</h2>'
      + '<div class="grid">'
      + `<div class="box red"><div class="l">Open Violations</div><div class="v">${result.totalOpen}</div></div>`
      + `<div class="box red"><div class="l">Class C (Critical)</div><div class="v">${result.hpdClassC}</div></div>`
      + `<div class="box org"><div class="l">Overdue</div><div class="v">${result.overdue}</div></div>`
      + `<div class="box"><div class="l">Est. Cost</div><div class="v">$${result.costLow.toLocaleString()} - $${result.costHigh.toLocaleString()}</div></div>`
      + '</div>'
      + '<div class="grid">'
      + `<div class="box"><div class="l">HPD Open</div><div class="v">${result.hpdOpen}</div></div>`
      + `<div class="box"><div class="l">DOB Open</div><div class="v">${result.dobOpen}</div></div>`
      + `<div class="box"><div class="l">ECB Open</div><div class="v">${result.ecbOpen}</div></div>`
      + `<div class="box"><div class="l">Total Found</div><div class="v">${result.totalFound}</div></div>`
      + '</div>'
      + '<h2>PLAYERS &amp; PROFESSIONALS NEEDED</h2>'
      + `<div class="players">${result.players.map(p => '<div>\u2022 ' + p + '</div>').join('')}</div>`
      + `<h2>OPEN VIOLATIONS (${openV.length})</h2>`
      + '<table><tr><th>#</th><th>Source</th><th>Class</th><th>Unit</th><th>Description</th><th>Deadline</th><th>Est. Cost</th><th>Players</th></tr>'
      + openV.slice(0,150).map((v: any, i: number) =>
        `<tr><td>${i+1}</td>`
        + `<td><span class="badge ${v.source==='HPD'?(v.violationClass==='C'?'bc':v.violationClass==='B'?'bb':'ba'):v.source==='DOB'?'bd':'be'}">${v.source}</span></td>`
        + `<td>${v.violationClass}</td><td>${v.unit||'Bldg'}</td>`
        + `<td>${(v.description||'').substring(0,100)}</td>`
        + `<td>${v.cureDeadline?(v.cureDeadline+(v.isOverdue?' <span class="overdue">OVERDUE</span>':'')):'-'}</td>`
        + `<td>$${v.costLow.toLocaleString()}-$${v.costHigh.toLocaleString()}</td>`
        + `<td>${v.players.join(', ')}</td></tr>`
      ).join('')
      + '</table>'
      + (openV.length>150?`<p style="color:#888;text-align:center">Showing 150 of ${openV.length}</p>`:'')
      + '<div class="footer">'
      + '<div class="co">CAMELOT PROPERTY MANAGEMENT SERVICES CORP.</div>'
      + '501 Madison Avenue, Suite 1400 | New York, NY 10022 | (212) 206-9939 | www.camelot.nyc<br>'
      + 'Generated from NYC Open Data (HPD, DOB, ECB). Verify details with issuing agency.<br>'
      + `Report generated: ${new Date().toISOString().substring(0,19)} UTC`
      + '</div></body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    toast.success('Report opened — use Print to save as PDF, email, or print');
  };

  const emailReport = () => {
    if (!result) return;
    const subject = encodeURIComponent('Violation & Resolution Report: ' + result.address);
    const body = encodeURIComponent(
      'Violation & Resolution Report\n' + result.address + ', ' + result.borough + '\n\n'
      + 'Open Violations: ' + result.totalOpen + '\n'
      + 'Class C (Critical): ' + result.hpdClassC + '\n'
      + 'Class B (Hazardous): ' + result.hpdClassB + '\n'
      + 'Class A: ' + result.hpdClassA + '\n'
      + 'DOB: ' + result.dobOpen + ' | ECB: ' + result.ecbOpen + '\n'
      + 'Overdue: ' + result.overdue + '\n'
      + 'Est. Resolution Cost: $' + result.costLow.toLocaleString() + ' - $' + result.costHigh.toLocaleString() + '\n'
      + 'Players Needed: ' + result.players.join(', ') + '\n\n'
      + '— Camelot Property Management Services Corp.'
    );
    window.open('mailto:?subject=' + subject + '&body=' + body);
    toast.success('Email draft opened');
  };

  const exportCSV = () => {
    if (!result) return;
    const rows = [['Source', 'Class', 'Unit', 'Description', 'Status', 'Overdue', 'Deadline', 'Cost Low', 'Cost High', 'Players']];
    for (const v of filteredViolations) {
      rows.push([v.source, v.violationClass, v.unit, `"${(v.description || '').replace(/"/g, '""').substring(0, 200)}"`, v.status, v.isOverdue ? 'YES' : '', v.cureDeadline || '', String(v.costLow), String(v.costHigh), `"${v.players.join(', ')}"`]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violations-${result.address.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-camelot-gold" size={28} />
          Violation & Resolution Center
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Search any NYC property to pull violations, analyze severity, and generate resolution reports
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-camelot-navy-light rounded-xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-gray-400 text-xs mb-1 block">Property Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. 533 Washington Avenue"
                className="w-full pl-10 pr-4 py-3 bg-camelot-navy border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-camelot-gold/50 outline-none text-lg"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="text-gray-400 text-xs mb-1 block">Borough</label>
            <select
              value={borough}
              onChange={e => setBorough(e.target.value)}
              className="w-full px-4 py-3 bg-camelot-navy border border-white/10 rounded-lg text-white outline-none text-lg"
            >
              {BOROUGHS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full md:w-auto px-8 py-3 bg-camelot-gold text-camelot-navy font-bold rounded-lg hover:bg-camelot-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        {isSearching && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            <Loader2 size={20} className="animate-spin inline mr-2" />
            Pulling violations from HPD, DOB, and ECB databases...
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Header */}
          <div className="bg-camelot-navy-light rounded-xl p-4 border border-camelot-gold/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{result.address}</h2>
                <p className="text-gray-400 text-sm">{result.borough} · Scanned {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 text-sm">
                  <Printer size={14} /> PDF Report
                </button>
                <button onClick={emailReport} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 text-sm">
                  <Mail size={14} /> Email
                </button>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 text-sm">
                  <FileDown size={14} /> CSV
                </button>
                <button onClick={handleSearch} className="flex items-center gap-2 px-4 py-2 bg-camelot-gold/20 text-camelot-gold rounded-lg hover:bg-camelot-gold/30 text-sm">
                  <RefreshCw size={14} /> Re-scan
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatCard icon={AlertTriangle} label="Total Found" value={result.totalFound.toLocaleString()} color="gold" />
              <StatCard icon={AlertCircle} label="Open" value={result.totalOpen.toLocaleString()} color="red" />
              <StatCard icon={Shield} label="Class C" value={result.hpdClassC} sub="Critical" color="red" />
              <StatCard icon={Shield} label="Class B" value={result.hpdClassB} sub="Hazardous" color="orange" />
              <StatCard icon={Shield} label="Class A" value={result.hpdClassA} sub="Non-hazardous" color="gold" />
              <StatCard icon={Clock} label="Overdue" value={result.overdue} color="red" />
              <StatCard icon={DollarSign} label="Est. Low" value={formatCurrency(result.costLow)} color="gold" />
              <StatCard icon={DollarSign} label="Est. High" value={formatCurrency(result.costHigh)} color="orange" />
            </div>
          </div>

          {/* Players Needed */}
          {result.players.length > 0 && (
            <div className="bg-camelot-navy-light rounded-lg p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Users size={14} /> Players Needed for Resolution</h3>
              <div className="flex flex-wrap gap-2">
                {result.players.map(p => (
                  <span key={p} className="px-3 py-1 bg-camelot-gold/10 border border-camelot-gold/20 rounded-full text-xs text-camelot-gold">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter violations..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-camelot-navy-light border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:border-camelot-gold/50 outline-none"
              />
            </div>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="px-3 py-2 bg-camelot-navy-light border border-white/10 rounded text-sm text-white outline-none">
              <option value="all">All Sources</option>
              <option value="HPD">HPD</option>
              <option value="DOB">DOB</option>
              <option value="ECB">ECB</option>
            </select>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-2 bg-camelot-navy-light border border-white/10 rounded text-sm text-white outline-none">
              <option value="all">All Severity</option>
              <option value="3">Class C (Critical)</option>
              <option value="2">Class B / DOB / ECB</option>
              <option value="1">Class A</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={filterOpen} onChange={e => setFilterOpen(e.target.checked)} className="rounded" />
              Open only
            </label>
            <span className="text-gray-500 text-sm">{filteredViolations.length} violations</span>
          </div>

          {/* Violation Table */}
          <div className="bg-camelot-navy-light rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-16">Source</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-20">Class</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-20">Unit</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-24">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-28">Deadline</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-32">Est. Cost</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium w-40">Players</th>
                </tr>
              </thead>
              <tbody>
                {filteredViolations.slice(0, 200).map((v, i) => (
                  <tr
                    key={`${v.source}-${v.violationId}-${i}`}
                    className={cn(
                      'border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors',
                      v.isOverdue && v.isOpen && 'bg-red-500/5'
                    )}
                    onClick={() => setExpandedId(expandedId === `${v.source}-${v.violationId}-${i}` ? null : `${v.source}-${v.violationId}-${i}`)}
                  >
                    <td className="px-4 py-2">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                        v.source === 'HPD' ? 'bg-purple-500/20 text-purple-400' :
                        v.source === 'DOB' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'
                      )}>{v.source}</span>
                    </td>
                    <td className="px-4 py-2"><SeverityBadge level={v.severityLevel} label={v.violationClass} /></td>
                    <td className="px-4 py-2 text-gray-300 text-xs">{v.unit || 'Bldg'}</td>
                    <td className="px-4 py-2 text-gray-300 text-xs max-w-xs truncate">{v.description?.substring(0, 100)}</td>
                    <td className="px-4 py-2">
                      <span className={cn('text-xs font-medium', v.isOpen ? 'text-red-400' : 'text-green-400')}>
                        {v.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {v.cureDeadline ? (
                        <span className={cn(v.isOverdue ? 'text-red-400 font-bold' : 'text-gray-400')}>
                          {v.cureDeadline} {v.isOverdue && '⚠️'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-300 text-xs">{formatCurrency(v.costLow)} - {formatCurrency(v.costHigh)}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{v.players?.slice(0, 2).join(', ')}{v.players?.length > 2 ? ` +${v.players.length - 2}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredViolations.length > 200 && (
              <div className="px-4 py-3 text-center text-gray-400 text-sm border-t border-white/10">
                Showing 200 of {filteredViolations.length} violations
              </div>
            )}
            {filteredViolations.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">No violations match your filters</div>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !isSearching && (
        <div className="text-center py-16 text-gray-500">
          <Building2 size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">Enter a property address and borough above</p>
          <p className="text-sm mt-2">We'll pull all HPD, DOB, and ECB violations from NYC Open Data in real-time</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['533 Washington Avenue', '538 Pacific Street', '555 Pacific Street'].map(addr => (
              <button
                key={addr}
                onClick={() => { setAddress(addr); setBorough('BROOKLYN'); }}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400 hover:text-camelot-gold hover:border-camelot-gold/30 transition-colors"
              >
                {addr}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
