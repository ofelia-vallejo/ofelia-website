const fs = require('fs');
const path = require('path');
const postgres = require('./postgres');

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json');
const BLOB_PATHNAME = 'ofelia/catalog.json';

function hasBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readFileCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  return JSON.parse(raw);
}

async function loadCatalog() {
  if (postgres.hasPostgres()) {
    try {
      const catalog = await postgres.loadCatalogFromPostgres();
      if (catalog && catalog.products.length) return catalog;
    } catch (err) {
      console.warn('[store] postgres read failed:', err.message);
    }
  }

  if (hasBlob()) {
    try {
      const { head } = require('@vercel/blob');
      const meta = await head(BLOB_PATHNAME, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (meta && meta.url) {
        const res = await fetch(meta.url);
        if (res.ok) return res.json();
      }
    } catch (err) {
      console.warn('[store] blob read failed, using file:', err.message);
    }
  }
  return readFileCatalog();
}

async function saveCatalog(catalog) {
  catalog.updatedAt = new Date().toISOString();

  if (postgres.hasPostgres()) {
    try {
      return await postgres.saveCatalogToPostgres(catalog);
    } catch (err) {
      console.error('[store] postgres save failed:', err.message);
      if (!hasBlob() && process.env.STORE_MODE !== 'file' && process.env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  if (hasBlob()) {
    const { put } = require('@vercel/blob');
    await put(BLOB_PATHNAME, JSON.stringify(catalog, null, 2), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true,
    });
    return { storage: 'blob' };
  }

  if (process.env.STORE_MODE === 'file' || process.env.NODE_ENV !== 'production') {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
    return { storage: 'file' };
  }

  const err = new Error(
    'Guardado no disponible: configura DATABASE_URL o BLOB_READ_WRITE_TOKEN.'
  );
  err.code = 'STORE_READONLY';
  throw err;
}

function findProduct(catalog, idOrSlug) {
  return catalog.products.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  );
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

function totalInventory(product) {
  if (product.variants && product.variants.length) {
    return product.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
  }
  return Number(product.inventory) || 0;
}

module.exports = {
  loadCatalog,
  saveCatalog,
  findProduct,
  slugify,
  newProductId,
  totalInventory,
  hasBlob,
  hasPostgres: postgres.hasPostgres,
  CATALOG_PATH,
  postgres,
};
