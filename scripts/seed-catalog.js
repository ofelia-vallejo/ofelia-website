#!/usr/bin/env node
/** Copia data/catalog.json — útil tras editar el seed local */
const fs = require('fs');
const path = require('path');
const catalogPath = path.join(__dirname, '..', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
catalog.updatedAt = new Date().toISOString();
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('Catálogo actualizado:', catalog.products.length, 'productos');
