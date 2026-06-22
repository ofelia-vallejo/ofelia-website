-- ============================================================================
-- Ofelia Vallejo · Migración 003 — Tienda 100% funcional (modelo operativo)
-- ----------------------------------------------------------------------------
-- AMPLIACIÓN no destructiva sobre baseline (001 = database/schema.sql) y la
-- migración 002 (002_full_commerce_model.sql). La 002 fue deliberadamente
-- "pragmática"; esta 003 completa las áreas operativas que faltaban para operar
-- una tienda real al estilo Shopify Admin, manteniéndolo como Postgres propio:
--
--   · Productos: estado de publicación, vendor/tipo, SEO, tags, media (vídeo), metafields
--   · Precios e impuestos: price_lists, tax_zones/tax_rates, order_tax_lines
--   · Envíos/entrega: shipping_zones, shipping_rates (+pickup), order_shipping_lines
--   · Inventario operativo: incoming + libro mayor inventory_adjustments
--   · Pedidos (ciclo completo): draft_orders, refunds, returns (RMA), order_risks, tags/notas
--   · Clientes: tags, segmentos, gift_cards (+ledger), consentimiento marketing
--   · Descuentos: automáticos vs. código, condiciones, free shipping
--   · Operación: sales_channels, staff_users, audit_log
--
-- 100% IDEMPOTENTE y re-ejecutable:
--   CREATE TABLE IF NOT EXISTS · ADD COLUMN IF NOT EXISTS · CREATE INDEX IF NOT EXISTS
--   INSERT ... ON CONFLICT DO NOTHING para semillas.
-- NO elimina ni reescribe tablas/columnas existentes — solo extiende.
--
-- Aplicar DESPUÉS de 002 con:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/003_functional_store.sql
-- (No usar el splitter de scripts/db-migrate.js para este archivo: aplica con psql.)
--
-- Convención de dinero: INTEGER en CHF ENTEROS (francos), igual que 001/002.
-- Los porcentajes (descuentos, tasa de impuesto) usan NUMERIC. Una sola moneda
-- (CHF); las columnas `currency` quedan por extensibilidad, no por multi-moneda.
-- Respeta el namespacing de PK de variante <product_id>::<variant_id> (lib/postgres).
-- ============================================================================


-- ============================================================================
-- 1 · PRODUCTOS — Publicación, vendor/tipo, SEO (Shopify Product)
-- ----------------------------------------------------------------------------
-- products (baseline) ya tiene slug (= handle), active, base_price_chf, JSONB de
-- copy/ficha. Añadimos los campos comerciales que Shopify expone en Product.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor          TEXT NOT NULL DEFAULT 'Ofelia Vallejo';
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type    TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'active';  -- draft | active | archived
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title       TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description  TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ;

-- Backfill suave (idempotente): los activos sin fecha de publicación quedan
-- publicados a su creación; el estado refleja la bandera `active` heredada.
UPDATE products SET published_at = created_at WHERE active = TRUE AND published_at IS NULL;
UPDATE products SET status = 'draft' WHERE active = FALSE AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);


-- ============================================================================
-- 2 · PRODUCTOS — Tags / etiquetas (Shopify Product.tags)
-- ----------------------------------------------------------------------------
-- Shopify modela tags como strings libres. Tabla puente normalizada (búsqueda
-- por etiqueta) en lugar de un campo array, para indexar y filtrar fácil.
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_tags (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (product_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);


-- ============================================================================
-- 3 · PRODUCTOS — Media enriquecida (Shopify Media: imagen/vídeo/3D)
-- ----------------------------------------------------------------------------
-- product_images (baseline) sigue siendo la galería actual. product_media
-- amplía a vídeo / vídeo externo / modelo 3D sin tocar lo existente (coexisten).
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_media (
  id          BIGSERIAL PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  media_type  TEXT NOT NULL DEFAULT 'image',   -- image | video | external_video | model_3d
  url         TEXT NOT NULL,
  preview_url TEXT NOT NULL DEFAULT '',
  alt         TEXT NOT NULL DEFAULT '',
  position    INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id);


-- ============================================================================
-- 4 · CUSTOM DATA — Metafields genéricos (Shopify Metafield)
-- ----------------------------------------------------------------------------
-- El proyecto ya guarda datos flexibles en columnas JSONB (engrave, specs…).
-- Esta tabla añade metafields tipados clave/valor por entidad (producto,
-- variante, cliente, pedido, colección) — el patrón canónico de Shopify para
-- extender objetos sin migraciones de esquema.
-- ============================================================================

CREATE TABLE IF NOT EXISTS metafields (
  id         BIGSERIAL PRIMARY KEY,
  owner_type TEXT NOT NULL,                         -- product | variant | customer | order | collection
  owner_id   TEXT NOT NULL,
  namespace  TEXT NOT NULL DEFAULT 'custom',
  key        TEXT NOT NULL,
  value      TEXT NOT NULL DEFAULT '',
  value_type TEXT NOT NULL DEFAULT 'single_line_text_field',  -- tipo Shopify del valor
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_type, owner_id, namespace, key)
);

CREATE INDEX IF NOT EXISTS idx_metafields_owner ON metafields(owner_type, owner_id);


-- ============================================================================
-- 5 · PRECIOS — Listas de precio por contexto (Shopify PriceList)
-- ----------------------------------------------------------------------------
-- Mantiene CHF como única moneda. price_lists permite precios por contexto
-- (p.ej. mayorista / staff / campaña) sin tocar el precio base de la variante.
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_lists (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'chf',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_list_prices (
  id                   BIGSERIAL PRIMARY KEY,
  price_list_id        TEXT NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  variant_id           TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  price_chf            INT  NOT NULL DEFAULT 0 CHECK (price_chf >= 0),
  compare_at_price_chf INT,
  UNIQUE (price_list_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_price_list_prices_variant ON price_list_prices(variant_id);

-- Semilla: lista de precio pública por defecto (precio actual de la variante).
INSERT INTO price_lists (id, name, currency, active)
VALUES ('pl-public', 'Precio público (CHF)', 'chf', TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 6 · IMPUESTOS — Zonas y tasas (Shopify TaxLine / tax settings)
-- ----------------------------------------------------------------------------
-- tax_zones agrupa países; tax_rates fija el porcentaje (TVA suiza 8.1%).
-- order_tax_lines guarda el impuesto efectivamente aplicado por pedido/línea
-- (snapshot, igual que Shopify TaxLine).
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_zones (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  countries  TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id                TEXT PRIMARY KEY,
  zone_id           TEXT REFERENCES tax_zones(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,                       -- 'TVA Suisse'
  country           TEXT NOT NULL DEFAULT '',            -- lookup directo por país (ISO-2)
  rate              NUMERIC(6,3) NOT NULL DEFAULT 0,     -- 8.1 => 8.1 %
  included_in_price BOOLEAN NOT NULL DEFAULT FALSE,      -- precio incluye IVA (B2C UE/CH)
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_rates_country ON tax_rates(country);

CREATE TABLE IF NOT EXISTS order_tax_lines (
  id                 BIGSERIAL PRIMARY KEY,
  order_id           TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_line_item_id BIGINT REFERENCES order_line_items(id) ON DELETE SET NULL,
  title              TEXT NOT NULL DEFAULT 'VAT',
  rate               NUMERIC(6,3) NOT NULL DEFAULT 0,
  amount_chf         INT  NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tax_lines_order ON order_tax_lines(order_id);

-- Semilla: TVA Suiza 8.1 % (tasa estándar vigente). Mercado base Lausanne.
INSERT INTO tax_zones (id, name, countries)
VALUES ('tz-ch', 'Suiza', ARRAY['CH','LI'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO tax_rates (id, zone_id, name, country, rate, included_in_price, active)
VALUES ('tax-ch-vat', 'tz-ch', 'TVA Suisse (8.1%)', 'CH', 8.1, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 7 · ENVÍOS — Zonas, tarifas y retiro en atelier (Shopify DeliveryProfile/Rate)
-- ----------------------------------------------------------------------------
-- shipping_zones por país; shipping_rates = método de entrega (estándar/express/
-- pickup). El pickup referencia una `location` (Atelier Medellín). La tarifa
-- elegida se materializa por pedido en order_shipping_lines.
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipping_zones (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  countries  TEXT[] NOT NULL DEFAULT '{}',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipping_rates (
  id                 TEXT PRIMARY KEY,
  zone_id            TEXT REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,                         -- 'Standard', 'Express', 'Retiro en Atelier'
  method             TEXT NOT NULL DEFAULT 'shipping',      -- shipping | pickup
  location_id        TEXT REFERENCES locations(id) ON DELETE SET NULL,  -- requerido si method='pickup'
  price_chf          INT  NOT NULL DEFAULT 0 CHECK (price_chf >= 0),
  free_over_chf      INT,                                   -- envío gratis si subtotal >= valor (NULL = nunca)
  estimated_days_min INT,
  estimated_days_max INT,
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order         INT  NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON shipping_rates(zone_id);

CREATE TABLE IF NOT EXISTS order_shipping_lines (
  id               BIGSERIAL PRIMARY KEY,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipping_rate_id TEXT REFERENCES shipping_rates(id) ON DELETE SET NULL,
  title            TEXT NOT NULL DEFAULT '',
  carrier          TEXT NOT NULL DEFAULT '',
  method           TEXT NOT NULL DEFAULT 'shipping',  -- shipping | pickup
  price_chf        INT  NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_shipping_lines_order ON order_shipping_lines(order_id);

-- Semillas: zona Suiza, zona Europa, y retiro en Atelier Medellín.
INSERT INTO shipping_zones (id, name, countries, active) VALUES
  ('sz-ch', 'Suiza',  ARRAY['CH','LI'], TRUE),
  ('sz-eu', 'Europa', ARRAY['DE','FR','IT','ES','GB','AT','BE','NL','LU','PT'], TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shipping_rates (id, zone_id, name, method, location_id, price_chf, free_over_chf, estimated_days_min, estimated_days_max, sort_order) VALUES
  ('rate-ch-standard', 'sz-ch', 'Envío estándar Suiza', 'shipping', NULL, 15, 500, 2, 4, 10),
  ('rate-eu-standard', 'sz-eu', 'Envío estándar Europa', 'shipping', NULL, 25, 700, 4, 8, 20),
  ('rate-pickup-atelier', NULL, 'Retiro en Atelier Medellín', 'pickup', 'loc-medellin', 0, NULL, NULL, NULL, 1)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 8 · INVENTARIO OPERATIVO — Stock entrante + libro mayor de movimientos
-- ----------------------------------------------------------------------------
-- inventory_levels (002) ya tiene available / reserved (= committed) / on_hand.
-- Añadimos `incoming` (en tránsito) y un LIBRO MAYOR inmutable de movimientos
-- (Shopify InventoryAdjustmentGroup / changes): toda variación de stock queda
-- auditada con motivo y referencia al documento origen (pedido/refund/return).
-- ============================================================================

ALTER TABLE inventory_levels ADD COLUMN IF NOT EXISTS incoming INT NOT NULL DEFAULT 0 CHECK (incoming >= 0);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id             BIGSERIAL PRIMARY KEY,
  variant_id     TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  location_id    TEXT REFERENCES locations(id) ON DELETE SET NULL,
  delta          INT  NOT NULL,                       -- +restock / -venta
  reason         TEXT NOT NULL DEFAULT 'manual',      -- sale | restock | manual | return | reservation | release | correction
  quantity_after INT,                                 -- snapshot de available tras el movimiento
  reference_type TEXT NOT NULL DEFAULT '',            -- order | refund | return | ''
  reference_id   TEXT NOT NULL DEFAULT '',
  note           TEXT NOT NULL DEFAULT '',
  created_by     TEXT NOT NULL DEFAULT 'system',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_adj_variant ON inventory_adjustments(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_adj_ref     ON inventory_adjustments(reference_type, reference_id);


-- ============================================================================
-- 9 · PEDIDOS — Campos de ciclo completo + tags/notas (Shopify Order)
-- ----------------------------------------------------------------------------
-- orders (001/002) ya tiene desgloses, financial_status y fulfillment_status.
-- Añadimos nota, canal de venta, total reembolsado y cancelación.
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS note          TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel_id    TEXT;                      -- ref. suelta a sales_channels (como customer_id)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_chf  INT  NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS order_tags (
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (order_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_order_tags_tag ON order_tags(tag);


-- ============================================================================
-- 10 · PEDIDOS — Borradores / cotizaciones manuales (Shopify DraftOrder)
-- ----------------------------------------------------------------------------
-- Pedidos creados manualmente por el atelier (venta directa, cotización por
-- WhatsApp/email). Al confirmarse, `converted_order_id` enlaza al Order real.
-- ============================================================================

CREATE TABLE IF NOT EXISTS draft_orders (
  id                 TEXT PRIMARY KEY,
  customer_id        TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_email     TEXT NOT NULL DEFAULT '',
  customer_name      TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'open',   -- open | invoice_sent | completed | cancelled
  currency           TEXT NOT NULL DEFAULT 'chf',
  subtotal_chf       INT  NOT NULL DEFAULT 0,
  discount_chf       INT  NOT NULL DEFAULT 0,
  shipping_chf       INT  NOT NULL DEFAULT 0,
  tax_chf            INT  NOT NULL DEFAULT 0,
  total_chf          INT  NOT NULL DEFAULT 0,
  note               TEXT NOT NULL DEFAULT '',
  converted_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS draft_order_line_items (
  id                BIGSERIAL PRIMARY KEY,
  draft_order_id    TEXT NOT NULL REFERENCES draft_orders(id) ON DELETE CASCADE,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id        TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name      TEXT NOT NULL DEFAULT '',
  variant_label     TEXT NOT NULL DEFAULT '',
  sku               TEXT NOT NULL DEFAULT '',
  quantity          INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_chf    INT  NOT NULL DEFAULT 0,
  engrave_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  engrave_text      TEXT NOT NULL DEFAULT '',
  engrave_price_chf INT  NOT NULL DEFAULT 0,
  line_total_chf    INT  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_draft_oli_draft ON draft_order_line_items(draft_order_id);


-- ============================================================================
-- 11 · PEDIDOS — Reembolsos (Shopify Refund / OrderTransaction kind=refund)
-- ----------------------------------------------------------------------------
-- refunds reutiliza `payments` (kind='refund') para la transacción Stripe.
-- refund_line_items detalla qué líneas se reembolsan y si se reponen a stock.
-- ============================================================================

CREATE TABLE IF NOT EXISTS refunds (
  id               TEXT PRIMARY KEY,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id       TEXT REFERENCES payments(id) ON DELETE SET NULL,
  amount_chf       INT  NOT NULL DEFAULT 0 CHECK (amount_chf >= 0),
  reason           TEXT NOT NULL DEFAULT '',     -- customer | damaged | fraud | other
  note             TEXT NOT NULL DEFAULT '',
  restock          BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_refund_id TEXT UNIQUE,
  created_by       TEXT NOT NULL DEFAULT 'system',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_line_items (
  id                 BIGSERIAL PRIMARY KEY,
  refund_id          TEXT NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  order_line_item_id BIGINT REFERENCES order_line_items(id) ON DELETE SET NULL,
  quantity           INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount_chf         INT  NOT NULL DEFAULT 0,
  restock            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_refunds_order    ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refund_li_refund ON refund_line_items(refund_id);


-- ============================================================================
-- 12 · PEDIDOS — Devoluciones / RMA (Shopify Return)
-- ----------------------------------------------------------------------------
-- Flujo de devolución física (puede preceder a un refund). `refund_id` enlaza
-- la devolución con su reembolso si finalmente se reembolsa.
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rma        TEXT UNIQUE,
  status     TEXT NOT NULL DEFAULT 'requested',  -- requested | approved | in_transit | received | closed | declined
  reason     TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  refund_id  TEXT REFERENCES refunds(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_line_items (
  id                 BIGSERIAL PRIMARY KEY,
  return_id          TEXT NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_line_item_id BIGINT REFERENCES order_line_items(id) ON DELETE SET NULL,
  quantity           INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  condition          TEXT NOT NULL DEFAULT '',   -- resellable | damaged
  restocked          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_returns_order    ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_return_li_return ON return_line_items(return_id);


-- ============================================================================
-- 13 · PEDIDOS — Evaluación de riesgo (Shopify OrderRisk) · opcional
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_risks (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  level      TEXT NOT NULL DEFAULT 'low',   -- low | medium | high
  score      NUMERIC(4,2),
  message    TEXT NOT NULL DEFAULT '',
  source     TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_risks_order ON order_risks(order_id);


-- ============================================================================
-- 14 · CLIENTES — Tags, segmentos, consentimiento (Shopify Customer/Segment)
-- ----------------------------------------------------------------------------
-- customers (002) ya tiene accepts_marketing. Añadimos la fecha de consentimiento
-- y modelamos tags + segmentos (Shopify CustomerSegment) para campañas.
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_marketing_consent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS customer_tags (
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  PRIMARY KEY (customer_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_tag ON customer_tags(tag);

CREATE TABLE IF NOT EXISTS customer_segments (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_segment_members (
  segment_id  TEXT NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (segment_id, customer_id)
);


-- ============================================================================
-- 15 · CLIENTES — Tarjetas de regalo (Shopify GiftCard) + libro mayor
-- ----------------------------------------------------------------------------
-- gift_cards mantiene saldo en CHF; gift_card_transactions audita emisión y
-- redenciones (negativo = redime, positivo = emite/recarga/reembolso).
-- ============================================================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id                TEXT PRIMARY KEY,
  code              TEXT UNIQUE NOT NULL,
  initial_value_chf INT  NOT NULL DEFAULT 0 CHECK (initial_value_chf >= 0),
  balance_chf       INT  NOT NULL DEFAULT 0 CHECK (balance_chf >= 0),
  currency          TEXT NOT NULL DEFAULT 'chf',
  customer_id       TEXT REFERENCES customers(id) ON DELETE SET NULL,
  order_id          TEXT REFERENCES orders(id) ON DELETE SET NULL,   -- pedido que la emitió
  status            TEXT NOT NULL DEFAULT 'active',  -- active | redeemed | disabled | expired
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id           BIGSERIAL PRIMARY KEY,
  gift_card_id TEXT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  amount_chf   INT  NOT NULL,                 -- - redime / + emite o reembolsa
  order_id     TEXT REFERENCES orders(id) ON DELETE SET NULL,
  note         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code   ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gc_tx_gift_card   ON gift_card_transactions(gift_card_id);


-- ============================================================================
-- 16 · DESCUENTOS — Automáticos vs. código + condiciones (Shopify Discount)
-- ----------------------------------------------------------------------------
-- discounts (002) ya tiene code/type/value/min_subtotal/vigencia/usage_limit.
-- Añadimos `method` (code | automatic), `target_type` (order | shipping = envío
-- gratis) y `priority`. discount_conditions restringe a colección/producto/etc.
-- NOTA: `type` admite 'percentage' | 'fixed_amount'; el "envío gratis" se modela
-- con target_type='shipping' (no se fuerza un CHECK nuevo sobre la columna
-- heredada para preservar idempotencia y datos existentes).
-- ============================================================================

ALTER TABLE discounts ADD COLUMN IF NOT EXISTS method      TEXT NOT NULL DEFAULT 'code';    -- code | automatic
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'order';   -- order | shipping
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS priority    INT  NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS discount_conditions (
  id             BIGSERIAL PRIMARY KEY,
  discount_id    TEXT NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,                 -- collection | product | variant | min_quantity | min_subtotal
  ref_id         TEXT NOT NULL DEFAULT '',      -- collection_id | product_id | variant_id
  int_value      INT,                           -- min_quantity / min_subtotal_chf
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_conditions_disc ON discount_conditions(discount_id);


-- ============================================================================
-- 17 · OPERACIÓN — Canales de venta, equipo y bitácora (Shopify Channel/Staff)
-- ----------------------------------------------------------------------------
-- sales_channels distingue web vs. atelier (POS). staff_users + audit_log dan
-- trazabilidad de las acciones del panel admin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_channels (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'online',  -- online | pos | social | marketplace
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',  -- owner | admin | staff
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT '',
  entity_id     TEXT NOT NULL DEFAULT '',
  detail        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Semilla: canales web (online) y atelier (POS).
INSERT INTO sales_channels (id, name, type, active) VALUES
  ('ch-web',     'Sitio web · ofeliavallejo.com', 'online', TRUE),
  ('ch-atelier', 'Atelier Medellín',               'pos',    TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- FIN migración 003. Re-ejecutable sin error (idempotente). Aplicar tras 002.
-- ============================================================================
