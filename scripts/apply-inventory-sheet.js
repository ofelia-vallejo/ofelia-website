#!/usr/bin/env node
/**
 * Aplica data/inventory-sheet.json → data/catalog.json
 * Uso: node scripts/apply-inventory-sheet.js
 */

const fs = require('fs');
const path = require('path');
const { syncProductInventoryFromVariants } = require('../lib/pricing');

const ROOT = path.join(__dirname, '..');
const SHEET_PATH = path.join(ROOT, 'data', 'inventory-sheet.json');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog.json');

function ensureVariant(product, variantId, defaults) {
  if (!variantId) return null;
  product.variants = product.variants || [];
  let v = product.variants.find(
    (x) => x.id === variantId || x.colorKey === variantId
  );
  if (!v) {
    v = { id: variantId, colorKey: variantId, ...defaults };
    product.variants.push(v);
  }
  return v;
}

function applyRow(catalog, row) {
  const product = catalog.products.find((p) => p.id === row.productId);
  if (!product) {
    console.warn('  ⚠ producto no encontrado:', row.productId, '←', row.label);
    return;
  }

  const qty = Number(row.quantity);
  const price = Number(row.priceCHF);

  if (row.variantId) {
    const v = ensureVariant(product, row.variantId, {
      sku: '',
      colorName: row.label,
      colorHex: '#8B5E3C',
      inventory: 0,
      sort: product.variants.length,
    });
    if (!Number.isNaN(qty)) v.inventory = qty;
    if (!Number.isNaN(price)) v.priceCHF = price;
    product.collectionDisplay = product.collectionDisplay || 'variants';
  } else {
    if (!Number.isNaN(qty)) product.inventory = qty;
    if (!Number.isNaN(price)) product.basePrice = price;
    if (product.variants && product.variants.length === 1 && !Number.isNaN(qty)) {
      product.variants[0].inventory = qty;
      if (!Number.isNaN(price)) product.variants[0].priceCHF = price;
    }
    if (product.variants && product.variants.length > 1 && !Number.isNaN(qty)) {
      const each = Math.floor(qty / product.variants.length);
      const rest = qty - each * product.variants.length;
      product.variants.forEach((v, i) => {
        v.inventory = each + (i < rest ? 1 : 0);
        if (!Number.isNaN(price)) v.priceCHF = price;
      });
    }
  }

  syncProductInventoryFromVariants(product);
  console.log('  ✓', row.label, '→', product.id, row.variantId || '(total)');
}

function ensureSizeVariants(catalog) {
  const sizeProducts = [
    { id: 'travel-bag-iii', std: 'v-standard', gr: 'v-grande', stdName: 'Morral', grName: 'Morral Grande' },
    { id: 'morral-clasico', std: 'v-standard', gr: 'v-grande', stdName: 'Clásico', grName: 'Clásico Grande' },
    { id: 'morral-elite', std: 'v-standard', gr: 'v-grande', stdName: 'Elite', grName: 'Elite Grande' },
  ];

  for (const cfg of sizeProducts) {
    const p = catalog.products.find((x) => x.id === cfg.id);
    if (!p) continue;
    p.collectionDisplay = 'variants';
    const old = (p.variants || [])[0];
    if (!p.variants || !p.variants.find((v) => v.id === cfg.std)) {
      const base = old || { colorKey: 'negro', colorHex: '#141414', sku: '' };
      p.variants = [
        {
          ...base,
          id: cfg.std,
          colorKey: cfg.std,
          colorName: cfg.stdName,
          sort: 0,
        },
        {
          ...base,
          id: cfg.gr,
          colorKey: cfg.gr,
          colorName: cfg.grName,
          sort: 1,
        },
      ];
    }
  }

  const rin = catalog.products.find((p) => p.id === 'rinonera');
  if (rin) {
    rin.collectionDisplay = 'variants';
    const imgMod = rin.colorData && rin.colorData['cognac-multi'];
    const imgClas = rin.colorData && rin.colorData.cognac;
    const imgElite = rin.colorData && rin.colorData.negro;
    rin.variants = [
      {
        id: 'v-mod',
        colorKey: 'mod',
        colorName: 'Moderna',
        sku: 'RIN-MOD',
        colorHex: '#8B5E3C',
        inventory: 0,
        sort: 0,
      },
      {
        id: 'v-clasica',
        colorKey: 'clasica',
        colorName: 'Clásica',
        sku: 'RIN-CLA',
        colorHex: '#8B5E3C',
        inventory: 0,
        sort: 1,
      },
      {
        id: 'v-elite',
        colorKey: 'elite',
        colorName: 'Elite',
        sku: 'RIN-ELI',
        colorHex: '#141414',
        inventory: 0,
        sort: 2,
      },
    ];
    rin.colorData = {
      mod: imgMod || { label: 'Moderna', leather: ['#9a6b42', '#8B5E3C'], images: [], alts: [] },
      clasica: imgClas || { label: 'Clásica', leather: ['#9a6b42', '#8B5E3C'], images: [], alts: [] },
      elite: imgElite || { label: 'Elite', leather: ['#141414'], images: [], alts: [] },
    };
  }
}

function main() {
  const sheet = JSON.parse(fs.readFileSync(SHEET_PATH, 'utf8'));
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

  console.log('Aplicando inventario…');
  ensureSizeVariants(catalog);
  for (const row of sheet.rows) applyRow(catalog, row);

  catalog.products.forEach((p) => syncProductInventoryFromVariants(p));
  catalog.updatedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  console.log('\nListo →', CATALOG_PATH);
  console.log('Siguiente: npm run db:push  (sube a PostgreSQL si DATABASE_URL está configurada)');
}

main();
