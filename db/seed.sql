-- Ofelia Vallejo — Datos iniciales
-- Ejecutar después de schema.sql

-- ─── CATEGORÍAS ──────────────────────────────────────────────────────────────

INSERT INTO categories (slug, name, display_order) VALUES
  ('travel-bags',  'Travel Bags',  1),
  ('bandoleras',   'Bandoleras',   2),
  ('morrales',     'Morrales',     3),
  ('bolsos-dama',  'Bolsos Dama',  4),
  ('cinturones',   'Cinturones',   5)
ON CONFLICT (slug) DO NOTHING;

-- ─── COLORES ─────────────────────────────────────────────────────────────────

INSERT INTO leather_colors (slug, name, hex_code, description) VALUES
  ('espresso',  'Espresso',       '#3B2B26', 'Café oscuro intenso — pátina natural con el uso'),
  ('navy',      'Navy / Noche',   '#0B1F3A', 'Azul marino profundo — sin forro interior'),
  ('verde',     'Verde / Bosque', '#1F3527', 'Verde profundo andino'),
  ('carbon',    'Carbón / Negro', '#141414', 'Negro absoluto full-grain'),
  ('vino',      'Vino',           '#5B1E24', 'Vino tinto oscuro — cuero teñido a mano'),
  ('rustico',   'Rústico',        '#8B5E3C', 'Cognac / tan — tostado natural')
ON CONFLICT (slug) DO NOTHING;

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────

INSERT INTO products (sku, name, category_id, description, materials, dimensions, base_price_eur, engraving_available, display_order) VALUES
  ('OV-TB-I',   'Travel Bag I',       (SELECT id FROM categories WHERE slug='travel-bags'),
   'Bolsa weekender de cuero colombiano full-grain. Estructura blanda, cierre de latón antiguo, correas ajustables.',
   'Cuero full-grain colombiano curtido vegetal. Herrajes de latón antiguo cepillado.',
   '55 × 30 × 25 cm', 395.00, TRUE, 1),

  ('OV-TB-II',  'Travel Bag II',      (SELECT id FROM categories WHERE slug='travel-bags'),
   'Weekender perfil bajo — interior sin forro para mostrar el cuero bruto.',
   'Cuero full-grain colombiano curtido vegetal. Herrajes de latón antiguo cepillado.',
   '55 × 28 × 22 cm', 395.00, TRUE, 2),

  ('OV-TB-III', 'Travel Bag III',     (SELECT id FROM categories WHERE slug='travel-bags'),
   'Travel bag voluminosa con divisor interior y bolsillo frontal con cremallera de latón.',
   'Cuero full-grain colombiano curtido vegetal. Herrajes de latón antiguo cepillado.',
   '60 × 32 × 28 cm', 420.00, TRUE, 3),

  ('OV-BM',     'Bandolera Moderna',  (SELECT id FROM categories WHERE slug='bandoleras'),
   'Crossbody de perfil limpio, correa ajustable trenzada, cierre magnético de latón.',
   'Cuero full-grain colombiano. Herrajes de latón antiguo.',
   '28 × 20 × 8 cm', 220.00, TRUE, 4),

  ('OV-BE',     'Bandolera Elite',    (SELECT id FROM categories WHERE slug='bandoleras'),
   'Sling de caída larga con hebilla de latón — formato editorial para ciudad y viaje.',
   'Cuero full-grain colombiano. Herrajes de latón antiguo cepillado.',
   '26 × 18 × 6 cm', 245.00, TRUE, 5),

  ('OV-ME',     'Morral Elite',       (SELECT id FROM categories WHERE slug='morrales'),
   'Mochila estructurada con compartimentos internos y espaldar acolchado de cuero.',
   'Cuero full-grain colombiano. Herrajes de latón. Costura reforzada.',
   '40 × 30 × 15 cm', 340.00, TRUE, 6),

  ('OV-MC',     'Morral Clásico',     (SELECT id FROM categories WHERE slug='morrales'),
   'Morral de cordón con base cuadrada — silueta campesina elevada a estándar europeo.',
   'Cuero full-grain colombiano curtido vegetal.',
   '38 × 28 × 14 cm', 295.00, TRUE, 7),

  ('OV-BD',     'Bolso Dama',         (SELECT id FROM categories WHERE slug='bolsos-dama'),
   'Tote estructurado de doble asa — interior sin forro, cuero vivo al tacto.',
   'Cuero full-grain colombiano. Herrajes de latón antiguo.',
   '36 × 28 × 12 cm', 310.00, TRUE, 8),

  ('OV-CI',     'Cinturón',           (SELECT id FROM categories WHERE slug='cinturones'),
   'Cinturón unisex de corte limpio, hebilla de latón antiguo, perforaciones a mano.',
   'Cuero full-grain colombiano 4 mm. Hebilla de latón antiguo cepillado.',
   'Largo ajustable — tallas 85 / 90 / 95 / 100 cm', 95.00, TRUE, 9)
ON CONFLICT (sku) DO NOTHING;

-- ─── VARIANTES ───────────────────────────────────────────────────────────────

INSERT INTO product_variants (product_id, color_id, sku_variant, stock_units, is_available) VALUES
  -- Travel Bag I
  ((SELECT id FROM products WHERE sku='OV-TB-I'),   (SELECT id FROM leather_colors WHERE slug='espresso'), 'OV-TB-I-ESP',   2, TRUE),
  ((SELECT id FROM products WHERE sku='OV-TB-I'),   (SELECT id FROM leather_colors WHERE slug='navy'),     'OV-TB-I-NAV',   1, TRUE),
  ((SELECT id FROM products WHERE sku='OV-TB-I'),   (SELECT id FROM leather_colors WHERE slug='verde'),    'OV-TB-I-VRD',   1, TRUE),
  -- Travel Bag II
  ((SELECT id FROM products WHERE sku='OV-TB-II'),  (SELECT id FROM leather_colors WHERE slug='navy'),     'OV-TB-II-NAV',  2, TRUE),
  ((SELECT id FROM products WHERE sku='OV-TB-II'),  (SELECT id FROM leather_colors WHERE slug='espresso'), 'OV-TB-II-ESP',  1, TRUE),
  -- Travel Bag III
  ((SELECT id FROM products WHERE sku='OV-TB-III'), (SELECT id FROM leather_colors WHERE slug='verde'),    'OV-TB-III-VRD', 1, TRUE),
  ((SELECT id FROM products WHERE sku='OV-TB-III'), (SELECT id FROM leather_colors WHERE slug='carbon'),   'OV-TB-III-CAR', 1, TRUE),
  -- Bandolera Moderna
  ((SELECT id FROM products WHERE sku='OV-BM'),     (SELECT id FROM leather_colors WHERE slug='carbon'),   'OV-BM-CAR',     3, TRUE),
  ((SELECT id FROM products WHERE sku='OV-BM'),     (SELECT id FROM leather_colors WHERE slug='rustico'),  'OV-BM-RST',     2, TRUE),
  -- Bandolera Elite
  ((SELECT id FROM products WHERE sku='OV-BE'),     (SELECT id FROM leather_colors WHERE slug='espresso'), 'OV-BE-ESP',     2, TRUE),
  ((SELECT id FROM products WHERE sku='OV-BE'),     (SELECT id FROM leather_colors WHERE slug='vino'),     'OV-BE-VIN',     1, TRUE),
  -- Morral Elite
  ((SELECT id FROM products WHERE sku='OV-ME'),     (SELECT id FROM leather_colors WHERE slug='navy'),     'OV-ME-NAV',     2, TRUE),
  ((SELECT id FROM products WHERE sku='OV-ME'),     (SELECT id FROM leather_colors WHERE slug='carbon'),   'OV-ME-CAR',     1, TRUE),
  -- Morral Clásico
  ((SELECT id FROM products WHERE sku='OV-MC'),     (SELECT id FROM leather_colors WHERE slug='rustico'),  'OV-MC-RST',     3, TRUE),
  ((SELECT id FROM products WHERE sku='OV-MC'),     (SELECT id FROM leather_colors WHERE slug='espresso'), 'OV-MC-ESP',     2, TRUE),
  -- Bolso Dama
  ((SELECT id FROM products WHERE sku='OV-BD'),     (SELECT id FROM leather_colors WHERE slug='vino'),     'OV-BD-VIN',     2, TRUE),
  ((SELECT id FROM products WHERE sku='OV-BD'),     (SELECT id FROM leather_colors WHERE slug='carbon'),   'OV-BD-CAR',     1, TRUE),
  -- Cinturón
  ((SELECT id FROM products WHERE sku='OV-CI'),     (SELECT id FROM leather_colors WHERE slug='carbon'),   'OV-CI-CAR',     5, TRUE),
  ((SELECT id FROM products WHERE sku='OV-CI'),     (SELECT id FROM leather_colors WHERE slug='rustico'),  'OV-CI-RST',     4, TRUE),
  ((SELECT id FROM products WHERE sku='OV-CI'),     (SELECT id FROM leather_colors WHERE slug='espresso'), 'OV-CI-ESP',     3, TRUE)
ON CONFLICT (sku_variant) DO NOTHING;
