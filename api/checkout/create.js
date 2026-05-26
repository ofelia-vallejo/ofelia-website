const Stripe = require('stripe');
const { corsJson } = require('../../lib/auth');
const { loadCatalog, findProduct, totalInventory } = require('../../lib/store');
const { createOrder } = require('../../lib/postgres');

const SITE_URL = process.env.SITE_URL || 'https://ofeliavallejo.com';

function generateOrderId() {
  return 'OV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
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

  const {
    slug,
    variantId,
    engraveText,
    engraveEnabled,
    customerEmail,
    customerName,
  } = req.body || {};

  if (!slug) {
    return res.status(400).json({ ok: false, error: 'slug requerido.' });
  }

  try {
    const catalog = await loadCatalog();
    const product = findProduct(catalog, slug);
    if (!product || !product.active) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
    }

    const stock = totalInventory(product);
    if (stock <= 0) {
      return res.status(400).json({ ok: false, error: 'Producto agotado.' });
    }

    const withEngrave = Boolean(engraveEnabled && engraveText && engraveText.trim());
    const baseCents = Math.round(Number(product.basePrice) || 0) * 100;
    const engraveCents = withEngrave ? Math.round(Number(product.engravePrice) || 0) * 100 : 0;

    const lineItems = [
      {
        price_data: {
          currency: 'chf',
          unit_amount: baseCents,
          product_data: {
            name: product.name,
            description: product.shortDescription || 'Cuero colombiano · Ofelia Vallejo',
            images: product.images && product.images[0] ? [absUrl(product.images[0].url)] : [],
          },
        },
        quantity: 1,
      },
    ];

    if (engraveCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'chf',
          unit_amount: engraveCents,
          product_data: {
            name: 'Grabado láser · ' + (engraveText.trim().slice(0, 24)),
            description: 'Servicio adicional de personalización CO₂',
          },
        },
        quantity: 1,
      });
    }

    const orderId = generateOrderId();
    const stripe = new Stripe(secret, { apiVersion: '2024-11-20.acacia' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      success_url: `${SITE_URL}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/producto/${product.slug}`,
      metadata: {
        order_id: orderId,
        product_id: product.id,
        variant_id: variantId || '',
        engrave_text: withEngrave ? engraveText.trim().slice(0, 60) : '',
      },
      shipping_address_collection: {
        allowed_countries: ['CH', 'DE', 'FR', 'IT', 'ES', 'GB', 'CO', 'US'],
      },
    });

    if (process.env.DATABASE_URL) {
      try {
      await createOrder({
        id: orderId,
        stripeSessionId: session.id,
        status: 'pending',
        customerEmail: customerEmail || null,
        customerName: customerName || null,
        productId: product.id,
        variantId: variantId || null,
        totalChf: Math.round((baseCents + engraveCents) / 100),
        lineItems: lineItems.map((li) => ({
          name: li.price_data.product_data.name,
          amount: li.price_data.unit_amount,
        })),
        engraveConfig: withEngrave ? { text: engraveText.trim() } : {},
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
    console.error('[checkout/create]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar el pago.' });
  }
};

function absUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SITE_URL + (path.startsWith('/') ? path : '/' + path);
}
