#!/usr/bin/env node
/**
 * Migración + seed PostgreSQL desde data/catalog.json
 * Uso: DATABASE_URL=postgres://... node scripts/db-migrate.js
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

const PDP_DEFAULTS = require('./pdp-defaults');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Falta DATABASE_URL');
    process.exit(1);
  }

  const sql = postgres(url, {
    ssl: url.includes('localhost') ? false : 'require',
  });

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  for (const stmt of statements) {
    await sql.unsafe(stmt);
  }
  console.log('Schema aplicado.');

  const catalogPath = path.join(__dirname, '..', 'data', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  for (const p of catalog.products) {
    if (!p.colorData && PDP_DEFAULTS[p.slug]) {
      p.colorData = PDP_DEFAULTS[p.slug].colorData;
      p.accordion = PDP_DEFAULTS[p.slug].accordion || p.accordion;
      p.editorialImage = PDP_DEFAULTS[p.slug].editorialImage;
      p.editorialCaption = PDP_DEFAULTS[p.slug].editorialCaption;
    }
  }

  const { saveCatalogToPostgres } = require('../lib/postgres');
  process.env.DATABASE_URL = url;
  await saveCatalogToPostgres(catalog);
  console.log('Seed:', catalog.products.length, 'productos.');

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
