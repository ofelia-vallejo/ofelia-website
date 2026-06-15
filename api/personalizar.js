'use strict';

// POST /api/personalizar
// Body: { nombre, email, producto, tipo_grabado, texto_grabado, mensaje?, channel?, font?, size?, layout? }
// Returns: { ok, ref, message, whatsapp_url? }

const { corsJson } = require('../lib/auth');
const { sendPersonalizacion } = require('../lib/email');
const { hasCustomersDb, savePersonalizationRequest } = require('../lib/customers');
const { verifyCustomerToken, getCustomerBearer } = require('../lib/customer-auth');
const {
  buildPersonalizationMessage,
  buildOrderMessage,
  buildWhatsAppUrl,
} = require('../lib/personalizar-message');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PRODUCTOS_FALLBACK = [
  'Travel Bag I', 'Travel Bag II', 'Travel Bag III',
  'Bandolera Moderna', 'Bandolera Elite',
  'Morral Elite', 'Morral Clásico',
  'Bolso Dama', 'Cinturón',
];

const TIPOS_GRABADO = ['iniciales', 'nombre', 'fecha', 'texto'];

async function getProductNames() {
  try {
    const { loadCatalog } = require('../lib/store');
    const catalog = await loadCatalog();
    const names = catalog.products.filter((p) => p.active).map((p) => p.name);
    if (names.length) return names;
  } catch { /* fallback */ }
  return PRODUCTOS_FALLBACK;
}

function generateRef() {
  return `OV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const {
    nombre, email, producto, tipo_grabado, texto_grabado, mensaje,
    font, size, layout, base_price, engrave_price, total_estimated,
    channel, type, color,
  } = req.body || {};

  const sendChannel = channel === 'whatsapp' ? 'whatsapp' : 'email';
  const isWhatsApp = sendChannel === 'whatsapp';
  const isPedido = type === 'pedido';

  if (!producto) {
    return res.status(400).json({ ok: false, error: 'Indica la pieza que deseas personalizar.' });
  }

  if (isWhatsApp || isPedido) {
    if (!isPedido && !nombre) {
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
    return res.status(400).json({ ok: false, error: 'El texto de grabado no puede superar 60 caracteres.' });
  }

  const ref = generateRef();
  const payload = {
    ref, nombre: safeNombre, email: safeEmail, producto,
    tipo_grabado: safeTipo, texto_grabado: safeTexto, mensaje: mensaje || '',
    font: font || '', size: size || '', layout: layout || '',
    base_price, engrave_price, total_estimated,
    color: color || '', channel: sendChannel,
    type: isPedido ? 'pedido' : 'personalizacion',
  };

  const token = getCustomerBearer(req);
  const session = verifyCustomerToken(token);
  if (session) payload.customerId = session.id;

  if (hasCustomersDb()) {
    try { await savePersonalizationRequest(payload); }
    catch (err) { console.error('[personalizar] DB:', err.message); }
  }

  const waMessage = isPedido ? buildOrderMessage(payload) : buildPersonalizationMessage(payload);
  const whatsapp_url = buildWhatsAppUrl(waMessage);

  if (sendChannel === 'whatsapp' && !whatsapp_url) {
    return res.status(503).json({
      ok: false,
      error: 'WhatsApp del atelier no configurado. Usa «Enviar solicitud» por correo.',
      code: 'NO_WHATSAPP',
    });
  }

  if (sendChannel === 'email') {
    try {
      await sendPersonalizacion({
        ref,
        subject: `[Personalización OV] ${ref} — ${producto}`,
        body: waMessage,
        replyTo: email,
      });
    } catch (err) {
      console.error('[personalizar] SMTP:', err.message);
      return res.status(500).json({ ok: false, error: 'No se pudo enviar la solicitud. Intenta más tarde.' });
    }
  }

  const response = {
    ok: true, ref, channel: sendChannel,
    message: sendChannel === 'whatsapp'
      ? `Referencia ${ref}. Se abrirá WhatsApp con tu solicitud lista para enviar.`
      : `Solicitud recibida. Tu referencia es ${ref}. Te contactaremos en 24–48 h.`,
  };

  if (whatsapp_url) {
    response.whatsapp_url = whatsapp_url;
    response.whatsapp_message = waMessage;
  }

  return res.status(200).json(response);
};
