'use strict';

// Pure utility functions for catalog data — no I/O, no side effects.
// Extracted from store.js to satisfy SRP: store.js owns persistence, this owns transforms.

function findProduct(catalog, idOrSlug) {
  return catalog.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

function totalInventory(product) {
  if (product.variants && product.variants.length) {
    return product.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
  }
  return Number(product.inventory) || 0;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function newProductId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const COPY_FIELDS = [
  'tagline',
  'heroDescription',
  'descriptionParagraphs',
  'care',
  'material',
  'dimensions',
  'weight',
  'hardware',
  'specs',
  'editorialImage',
  'editorialCaption',
];

function enrichProductWithCopy(product, copy) {
  if (!copy || !product) return product;
  const merged = Object.assign({}, product);
  COPY_FIELDS.forEach(function (field) {
    if (copy[field] != null && copy[field] !== '') {
      merged[field] = copy[field];
    }
  });
  if (copy.descriptionParagraphs && copy.descriptionParagraphs.length) {
    merged.description = copy.descriptionParagraphs.join(' ');
  }
  return merged;
}

function enrichCatalogWithCopy(catalog, copyDoc) {
  if (!catalog || !copyDoc || !copyDoc.products) return catalog;
  return Object.assign({}, catalog, {
    products: catalog.products.map(function (p) {
      return enrichProductWithCopy(p, copyDoc.products[p.slug]);
    }),
  });
}

module.exports = {
  findProduct,
  totalInventory,
  slugify,
  newProductId,
  enrichProductWithCopy,
  enrichCatalogWithCopy,
};
