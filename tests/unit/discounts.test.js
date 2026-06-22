'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeAmount,
  evaluateBaseRules,
  evaluateConditions,
  evaluateDiscount,
} = require('../../lib/discounts');

test('computeAmount caps fixed discounts at subtotal', () => {
  const row = { type: 'fixed_amount', value: 200, target_type: 'order' };

  assert.deepEqual(computeAmount(row, 120), { amountChf: 120, freeShipping: false });
});

test('computeAmount calculates percentage discounts in whole CHF', () => {
  const row = { type: 'percentage', value: 15, target_type: 'order' };

  assert.deepEqual(computeAmount(row, 333), { amountChf: 50, freeShipping: false });
});

test('evaluateBaseRules rejects inactive and minimum-subtotal coupons', () => {
  assert.equal(evaluateBaseRules({ active: false }, 500).valid, false);

  const result = evaluateBaseRules({ active: true, min_subtotal_chf: 600 }, 500);
  assert.equal(result.valid, false);
  assert.match(result.error, /subtotal mínimo/);
});

test('evaluateConditions ORs within a type and ANDs between types', () => {
  const conditions = [
    { condition_type: 'product', ref_id: 'p_morral' },
    { condition_type: 'product', ref_id: 'p_travel' },
    { condition_type: 'min_quantity', int_value: 2 },
  ];
  const ctx = {
    subtotalChf: 900,
    totalQuantity: 2,
    productIds: new Set(['p_travel']),
    variantIds: new Set(),
    collectionIds: new Set(),
  };

  assert.deepEqual(evaluateConditions(conditions, ctx), { valid: true });
});

test('evaluateDiscount supports free shipping without reducing subtotal', () => {
  const row = {
    id: 'd_ship',
    code: 'ENVIO',
    active: true,
    target_type: 'shipping',
    type: 'fixed_amount',
    value: 0,
  };

  const result = evaluateDiscount(row, 300);

  assert.equal(result.valid, true);
  assert.equal(result.amountChf, 0);
  assert.equal(result.freeShipping, true);
});
