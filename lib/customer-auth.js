const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
const SCRYPT_KEYLEN = 64;

function getCustomerSecret() {
  return (
    process.env.CUSTOMER_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'ov-customer-dev-secret'
  );
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt:${salt.toString('base64url')}:${hash.toString('base64url')}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const salt = Buffer.from(parts[1], 'base64url');
    const expected = Buffer.from(parts[2], 'base64url');
    const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    return crypto.timingSafeEqual(hash, expected);
  }
  // Compatibilidad hash local antiguo (ov_xxx)
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) - h) + password.charCodeAt(i);
    h |= 0;
  }
  return stored === 'ov_' + Math.abs(h).toString(36);
}

function createCustomerToken(user) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({
      role: 'customer',
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      exp,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getCustomerSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyCustomerToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', getCustomerSecret()).update(payload).digest('base64url');
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.role !== 'customer' || !data.sub || !data.exp) return null;
    if (Date.now() > data.exp) return null;
    return {
      id: data.sub,
      email: data.email,
      nombre: data.nombre,
    };
  } catch {
    return null;
  }
}

function getCustomerBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createCustomerToken,
  verifyCustomerToken,
  getCustomerBearer,
};
