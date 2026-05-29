const {
  corsJson,
  verifyAdminPassword,
  createAdminToken,
} = require('../../lib/auth');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!verifyAdminPassword(password)) {
    return res.status(401).json({ ok: false, error: 'Contraseña incorrecta.' });
  }

  const token = createAdminToken();
  return res.status(200).json({
    ok: true,
    token,
    message: 'Sesión de administración iniciada.',
  });
};
