'use strict';

// POST /api/checkout/webhook — Stripe webhook receiver.
// Raw body required for HMAC signature verification — must NOT be JSON-parsed by middleware.

const { getStripe } = require('../../lib/stripe-client');
const config = require('../../lib/config');
const {
  updateOrderBySession,
  getOrderBySession,
  logOrderEvent,
  confirmOrderPaid,
  isStripeEventProcessed,
  getOrderByPaymentIntent,
  getRefundByStripeId,
  createRefund,
} = require('../../lib/postgres');

// Snapshot de dirección desde la sesión de Stripe (envío preferente; si no, facturación).
function mapStripeAddress(session) {
  const sd = session.shipping_details || null;
  const cd = session.customer_details || null;
  const source = sd || cd;
  if (!source) return null;
  const a = (source.address) || (cd && cd.address) || {};
  return {
    fullName: source.name || (cd && cd.name) || '',
    line1: a.line1 || '',
    line2: a.line2 || '',
    city: a.city || '',
    region: a.state || '',
    postalCode: a.postal_code || '',
    country: a.country || '',
    phone: (cd && cd.phone) || '',
    email: (cd && cd.email) || session.customer_email || '',
  };
}

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

      // Only fulfill once payment is actually settled (async methods can be 'unpaid').
      if (session.payment_status !== 'paid') {
        return res.status(200).json({ received: true, pending: true });
      }

      if (config.dbConfigured) {
        // Confirmación transaccional: orders→paid · payments→paid · snapshot de
        // dirección · historial de estado · corte de inventario sobre inventory_levels
        // · marcador de idempotencia (order_events) — todo en UNA transacción pg.
        await confirmOrderPaid({
          sessionId: session.id,
          eventId: event.id,
          paymentIntent: session.payment_intent,
          amountChf: Math.round((Number(session.amount_total) || 0) / 100),
          currency: session.currency || 'chf',
          customerEmail: session.customer_details?.email || session.customer_email,
          shippingAddress: mapStripeAddress(session),
          eventPayload: {
            stripe_event_id: event.id,
            amount_total: session.amount_total,
            currency: session.currency,
          },
        });
      }
    }

    // Reembolso iniciado en Stripe (dashboard o API): refleja el refund en la DB.
    if (event.type === 'charge.refunded' && config.dbConfigured) {
      const charge = event.data.object;
      const paymentIntent = charge.payment_intent;
      const order = paymentIntent ? await getOrderByPaymentIntent(paymentIntent) : null;
      if (order) {
        // Stripe puede reenviar el evento y un cargo puede tener varios refunds;
        // identificamos el refund más reciente y evitamos duplicar por su id.
        const refundList = (charge.refunds && charge.refunds.data) || [];
        const latest = refundList.length ? refundList[refundList.length - 1] : null;
        const stripeRefundId = latest ? latest.id : `re-${charge.id}`;
        const already = await getRefundByStripeId(stripeRefundId);
        if (!already) {
          const amountChf = Math.round((Number(latest ? latest.amount : charge.amount_refunded) || 0) / 100);
          await createRefund({
            id: 'ref-' + stripeRefundId,
            orderId: order.id,
            amountChf,
            reason: 'stripe',
            note: 'Reembolso registrado desde Stripe',
            restock: false, // restock manual desde el panel admin (no se conoce la línea aquí)
            stripeRefundId,
            stripePaymentIntent: paymentIntent,
            createdBy: 'stripe-webhook',
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
