// POST /api/newsletter — correo + cupón lanzamiento de temporada

const { corsJson } = require('../lib/auth');
const { subscribe } = require('../lib/newsletter');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'JSON inválido' });
    }
  }

  const email = body && body.email;

  try {
    const result = await subscribe(email);
    return res.status(200).json({
      ok: true,
      alreadySubscribed: result.alreadySubscribed,
      couponCode: result.couponCode,
      discountLabel: result.discountLabel,
      message: result.alreadySubscribed
        ? 'Este correo ya tiene su cupón de la casa.'
        : 'Cupón enviado. Guárdalo para tu primera pieza.',
    });
  } catch (e) {
    if (e.code === 'INVALID_EMAIL') {
      return res.status(400).json({ ok: false, error: e.message });
    }
    console.error('[newsletter]', e);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar el correo.' });
  }
};
