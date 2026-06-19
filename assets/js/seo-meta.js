/* SEO dinámico · PDP y utilidades */

(function () {
  const SITE = 'https://ofeliavallejo.com';
  const DEFAULT_OG = SITE + '/assets/icons/og-image.jpg';

  function setMeta(attr, key, content) {
    if (!content) return;
    let el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setLink(rel, href) {
    if (!href) return;
    let el = document.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function productImage(product) {
    const img = (product.images || []).find((i) => i.kind === 'hero') || product.images?.[0];
    if (!img || !img.url) return DEFAULT_OG;
    const u = img.url.startsWith('http') ? img.url : SITE + (img.url.startsWith('/') ? '' : '/') + img.url;
    return u;
  }

  function applyProduct(product) {
    if (!product) return;
    const title = product.name + ' · Ofelia Vallejo';
    const desc = (product.shortDescription || product.description || '').slice(0, 160);
    const url = SITE + '/producto/' + product.slug;
    const image = productImage(product);

    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', 'index, follow');
    setLink('canonical', url);

    setMeta('property', 'og:type', 'product');
    setMeta('property', 'og:site_name', 'Ofelia Vallejo');
    setMeta('property', 'og:locale', 'es_CO');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', image);

    let script = document.getElementById('ov-product-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'ov-product-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: desc,
      image: [image],
      brand: {
        '@type': 'Brand',
        name: 'Ofelia Vallejo',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'CHF',
        price: product.basePrice || 0,
        availability: 'https://schema.org/InStock',
        url: url,
      },
    });

    let crumb = document.getElementById('ov-breadcrumb-jsonld');
    if (!crumb) {
      crumb = document.createElement('script');
      crumb.id = 'ov-breadcrumb-jsonld';
      crumb.type = 'application/ld+json';
      document.head.appendChild(crumb);
    }
    crumb.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/home' },
        { '@type': 'ListItem', position: 2, name: 'Colección', item: SITE + '/coleccion' },
        { '@type': 'ListItem', position: 3, name: product.name, item: url },
      ],
    });
  }

  window.OVSeo = { applyProduct: applyProduct };
})();
