/** Precio efectivo: variante con priceCHF, si no basePrice del producto. */

function variantPrice(product, variant) {
  if (variant != null && variant.priceCHF != null && variant.priceCHF !== '') {
    return Math.round(Number(variant.priceCHF)) || 0;
  }
  return Math.round(Number(product && product.basePrice) || 0);
}

function syncProductInventoryFromVariants(product) {
  if (!product.variants || !product.variants.length) return product;
  product.inventory = product.variants.reduce(
    (s, v) => s + (Number(v.inventory) || 0),
    0
  );
  const prices = product.variants
    .map((v) => variantPrice(product, v))
    .filter((n) => n > 0);
  if (prices.length) product.basePrice = Math.min(...prices);
  return product;
}

module.exports = { variantPrice, syncProductInventoryFromVariants };
