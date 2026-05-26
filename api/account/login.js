const { corsJson } = require('../../lib/auth');
const { hasCustomersDb, authenticateCustomer } = require('../../lib/customers');
const { createCustomerToken } = require('../../lib/customer-auth');

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
      error: 'Inicio de sesión en servidor no disponible.',
    });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      error: 'Correo y contraseña son obligatorios.',
    });
  }

  try {
    const user = await authenticateCustomer(email, password);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Correo o contraseña incorrectos.',
      });
    }
    const token = createCustomerToken(user);
    return res.status(200).json({
      ok: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email },
      message: 'Sesión iniciada.',
    });
  } catch (err) {
    console.error('[account/login]', err.message);
    return res.status(500).json({ ok: false, error: 'Error al iniciar sesión.' });
  }
};
