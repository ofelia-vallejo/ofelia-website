const { corsJson } = require('../../lib/auth');
const { hasCustomersDb, createCustomer } = require('../../lib/customers');
const { createCustomerToken } = require('../../lib/customer-auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!hasCustomersDb()) {
    return res.status(503).json({
      ok: false,
      code: 'NO_DATABASE',
      error: 'Registro en servidor no disponible. Configura DATABASE_URL.',
    });
  }

  const { nombre, email, password, phone } = req.body || {};

  if (!nombre || !email || !password) {
    return res.status(400).json({
      ok: false,
      error: 'Nombre, correo y contraseña son obligatorios.',
    });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'El correo no es válido.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      ok: false,
      error: 'La contraseña debe tener al menos 6 caracteres.',
    });
  }

  try {
    const user = await createCustomer({ nombre, email, password, phone });
    const token = createCustomerToken(user);
    return res.status(201).json({
      ok: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email },
      message: 'Cuenta creada. Bienvenida al atelier.',
    });
  } catch (err) {
    if (err.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ ok: false, error: err.message });
    }
    console.error('[account/register]', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo crear la cuenta.' });
  }
};
