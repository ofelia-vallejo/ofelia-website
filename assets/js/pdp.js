/* PDP dinámico · /producto/:slug */

(function () {
  const FADE_MS = 300;

  function getSlug() {
    const params = new URLSearchParams(location.search);
    if (params.get('slug')) return params.get('slug');
    const parts = location.pathname.replace(/\/$/, '').split('/');
    const i = parts.indexOf('producto');
    if (i >= 0 && parts[i + 1] && parts[i + 1] !== 'index.html') return parts[i + 1];
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function imgUrl(url) {
    if (window.OVMedia) return window.OVMedia.url(url);
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return '/' + url;
  }

  function filterImages(urls) {
    if (window.OVMedia) return window.OVMedia.filterImages(urls);
    return (urls || []).filter(function (u) {
      return u && String(u).trim();
    });
  }

  function buildColorData(product) {
    if (product.colorData && Object.keys(product.colorData).length) {
      const out = {};
      Object.keys(product.colorData).forEach(function (k) {
        const v = product.colorData[k];
        const images = filterImages(v.images).map(imgUrl);
        const alts = (v.alts || []).slice(0, images.length);
        while (alts.length < images.length) {
          alts.push(v.label || product.name);
        }
        out[k] = Object.assign({}, v, { images: images, alts: alts });
      });
      return out;
    }
    const rawUrls = filterImages((product.images || []).map((i) => i.url));
    const imgs = rawUrls.map(imgUrl);
    const alts = (product.images || [])
      .filter((i) => i.url && String(i.url).trim())
      .map((i) => i.alt || product.name)
      .slice(0, imgs.length);
    const key = (product.variants && product.variants[0] && product.variants[0].colorKey)
      || (product.variants && product.variants[0] && product.variants[0].id)
      || 'default';
    const label = (product.variants && product.variants[0] && product.variants[0].colorName) || 'Cuero';
    const hex = (product.variants && product.variants[0] && product.variants[0].colorHex) || '#3B2B26';
    return {
      [key]: {
        label,
        leather: [hex, hex, hex],
        images: imgs,
        alts,
      },
    };
  }

  function formatCHF(n) {
    return 'CHF ' + Math.round(Number(n) || 0);
  }

  function totalStock(p) {
    if (window.OVCatalog) return window.OVCatalog.totalStock(p);
    if (p.variants && p.variants.length) {
      return p.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
    }
    return Number(p.inventory) || 0;
  }

  function renderProduct(p, related) {
    const colorData = buildColorData(p);
    const colorKeys = Object.keys(colorData);
    const firstColor = colorKeys[0];
    const stock = totalStock(p);
    const engraveExtra = Number(p.engravePrice) || 0;
    const accordion = p.accordion && p.accordion.length
      ? p.accordion
      : [
          { title: 'Materiales', body: 'Cuero pleno colombiano · hecho a mano en Medellín.' },
          { title: 'Grabado láser', body: 'Personalización CO₂ · confirmación del atelier antes de grabar.' },
        ];

    const galleryImages = colorData[firstColor].images || [];
    const hasGallery = galleryImages.length > 0;

    const thumbs = hasGallery
      ? galleryImages.map((src, i) =>
          '<button type="button" class="pdp__thumb' + (i === 0 ? ' is-active' : '') + '" role="tab" data-index="' + i + '" aria-selected="' + (i === 0) + '">' +
            '<img src="' + esc(imgUrl(src)) + '" alt="" loading="' + (i === 0 ? 'eager' : 'lazy') + '">' +
          '</button>'
        ).join('')
      : '';

    const slides = hasGallery
      ? galleryImages.map((src, i) =>
          '<div class="pdp__slide"><img src="' + esc(imgUrl(src)) + '" alt="' + esc(colorData[firstColor].alts[i]) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '"></div>'
        ).join('')
      : '';

    const swatches = colorKeys.map((k) =>
      '<button type="button" class="pdp__swatch' + (k === firstColor ? ' is-active' : '') + '" data-color="' + esc(k) + '" style="background:' + esc(colorData[k].leather[1] || '#3B2B26') + '" aria-label="' + esc(colorData[k].label) + '"></button>'
    ).join('');

    const accHtml = accordion.map((item, idx) =>
      '<div class="pdp__acc-item' + (idx === 0 ? ' is-open' : '') + '">' +
        '<button type="button" class="pdp__acc-trigger" aria-expanded="' + (idx === 0) + '">' +
          '<span>' + esc(item.title) + '</span>' +
          '<svg class="pdp__acc-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" stroke-width="1"/></svg>' +
        '</button>' +
        '<div class="pdp__acc-panel"><div class="pdp__acc-panel-inner"><p class="pdp__acc-body">' + esc(item.body) + '</p></div></div>' +
      '</div>'
    ).join('');

    const relatedHtml = (related || []).slice(0, 3).map((r) => {
      const hero = (r.images && r.images[0]) ? imgUrl(r.images[0].url) : '';
      return (
        '<a href="/producto/' + esc(r.slug) + '" class="pdp__card">' +
          '<div class="pdp__card-img" data-dark>' +
            (hero ? '<img src="' + esc(hero) + '" alt="' + esc(r.name) + '" loading="lazy">' : '') +
          '</div>' +
          '<p class="pdp__card-name">' + esc(r.name) + '</p>' +
          '<p class="pdp__card-price">' + formatCHF(r.basePrice) + '</p>' +
        '</a>'
      );
    }).join('');

    const hero = hasGallery ? imgUrl(galleryImages[0]) : '';
    const editorial = p.editorialImage ? imgUrl(p.editorialImage) : '';
    const showEditorial = Boolean(editorial);

    if (window.OVSeo && window.OVSeo.applyProduct) {
      window.OVSeo.applyProduct(p);
    } else {
      document.title = p.name + ' · Ofelia Vallejo';
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = (p.shortDescription || p.description || '').slice(0, 160);
    }

    const pdp = document.getElementById('pdp');
    pdp.hidden = false;
    pdp.dataset.personalizable = p.personalizable !== false ? 'true' : 'false';
    pdp.dataset.producto = p.name;
    pdp.dataset.slug = p.slug;

    pdp.innerHTML =
      '<div class="pdp__layout reveal">' +
        '<div class="pdp__gallery' + (hasGallery ? '' : ' pdp__gallery--pending') + '" data-dark>' +
          (hasGallery ? '<div class="pdp__thumbs" role="tablist">' + thumbs + '</div>' : '') +
          '<div class="pdp__stage' + (hasGallery ? '' : ' pdp__stage--pending') + '" style="--leather-mid:' + esc(colorData[firstColor].leather[1] || '#3B2B26') + '">' +
            (hasGallery
              ? '<img id="pdpMainImg" class="pdp__main-img" src="' + esc(hero) + '" alt="' + esc(p.name) + '">'
              : '<p class="pdp__stage-empty" id="pdpStageEmpty">Imagen en proceso</p>') +
          '</div>' +
          (hasGallery ? '<div class="pdp__carousel" id="pdpCarousel">' + slides + '</div>' : '') +
          (hasGallery ? '<div class="pdp__dots" id="pdpDots"></div>' : '') +
        '</div>' +
        '<div class="pdp__info">' +
          '<nav class="pdp-breadcrumb"><a href="/home.html">Inicio</a><span class="pdp-breadcrumb__sep">/</span><a href="/coleccion.html">Cuero</a><span class="pdp-breadcrumb__sep">/</span><span aria-current="page">' + esc(p.name) + '</span></nav>' +
          '<p class="pdp__label">Leather House · Medellín</p>' +
          '<h1 class="pdp__title">' + esc(p.name) + '</h1>' +
          '<p class="pdp__price" id="pdpPrice">' + formatCHF(p.basePrice) + '</p>' +
          (engraveExtra ? '<p class="pdp__price-sub">Grabado láser adicional desde +' + formatCHF(engraveExtra) + '</p>' : '') +
          '<p class="pdp__stock' + (stock <= 0 ? ' pdp__stock--out' : '') + '" id="pdpStock">' +
            (stock <= 0 ? 'Agotado' : stock <= (p.lowStockAt || 2) ? 'Últimas unidades' : 'En stock') +
          '</p>' +
          '<hr class="pdp__rule">' +
          '<p class="pdp__desc">' + esc(p.description || p.shortDescription) + '</p>' +
          (colorKeys.length > 1 ? '<div class="pdp__colors"><div class="pdp__swatches" role="radiogroup">' + swatches + '</div><p class="pdp__color-name" id="pdpColorName">' + esc(colorData[firstColor].label) + '</p></div>' : '') +
          '<hr class="pdp__rule">' +
          '<div class="pdp__accordion" id="pdpAccordion">' + accHtml + '</div>' +
          (p.personalizable !== false ? (
            '<section class="pdp__engrave" id="pdpEngrave">' +
              '<p class="pdp__engrave-label">Tu nombre. En cuero.</p>' +
              '<input type="text" id="pdpEngraveInput" class="pdp__engrave-input" maxlength="24" placeholder="Iniciales o nombre" autocomplete="off">' +
              '<div class="pdp__engrave-preview" aria-live="polite">' +
                '<svg class="pdp__engrave-svg" viewBox="0 0 320 100" role="img">' +
                  '<defs><linearGradient id="pdpLeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
                    '<stop offset="0%" stop-color="#4a362e"/><stop offset="45%" stop-color="#3B2B26"/><stop offset="100%" stop-color="#2e211c"/>' +
                  '</linearGradient><filter id="pdpEngraveFX"><feDropShadow dx="0" dy="1" flood-color="rgba(243,238,230,0.18)"/><feDropShadow dx="0" dy="-1" stdDeviation="0.4" flood-color="rgba(11,31,58,0.65)"/></filter></defs>' +
                  '<rect width="320" height="100" fill="url(#pdpLeatherGrad)" rx="2"/>' +
                  '<text id="pdpEngravePreviewText" class="pdp__engrave-leather-text" filter="url(#pdpEngraveFX)" x="160" y="58" text-anchor="middle" dominant-baseline="middle">—</text>' +
                '</svg></div>' +
              '<p class="pdp__engrave-note">Confirmación del atelier · 24–48 h</p>' +
            '</section>'
          ) : '') +
          '<button type="button" class="pdp__cta-primary" id="pdpAddCart"' + (stock <= 0 ? ' disabled' : '') + ' hidden>Añadir a la bolsa</button>' +
          '<button type="button" class="pdp__cta-primary pdp__cta-pay" id="pdpBuy"' + (stock <= 0 ? ' disabled' : '') + '>Consultar por WhatsApp</button>' +
          '<a href="#" class="pdp__cta-primary" id="pdpCtaPersonalizar" style="margin-top:12px;background:transparent;border:1px solid var(--navy);color:var(--navy)">Personalizar · estudio</a>' +
          '<p class="pdp__cta-secondary" id="pdpPayNote" style="margin-top:10px;font-size:10px;opacity:0.5"></p>' +
        '</div>' +
      '</div>' +
      (showEditorial ? (
        '<section class="pdp__editorial reveal"><div class="pdp__editorial-media" data-dark><img src="' + esc(editorial) + '" alt="" loading="lazy"></div>' +
        (p.editorialCaption ? '<p class="pdp__editorial-caption">' + esc(p.editorialCaption) + '</p>' : '') +
        '</section>'
      ) : '') +
      (relatedHtml ? '<section class="pdp__related reveal"><h2 class="pdp__related-title">También de la casa</h2><div class="pdp__related-grid">' + relatedHtml + '</div></section>' : '') +
      '<script type="application/json" id="pdpColorData">' + JSON.stringify(colorData) + '<\/script>';

    document.getElementById('pdpFooter').hidden = false;
    initPdpBehaviors(p, engraveExtra, stock);
  }

  function initPdpBehaviors(product, engraveExtra, stock) {
    const colorData = JSON.parse(document.getElementById('pdpColorData').textContent);
    let currentColor = Object.keys(colorData)[0];
    const mainImg = document.getElementById('pdpMainImg');
    const thumbs = document.querySelectorAll('.pdp__thumb');
    const carousel = document.getElementById('pdpCarousel');
    const dotsWrap = document.getElementById('pdpDots');
    const colorNameEl = document.getElementById('pdpColorName');
    const swatches = document.querySelectorAll('.pdp__swatch');
    const engraveInput = document.getElementById('pdpEngraveInput');
    const engravePreviewText = document.getElementById('pdpEngravePreviewText');
    const leatherGrad = document.getElementById('pdpLeatherGrad');
    const buyBtn = document.getElementById('pdpBuy');
    const addCartBtn = document.getElementById('pdpAddCart');
    const payNote = document.getElementById('pdpPayNote');
    const ctaPers = document.getElementById('pdpCtaPersonalizar');
    let activeThumbIndex = 0;

    function findVariantForColor(colorKey) {
      const variants = product.variants || [];
      if (!variants.length) return null;
      return (
        variants.find(function (v) {
          return v.colorKey === colorKey || v.id === colorKey;
        }) || variants[0]
      );
    }

    function currentLinePayload() {
      const variant = findVariantForColor(currentColor);
      const cd = colorData[currentColor] || {};
      const texto = engraveInput ? engraveInput.value.trim() : '';
      const hero =
        (cd.images && cd.images[0]) ||
        (product.images && product.images[0] && product.images[0].url) ||
        '';
      return {
        slug: product.slug,
        variantId: variant ? variant.id || variant.colorKey || '' : currentColor,
        variantLabel: cd.label || (variant && variant.colorName) || '',
        productName: product.name,
        image: imgUrl(hero),
        sku: variant && variant.sku ? variant.sku : '',
        quantity: 1,
        basePrice: Number(product.basePrice) || 0,
        engravePrice: Number(product.engravePrice) || 0,
        engraveText: texto,
      };
    }

    function crossfadeImage(img, nextSrc, nextAlt, done) {
      if (!img) { if (done) done(); return; }
      img.classList.add('is-fade-out');
      setTimeout(function () {
        img.src = nextSrc;
        if (nextAlt) img.alt = nextAlt;
        img.classList.remove('is-fade-out');
        if (done) done();
      }, FADE_MS);
    }

    function updateLeatherPreview(colors) {
      if (!leatherGrad || !colors) return;
      const stops = leatherGrad.querySelectorAll('stop');
      if (stops.length >= 3) {
        stops[0].setAttribute('stop-color', colors[0]);
        stops[1].setAttribute('stop-color', colors[1]);
        stops[2].setAttribute('stop-color', colors[2]);
      }
    }

    function setGalleryForColor(colorKey, thumbIndex) {
      const variant = colorData[colorKey];
      if (!variant) return;
      const idx = typeof thumbIndex === 'number' ? thumbIndex : 0;
      activeThumbIndex = idx;
      const stage = document.querySelector('.pdp__stage');
      const imgs = variant.images || [];

      if (!imgs.length) {
        if (stage) {
          stage.classList.add('pdp__stage--pending');
          stage.style.setProperty('--leather-mid', variant.leather[1] || '#3B2B26');
        }
        if (mainImg) mainImg.style.display = 'none';
        if (colorNameEl) colorNameEl.textContent = variant.label;
        updateLeatherPreview(variant.leather);
        return;
      }

      if (stage) stage.classList.remove('pdp__stage--pending');
      if (mainImg) mainImg.style.display = '';

      thumbs.forEach(function (btn, i) {
        const img = btn.querySelector('img');
        if (!img || !imgs[i]) return;
        btn.classList.add('is-swapping');
        setTimeout(function () {
          img.src = imgUrl(imgs[i]);
          btn.classList.remove('is-swapping');
        }, FADE_MS);
        btn.classList.toggle('is-active', i === idx);
      });
      if (mainImg && imgs[idx]) {
        crossfadeImage(mainImg, imgUrl(imgs[idx]), variant.alts[idx]);
      }
      if (colorNameEl) colorNameEl.textContent = variant.label;
      updateLeatherPreview(variant.leather);
    }

    function selectColor(colorKey) {
      if (!colorData[colorKey]) return;
      currentColor = colorKey;
      swatches.forEach(function (sw) {
        const on = sw.getAttribute('data-color') === colorKey;
        sw.classList.toggle('is-active', on);
      });
      setGalleryForColor(colorKey, 0);
      history.replaceState(null, '', '#' + colorKey);
    }

    swatches.forEach(function (sw) {
      sw.addEventListener('click', function () {
        selectColor(sw.getAttribute('data-color'));
      });
    });

    thumbs.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        const variant = colorData[currentColor];
        if (!variant || activeThumbIndex === i) return;
        thumbs.forEach(function (t) { t.classList.remove('is-active'); });
        btn.classList.add('is-active');
        activeThumbIndex = i;
        crossfadeImage(mainImg, imgUrl(variant.images[i]), variant.alts[i]);
      });
    });

    if (carousel && dotsWrap && !dotsWrap.childElementCount) {
      carousel.querySelectorAll('.pdp__slide').forEach(function (_, i) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'pdp__dot' + (i === 0 ? ' is-active' : '');
        dot.addEventListener('click', function () {
          carousel.scrollTo({ left: carousel.clientWidth * i, behavior: 'smooth' });
        });
        dotsWrap.appendChild(dot);
      });
    }

    document.querySelectorAll('.pdp__acc-item').forEach(function (item) {
      item.querySelector('.pdp__acc-trigger').addEventListener('click', function () {
        const open = item.classList.contains('is-open');
        document.querySelectorAll('.pdp__acc-item').forEach(function (o) {
          o.classList.remove('is-open');
          o.querySelector('.pdp__acc-trigger').setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          item.querySelector('.pdp__acc-trigger').setAttribute('aria-expanded', 'true');
        }
      });
    });

    function buildPersonalizarUrl() {
      const params = new URLSearchParams();
      params.set('producto', product.name);
      params.set('color', currentColor);
      const t = engraveInput && engraveInput.value.trim();
      if (t) {
        params.set('texto_grabado', t);
        params.set('tipo_grabado', t.length <= 3 ? 'iniciales' : 'nombre');
      }
      return '/personalizar.html?' + params.toString();
    }

    if (ctaPers) {
      ctaPers.href = buildPersonalizarUrl();
      ctaPers.addEventListener('click', function (e) {
        e.preventDefault();
        location.href = buildPersonalizarUrl();
      });
    }

    if (engraveInput) {
      engraveInput.addEventListener('input', function () {
        const val = engraveInput.value.trim();
        if (engravePreviewText) engravePreviewText.textContent = val || '—';
        updateBuyLabel();
      });
    }

    function updateBuyLabel() {
      if (stock <= 0) return;
      const t = engraveInput && engraveInput.value.trim();
      const total = Number(product.basePrice) + (t ? engraveExtra : 0);
      if (buyBtn) buyBtn.textContent = 'Consultar por WhatsApp · ' + formatCHF(total);
      if (addCartBtn && !addCartBtn.hidden) {
        addCartBtn.textContent = 'Añadir a la bolsa · ' + formatCHF(total);
      }
    }

    async function setupStripeCommerce() {
      if (!window.OVCart) return;
      await OVCart.fetchStripeConfig();
      if (!OVCart.isStripeEnabled() || stock <= 0) return;
      if (addCartBtn) {
        addCartBtn.hidden = false;
        addCartBtn.classList.add('pdp__cta-primary');
      }
      if (buyBtn) {
        buyBtn.classList.remove('pdp__cta-primary');
        buyBtn.classList.add('pdp__cta-whatsapp');
        buyBtn.style.marginTop = '12px';
      }
      if (payNote) {
        payNote.textContent = 'Pago seguro con tarjeta en checkout · o consulta por WhatsApp.';
      }
    }

    if (addCartBtn && stock > 0) {
      addCartBtn.addEventListener('click', function () {
        if (!window.OVCart) return;
        OVCart.addLine(currentLinePayload());
        if (window.OVCartUI) OVCartUI.open();
        else if (payNote) payNote.textContent = 'Añadido a la bolsa.';
      });
    }

    setupStripeCommerce();

    if (buyBtn && stock > 0) {
      buyBtn.addEventListener('click', async function () {
        if (!window.OVWhatsApp) {
          if (payNote) payNote.textContent = 'WhatsApp no disponible — usa Personalizar.';
          return;
        }
        buyBtn.disabled = true;
        buyBtn.textContent = 'Abriendo WhatsApp…';
        const texto = engraveInput ? engraveInput.value.trim() : '';
        const total = Number(product.basePrice) + (texto ? engraveExtra : 0);
        const colorLabel = colorData[currentColor] && colorData[currentColor].label
          ? colorData[currentColor].label
          : currentColor;
        const res = await window.OVWhatsApp.openOrder({
          producto: product.name,
          color: colorLabel,
          total_estimated: String(total),
          texto_grabado: texto,
        });
        if (!res.ok && payNote) payNote.textContent = res.error || '';
        buyBtn.disabled = false;
        updateBuyLabel();
      });
    }

    if (payNote && payNote.textContent === '') {
      payNote.textContent = 'Compra por WhatsApp · confirmación del atelier.';
    }

    const backBtn = document.getElementById('pdpBack');
    if (backBtn) {
      function syncBack() {
        backBtn.classList.toggle('is-visible', window.scrollY > 100);
      }
      syncBack();
      window.addEventListener('scroll', syncBack, { passive: true });
      backBtn.addEventListener('click', function () {
        if (history.length > 1) history.back();
        else location.href = '/coleccion.html';
      });
    }

    const hash = (location.hash || '').replace(/^#/, '');
    if (hash && colorData[hash]) selectColor(hash);
    updateBuyLabel();
  }

  async function init() {
    const slug = getSlug();
    const loading = document.getElementById('pdpLoading');
    const err = document.getElementById('pdpError');

    if (!slug) {
      loading.hidden = true;
      err.hidden = false;
      return;
    }

    try {
      const catalog = await window.OVCatalog.fetchCatalog();
      const product = catalog.products.find(function (p) {
        return p.slug === slug || p.id === slug;
      });
      if (!product) throw new Error('not found');

      const related = catalog.products.filter(function (p) {
        return p.active && p.slug !== product.slug && p.category === product.category;
      });

      loading.hidden = true;
      renderProduct(product, related);

      const ld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        brand: { '@type': 'Brand', name: 'Ofelia Vallejo' },
        description: product.description,
        offers: {
          '@type': 'Offer',
          price: String(product.basePrice),
          priceCurrency: 'CHF',
          availability: totalStock(product) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    } catch (e) {
      loading.hidden = true;
      err.hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
