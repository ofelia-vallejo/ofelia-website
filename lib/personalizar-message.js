const TIPO_LABELS = {
  iniciales: 'Iniciales',
  nombre: 'Nombre completo',
  fecha: 'Fecha',
  texto: 'Texto libre',
};

const FONT_LABELS = {
  romana: 'Romana',
  clasica: 'Clásica',
  firma: 'Firma de la casa',
};

const LAYOUT_LABELS = {
  texto: 'Solo texto',
  'monograma-ov': 'Monograma OV',
  'texto-monograma': 'Texto + monograma OV',
};

const SIZE_LABELS = {
  S: 'Iniciales (S)',
  M: 'Nombre (M)',
  L: 'Frase breve (L)',
};

const WA_FALLBACK = '573005526208';

function getWhatsAppDigits() {
  const raw = process.env.WHATSAPP_NUMBER || WA_FALLBACK;
  return raw.replace(/\D/g, '');
}

function buildOrderMessage(data) {
  const lines = [
    'Hola equipo Ofelia Vallejo,',
    '',
    'Quiero consultar sobre la siguiente pieza:',
    '',
    `Pieza: ${data.producto}`,
  ];

  if (data.color) lines.push(`Color: ${data.color}`);
  if (data.total_estimated) lines.push(`Precio: CHF ${data.total_estimated}`);

  const texto = String(data.texto_grabado || '').trim();
  if (texto && texto !== 'Sin grabado' && texto !== '—') {
    lines.push('', `Grabado: «${texto}»`);
  }

  const notas = String(data.mensaje || '').trim();
  if (notas) lines.push('', `Notas: ${notas}`);

  if (data.nombre && data.nombre !== 'Consulta web') {
    lines.push('', `Nombre: ${data.nombre}`);
  }

  lines.push('', 'Gracias.');
  return lines.join('\n');
}

function buildPersonalizationMessage(data) {
  const tipo = TIPO_LABELS[data.tipo_grabado] || data.tipo_grabado;
  const lines = [
    'Hola equipo Ofelia Vallejo,',
    '',
    'Solicitud de personalización:',
    '',
    `Pieza: ${data.producto}`,
    `Grabado: «${data.texto_grabado}»`,
    `Tipo: ${tipo}`,
  ];

  if (data.font) lines.push(`Tipografía: ${FONT_LABELS[data.font] || data.font}`);
  if (data.size) lines.push(`Tamaño: ${SIZE_LABELS[data.size] || data.size}`);
  if (data.layout) lines.push(`Diseño: ${LAYOUT_LABELS[data.layout] || data.layout}`);

  const hasPrice = data.base_price || data.total_estimated;
  if (hasPrice) {
    lines.push('');
    if (data.base_price) lines.push(`Precio base: CHF ${data.base_price}`);
    if (data.engrave_price && data.engrave_price !== '0') {
      lines.push(`Grabado: +CHF ${data.engrave_price}`);
    }
    if (data.total_estimated) lines.push(`Total estimado: CHF ${data.total_estimated}`);
  }

  lines.push('', `Nombre: ${data.nombre}`, `Correo: ${data.email}`);

  if (data.mensaje && data.mensaje.trim()) {
    lines.push(`Notas: ${data.mensaje.trim()}`);
  }

  if (data.ref) lines.push('', `Referencia: ${data.ref}`);

  lines.push('', 'Gracias.');
  return lines.join('\n');
}

function buildWhatsAppUrl(message) {
  const digits = getWhatsAppDigits();
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

module.exports = {
  TIPO_LABELS,
  FONT_LABELS,
  buildPersonalizationMessage,
  buildOrderMessage,
  buildWhatsAppUrl,
  getWhatsAppDigits,
};
