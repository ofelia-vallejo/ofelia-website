'use strict';

// POST /api/checkout/webhook — Stripe webhook receiver.
// Raw body required for HMAC signature verification — must NOT be JSON-parsed by middleware.

const { getStripe } = require('../../lib/stripe-client');
const config = require('../../lib/config');
const {
  updateOrderBySession,
  getOrderBySession,
  logOrderEvent,
  decrementInventory,
} = require('../../lib/postgres');

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  if (!config.stripeWebhookSecret) {
    return res.status(503).send('Webhook no configurado. Verifica STRIPE_WEBHOOK_SECRET.');
  }

  let stripe;
  try { stripe = getStripe(); }
  catch (err) { return res.status(503).send(err.message); }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret);
  } catch (err) {
    console.error('[webhook] signature:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      const productId = session.metadata?.product_id;
      const variantId = session.metadata?.variant_id || null;

      if (config.dbConfigured) {
        await updateOrderBySession(session.id, {
          status: 'paid',
          stripePaymentIntent: session.payment_intent,
          customerEmail: session.customer_details?.email || session.customer_email,
        });

        if (orderId) {
          await logOrderEvent(orderId, 'checkout.session.completed', {
            amount_total: session.amount_total,
            currency: session.currency,
          });
        }

        if (productId) {
          await decrementInventory(productId, variantId, 1);
        }
      }
    }

    if (event.type === 'checkout.session.expired' && config.dbConfigured) {
      const session = event.data.object;
      await updateOrderBySession(session.id, { status: 'expired' });
      const order = await getOrderBySession(session.id);
      if (order) await logOrderEvent(order.id, 'checkout.session.expired', {});
    }
  } catch (err) {
    console.error('[webhook] handler:', err);
    return res.status(500).send('Handler error');
  }

  return res.status(200).json({ received: true });
};
