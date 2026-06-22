'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  absUrl,
  buildStripeLineItems,
  findVariant,
  heroImage,
  variantLabel,
} = require('../../lib/build-stripe-lines');

function catalogFixture() {
  return {
    products: [
      {
        id: 'p_bandolera',
        slug: 'bandolera-moderna',
        name: 'Bandolera Moderna',
        active: true,
        basePrice: 320,
        shortDescription: 'Cuero pleno colombiano',
        engravePrice: 35,
        variants: [
          { id: 'v_negro', colorKey: 'negro', colorName: 'Negro', sku: 'OV-BM-N', inventory: 4, priceCHF: 340 },
          { id: 'v_cognac', colorKey: 'cognac', colorName: 'Cognac', sku: 'OV-BM-C', inventory: 1, priceCHF: 360 },
        ],
        images: [
          { kind: 'hero', url: '/imagenes nuevas/producto/bandolera.jpg' },
          { variantId: 'v_negro', url: '/imagenes nuevas/producto/bandolera-negro.jpg' },
        ],
      },
    ],
  };
}

test('findVariant resolves by id, colorKey or sku', () => {
  const product = catalogFixture().products[0];

  assert.equal(findVariant(product, 'v_negro').id, 'v_negro');
  assert.equal(findVariant(product, 'cognac').id, 'v_cognac');
  assert.equal(findVariant(product, 'OV-BM-N').id, 'v_negro');
});

test('variantLabel and heroImage prefer editorial product metadata', () => {
  const product = catalogFixture().products[0];
  const variant = findVariant(product, 'v_negro');

  assert.equal(variantLabel(variant), 'Negro');
  assert.equal(heroImage(product, variant), '/imagenes nuevas/producto/bandolera-negro.jpg');
});

test('absUrl preserves external URLs and expands local asset paths', () => {
  assert.equal(absUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  assert.equal(absUrl('/a.jpg'), 'https://ofeliavallejo.com/a.jpg');
});

test('buildStripeLineItems builds product and engraving lines', async () => {
  const result = await buildStripeLineItems(catalogFixture(), [
    {
      slug: 'bandolera-moderna',
      variantId: 'v_negro',
      quantity: 2,
      engraveEnabled: true,
      engraveText: 'Ofelia Vallejo',
    },
  ]);

  assert.equal(result.stripeLines.length, 2);
  assert.equal(result.orderLines.length, 1);
  assert.equal(result.totalChf, 750);
  assert.equal(result.stripeLines[0].price_data.unit_amount, 34000);
  assert.equal(result.stripeLines[1].price_data.unit_amount, 3500);
  assert.equal(result.orderLines[0].engrave.text, 'Ofelia Vallejo');
});

test('buildStripeLineItems rejects out-of-stock requests', async () => {
  await assert.rejects(
    () => buildStripeLineItems(catalogFixture(), [
      { slug: 'bandolera-moderna', variantId: 'v_cognac', quantity: 4 },
    ]),
    /sin stock suficiente/
  );
});
