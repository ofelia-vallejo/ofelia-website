'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCartContext, computeCheckout, normalizeItems } = require('../../lib/compute-checkout');

test('normalizeItems supports cart item arrays', () => {
  const result = normalizeItems({
    items: [
      {
        slug: 'morral-elite',
        variant_id: 'negro',
        quantity: 2,
        engrave_text: 'EV',
        engrave_enabled: true,
      },
    ],
  });

  assert.deepEqual(result, [
    {
      slug: 'morral-elite',
      variantId: 'negro',
      quantity: 2,
      engraveText: 'EV',
      engraveEnabled: true,
    },
  ]);
});

test('normalizeItems supports legacy single-product requests', () => {
  const result = normalizeItems({
    slug: 'travel-bag-ii',
    variantId: 'cognac',
    engraveText: 'OV',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 1);
  assert.equal(result[0].slug, 'travel-bag-ii');
});

test('computeCheckout rejects empty carts before loading catalog', async () => {
  const result = await computeCheckout({});

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.match(result.error, /vacío/);
});

test('buildCartContext summarizes checkout lines', async () => {
  const result = await buildCartContext([
    { productId: 'p_1', variantId: 'v_1', quantity: 2 },
    { productId: 'p_2', variantId: 'v_2', quantity: 1 },
  ], 780);

  assert.equal(result.subtotalChf, 780);
  assert.equal(result.totalQuantity, 3);
  assert.equal(result.productIds.has('p_1'), true);
  assert.equal(result.variantIds.has('v_2'), true);
});
