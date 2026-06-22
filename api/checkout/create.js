'use strict';

// POST /api/checkout/create
// Body: { items: [{slug, variantId?, quantity?, engraveText?, engraveEnabled?}], customerEmail?, customerName? }
//    or legacy: { slug, variantId?, engraveText?, engraveEnabled?, customerEmail? }
// Returns: { ok, sessionId, url, orderId }

const { corsJson } = require('../../lib/auth');
const { getStripe } = require('../../lib/stripe-client');
const { loadCatalog, findProduct } = require('../../lib/store');
const { buildStripeLineItems } = require('../../lib/build-stripe-lines');
const {
  createOrderWithDetails,
  findDiscountByCode,
  getDiscountConditions,
  calculateTax,
  listShippingRates,
} = require('../../lib/postgres');
const { evaluateDiscount } = require('../../lib/discounts');
const { verifyCustomerToken, getCustomerBearer } = require('../../lib/customer-auth');
const config = require('../../lib/config');

function generateOrderId() {
  return 'OV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

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

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const items = normalizeItems(body);
  const { customerEmail, customerName } = body;

  if (!items.length) {
    return res.status(400).json({ ok: false, error: 'El carrito está vacío.' });
  }

  const couponCode = String(body.couponCode || body.coupon || '').trim();
  // País e identificador de tarifa de envío (ISO-2). Default CH (mercado base).
  const shippingCountry = String(body.shippingCountry || body.country || 'CH').trim().toUpperCase();
  const requestedShippingRateId = String(body.shippingRateId || body.shipping_rate_id || '').trim();

  try {
    const stripe = getStripe(); // throws 503 if not configured
    const catalog = await loadCatalog();
    const { stripeLines, orderLines, totalChf } = buildStripeLineItems(catalog, items);
    const subtotalChf = totalChf;

    // ── Validación de cupón SERVER-SIDE (no se confía en el cliente) ──────────
    // El descuento se evalúa contra la fila real de `discounts` (+ condiciones) y
    // se aplica del lado servidor; si es inválido se rechaza el checkout.
    let discountChf = 0;
    let appliedDiscount = null; // { discountId, code, amountChf }
    let freeShipping = false;
    if (couponCode) {
      if (!config.dbConfigured) {
        return res.status(400).json({ ok: false, error: 'Cupones no disponibles en este momento.' });
      }
      const row = await findDiscountByCode(couponCode);
      // Contexto del carrito para evaluar discount_conditions (producto/variante/cantidad).
      const conditions = row ? await getDiscountConditions(row.id) : [];
      const ctx = {
        subtotalChf,
        totalQuantity: orderLines.reduce((s, l) => s + (Number(l.quantity) || 0), 0),
        productIds: new Set(orderLines.map((l) => l.productId).filter(Boolean)),
        variantIds: new Set(orderLines.map((l) => l.variantId).filter(Boolean)),
        collectionIds: new Set(),
      };
      const check = evaluateDiscount(row, subtotalChf, conditions, ctx);
      if (!check.valid) {
        return res.status(400).json({ ok: false, error: check.error || 'Cupón inválido.' });
      }
      discountChf = check.amountChf;
      freeShipping = Boolean(check.freeShipping);
      appliedDiscount = { discountId: row.id, code: row.code, amountChf: discountChf };
    }

    const subtotalAfterDiscount = Math.max(0, subtotalChf - discountChf);

    // ── Envío: tarifas aplicables al país (incluye pickup en atelier) ─────────
    let shippingChf = 0;
    let shippingLine = null; // { shippingRateId, title, method, carrier, priceChf }
    if (config.dbConfigured) {
      const rates = await listShippingRates(shippingCountry, subtotalAfterDiscount);
      if (rates.length) {
        const chosen = (requestedShippingRateId && rates.find((r) => r.id === requestedShippingRateId)) || rates[0];
        if (chosen) {
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

    // ── Impuesto: TVA por país. Si included_in_price, ya está dentro del precio
    // (no se suma al cargo); si no, se añade al total y a Stripe. ───────────────
    let taxChf = 0;
    let addedTaxChf = 0;
    let taxLine = null;
    if (config.dbConfigured) {
      const tax = await calculateTax(subtotalAfterDiscount, shippingCountry);
      if (tax && tax.amountChf > 0) {
        taxChf = tax.amountChf;
        addedTaxChf = tax.included ? 0 : tax.amountChf;
        taxLine = { title: tax.title || 'VAT', rate: tax.rate, amountChf: tax.amountChf };
      }
    }

    const orderTotalChf = Math.max(0, subtotalAfterDiscount + shippingChf + addedTaxChf);

    const orderId = generateOrderId();
    const firstProduct = findProduct(catalog, items[0].slug);
    const cancelPath =
      items.length === 1 && firstProduct
        ? `/producto/${firstProduct.slug}`
        : '/checkout?canceled=1';

    const sessionParams = {
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: stripeLines,
      success_url: `${config.siteUrl}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.siteUrl}${cancelPath}`,
      metadata: {
        order_id: orderId,
        item_count: String(items.length),
        coupon_code: appliedDiscount ? appliedDiscount.code : '',
        engrave_text: items
          .map((i) => (i.engraveText && String(i.engraveText).trim()) || '')
          .filter(Boolean).join(' | ').slice(0, 500),
      },
      shipping_address_collection: {
        allowed_countries: ['CH', 'DE', 'FR', 'IT', 'ES', 'GB', 'CO', 'US'],
      },
    };

    // Envío como shipping_option de Stripe (refleja el coste exacto persistido).
    if (shippingLine) {
      sessionParams.shipping_options = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shippingChf * 100, currency: 'chf' },
          display_name: shippingLine.title || (shippingLine.method === 'pickup' ? 'Retiro en atelier' : 'Envío'),
        },
      }];
    }

    // Impuesto NO incluido en precio: se añade como línea para que el cargo de
    // Stripe cuadre con el total persistido (la TVA suiza va incluida → addedTax=0).
    if (addedTaxChf > 0) {
      sessionParams.line_items.push({
        price_data: {
          currency: 'chf',
          unit_amount: addedTaxChf * 100,
          product_data: { name: taxLine ? taxLine.title : 'Impuesto' },
        },
        quantity: 1,
      });
    }

    // Reflejar el descuento en el cargo de Stripe (cupón de un solo uso).
    // Si Stripe no acepta el cupón, anulamos el descuento para que el cargo y
    // el total persistido sean siempre consistentes.
    if (discountChf > 0) {
      try {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: discountChf * 100,
          currency: 'chf',
          duration: 'once',
          name: appliedDiscount.code,
        });
        sessionParams.discounts = [{ coupon: stripeCoupon.id }];
      } catch (couponErr) {
        console.warn('[checkout] stripe coupon:', couponErr.message);
        discountChf = 0;
        appliedDiscount = null;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    const finalTotalChf = Math.max(0, subtotalChf - discountChf + shippingChf + addedTaxChf);

    if (config.dbConfigured) {
      try {
        const primary = orderLines[0];
        const session_ = verifyCustomerToken(getCustomerBearer(req));
        await createOrderWithDetails({
          id: orderId,
          stripeSessionId: session.id,
          status: 'pending',
          customerId: session_ ? session_.id : null,
          customerEmail: customerEmail || (session_ ? session_.email : null),
          customerName: customerName || (session_ ? session_.nombre : null),
          productId: primary ? primary.productId : null,
          variantId: primary ? primary.variantId : null,
          totalChf: finalTotalChf,
          subtotalChf,
          discountChf,
          shippingChf,
          taxChf,
          couponCode: appliedDiscount ? appliedDiscount.code : '',
          currency: 'chf',
          lineItems: orderLines,
          engraveConfig: orderLines
            .filter((l) => l.engrave)
            .map((l) => ({ slug: l.slug, text: l.engrave.text })),
          discount: appliedDiscount,
          taxLine,
          shippingLine,
        });
      } catch (dbErr) {
        console.warn('[checkout] order db:', dbErr.message);
      }
    }

    return res.status(200).json({
      ok: true, sessionId: session.id, url: session.url, orderId,
      subtotalChf, discountChf, shippingChf, taxChf, totalChf: finalTotalChf,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ ok: false, error: err.message });
    if (err.code === 'PRODUCT_NOT_FOUND') return res.status(404).json({ ok: false, error: err.message });
    if (err.code === 'OUT_OF_STOCK') return res.status(400).json({ ok: false, error: err.message });
    console.error('[checkout/create]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar el pago.' });
  }
};
