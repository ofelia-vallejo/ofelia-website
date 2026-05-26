/* Atelier Studio — configurador de grabado */

(function () {
  const root = document.getElementById('engraveStudio');
  if (!root || !window.OVCatalog) return;

  const els = {
    product: document.getElementById('studioProduct'),
    text: document.getElementById('studioText'),
    char: document.getElementById('studioChar'),
    mark: document.getElementById('studioMark'),
    previewImg: document.getElementById('studioPreviewImg'),
    basePrice: document.getElementById('studioBasePrice'),
    engravePrice: document.getElementById('studioEngravePrice'),
    totalPrice: document.getElementById('studioTotalPrice'),
    applyBtn: document.getElementById('studioApplyForm'),
    saveBtn: document.getElementById('studioSaveDraft'),
  };

  let catalog = { products: [] };
  let state = {
    productId: '',
    font: 'romana',
    size: 'M',
    layout: 'texto',
    text: '',
  };

  const FONT_LABELS = { romana: 'Romana', clasica: 'Clásica', firma: 'Firma' };
  const LAYOUT_LABELS = {
    texto: 'Solo texto',
    'monograma-ov': 'Monograma OV',
    'texto-monograma': 'Texto + OV',
  };

  function getProduct() {
    return catalog.products.find((p) => p.id === state.productId || p.slug === state.productId);
  }

  function maxChars() {
    const p = getProduct();
    if (!p || !p.engrave || !p.engrave.sizes) return 60;
    const s = p.engrave.sizes[state.size];
    return s ? s.maxChars : 60;
  }

  function updatePricing() {
    const p = getProduct();
    if (!p) return;
    const base = Number(p.basePrice) || 0;
    const eng = state.text.trim() ? (Number(p.engravePrice) || 0) : 0;
    els.basePrice.textContent = window.OVCatalog.formatCHF(base);
    els.engravePrice.textContent = eng ? '+ ' + window.OVCatalog.formatCHF(eng) : '—';
    els.totalPrice.textContent = window.OVCatalog.formatCHF(base + eng);
  }

  function updatePreview() {
    const p = getProduct();
    const max = maxChars();
    let text = state.text.slice(0, max);
    if (state.text !== text) {
      state.text = text;
      els.text.value = text;
    }
    els.char.textContent = text.length + ' / ' + max;

    if (p) {
      const img = window.OVCatalog.heroImage(p);
      if (img) els.previewImg.src = img;
      els.previewImg.alt = p.name;
    }

    let display = text || '—';
    if (state.layout === 'monograma-ov') display = 'OV';
    if (state.layout === 'texto-monograma' && text) display = text + '\nOV';

    els.mark.textContent = display;
    els.mark.setAttribute('data-font', state.font);
    els.mark.setAttribute('data-size', state.size);

    updatePricing();
  }

  function bindChips(container, key, labels, allowed) {
    container.innerHTML = (allowed || Object.keys(labels)).map((id) => {
      return (
        '<button type="button" class="engrave-studio__chip' +
        (state[key] === id ? ' is-active' : '') +
        '" data-key="' + key + '" data-val="' + id + '">' +
        (labels[id] || id) + '</button>'
      );
    }).join('');

    container.querySelectorAll('.engrave-studio__chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        state[key] = btn.getAttribute('data-val');
        bindAllChips();
        updatePreview();
      });
    });
  }

  const fontChips = document.getElementById('studioFontChips');
  const sizeChips = document.getElementById('studioSizeChips');
  const layoutChips = document.getElementById('studioLayoutChips');

  function bindAllChips() {
    const p = getProduct();
    const eng = (p && p.engrave) || {};
    bindChips(fontChips, 'font', FONT_LABELS, eng.fonts || ['romana', 'clasica']);
    const sizeLabels = {};
    Object.keys(eng.sizes || { M: { label: 'Nombre' } }).forEach((k) => {
      sizeLabels[k] = (eng.sizes[k].label || k) + ' · ' + eng.sizes[k].maxChars;
    });
    bindChips(sizeChips, 'size', sizeLabels, Object.keys(eng.sizes || { M: {} }));
    bindChips(layoutChips, 'layout', LAYOUT_LABELS, eng.layouts || ['texto']);
  }

  function fillProductSelect() {
    els.product.innerHTML = catalog.products
      .filter((p) => p.active && p.personalizable)
      .map((p) => '<option value="' + p.id + '">' + p.name + '</option>')
      .join('');

    const params = new URLSearchParams(location.search);
    const qSlug = params.get('producto');
    if (qSlug) {
      const match = catalog.products.find(
        (p) => p.name === qSlug || p.slug === qSlug || p.id === qSlug
      );
      if (match) state.productId = match.id;
    }
    if (!state.productId && catalog.products.length) {
      state.productId = catalog.products[0].id;
    }
    els.product.value = state.productId;
  }

  function applyToForm() {
    const form = document.getElementById('form-personalizar');
    if (!form) return;
    const p = getProduct();
    if (p && form.producto) {
      const opt = Array.from(form.producto.options).find((o) => o.value === p.name);
      if (opt) opt.selected = true;
      else form.producto.value = p.name;
    }
    if (form.texto_grabado) form.texto_grabado.value = state.text;
    if (form.tipo_grabado) {
      if (state.size === 'S') form.tipo_grabado.value = 'iniciales';
      else if (state.size === 'L') form.tipo_grabado.value = 'texto';
      else form.tipo_grabado.value = 'nombre';
    }
    const msg = form.mensaje;
    if (msg) {
      const note =
        'Estudio: fuente ' + state.font +
        ' · tamaño ' + state.size +
        ' · diseño ' + state.layout +
        ' · total estimado ' + els.totalPrice.textContent;
      if (!msg.value.includes('Estudio:')) msg.value = note;
    }
    document.getElementById('solicitud-formulario')?.scrollIntoView({ behavior: 'smooth' });
  }

  function saveDraft() {
    if (!window.OVAccount) return;
    if (!window.OVAccount.isLoggedIn()) {
      window.OVAccount.openModal('register');
      return;
    }
    const p = getProduct();
    window.OVAccount.saveDraft({
      pieza: p ? p.name : '',
      texto: state.text,
      producto: JSON.stringify({
        font: state.font,
        size: state.size,
        layout: state.layout,
        productId: state.productId,
      }),
    });
  }

  async function init() {
    try {
      const data = await window.OVCatalog.fetchCatalog();
      catalog.products = data.products;
      fillProductSelect();
      bindAllChips();

      const params = new URLSearchParams(location.search);
      const t = params.get('texto_grabado');
      if (t) state.text = t.slice(0, maxChars());

      els.product.addEventListener('change', () => {
        state.productId = els.product.value;
        bindAllChips();
        updatePreview();
      });

      els.text.addEventListener('input', () => {
        state.text = els.text.value;
        updatePreview();
      });

      els.applyBtn.addEventListener('click', applyToForm);
      if (els.saveBtn) els.saveBtn.addEventListener('click', saveDraft);

      updatePreview();
    } catch (err) {
      root.hidden = true;
      console.warn('[engrave-studio]', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
