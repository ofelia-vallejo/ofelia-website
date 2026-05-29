// POST /api/contact
// Body: { nombre, email, asunto, mensaje }
// Returns: { ok, message } | { ok: false, error }

const nodemailer = require('nodemailer');
const { subscribe } = require('../lib/newsletter');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECIPIENT = process.env.EMAIL_TO || 'atelierofelia.vallejo@gmail.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  cors(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'JSON inválido' });
    }
  }

  /* Popup lanzamiento · POST /api/contact con solo { email } (misma ruta, menos functions) */
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
      if (e.code === 'INVALID_EMAIL') {
        return res.status(400).json({ ok: false, error: e.message });
      }
      console.error('[newsletter]', e);
      return res.status(500).json({ ok: false, error: 'No se pudo registrar el correo.' });
    }
  }

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

  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (smtpConfigured) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: `"Ofelia Vallejo Web" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        replyTo: email,
        subject: `[Contacto OV] ${asunto || 'Nuevo mensaje'}`,
        text: [
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `Asunto: ${asunto || '—'}`,
          '',
          mensaje,
        ].join('\n'),
      });
    } catch (err) {
      console.error('SMTP error:', err.message);
      return res.status(500).json({
        ok: false,
        error: 'No se pudo enviar el mensaje. Intenta más tarde.',
      });
    }
  } else {
    // Dev mode — log and continue
    console.log('[contact] DEV MODE — SMTP no configurado:', { nombre, email, asunto });
  }

  return res.status(200).json({
    ok: true,
    message: 'Mensaje recibido. Te contactaremos en 24–48 h.',
  });
};
