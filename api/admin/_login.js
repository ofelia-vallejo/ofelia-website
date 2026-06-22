const {
  corsJson,
  verifyAdminPassword,
  createAdminToken,
} = require('../../lib/auth');
const config = require('../../lib/config');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (config.isProduction && !config.adminPassword) {
    return res.status(503).json({ ok: false, error: 'Acceso no disponible en este momento.' });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ ok: false, error: 'Introduce la contraseña.' });
  }

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
