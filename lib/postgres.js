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

// Las columnas JSONB de producto (engrave, color_data, accordion, specs, meta,
// description_paragraphs) se guardaban con JSON.stringify e insertando el STRING
// resultante en la columna jsonb. El driver lo re-serializa como string escalar,
// dejando el JSON DOBLE-codificado; cada guardado añadía otra capa (corrupción
// acumulativa). Ahora escribimos con db.json() (objeto/array real) y aquí, al
// leer, deshacemos cualquier capa de string heredada para sanar el dato.
function parseJsonbDeep(value, fallback) {
  let v = value;
  let guard = 0;
  while (typeof v === 'string' && guard < 6) {
    try { v = JSON.parse(v); } catch { break; }
    guard += 1;
  }
  if (v == null) return fallback;
  return v;
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
    status: p.status || (p.active ? 'active' : 'draft'),
    vendor: p.vendor || 'Ofelia Vallejo',
    productType: p.product_type || '',
    seoTitle: p.seo_title || '',
    seoDescription: p.seo_description || '',
    publishedAt: p.published_at || null,
    personalizable: p.personalizable,
    basePrice: p.base_price_chf,
    engravePrice: p.engrave_price_chf,
    inventory: p.inventory,
    lowStockAt: p.low_stock_at,
    pdpPath: p.pdp_path,
    engrave: parseJsonbDeep(p.engrave, {}),
    colorData: parseJsonbDeep(p.color_data, {}),
    accordion: parseJsonbDeep(p.accordion, []),
    editorialImage: p.editorial_image,
    editorialCaption: p.editorial_caption,
    tagline: p.tagline || '',
    heroDescription: p.hero_description || '',
    descriptionParagraphs: parseJsonbDeep(p.description_paragraphs, []),
    material: p.material || '',
    dimensions: p.dimensions || '',
    weight: p.weight || '',
    hardware: p.hardware || '',
    care: p.care || '',
    specs: parseJsonbDeep(p.specs, []),
    meta: parseJsonbDeep(p.meta, {}),
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
          vendor, product_type, status, seo_title, seo_description,
          meta, updated_at
        ) VALUES (
          ${p.id}, ${p.slug}, ${p.name}, ${p.shortDescription || ''}, ${p.description || ''},
          ${p.category || null}, ${p.line || ''}, ${p.numeral || ''},
          ${p.active !== false}, ${p.personalizable !== false},
          ${Number(p.basePrice) || 0}, ${Number(p.engravePrice) || 0},
          ${Number(p.inventory) || 0}, ${Number(p.lowStockAt) || 2},
          ${p.pdpPath || ''}, ${tx.json(p.engrave || {})},
          ${tx.json(p.colorData || {})}, ${tx.json(p.accordion || [])},
          ${p.editorialImage || ''}, ${p.editorialCaption || ''},
          ${p.tagline || ''}, ${p.heroDescription || ''}, ${tx.json(p.descriptionParagraphs || [])},
          ${p.material || ''}, ${p.dimensions || ''}, ${p.weight || ''}, ${p.hardware || ''}, ${p.care || ''}, ${tx.json(p.specs || [])},
          ${p.vendor || 'Ofelia Vallejo'}, ${p.productType || ''}, ${p.status || (p.active !== false ? 'active' : 'draft')},
          ${p.seoTitle || ''}, ${p.seoDescription || ''},
          ${tx.json(p.meta || {})}, NOW()
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
          vendor = EXCLUDED.vendor,
          product_type = EXCLUDED.product_type,
          status = EXCLUDED.status,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          meta = EXCLUDED.meta,
          updated_at = NOW()
      `;

      // UPSERT de variantes (NO DELETE+INSERT). El DELETE recreaba el PK en cada
      // guardado y, vía ON DELETE CASCADE, vaciaría inventory_levels (el stock
      // normalizado por variante × ubicación). Con UPSERT preservamos esos niveles.
      const variantIds = new Set();
      const keepNsIds = [];
      for (const v of p.variants || []) {
        variantIds.add(v.id);
        const nsId = nsVariantId(p.id, v.id);
        keepNsIds.push(nsId);
        await tx`
          INSERT INTO product_variants (
            id, product_id, sku, color_name, color_hex, color_key, inventory, price_chf, sort_order
          ) VALUES (
            ${nsId}, ${p.id}, ${v.sku || ''}, ${v.colorName || ''}, ${v.colorHex || ''},
            ${v.colorKey || v.id}, ${Number(v.inventory) || 0},
            ${v.priceCHF != null ? Number(v.priceCHF) : null}, ${v.sort || 0}
          )
          ON CONFLICT (id) DO UPDATE SET
            sku = EXCLUDED.sku,
            color_name = EXCLUDED.color_name,
            color_hex = EXCLUDED.color_hex,
            color_key = EXCLUDED.color_key,
            inventory = EXCLUDED.inventory,
            price_chf = EXCLUDED.price_chf,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
        `;
      }
      // Eliminar sólo las variantes que YA NO existen en el catálogo (un color
      // retirado). Las que permanecen conservan su fila y sus inventory_levels.
      if (keepNsIds.length) {
        await tx`DELETE FROM product_variants WHERE product_id = ${p.id} AND id != ALL(${keepNsIds})`;
      } else {
        await tx`DELETE FROM product_variants WHERE product_id = ${p.id}`;
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

// Inventario detallado por variante × ubicación (capa normalizada inventory_levels)
// unido a producto/variante para el panel admin. Devuelve filas planas.
async function listInventoryDetailed() {
  const db = getSql();
  if (!db) return [];
  try {
    return await db`
      SELECT
        p.id   AS product_id,
        p.name AS product_name,
        p.slug AS product_slug,
        v.id   AS variant_id,
        v.sku  AS sku,
        v.color_name AS color_name,
        v.color_key  AS color_key,
        v.inventory  AS mirror_inventory,
        il.location_id AS location_id,
        il.available   AS available,
        il.on_hand     AS on_hand,
        il.reserved    AS reserved,
        il.incoming    AS incoming,
        p.low_stock_at AS low_stock_at
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      LEFT JOIN inventory_levels il ON il.variant_id = v.id
      ORDER BY p.name, v.sort_order, il.location_id
    `;
  } catch (err) {
    console.warn('[postgres] listInventoryDetailed:', err.message);
    return [];
  }
}

// available actual de una variante en una ubicación (acepta id crudo o namespeado).
async function getVariantAvailable(productId, variantId, locationId = 'loc-medellin') {
  const db = getSql();
  if (!db || !variantId) return null;
  const ns = nsVariantId(productId, variantId);
  try {
    const rows = await db`
      SELECT variant_id, available, on_hand FROM inventory_levels
      WHERE variant_id IN (${variantId}, ${ns}) AND location_id = ${locationId}
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] getVariantAvailable:', err.message);
    return null;
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

// ---------------------------------------------------------------------------
// Corte de inventario sobre inventory_levels (capa normalizada · migración 002).
// Atómico y sin stock negativo: el UPDATE sólo afecta la fila si available >= qty.
// Mantiene product_variants.inventory como espejo para el catálogo y el chequeo
// OUT_OF_STOCK de build-stripe-lines. `exec` permite componer dentro de una tx.
// ---------------------------------------------------------------------------
async function decrementInventoryLevel(productId, variantId, qty, locationId = 'loc-medellin', exec) {
  const db = exec || getSql();
  if (!db || !variantId) return { ok: false, reason: 'no-variant' };
  const ns = nsVariantId(productId, variantId);
  const rows = await db`
    UPDATE inventory_levels
    SET available = available - ${qty},
        on_hand   = GREATEST(0, on_hand - ${qty}),
        updated_at = NOW()
    WHERE variant_id IN (${variantId}, ${ns})
      AND location_id = ${locationId}
      AND available >= ${qty}
    RETURNING variant_id, available
  `;
  if (!rows.length) return { ok: false, reason: 'insufficient' };
  // Espejo en product_variants.inventory (display/catálogo).
  await db`
    UPDATE product_variants
    SET inventory = GREATEST(0, inventory - ${qty}), updated_at = NOW()
    WHERE id = ${rows[0].variant_id}
  `;
  return { ok: true, variantId: rows[0].variant_id, available: rows[0].available };
}

// Líneas de pedido normalizadas (order_line_items), en paralelo a orders.line_items JSONB.
// Resuelve product_id / variant_id contra el catálogo (subconsulta) para no violar las
// FKs ON DELETE SET NULL cuando un id no existe; conserva snapshots para el historial.
async function createOrderLineItems(orderId, lines, exec) {
  const db = exec || getSql();
  if (!db) return 0;
  let n = 0;
  for (const l of lines || []) {
    const qty = Math.max(1, Number(l.quantity) || 1);
    const unit = l.unitPriceChf != null
      ? Number(l.unitPriceChf)
      : Math.round((Number(l.baseChf) || 0) / qty);
    const engraveChf = l.engrave ? (Number(l.engrave.chf) || 0) : 0;
    const lineTotal = (unit + engraveChf) * qty;
    const rawVid = l.variantId || null;
    const nsVid = l.variantId ? nsVariantId(l.productId, l.variantId) : null;
    await db`
      INSERT INTO order_line_items (
        order_id, product_id, variant_id, slug, product_name, variant_label, sku,
        quantity, unit_price_chf, engrave_enabled, engrave_text, engrave_price_chf, line_total_chf
      ) VALUES (
        ${orderId},
        (SELECT id FROM products WHERE id = ${l.productId || null}),
        (SELECT id FROM product_variants WHERE id IN (${rawVid}, ${nsVid}) AND product_id = ${l.productId || null} LIMIT 1),
        ${l.slug || ''}, ${l.name || ''}, ${l.variantLabel || ''}, ${l.sku || ''},
        ${qty}, ${unit}, ${Boolean(l.engrave)}, ${l.engrave ? (l.engrave.text || '') : ''},
        ${engraveChf}, ${lineTotal}
      )
    `;
    n += 1;
  }
  return n;
}

// Transacción Stripe como entidad (payments). Idempotente por PK (id estable
// 'pay-<orderId>'): el create inserta 'pending' y el webhook lo promueve a 'paid'.
async function upsertPayment(p, exec) {
  const db = exec || getSql();
  if (!db || !p || !p.id) return;
  await db`
    INSERT INTO payments (
      id, order_id, provider, kind, status, amount_chf, currency,
      stripe_session_id, stripe_payment_intent, stripe_event_id, updated_at
    ) VALUES (
      ${p.id}, ${p.orderId || null}, 'stripe', ${p.kind || 'charge'}, ${p.status || 'pending'},
      ${Number(p.amountChf) || 0}, ${p.currency || 'chf'},
      ${p.stripeSessionId || null}, ${p.stripePaymentIntent || null}, ${p.stripeEventId || null}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      status                = EXCLUDED.status,
      stripe_payment_intent = COALESCE(EXCLUDED.stripe_payment_intent, payments.stripe_payment_intent),
      stripe_event_id       = COALESCE(EXCLUDED.stripe_event_id, payments.stripe_event_id),
      amount_chf            = CASE WHEN EXCLUDED.amount_chf > 0 THEN EXCLUDED.amount_chf ELSE payments.amount_chf END,
      updated_at            = NOW()
  `;
}

// Snapshot inmutable de dirección por pedido (order_addresses). UNIQUE(order_id,type).
async function upsertOrderAddress(orderId, type, a, exec) {
  const db = exec || getSql();
  if (!db || !a) return;
  await db`
    INSERT INTO order_addresses (
      order_id, type, full_name, company, line1, line2, city, region, postal_code, country, phone, email
    ) VALUES (
      ${orderId}, ${type || 'shipping'}, ${a.fullName || ''}, ${a.company || ''}, ${a.line1 || ''},
      ${a.line2 || ''}, ${a.city || ''}, ${a.region || ''}, ${a.postalCode || ''},
      ${a.country || ''}, ${a.phone || ''}, ${a.email || ''}
    )
    ON CONFLICT (order_id, type) DO UPDATE SET
      full_name = EXCLUDED.full_name, company = EXCLUDED.company,
      line1 = EXCLUDED.line1, line2 = EXCLUDED.line2, city = EXCLUDED.city,
      region = EXCLUDED.region, postal_code = EXCLUDED.postal_code,
      country = EXCLUDED.country, phone = EXCLUDED.phone, email = EXCLUDED.email
  `;
}

// Redención de cupón por pedido (order_discounts) + incremento de used_count.
async function recordOrderDiscount(orderId, d, exec) {
  const db = exec || getSql();
  if (!db || !d || !d.code) return;
  await db`
    INSERT INTO order_discounts (order_id, discount_id, code, amount_chf)
    VALUES (${orderId}, ${d.discountId || null}, ${d.code}, ${Number(d.amountChf) || 0})
  `;
  if (d.discountId) {
    await db`UPDATE discounts SET used_count = used_count + 1, updated_at = NOW() WHERE id = ${d.discountId}`;
  }
}

// Snapshot del impuesto aplicado por pedido (order_tax_lines · Shopify TaxLine).
async function recordOrderTaxLine(orderId, tax, exec) {
  const db = exec || getSql();
  if (!db || !orderId || !tax) return;
  await db`
    INSERT INTO order_tax_lines (order_id, order_line_item_id, title, rate, amount_chf)
    VALUES (${orderId}, ${tax.orderLineItemId || null}, ${tax.title || 'VAT'},
            ${Number(tax.rate) || 0}, ${Number(tax.amountChf) || 0})
  `;
}

// Tarifa de envío materializada por pedido (order_shipping_lines). method=shipping|pickup.
async function recordOrderShippingLine(orderId, shipping, exec) {
  const db = exec || getSql();
  if (!db || !orderId || !shipping) return;
  await db`
    INSERT INTO order_shipping_lines (order_id, shipping_rate_id, title, carrier, method, price_chf)
    VALUES (${orderId}, ${shipping.shippingRateId || null}, ${shipping.title || ''},
            ${shipping.carrier || ''}, ${shipping.method || 'shipping'}, ${Number(shipping.priceChf) || 0})
  `;
}

// Asiento SOLO-LECTURA del libro mayor (inventory_adjustments) SIN mover el stock.
// Lo usa confirmOrderPaid tras el corte atómico de decrementInventoryLevel, para
// registrar el movimiento (reason='sale') sin volver a descontar (evita duplicar).
async function recordInventoryLedger(entry, exec) {
  const db = exec || getSql();
  if (!db || !entry || !entry.variantId) return;
  await db`
    INSERT INTO inventory_adjustments (
      variant_id, location_id, delta, reason, quantity_after,
      reference_type, reference_id, note, created_by
    ) VALUES (
      ${entry.variantId}, ${entry.locationId || 'loc-medellin'}, ${Number(entry.delta) || 0},
      ${entry.reason || 'sale'}, ${entry.quantityAfter != null ? entry.quantityAfter : null},
      ${entry.referenceType || 'order'}, ${entry.referenceId || ''}, ${entry.note || ''}, ${entry.createdBy || 'system'}
    )
  `;
}

// Busca el pedido por payment_intent de Stripe (usado por el webhook charge.refunded).
async function getOrderByPaymentIntent(paymentIntent) {
  const db = getSql();
  if (!db || !paymentIntent) return null;
  const rows = await db`SELECT * FROM orders WHERE stripe_payment_intent = ${paymentIntent} LIMIT 1`;
  return rows[0] || null;
}

// Idempotencia de reembolsos Stripe: ¿ya existe un refund con este stripe_refund_id?
async function getRefundByStripeId(stripeRefundId) {
  const db = getSql();
  if (!db || !stripeRefundId) return null;
  try {
    const rows = await db`SELECT * FROM refunds WHERE stripe_refund_id = ${stripeRefundId} LIMIT 1`;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] getRefundByStripeId:', err.message);
    return null;
  }
}

// Condiciones de un descuento (discount_conditions · migración 003).
async function getDiscountConditions(discountId) {
  const db = getSql();
  if (!db || !discountId) return [];
  try {
    return await db`SELECT * FROM discount_conditions WHERE discount_id = ${discountId} ORDER BY id`;
  } catch (err) {
    console.warn('[postgres] getDiscountConditions:', err.message);
    return [];
  }
}

// Descuentos automáticos vigentes (method='automatic'), ordenados por prioridad.
async function listAutomaticDiscounts() {
  const db = getSql();
  if (!db) return [];
  try {
    return await db`
      SELECT * FROM discounts
      WHERE active = TRUE AND method = 'automatic'
      ORDER BY priority DESC, created_at
    `;
  } catch (err) {
    console.warn('[postgres] listAutomaticDiscounts:', err.message);
    return [];
  }
}

// Crea el pedido y todas sus filas normalizadas en UNA transacción:
// orders (+ desgloses) · order_line_items · order_discounts · payments(pending).
// No rompe el flujo si faltan datos: sólo escribe lo disponible.
async function createOrderWithDetails(order) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  const shippingChf = Number(order.shippingChf) || 0;
  const taxChf = Number(order.taxChf) || 0;

  await db.begin(async (tx) => {
    await tx`
      INSERT INTO orders (
        id, stripe_session_id, status, financial_status, customer_id, customer_email, customer_name,
        product_id, variant_id, total_chf, subtotal_chf, discount_chf, shipping_chf, tax_chf, coupon_code,
        currency, line_items, engrave_config
      ) VALUES (
        ${order.id}, ${order.stripeSessionId || null}, ${order.status || 'pending'},
        ${order.status === 'paid' ? 'paid' : 'pending'},
        ${order.customerId || null}, ${order.customerEmail || null}, ${order.customerName || null},
        ${order.productId || null}, ${order.variantId || null},
        ${Number(order.totalChf) || 0}, ${Number(order.subtotalChf) || 0}, ${Number(order.discountChf) || 0},
        ${shippingChf}, ${taxChf},
        ${order.couponCode || ''}, ${order.currency || 'chf'},
        ${JSON.stringify(order.lineItems || [])}, ${JSON.stringify(order.engraveConfig || {})}
      )
    `;

    await createOrderLineItems(order.id, order.lineItems || [], tx);

    if (order.discount && Number(order.discount.amountChf) > 0) {
      await recordOrderDiscount(order.id, order.discount, tx);
    }

    // Snapshot del impuesto aplicado (order_tax_lines) — Shopify TaxLine.
    if (order.taxLine && Number(order.taxLine.amountChf) > 0) {
      await recordOrderTaxLine(order.id, order.taxLine, tx);
    }

    // Tarifa de envío materializada (order_shipping_lines) — incluye pickup atelier.
    if (order.shippingLine) {
      await recordOrderShippingLine(order.id, order.shippingLine, tx);
    }

    if (Array.isArray(order.addresses)) {
      for (const addr of order.addresses) {
        await upsertOrderAddress(order.id, addr.type || 'shipping', addr, tx);
      }
    }

    await upsertPayment({
      id: 'pay-' + order.id,
      orderId: order.id,
      kind: 'charge',
      status: 'pending',
      amountChf: Number(order.totalChf) || 0,
      currency: order.currency || 'chf',
      stripeSessionId: order.stripeSessionId || null,
    }, tx);
  });

  return { id: order.id };
}

// Confirma el pago (webhook checkout.session.completed) en UNA transacción:
// orders → paid · payments → paid · snapshot de dirección · historial de estado ·
// corte de inventario sobre inventory_levels · marcador de idempotencia en order_events.
async function confirmOrderPaid(args) {
  const db = getSql();
  if (!db) return { ok: false, reason: 'no-db' };

  return db.begin(async (tx) => {
    const rows = await tx`SELECT * FROM orders WHERE stripe_session_id = ${args.sessionId} LIMIT 1`;
    const order = rows[0];
    if (!order) return { ok: false, reason: 'order-not-found' };

    const prevStatus = order.status;

    await tx`
      UPDATE orders SET
        status = 'paid',
        financial_status = 'paid',
        stripe_payment_intent = COALESCE(${args.paymentIntent || null}, stripe_payment_intent),
        customer_email = COALESCE(${args.customerEmail || null}, customer_email),
        updated_at = NOW()
      WHERE id = ${order.id}
    `;

    await upsertPayment({
      id: 'pay-' + order.id,
      orderId: order.id,
      kind: 'charge',
      status: 'paid',
      amountChf: Number(args.amountChf) || order.total_chf || 0,
      currency: args.currency || order.currency || 'chf',
      stripeSessionId: args.sessionId,
      stripePaymentIntent: args.paymentIntent || null,
      stripeEventId: args.eventId || null,
    }, tx);

    if (args.shippingAddress) {
      await upsertOrderAddress(order.id, 'shipping', args.shippingAddress, tx);
    }

    await tx`
      INSERT INTO order_status_history (order_id, from_status, to_status, note)
      VALUES (${order.id}, ${prevStatus || ''}, 'paid', 'Stripe checkout.session.completed')
    `;

    // orders.line_items se persiste con JSON.stringify (convención existente), lo
    // que en una columna jsonb queda DOBLE-codificado como string escalar. Lo
    // normalizamos aquí para que el corte de inventario funcione con ambos formatos.
    let lineItems = order.line_items;
    if (typeof lineItems === 'string') {
      try { lineItems = JSON.parse(lineItems); } catch { lineItems = []; }
    }
    if (!Array.isArray(lineItems)) lineItems = [];
    const inventory = [];
    for (const line of lineItems) {
      if (!line.productId) continue;
      const qty = Number(line.quantity) || 1;
      const r = await decrementInventoryLevel(
        line.productId, line.variantId || null, qty, 'loc-medellin', tx
      );
      // Asiento en el libro mayor (reason='sale'). El stock YA se cortó arriba de
      // forma atómica; aquí SOLO registramos el movimiento, sin volver a descontar.
      if (r.ok) {
        await recordInventoryLedger({
          variantId: r.variantId,
          locationId: 'loc-medellin',
          delta: -qty,
          reason: 'sale',
          quantityAfter: r.available,
          referenceType: 'order',
          referenceId: order.id,
          note: 'Venta · checkout.session.completed',
        }, tx);
      }
      inventory.push({ productId: line.productId, variantId: line.variantId || null, ...r });
    }

    // Marcador de idempotencia dentro de la MISMA tx (lo lee isStripeEventProcessed).
    await tx`
      INSERT INTO order_events (order_id, event_type, payload)
      VALUES (${order.id}, 'checkout.session.completed', ${JSON.stringify(args.eventPayload || { stripe_event_id: args.eventId })})
    `;

    return { ok: true, orderId: order.id, inventory };
  });
}

// ===========================================================================
// Helpers de SOLO LECTURA/ESCRITURA aditivos para la migración 003 (tienda
// funcional). NINGUNO reemplaza funciones existentes. Todos degradan suave
// (devuelven valor seguro / no lanzan) si la tabla aún no existe o falta DB.
// ===========================================================================

// — IMPUESTOS ---------------------------------------------------------------
// Tasa de impuesto por país (ISO-2). Devuelve la fila de tax_rates o null.
async function getTaxRate(country) {
  const db = getSql();
  if (!db || !country) return null;
  try {
    const rows = await db`
      SELECT * FROM tax_rates
      WHERE country = ${String(country).trim().toUpperCase()} AND active = TRUE
      ORDER BY created_at LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] getTaxRate:', err.message);
    return null;
  }
}

// Calcula el impuesto en CHF enteros para un subtotal dado y país. Si la tasa
// está `included_in_price`, extrae el IVA contenido; si no, lo añade encima.
async function calculateTax(subtotalChf, country) {
  const rate = await getTaxRate(country);
  const subtotal = Number(subtotalChf) || 0;
  if (!rate || !subtotal) return { rate: 0, amountChf: 0, title: '', included: false };
  const pct = Number(rate.rate) || 0;
  const amountChf = rate.included_in_price
    ? Math.round(subtotal - subtotal / (1 + pct / 100))
    : Math.round((subtotal * pct) / 100);
  return { rate: pct, amountChf, title: rate.name, included: rate.included_in_price, taxRateId: rate.id };
}

// — ENVÍOS ------------------------------------------------------------------
// Tarifas de envío aplicables a un país (incluye pickup de zona NULL). Calcula
// el precio efectivo aplicando free_over_chf según el subtotal.
async function listShippingRates(country, subtotalChf = 0) {
  const db = getSql();
  if (!db) return [];
  const subtotal = Number(subtotalChf) || 0;
  const cc = country ? String(country).trim().toUpperCase() : '';
  try {
    const rows = await db`
      SELECT r.*, z.countries AS zone_countries
      FROM shipping_rates r
      LEFT JOIN shipping_zones z ON z.id = r.zone_id
      WHERE r.active = TRUE
        AND (r.zone_id IS NULL OR ${cc} = ANY(z.countries) OR ${cc} = '')
      ORDER BY r.sort_order, r.price_chf
    `;
    return rows.map((r) => {
      const free = r.free_over_chf != null && subtotal >= Number(r.free_over_chf);
      return {
        id: r.id,
        name: r.name,
        method: r.method,
        locationId: r.location_id,
        priceChf: free ? 0 : Number(r.price_chf) || 0,
        freeApplied: free,
        estimatedDaysMin: r.estimated_days_min,
        estimatedDaysMax: r.estimated_days_max,
      };
    });
  } catch (err) {
    console.warn('[postgres] listShippingRates:', err.message);
    return [];
  }
}

// — INVENTARIO OPERATIVO ----------------------------------------------------
// Registra un movimiento en el libro mayor (inventory_adjustments) y ajusta
// inventory_levels.available/on_hand por `delta`. `exec` permite componer en tx.
// No deja negativos (GREATEST 0). Devuelve { ok, available } o { ok:false }.
async function recordInventoryMovement(m, exec) {
  const db = exec || getSql();
  if (!db || !m || !m.variantId) return { ok: false, reason: 'no-variant' };
  const locationId = m.locationId || 'loc-medellin';
  const delta = Number(m.delta) || 0;
  const ns = nsVariantId(m.productId, m.variantId);
  try {
    const rows = await db`
      UPDATE inventory_levels
      SET available  = GREATEST(0, available + ${delta}),
          on_hand    = GREATEST(0, on_hand + ${delta}),
          updated_at = NOW()
      WHERE variant_id IN (${m.variantId}, ${ns}) AND location_id = ${locationId}
      RETURNING variant_id, available
    `;
    const available = rows.length ? rows[0].available : null;
    const variantId = rows.length ? rows[0].variant_id : ns;
    await db`
      INSERT INTO inventory_adjustments (
        variant_id, location_id, delta, reason, quantity_after,
        reference_type, reference_id, note, created_by
      ) VALUES (
        ${variantId}, ${locationId}, ${delta}, ${m.reason || 'manual'}, ${available},
        ${m.referenceType || ''}, ${m.referenceId || ''}, ${m.note || ''}, ${m.createdBy || 'system'}
      )
    `;
    // Espejo en product_variants.inventory (display/catálogo).
    await db`
      UPDATE product_variants
      SET inventory = GREATEST(0, inventory + ${delta}), updated_at = NOW()
      WHERE id = ${variantId}
    `;
    return { ok: true, variantId, available };
  } catch (err) {
    console.warn('[postgres] recordInventoryMovement:', err.message);
    return { ok: false, reason: err.message };
  }
}

// Fija el stock ABSOLUTO de una variante en una ubicación (panel admin), dejando
// asiento en el libro mayor. Crea la fila de inventory_levels si no existe.
// Nunca permite negativos. Mantiene el espejo product_variants.inventory.
// `target` es el nuevo `available` deseado; el delta se calcula y se audita.
async function setInventoryLevel(args) {
  const db = getSql();
  if (!db || !args || !args.variantId) return { ok: false, reason: 'no-variant' };
  const target = Math.max(0, Number(args.target) || 0);
  const locationId = args.locationId || 'loc-medellin';
  const ns = nsVariantId(args.productId, args.variantId);

  return db.begin(async (tx) => {
    // Resolver la fila existente (acepta id crudo o namespeado) y su available.
    const existing = (await tx`
      SELECT variant_id, available FROM inventory_levels
      WHERE variant_id IN (${args.variantId}, ${ns}) AND location_id = ${locationId}
      LIMIT 1
    `)[0];

    const variantId = existing ? existing.variant_id : ns;
    const before = existing ? Number(existing.available) : 0;
    const delta = target - before;

    if (existing) {
      await tx`
        UPDATE inventory_levels
        SET available = ${target}, on_hand = ${target}, updated_at = NOW()
        WHERE variant_id = ${variantId} AND location_id = ${locationId}
      `;
    } else {
      // Verifica que la variante exista antes de crear el nivel (FK válida).
      const v = (await tx`SELECT id FROM product_variants WHERE id IN (${args.variantId}, ${ns}) LIMIT 1`)[0];
      if (!v) return { ok: false, reason: 'variant-not-found' };
      await tx`
        INSERT INTO inventory_levels (variant_id, location_id, available, on_hand, reserved)
        VALUES (${v.id}, ${locationId}, ${target}, ${target}, 0)
        ON CONFLICT (variant_id, location_id) DO UPDATE SET available = ${target}, on_hand = ${target}, updated_at = NOW()
      `;
    }

    await tx`
      INSERT INTO inventory_adjustments (
        variant_id, location_id, delta, reason, quantity_after, reference_type, reference_id, note, created_by
      ) VALUES (
        ${variantId}, ${locationId}, ${delta}, ${args.reason || 'correction'}, ${target},
        ${args.referenceType || 'admin'}, ${args.referenceId || ''}, ${args.note || 'Ajuste manual de stock'}, ${args.createdBy || 'admin'}
      )
    `;

    await tx`
      UPDATE product_variants SET inventory = ${target}, updated_at = NOW() WHERE id = ${variantId}
    `;

    return { ok: true, variantId, available: target, delta };
  });
}

// — REEMBOLSOS --------------------------------------------------------------
// Crea un refund + sus refund_line_items + una transacción payments(kind=refund),
// actualiza orders.refunded_chf / financial_status y, si restock=true, repone
// inventario por cada línea (con su movimiento en el libro mayor). Todo en UNA tx.
async function createRefund(refund) {
  const db = getSql();
  if (!db || !refund || !refund.orderId) throw new Error('createRefund: orderId requerido');
  const refundId = refund.id || 'ref-' + refund.orderId + '-' + Date.now().toString(36);
  const amountChf = Number(refund.amountChf) || 0;

  return db.begin(async (tx) => {
    const ord = (await tx`SELECT id, total_chf, refunded_chf FROM orders WHERE id = ${refund.orderId} LIMIT 1`)[0];
    if (!ord) return { ok: false, reason: 'order-not-found' };

    await tx`
      INSERT INTO refunds (id, order_id, payment_id, amount_chf, reason, note, restock, stripe_refund_id, created_by)
      VALUES (
        ${refundId}, ${refund.orderId}, ${refund.paymentId || ('pay-' + refund.orderId)},
        ${amountChf}, ${refund.reason || ''}, ${refund.note || ''},
        ${refund.restock !== false}, ${refund.stripeRefundId || null}, ${refund.createdBy || 'system'}
      )
      ON CONFLICT (id) DO NOTHING
    `;

    for (const l of refund.lines || []) {
      await tx`
        INSERT INTO refund_line_items (refund_id, order_line_item_id, quantity, amount_chf, restock)
        VALUES (${refundId}, ${l.orderLineItemId || null}, ${Math.max(1, Number(l.quantity) || 1)},
                ${Number(l.amountChf) || 0}, ${l.restock !== false})
      `;
      if (l.restock !== false && l.variantId) {
        await recordInventoryMovement({
          productId: l.productId, variantId: l.variantId, locationId: refund.locationId,
          delta: Math.max(1, Number(l.quantity) || 1), reason: 'return',
          referenceType: 'refund', referenceId: refundId, note: 'Reposición por reembolso',
          createdBy: refund.createdBy || 'system',
        }, tx);
      }
    }

    // Transacción de pago tipo refund (Stripe). id estable para idempotencia.
    await tx`
      INSERT INTO payments (id, order_id, provider, kind, status, amount_chf, currency, stripe_payment_intent, updated_at)
      VALUES (${'pay-refund-' + refundId}, ${refund.orderId}, 'stripe', 'refund', 'refunded',
              ${amountChf}, ${refund.currency || 'chf'}, ${refund.stripePaymentIntent || null}, NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    const totalRefunded = (Number(ord.refunded_chf) || 0) + amountChf;
    const financial = totalRefunded >= (Number(ord.total_chf) || 0) ? 'refunded' : 'partially_refunded';
    await tx`
      UPDATE orders
      SET refunded_chf = ${totalRefunded}, financial_status = ${financial}, updated_at = NOW()
      WHERE id = ${refund.orderId}
    `;
    await tx`
      INSERT INTO order_status_history (order_id, from_status, to_status, note)
      VALUES (${refund.orderId}, 'paid', ${financial}, ${'Reembolso ' + amountChf + ' CHF'})
    `;

    return { ok: true, refundId, amountChf, financialStatus: financial };
  });
}

// — METAFIELDS --------------------------------------------------------------
// Upsert de un metafield por (owner_type, owner_id, namespace, key).
async function setMetafield(ownerType, ownerId, key, value, opts = {}) {
  const db = getSql();
  if (!db || !ownerType || !ownerId || !key) return null;
  try {
    const rows = await db`
      INSERT INTO metafields (owner_type, owner_id, namespace, key, value, value_type, updated_at)
      VALUES (${ownerType}, ${ownerId}, ${opts.namespace || 'custom'}, ${key},
              ${value == null ? '' : String(value)}, ${opts.valueType || 'single_line_text_field'}, NOW())
      ON CONFLICT (owner_type, owner_id, namespace, key) DO UPDATE SET
        value = EXCLUDED.value, value_type = EXCLUDED.value_type, updated_at = NOW()
      RETURNING *
    `;
    return rows[0] || null;
  } catch (err) {
    console.warn('[postgres] setMetafield:', err.message);
    return null;
  }
}

// ===========================================================================
// Helpers de ADMIN (aditivos) · pedidos y descuentos para el panel.
// ===========================================================================

// Lista de pedidos para el panel (resumen). Orden por fecha desc.
async function listOrders(limit = 100) {
  const db = getSql();
  if (!db) return [];
  try {
    return await db`
      SELECT id, status, financial_status, fulfillment_status, customer_email, customer_name,
             total_chf, subtotal_chf, discount_chf, shipping_chf, tax_chf, refunded_chf,
             currency, coupon_code, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT ${Math.max(1, Math.min(500, Number(limit) || 100))}
    `;
  } catch (err) {
    console.warn('[postgres] listOrders:', err.message);
    return [];
  }
}

// Detalle de un pedido: cabecera + líneas + direcciones + impuestos + envío + reembolsos.
async function getOrderDetail(orderId) {
  const db = getSql();
  if (!db || !orderId) return null;
  try {
    const order = (await db`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1`)[0];
    if (!order) return null;
    const [lines, addresses, taxLines, shippingLines, refunds, payments] = await Promise.all([
      db`SELECT * FROM order_line_items WHERE order_id = ${orderId} ORDER BY id`,
      db`SELECT * FROM order_addresses WHERE order_id = ${orderId}`,
      db`SELECT * FROM order_tax_lines WHERE order_id = ${orderId}`,
      db`SELECT * FROM order_shipping_lines WHERE order_id = ${orderId}`,
      db`SELECT * FROM refunds WHERE order_id = ${orderId} ORDER BY created_at`,
      db`SELECT * FROM payments WHERE order_id = ${orderId} ORDER BY updated_at`,
    ]);
    return { order, lines, addresses, taxLines, shippingLines, refunds, payments };
  } catch (err) {
    console.warn('[postgres] getOrderDetail:', err.message);
    return null;
  }
}

// — Descuentos (CRUD admin) -------------------------------------------------
async function listDiscounts() {
  const db = getSql();
  if (!db) return [];
  try {
    return await db`SELECT * FROM discounts ORDER BY created_at DESC`;
  } catch (err) {
    console.warn('[postgres] listDiscounts:', err.message);
    return [];
  }
}

async function getDiscountById(id) {
  const db = getSql();
  if (!db || !id) return null;
  const rows = await db`SELECT * FROM discounts WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

// Upsert de un descuento + reemplazo atómico de sus condiciones. `d` ya validado.
async function upsertDiscount(d) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');
  const id = d.id || ('disc-' + slugifyCode(d.code));
  return db.begin(async (tx) => {
    await tx`
      INSERT INTO discounts (
        id, code, description, type, value, min_subtotal_chf, starts_at, ends_at,
        usage_limit, once_per_customer, active, method, target_type, priority, updated_at
      ) VALUES (
        ${id}, ${String(d.code).trim().toUpperCase()}, ${d.description || ''}, ${d.type}, ${Number(d.value) || 0},
        ${Number(d.minSubtotalChf) || 0}, ${d.startsAt ? new Date(d.startsAt) : null}, ${d.endsAt ? new Date(d.endsAt) : null},
        ${d.usageLimit != null ? Number(d.usageLimit) : null}, ${Boolean(d.oncePerCustomer)}, ${d.active !== false},
        ${d.method || 'code'}, ${d.targetType || 'order'}, ${Number(d.priority) || 0}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code, description = EXCLUDED.description, type = EXCLUDED.type,
        value = EXCLUDED.value, min_subtotal_chf = EXCLUDED.min_subtotal_chf,
        starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
        usage_limit = EXCLUDED.usage_limit, once_per_customer = EXCLUDED.once_per_customer,
        active = EXCLUDED.active, method = EXCLUDED.method, target_type = EXCLUDED.target_type,
        priority = EXCLUDED.priority, updated_at = NOW()
    `;
    await tx`DELETE FROM discount_conditions WHERE discount_id = ${id}`;
    for (const c of d.conditions || []) {
      await tx`
        INSERT INTO discount_conditions (discount_id, condition_type, ref_id, int_value)
        VALUES (${id}, ${c.conditionType}, ${c.refId || ''}, ${c.intValue != null ? Number(c.intValue) : null})
      `;
    }
    return { id };
  });
}

async function deleteDiscount(id) {
  const db = getSql();
  if (!db || !id) return false;
  const rows = await db`DELETE FROM discounts WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

function slugifyCode(code) {
  return String(code || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Lee los metafields de una entidad (opcionalmente filtrando por namespace).
async function getMetafields(ownerType, ownerId, namespace) {
  const db = getSql();
  if (!db || !ownerType || !ownerId) return [];
  try {
    if (namespace) {
      return await db`
        SELECT * FROM metafields
        WHERE owner_type = ${ownerType} AND owner_id = ${ownerId} AND namespace = ${namespace}
        ORDER BY key
      `;
    }
    return await db`
      SELECT * FROM metafields
      WHERE owner_type = ${ownerType} AND owner_id = ${ownerId}
      ORDER BY namespace, key
    `;
  } catch (err) {
    console.warn('[postgres] getMetafields:', err.message);
    return [];
  }
}

module.exports = {
  hasPostgres,
  getSql,
  loadCatalogFromPostgres,
  saveCatalogToPostgres,
  decrementInventory,
  decrementInventoryLevel,
  createOrderLineItems,
  upsertPayment,
  upsertOrderAddress,
  recordOrderDiscount,
  recordOrderTaxLine,
  recordOrderShippingLine,
  recordInventoryLedger,
  getOrderByPaymentIntent,
  getRefundByStripeId,
  getDiscountConditions,
  listAutomaticDiscounts,
  createOrderWithDetails,
  confirmOrderPaid,
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
  listInventoryDetailed,
  getVariantAvailable,
  findDiscountByCode,
  listOrders,
  getOrderDetail,
  listDiscounts,
  getDiscountById,
  upsertDiscount,
  deleteDiscount,
  // Migración 003 · tienda funcional (aditivos)
  getTaxRate,
  calculateTax,
  listShippingRates,
  recordInventoryMovement,
  setInventoryLevel,
  createRefund,
  setMetafield,
  getMetafields,
};
