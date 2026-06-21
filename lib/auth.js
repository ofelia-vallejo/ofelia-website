'use strict';

// Admin authentication: JWT creation/verification + password check.
// SRP: this module owns admin identity. CORS lives in lib/middleware.js.

const crypto = require('crypto');
const config = require('./config');
const { corsJson } = require('./middleware');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function createAdminToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', config.adminSecret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', config.adminSecret).update(payload).digest('base64url');
  if (sig !== expected) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.role !== 'admin') return false;
    if (!data.exp || Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

function verifyAdminPassword(password) {
  if (!config.adminPassword) {
    // No password configured: only allow the dev fallback outside production.
    if (config.isProduction) return false;
    return timingSafeEqualStr(password, 'ofelia-admin');
  }
  return timingSafeEqualStr(password, config.adminPassword);
}

// Constant-time string comparison — avoids leaking length/prefix via timing.
function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) {
    // Still run a comparison to keep timing uniform, then fail.
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

function getBearerToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

function requireAdmin(req, res) {
  const token = getBearerToken(req);
  if (!verifyAdminToken(token)) {
    res.status(401).json({ ok: false, error: 'No autorizado.' });
    return false;
  }
  return true;
}

module.exports = {
  createAdminToken,
  verifyAdminToken,
  verifyAdminPassword,
  requireAdmin,
  getBearerToken,
  // Re-exported so existing callers don't break
  corsJson,
};
