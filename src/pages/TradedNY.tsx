/**
 * TradedNY.tsx — dedicated Traded NY deal-flow tracker.
 *
 * David (July 31 2026): TradedNY had a database behind it but no face on the
 * site. This page is the face. It tracks sales, dispositions, 1031 exchanges,
 * and foreign-investor acquisitions of rental/multifamily property surfaced
 * on the Traded NY feed — every closed deal is a new owner who needs a
 * manager, and every new owner is a Camelot pitch.
 *
 * Phase 1 (superseded): manual/paste tracking, stored in browser localStorage.
 * Phase 2 (this version): real Supabase-backed storage (see
 *   supabase/migrations/013_traded_ny.sql), buyer + seller fields, and
 *   scaffolding for the next two steps:
 *     - automated feed ingestion from traded.co (backend job, not yet wired)
 *     - "Get contact info" (Apollo/Prospeo enrichment) and "Save to HubSpot"
 *       actions per deal (UI present below, backend calls not yet wired —
 *       both need live Traded.co / HubSpot write access first)
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpRight, Crown, Newspaper, Plus, Search, Share2, Target, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTradedDeals, type NewTradedDealInput } from '@/hooks/useTradedDeals';

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island', 'Westchester', 'Long Island', 'New Jersey', 'Connecticut'];
const DEAL_TYPES = ['Sold', 'In Contract', 'Loan / Refi', '1031 Exchange', 'Foreign Buyer', 'Receivership / Distress', 'New Development'];

const emptyForm = {
  address: '', borough: 'Manhattan', dealType: 'Sold', price: '', units: '',
  buyerName: '', buyerCompany: '', sellerName: '', sellerCompany: '',
  broker: '', sourceUrl: '', notes: '',
};

export default function TradedNY() {
  const { deals, loading, error, addDeal, removeDeal } = useTradedDeals();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const stats = {
    total: deals.length,
    hot: deals.filter((d) => d.score >= 60).length,
    withContact: deals.filter((d) => d.buyerName.trim() || d.sellerName.trim()).length,
  };

  const submit = async () => {
    setSubmitting(true);
    const input: NewTradedDealInput = {
      address: form.address,
      borough: form.borough,
      dealType: form.dealType,
      price: form.price,
      units: parseInt(form.units, 10) || 0,
      buyerName: form.buyerName,
      buyerCompany: form.buyerCompany,
      sellerName: form.sellerName,
      sellerCompany: form.sellerCompany,
      broker: form.broker,
      sourceUrl: form.sourceUrl,
      notes: form.notes,
    };
    const ok = await addDeal(input);
    setSubmitting(false);
    if (ok) setForm((f) => ({ ...emptyForm, borough: f.borough, dealType: f.dealType }));
  };

  // Placeholder actions — the underlying Apollo/Prospeo enrichment call and
  // HubSpot contact/company/deal sync are not wired up yet (need live
  // Traded.co ingestion + confirmed HubSpot write access first).
  const getContactInfo = (address: string) => {
    toast('Contact enrichment (Apollo/Prospeo) is coming soon — not wired up yet.', { icon: '🔍' });
    void address;
  };
  const saveToHubSpot = (address: string) => {
    toast('HubSpot sync is coming soon — write access needs to be confirmed first.', { icon: '🟠' });
    void address;
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED]">
      <div className="bg-white border-b border-slate-200 px-8 py-7">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-camelot-gold/15 text-camelot-gold flex items-center justify-center">
            <Newspaper size={24} />
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-camelot-gold font-bold">Scout — Deal Flow</div>
            <h1 className="font-heading text-3xl text-slate-950">Traded NY</h1>
          </div>
        </div>
        <p className="text-slate-600 mt-4 max-w-4xl leading-relaxed">
          Every building that trades needs a manager — and the new owner hasn&rsquo;t signed with one yet.
          Track sales, dispositions, 1031 exchanges, and foreign-investor acquisitions from the
          {' '}<a href="https://traded.co/new-york/" target="_blank" rel="noopener" className="text-camelot-gold font-semibold underline">Traded NY feed</a>{' '}
          here: each deal gets a lead score and is saved to the live database. Automated feed ingestion
          and one-click buyer/seller contact lookup + HubSpot sync are next — today, add deals as you spot them.
        </p>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
        )}
      </div>

      <main className="px-8 py-8 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Deals Tracked', value: stats.total, note: 'From the Traded NY feed' },
            { label: 'Hot Leads (60+)', value: stats.hot, note: 'Scored on the weighted model' },
            { label: 'With Buyer/Seller Contact', value: stats.withContact, note: 'Ready for outreach' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-3xl font-bold text-camelot-gold">{loading ? '—' : s.value}</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{s.label}</div>
              <div className="text-xs text-slate-500">{s.note}</div>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 mb-1 flex items-center gap-2"><Plus size={18} className="text-camelot-gold" /> Track a Traded Deal</h2>
          <p className="text-xs text-slate-500 mb-4">Paste the deal from traded.co — address is the only required field.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Property address *" className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
            <select value={form.borough} onChange={(e) => setForm((f) => ({ ...f, borough: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
              {BOROUGHS.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select value={form.dealType} onChange={(e) => setForm((f) => ({ ...f, dealType: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
              {DEAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price (e.g., $14.5M)" className="border rounded-lg px-3 py-2 text-sm" />
            <input value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))} placeholder="Units" className="border rounded-lg px-3 py-2 text-sm" />

            <input value={form.buyerName} onChange={(e) => setForm((f) => ({ ...f, buyerName: e.target.value }))} placeholder="Buyer / new owner name" className="border rounded-lg px-3 py-2 text-sm" />
            <input value={form.buyerCompany} onChange={(e) => setForm((f) => ({ ...f, buyerCompany: e.target.value }))} placeholder="Buyer company / entity" className="border rounded-lg px-3 py-2 text-sm" />
            <input value={form.broker} onChange={(e) => setForm((f) => ({ ...f, broker: e.target.value }))} placeholder="Broker (relationship = +10 score)" className="border rounded-lg px-3 py-2 text-sm" />

            <input value={form.sellerName} onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))} placeholder="Seller / prior owner name" className="border rounded-lg px-3 py-2 text-sm" />
            <input value={form.sellerCompany} onChange={(e) => setForm((f) => ({ ...f, sellerCompany: e.target.value }))} placeholder="Seller company / entity" className="border rounded-lg px-3 py-2 text-sm" />
            <input value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} placeholder="Traded NY link" className="border rounded-lg px-3 py-2 text-sm" />

            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (1031, foreign buyer, distress...)" className="border rounded-lg px-3 py-2 text-sm md:col-span-2" />
            <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-camelot-navy text-white rounded-lg text-sm font-semibold hover:bg-camelot-navy/90 disabled:opacity-50">
              {submitting ? 'Saving…' : 'Track Deal'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2"><Target size={18} className="text-camelot-gold" /> Tracked Deals &rarr; Pitch Pipeline</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading deals…</p>
          ) : deals.length === 0 ? (
            <p className="text-sm text-slate-500">No deals tracked yet. Watch the <a href="https://traded.co/new-york/" target="_blank" rel="noopener" className="text-camelot-gold underline">Traded NY feed</a> and add the rental/multifamily trades worth chasing.</p>
          ) : (
            <div className="space-y-2">
              {deals.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 border border-slate-200 rounded-xl px-4 py-3">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-bold ${d.score >= 60 ? 'bg-emerald-600' : d.score >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                    <span className="text-base leading-none">{d.score}</span>
                    <span className="text-[8px] uppercase">score</span>
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-sm font-bold text-slate-950">{d.address}</div>
                    <div className="text-xs text-slate-500">
                      {d.borough} &middot; {d.dealType}{d.price ? ` @ ${d.price}` : ''}{d.units ? ` · ${d.units} units` : ''}
                    </div>
                    {(d.buyerName || d.sellerName) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.buyerName && <>Buyer: <span className="font-semibold text-slate-700">{d.buyerName}</span>{d.buyerCompany ? ` (${d.buyerCompany})` : ''}</>}
                        {d.buyerName && d.sellerName && ' · '}
                        {d.sellerName && <>Seller: <span className="font-semibold text-slate-700">{d.sellerName}</span>{d.sellerCompany ? ` (${d.sellerCompany})` : ''}</>}
                      </div>
                    )}
                    {d.notes && <div className="text-xs text-slate-400 mt-0.5">{d.notes}</div>}
                  </div>
                  {d.sourceUrl && (
                    <a href={d.sourceUrl} target="_blank" rel="noopener" className="text-xs text-camelot-gold font-semibold flex items-center gap-1">Traded <ArrowUpRight size={12} /></a>
                  )}
                  <button
                    onClick={() => getContactInfo(d.address)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Search size={12} /> Get contact info
                  </button>
                  <button
                    onClick={() => saveToHubSpot(d.address)}
                    className="text-xs border border-orange-200 text-orange-700 rounded-lg px-3 py-1.5 font-semibold hover:bg-orange-50 flex items-center gap-1"
                  >
                    <Share2 size={12} /> Save to HubSpot
                  </button>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(d.address); toast.success('Address copied — paste into the packager'); }}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Copy address
                  </button>
                  <Link to="/report-center" className="text-xs bg-[#5B4A1F] text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-[#473916] flex items-center gap-1">
                    <Crown size={12} /> Run Report
                  </Link>
                  <button onClick={() => void removeDeal(d.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
