/* Ofelia Vallejo — utilidades compartidas · sin dependencias · cargar primero */
(function () {
  'use strict';

  // Escape para interpolación segura en innerHTML (texto y atributos).
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Precio en francos suizos, redondeado. Moneda fija del mercado europeo.
  function formatCHF(n) {
    return 'CHF ' + Math.round(Number(n) || 0);
  }

  // fetch con timeout: aborta si la API no responde (evita UI colgada).
  function fetchWithTimeout(url, opts) {
    const options = opts || {};
    const ms = options.timeout || 8000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal })).finally(() =>
      clearTimeout(timer)
    );
  }

  window.OVUtil = { esc, formatCHF, fetchWithTimeout };
})();
