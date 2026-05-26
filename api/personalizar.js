// POST /api/personalizar
// Body: { nombre, email, producto, tipo_grabado, texto_grabado, mensaje }
// Returns: { ok, ref, message } | { ok: false, error }

const nodemailer = require('nodemailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECIPIENT = process.env.EMAIL_TO || 'atelierofelia.vallejo@gmail.com';

const PRODUCTOS_FALLBACK = [
  'Travel Bag I',
  'Travel Bag II',
  'Travel Bag III',
  'Bandolera Moderna',
  'Bandolera Elite',
  'Morral Elite',
  'Morral Clásico',
  'Bolso Dama',
  'Cinturón',
];

async function getProductNames() {
  try {
    const { loadCatalog } = require('../lib/store');
    const catalog = await loadCatalog();
    const names = catalog.products.filter((p) => p.active).map((p) => p.name);
    if (names.length) return names;
  } catch {
    /* fallback */
  }
  return PRODUCTOS_FALLBACK;
}

const TIPOS_GRABADO = ['iniciales', 'nombre', 'fecha', 'texto'];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function generateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `OV-${ts}-${rand}`;
}

module.exports = async (req, res) => {
  cors(res);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const {
    nombre,
    email,
    producto,
    tipo_grabado,
    texto_grabado,
    mensaje,
    font,
    size,
    layout,
    base_price,
    engrave_price,
    total_estimated,
  } = req.body || {};

  if (!nombre || !email || !producto || !tipo_grabado || !texto_grabado) {
    return res.status(400).json({
      ok: false,
      error: 'Los campos nombre, email, producto, tipo_grabado y texto_grabado son requeridos.',
    });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'El email no es válido.' });
  }

  const productosValidos = await getProductNames();
  if (!productosValidos.includes(producto)) {
    return res.status(400).json({ ok: false, error: 'Producto no reconocido.' });
  }

  if (!TIPOS_GRABADO.includes(tipo_grabado)) {
    return res.status(400).json({ ok: false, error: 'Tipo de grabado no válido.' });
  }

  if (texto_grabado.length > 60) {
    return res.status(400).json({
      ok: false,
      error: 'El texto de grabado no puede superar 60 caracteres.',
    });
  }

  const ref = generateRef();

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
        subject: `[Personalización OV] ${ref} — ${producto}`,
        text: [
          `Referencia: ${ref}`,
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `Producto: ${producto}`,
          `Tipo de grabado: ${tipo_grabado}`,
          `Texto: ${texto_grabado}`,
          `Notas: ${mensaje || '—'}`,
          font ? `Fuente estudio: ${font}` : '',
          size ? `Tamaño estudio: ${size}` : '',
          layout ? `Diseño estudio: ${layout}` : '',
          base_price != null ? `Precio pieza (CHF): ${base_price}` : '',
          engrave_price != null ? `Grabado adicional (CHF): ${engrave_price}` : '',
          total_estimated != null ? `Total estimado (CHF): ${total_estimated}` : '',
        ].filter(Boolean).join('\n'),
      });
    } catch (err) {
      console.error('SMTP error:', err.message);
      return res.status(500).json({
        ok: false,
        error: 'No se pudo enviar la solicitud. Intenta más tarde.',
      });
    }
  } else {
    console.log('[personalizar] DEV MODE — SMTP no configurado:', {
      ref,
      nombre,
      email,
      producto,
      tipo_grabado,
      texto_grabado,
    });
  }

  return res.status(200).json({
    ok: true,
    ref,
    message: `Solicitud recibida. Tu referencia es ${ref}. Te contactaremos en 24–48 h.`,
  });
};
