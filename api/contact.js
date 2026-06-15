'use strict';

// POST /api/contact
// Body (contact form): { nombre, email, asunto, mensaje }
// Body (newsletter):   { email }          — same route, fewer serverless functions
// Returns: { ok, message } | { ok: false, error }

const { corsJson } = require('../lib/auth');
const { sendContact } = require('../lib/email');
const { subscribe } = require('../lib/newsletter');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ ok: false, error: 'JSON inválido' }); }
  }

  // Newsletter subscription path — only email provided, no mensaje
  if (body.email && !body.mensaje && !body.nombre) {
    try {
      const result = await subscribe(body.email);
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
      if (e.code === 'INVALID_EMAIL') return res.status(400).json({ ok: false, error: e.message });
      console.error('[newsletter]', e);
      return res.status(500).json({ ok: false, error: 'No se pudo registrar el correo.' });
    }
  }

  // Contact form path
  const { nombre, email, asunto, mensaje } = body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({
      ok: false,
      error: 'Los campos nombre, email y mensaje son requeridos.',
    });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'El email no es válido.' });
  }
  if (mensaje.length > 2000) {
    return res.status(400).json({ ok: false, error: 'El mensaje excede 2000 caracteres.' });
  }

  try {
    await sendContact({ nombre, email, asunto, mensaje });
  } catch (err) {
    console.error('[contact] SMTP:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje. Intenta más tarde.' });
  }

  return res.status(200).json({ ok: true, message: 'Mensaje recibido. Te contactaremos en 24–48 h.' });
};
