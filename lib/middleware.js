'use strict';

// Centralizes CORS, OPTIONS preflight, and request handler boilerplate.
// SRP: this module owns HTTP cross-cutting concerns, not auth logic.
// CORS lives ONLY here — vercel.json must not also set Access-Control-* headers,
// or browsers receive duplicate values and reject the response.

const config = require('./config');

const STATIC_CORS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

// In production, lock the API to the site origin (admin/account use bearer tokens,
// so an open `*` would let any site call them with a stolen token). In dev, allow all.
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', config.isProduction ? config.siteUrl : '*');
  res.setHeader('Vary', 'Origin');
  Object.entries(STATIC_CORS).forEach(([k, v]) => res.setHeader(k, v));
}

// corsJson is kept for backwards compatibility — new code should use setCors or withHandler
function corsJson(res) {
  setCors(res);
}

// Higher-order function: wraps a handler with CORS + OPTIONS + error boundary.
// Usage: module.exports = withHandler(async (req, res) => { ... });
function withHandler(fn) {
  return async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    try {
      await fn(req, res);
    } catch (err) {
      const status = err.statusCode || err.status || 500;
      const message = err.expose ? err.message : 'Error del servidor.';
      console.error(`[handler] ${req.url}`, err);
      if (!res.headersSent) {
        res.status(status).json({ ok: false, error: message });
      }
    }
  };
}

// Creates an error with a specific HTTP status code that will be surfaced to clients.
function httpError(status, message) {
  const err = new Error(message);
  err.statusCode = status;
  err.expose = true;
  return err;
}

module.exports = { setCors, corsJson, withHandler, httpError };
