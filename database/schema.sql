-- Ofelia Vallejo · PostgreSQL schema
-- Run: psql $DATABASE_URL -f database/schema.sql

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category_id TEXT REFERENCES categories(id),
  line TEXT DEFAULT '',
  numeral TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  personalizable BOOLEAN NOT NULL DEFAULT TRUE,
  base_price_chf INT NOT NULL DEFAULT 0,
  engrave_price_chf INT NOT NULL DEFAULT 0,
  inventory INT NOT NULL DEFAULT 0,
  low_stock_at INT NOT NULL DEFAULT 2,
  pdp_path TEXT DEFAULT '',
  engrave JSONB NOT NULL DEFAULT '{}',
  color_data JSONB NOT NULL DEFAULT '{}',
  accordion JSONB NOT NULL DEFAULT '[]',
  editorial_image TEXT DEFAULT '',
  editorial_caption TEXT DEFAULT '',
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT DEFAULT '',
  color_name TEXT DEFAULT '',
  color_hex TEXT DEFAULT '',
  color_key TEXT DEFAULT '',
  inventory INT NOT NULL DEFAULT 0,
  price_chf INT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt TEXT DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'gallery',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  product_id TEXT REFERENCES products(id),
  variant_id TEXT,
  total_chf INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'chf',
  line_items JSONB NOT NULL DEFAULT '[]',
  engrave_config JSONB NOT NULL DEFAULT '{}',
  shipping_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Clientes registrados (cuenta / atelier)
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personalization_requests (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  producto TEXT NOT NULL,
  tipo_grabado TEXT NOT NULL,
  texto_grabado TEXT NOT NULL,
  mensaje TEXT DEFAULT '',
  font TEXT DEFAULT '',
  size TEXT DEFAULT '',
  layout TEXT DEFAULT '',
  base_price_chf INT,
  engrave_price_chf INT,
  total_estimated_chf INT,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_personalization_ref ON personalization_requests(ref);
CREATE INDEX IF NOT EXISTS idx_personalization_customer ON personalization_requests(customer_id);

-- Lista de correo · cupón lanzamiento (sin cuenta)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  coupon_code TEXT NOT NULL DEFAULT 'OV-TEMPORADA',
  source TEXT NOT NULL DEFAULT 'launch_popup',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
