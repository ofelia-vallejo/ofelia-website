'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();

const pages = [
  'index.html',
  'home.html',
  'coleccion.html',
  'producto/index.html',
  'producto/travel-bag.html',
  'personalizar.html',
  'checkout.html',
  'gracias.html',
  'cuenta.html',
  'contacto.html',
  'manifiesto.html',
  'cuero.html',
  'privacidad.html',
  'terminos.html',
];

const requiredAssets = [
  'assets/img/logo_firma_nav.png',
  'assets/img/logo_firma_completa.png',
  'assets/video/firma-mandamiento-hero.mov',
  'assets/video/oficio-legendario-home.webp',
  'assets/video/oficio-legendario-poster.jpg',
  'assets/css/brand.css',
  'assets/css/mobile.css',
  'assets/js/brand.js',
  'assets/js/cart.js',
  'assets/js/cart-ui.js',
];

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function listInternalHtmlLinks(html, file) {
  const matches = [...html.matchAll(/\b(?:href|src)=["']([^"']+\.html(?:#[^"']*)?(?:\?[^"']*)?)["']/g)];
  return matches.map((m) => `${file}: ${m[1]}`);
}

function checkRequiredFiles() {
  for (const page of pages) {
    assert(exists(page), `Falta página crítica: ${page}`);
  }
  for (const asset of requiredAssets) {
    assert(exists(asset), `Falta asset crítico: ${asset}`);
  }
}

function checkCleanUrls() {
  const offenders = [];
  for (const page of pages) {
    offenders.push(...listInternalHtmlLinks(read(page), page));
  }
  assert(!offenders.length, `Hay links internos con .html:\n${offenders.join('\n')}`);
}

function checkHomeContract() {
  const html = read('home.html');
  const firstSection = html.match(/<section\s+[^>]*>/);

  assert(firstSection, 'home.html no tiene secciones.');
  assert(
    firstSection[0].includes('class="gender shop-gate"'),
    `La primera sección de home debe ser Mujer/Hombre. Encontrado: ${firstSection[0]}`
  );
  assert(!html.includes('campaign-hero'), 'No debe reaparecer .campaign-hero en home.html.');
  assert(html.includes('id="historia"'), 'Falta sección #historia en home.html.');
  assert(
    html.includes('/assets/video/firma-mandamiento-hero.mov'),
    'La sección firma no tiene conectado el video CapCut.'
  );
  assert(
    html.includes('/assets/video/oficio-legendario-home.webp'),
    'La sección firma no tiene fallback WebP.'
  );
  assert(
    !/rel=["']preload["'][^>]+firma-mandamiento-hero\.mov/.test(html),
    'El video .mov de firma no debe cargarse con preload.'
  );
}

function checkBrandCopyGuardrails() {
  const forbidden = [
    'premium',
    'exclusivo',
    'vive la experiencia',
    'disfruta',
    'ritual',
    'sanación',
    'energia',
    'energía',
    'vibra',
  ];
  const publicPages = pages.filter((page) => !page.startsWith('admin/'));
  const offenders = [];

  for (const page of publicPages) {
    const html = read(page).toLowerCase();
    for (const word of forbidden) {
      if (html.includes(word)) offenders.push(`${page}: ${word}`);
    }
  }

  assert(!offenders.length, `Copy prohibido encontrado:\n${offenders.join('\n')}`);
}

function checkStructuredData() {
  for (const page of ['home.html']) {
    const html = read(page);
    const blocks = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/g)];
    for (const block of blocks) {
      JSON.parse(block[1]);
    }
  }
}

function main() {
  checkRequiredFiles();
  checkCleanUrls();
  checkHomeContract();
  checkBrandCopyGuardrails();
  checkStructuredData();
  console.log('Frontend smoke checks passed.');
}

main();
