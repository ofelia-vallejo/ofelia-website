'use strict';

// POST /api/checkout/create
// Body: { items: [{slug, variantId?, quantity?, engraveText?, engraveEnabled?}], customerEmail?, customerName?,
//         couponCode?, shippingCountry?, shippingRateId? }
//    or legacy: { slug, variantId?, engraveText?, engraveEnabled?, customerEmail? }
// Returns: { ok, sessionId, url, orderId }

const { corsJson } = require('../../lib/auth');
const { getStripe } = require('../../lib/stripe-client');
const { findProduct } = require('../../lib/store');
const { computeCheckout } = require('../../lib/compute-checkout');
const { createOrderWithDetails } = require('../../lib/postgres');
const { verifyCustomerToken, getCustomerBearer } = require('../../lib/customer-auth');
const config = require('../../lib/config');

function generateOrderId() {
  return 'OV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { customerEmail, customerName } = body;

  try {
    const stripe = getStripe(); // throws 503 if not configured
    const calc = await computeCheckout(body);
    if (!calc.ok) {
      return res.status(calc.status || 400).json({ ok: false, error: calc.error });
    }

    const {
      items,
      stripeLines,
      orderLines,
      subtotalChf,
      discountChf,
      shippingChf,
      taxChf,
      addedTaxChf,
      totalChf: finalTotalChf,
      shippingLine,
      taxLine,
      appliedDiscount,
    } = calc;

    const orderId = generateOrderId();
    const firstProduct = findProduct(calc.catalog, items[0].slug);
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

    if (shippingLine) {
      sessionParams.shipping_options = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: shippingChf * 100, currency: 'chf' },
          display_name: shippingLine.title || (shippingLine.method === 'pickup' ? 'Retiro en atelier' : 'Envío'),
        },
      }];
    }

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

    let discountChfFinal = discountChf;
    let appliedDiscountFinal = appliedDiscount;
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
        discountChfFinal = 0;
        appliedDiscountFinal = null;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
          discountChf: discountChfFinal,
          shippingChf,
          taxChf,
          couponCode: appliedDiscountFinal ? appliedDiscountFinal.code : '',
          currency: 'chf',
          lineItems: orderLines,
          engraveConfig: orderLines
            .filter((l) => l.engrave)
            .map((l) => ({ slug: l.slug, text: l.engrave.text })),
          discount: appliedDiscountFinal,
          taxLine,
          shippingLine,
        });
      } catch (dbErr) {
        console.warn('[checkout] order db:', dbErr.message);
      }
    }

    return res.status(200).json({
      ok: true, sessionId: session.id, url: session.url, orderId,
      subtotalChf, discountChf: discountChfFinal, shippingChf, taxChf, totalChf: finalTotalChf,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ ok: false, error: err.message });
    console.error('[checkout/create]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar el pago.' });
  }
};
