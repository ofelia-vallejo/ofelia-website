const { corsJson, requireAdmin } = require('../../lib/auth');
const {
  listOrders,
  getOrderDetail,
  createRefund,
} = require('../../lib/postgres');
const { parseRefund } = require('../../lib/validation');
const config = require('../../lib/config');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  if (!config.dbConfigured) {
    return res.status(503).json({ ok: false, error: 'Base de datos no configurada.' });
  }

  try {
    const id = req.query?.id;

    if (req.method === 'GET') {
      if (id) {
        const detail = await getOrderDetail(id);
        if (!detail) return res.status(404).json({ ok: false, error: 'Pedido no encontrado.' });
        return res.status(200).json({ ok: true, ...detail });
      }
      const orders = await listOrders(Number(req.query?.limit) || 100);
      return res.status(200).json({ ok: true, orders });
    }

    // Reembolso: POST /api/admin/orders?id=ORDER  body { amountChf, lines?, restock?, reason?, note? }
    if (req.method === 'POST') {
      const body = Object.assign({}, req.body || {}, { orderId: id || (req.body && req.body.orderId) });
      const parsed = parseRefund(body);
      if (!parsed.ok) {
        return res.status(400).json({ ok: false, error: parsed.error, issues: parsed.issues });
      }
      const refund = parsed.data;

      const detail = await getOrderDetail(refund.orderId);
      if (!detail) return res.status(404).json({ ok: false, error: 'Pedido no encontrado.' });

      // No reembolsar más de lo cobrado (invariante de dinero).
      const order = detail.order;
      const maxRefundable = (Number(order.total_chf) || 0) - (Number(order.refunded_chf) || 0);
      if (refund.amountChf > maxRefundable) {
        return res.status(400).json({
          ok: false,
          error: `El reembolso (${refund.amountChf} CHF) supera lo reembolsable (${maxRefundable} CHF).`,
        });
      }

      // Emitir reembolso en Stripe si hay claves + payment_intent; si no, queda manual.
      let stripeRefundId = null;
      if (config.stripeConfigured && order.stripe_payment_intent) {
        try {
          const { getStripe } = require('../../lib/stripe-client');
          const stripe = getStripe();
          const sr = await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent,
            amount: refund.amountChf * 100,
          });
          stripeRefundId = sr.id;
        } catch (stripeErr) {
          console.warn('[admin/orders] stripe refund:', stripeErr.message);
          return res.status(502).json({ ok: false, error: 'Stripe rechazó el reembolso: ' + stripeErr.message });
        }
      }

      // Si la dueña marcó "reponer stock" pero no detalló líneas, reponemos según
      // las líneas reales del pedido (cantidad por variante). Sin esto, el checkbox
      // de reposición no tendría efecto en un reembolso a nivel de pedido.
      let lines = refund.lines || [];
      if (refund.restock && !lines.length) {
        lines = (detail.lines || [])
          .filter((l) => l.variant_id)
          .map((l) => ({
            orderLineItemId: l.id,
            productId: l.product_id,
            variantId: l.variant_id,
            quantity: Number(l.quantity) || 1,
            amountChf: 0,
            restock: true,
          }));
      }

      const result = await createRefund({
        orderId: refund.orderId,
        amountChf: refund.amountChf,
        reason: refund.reason,
        note: refund.note,
        restock: refund.restock,
        lines,
        stripeRefundId,
        stripePaymentIntent: order.stripe_payment_intent || null,
        createdBy: 'admin',
      });
      if (!result.ok) {
        return res.status(400).json({ ok: false, error: 'No se pudo registrar el reembolso (' + (result.reason || '') + ').' });
      }
      return res.status(200).json({ ok: true, ...result, stripeRefundId });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/orders]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error del servidor.' });
  }
};
