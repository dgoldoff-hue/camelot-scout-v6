-- 013_traded_ny.sql
-- Traded NY deal-flow tracker — Phase 2: real database backing (was localStorage).
-- Every closed deal is a new owner who needs a manager. This table is the
-- source of truth for the Traded NY page, and the future landing spot for
-- automated traded.co feed ingestion plus buyer/seller contact enrichment
-- (email, phone, Instagram, LinkedIn) and HubSpot sync.

CREATE TABLE IF NOT EXISTS traded_deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deal / property
  address             text NOT NULL,
  borough             text NOT NULL,
  deal_type           text NOT NULL,     -- Sold, In Contract, Loan / Refi, 1031 Exchange, Foreign Buyer, Receivership / Distress, New Development
  price               text,
  units               integer DEFAULT 0,
  sale_date           date,
  broker              text,
  source_url          text,
  notes               text,
  score               integer DEFAULT 0,

  -- Buyer
  buyer_name          text,
  buyer_company       text,
  buyer_email         text,
  buyer_phone         text,
  buyer_instagram     text,
  buyer_linkedin      text,

  -- Seller
  seller_name         text,
  seller_company      text,
  seller_email        text,
  seller_phone        text,
  seller_instagram    text,
  seller_linkedin     text,

  -- Enrichment tracking
  enriched_at         timestamptz,
  enrichment_source   text,              -- e.g. 'apollo', 'prospeo', 'manual'

  -- HubSpot sync tracking
  hubspot_synced_at   text,
  hubspot_contact_id  text,
  hubspot_company_id  text,
  hubspot_deal_id     text,

  ingestion_source    text NOT NULL DEFAULT 'manual' CHECK (ingestion_source IN ('manual', 'traded_co_feed')),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traded_deals_score      ON traded_deals(score DESC);
CREATE INDEX IF NOT EXISTS idx_traded_deals_created_at ON traded_deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traded_deals_borough    ON traded_deals(borough);
-- Prevent the feed ingestion job from creating duplicate rows for the same source deal.
CREATE UNIQUE INDEX IF NOT EXISTS idx_traded_deals_source_url ON traded_deals(source_url) WHERE source_url IS NOT NULL AND source_url <> '';

CREATE OR REPLACE FUNCTION set_traded_deals_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_traded_deals_updated_at ON traded_deals;
CREATE TRIGGER trg_traded_deals_updated_at
  BEFORE UPDATE ON traded_deals
  FOR EACH ROW EXECUTE FUNCTION set_traded_deals_updated_at();

ALTER TABLE traded_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App access traded_deals" ON traded_deals;
CREATE POLICY "App access traded_deals" ON traded_deals FOR ALL USING (true) WITH CHECK (true);
