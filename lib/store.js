'use strict';

// Data access layer for the product catalog.
// Responsibility: read/write catalog from the configured storage backend.
// Storage priority: Postgres → Vercel Blob → local JSON file (dev only).

const fs = require('fs');
const path = require('path');
const postgres = require('./postgres');
const config = require('./config');

// Re-export catalog utils so callers that import from store.js keep working
const {
  findProduct,
  totalInventory,
  slugify,
  newProductId,
  enrichCatalogWithCopy,
} = require('./catalog-utils');

const CATALOG_PATH = path.join(process.cwd(), 'data', 'catalog.json');
const PRODUCT_COPY_PATH = path.join(process.cwd(), 'data', 'product-copy.json');
const BLOB_PATHNAME = 'ofelia/catalog.json';

function hasBlob() {
  return Boolean(config.blobToken);
}

function readFileCatalog() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  return JSON.parse(raw);
}

function readProductCopy() {
  try {
    if (!fs.existsSync(PRODUCT_COPY_PATH)) return null;
    return JSON.parse(fs.readFileSync(PRODUCT_COPY_PATH, 'utf8'));
  } catch (err) {
    console.warn('[store] product-copy read failed:', err.message);
    return null;
  }
}

function applyProductCopy(catalog) {
  const copyDoc = readProductCopy();
  return copyDoc ? enrichCatalogWithCopy(catalog, copyDoc) : catalog;
}

async function loadCatalog() {
  if (postgres.hasPostgres()) {
    try {
      const catalog = await postgres.loadCatalogFromPostgres();
      if (catalog && catalog.products.length) return applyProductCopy(catalog);
    } catch (err) {
      console.warn('[store] postgres read failed:', err.message);
    }
  }

  if (hasBlob()) {
    try {
      const { head } = require('@vercel/blob');
      const meta = await head(BLOB_PATHNAME, { token: config.blobToken });
      if (meta && meta.url) {
        const res = await fetch(meta.url);
        if (res.ok) return applyProductCopy(await res.json());
      }
    } catch (err) {
      console.warn('[store] blob read failed, using file:', err.message);
    }
  }

  return applyProductCopy(readFileCatalog());
}

async function saveCatalog(catalog) {
  catalog.updatedAt = new Date().toISOString();

  if (postgres.hasPostgres()) {
    try {
      return await postgres.saveCatalogToPostgres(catalog);
    } catch (err) {
      console.error('[store] postgres save failed:', err.message);
      if (!hasBlob() && config.storeMode !== 'file' && config.isProduction) {
        throw err;
      }
    }
  }

  if (hasBlob()) {
    const { put } = require('@vercel/blob');
    await put(BLOB_PATHNAME, JSON.stringify(catalog, null, 2), {
      access: 'public',
      token: config.blobToken,
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true,
    });
    return { storage: 'blob' };
  }

  if (config.storeMode === 'file' || !config.isProduction) {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
    return { storage: 'file' };
  }

  const err = new Error('Guardado no disponible: configura DATABASE_URL o BLOB_READ_WRITE_TOKEN.');
  err.code = 'STORE_READONLY';
  throw err;
}

module.exports = {
  loadCatalog,
  saveCatalog,
  // Utilities re-exported for backwards compatibility
  findProduct,
  totalInventory,
  slugify,
  newProductId,
  hasBlob,
  hasPostgres: postgres.hasPostgres,
  CATALOG_PATH,
  postgres,
};
