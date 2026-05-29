/* Popup lanzamiento — solo correo + cupón (sin cuenta) */

(function () {
  const KEY_POPUP = 'ov_launch_popup_dismissed';
  const KEY_SUBSCRIBED = 'ov_launch_subscribed';

  const IMG_MODAL = '/imagenes nuevas/detalle/firma-travel-bag-cognac.jpg';

  function assetPath(rel) {
    const isSub = window.location.pathname.includes('/producto/');
    if (isSub) return '../' + rel.replace(/^\//, '');
    return rel.startsWith('/') ? rel.slice(1) : rel;
  }

  function isSubscribed() {
    try {
      return Boolean(localStorage.getItem(KEY_SUBSCRIBED));
    } catch {
      return false;
    }
  }

  function saveSubscribed(payload) {
    try {
      localStorage.setItem(KEY_SUBSCRIBED, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  function getSubscribed() {
    try {
      const raw = localStorage.getItem(KEY_SUBSCRIBED);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  let modalEl = null;

  function buildModal() {
    if (document.getElementById('ovLaunchModal')) {
      modalEl = document.getElementById('ovLaunchModal');
      return;
    }

    const imgSrc = encodeURI(assetPath(IMG_MODAL));
    const root = document.createElement('div');
    root.id = 'ovLaunchModal';
    root.className = 'ov-modal ov-launch-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'ovLaunchTitle');
    root.innerHTML =
      '<div class="ov-modal__dialog">' +
        '<button type="button" class="ov-modal__close" aria-label="Cerrar">×</button>' +
        '<div class="ov-modal__media">' +
          '<img src="' + imgSrc + '" alt="Cuero con firma Ofelia Vallejo" width="460" height="640" loading="lazy">' +
          '<span class="ov-modal__media-label">Leather House</span>' +
        '</div>' +
        '<div class="ov-modal__body">' +
          '<div class="ov-launch-form" id="ovLaunchFormWrap">' +
            '<p class="ov-modal__eyebrow">Lanzamiento de temporada</p>' +
            '<h2 class="ov-modal__title" id="ovLaunchTitle">Tu cupón de la casa.</h2>' +
            '<p class="ov-modal__sub">Déjanos tu correo. Te mostramos un código para tu primera pieza — sin crear cuenta.</p>' +
            '<form class="ov-modal__form" id="ovLaunchForm" novalidate>' +
              '<div class="ov-modal__field">' +
                '<input type="email" name="email" id="ovLaunchEmail" placeholder="Tu correo" autocomplete="email" required>' +
              '</div>' +
              '<button type="submit" class="ov-modal__submit">Recibir cupón →</button>' +
            '</form>' +
            '<p class="ov-modal__notice" id="ovLaunchNotice" aria-live="polite"></p>' +
            '<p class="ov-modal__legal">Solo novedades y el cupón. Sin spam. <a href="' + assetPath('contacto.html') + '">Privacidad</a>.</p>' +
          '</div>' +
          '<div class="ov-launch-success" id="ovLaunchSuccess" hidden>' +
            '<p class="ov-modal__eyebrow">Listo</p>' +
            '<h2 class="ov-modal__title">Tu cupón.</h2>' +
            '<p class="ov-launch-discount" id="ovLaunchDiscount"></p>' +
            '<div class="ov-launch-coupon">' +
              '<span class="ov-launch-coupon__label">Código</span>' +
              '<code class="ov-launch-coupon__code" id="ovLaunchCouponCode"></code>' +
              '<button type="button" class="ov-launch-coupon__copy" id="ovLaunchCopyBtn">Copiar</button>' +
            '</div>' +
            '<p class="ov-modal__sub">Preséntalo al consultar por WhatsApp o en tu pedido. Válido en lanzamiento de temporada.</p>' +
            '<a href="/coleccion" class="ov-modal__submit ov-launch-cta">Ver colección →</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    modalEl = root;

    root.querySelector('.ov-modal__close').addEventListener('click', closeModal);
    root.addEventListener('click', (e) => {
      if (e.target === root) closeModal();
    });

    document.getElementById('ovLaunchForm').addEventListener('submit', onSubmit);
    document.getElementById('ovLaunchCopyBtn').addEventListener('click', copyCoupon);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
    });
  }

  function showNotice(msg, ok) {
    const n = document.getElementById('ovLaunchNotice');
    if (!n) return;
    n.textContent = msg;
    n.className = 'ov-modal__notice ' + (ok ? 'is-ok' : 'is-err');
  }

  function showSuccess(couponCode, discountLabel) {
    document.getElementById('ovLaunchFormWrap').hidden = true;
    const success = document.getElementById('ovLaunchSuccess');
    success.hidden = false;
    document.getElementById('ovLaunchCouponCode').textContent = couponCode;
    document.getElementById('ovLaunchDiscount').textContent = discountLabel || '';
    document.getElementById('ovLaunchTitle').textContent = 'Tu cupón.';
  }

  function copyCoupon() {
    const code = document.getElementById('ovLaunchCouponCode')?.textContent;
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => {
        const btn = document.getElementById('ovLaunchCopyBtn');
        if (btn) {
          btn.textContent = 'Copiado';
          setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
        }
      },
      () => showNotice('Copia el código manualmente.', false)
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('ovLaunchEmail');
    const email = input && input.value.trim();
    if (!email) {
      showNotice('Escribe tu correo.', false);
      return;
    }

    showNotice('Un momento…', true);

    let payload = null;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.ok) {
        payload = {
          email,
          couponCode: json.couponCode,
          discountLabel: json.discountLabel,
        };
      } else {
        showNotice(json.error || 'No se pudo registrar.', false);
        return;
      }
    } catch {
      payload = {
        email,
        couponCode: 'OV-TEMPORADA',
        discountLabel: '10% en tu primera pieza · lanzamiento de temporada',
      };
    }

    saveSubscribed(payload);
    showSuccess(payload.couponCode, payload.discountLabel);
    localStorage.setItem(KEY_POPUP, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }

  function openModal() {
    buildModal();
    const saved = getSubscribed();
    if (saved && saved.couponCode) {
      showSuccess(saved.couponCode, saved.discountLabel);
    }
    modalEl.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => {
      const el = document.getElementById('ovLaunchEmail');
      if (el && !saved) el.focus();
    }, 400);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    localStorage.setItem(KEY_POPUP, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }

  function maybeAutoPopup() {
    if (!document.body.hasAttribute('data-ov-popup')) return;
    if (document.body.classList.contains('intro-active')) return;
    if (isSubscribed()) return;
    const until = parseInt(localStorage.getItem(KEY_POPUP) || '0', 10);
    if (Date.now() < until) return;
    setTimeout(openModal, 2400);
  }

  window.OVLaunch = { open: openModal, close: closeModal };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeAutoPopup);
  } else {
    maybeAutoPopup();
  }
})();
