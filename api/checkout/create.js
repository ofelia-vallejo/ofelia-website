const Stripe = require('stripe');
const { corsJson } = require('../../lib/auth');
const { loadCatalog, findProduct, totalInventory } = require('../../lib/store');
const { buildStripeLineItems } = require('../../lib/build-stripe-lines');
const { createOrder } = require('../../lib/postgres');

const SITE_URL = process.env.SITE_URL || 'https://ofeliavallejo.com';

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
    return [
      {
        slug: body.slug,
        variantId: body.variantId || body.variant_id || '',
        quantity: 1,
        engraveText: body.engraveText || '',
        engraveEnabled: body.engraveEnabled,
      },
    ];
  }
  return [];
}

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(503).json({ ok: false, error: 'Pasarela de pago no configurada.' });
  }

  const body = req.body || {};
  const items = normalizeItems(body);
  const { customerEmail, customerName } = body;

  if (!items.length) {
    return res.status(400).json({ ok: false, error: 'El carrito está vacío.' });
  }

  try {
    const catalog = await loadCatalog();
    const { stripeLines, orderLines, totalChf } = buildStripeLineItems(catalog, items);

    const orderId = generateOrderId();
    const stripe = new Stripe(secret, { apiVersion: '2024-11-20.acacia' });

    const firstSlug = items[0].slug;
    const firstProduct = findProduct(catalog, firstSlug);
    const cancelPath =
      items.length === 1 && firstProduct
        ? `/producto/${firstProduct.slug}`
        : '/checkout?canceled=1';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: stripeLines,
      success_url: `${SITE_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}${cancelPath}`,
      metadata: {
        order_id: orderId,
        item_count: String(items.length),
        engrave_text: items
          .map((i) => (i.engraveText && String(i.engraveText).trim()) || '')
          .filter(Boolean)
          .join(' | ')
          .slice(0, 500),
      },
      shipping_address_collection: {
        allowed_countries: ['CH', 'DE', 'FR', 'IT', 'ES', 'GB', 'CO', 'US'],
      },
    });

    if (process.env.DATABASE_URL) {
      try {
        const primary = orderLines[0];
        await createOrder({
          id: orderId,
          stripeSessionId: session.id,
          status: 'pending',
          customerEmail: customerEmail || null,
          customerName: customerName || null,
          productId: primary ? primary.productId : null,
          variantId: primary ? primary.variantId : null,
          totalChf,
          lineItems: orderLines,
          engraveConfig: orderLines
            .filter((l) => l.engrave)
            .map((l) => ({ slug: l.slug, text: l.engrave.text })),
        });
      } catch (dbErr) {
        console.warn('[checkout] order db:', dbErr.message);
      }
    }

    return res.status(200).json({
      ok: true,
      sessionId: session.id,
      url: session.url,
      orderId,
    });
  } catch (err) {
    if (err.code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ ok: false, error: err.message });
    }
    if (err.code === 'OUT_OF_STOCK') {
      return res.status(400).json({ ok: false, error: err.message });
    }
    console.error('[checkout/create]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar el pago.' });
  }
};
