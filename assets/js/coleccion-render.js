/* Colección dinámica — secciones y productos desde /api/products */

(function () {
  const root = document.getElementById('coleccionCatalog');
  if (!root || !window.OVCatalog) return;

  const PROMOS = [
    {
      categoryId: 'accesorios',
      name: 'Billeteras',
      detail: 'Cuero pleno · estudio de grabado',
      href: '/personalizar.html?producto=Billetera',
      wide: true,
      gradient: 'navy',
    },
    {
      categoryId: 'accesorios',
      name: 'Tu nombre. En la punta.',
      detail: 'Iniciales o monograma OV · antes del envío',
      href: '/personalizar.html',
      wide: true,
      image: '/imagenes nuevas/producto/accesorios/cinturon/negro-liso-detalle.jpg',
      badge: 'Bespoke',
    },
  ];

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function stockLabel(n, low) {
    if (n <= 0) return { text: 'Agotado', cls: 'card__stock--out' };
    if (n <= low) return { text: 'Últimas unidades', cls: 'card__stock--low' };
    return null;
  }

  function variantStock(v) {
    return Number(v.inventory) || 0;
  }

  function productStock(p) {
    return window.OVCatalog.totalStock(p);
  }

  function heroForProduct(p) {
    return window.OVCatalog.heroImage(p);
  }

  function heroForVariant(p, v) {
    const key = v.colorKey || v.id;
    const cd = p.colorData && p.colorData[key];
    if (cd && cd.images && cd.images[0]) return cd.images[0];
    const img = (p.images || []).find((i) => i.variantId === v.id);
    if (img) return img.url;
    return heroForProduct(p);
  }

  function altForVariant(p, v) {
    const key = v.colorKey || v.id;
    const cd = p.colorData && p.colorData[key];
    if (cd && cd.alts && cd.alts[0]) return cd.alts[0];
    return (p.name || '') + ' — ' + (v.colorName || '');
  }

  function priceBlock(p, stock) {
    if (!p || !p.basePrice) return '';
    const low = p.lowStockAt || 2;
    const badge = stockLabel(stock, low);
    let html =
      '<p class="card__price">' +
      window.OVCatalog.formatCHF(p.basePrice) +
      (p.engravePrice ? ' · Grabado desde +' + window.OVCatalog.formatCHF(p.engravePrice) : '') +
      '</p>';
    if (badge) {
      html += '<p class="card__stock ' + badge.cls + '">' + esc(badge.text) + '</p>';
    }
    return html;
  }

  function cardHtml(opts) {
    const wide = opts.wide ? ' card__img--wide' : '';
    const numeral = opts.numeral
      ? '<span class="card__numeral">' + esc(opts.numeral) + '</span>'
      : '';
    const badge = opts.badge
      ? '<span class="card__badge">' + esc(opts.badge) + '</span>'
      : '';

    let media = '';
    if (opts.image) {
      media =
        '<img src="' + esc(opts.image) + '" alt="' + esc(opts.alt || opts.name) + '" class="card__photo" loading="lazy" decoding="async">';
    } else if (opts.gradient) {
      media = '<div class="card__gradient card__gradient--' + esc(opts.gradient) + '" aria-hidden="true"></div>';
    }

    const stock = opts.stock != null ? opts.stock : 0;

    return (
      '<a href="' + esc(opts.href) + '" class="card" id="' + esc(opts.id) + '">' +
        '<div class="card__img' + wide + '" data-dark>' +
          numeral +
          badge +
          media +
        '</div>' +
        '<div class="card__info">' +
          '<p class="card__name">' + esc(opts.name) + '</p>' +
          '<p class="card__detail">' + esc(opts.detail) + '</p>' +
          priceBlock(opts.product || { basePrice: 0, engravePrice: 0, lowStockAt: 2 }, stock) +
          '<span class="card__cta">' + esc(opts.cta || 'Conocer más →') + '</span>' +
        '</div>' +
      '</a>'
    );
  }

  function expandProductCards(p) {
    const cards = [];
    if (p.collectionDisplay === 'variants' && p.variants && p.variants.length) {
      p.variants.forEach((v) => {
        const stock = variantStock(v);
        if (p.hideOutOfStock && stock <= 0) return;
        const key = v.colorKey || v.id;
        cards.push({
          id: p.slug + '-' + key,
          href: '/producto/' + p.slug + '#' + key,
          name: v.colorName || p.name,
          detail: p.shortDescription || '',
          badge: (v.colorName || '').split(' · ')[0] || v.colorName,
          numeral: p.numeral || '',
          image: heroForVariant(p, v),
          alt: altForVariant(p, v),
          wide: p.collectionWide === true,
          stock: stock,
          product: p,
          cta: stock <= 0 ? 'Solicitar →' : 'Conocer más →',
        });
      });
      return cards;
    }

    const stock = productStock(p);
    if (p.hideOutOfStock && stock <= 0) return cards;

    const firstVariant = (p.variants && p.variants[0]) || null;
    cards.push({
      id: p.slug || p.id,
      href: p.pdpPath || '/producto/' + p.slug,
      name: p.name,
      detail: p.shortDescription || '',
      badge: firstVariant ? firstVariant.colorName.split(' · ')[0] : '',
      numeral: p.numeral || '',
      image: heroForProduct(p),
      alt: (p.images && p.images[0] && p.images[0].alt) || p.name,
      wide: p.collectionWide === true,
      stock: stock,
      product: p,
      cta: stock <= 0 ? 'Solicitar →' : 'Conocer más →',
    });
    return cards;
  }

  function renderCategory(cat, products) {
    const items = products
      .filter((p) => p.active !== false && p.category === cat.id)
      .sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99) || a.name.localeCompare(b.name));

    const allCards = [];
    items.forEach((p) => {
      expandProductCards(p).forEach((c) => allCards.push(c));
    });

    PROMOS.filter((pr) => pr.categoryId === cat.id).forEach((pr) => {
      allCards.push({
        id: 'promo-' + pr.name.replace(/\s+/g, '-').toLowerCase(),
        href: pr.href,
        name: pr.name,
        detail: pr.detail,
        badge: pr.badge || '',
        image: pr.image,
        gradient: pr.gradient,
        wide: pr.wide,
        stock: 99,
        product: { basePrice: 0, engravePrice: 0, lowStockAt: 2 },
        cta: 'Solicitar →',
      });
    });

    if (!allCards.length) return '';

    const cols = cat.gridCols === 2 ? 2 : 3;
    const countLabel = allCards.length + (allCards.length === 1 ? ' pieza' : ' piezas');

    return (
      '<section class="category reveal" id="' + esc(cat.id) + '">' +
        '<div class="category__header">' +
          '<span class="category__label">' + esc(cat.label) + '</span>' +
          '<span class="category__count">' + esc(countLabel) + '</span>' +
        '</div>' +
        '<div class="grid grid--' + cols + '">' +
          allCards.map((c) => cardHtml(c)).join('') +
        '</div>' +
      '</section>'
    );
  }

  function scrollToHash() {
    const hash = (location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function init() {
    root.innerHTML = '<p class="coleccion-loading">Cargando colección…</p>';
    try {
      const data = await window.OVCatalog.fetchCatalog();
      const categories = (data.categories || [])
        .filter((c) => c.active !== false)
        .sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99));

      const html = categories.map((cat) => renderCategory(cat, data.products || [])).join('');
      root.innerHTML = html || '<p class="coleccion-loading">No hay piezas activas en el catálogo.</p>';

      scrollToHash();

      if (window.IntersectionObserver) {
        root.querySelectorAll('.reveal').forEach((el) => {
          const io = new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  e.target.classList.add('is-in');
                  io.unobserve(e.target);
                }
              });
            },
            { threshold: 0.08 }
          );
          io.observe(el);
        });
      }
    } catch (err) {
      root.innerHTML =
        '<p class="coleccion-loading">No se pudo cargar el catálogo. <a href="/contacto.html">Contacto</a></p>';
      console.warn('[coleccion-render]', err.message);
    }
  }

  window.addEventListener('hashchange', scrollToHash);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
