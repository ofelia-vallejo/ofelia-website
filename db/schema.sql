-- Ofelia Vallejo — Schema PostgreSQL
-- Ejecutar una vez: node db/migrate.js

-- ─── CATEGORÍAS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(60) UNIQUE NOT NULL,
  name          VARCHAR(120) NOT NULL,
  display_order SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COLORES DE CUERO ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leather_colors (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(60) UNIQUE NOT NULL,
  name        VARCHAR(80) NOT NULL,
  hex_code    CHAR(7) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id                   SERIAL PRIMARY KEY,
  sku                  VARCHAR(40) UNIQUE NOT NULL,
  name                 VARCHAR(120) NOT NULL,
  category_id          INT REFERENCES categories(id) ON DELETE SET NULL,
  description          TEXT,
  materials            TEXT,
  dimensions           TEXT,
  weight_grams         INT,
  base_price_eur       DECIMAL(10,2) NOT NULL DEFAULT 0,
  engraving_available  BOOLEAN DEFAULT TRUE,
  is_active            BOOLEAN DEFAULT TRUE,
  display_order        SMALLINT DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VARIANTES (SKU x COLOR) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_variants (
  id             SERIAL PRIMARY KEY,
  product_id     INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id       INT NOT NULL REFERENCES leather_colors(id),
  sku_variant    VARCHAR(60) UNIQUE NOT NULL,
  price_override DECIMAL(10,2),
  stock_units    INT DEFAULT 0 CHECK (stock_units >= 0),
  is_available   BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── IMÁGENES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id            SERIAL PRIMARY KEY,
  product_id    INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id    INT REFERENCES product_variants(id) ON DELETE SET NULL,
  url           TEXT NOT NULL,
  alt_text      VARCHAR(200),
  display_order SMALLINT DEFAULT 0,
  is_hero       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROVEEDORES ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  contact_name  VARCHAR(120),
  email         VARCHAR(200),
  phone         VARCHAR(40),
  address       TEXT,
  city          VARCHAR(80),
  country       VARCHAR(80) DEFAULT 'Colombia',
  material_type VARCHAR(120),
  notes         TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id         SERIAL PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name  VARCHAR(80),
  email      VARCHAR(200) UNIQUE NOT NULL,
  phone      VARCHAR(40),
  address    TEXT,
  city       VARCHAR(80),
  country    VARCHAR(80),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PEDIDOS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  order_number     VARCHAR(30) UNIQUE NOT NULL,
  customer_id      INT REFERENCES customers(id) ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','in_production','shipped','delivered','cancelled')),
  total_eur        DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_address TEXT,
  shipping_city    VARCHAR(80),
  shipping_country VARCHAR(80),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LÍNEAS DE PEDIDO ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id                 SERIAL PRIMARY KEY,
  order_id           INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id         INT NOT NULL REFERENCES product_variants(id),
  quantity           INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_eur     DECIMAL(10,2) NOT NULL,
  engraving_type     VARCHAR(20) CHECK (engraving_type IN ('iniciales','nombre','fecha','texto')),
  engraving_text     VARCHAR(60),
  engraving_price_eur DECIMAL(10,2) DEFAULT 0,
  subtotal_eur       DECIMAL(10,2) GENERATED ALWAYS AS
                       ((unit_price_eur + COALESCE(engraving_price_eur, 0)) * quantity) STORED
);

-- ─── MOVIMIENTOS DE INVENTARIO ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory_movements (
  id            SERIAL PRIMARY KEY,
  variant_id    INT NOT NULL REFERENCES product_variants(id),
  supplier_id   INT REFERENCES suppliers(id) ON DELETE SET NULL,
  order_item_id INT REFERENCES order_items(id) ON DELETE SET NULL,
  movement_type VARCHAR(20) NOT NULL
                  CHECK (movement_type IN ('purchase','sale','adjustment','return','sample')),
  quantity      INT NOT NULL,
  unit_cost_eur DECIMAL(10,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIGGER: updated_at automático ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
