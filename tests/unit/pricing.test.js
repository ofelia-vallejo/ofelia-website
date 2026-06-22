'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { variantPrice, syncProductInventoryFromVariants } = require('../../lib/pricing');

test('variantPrice uses variant price when present', () => {
  const product = { basePrice: 420 };
  const variant = { priceCHF: '485' };

  assert.equal(variantPrice(product, variant), 485);
});

test('variantPrice falls back to product base price', () => {
  const product = { basePrice: '390' };

  assert.equal(variantPrice(product, null), 390);
  assert.equal(variantPrice(product, { priceCHF: '' }), 390);
});

test('syncProductInventoryFromVariants totals stock and keeps lowest active price', () => {
  const product = {
    basePrice: 500,
    variants: [
      { inventory: 2, priceCHF: 460 },
      { inventory: '3', priceCHF: 420 },
      { inventory: 0, priceCHF: '' },
    ],
  };

  const updated = syncProductInventoryFromVariants(product);

  assert.equal(updated.inventory, 5);
  assert.equal(updated.basePrice, 420);
});
