const { getSql, hasPostgres } = require('./postgres');
const { hashPassword, verifyPassword } = require('./customer-auth');

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function findCustomerByEmail(email) {
  const db = getSql();
  if (!db) return null;
  const norm = email.trim().toLowerCase();
  const rows = await db`
    SELECT id, nombre, email, password_hash, phone, created_at
    FROM customers WHERE email = ${norm} LIMIT 1
  `;
  return rows[0] || null;
}

async function createCustomer({ nombre, email, password, phone }) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  const norm = email.trim().toLowerCase();
  const existing = await findCustomerByEmail(norm);
  if (existing) {
    const err = new Error('Este correo ya está registrado.');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const id = newId('cus');
  await db`
    INSERT INTO customers (id, nombre, email, password_hash, phone)
    VALUES (
      ${id},
      ${nombre.trim()},
      ${norm},
      ${hashPassword(password)},
      ${(phone || '').trim()}
    )
  `;

  return { id, nombre: nombre.trim(), email: norm, phone: (phone || '').trim() };
}

async function authenticateCustomer(email, password) {
  const row = await findCustomerByEmail(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    phone: row.phone || '',
  };
}

async function getCustomerById(id) {
  const db = getSql();
  if (!db) return null;
  const rows = await db`
    SELECT id, nombre, email, phone, created_at
    FROM customers WHERE id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

async function savePersonalizationRequest(payload) {
  const db = getSql();
  if (!db) throw new Error('DATABASE_URL no configurada');

  const id = newId('pr');
  await db`
    INSERT INTO personalization_requests (
      id, ref, customer_id, nombre, email, producto, tipo_grabado, texto_grabado,
      mensaje, font, size, layout, base_price_chf, engrave_price_chf,
      total_estimated_chf, channel, status
    ) VALUES (
      ${id},
      ${payload.ref},
      ${payload.customerId || null},
      ${payload.nombre},
      ${payload.email.trim().toLowerCase()},
      ${payload.producto},
      ${payload.tipo_grabado},
      ${payload.texto_grabado},
      ${payload.mensaje || ''},
      ${payload.font || ''},
      ${payload.size || ''},
      ${payload.layout || ''},
      ${payload.base_price != null ? Number(payload.base_price) : null},
      ${payload.engrave_price != null ? Number(payload.engrave_price) : null},
      ${payload.total_estimated != null ? Number(payload.total_estimated) : null},
      ${payload.channel || 'email'},
      'pending'
    )
  `;

  return { id, ref: payload.ref };
}

module.exports = {
  hasCustomersDb: hasPostgres,
  findCustomerByEmail,
  createCustomer,
  authenticateCustomer,
  getCustomerById,
  savePersonalizationRequest,
};
