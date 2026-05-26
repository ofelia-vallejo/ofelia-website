const Stripe = require('stripe');
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
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return res.status(503).send('Webhook no configurado');
  }

  const stripe = new Stripe(secret);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
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

      if (process.env.DATABASE_URL) {
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
          await decrementInventory(productId, variantId || null, 1);
        }
      }
    }

    if (event.type === 'checkout.session.expired' && process.env.DATABASE_URL) {
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
