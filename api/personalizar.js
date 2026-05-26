// POST /api/personalizar
// Body: { nombre, email, producto, tipo_grabado, texto_grabado, mensaje, channel?, font?, size?, layout? }
// Returns: { ok, ref, message, whatsapp_url? }

const nodemailer = require('nodemailer');
const { corsJson } = require('../lib/auth');
const { hasCustomersDb, savePersonalizationRequest } = require('../lib/customers');
const { verifyCustomerToken, getCustomerBearer } = require('../lib/customer-auth');
const {
  buildPersonalizationMessage,
  buildWhatsAppUrl,
} = require('../lib/personalizar-message');

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

function generateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `OV-${ts}-${rand}`;
}

module.exports = async (req, res) => {
  corsJson(res);

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
    channel,
  } = req.body || {};

  const sendChannel = channel === 'whatsapp' ? 'whatsapp' : 'email';
  const isWhatsApp = sendChannel === 'whatsapp';

  if (!producto) {
    return res.status(400).json({
      ok: false,
      error: 'Indica la pieza que deseas personalizar.',
    });
  }

  if (isWhatsApp) {
    if (!nombre) {
      return res.status(400).json({ ok: false, error: 'Indica tu nombre.' });
    }
  } else if (!nombre || !email || !tipo_grabado || !texto_grabado) {
    return res.status(400).json({
      ok: false,
      error: 'Los campos nombre, email, producto, tipo_grabado y texto_grabado son requeridos.',
    });
  }

  const safeNombre = String(nombre || '').trim() || 'Consulta web';
  const safeEmail = String(email || '').trim() || 'no-indicado@ofeliavallejo.com';
  const safeTipo = tipo_grabado || 'texto';
  const safeTexto = String(texto_grabado || '').trim() || '—';

  if (!isWhatsApp && !EMAIL_RE.test(safeEmail)) {
    return res.status(400).json({ ok: false, error: 'El email no es válido.' });
  }

  const productosValidos = await getProductNames();
  if (!productosValidos.includes(producto)) {
    return res.status(400).json({ ok: false, error: 'Producto no reconocido.' });
  }

  if (!TIPOS_GRABADO.includes(safeTipo)) {
    return res.status(400).json({ ok: false, error: 'Tipo de grabado no válido.' });
  }

  if (safeTexto.length > 60) {
    return res.status(400).json({
      ok: false,
      error: 'El texto de grabado no puede superar 60 caracteres.',
    });
  }

  const ref = generateRef();
  const payload = {
    ref,
    nombre: safeNombre,
    email: safeEmail,
    producto,
    tipo_grabado: safeTipo,
    texto_grabado: safeTexto,
    mensaje: mensaje || '',
    font: font || '',
    size: size || '',
    layout: layout || '',
    base_price,
    engrave_price,
    total_estimated,
    channel: sendChannel,
  };

  const token = getCustomerBearer(req);
  const session = verifyCustomerToken(token);
  if (session) {
    payload.customerId = session.id;
  }

  if (hasCustomersDb()) {
    try {
      await savePersonalizationRequest(payload);
    } catch (err) {
      console.error('[personalizar] DB:', err.message);
    }
  }

  const waMessage = buildPersonalizationMessage(payload);
  const whatsapp_url = buildWhatsAppUrl(waMessage);

  if (sendChannel === 'whatsapp' && !whatsapp_url) {
    return res.status(503).json({
      ok: false,
      error: 'WhatsApp del atelier no configurado. Usa «Enviar solicitud» por correo.',
      code: 'NO_WHATSAPP',
    });
  }

  const smtpConfigured =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (sendChannel === 'email' && smtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
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
        text: waMessage,
      });
    } catch (err) {
      console.error('SMTP error:', err.message);
      return res.status(500).json({
        ok: false,
        error: 'No se pudo enviar la solicitud. Intenta más tarde.',
      });
    }
  } else if (sendChannel === 'email') {
    console.log('[personalizar] DEV MODE — SMTP no configurado:', { ref, nombre, email, producto });
  }

  const response = {
    ok: true,
    ref,
    channel: sendChannel,
    message:
      sendChannel === 'whatsapp'
        ? `Referencia ${ref}. Se abrirá WhatsApp con tu solicitud lista para enviar.`
        : `Solicitud recibida. Tu referencia es ${ref}. Te contactaremos en 24–48 h.`,
  };

  if (whatsapp_url) {
    response.whatsapp_url = whatsapp_url;
    response.whatsapp_message = waMessage;
  }

  return res.status(200).json(response);
};
