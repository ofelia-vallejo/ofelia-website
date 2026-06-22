-- ============================================================================
-- Ofelia Vallejo · Migración 002 — Modelo de comercio completo (ER)
-- ----------------------------------------------------------------------------
-- Evolución NO destructiva del esquema base (database/schema.sql = baseline 001).
-- Inspirado en el modelo de datos canónico de Shopify, adaptado al tamaño real
-- de esta Leather House (mono-moneda CHF, un atelier en Medellín).
--
-- 100% IDEMPOTENTE y re-ejecutable:
--   CREATE TABLE IF NOT EXISTS · ADD COLUMN IF NOT EXISTS · CREATE INDEX IF NOT EXISTS
--   INSERT ... ON CONFLICT DO NOTHING para semillas.
--
-- NO elimina ni reescribe tablas/columnas existentes — solo extiende.
--
-- Aplicar con:  psql "$DATABASE_URL" -f database/migrations/002_full_commerce_model.sql
-- (No usar el splitter de scripts/db-migrate.js para este archivo: aplica con psql.)
--
-- Convención de dinero: INTEGER en CHF ENTEROS (francos), igual que el esquema
-- y el código actuales (products.base_price_chf, orders.total_chf, etc.).
-- Stripe recibe céntimos (× 100) en lib/build-stripe-lines.js. Los porcentajes de
-- descuento usan NUMERIC para precisión; los importes en CHF permanecen INT.
-- ============================================================================


-- ============================================================================
-- 1 · CATÁLOGO — Colecciones editoriales (Guanábana, Borojó, Uchuva…)
-- ----------------------------------------------------------------------------
-- `categories` (baseline) sigue siendo la taxonomía primaria del producto.
-- `collections` modela agrupaciones editoriales (equivale a Shopify Collection),
-- permitiendo que un producto pertenezca a varias colecciones (many-to-many).
-- ============================================================================

CREATE TABLE IF NOT EXISTS collections (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  hero_image  TEXT NOT NULL DEFAULT '',
  sort_order  INT  NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_collections (
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  sort_order    INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_slug        ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_prod_collections_coll   ON product_collections(collection_id);


-- ============================================================================
-- 2 · CATÁLOGO — Opciones y valores de variante (Shopify Options/OptionValues)
-- ----------------------------------------------------------------------------
-- Hoy una variante = color de cuero. La hoja de inventario muestra además ejes
-- de Tamaño (v-standard / v-grande) y Línea (v-mod / v-clasica / v-elite).
-- Este bloque normaliza esos ejes sin romper product_variants (baseline).
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_options (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,          -- 'Color', 'Tamaño', 'Línea'
  position   INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_option_values (
  id        TEXT PRIMARY KEY,
  option_id TEXT NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value     TEXT NOT NULL,           -- 'Negro', 'Rústico', 'Grande'
  position  INT  NOT NULL DEFAULT 0
);

-- Tabla puente: a qué valores de opción corresponde cada variante.
CREATE TABLE IF NOT EXISTS variant_option_values (
  variant_id      TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id TEXT NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_options_product  ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_option_values_option  ON product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_variant_optvals_var   ON variant_option_values(variant_id);


-- ============================================================================
-- 3 · CATÁLOGO — Campos extra de variante (Shopify ProductVariant)
-- ----------------------------------------------------------------------------
-- Extiende product_variants (baseline) con atributos logísticos/comerciales.
-- ============================================================================

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS barcode               TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS weight_grams          INT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS compare_at_price_chf  INT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS requires_shipping     BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS active                BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);


-- ============================================================================
-- 4 · INVENTARIO — Ubicaciones y niveles (Shopify Location / InventoryLevel)
-- ----------------------------------------------------------------------------
-- La variante actúa como InventoryItem (mapeo pragmático). `inventory_levels`
-- normaliza el stock por (variante × ubicación) con disponible/reservado/físico.
--
-- NOTA DE COEXISTENCIA: hoy el stock vive en product_variants.inventory y
-- products.inventory, y el webhook descuenta ahí (lib/postgres.decrementInventory).
-- `inventory_levels` es la capa normalizada destino. Mientras se migra, la columna
-- variant.inventory sigue siendo la fuente de verdad. Ver "Próximos pasos" en
-- docs/MODELO_ER.md (saveCatalog hoy borra y recrea variantes, lo que en CASCADE
-- vaciaría inventory_levels; debe pasarse a UPSERT antes de cortar a esta tabla).
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'atelier',   -- atelier | warehouse | retail
  city       TEXT NOT NULL DEFAULT '',
  country    TEXT NOT NULL DEFAULT 'CO',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_levels (
  id          BIGSERIAL PRIMARY KEY,
  variant_id  TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  available   INT NOT NULL DEFAULT 0 CHECK (available >= 0),
  reserved    INT NOT NULL DEFAULT 0 CHECK (reserved  >= 0),
  on_hand     INT NOT NULL DEFAULT 0 CHECK (on_hand   >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_levels_variant  ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_levels_location ON inventory_levels(location_id);

-- Semilla: atelier principal en Medellín (idempotente).
INSERT INTO locations (id, name, type, city, country, is_default)
VALUES ('loc-medellin', 'Atelier Medellín', 'atelier', 'Medellín', 'CO', TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 5 · CLIENTES — Direcciones (Shopify Customer → MailingAddress)
-- ----------------------------------------------------------------------------
-- Extiende customers (baseline) y añade libreta de direcciones envío/facturación.
-- ============================================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS accepts_marketing        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_address_id       TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at            TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS orders_count             INT NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent_chf          INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id          TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'shipping',   -- shipping | billing
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  full_name   TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  line1       TEXT NOT NULL DEFAULT '',
  line2       TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  region      TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT 'CH',
  phone       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_addr_customer ON customer_addresses(customer_id);


-- ============================================================================
-- 6 · CARRITO — Persistencia opcional server-side (Shopify Cart/Checkout)
-- ----------------------------------------------------------------------------
-- El carrito actual es client-side (assets/js/cart.js + localStorage). Esto NO lo
-- reemplaza: es una capa OPCIONAL para carritos abandonados / recuperables /
-- multi-dispositivo. `token` puede sincronizarse con el id de localStorage.
-- ============================================================================

CREATE TABLE IF NOT EXISTS carts (
  id                 TEXT PRIMARY KEY,
  token              TEXT UNIQUE,                     -- token anónimo (= localStorage)
  customer_id        TEXT REFERENCES customers(id) ON DELETE SET NULL,
  email              TEXT NOT NULL DEFAULT '',
  currency           TEXT NOT NULL DEFAULT 'chf',
  status             TEXT NOT NULL DEFAULT 'active',  -- active | converted | abandoned
  subtotal_chf       INT  NOT NULL DEFAULT 0,
  coupon_code        TEXT NOT NULL DEFAULT '',
  converted_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id                TEXT PRIMARY KEY,
  cart_id           TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id        TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  slug              TEXT NOT NULL DEFAULT '',
  quantity          INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_chf    INT  NOT NULL DEFAULT 0,
  engrave_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  engrave_text      TEXT NOT NULL DEFAULT '',
  engrave_price_chf INT  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_customer  ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_status    ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);


-- ============================================================================
-- 7 · VENTAS — Extensión de `orders` (baseline) con totales desglosados
-- ----------------------------------------------------------------------------
-- No se toca la columna line_items JSONB existente (sigue siendo la fuente de
-- verdad del webhook). Se añaden desgloses y estados estilo Shopify Order.
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_chf       INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_chf       INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_chf       INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_chf            INT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS financial_status   TEXT NOT NULL DEFAULT 'pending';     -- pending | paid | refunded | voided
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'; -- unfulfilled | partial | fulfilled
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code        TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id            TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_financial  ON orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfill    ON orders(fulfillment_status);


-- ============================================================================
-- 8 · VENTAS — Líneas de pedido normalizadas (Shopify LineItem)
-- ----------------------------------------------------------------------------
-- Compañero normalizado de orders.line_items (JSONB). Las FKs usan
-- ON DELETE SET NULL + columnas snapshot, para que el historial sobreviva aunque
-- el producto/variante se elimine (saveCatalog borra productos no presentes).
-- La personalización (grabado láser) se modela A NIVEL DE LÍNEA.
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_line_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  variant_id        TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  -- Snapshots (sobreviven al borrado de producto/variante)
  slug              TEXT NOT NULL DEFAULT '',
  product_name      TEXT NOT NULL DEFAULT '',
  variant_label     TEXT NOT NULL DEFAULT '',
  sku               TEXT NOT NULL DEFAULT '',
  quantity          INT  NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_chf    INT  NOT NULL DEFAULT 0,
  -- Personalización (grabado láser «Tu nombre. En cuero.»)
  engrave_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  engrave_text      TEXT NOT NULL DEFAULT '',
  engrave_font      TEXT NOT NULL DEFAULT '',
  engrave_size      TEXT NOT NULL DEFAULT '',
  engrave_layout    TEXT NOT NULL DEFAULT '',
  engrave_price_chf INT  NOT NULL DEFAULT 0,
  line_total_chf    INT  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oli_order   ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oli_product ON order_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_oli_variant ON order_line_items(variant_id);


-- ============================================================================
-- 9 · VENTAS — Snapshot de direcciones del pedido (Shopify Order address)
-- ----------------------------------------------------------------------------
-- Copia inmutable de la dirección al momento de la compra (la dirección del
-- cliente puede cambiar después; el pedido conserva su snapshot).
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_addresses (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'shipping',   -- shipping | billing
  full_name   TEXT NOT NULL DEFAULT '',
  company     TEXT NOT NULL DEFAULT '',
  line1       TEXT NOT NULL DEFAULT '',
  line2       TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  region      TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  country     TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, type)
);

CREATE INDEX IF NOT EXISTS idx_order_addr_order ON order_addresses(order_id);


-- ============================================================================
-- 10 · PAGOS — Transacciones Stripe (Shopify Transaction / OrderTransaction)
-- ----------------------------------------------------------------------------
-- Historial de cargos/reembolsos. `stripe_event_id` con UNIQUE da idempotencia
-- explícita (hoy la idempotencia vive en order_events.payload->>'stripe_event_id';
-- esta tabla la formaliza sin reemplazar la actual).
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                    TEXT PRIMARY KEY,
  order_id              TEXT REFERENCES orders(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL DEFAULT 'stripe',
  kind                  TEXT NOT NULL DEFAULT 'charge',  -- charge | refund | authorization
  status                TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
  amount_chf            INT  NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'chf',
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  stripe_event_id       TEXT UNIQUE,                     -- idempotencia de webhook
  error_message         TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order   ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_intent  ON payments(stripe_payment_intent);


-- ============================================================================
-- 11 · VENTAS — Historial de estado del pedido (Shopify Order timeline)
-- ----------------------------------------------------------------------------
-- order_events (baseline) registra eventos crudos de Stripe; esta tabla es la
-- transición de estado de negocio, legible y enfocada.
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL DEFAULT '',
  to_status   TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_hist_order ON order_status_history(order_id);


-- ============================================================================
-- 12 · LOGÍSTICA — Envíos / cumplimientos (Shopify Fulfillment)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fulfillments (
  id              TEXT PRIMARY KEY,
  order_id        TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  location_id     TEXT REFERENCES locations(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | shipped | delivered | canceled
  carrier         TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  tracking_url    TEXT NOT NULL DEFAULT '',
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fulfillment_line_items (
  id                  BIGSERIAL PRIMARY KEY,
  fulfillment_id      TEXT   NOT NULL REFERENCES fulfillments(id) ON DELETE CASCADE,
  order_line_item_id  BIGINT NOT NULL REFERENCES order_line_items(id) ON DELETE CASCADE,
  quantity            INT    NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fli_fulfillment    ON fulfillment_line_items(fulfillment_id);


-- ============================================================================
-- 13 · DESCUENTOS — Cupones (Shopify Discount / PriceRule)
-- ----------------------------------------------------------------------------
-- Modela LAUNCH_COUPON_CODE (OV-TEMPORADA) y futuros cupones, con aplicación
-- por pedido en order_discounts (snapshot de código + importe).
-- ============================================================================

CREATE TABLE IF NOT EXISTS discounts (
  id                TEXT PRIMARY KEY,
  code              TEXT UNIQUE NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  type              TEXT NOT NULL DEFAULT 'percentage',  -- percentage | fixed_amount
  value             NUMERIC(10,2) NOT NULL DEFAULT 0,    -- 10 => 10% · ó 10.00 CHF
  currency          TEXT NOT NULL DEFAULT 'chf',
  min_subtotal_chf  INT  NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  usage_limit       INT,                                 -- NULL = ilimitado
  used_count        INT  NOT NULL DEFAULT 0,
  once_per_customer BOOLEAN NOT NULL DEFAULT FALSE,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_discounts (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_id TEXT REFERENCES discounts(id) ON DELETE SET NULL,
  code        TEXT NOT NULL,        -- snapshot del código aplicado
  amount_chf  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discounts_code      ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_order_discounts_ord ON order_discounts(order_id);

-- Semilla: cupón de lanzamiento (10% · ver lib/config.launchDiscountLabel).
-- Ajustar `value`/`ends_at` según campaña vigente.
INSERT INTO discounts (id, code, description, type, value, once_per_customer, active)
VALUES (
  'disc-launch',
  'OV-TEMPORADA',
  '10% en tu primera pieza · lanzamiento de temporada',
  'percentage',
  10,
  TRUE,
  TRUE
)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- FIN migración 002. Re-ejecutable sin error.
-- ============================================================================
