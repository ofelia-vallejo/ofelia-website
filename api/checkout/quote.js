'use strict';

// POST /api/checkout/quote
// Body: { items, couponCode?, shippingCountry?, shippingRateId? }
// Returns: totales + tarifas de envío (sin crear sesión Stripe).

const { corsJson } = require('../../lib/auth');
const { computeCheckout } = require('../../lib/compute-checkout');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const result = await computeCheckout(req.body || {});
    if (!result.ok) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }

    return res.status(200).json({
      ok: true,
      subtotalChf: result.subtotalChf,
      discountChf: result.discountChf,
      shippingChf: result.shippingChf,
      taxChf: result.taxChf,
      taxIncluded: result.taxIncluded,
      totalChf: result.totalChf,
      shippingCountry: result.shippingCountry,
      shippingRates: result.shippingRates,
      selectedRateId: result.selectedRateId,
      freeShippingApplied: result.freeShipping,
      couponCode: result.appliedDiscount ? result.appliedDiscount.code : '',
    });
  } catch (err) {
    console.error('[checkout/quote]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo calcular el total.' });
  }
};
