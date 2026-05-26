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
    meta: p.meta || {},
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      colorName: v.color_name,
      colorHex: v.color_hex,
      colorKey: v.color_key,
      inventory: v.inventory,
      sort: v.sort_order,
    })),
    images: images.map((i) => ({
      url: i.url,
      alt: i.alt,
      kind: i.kind,
      sort: i.sort_order,
      variantId: i.variant_id,
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
          editorial_image, editorial_caption, meta, updated_at
        ) VALUES (
          ${p.id}, ${p.slug}, ${p.name}, ${p.shortDescription || ''}, ${p.description || ''},
          ${p.category || null}, ${p.line || ''}, ${p.numeral || ''},
          ${p.active !== false}, ${p.personalizable !== false},
          ${Number(p.basePrice) || 0}, ${Number(p.engravePrice) || 0},
          ${Number(p.inventory) || 0}, ${Number(p.lowStockAt) || 2},
          ${p.pdpPath || ''}, ${JSON.stringify(p.engrave || {})},
          ${JSON.stringify(p.colorData || {})}, ${JSON.stringify(p.accordion || [])},
          ${p.editorialImage || ''}, ${p.editorialCaption || ''},
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
          meta = EXCLUDED.meta,
          updated_at = NOW()
      `;

      await tx`DELETE FROM product_variants WHERE product_id = ${p.id}`;
      for (const v of p.variants || []) {
        await tx`
          INSERT INTO product_variants (
            id, product_id, sku, color_name, color_hex, color_key, inventory, sort_order
          ) VALUES (
            ${v.id}, ${p.id}, ${v.sku || ''}, ${v.colorName || ''}, ${v.colorHex || ''},
            ${v.colorKey || v.id}, ${Number(v.inventory) || 0}, ${v.sort || 0}
          )
        `;
      }

      await tx`DELETE FROM product_images WHERE product_id = ${p.id}`;
      for (const img of p.images || []) {
        await tx`
          INSERT INTO product_images (product_id, variant_id, url, alt, kind, sort_order)
          VALUES (
            ${p.id}, ${img.variantId || null}, ${img.url}, ${img.alt || ''},
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
    const result = await db`
      UPDATE product_variants
      SET inventory = GREATEST(0, inventory - ${qty})
      WHERE id = ${variantId} AND product_id = ${productId}
      RETURNING inventory
    `;
    return result.length > 0;
  }

  await db`
    UPDATE products
    SET inventory = GREATEST(0, inventory - ${qty}), updated_at = NOW()
    WHERE id = ${productId}
  `;
  return true;
}

async function createOrder(order) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  await db`
    INSERT INTO orders (
      id, stripe_session_id, status, customer_email, customer_name,
      product_id, variant_id, total_chf, currency, line_items, engrave_config
    ) VALUES (
      ${order.id}, ${order.stripeSessionId || null}, ${order.status || 'pending'},
      ${order.customerEmail || null}, ${order.customerName || null},
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
};
