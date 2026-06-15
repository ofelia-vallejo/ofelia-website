/* ════════════════════════════════════════════════════════════════
   Ofelia Vallejo · Capa de analítica (GTM + GA4 + Consent Mode v2)
   ────────────────────────────────────────────────────────────────
   - Inicializa dataLayer y gtag().
   - Fija Consent Mode v2 por defecto en "denied" (obligatorio UE/Suiza).
   - Reaplica el consentimiento guardado en visitas posteriores.
   - Inyecta el contenedor GTM (solo si hay un ID real configurado).
   - Expone window.OVAnalytics con helpers de e-commerce (GA4).

   Cargar TEMPRANO en el <head>, antes que cualquier otro script,
   y después de analytics-config.js.
   ════════════════════════════════════════════════════════════════ */
(function (w, d) {
  'use strict';

  var CFG = w.OV_ANALYTICS || {};
  var CURRENCY = CFG.CURRENCY || 'CHF';
  var DEBUG = !!CFG.DEBUG;

  // ── dataLayer + gtag ───────────────────────────────────────────
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  w.gtag = w.gtag || gtag;

  function log() {
    if (DEBUG && w.console) w.console.log.apply(w.console, ['[OVAnalytics]'].concat([].slice.call(arguments)));
  }

  // ¿El ID es real (no placeholder)?
  function isReal(id, prefix) {
    return typeof id === 'string' && id.indexOf(prefix) === 0 && id.toUpperCase().indexOf('XXX') === -1;
  }

  // ── Consent Mode v2 ────────────────────────────────────────────
  // Por defecto TODO denegado salvo lo estrictamente funcional.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);

  // Reaplicar el consentimiento ya guardado (visitas posteriores):
  // el banner solo aparece una vez, así que aquí re-otorgamos si procede.
  try {
    var raw = localStorage.getItem('ov_cookie_consent');
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved && saved.level === 'all') {
        updateConsent(true);
        log('Consentimiento previo = all → granted');
      }
    }
  } catch (e) {}

  function updateConsent(granted) {
    var state = granted ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
    log('consent update →', state);
  }

  // ── Inyección de GTM (solo con ID real) ────────────────────────
  if (isReal(CFG.GTM_ID, 'GTM-')) {
    (function (s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s);
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
      f.parentNode.insertBefore(j, f);
    })('script', 'dataLayer', CFG.GTM_ID);
    log('GTM cargado:', CFG.GTM_ID);
  } else {
    log('GTM en modo inerte (ID placeholder). Edita assets/js/analytics-config.js');
  }

  // ── Helpers de e-commerce (GA4) ────────────────────────────────
  function num(n) { return Math.round((Number(n) || 0) * 100) / 100; }

  // Item GA4 a partir de una línea del carrito (OVCart)
  function itemFromLine(line, index) {
    var engrave = line.engraveText && String(line.engraveText).trim()
      ? (Number(line.engravePrice) || 0) : 0;
    var item = {
      item_id: line.sku || line.slug || '',
      item_name: line.productName || line.slug || '',
      price: num((Number(line.basePrice) || 0) + engrave),
      quantity: Number(line.quantity) || 1
    };
    if (line.variantLabel) item.item_variant = line.variantLabel;
    if (index != null) item.index = index;
    return item;
  }

  // Item GA4 a partir de un producto del catálogo (PDP)
  function itemFromProduct(p, opts) {
    opts = opts || {};
    var item = {
      item_id: opts.sku || p.slug || '',
      item_name: p.name || p.slug || '',
      price: num(opts.price != null ? opts.price : p.basePrice),
      quantity: opts.quantity || 1
    };
    if (p.category || opts.category) item.item_category = p.category || opts.category;
    if (opts.variant) item.item_variant = opts.variant;
    return item;
  }

  // Push de un evento de e-commerce GA4 (con limpieza previa del objeto)
  function ecommerce(eventName, ecom) {
    w.dataLayer.push({ ecommerce: null }); // limpia el objeto anterior
    var payload = { event: eventName, ecommerce: Object.assign({ currency: CURRENCY }, ecom) };
    w.dataLayer.push(payload);
    log(eventName, payload.ecommerce);
  }

  // ── API pública ────────────────────────────────────────────────
  w.OVAnalytics = {
    updateConsent: updateConsent,
    ecommerce: ecommerce,
    itemFromLine: itemFromLine,
    itemFromProduct: itemFromProduct,
    currency: CURRENCY,
    push: function (obj) { w.dataLayer.push(obj); log('push', obj); }
  };

})(window, document);
