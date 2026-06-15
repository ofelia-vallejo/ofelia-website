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
  if (!config.adminPassword) return password === 'ofelia-admin';
  return password === config.adminPassword;
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
