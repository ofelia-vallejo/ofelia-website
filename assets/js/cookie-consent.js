/* Ofelia Vallejo · Cookie Consent
   GDPR (EU) + nFADP (Suiza) compliant
   Estilos: inline via JS para no depender de CSS externo en carga inicial */

(function () {
  'use strict';

  var KEY = 'ov_cookie_consent';
  var VERSION = '1';

  function getConsent() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (parsed.v !== VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(level) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: VERSION,
        level: level,   /* 'essential' | 'all' */
        ts: Date.now()
      }));
    } catch (e) {}
  }

  /* Si ya hay consentimiento guardado, no mostrar banner */
  if (getConsent()) return;

  /* ── Inyectar estilos ──────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '.ov-cookie{',
      'position:fixed;bottom:0;left:0;right:0;z-index:9990;',
      'background:#0B1F3A;color:#F3EEE6;',
      'padding:20px 32px;',
      'display:flex;align-items:center;justify-content:space-between;gap:24px;',
      'flex-wrap:wrap;',
      'border-top:1px solid rgba(243,238,230,0.12);',
      'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;',
      'font-weight:300;font-size:12px;letter-spacing:0.03em;line-height:1.6;',
      'transform:translateY(100%);opacity:0;',
      'transition:transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94),opacity 0.5s ease;',
    '}',
    '.ov-cookie.is-visible{transform:translateY(0);opacity:1;}',
    '.ov-cookie__text{flex:1 1 320px;color:rgba(243,238,230,0.72);}',
    '.ov-cookie__text a{color:rgba(243,238,230,0.9);border-bottom:1px solid rgba(243,238,230,0.3);padding-bottom:1px;text-decoration:none;}',
    '.ov-cookie__text a:hover{border-bottom-color:rgba(243,238,230,0.7);}',
    '.ov-cookie__actions{display:flex;gap:12px;flex-shrink:0;flex-wrap:wrap;}',
    '.ov-cookie__btn{',
      'font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;',
      'font-weight:300;font-size:10px;letter-spacing:0.2em;',
      'text-transform:uppercase;cursor:pointer;border:none;',
      'padding:10px 24px;transition:background 0.3s ease,color 0.3s ease,border-color 0.3s ease;',
    '}',
    '.ov-cookie__btn--all{',
      'background:#F3EEE6;color:#0B1F3A;',
    '}',
    '.ov-cookie__btn--all:hover{background:#EDE5D8;}',
    '.ov-cookie__btn--essential{',
      'background:transparent;color:rgba(243,238,230,0.6);',
      'border:1px solid rgba(243,238,230,0.2);',
    '}',
    '.ov-cookie__btn--essential:hover{',
      'color:#F3EEE6;border-color:rgba(243,238,230,0.5);',
    '}',
    '@media(max-width:600px){',
      '.ov-cookie{padding:12px 14px;gap:10px;flex-direction:column;align-items:stretch;font-size:10px;line-height:1.45;}',
      '.ov-cookie__text{flex:0 1 auto;margin:0;color:rgba(243,238,230,0.68);}',
      '.ov-cookie__actions{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
      '.ov-cookie__btn{width:100%;padding:10px 8px;text-align:center;font-size:9px;letter-spacing:0.14em;}',
    '}'
  ].join('');
  document.head.appendChild(style);

  /* ── Construir banner ──────────────────────────────────────── */
  var banner = document.createElement('div');
  banner.className = 'ov-cookie';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.setAttribute('aria-live', 'polite');

  banner.innerHTML =
    '<p class="ov-cookie__text">' +
      'Usamos cookies esenciales para el funcionamiento del sitio y, con tu consentimiento, cookies analíticas y de marketing. ' +
      'Consulta nuestra <a href="/privacidad#cookies">Política de Privacidad</a>.' +
    '</p>' +
    '<div class="ov-cookie__actions">' +
      '<button class="ov-cookie__btn ov-cookie__btn--essential" data-consent="essential">Solo esenciales</button>' +
      '<button class="ov-cookie__btn ov-cookie__btn--all" data-consent="all">Aceptar</button>' +
    '</div>';

  document.body.appendChild(banner);

  /* Animar entrada con pequeño delay */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  });

  /* Mover el foco al banner para accesibilidad */
  setTimeout(function () {
    var firstBtn = banner.querySelector('button');
    if (firstBtn) firstBtn.focus({ preventScroll: true });
  }, 600);

  /* ── Manejar clicks ────────────────────────────────────────── */
  banner.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-consent]');
    if (!btn) return;

    var level = btn.getAttribute('data-consent');
    saveConsent(level);

    /* Consent Mode v2 — informar a GTM/GA4/Ads de la decisión.
       'all'      → analytics + marketing concedidos
       'essential'→ todo denegado (estado por defecto, se reafirma) */
    if (window.OVAnalytics && typeof window.OVAnalytics.updateConsent === 'function') {
      window.OVAnalytics.updateConsent(level === 'all');
    }

    /* Salida animada */
    banner.style.transform = 'translateY(100%)';
    banner.style.opacity = '0';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 500);
  });

  /* La activación de herramientas (GA4, Google Ads, remarketing) se
     gestiona vía Google Tag Manager + Consent Mode v2 en analytics.js.
     Aquí solo notificamos la decisión del usuario (ver handler de clicks). */

})();
