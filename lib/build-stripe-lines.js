const { findProduct, totalInventory } = require('./store');

const SITE_URL = process.env.SITE_URL || 'https://ofeliavallejo.com';

function absUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SITE_URL + (path.startsWith('/') ? path : '/' + path);
}

function findVariant(product, variantId) {
  if (!product.variants || !product.variants.length) return null;
  if (!variantId) return product.variants[0];
  return (
    product.variants.find(
      (v) => v.id === variantId || v.colorKey === variantId || v.sku === variantId
    ) || product.variants[0]
  );
}

function variantLabel(variant) {
  if (!variant) return '';
  return variant.colorName || variant.colorKey || variant.id || '';
}

function heroImage(product, variant) {
  const imgs = product.images || [];
  if (variant && variant.id) {
    const match = imgs.find((i) => i.variantId === variant.id);
    if (match && match.url) return match.url;
  }
  const hero = imgs.find((i) => i.kind === 'hero') || imgs[0];
  return hero && hero.url ? hero.url : '';
}

/**
 * Construye line_items de Stripe Checkout desde ítems del carrito.
 * @param {object} catalog
 * @param {Array<{slug:string, variantId?:string, quantity?:number, engraveText?:string, engraveEnabled?:boolean}>} items
 */
function buildStripeLineItems(catalog, items) {
  const stripeLines = [];
  const orderLines = [];
  let totalChf = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.min(10, Number(item.quantity) || 1));
    const product = findProduct(catalog, item.slug);
    if (!product || !product.active) {
      const err = new Error('Producto no encontrado: ' + item.slug);
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const variant = findVariant(product, item.variantId);
    const stock = variant
      ? Number(variant.inventory) || 0
      : totalInventory(product);
    if (stock < qty) {
      const err = new Error(product.name + ' · sin stock suficiente.');
      err.code = 'OUT_OF_STOCK';
      throw err;
    }

    const withEngrave = Boolean(
      item.engraveEnabled && item.engraveText && String(item.engraveText).trim()
    );
    const engraveText = withEngrave ? String(item.engraveText).trim().slice(0, 60) : '';
    const baseCents = Math.round(Number(product.basePrice) || 0) * 100;
    const engraveCents = withEngrave ? Math.round(Number(product.engravePrice) || 0) * 100 : 0;
    const vLabel = variantLabel(variant);
    const productTitle = vLabel ? product.name + ' · ' + vLabel : product.name;
    const img = heroImage(product, variant);

    stripeLines.push({
      price_data: {
        currency: 'chf',
        unit_amount: baseCents,
        product_data: {
          name: productTitle,
          description: product.shortDescription || 'Cuero colombiano · Ofelia Vallejo',
          images: img ? [absUrl(img)] : [],
        },
      },
      quantity: qty,
    });

    orderLines.push({
      productId: product.id,
      slug: product.slug,
      name: productTitle,
      variantId: variant ? variant.id : null,
      sku: variant ? variant.sku : null,
      quantity: qty,
      baseChf: Math.round(baseCents / 100) * qty,
      engrave: withEngrave ? { text: engraveText, chf: Math.round(engraveCents / 100) } : null,
    });

    totalChf += (Math.round(baseCents / 100) + (withEngrave ? Math.round(engraveCents / 100) : 0)) * qty;

    if (engraveCents > 0) {
      stripeLines.push({
        price_data: {
          currency: 'chf',
          unit_amount: engraveCents,
          product_data: {
            name: 'Grabado láser · ' + engraveText.slice(0, 24),
            description: 'Servicio adicional CO₂ · ' + product.name,
          },
        },
        quantity: qty,
      });
    }
  }

  return { stripeLines, orderLines, totalChf };
}

module.exports = {
  buildStripeLineItems,
  findVariant,
  variantLabel,
  heroImage,
  absUrl,
};
