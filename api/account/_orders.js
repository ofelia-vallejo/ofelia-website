const { corsJson } = require('../../lib/auth');
const { hasPostgres, getOrdersByCustomer } = require('../../lib/postgres');
const { verifyCustomerToken, getCustomerBearer } = require('../../lib/customer-auth');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!hasPostgres()) {
    return res.status(503).json({ ok: false, code: 'NO_DATABASE', orders: [] });
  }

  const session = verifyCustomerToken(getCustomerBearer(req));
  if (!session) {
    return res.status(401).json({ ok: false, error: 'Sesión no válida.' });
  }

  try {
    const rows = await getOrdersByCustomer(session.id);
    const orders = rows.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total_chf,
      currency: o.currency,
      items: Array.isArray(o.line_items) ? o.line_items : [],
      createdAt: o.created_at,
    }));
    return res.status(200).json({ ok: true, orders });
  } catch (err) {
    console.error('[account/orders]', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo cargar el historial.' });
  }
};
