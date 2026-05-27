const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { getSql, hasPostgres } = require('./postgres');

const COUPON_CODE = process.env.LAUNCH_COUPON_CODE || 'OV-TEMPORADA';
const DISCOUNT_LABEL =
  process.env.LAUNCH_DISCOUNT_LABEL || '10% en tu primera pieza · lanzamiento de temporada';

const DATA_FILE = path.join(process.cwd(), 'data', 'newsletter.json');

async function readLocal() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { subscribers: [] };
  }
}

async function writeLocal(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function subscribeLocal(email) {
  const norm = email.trim().toLowerCase();
  const data = await readLocal();
  const existing = data.subscribers.find((s) => s.email === norm);
  if (existing) {
    return {
      ok: true,
      alreadySubscribed: true,
      couponCode: existing.coupon_code || COUPON_CODE,
      discountLabel: DISCOUNT_LABEL,
    };
  }
  const row = {
    id: 'nl_' + crypto.randomBytes(6).toString('hex'),
    email: norm,
    coupon_code: COUPON_CODE,
    source: 'launch_popup',
    subscribed_at: new Date().toISOString(),
  };
  data.subscribers.push(row);
  await writeLocal(data);
  return {
    ok: true,
    alreadySubscribed: false,
    couponCode: COUPON_CODE,
    discountLabel: DISCOUNT_LABEL,
  };
}

async function subscribePostgres(email) {
  const sql = getSql();
  const norm = email.trim().toLowerCase();
  const existing = await sql`
    SELECT email, coupon_code FROM newsletter_subscribers WHERE email = ${norm} LIMIT 1
  `;
  if (existing.length) {
    return {
      ok: true,
      alreadySubscribed: true,
      couponCode: existing[0].coupon_code || COUPON_CODE,
      discountLabel: DISCOUNT_LABEL,
    };
  }
  const id = 'nl_' + crypto.randomBytes(6).toString('hex');
  await sql`
    INSERT INTO newsletter_subscribers (id, email, coupon_code, source)
    VALUES (${id}, ${norm}, ${COUPON_CODE}, 'launch_popup')
  `;
  return {
    ok: true,
    alreadySubscribed: false,
    couponCode: COUPON_CODE,
    discountLabel: DISCOUNT_LABEL,
  };
}

async function subscribe(email) {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
    const err = new Error('Correo no válido.');
    err.code = 'INVALID_EMAIL';
    throw err;
  }
  if (hasPostgres()) {
    try {
      return await subscribePostgres(norm);
    } catch (e) {
      if (e.code === '23505') {
        return {
          ok: true,
          alreadySubscribed: true,
          couponCode: COUPON_CODE,
          discountLabel: DISCOUNT_LABEL,
        };
      }
      console.warn('[newsletter] postgres fallback:', e.message);
    }
  }
  return subscribeLocal(norm);
}

module.exports = {
  subscribe,
  COUPON_CODE,
  DISCOUNT_LABEL,
};
