-- ============================================================
-- QuoteCube — eTechCube Pricing & Quote Management Platform
-- Complete Database Schema v3.0
-- Target DB: quotecube-prod (Supabase, Mumbai region)
-- GitHub: https://github.com/vsgithubrepo/QuoteCube
-- DO NOT run on v1 Supabase project (vlaguonommcycwjdclgq)
-- ============================================================

-- ============================================================
-- ZONE 1: CATALOGUE (admin-managed, rarely changes)
-- These tables replace everything currently in defaults.js
-- ============================================================

-- ------------------------------------------------------------
-- 1.1  module_sections
-- Replaces: SEC_META object in defaults.js
-- One row per section (EMS, Master Data, Operations, etc.)
-- ------------------------------------------------------------
CREATE TABLE module_sections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT        NOT NULL UNIQUE,     -- e.g. 'EMS', 'MASTER_DATA'
  name          TEXT        NOT NULL,            -- e.g. 'EMS', 'Master Data'
  icon          TEXT        NOT NULL DEFAULT '📦',
  display_order INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  module_sections                IS 'Top-level groupings for the 110+ software modules';
COMMENT ON COLUMN module_sections.code           IS 'Short stable key used in code references';
COMMENT ON COLUMN module_sections.display_order  IS 'Controls order in the UI sidebar';


-- ------------------------------------------------------------
-- 1.2  modules
-- Replaces: DEFAULT_MODS array in defaults.js (110 rows)
-- One row per purchasable software module
-- ------------------------------------------------------------
CREATE TABLE modules (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID        NOT NULL REFERENCES module_sections(id) ON DELETE RESTRICT,
  legacy_code   TEXT        UNIQUE,              -- e.g. 'M001' — for migration only
  name          TEXT        NOT NULL,
  description   TEXT,
  is_essential  BOOLEAN     NOT NULL DEFAULT FALSE,  -- included in all plans
  is_pro        BOOLEAN     NOT NULL DEFAULT FALSE,  -- included in Professional plan
  is_premium    BOOLEAN     NOT NULL DEFAULT TRUE,   -- always available
  monthly_price NUMERIC     NOT NULL CHECK (monthly_price >= 0),
  display_order INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  modules              IS '110+ individual software modules customers can select';
COMMENT ON COLUMN modules.legacy_code  IS 'M001..M110 codes from original defaults.js — kept for data migration';
COMMENT ON COLUMN modules.is_essential IS 'Auto-selected on every quote — cannot be deselected';
COMMENT ON COLUMN modules.is_pro       IS 'Auto-selected on Professional tier quotes';
COMMENT ON COLUMN modules.is_premium   IS 'Available on all tiers (Premium only modules have is_essential=false, is_pro=false)';


-- ------------------------------------------------------------
-- 1.3  api_categories
-- Replaces: the 'cat' field on DEFAULT_APIS entries
-- e.g. Payments, Communication, Identity, Vehicle & Logistics
-- ------------------------------------------------------------
CREATE TABLE api_categories (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  display_order INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE api_categories IS 'Groups API services into logical categories for the UI';


-- ------------------------------------------------------------
-- 1.4  api_services
-- Replaces: the name/cat fields of DEFAULT_APIS
-- One row per type of API (e.g. "E-Way Bill", "Vehicle Verification")
-- NOT per provider — providers are in api_provider_plans below
--
-- pricing_model is the critical field — determines calculation logic:
--   'annual_volume_plan'      — IRIS EWB style: pick one plan based on volume cap
--   'subscription_with_overage' — IRIS normal: annual sub + per-hit beyond included
--   'pay_per_hit'             — Ongrid style: pure per-call, no subscription
-- ------------------------------------------------------------
CREATE TABLE api_services (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID        NOT NULL REFERENCES api_categories(id) ON DELETE RESTRICT,
  name          TEXT        NOT NULL,
  description   TEXT,
  pricing_model TEXT        NOT NULL CHECK (pricing_model IN (
                              'annual_volume_plan',        -- EWB: pick plan by volume cap
                              'subscription_with_overage', -- IRIS normal: sub + overage
                              'pay_per_hit'                -- Ongrid: pure per-call
                            )),
  unit_label    TEXT        NOT NULL DEFAULT 'hit',  -- 'EWB', 'verification', 'hit'
  display_order INT         NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  api_services               IS 'One row per API type regardless of provider';
COMMENT ON COLUMN api_services.pricing_model IS 'Determines which calculation engine to use';
COMMENT ON COLUMN api_services.unit_label    IS 'What one billable unit is called (EWB, verification, hit, etc.)';


-- ------------------------------------------------------------
-- 1.5  api_provider_plans
-- This is the most important new table — replaces the entire
-- toy 'p' array on DEFAULT_APIS and models real pricing correctly
--
-- For pricing_model = 'annual_volume_plan' (EWB):
--   plan_code           = 'PREMIUM_YR', 'REGULAR_YR', 'MINI_YR', 'MICRO_YR'
--   annual_fee_ex_gst   = 57499 / 43124 / 28749 / 14374
--   included_units_year = 240000 / 120000 / 60000 / 24000  (annual EWB cap)
--   per_unit_rate       = NULL (no overage — customer must upgrade plan)
--   volume_cap_monthly  = 20000 / 10000 / 5000 / 2000 (what triggers upgrade)
--
-- For pricing_model = 'subscription_with_overage' (IRIS normal):
--   plan_code           = 'IRIS_STANDARD'
--   annual_fee_ex_gst   = 12000 / 20000 / 35000 etc.
--   included_units_year = 10000 / 10000 / 50000 etc.
--   per_unit_rate       = 0.12 / 0.20 / 0.000014 etc.
--   volume_cap_monthly  = NULL
--
-- For pricing_model = 'pay_per_hit' (Ongrid):
--   plan_code           = 'ONGRID_STANDARD'
--   annual_fee_ex_gst   = 0
--   included_units_year = 0
--   per_unit_rate       = 1.75 / 0.90 etc.
--   volume_cap_monthly  = NULL
-- ------------------------------------------------------------
CREATE TABLE api_provider_plans (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id           UUID    NOT NULL REFERENCES api_services(id) ON DELETE CASCADE,
  provider_name        TEXT    NOT NULL,          -- 'IRIS', 'Ongrid', 'Razorpay' etc.
  plan_code            TEXT    NOT NULL,          -- 'PREMIUM_YR', 'ONGRID_STANDARD' etc.
  plan_label           TEXT    NOT NULL,          -- Human-readable: 'Premium (20K EWBs/mo)'
  annual_fee_ex_gst    NUMERIC NOT NULL DEFAULT 0 CHECK (annual_fee_ex_gst >= 0),
  gst_pct              NUMERIC NOT NULL DEFAULT 18 CHECK (gst_pct >= 0),
  included_units_year  NUMERIC NOT NULL DEFAULT 0 CHECK (included_units_year >= 0),
  per_unit_rate        NUMERIC          CHECK (per_unit_rate >= 0),  -- NULL = no overage allowed
  volume_cap_monthly   NUMERIC          CHECK (volume_cap_monthly > 0), -- NULL except EWB plans
  is_recommended       BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  display_order        INT     NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (service_id, provider_name, plan_code)
);

COMMENT ON TABLE  api_provider_plans                  IS 'Actual pricing plans per provider per API service';
COMMENT ON COLUMN api_provider_plans.annual_fee_ex_gst   IS 'Annual subscription/plan cost excluding GST';
COMMENT ON COLUMN api_provider_plans.gst_pct             IS 'GST percentage — currently 18% on all API services';
COMMENT ON COLUMN api_provider_plans.included_units_year IS 'Units included in annual fee before overage kicks in';
COMMENT ON COLUMN api_provider_plans.per_unit_rate        IS 'Cost per unit beyond included_units_year. NULL = upgrade plan instead';
COMMENT ON COLUMN api_provider_plans.volume_cap_monthly   IS 'Monthly volume cap for annual_volume_plan type — triggers upgrade recommendation';


-- ============================================================
-- ZONE 2: CONFIGURATION (per deployment, admin-editable)
-- These tables replace the rest of defaults.js
-- ============================================================

-- ------------------------------------------------------------
-- 2.1  server_providers
-- Replaces: PROVIDERS array + DEFAULT_STOR_COST object
-- ------------------------------------------------------------
CREATE TABLE server_providers (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT    NOT NULL UNIQUE,   -- 'AWS', 'Azure', 'GCP' etc.
  logo_url              TEXT,
  storage_cost_per_100gb NUMERIC NOT NULL DEFAULT 0 CHECK (storage_cost_per_100gb >= 0),
  display_order         INT     NOT NULL DEFAULT 0,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN server_providers.storage_cost_per_100gb IS 'Monthly cost in INR for each 100 GB of additional storage';


-- ------------------------------------------------------------
-- 2.2  server_packages
-- Replaces: PACKAGES + PKG_SPECS + DEFAULT_SRV_PRICES
-- One row per provider × package combination (6 × 6 = 36 rows)
-- ------------------------------------------------------------
CREATE TABLE server_packages (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID    NOT NULL REFERENCES server_providers(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,          -- 'Starter', 'Standard', 'Business' etc.
  spec_label    TEXT    NOT NULL,          -- '2vCPU / 4 GB RAM'
  monthly_price NUMERIC NOT NULL CHECK (monthly_price >= 0),
  display_order INT     NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider_id, name)
);

COMMENT ON TABLE server_packages IS '36 rows: 6 providers × 6 packages each with individual prices';


-- ------------------------------------------------------------
-- 2.3  volume_tiers
-- Replaces: DEFAULT_VOL_TIERS array
-- Monthly order volume bands that add a platform surcharge
-- ------------------------------------------------------------
CREATE TABLE volume_tiers (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  label             TEXT    NOT NULL,
  min_orders        INT     NOT NULL CHECK (min_orders >= 0),
  max_orders        INT     NOT NULL CHECK (max_orders > min_orders),
  monthly_surcharge NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_surcharge >= 0),
  display_order     INT     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No two tiers can overlap
  CONSTRAINT no_overlap EXCLUDE USING gist (
    int4range(min_orders, max_orders, '[]') WITH &&
  )
);

COMMENT ON TABLE  volume_tiers                IS 'Monthly surcharge bands based on customer order volume';
COMMENT ON COLUMN volume_tiers.monthly_surcharge IS 'Additional monthly platform fee in INR';


-- ------------------------------------------------------------
-- 2.4  global_settings
-- Replaces: DEFAULT_GLOBAL object
-- Key-value store for things that need to change without a deploy
-- ------------------------------------------------------------
CREATE TABLE global_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE global_settings IS 'Simple key-value config: annual_discount_pct, backup_cost_pct, gst_pct etc.';

-- Seed default values
INSERT INTO global_settings (key, value, description) VALUES
  ('annual_discount_pct',  '15',   'Discount % applied when customer selects Annual billing'),
  ('backup_cost_pct',      '20',   'Managed backup add-on as % of server base price'),
  ('default_gst_pct',      '18',   'GST percentage applied to API subscription fees'),
  ('currency_code',        'INR',  'Display currency'),
  ('currency_symbol',      '₹',    'Display currency symbol'),
  ('quote_validity_days',  '30',   'How many days a quote remains valid');


-- ------------------------------------------------------------
-- 2.5  professional_roles
-- Replaces: DEFAULT_CDEV, DEFAULT_IMPL, DEFAULT_TRAIN arrays
-- All three service types in one table, distinguished by category
-- ------------------------------------------------------------
CREATE TABLE professional_roles (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT    NOT NULL CHECK (category IN ('cdev', 'impl', 'train')),
  role_name     TEXT    NOT NULL,
  note          TEXT,                 -- Short description shown in UI
  day_rate      NUMERIC NOT NULL CHECK (day_rate > 0),
  display_order INT     NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (category, role_name)
);

COMMENT ON COLUMN professional_roles.category IS 'cdev=Custom Development, impl=Implementation, train=Training';
COMMENT ON COLUMN professional_roles.day_rate  IS 'Per-person per-day rate in INR';


-- ============================================================
-- ZONE 3: TRANSACTIONAL (operational data)
-- ============================================================

-- profiles already exists — keeping as-is with one addition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  full_name TEXT;


-- ------------------------------------------------------------
-- 3.1  quotes
-- Stores the header of each saved quote
-- No more JSONB blob — inputs stored as normalised rows in
-- quote_line_items and quote_config_snapshots below
-- ------------------------------------------------------------
CREATE TABLE quotes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by        UUID        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_by_name   TEXT,                          -- Denormalised for history display
  created_by_email  TEXT,
  customer_name     TEXT        NOT NULL,
  customer_company  TEXT,
  customer_email    TEXT,
  monthly_orders    INT         NOT NULL DEFAULT 1000 CHECK (monthly_orders > 0),
  billing_cycle     TEXT        NOT NULL DEFAULT 'Monthly' CHECK (billing_cycle IN ('Monthly','Annual')),
  contract_term_yrs INT         NOT NULL DEFAULT 1 CHECK (contract_term_yrs IN (1,2,3)),
  prepared_by       TEXT,
  grand_total       NUMERIC     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
  share_token       TEXT        UNIQUE,            -- For future public shareable links
  is_shared         BOOLEAN     NOT NULL DEFAULT FALSE,
  version           INT         NOT NULL DEFAULT 1, -- Increments on each save
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  quotes              IS 'One row per saved quote — header only, line items in quote_line_items';
COMMENT ON COLUMN quotes.grand_total  IS 'Computed by backend on save — never trusted from frontend';
COMMENT ON COLUMN quotes.version      IS 'Optimistic concurrency control';


-- ------------------------------------------------------------
-- 3.2  quote_line_items
-- THIS IS THE KEY DIFFERENCE FROM V1
-- Every selected module, server package, API plan and PS role
-- gets its own row — fully auditable, no JSONB blob
-- ------------------------------------------------------------
CREATE TABLE quote_line_items (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID    NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  -- What type of thing this line represents
  item_type   TEXT    NOT NULL CHECK (item_type IN (
                'module',           -- a software module
                'server_package',   -- server + provider selection
                'server_storage',   -- storage add-on
                'server_backup',    -- backup add-on
                'volume_surcharge', -- platform tier surcharge
                'api_plan',         -- an API provider plan
                'api_overage',      -- calculated overage on subscription_with_overage
                'ps_cdev',          -- custom development role
                'ps_impl',          -- implementation role
                'ps_train'          -- training role
              )),

  -- Reference to the catalogue/config item (nullable for computed lines)
  ref_id      UUID,               -- FK to module / server_package / api_provider_plan / professional_role
  ref_name    TEXT    NOT NULL,   -- Denormalised name for quote display even if catalogue changes

  -- Quantities
  quantity    NUMERIC NOT NULL DEFAULT 1,  -- resources for PS, 1 for most others
  days        NUMERIC,                     -- days for PS roles only
  monthly_hits NUMERIC,                    -- expected monthly API hits

  -- Pricing (all ex-GST unless noted)
  unit_price  NUMERIC NOT NULL DEFAULT 0,  -- price per unit per month (modules) or annual (APIs)
  line_total  NUMERIC NOT NULL DEFAULT 0,  -- computed by backend: quantity × days × unit_price etc.

  display_order INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  quote_line_items             IS 'Every line of a quote — replaces the JSONB quote_data blob';
COMMENT ON COLUMN quote_line_items.ref_id      IS 'Points to module/server_package/api_provider_plan/professional_role';
COMMENT ON COLUMN quote_line_items.ref_name    IS 'Snapshot of name at time of quote — survives catalogue renaming';
COMMENT ON COLUMN quote_line_items.monthly_hits IS 'For API plans: expected monthly call volume used to compute overage';


-- ------------------------------------------------------------
-- 3.3  quote_events
-- Audit log — every significant action on a quote
-- ------------------------------------------------------------
CREATE TABLE quote_events (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     UUID    NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  event_type   TEXT    NOT NULL CHECK (event_type IN (
                 'created', 'updated', 'viewed', 'pdf_downloaded',
                 'excel_downloaded', 'sent', 'status_changed', 'deleted'
               )),
  triggered_by UUID    REFERENCES profiles(id) ON DELETE SET NULL,
  metadata     JSONB,              -- Optional extra context (e.g. old_status → new_status)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quote_events IS 'Immutable audit log — never update or delete rows here';


-- ============================================================
-- INDEXES — for query performance
-- ============================================================

CREATE INDEX idx_modules_section     ON modules (section_id, display_order);
CREATE INDEX idx_modules_active      ON modules (is_active, display_order);
CREATE INDEX idx_api_plans_service   ON api_provider_plans (service_id, display_order);
CREATE INDEX idx_api_plans_active    ON api_provider_plans (is_active);
CREATE INDEX idx_srv_packages_prov   ON server_packages (provider_id, display_order);
CREATE INDEX idx_vol_tiers_range     ON volume_tiers (min_orders, max_orders);
CREATE INDEX idx_prof_roles_cat      ON professional_roles (category, display_order);
CREATE INDEX idx_quotes_created_by   ON quotes (created_by, created_at DESC);
CREATE INDEX idx_quotes_status       ON quotes (status, created_at DESC);
CREATE INDEX idx_line_items_quote    ON quote_line_items (quote_id, item_type, display_order);
CREATE INDEX idx_events_quote        ON quote_events (quote_id, created_at DESC);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE module_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_provider_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_providers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE volume_tiers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_line_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events        ENABLE ROW LEVEL SECURITY;

-- Helper function: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Catalogue: everyone reads, only admins write
CREATE POLICY "catalogue_read"  ON module_sections    FOR SELECT USING (TRUE);
CREATE POLICY "catalogue_write" ON module_sections    FOR ALL    USING (is_admin());
CREATE POLICY "catalogue_read"  ON modules            FOR SELECT USING (TRUE);
CREATE POLICY "catalogue_write" ON modules            FOR ALL    USING (is_admin());
CREATE POLICY "catalogue_read"  ON api_categories     FOR SELECT USING (TRUE);
CREATE POLICY "catalogue_write" ON api_categories     FOR ALL    USING (is_admin());
CREATE POLICY "catalogue_read"  ON api_services       FOR SELECT USING (TRUE);
CREATE POLICY "catalogue_write" ON api_services       FOR ALL    USING (is_admin());
CREATE POLICY "catalogue_read"  ON api_provider_plans FOR SELECT USING (TRUE);
CREATE POLICY "catalogue_write" ON api_provider_plans FOR ALL    USING (is_admin());

-- Config: everyone reads, only admins write
CREATE POLICY "config_read"  ON server_providers   FOR SELECT USING (TRUE);
CREATE POLICY "config_write" ON server_providers   FOR ALL    USING (is_admin());
CREATE POLICY "config_read"  ON server_packages    FOR SELECT USING (TRUE);
CREATE POLICY "config_write" ON server_packages    FOR ALL    USING (is_admin());
CREATE POLICY "config_read"  ON volume_tiers       FOR SELECT USING (TRUE);
CREATE POLICY "config_write" ON volume_tiers       FOR ALL    USING (is_admin());
CREATE POLICY "config_read"  ON global_settings    FOR SELECT USING (TRUE);
CREATE POLICY "config_write" ON global_settings    FOR ALL    USING (is_admin());
CREATE POLICY "config_read"  ON professional_roles FOR SELECT USING (TRUE);
CREATE POLICY "config_write" ON professional_roles FOR ALL    USING (is_admin());

-- Quotes: users see own, admins see all
CREATE POLICY "quotes_select" ON quotes FOR SELECT USING (
  auth.uid() = created_by OR is_admin()
);
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quotes_update" ON quotes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "quotes_delete" ON quotes FOR DELETE USING (
  auth.uid() = created_by OR is_admin()
);

-- Line items: inherit quote visibility
CREATE POLICY "items_select" ON quote_line_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_id
    AND (created_by = auth.uid() OR is_admin()))
);
CREATE POLICY "items_insert" ON quote_line_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_id AND created_by = auth.uid())
);
CREATE POLICY "items_delete" ON quote_line_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_id AND created_by = auth.uid())
);

-- Events: same visibility as quotes, never deletable
CREATE POLICY "events_select" ON quote_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE id = quote_id
    AND (created_by = auth.uid() OR is_admin()))
);
CREATE POLICY "events_insert" ON quote_events FOR INSERT WITH CHECK (TRUE);


-- ============================================================
-- USEFUL VIEWS (used by the backend API — never call from frontend)
-- ============================================================

-- Full module list with section name — backend sends this to frontend on load
CREATE OR REPLACE VIEW v_modules_full AS
SELECT
  m.id, m.legacy_code, m.name, m.description,
  m.is_essential, m.is_pro, m.is_premium,
  m.monthly_price, m.display_order, m.is_active,
  s.id   AS section_id,
  s.code AS section_code,
  s.name AS section_name,
  s.icon AS section_icon,
  s.display_order AS section_order
FROM modules m
JOIN module_sections s ON s.id = m.section_id
WHERE m.is_active AND s.is_active
ORDER BY s.display_order, m.display_order;

-- API services with all their plans — backend uses this for pricing engine
CREATE OR REPLACE VIEW v_api_services_full AS
SELECT
  s.id AS service_id, s.name AS service_name,
  s.pricing_model, s.unit_label,
  s.display_order AS service_order,
  c.id   AS category_id,
  c.name AS category_name,
  c.display_order AS category_order,
  p.id                  AS plan_id,
  p.provider_name,
  p.plan_code,
  p.plan_label,
  p.annual_fee_ex_gst,
  p.gst_pct,
  ROUND(p.annual_fee_ex_gst * (1 + p.gst_pct/100), 2) AS annual_fee_inc_gst,
  p.included_units_year,
  p.per_unit_rate,
  p.volume_cap_monthly,
  p.is_recommended,
  p.display_order AS plan_order
FROM api_services s
JOIN api_categories c ON c.id = s.category_id
JOIN api_provider_plans p ON p.service_id = s.id
WHERE s.is_active AND c.is_active AND p.is_active
ORDER BY c.display_order, s.display_order, p.display_order;

-- Server packages with provider — backend sends this to frontend on load
CREATE OR REPLACE VIEW v_server_packages_full AS
SELECT
  pkg.id, pkg.name, pkg.spec_label, pkg.monthly_price, pkg.display_order,
  prov.id   AS provider_id,
  prov.name AS provider_name,
  prov.storage_cost_per_100gb,
  prov.display_order AS provider_order
FROM server_packages pkg
JOIN server_providers prov ON prov.id = pkg.provider_id
WHERE pkg.is_active AND prov.is_active
ORDER BY prov.display_order, pkg.display_order;

-- Quote summary for history list — never sends line_items in the list view
CREATE OR REPLACE VIEW v_quotes_summary AS
SELECT
  q.id, q.customer_name, q.customer_company, q.customer_email,
  q.monthly_orders, q.billing_cycle, q.contract_term_yrs,
  q.grand_total, q.status, q.version,
  q.created_at, q.updated_at,
  p.full_name AS created_by_name,
  p.email     AS created_by_email
FROM quotes q
JOIN profiles p ON p.id = q.created_by;


-- ============================================================
-- BACKEND API FUNCTIONS
-- These run server-side in the pricing engine — not callable
-- directly from the frontend due to RLS + complexity
-- ============================================================

-- Function: calculate quote total
-- Called by the Node.js backend ONLY — never from the browser
-- Returns the validated grand total so the frontend cannot fake it
CREATE OR REPLACE FUNCTION calculate_quote_total(p_quote_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total       NUMERIC := 0;
  v_rec_total   NUMERIC := 0;
  v_ps_total    NUMERIC := 0;
  v_billing     TEXT;
  v_term        INT;
  v_discount    NUMERIC;
BEGIN
  SELECT billing_cycle, contract_term_yrs INTO v_billing, v_term
  FROM quotes WHERE id = p_quote_id;

  SELECT COALESCE(SUM(line_total), 0) INTO v_rec_total
  FROM quote_line_items
  WHERE quote_id = p_quote_id
    AND item_type NOT IN ('ps_cdev', 'ps_impl', 'ps_train');

  SELECT COALESCE(SUM(line_total), 0) INTO v_ps_total
  FROM quote_line_items
  WHERE quote_id = p_quote_id
    AND item_type IN ('ps_cdev', 'ps_impl', 'ps_train');

  SELECT COALESCE(value::NUMERIC, 15) INTO v_discount
  FROM global_settings WHERE key = 'annual_discount_pct';

  IF v_billing = 'Annual' THEN
    v_rec_total := v_rec_total * 12 * (1 - v_discount / 100);
  END IF;

  v_total := v_rec_total + v_ps_total;

  UPDATE quotes SET grand_total = v_total, updated_at = NOW()
  WHERE id = p_quote_id;

  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION calculate_quote_total IS 'Server-side total recalculation — grand_total is NEVER accepted from the frontend';


-- ============================================================
-- SEED DATA — matches existing defaults.js exactly
-- Run once after schema creation
-- ============================================================

-- Module sections (12 sections)
INSERT INTO module_sections (code, name, icon, display_order) VALUES
  ('EMS',                'EMS',                 '👤', 1),
  ('MASTER_DATA',        'Master Data',          '🗃️', 2),
  ('OPERATIONS',         'Operations',           '⚙️', 3),
  ('MANIFEST_DELIVERY',  'Manifest & Delivery',  '📋', 4),
  ('ACCOUNTS_EXPENSE',   'Accounts & Expense',   '📊', 5),
  ('FINANCE_BANKING',    'Finance & Banking',    '🏦', 6),
  ('GRIEVANCE',          'Grievance',            '🔔', 7),
  ('ANALYTICS',          'Analytics',            '📈', 8),
  ('DASHBOARDS',         'Dashboards',           '🖥️', 9),
  ('REPORTS',            'Reports',              '📄', 10),
  ('AUTOMATION',         'Automation',           '🤖', 11),
  ('OTHER_FEATURES',     'Other Features',       '✨', 12);

-- API categories
INSERT INTO api_categories (name, display_order) VALUES
  ('Payments',           1),
  ('Communication',      2),
  ('Identity',           3),
  ('Vehicle & Logistics',4),
  ('Compliance',         5),
  ('Verification',       6),
  ('Legal',              7),
  ('AI & ML',            8),
  ('Cloud Infra',        9),
  ('Observability',      10),
  ('Data',               11),
  ('Security',           12);

-- E-Way Bill service (annual_volume_plan model)
INSERT INTO api_services (category_id, name, description, pricing_model, unit_label, display_order)
SELECT id, 'E-Way Bill', 'IRIS EWB generation and compliance API', 'annual_volume_plan', 'EWB', 1
FROM api_categories WHERE name = 'Compliance';

-- EWB plans (4 tiers)
INSERT INTO api_provider_plans
  (service_id, provider_name, plan_code, plan_label,
   annual_fee_ex_gst, gst_pct, included_units_year,
   per_unit_rate, volume_cap_monthly, display_order)
SELECT
  s.id, 'IRIS', plans.code, plans.label,
  plans.fee, 18, plans.units_yr, NULL, plans.cap_mo, plans.ord
FROM api_services s,
  (VALUES
    ('MICRO_YR',   '₹14,374/yr — up to 2,000 EWBs/mo',  14374, 24000,  2000, 1),
    ('MINI_YR',    '₹28,749/yr — up to 5,000 EWBs/mo',  28749, 60000,  5000, 2),
    ('REGULAR_YR', '₹43,124/yr — up to 10,000 EWBs/mo', 43124, 120000, 10000, 3),
    ('PREMIUM_YR', '₹57,499/yr — up to 20,000 EWBs/mo', 57499, 240000, 20000, 4)
  ) AS plans(code, label, fee, units_yr, cap_mo, ord)
WHERE s.name = 'E-Way Bill';

-- Vehicle Verification (subscription_with_overage from IRIS, pay_per_hit from Ongrid)
INSERT INTO api_services (category_id, name, description, pricing_model, unit_label, display_order)
SELECT id, 'Vehicle Verification', 'VAHAN RC & ownership verification', 'subscription_with_overage', 'verification', 2
FROM api_categories WHERE name = 'Vehicle & Logistics';

INSERT INTO api_provider_plans
  (service_id, provider_name, plan_code, plan_label,
   annual_fee_ex_gst, gst_pct, included_units_year, per_unit_rate, display_order)
SELECT s.id, 'IRIS', 'IRIS_STANDARD', '₹12,000/yr — includes 10,000 verifications, ₹0.12 per extra',
  12000, 18, 10000, 0.12, 1
FROM api_services s WHERE s.name = 'Vehicle Verification';

-- Ongrid for same service (pay_per_hit — different pricing_model on same service?)
-- NOTE: We model this as a separate plan on the SAME service because the frontend
-- should present both options and show the break-even point to the sales rep.
-- The pricing_model on api_services describes the DOMINANT model.
-- Ongrid plans set annual_fee=0, included_units=0, per_unit_rate=cost_per_hit.
INSERT INTO api_provider_plans
  (service_id, provider_name, plan_code, plan_label,
   annual_fee_ex_gst, gst_pct, included_units_year, per_unit_rate, display_order)
SELECT s.id, 'Ongrid', 'ONGRID_PPH', 'Pay per hit — ₹1.75/verification, no subscription',
  0, 0, 0, 1.75, 2
FROM api_services s WHERE s.name = 'Vehicle Verification';

-- (Remaining APIs follow same pattern — add after more data is received)

-- Volume tiers (6 bands)
INSERT INTO volume_tiers (label, min_orders, max_orders, monthly_surcharge, display_order) VALUES
  ('Starter (0–500 orders/mo)',      0,     500,    0,      1),
  ('Growth (501–1,000)',             501,   1000,   12500,  2),
  ('Business (1,001–5,000)',         1001,  5000,   33300,  3),
  ('Scale (5,001–10,000)',           5001,  10000,  75000,  4),
  ('Enterprise (10,001–50,000)',     10001, 50000,  120000, 5),
  ('Enterprise+ (50,001+)',          50001, 999999, 380000, 6);

-- Server providers (6)
INSERT INTO server_providers (name, storage_cost_per_100gb, display_order) VALUES
  ('AWS',          830, 1),
  ('Azure',        870, 2),
  ('GCP',          800, 3),
  ('DigitalOcean', 625, 4),
  ('Hetzner',      400, 5),
  ('Hostinger',    350, 6);

-- Server packages (36 rows: 6 providers × 6 packages)
INSERT INTO server_packages (provider_id, name, spec_label, monthly_price, display_order)
SELECT p.id, pkg.name, pkg.spec, pkg.price, pkg.ord
FROM server_providers p,
  (VALUES
    ('AWS', 'Starter',        '2vCPU / 4 GB',   2900,  1),
    ('AWS', 'Standard',       '4vCPU / 8 GB',   5800,  2),
    ('AWS', 'Business',       '8vCPU / 16 GB',  11600, 3),
    ('AWS', 'Performance',    '16vCPU / 32 GB', 23200, 4),
    ('AWS', 'Enterprise',     '32vCPU / 64 GB', 46400, 5),
    ('AWS', 'Enterprise Plus','64vCPU / 128 GB',87500, 6),
    ('Azure', 'Starter',        '2vCPU / 4 GB',   3100,  1),
    ('Azure', 'Standard',       '4vCPU / 8 GB',   6200,  2),
    ('Azure', 'Business',       '8vCPU / 16 GB',  12400, 3),
    ('Azure', 'Performance',    '16vCPU / 32 GB', 24800, 4),
    ('Azure', 'Enterprise',     '32vCPU / 64 GB', 49600, 5),
    ('Azure', 'Enterprise Plus','64vCPU / 128 GB',93600, 6),
    ('GCP', 'Starter',        '2vCPU / 4 GB',   2800,  1),
    ('GCP', 'Standard',       '4vCPU / 8 GB',   5500,  2),
    ('GCP', 'Business',       '8vCPU / 16 GB',  11000, 3),
    ('GCP', 'Performance',    '16vCPU / 32 GB', 22000, 4),
    ('GCP', 'Enterprise',     '32vCPU / 64 GB', 44000, 5),
    ('GCP', 'Enterprise Plus','64vCPU / 128 GB',83000, 6),
    ('DigitalOcean', 'Starter',        '2vCPU / 4 GB',   2200,  1),
    ('DigitalOcean', 'Standard',       '4vCPU / 8 GB',   4400,  2),
    ('DigitalOcean', 'Business',       '8vCPU / 16 GB',  8700,  3),
    ('DigitalOcean', 'Performance',    '16vCPU / 32 GB', 17400, 4),
    ('DigitalOcean', 'Enterprise',     '32vCPU / 64 GB', 34800, 5),
    ('DigitalOcean', 'Enterprise Plus','64vCPU / 128 GB',65700, 6),
    ('Hetzner', 'Starter',        '2vCPU / 4 GB',   1400,  1),
    ('Hetzner', 'Standard',       '4vCPU / 8 GB',   2800,  2),
    ('Hetzner', 'Business',       '8vCPU / 16 GB',  5600,  3),
    ('Hetzner', 'Performance',    '16vCPU / 32 GB', 11200, 4),
    ('Hetzner', 'Enterprise',     '32vCPU / 64 GB', 22400, 5),
    ('Hetzner', 'Enterprise Plus','64vCPU / 128 GB',42300, 6),
    ('Hostinger', 'Starter',        '2vCPU / 4 GB',   1200,  1),
    ('Hostinger', 'Standard',       '4vCPU / 8 GB',   2500,  2),
    ('Hostinger', 'Business',       '8vCPU / 16 GB',  5000,  3),
    ('Hostinger', 'Performance',    '16vCPU / 32 GB', 10000, 4),
    ('Hostinger', 'Enterprise',     '32vCPU / 64 GB', 20000, 5),
    ('Hostinger', 'Enterprise Plus','64vCPU / 128 GB',37800, 6)
  ) AS pkg(provider, name, spec, price, ord)
WHERE p.name = pkg.provider;

-- Professional roles (14 rows across 3 categories)
INSERT INTO professional_roles (category, role_name, note, day_rate, display_order) VALUES
  ('cdev', 'Junior Developer',       '0–2 yrs experience',       6600,  1),
  ('cdev', 'Mid-Level Developer',    '2–5 yrs experience',       12500, 2),
  ('cdev', 'Senior Developer',       '5+ yrs experience',        20800, 3),
  ('cdev', 'Tech Lead / Architect',  'System design ownership',  29100, 4),
  ('cdev', 'Project Manager',        'Scrum / stakeholders',     20800, 5),
  ('cdev', 'QA Engineer',            'Test automation',          8300,  6),
  ('cdev', 'DevOps Engineer',        'CI/CD, cloud infra',       16600, 7),
  ('cdev', 'Business Analyst',       'BRD, UAT coordination',    12500, 8),
  ('impl', 'Implementation Lead',        'Kickoff & go-live',        20800, 1),
  ('impl', 'Implementation Consultant',  'Config, migration, UAT',   12500, 2),
  ('impl', 'Hypercare Support Engineer', 'Post go-live L1/L2',        10400, 3),
  ('train', 'End-User Training (ILT)',        '~1 day per 15–20 users',  10400, 1),
  ('train', 'Train-the-Trainer Programme',    'Power user deep-dive',    10400, 2),
  ('train', 'e-Learning Content Development', 'Video & LMS content',     12500, 3);

-- ============================================================
-- END OF SCHEMA
-- ============================================================
