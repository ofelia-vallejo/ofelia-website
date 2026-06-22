'use strict';

// Cálculo compartido de totales de checkout (quote + create).
// Dinero en CHF enteros; cupón y envío validados server-side.

const { loadCatalog } = require('./store');
const { buildStripeLineItems } = require('./build-stripe-lines');
const {
  findDiscountByCode,
  getDiscountConditions,
  calculateTax,
  listShippingRates,
  getCollectionIdsForProducts,
} = require('./postgres');
const { evaluateDiscount } = require('./discounts');
const config = require('./config');

function normalizeItems(body) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items.map((it) => ({
      slug: it.slug,
      variantId: it.variantId || it.variant_id || '',
      quantity: it.quantity,
      engraveText: it.engraveText || it.engrave_text || '',
      engraveEnabled: it.engraveEnabled ?? it.engrave_enabled,
    }));
  }
  if (body.slug) {
    return [{
      slug: body.slug,
      variantId: body.variantId || body.variant_id || '',
      quantity: 1,
      engraveText: body.engraveText || '',
      engraveEnabled: body.engraveEnabled,
    }];
  }
  return [];
}

async function buildCartContext(orderLines, subtotalChf) {
  const productIds = orderLines.map((l) => l.productId).filter(Boolean);
  const collectionIds = new Set();
  if (config.dbConfigured && productIds.length) {
    const map = await getCollectionIdsForProducts(productIds);
    for (const pid of productIds) {
      const cols = map.get(pid);
      if (cols) cols.forEach((c) => collectionIds.add(c));
    }
  }
  return {
    subtotalChf,
    totalQuantity: orderLines.reduce((s, l) => s + (Number(l.quantity) || 0), 0),
    productIds: new Set(productIds),
    variantIds: new Set(orderLines.map((l) => l.variantId).filter(Boolean)),
    collectionIds,
  };
}

async function computeCheckout(body) {
  const items = normalizeItems(body || {});
  if (!items.length) {
    return { ok: false, error: 'El carrito está vacío.', status: 400 };
  }

  const couponCode = String(body.couponCode || body.coupon || '').trim();
  const shippingCountry = String(body.shippingCountry || body.country || 'CH').trim().toUpperCase();
  const requestedShippingRateId = String(body.shippingRateId || body.shipping_rate_id || '').trim();

  const catalog = await loadCatalog();
  let stripeLines;
  let orderLines;
  let totalChf;
  try {
    ({ stripeLines, orderLines, totalChf } = buildStripeLineItems(catalog, items));
  } catch (err) {
    if (err.code === 'PRODUCT_NOT_FOUND') return { ok: false, error: err.message, status: 404 };
    if (err.code === 'OUT_OF_STOCK') return { ok: false, error: err.message, status: 400 };
    throw err;
  }

  const subtotalChf = totalChf;
  let discountChf = 0;
  let appliedDiscount = null;
  let freeShipping = false;

  if (couponCode) {
    if (!config.dbConfigured) {
      return { ok: false, error: 'Cupones no disponibles en este momento.', status: 400 };
    }
    const row = await findDiscountByCode(couponCode);
    const conditions = row ? await getDiscountConditions(row.id) : [];
    const ctx = await buildCartContext(orderLines, subtotalChf);
    const check = evaluateDiscount(row, subtotalChf, conditions, ctx);
    if (!check.valid) {
      return { ok: false, error: check.error || 'Cupón inválido.', status: 400 };
    }
    discountChf = check.amountChf;
    freeShipping = Boolean(check.freeShipping);
    appliedDiscount = { discountId: row.id, code: row.code, amountChf: discountChf };
  }

  const subtotalAfterDiscount = Math.max(0, subtotalChf - discountChf);

  let shippingChf = 0;
  let shippingLine = null;
  let shippingRates = [];
  let selectedRateId = null;

  if (config.dbConfigured) {
    shippingRates = await listShippingRates(shippingCountry, subtotalAfterDiscount);
    if (shippingRates.length) {
      const chosen = (requestedShippingRateId && shippingRates.find((r) => r.id === requestedShippingRateId))
        || shippingRates[0];
      if (chosen) {
        selectedRateId = chosen.id;
        shippingChf = freeShipping ? 0 : (Number(chosen.priceChf) || 0);
        shippingLine = {
          shippingRateId: chosen.id,
          title: chosen.name,
          method: chosen.method || 'shipping',
          carrier: '',
          priceChf: shippingChf,
        };
      }
    }
  }

  let taxChf = 0;
  let addedTaxChf = 0;
  let taxLine = null;
  let taxIncluded = false;
  if (config.dbConfigured) {
    const tax = await calculateTax(subtotalAfterDiscount, shippingCountry);
    if (tax && tax.amountChf > 0) {
      taxChf = tax.amountChf;
      taxIncluded = Boolean(tax.included);
      addedTaxChf = tax.included ? 0 : tax.amountChf;
      taxLine = { title: tax.title || 'VAT', rate: tax.rate, amountChf: tax.amountChf };
    }
  }

  const finalTotalChf = Math.max(0, subtotalAfterDiscount + shippingChf + addedTaxChf);

  return {
    ok: true,
    items,
    catalog,
    stripeLines,
    orderLines,
    subtotalChf,
    discountChf,
    shippingChf,
    taxChf,
    taxIncluded,
    addedTaxChf,
    totalChf: finalTotalChf,
    shippingCountry,
    shippingRates,
    selectedRateId,
    shippingLine,
    taxLine,
    appliedDiscount,
    freeShipping,
  };
}

module.exports = { computeCheckout, normalizeItems, buildCartContext };
