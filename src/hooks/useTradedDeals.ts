import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { scoreLead } from '@/lib/marketing-engine';

export interface TradedDeal {
  id: string;
  address: string;
  borough: string;
  dealType: string;
  price: string;
  units: number;
  saleDate: string | null;
  broker: string;
  sourceUrl: string;
  notes: string;
  score: number;

  buyerName: string;
  buyerCompany: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerInstagram: string | null;
  buyerLinkedin: string | null;

  sellerName: string;
  sellerCompany: string;
  sellerEmail: string | null;
  sellerPhone: string | null;
  sellerInstagram: string | null;
  sellerLinkedin: string | null;

  enrichedAt: string | null;
  hubspotContactId: string | null;
  hubspotCompanyId: string | null;
  hubspotDealId: string | null;
  ingestionSource: 'manual' | 'traded_co_feed';
  createdAt: string;
}

export type NewTradedDealInput = {
  address: string;
  borough: string;
  dealType: string;
  price: string;
  units: number;
  buyerName: string;
  buyerCompany: string;
  sellerName: string;
  sellerCompany: string;
  broker: string;
  sourceUrl: string;
  notes: string;
};

// Row shape as it exists in the traded_deals table (see supabase/migrations/013_traded_ny.sql)
function mapRow(row: any): TradedDeal {
  return {
    id: row.id,
    address: row.address ?? '',
    borough: row.borough ?? '',
    dealType: row.deal_type ?? '',
    price: row.price ?? '',
    units: row.units ?? 0,
    saleDate: row.sale_date ?? null,
    broker: row.broker ?? '',
    sourceUrl: row.source_url ?? '',
    notes: row.notes ?? '',
    score: row.score ?? 0,

    buyerName: row.buyer_name ?? '',
    buyerCompany: row.buyer_company ?? '',
    buyerEmail: row.buyer_email ?? null,
    buyerPhone: row.buyer_phone ?? null,
    buyerInstagram: row.buyer_instagram ?? null,
    buyerLinkedin: row.buyer_linkedin ?? null,

    sellerName: row.seller_name ?? '',
    sellerCompany: row.seller_company ?? '',
    sellerEmail: row.seller_email ?? null,
    sellerPhone: row.seller_phone ?? null,
    sellerInstagram: row.seller_instagram ?? null,
    sellerLinkedin: row.seller_linkedin ?? null,

    enrichedAt: row.enriched_at ?? null,
    hubspotContactId: row.hubspot_contact_id ?? null,
    hubspotCompanyId: row.hubspot_company_id ?? null,
    hubspotDealId: row.hubspot_deal_id ?? null,
    ingestionSource: row.ingestion_source ?? 'manual',
    createdAt: row.created_at,
  };
}

export function useTradedDeals() {
  const [deals, setDeals] = useState<TradedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        setError('Traded NY requires live Supabase data. Configure VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in Render and redeploy.');
        setDeals([]);
        return;
      }
      const { data, error: qError } = await supabase
        .from('traded_deals')
        .select('*')
        .order('created_at', { ascending: false });
      if (qError) throw qError;
      setDeals((data ?? []).map(mapRow));
    } catch (err) {
      console.warn('[useTradedDeals] reload failed', err);
      setError('Could not load Traded NY deals from the database.');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const addDeal = useCallback(async (input: NewTradedDealInput) => {
    if (!input.address.trim()) {
      toast.error('Property address required');
      return false;
    }
    if (!isSupabaseConfigured()) {
      toast.error('Live database not configured — cannot save this deal.');
      return false;
    }

    const { score } = scoreLead({
      hasComplianceTrigger: /receivership|distress/i.test(input.dealType),
      hasDecisionMakerContact: !!input.buyerName.trim(),
      unitCount: input.units,
      inCoverageArea: true,
      serviceFit: input.units >= 5,
      hasTimingSignal: /sold|contract|1031|foreign/i.test(input.dealType),
      hasReferralOrRelationship: !!input.broker.trim(),
    });

    const row = {
      address: input.address.trim(),
      borough: input.borough,
      deal_type: input.dealType,
      price: input.price.trim(),
      units: input.units || 0,
      buyer_name: input.buyerName.trim() || null,
      buyer_company: input.buyerCompany.trim() || null,
      seller_name: input.sellerName.trim() || null,
      seller_company: input.sellerCompany.trim() || null,
      broker: input.broker.trim() || null,
      source_url: input.sourceUrl.trim() || null,
      notes: input.notes.trim() || null,
      score,
      ingestion_source: 'manual' as const,
    };

    try {
      const { data, error: insertError } = await supabase
        .from('traded_deals')
        .insert(row)
        .select('*')
        .single();
      if (insertError) throw insertError;

      setDeals((prev) => [mapRow(data), ...prev]);
      toast.success(`Tracked — lead score ${score}/100`);

      // Hand off to the same qualified-lead pipeline used elsewhere in the app,
      // so Traded NY deals still surface in the report packager / content leads view.
      void supabase.from('content_leads').insert({
        building_address: row.address,
        borough: row.borough,
        unit_count: row.units || null,
        trigger_event: `Traded NY: ${row.deal_type}${row.price ? ` @ ${row.price}` : ''}`,
        lead_score: score,
        contact_name: row.buyer_name,
        contact_source: row.source_url || 'Traded NY (manual)',
        status: score >= 60 ? 'qualified' : 'new',
      }).then(() => undefined, () => undefined);

      return true;
    } catch (err) {
      console.warn('[useTradedDeals] addDeal failed', err);
      toast.error('Could not save this deal — check the Supabase connection.');
      return false;
    }
  }, []);

  const removeDeal = useCallback(async (id: string) => {
    const prev = deals;
    setDeals((cur) => cur.filter((d) => d.id !== id));
    try {
      const { error: deleteError } = await supabase.from('traded_deals').delete().eq('id', id);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.warn('[useTradedDeals] removeDeal failed', err);
      toast.error('Could not delete — restoring.');
      setDeals(prev);
    }
  }, [deals]);

  return { deals, loading, error, reload, addDeal, removeDeal };
}
