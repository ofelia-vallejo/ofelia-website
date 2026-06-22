#!/usr/bin/env node
'use strict';

/**
 * Servidor de desarrollo local SIN Vercel CLI.
 * Monta los handlers de `api/*.js` (estilo Vercel Serverless: module.exports = (req,res))
 * y sirve los archivos estáticos del sitio, cargando variables desde `.env`.
 *
 * Uso:  node scripts/dev-server.js        (puerto 3000 por defecto, o $PORT)
 *
 * No reemplaza `vercel dev` para producción; es una utilidad de validación local
 * (conexión a Postgres, catálogo, carrito/checkout) que no requiere login de Vercel.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'api');
const PORT = Number(process.env.PORT) || 3000;

// ── Cargar .env (parser tolerante a espacios y a '=' en el valor) ────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadEnv();

// ── Rewrites de vercel.json (para que PDP/cleanUrls resuelvan igual que en prod) ──
function loadRewrites() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    return (cfg.rewrites || []).map((r) => {
      // :param* → (.*) ; :param → ([^/]+)
      const pattern = r.source
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/:(\w+)\*/g, '(.*)')
        .replace(/:(\w+)/g, '([^/]+)');
      return { regex: new RegExp('^' + pattern + '$'), destination: r.destination };
    });
  } catch {
    return [];
  }
}
const REWRITES = loadRewrites();

// Aplica el primer rewrite que coincida (orden = prioridad, como en Vercel).
function applyRewrites(pathname) {
  for (const rw of REWRITES) {
    const m = pathname.match(rw.regex);
    if (!m) continue;
    let dest = rw.destination;
    m.slice(1).forEach((cap) => {
      dest = dest.replace(/:[\w]+\*?/, cap == null ? '' : cap);
    });
    return dest;
  }
  return pathname;
}

// ── Resolución de handler de API (soporta rutas dinámicas [param].js) ────────
function resolveApiHandler(pathname) {
  const rel = pathname.replace(/^\/api\//, '').replace(/\/+$/, '');
  const segments = rel.split('/').filter(Boolean);
  if (!segments.length) return null;

  const exact = path.join(API_DIR, ...segments) + '.js';
  if (fs.existsSync(exact)) return { file: exact, params: {} };

  // Ruta dinámica: el directorio padre puede tener un archivo [param].js
  const dir = path.join(API_DIR, ...segments.slice(0, -1));
  if (fs.existsSync(dir)) {
    const dyn = fs.readdirSync(dir).find((f) => /^\[.+\]\.js$/.test(f));
    if (dyn) {
      const param = dyn.slice(1, dyn.indexOf(']'));
      return { file: path.join(dir, dyn), params: { [param]: segments[segments.length - 1] } };
    }
  }
  return null;
}

// ── Augmentar res al estilo Vercel (status().json()) ─────────────────────────
function augmentRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

// ── Lectura del body (JSON) ──────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => {
      if (!data) return resolve({});
      const ct = req.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        try { return resolve(JSON.parse(data)); } catch { return resolve({}); }
      }
      resolve(data);
    });
  });
}

// ── Estáticos ─────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};

// Devuelve el archivo a servir para una ruta, o null si no existe.
// cleanUrls: /home → home.html · directorio → index.html
function resolveStaticFile(pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  let filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) filePath += '.html';
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const idx = path.join(filePath, 'index.html');
    if (fs.existsSync(idx)) filePath = idx;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return null;
  return filePath;
}

function serveStatic(pathname, res) {
  // Filesystem primero; si no existe, aplicar rewrites de vercel.json.
  let filePath = resolveStaticFile(pathname);
  if (!filePath) {
    const rewritten = applyRewrites(pathname);
    if (rewritten !== pathname) filePath = resolveStaticFile(rewritten);
  }
  if (!filePath) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('404 Not Found: ' + decodeURIComponent(pathname));
  }
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

// ── Servidor ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  augmentRes(res);
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;

  if (pathname.startsWith('/api/')) {
    const resolved = resolveApiHandler(pathname);
    if (!resolved) {
      return res.status(404).json({ ok: false, error: 'API no encontrada: ' + pathname });
    }
    req.query = Object.assign({}, Object.fromEntries(parsed.searchParams), resolved.params);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      req.body = await readBody(req);
    }
    try {
      const handler = require(resolved.file);
      return await handler(req, res);
    } catch (err) {
      console.error('[dev-server] handler error', pathname, err);
      if (!res.headersSent) res.status(500).json({ ok: false, error: 'Error interno: ' + err.message });
    }
    return;
  }

  serveStatic(pathname, res);
});

server.listen(PORT, () => {
  console.log(`[dev-server] http://localhost:${PORT}  ·  STORE_MODE=${process.env.STORE_MODE || '(default)'}  ·  DB=${process.env.DATABASE_URL ? 'on' : 'off'}  ·  Stripe=${process.env.STRIPE_SECRET_KEY ? 'on' : 'off'}`);
});
