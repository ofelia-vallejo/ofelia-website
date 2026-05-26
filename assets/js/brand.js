/* Ofelia Vallejo — Shared JS Layer */

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
    const onDark = !!(el && el.closest('[data-dark]'));
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

  function open()  {
    panel.classList.add('is-open');
    overlay.classList.add('is-active');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-active');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', () => panel.classList.contains('is-open') ? close() : open());
  overlay.addEventListener('click', close);
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
})();
