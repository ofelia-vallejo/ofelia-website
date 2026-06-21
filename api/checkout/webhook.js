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
  isStripeEventProcessed,
} = require('../../lib/postgres');

async function readRawBody(req) {
  // Some runtimes attach the untouched bytes here. Checking this plain property is safe;
  // never read req.body, which triggers Vercel's lazy parser and consumes the stream.
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
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
    // Idempotency: Stripe redelivers events; skip ones already processed.
    if (config.dbConfigured && (await isStripeEventProcessed(event.id))) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;

      // Only fulfill once payment is actually settled (async methods can be 'unpaid').
      if (session.payment_status !== 'paid') {
        return res.status(200).json({ received: true, pending: true });
      }

      if (config.dbConfigured) {
        await updateOrderBySession(session.id, {
          status: 'paid',
          stripePaymentIntent: session.payment_intent,
          customerEmail: session.customer_details?.email || session.customer_email,
        });

        // Decrement inventory from the persisted order's line items (source of truth),
        // honoring per-line quantity and variant. The session metadata does not carry these.
        const order = await getOrderBySession(session.id);
        const lineItems = Array.isArray(order?.line_items) ? order.line_items : [];
        for (const line of lineItems) {
          if (!line.productId) continue;
          await decrementInventory(line.productId, line.variantId || null, Number(line.quantity) || 1);
        }

        if (orderId) {
          await logOrderEvent(orderId, 'checkout.session.completed', {
            stripe_event_id: event.id,
            amount_total: session.amount_total,
            currency: session.currency,
          });
        }
      }
    }

    if (event.type === 'checkout.session.expired' && config.dbConfigured) {
      const session = event.data.object;
      await updateOrderBySession(session.id, { status: 'expired' });
      const order = await getOrderBySession(session.id);
      if (order) await logOrderEvent(order.id, 'checkout.session.expired', { stripe_event_id: event.id });
    }
  } catch (err) {
    console.error('[webhook] handler:', err);
    return res.status(500).send('Handler error');
  }

  return res.status(200).json({ received: true });
};
