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

function getWhatsAppDigits() {
  const raw = process.env.WHATSAPP_NUMBER || '';
  return raw.replace(/\D/g, '');
}

function buildPersonalizationMessage(data) {
  const tipo = TIPO_LABELS[data.tipo_grabado] || data.tipo_grabado;
  const lines = [
    'Hola equipo Ofelia Vallejo,',
    '',
    'Quiero personalizar la siguiente pieza:',
    '',
    `Pieza: ${data.producto}`,
    `Texto a grabar: «${data.texto_grabado}»`,
    `Tipo de grabado: ${tipo}`,
  ];

  if (data.font) {
    lines.push(`Tipografía: ${FONT_LABELS[data.font] || data.font}`);
  }
  if (data.size) {
    lines.push(`Tamaño: ${SIZE_LABELS[data.size] || data.size}`);
  }
  if (data.layout) {
    lines.push(`Diseño: ${LAYOUT_LABELS[data.layout] || data.layout}`);
  }
  if (data.mensaje && data.mensaje.trim()) {
    lines.push('', `Notas: ${data.mensaje.trim()}`);
  }

  lines.push(
    '',
    `Nombre: ${data.nombre}`,
    `Correo: ${data.email}`
  );

  if (data.ref) {
    lines.push(`Referencia: ${data.ref}`);
  }

  if (data.total_estimated) {
    lines.push(`Total estimado: CHF ${data.total_estimated}`);
  }

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
  buildWhatsAppUrl,
  getWhatsAppDigits,
};
