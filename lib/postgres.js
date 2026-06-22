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

// Crea el pedido y todas sus filas normalizadas en UNA transacción:
// orders (+ desgloses) · order_line_items · order_discounts · payments(pending).
// No rompe el flujo si faltan datos: sólo escribe lo disponible.
async function createOrderWithDetails(order) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  await db.begin(async (tx) => {
    await tx`
      INSERT INTO orders (
        id, stripe_session_id, status, financial_status, customer_id, customer_email, customer_name,
        product_id, variant_id, total_chf, subtotal_chf, discount_chf, coupon_code,
        currency, line_items, engrave_config
      ) VALUES (
        ${order.id}, ${order.stripeSessionId || null}, ${order.status || 'pending'},
        ${order.status === 'paid' ? 'paid' : 'pending'},
        ${order.customerId || null}, ${order.customerEmail || null}, ${order.customerName || null},
        ${order.productId || null}, ${order.variantId || null},
        ${Number(order.totalChf) || 0}, ${Number(order.subtotalChf) || 0}, ${Number(order.discountChf) || 0},
        ${order.couponCode || ''}, ${order.currency || 'chf'},
        ${JSON.stringify(order.lineItems || [])}, ${JSON.stringify(order.engraveConfig || {})}
      )
    `;

    await createOrderLineItems(order.id, order.lineItems || [], tx);

    if (order.discount && Number(order.discount.amountChf) > 0) {
      await recordOrderDiscount(order.id, order.discount, tx);
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
      const r = await decrementInventoryLevel(
        line.productId, line.variantId || null, Number(line.quantity) || 1, 'loc-medellin', tx
      );
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
  findDiscountByCode,
};
