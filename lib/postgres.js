const postgres = require('postgres');

let sql;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : 'require',
      max: 5,
    });
  }
  return sql;
}

function hasPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

// Las variantes del catálogo (data/catalog.json) usan ids tipo color-key
// (v-cognac, v-negro, v-standard…) que se REPITEN entre productos. La tabla
// product_variants tiene PK global, así que insertar el id crudo provoca
// colisiones (23505). Namespeamos el PK por producto sólo dentro de la DB y
// reconstruimos el id original al leer, de modo que el catálogo servido es
// idéntico al modo archivo y el frontend no cambia. Idempotente.
const VID_SEP = '::';

function nsVariantId(productId, variantId) {
  if (!variantId || !productId) return variantId;
  const prefix = productId + VID_SEP;
  return String(variantId).startsWith(prefix) ? variantId : prefix + variantId;
}

function stripVariantId(productId, variantId) {
  if (!variantId || !productId) return variantId;
  const prefix = productId + VID_SEP;
  return String(variantId).startsWith(prefix) ? String(variantId).slice(prefix.length) : variantId;
}

function rowToProduct(p, variants, images) {
  const product = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.short_description,
    description: p.description,
    category: p.category_id,
    line: p.line,
    numeral: p.numeral,
    active: p.active,
    personalizable: p.personalizable,
    basePrice: p.base_price_chf,
    engravePrice: p.engrave_price_chf,
    inventory: p.inventory,
    lowStockAt: p.low_stock_at,
    pdpPath: p.pdp_path,
    engrave: p.engrave || {},
    colorData: p.color_data || {},
    accordion: p.accordion || [],
    editorialImage: p.editorial_image,
    editorialCaption: p.editorial_caption,
    tagline: p.tagline || '',
    heroDescription: p.hero_description || '',
    descriptionParagraphs: p.description_paragraphs || [],
    material: p.material || '',
    dimensions: p.dimensions || '',
    weight: p.weight || '',
    hardware: p.hardware || '',
    care: p.care || '',
    specs: p.specs || [],
    meta: p.meta || {},
    variants: variants.map((v) => ({
      id: stripVariantId(p.id, v.id),
      sku: v.sku,
      colorName: v.color_name,
      colorHex: v.color_hex,
      colorKey: v.color_key,
      inventory: v.inventory,
      priceCHF: v.price_chf != null ? v.price_chf : undefined,
      sort: v.sort_order,
    })),
    images: images.map((i) => ({
      url: i.url,
      alt: i.alt,
      kind: i.kind,
      sort: i.sort_order,
      variantId: stripVariantId(p.id, i.variant_id),
    })),
  };
  return product;
}

async function loadCatalogFromPostgres() {
  const db = getSql();
  if (!db) return null;

  const categories = await db`
    SELECT id, label, sort_order AS sort FROM categories ORDER BY sort_order
  `;

  const products = await db`
    SELECT * FROM products ORDER BY name
  `;

  const variants = await db`SELECT * FROM product_variants ORDER BY sort_order`;
  const images = await db`SELECT * FROM product_images ORDER BY sort_order`;

  const variantsByProduct = {};
  variants.forEach((v) => {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  });

  const imagesByProduct = {};
  images.forEach((i) => {
    if (!imagesByProduct[i.product_id]) imagesByProduct[i.product_id] = [];
    imagesByProduct[i.product_id].push(i);
  });

  return {
    version: 2,
    currency: 'CHF',
    updatedAt: new Date().toISOString(),
    categories: categories.map((c) => ({
      id: c.id,
      label: c.label,
      sort: c.sort,
    })),
    products: products.map((p) =>
      rowToProduct(
        p,
        variantsByProduct[p.id] || [],
        imagesByProduct[p.id] || []
      )
    ),
  };
}

async function saveCatalogToPostgres(catalog) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  await db.begin(async (tx) => {
    for (const c of catalog.categories || []) {
      await tx`
        INSERT INTO categories (id, label, sort_order)
        VALUES (${c.id}, ${c.label}, ${c.sort || 0})
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          sort_order = EXCLUDED.sort_order
      `;
    }

    const existingIds = await tx`SELECT id FROM products`;
    const keepIds = new Set((catalog.products || []).map((p) => p.id));
    for (const row of existingIds) {
      if (!keepIds.has(row.id)) {
        await tx`DELETE FROM products WHERE id = ${row.id}`;
      }
    }

    for (const p of catalog.products || []) {
      await tx`
        INSERT INTO products (
          id, slug, name, short_description, description, category_id,
          line, numeral, active, personalizable, base_price_chf, engrave_price_chf,
          inventory, low_stock_at, pdp_path, engrave, color_data, accordion,
          editorial_image, editorial_caption,
          tagline, hero_description, description_paragraphs,
          material, dimensions, weight, hardware, care, specs,
          meta, updated_at
        ) VALUES (
          ${p.id}, ${p.slug}, ${p.name}, ${p.shortDescription || ''}, ${p.description || ''},
          ${p.category || null}, ${p.line || ''}, ${p.numeral || ''},
          ${p.active !== false}, ${p.personalizable !== false},
          ${Number(p.basePrice) || 0}, ${Number(p.engravePrice) || 0},
          ${Number(p.inventory) || 0}, ${Number(p.lowStockAt) || 2},
          ${p.pdpPath || ''}, ${JSON.stringify(p.engrave || {})},
          ${JSON.stringify(p.colorData || {})}, ${JSON.stringify(p.accordion || [])},
          ${p.editorialImage || ''}, ${p.editorialCaption || ''},
          ${p.tagline || ''}, ${p.heroDescription || ''}, ${JSON.stringify(p.descriptionParagraphs || [])},
          ${p.material || ''}, ${p.dimensions || ''}, ${p.weight || ''}, ${p.hardware || ''}, ${p.care || ''}, ${JSON.stringify(p.specs || [])},
          ${JSON.stringify(p.meta || {})}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          category_id = EXCLUDED.category_id,
          line = EXCLUDED.line,
          numeral = EXCLUDED.numeral,
          active = EXCLUDED.active,
          personalizable = EXCLUDED.personalizable,
          base_price_chf = EXCLUDED.base_price_chf,
          engrave_price_chf = EXCLUDED.engrave_price_chf,
          inventory = EXCLUDED.inventory,
          low_stock_at = EXCLUDED.low_stock_at,
          pdp_path = EXCLUDED.pdp_path,
          engrave = EXCLUDED.engrave,
          color_data = EXCLUDED.color_data,
          accordion = EXCLUDED.accordion,
          editorial_image = EXCLUDED.editorial_image,
          editorial_caption = EXCLUDED.editorial_caption,
          tagline = EXCLUDED.tagline,
          hero_description = EXCLUDED.hero_description,
          description_paragraphs = EXCLUDED.description_paragraphs,
          material = EXCLUDED.material,
          dimensions = EXCLUDED.dimensions,
          weight = EXCLUDED.weight,
          hardware = EXCLUDED.hardware,
          care = EXCLUDED.care,
          specs = EXCLUDED.specs,
          meta = EXCLUDED.meta,
          updated_at = NOW()
      `;

      await tx`DELETE FROM product_variants WHERE product_id = ${p.id}`;
      const variantIds = new Set();
      for (const v of p.variants || []) {
        variantIds.add(v.id);
        await tx`
          INSERT INTO product_variants (
            id, product_id, sku, color_name, color_hex, color_key, inventory, price_chf, sort_order
          ) VALUES (
            ${nsVariantId(p.id, v.id)}, ${p.id}, ${v.sku || ''}, ${v.colorName || ''}, ${v.colorHex || ''},
            ${v.colorKey || v.id}, ${Number(v.inventory) || 0},
            ${v.priceCHF != null ? Number(v.priceCHF) : null}, ${v.sort || 0}
          )
        `;
      }

      await tx`DELETE FROM product_images WHERE product_id = ${p.id}`;
      for (const img of p.images || []) {
        // Sólo enlazamos la imagen a una variante si esa variante existe en ESTE
        // producto; si referencia un id ajeno (data legacy), queda como galería.
        const imgVariant = img.variantId && variantIds.has(img.variantId)
          ? nsVariantId(p.id, img.variantId)
          : null;
        await tx`
          INSERT INTO product_images (product_id, variant_id, url, alt, kind, sort_order)
          VALUES (
            ${p.id}, ${imgVariant}, ${img.url}, ${img.alt || ''},
            ${img.kind || 'gallery'}, ${img.sort || 0}
          )
        `;
      }
    }
  });

  return { storage: 'postgres' };
}

async function decrementInventory(productId, variantId, qty) {
  const db = getSql();
  if (!db) return false;

  if (variantId) {
    // El id de la línea de pedido es el id "crudo" del catálogo; el PK en la DB
    // está namespeado por producto. Aceptamos ambas formas.
    const result = await db`
      UPDATE product_variants
      SET inventory = GREATEST(0, inventory - ${qty})
      WHERE id IN (${variantId}, ${nsVariantId(productId, variantId)}) AND product_id = ${productId}
      RETURNING inventory
    `;
    return result.length > 0;
  }

  const result = await db`
    UPDATE products
    SET inventory = GREATEST(0, inventory - ${qty}), updated_at = NOW()
    WHERE id = ${productId}
    RETURNING inventory
  `;
  return result.length > 0;
}

async function createOrder(order) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  await db`
    INSERT INTO orders (
      id, stripe_session_id, status, customer_id, customer_email, customer_name,
      product_id, variant_id, total_chf, currency, line_items, engrave_config
    ) VALUES (
      ${order.id}, ${order.stripeSessionId || null}, ${order.status || 'pending'},
      ${order.customerId || null}, ${order.customerEmail || null}, ${order.customerName || null},
      ${order.productId || null}, ${order.variantId || null},
      ${order.totalChf || 0}, ${order.currency || 'chf'},
      ${JSON.stringify(order.lineItems || [])}, ${JSON.stringify(order.engraveConfig || {})}
    )
  `;
}

async function updateOrderBySession(sessionId, fields) {
  const db = getSql();
  if (!db) return;

  await db`
    UPDATE orders SET
      status = COALESCE(${fields.status || null}, status),
      stripe_payment_intent = COALESCE(${fields.stripePaymentIntent || null}, stripe_payment_intent),
      customer_email = COALESCE(${fields.customerEmail || null}, customer_email),
      updated_at = NOW()
    WHERE stripe_session_id = ${sessionId}
  `;
}

async function getOrderBySession(sessionId) {
  const db = getSql();
  if (!db) return null;
  const rows = await db`SELECT * FROM orders WHERE stripe_session_id = ${sessionId} LIMIT 1`;
  return rows[0] || null;
}

async function logOrderEvent(orderId, eventType, payload) {
  const db = getSql();
  if (!db) return;
  await db`
    INSERT INTO order_events (order_id, event_type, payload)
    VALUES (${orderId}, ${eventType}, ${JSON.stringify(payload || {})})
  `;
}

// Idempotency guard: true if this Stripe event id was already recorded.
async function isStripeEventProcessed(eventId) {
  const db = getSql();
  if (!db || !eventId) return false;
  const rows = await db`
    SELECT 1 FROM order_events WHERE payload->>'stripe_event_id' = ${eventId} LIMIT 1
  `;
  return rows.length > 0;
}

async function getOrdersByCustomer(customerId) {
  const db = getSql();
  if (!db || !customerId) return [];
  return db`
    SELECT id, status, total_chf, currency, line_items, created_at, updated_at
    FROM orders
    WHERE customer_id = ${customerId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

// ---------------------------------------------------------------------------
// Helpers de SOLO LECTURA para el modelo de comercio (migración 002).
// Aditivos: no reemplazan ninguna función existente. Devuelven [] / null si
// la tabla aún no existe o DATABASE_URL no está configurada (degradación suave).
// ---------------------------------------------------------------------------

async function getProductVariants(productId) {
  const db = getSql();
  if (!db || !productId) return [];
  try {
    return await db`
      SELECT * FROM product_variants
      WHERE product_id = ${productId}
      ORDER BY sort_order
    `;
  } catch (err) {
    console.warn('[postgres] getProductVariants:', err.message);
    return [];
  }
}

async function getVariantById(variantId) {
  const db = getSql();
  if (!db || !variantId) return null;
  try {
    const rows = await db`SELECT * FROM product_variants WHERE id = ${variantId} LIMIT 1`;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] getVariantById:', err.message);
    return null;
  }
}

async function listLocations() {
  const db = getSql();
  if (!db) return [];
  try {
    return await db`
      SELECT * FROM locations
      WHERE active = TRUE
      ORDER BY is_default DESC, name
    `;
  } catch (err) {
    console.warn('[postgres] listLocations:', err.message);
    return [];
  }
}

async function getInventoryLevels(variantId) {
  const db = getSql();
  if (!db || !variantId) return [];
  try {
    return await db`
      SELECT * FROM inventory_levels
      WHERE variant_id = ${variantId}
      ORDER BY location_id
    `;
  } catch (err) {
    console.warn('[postgres] getInventoryLevels:', err.message);
    return [];
  }
}

async function findDiscountByCode(code) {
  const db = getSql();
  if (!db || !code) return null;
  try {
    const rows = await db`
      SELECT * FROM discounts
      WHERE code = ${String(code).trim().toUpperCase()} AND active = TRUE
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] findDiscountByCode:', err.message);
    return null;
  }
}

module.exports = {
  hasPostgres,
  getSql,
  loadCatalogFromPostgres,
  saveCatalogToPostgres,
  decrementInventory,
  createOrder,
  updateOrderBySession,
  getOrderBySession,
  logOrderEvent,
  isStripeEventProcessed,
  getOrdersByCustomer,
  getProductVariants,
  getVariantById,
  listLocations,
  getInventoryLevels,
  findDiscountByCode,
};
