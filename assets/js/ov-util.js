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

  window.OVUtil = { esc, formatCHF };
})();
