const { corsJson } = require('../../lib/auth');
const { hasCustomersDb, getCustomerById } = require('../../lib/customers');
const { verifyCustomerToken, getCustomerBearer } = require('../../lib/customer-auth');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!hasCustomersDb()) {
    return res.status(503).json({ ok: false, code: 'NO_DATABASE' });
  }

  const token = getCustomerBearer(req);
  const session = verifyCustomerToken(token);
  if (!session) {
    return res.status(401).json({ ok: false, error: 'Sesión no válida.' });
  }

  try {
    const user = await getCustomerById(session.id);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Cuenta no encontrada.' });
    }
    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        phone: user.phone || '',
      },
    });
  } catch (err) {
    console.error('[account/me]', err.message);
    return res.status(500).json({ ok: false, error: 'Error al validar sesión.' });
  }
};
