/* WhatsApp atelier · solicitudes sin cuenta */

(function () {
  const TIPO_LABELS = {
    iniciales: 'Iniciales',
    nombre: 'Nombre completo',
    fecha: 'Fecha',
    texto: 'Texto libre',
  };

  const FONT_LABELS = { romana: 'Romana', clasica: 'Clásica', firma: 'Firma' };
  const LAYOUT_LABELS = {
    texto: 'Solo texto',
    'monograma-ov': 'Monograma OV',
    'texto-monograma': 'Texto + OV',
  };
  const SIZE_LABELS = { S: 'Iniciales (S)', M: 'Nombre (M)', L: 'Frase breve (L)' };

  function buildLocalMessage(data) {
    const tipo = TIPO_LABELS[data.tipo_grabado] || data.tipo_grabado || '—';
    const lines = [
      'Hola equipo Ofelia Vallejo,',
      '',
      'Quiero personalizar la siguiente pieza:',
      '',
      'Pieza: ' + (data.producto || '—'),
      'Texto a grabar: «' + (data.texto_grabado || '—') + '»',
      'Tipo de grabado: ' + tipo,
    ];

    if (data.font) lines.push('Tipografía: ' + (FONT_LABELS[data.font] || data.font));
    if (data.size) lines.push('Tamaño: ' + (SIZE_LABELS[data.size] || data.size));
    if (data.layout) lines.push('Diseño: ' + (LAYOUT_LABELS[data.layout] || data.layout));
    if (data.mensaje && data.mensaje.trim()) lines.push('', 'Notas: ' + data.mensaje.trim());

    lines.push('', 'Nombre: ' + (data.nombre || '—'), 'Correo: ' + (data.email || '—'));

    if (data.ref) lines.push('Referencia: ' + data.ref);
    if (data.total_estimated) lines.push('Total estimado: CHF ' + data.total_estimated);

    lines.push('', 'Gracias.');
    return lines.join('\n');
  }

  async function open(data) {
    const payload = Object.assign({ channel: 'whatsapp' }, data);

    try {
      const res = await fetch('/api/personalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.ok && json.whatsapp_url) {
        window.open(json.whatsapp_url, '_blank', 'noopener,noreferrer');
        return { ok: true, message: json.message, ref: json.ref };
      }

      return {
        ok: false,
        error: json.error || 'WhatsApp no configurado. Escríbenos desde Contacto.',
      };
    } catch {
      return { ok: false, error: 'Error de conexión. Intenta de nuevo.' };
    }
  }

  window.OVWhatsApp = {
    open: open,
    buildLocalMessage: buildLocalMessage,
  };
})();
