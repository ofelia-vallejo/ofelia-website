/* UI bolsa · drawer lateral (Shopify cart drawer) */

(function () {
  const DRAWER_ID = 'ovCartDrawer';
  const OVERLAY_ID = 'ovCartOverlay';

  function assetPath(rel) {
    const isSub = window.location.pathname.includes('/producto/');
    if (isSub) return '../' + rel.replace(/^\//, '');
    return rel.startsWith('/') ? rel.slice(1) : rel;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function injectNavbar() {
    const right = document.querySelector('.navbar__right');
    if (!right || document.getElementById('navCartBtn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'navCartBtn';
    btn.className = 'nav-cart-btn';
    btn.setAttribute('aria-label', 'Bolsa de compra');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M6 7h15l-1.5 9h-12L6 7z"/>' +
        '<path d="M6 7L5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>' +
      '</svg>' +
      '<span class="nav-cart-btn__count" id="navCartCount" hidden>0</span>';

    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) right.insertBefore(btn, menuBtn);
    else right.appendChild(btn);

    btn.addEventListener('click', openDrawer);
  }

  function buildDrawer() {
    if (document.getElementById(DRAWER_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'ov-cart-overlay';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('aside');
    drawer.id = DRAWER_ID;
    drawer.className = 'ov-cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'ovCartDrawerTitle');
    drawer.innerHTML =
      '<div class="ov-cart-drawer__head">' +
        '<h2 class="ov-cart-drawer__title" id="ovCartDrawerTitle">Bolsa</h2>' +
        '<button type="button" class="ov-cart-drawer__close" aria-label="Cerrar">×</button>' +
      '</div>' +
      '<div class="ov-cart-drawer__body" id="ovCartDrawerBody"></div>' +
      '<div class="ov-cart-drawer__foot" id="ovCartDrawerFoot" hidden>' +
        '<div class="ov-cart-subtotal">' +
          '<span>Subtotal</span>' +
          '<strong id="ovCartSubtotal">CHF 0</strong>' +
        '</div>' +
        '<p class="ov-cart-note">Envío e impuestos se calculan en el pago seguro · Stripe</p>' +
        '<a href="/checkout" class="ov-cart-cta" id="ovCartCheckoutBtn">Ir al pago →</a>' +
        '<button type="button" class="ov-cart-cta ov-cart-cta--ghost" id="ovCartContinueBtn">Seguir explorando</button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    drawer.querySelector('.ov-cart-drawer__close').addEventListener('click', closeDrawer);
    document.getElementById('ovCartContinueBtn').addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  function renderDrawer() {
    if (!window.OVCart) return;
    buildDrawer();
    const cart = OVCart.getCart();
    const body = document.getElementById('ovCartDrawerBody');
    const foot = document.getElementById('ovCartDrawerFoot');
    const title = document.getElementById('ovCartDrawerTitle');
    if (!body) return;

    if (title) {
      title.textContent = cart.isEmpty ? 'Bolsa' : 'Bolsa · ' + cart.totalQuantity;
    }

    if (cart.isEmpty) {
      body.innerHTML =
        '<div class="ov-cart-empty">' +
          '<p>Tu bolsa está vacía.</p>' +
          '<a href="/coleccion">Ver colección →</a>' +
        '</div>';
      if (foot) foot.hidden = true;
      return;
    }

    body.innerHTML = cart.lines
      .map(
        (line) =>
          '<article class="ov-cart-line" data-line-id="' + esc(line.id) + '">' +
            '<div class="ov-cart-line__media">' +
              (line.image
                ? '<img src="' + esc(line.image) + '" alt="" loading="lazy">'
                : '') +
            '</div>' +
            '<div>' +
              '<p class="ov-cart-line__name">' + esc(line.productName) + '</p>' +
              (line.variantLabel
                ? '<p class="ov-cart-line__variant">' + esc(line.variantLabel) + '</p>'
                : '') +
              (line.engraveText
                ? '<p class="ov-cart-line__engrave">Grabado · «' + esc(line.engraveText) + '»</p>'
                : '') +
              '<div class="ov-cart-line__row">' +
                '<div class="ov-cart-qty">' +
                  '<button type="button" data-qty="-1" aria-label="Menos">−</button>' +
                  '<span>' + esc(line.quantity) + '</span>' +
                  '<button type="button" data-qty="1" aria-label="Más">+</button>' +
                '</div>' +
                '<span class="ov-cart-line__price">' + esc(OVCart.formatCHF(OVCart.lineTotal(line))) + '</span>' +
              '</div>' +
              '<button type="button" class="ov-cart-line__remove" data-remove>Quitar</button>' +
            '</div>' +
          '</article>'
      )
      .join('');

    body.querySelectorAll('.ov-cart-line').forEach((row) => {
      const id = row.getAttribute('data-line-id');
      row.querySelectorAll('[data-qty]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const delta = Number(btn.getAttribute('data-qty'));
          const line = OVCart.getCart().lines.find((l) => l.id === id);
          if (!line) return;
          OVCart.updateLine(id, { quantity: (line.quantity || 1) + delta });
        });
      });
      const rm = row.querySelector('[data-remove]');
      if (rm) rm.addEventListener('click', () => OVCart.removeLine(id));
    });

    const sub = document.getElementById('ovCartSubtotal');
    if (sub) sub.textContent = OVCart.formatCHF(cart.cost.subtotalAmount.amount);
    if (foot) foot.hidden = false;
  }

  function updateBadge() {
    const badge = document.getElementById('navCartCount');
    if (!badge || !window.OVCart) return;
    const n = OVCart.getCart().totalQuantity;
    badge.textContent = String(n);
    badge.hidden = n <= 0;
  }

  function openDrawer() {
    buildDrawer();
    renderDrawer();
    document.getElementById(OVERLAY_ID).classList.add('is-open');
    document.getElementById(DRAWER_ID).classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeDrawer() {
    const overlay = document.getElementById(OVERLAY_ID);
    const drawer = document.getElementById(DRAWER_ID);
    if (overlay) overlay.classList.remove('is-open');
    if (drawer) drawer.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }

  function onCartChange() {
    updateBadge();
    const drawer = document.getElementById(DRAWER_ID);
    if (drawer && drawer.classList.contains('is-open')) renderDrawer();
  }

  function init() {
    if (!window.OVCart) return;
    injectNavbar();
    updateBadge();
    document.addEventListener('ov:cart:change', onCartChange);
  }

  window.OVCartUI = { open: openDrawer, close: closeDrawer, refresh: renderDrawer };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
