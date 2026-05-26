/* Ofelia Vallejo — Shared JS Layer */

(function () {
  if (!document.documentElement.hasAttribute('data-accounts')) {
    document.documentElement.setAttribute('data-accounts', 'off');
  }
})();

/* Navbar · siempre firma cursiva (nunca sello circular) */
(function () {
  const FIRMA_SRC = '/assets/img/logo_firma_nav.png?v=2';
  const logoLink = document.querySelector('.navbar__logo');
  if (!logoLink) return;

  logoLink.querySelectorAll('img').forEach((el, i) => {
    if (i > 0) el.remove();
  });

  let img = logoLink.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    logoLink.appendChild(img);
  }

  img.alt = 'Ofelia Vallejo';
  img.className = 'navbar__firma';
  img.width = 280;
  img.height = 80;
  img.src = FIRMA_SRC;
  img.setAttribute('decoding', 'async');
  img.removeAttribute('style');
})();

(function () {
  const main =
    document.getElementById('main-content') ||
    document.getElementById('cuentaPage');
  if (!main || document.querySelector('.skip-link')) return;
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#' + main.id;
  skip.textContent = 'Ir al contenido';
  document.body.insertBefore(skip, document.body.firstChild);
})();

(function () {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  if (typeof IntersectionObserver === 'undefined') {
    reveals.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  reveals.forEach((el) => io.observe(el));
})();

(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = document.getElementById('cursor');
  if (!cursor) return;

  let mx = -100;
  let my = -100;
  let cx = -100;
  let cy = -100;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function tick() {
    cx = lerp(cx, mx, 0.45);
    cy = lerp(cy, my, 0.45);
    cursor.style.transform =
      'translate3d(' + (cx - cursor.offsetWidth / 2) + 'px,' +
      (cy - cursor.offsetHeight / 2) + 'px,0)';
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    const navOpen = document.documentElement.hasAttribute('data-nav-open');
    const onDark = navOpen || !!(el && el.closest('[data-dark]'));
    cursor.setAttribute('data-on-dark', onDark ? 'true' : 'false');
    cursor.classList.toggle('is-hover', !!(el && el.closest('a, button')));
  });

  requestAnimationFrame(tick);
})();

(function () {
  const btn     = document.getElementById('menuBtn');
  const panel   = document.getElementById('navPanel');
  const overlay = document.getElementById('navOverlay');
  if (!btn || !panel) return;
  const cursor = document.getElementById('cursor');

  panel.setAttribute('aria-hidden', 'true');

  function open()  {
    panel.classList.add('is-open');
    if (overlay) overlay.classList.add('is-active');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    document.documentElement.setAttribute('data-nav-open', 'true');
    document.body.style.overflow = 'hidden';
    if (cursor) cursor.setAttribute('data-on-dark', 'true');
  }
  function close() {
    panel.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-active');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    document.documentElement.removeAttribute('data-nav-open');
    document.body.style.overflow = '';
    btn.focus();
  }

  btn.addEventListener('click', () => panel.classList.contains('is-open') ? close() : open());
  if (overlay) overlay.addEventListener('click', close);
  panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });
})();
