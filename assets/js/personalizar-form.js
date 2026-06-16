/* Solicitud bespoke — WhatsApp (sin cuentas por ahora) */

(function () {
  const form = document.getElementById('form-personalizar');
  if (!form || !window.OVWhatsApp) return;

  const btnWhatsApp = document.getElementById('btnWhatsApp');
  const noticeOk = document.getElementById('notice-success');
  const noticeErr = document.getElementById('notice-error');
  const textoInput = document.getElementById('texto_grabado');
  const charCount = document.getElementById('char-count');

  const previewEl = document.getElementById('engrave-preview');
  const previewText = document.getElementById('engrave-preview-text');

  function syncPreview() {
    if (!textoInput || !charCount) return;
    const val = textoInput.value.trim();
    charCount.textContent = textoInput.value.length;
    if (!previewEl || !previewText) return;
    if (val) {
      previewText.textContent = val.slice(0, 24);
      previewEl.classList.add('is-filled');
    } else {
      previewText.textContent = 'ABC';
      previewEl.classList.remove('is-filled');
    }
  }

  function studioFields() {
    if (window.OVEngraveStudio && typeof window.OVEngraveStudio.getState === 'function') {
      const s = window.OVEngraveStudio.getState();
      return {
        font: s.font || '',
        size: s.size || '',
        layout: s.layout || '',
      };
    }
    return { font: '', size: '', layout: '' };
  }

  function collectFormData() {
    const data = {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      producto: form.producto.value,
      tipo_grabado: form.tipo_grabado.value,
      texto_grabado: form.texto_grabado.value.trim(),
      mensaje: form.mensaje.value.trim(),
      ...studioFields(),
    };

    const studioTotal = document.getElementById('studioTotalPrice');
    const studioEngrave = document.getElementById('studioEngravePrice');
    const studioBase = document.getElementById('studioBasePrice');
    if (studioTotal && studioTotal.textContent.includes('CHF')) {
      data.total_estimated = studioTotal.textContent.replace(/[^\d]/g, '');
      data.base_price = studioBase ? studioBase.textContent.replace(/[^\d]/g, '') : '';
      data.engrave_price =
        studioEngrave && studioEngrave.textContent.includes('+')
          ? studioEngrave.textContent.replace(/[^\d]/g, '')
          : '0';
    }

    return data;
  }

  function validate(data) {
    if (!data.nombre || !data.producto || !data.tipo_grabado) {
      return 'Por favor completa nombre, pieza y tipo de grabado.';
    }
    if (!data.texto_grabado) {
      return 'Indica el texto que deseas grabar.';
    }
    return null;
  }

  function showNotice(el, msg) {
    noticeOk.classList.remove('is-visible');
    noticeErr.classList.remove('is-visible');
    el.textContent = msg;
    el.classList.add('is-visible');
  }

  function setBusy(busy, labelWa) {
    if (btnWhatsApp) {
      btnWhatsApp.disabled = busy;
      if (labelWa) btnWhatsApp.textContent = labelWa;
    }
  }

  async function sendWhatsApp() {
    const data = collectFormData();
    const err = validate(data);
    if (err) {
      showNotice(noticeErr, err);
      return;
    }

    setBusy(true, 'Abriendo WhatsApp…');

    const res = await window.OVWhatsApp.open(data);

    if (!res.ok) {
      showNotice(noticeErr, res.error);
    } else {
      showNotice(
        noticeOk,
        res.message || 'WhatsApp abierto con tu solicitud. Envía el mensaje al equipo.'
      );
    }

    setBusy(false, 'Enviar solicitud por WhatsApp');
  }

  const params = new URLSearchParams(location.search);
  const productoParam = params.get('producto');
  if (productoParam) {
    const opt = form.querySelector(`option[value="${productoParam}"]`);
    if (opt) {
      opt.selected = true;
    } else if (window.OVCatalog) {
      window.OVCatalog.fetchProduct(productoParam).then(function (p) {
        if (!p) return;
        const byName = form.querySelector(`option[value="${p.name}"]`);
        if (byName) byName.selected = true;
      }).catch(function () {});
    }
  }
  const textoParam = params.get('texto_grabado');
  if (textoParam) {
    textoInput.value = textoParam.slice(0, 60);
    syncPreview();
  }
  const tipoParam = params.get('tipo_grabado');
  if (tipoParam && form.tipo_grabado.querySelector(`option[value="${tipoParam}"]`)) {
    form.tipo_grabado.value = tipoParam;
  }
  const colorParam = params.get('color');
  const mensajeField = document.getElementById('mensaje');
  if (colorParam && mensajeField) {
    const colorNote = 'Color seleccionado en PDP: ' + colorParam;
    if (!mensajeField.value.includes(colorNote)) {
      mensajeField.value = mensajeField.value
        ? mensajeField.value.trim() + '\n' + colorNote
        : colorNote;
    }
  }

  if (textoInput) {
    textoInput.addEventListener('input', syncPreview);
  }
  form.tipo_grabado.addEventListener('change', () => {
    if (form.tipo_grabado.value === 'iniciales' && !textoInput.value && previewText) {
      previewText.textContent = 'OV';
    }
    syncPreview();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendWhatsApp();
  });

  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', sendWhatsApp);
  }

  syncPreview();
})();
