/* ============================================================
   Ofelia Vallejo · GSAP Animation Layer
   Depende de: GSAP 3 + ScrollTrigger (CDN en home.html)
   Estilo: editorial fashion-house · cinematic · quiet luxury
   Inspiración: Framer motion · Loewe · Hermès
   ============================================================ */

(function () {
  'use strict';

  /* Verificar que GSAP esté disponible */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[OV Animations] GSAP o ScrollTrigger no encontrado.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── CONFIGURACIÓN GLOBAL ─────────────────────────────────── */
  const EASE_EDITORIAL = 'power3.out';
  const EASE_SOFT     = 'power2.out';
  const EASE_EXPO     = 'expo.out';
  const DURATION_HERO  = 1.1;
  const DURATION_STD   = 0.85;
  const STAGGER_CHARS  = 0.025;
  const STAGGER_WORDS  = 0.07;

  /* Reducir animaciones si el usuario lo prefiere */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    /* Mostrar todo sin animación */
    document.querySelectorAll('.reveal, .ov-reveal, .ov-char, .ov-word').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  /* ── SPLIT TEXT HELPER ────────────────────────────────────── */
  /* Divide un elemento en spans por palabra para animaciones */
  function splitByWords(el, className) {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = words.map(w =>
      `<span class="${className}" style="display:inline-block;overflow:hidden;"><span class="${className}__inner" style="display:inline-block;">${w}</span></span>`
    ).join(' ');
    return el.querySelectorAll(`.${className}__inner`);
  }

  /* ── LIMPIAR REVEAL CSS BASE (GSAP toma el control) ─────── */
  /* Los elementos con clase reveal ya tienen opacity:0 en CSS.
     GSAP los maneja ahora — quitamos la transición CSS para evitar conflictos */
  document.querySelectorAll('.reveal').forEach(el => {
    el.style.transition = 'none';
  });

  /* ── 01 · HERO GENDER PANELS · Entrada en página ───────────
     Animación cinematográfica de entrada:
     - Imagen: escala de 1.06 → 1 con fade
     - Título: sube desde abajo con stagger de palabras
     - CTA: fade con delay
  ─────────────────────────────────────────────────────────── */
  function initHeroEntrance() {
    const panels = document.querySelectorAll('.gender__panel');
    if (!panels.length) return;

    panels.forEach((panel, i) => {
      const photo  = panel.querySelector('.gender__photo');
      const label  = panel.querySelector('.gender__label');
      const title  = panel.querySelector('.gender__title');
      const sub    = panel.querySelector('.gender__sub');
      const cta    = panel.querySelector('.gender__cta');
      const media  = panel.querySelector('.gender__media');

      /* Limpiar reveal CSS */
      panel.style.opacity = '1';
      panel.style.transform = 'none';

      const delay = i * 0.18;

      /* Imagen: escala + fade */
      if (photo) {
        gsap.fromTo(photo,
          { scale: 1.07, opacity: 0 },
          { scale: 1, opacity: 1, duration: DURATION_HERO + 0.3, ease: EASE_EXPO, delay: delay + 0.1 }
        );
      }

      /* Label */
      if (label) {
        gsap.fromTo(label,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: DURATION_STD, ease: EASE_EDITORIAL, delay: delay + 0.3 }
        );
      }

      /* Título: split por palabras */
      if (title) {
        const words = splitByWords(title, 'hero-word');
        gsap.fromTo(words,
          { y: '110%', opacity: 0 },
          { y: '0%', opacity: 1, duration: DURATION_HERO, ease: EASE_EDITORIAL, stagger: STAGGER_WORDS, delay: delay + 0.45 }
        );
      }

      /* Sub */
      if (sub) {
        gsap.fromTo(sub,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: DURATION_STD, ease: EASE_SOFT, delay: delay + 0.75 }
        );
      }

      /* CTA */
      if (cta) {
        gsap.fromTo(cta,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.6, ease: EASE_SOFT, delay: delay + 0.92 }
        );
      }
    });

    /* Divider vertical: dibuja desde arriba */
    const divider = document.querySelector('.gender__divider');
    if (divider) {
      gsap.fromTo(divider,
        { scaleY: 0, transformOrigin: 'top center' },
        { scaleY: 1, duration: 1.4, ease: EASE_EXPO, delay: 0.6 }
      );
    }
  }

  /* ── 02 · PARALLAX EN IMÁGENES HERO ─────────────────────── */
  function initParallax() {
    const heroPhotos = document.querySelectorAll('.gender__photo');
    heroPhotos.forEach(photo => {
      gsap.to(photo, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: photo.closest('.gender__panel'),
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      });
    });

    /* Parallax suave en banner-cuero__photo */
    const cueroPhoto = document.querySelector('.banner-cuero__photo');
    if (cueroPhoto) {
      gsap.to(cueroPhoto, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: '.banner-cuero',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        }
      });
    }
  }

  /* ── 03 · BANNER STATEMENT "Nacida de una firma" ───────────
     - Línea horizontal: dibuja de izquierda a derecha
     - Título: reveal letra a letra (muy editorial)
     - Watermark: fade + escala suave
     - Body: slide up
  ─────────────────────────────────────────────────────────── */
  function initBannerStatement() {
    const section = document.querySelector('.banner-statement');
    if (!section) return;

    /* Limpiar reveal heredado */
    section.style.opacity   = '1';
    section.style.transform = 'none';

    const rule      = section.querySelector('.banner-statement__rule');
    const title     = section.querySelector('.banner-statement__title');
    const watermark = section.querySelector('.banner-statement__watermark');
    const body      = section.querySelector('.banner-statement__body');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 72%',
        toggleActions: 'play none none none',
      }
    });

    /* Regla horizontal */
    if (rule) {
      tl.fromTo(rule,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.9, ease: EASE_EXPO },
        0
      );
    }

    /* Título letra a letra */
    if (title) {
      const titleLink = title.querySelector('a') || title;
      const chars = splitByWords(titleLink, 'stmt-word');
      tl.fromTo(chars,
        { y: '105%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.9, ease: EASE_EDITORIAL, stagger: 0.08 },
        0.1
      );
    }

    /* Watermark */
    if (watermark) {
      tl.fromTo(watermark,
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, duration: 1.1, ease: EASE_SOFT },
        0.3
      );
    }

    /* Body */
    if (body) {
      tl.fromTo(body,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE_SOFT },
        0.5
      );
    }
  }

  /* ── 04 · SECCIÓN EDIT / COLECCIÓN ─────────────────────────
     - Imágenes: clip-path reveal (de abajo hacia arriba — patrón Loewe)
     - Meta / nombre producto: stagger slide
     - Strip cards: escalonado
  ─────────────────────────────────────────────────────────── */
  function initEditSection() {
    const editSection = document.querySelector('.edit');
    if (!editSection) return;

    editSection.style.opacity   = '1';
    editSection.style.transform = 'none';

    /* Cabecera de sección */
    const head = editSection.querySelector('.edit__head');
    if (head) {
      gsap.fromTo(head,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: EASE_SOFT,
          scrollTrigger: { trigger: head, start: 'top 88%' }
        }
      );
    }

    /* Imágenes hero de cada lado: clip-path */
    editSection.querySelectorAll('.edit__side .media').forEach((media, i) => {
      const frame = media.querySelector('.media__frame');
      if (!frame) return;

      gsap.fromTo(frame,
        { clipPath: 'inset(100% 0 0 0)', opacity: 1 },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.0,
          ease: EASE_EXPO,
          delay: i * 0.15,
          scrollTrigger: { trigger: media, start: 'top 82%' }
        }
      );

      /* Meta del producto */
      const meta = media.querySelector('.meta');
      if (meta) {
        gsap.fromTo(meta,
          { opacity: 0, y: 14 },
          {
            opacity: 1, y: 0, duration: 0.65, ease: EASE_SOFT,
            delay: i * 0.15 + 0.4,
            scrollTrigger: { trigger: media, start: 'top 82%' }
          }
        );
      }
    });

    /* Strip cards: stagger horizontal */
    editSection.querySelectorAll('.edit__side .strip > a').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          ease: EASE_SOFT,
          delay: i * 0.09,
          scrollTrigger: { trigger: card, start: 'top 92%' }
        }
      );
    });
  }

  /* ── 05 · BANNER CUERO "Hecho para durar" ──────────────────
     - Body text: stagger de líneas
     - CTA: dibuja su borde inferior al entrar
  ─────────────────────────────────────────────────────────── */
  function initBannerCuero() {
    const banner = document.querySelector('.banner-cuero');
    if (!banner) return;

    banner.style.opacity   = '1';
    banner.style.transform = 'none';

    const label = banner.querySelector('.banner-cuero__label');
    const title = banner.querySelector('.banner-cuero__title');
    const copy  = banner.querySelector('.banner-cuero__copy');
    const cta   = banner.querySelector('.banner-cuero__cta');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: banner, start: 'top 68%' }
    });

    if (label) tl.fromTo(label,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: EASE_SOFT }, 0
    );

    if (title) {
      const words = splitByWords(title, 'cuero-word');
      tl.fromTo(words,
        { y: '100%' },
        { y: '0%', duration: 0.85, ease: EASE_EDITORIAL, stagger: 0.06 }, 0.1
      );
    }

    if (copy) tl.fromTo(copy,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.7, ease: EASE_SOFT }, 0.4
    );

    if (cta) {
      /* El CTA dibuja su línea inferior */
      gsap.set(cta, { borderBottomColor: 'transparent' });
      tl.fromTo(cta,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_SOFT,
          onComplete: () => {
            gsap.to(cta, { borderBottomColor: 'rgba(11,31,58,0.25)', duration: 0.4 });
          }
        }, 0.65
      );
    }
  }

  /* ── 06 · BANNER CUSTOM "Tu nombre. En cuero." ─────────────
     - Fondo navy: el texto aparece con reveal masivo
     - Título grande: palabra a palabra
     - CTA button: border draw animation
  ─────────────────────────────────────────────────────────── */
  function initBannerCustom() {
    const banner = document.querySelector('.banner-custom');
    if (!banner) return;

    banner.style.opacity   = '1';
    banner.style.transform = 'none';

    const label = banner.querySelector('.banner-custom__label');
    const title = banner.querySelector('.banner-custom__title');
    const sub   = banner.querySelector('.banner-custom__sub');
    const cta   = banner.querySelector('.banner-custom__cta');

    const tl = gsap.timeline({
      scrollTrigger: { trigger: banner, start: 'top 70%' }
    });

    if (label) tl.fromTo(label,
      { opacity: 0, letterSpacing: '0.5em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 0.8, ease: EASE_SOFT }, 0
    );

    if (title) {
      const words = splitByWords(title, 'custom-word');
      tl.fromTo(words,
        { y: '105%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1.0, ease: EASE_EDITORIAL, stagger: 0.08 }, 0.2
      );
    }

    if (sub) tl.fromTo(sub,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: EASE_SOFT }, 0.55
    );

    if (cta) {
      /* Border draw: escala desde 0 → 1 en X y Y */
      gsap.set(cta, { '--border-progress': 0, opacity: 0, scale: 0.97 });
      tl.fromTo(cta,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.55, ease: EASE_SOFT }, 0.75
      );
    }
  }

  /* ── 07 · CURSOR MAGNÉTICO (upgrade del cursor existente) ──
     El cursor ya está en brand.js. Aquí solo agregamos el
     efecto magnético en botones CTA específicos.
  ─────────────────────────────────────────────────────────── */
  function initMagneticButtons() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const magnets = document.querySelectorAll('.banner-custom__cta, .gender__cta, .banner-cuero__cta');

    magnets.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.22;
        const dy = (e.clientY - cy) * 0.22;
        gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: EASE_SOFT });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ── 08 · MARQUEE / TICKER EDITORIAL ───────────────────────
     Agrega un ticker continuo si existe .ov-marquee en el HTML
  ─────────────────────────────────────────────────────────── */
  function initMarquee() {
    const marquees = document.querySelectorAll('.ov-marquee');
    marquees.forEach(el => {
      const inner = el.querySelector('.ov-marquee__inner');
      if (!inner) return;

      /* Duplicar para loop continuo */
      const clone = inner.cloneNode(true);
      el.appendChild(clone);

      const width = inner.scrollWidth;
      gsap.to(el.querySelectorAll('.ov-marquee__inner'), {
        x: `-${width}px`,
        duration: 28,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(x => parseFloat(x) % width)
        }
      });
    });
  }

  /* ── 09 · REVEAL GENÉRICO PARA OTRAS PÁGINAS ───────────────
     Reemplaza el IntersectionObserver de brand.js con GSAP
     para elementos con clase .reveal que no tengan animación específica
  ─────────────────────────────────────────────────────────── */
  function initGenericReveals() {
    /* Los reveals del hero los maneja initHeroEntrance */
    /* Aquí tratamos solo los que no tienen animación específica */
    const handled = new Set([
      '.banner-statement', '.edit', '.banner-cuero', '.banner-custom'
    ]);

    document.querySelectorAll('.reveal').forEach(el => {
      const isHandled = [...handled].some(sel => el.matches(sel));
      if (isHandled) return;

      /* Ya fueron procesados por su función específica */
      gsap.fromTo(el,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0,
          duration: DURATION_STD,
          ease: EASE_EDITORIAL,
          scrollTrigger: { trigger: el, start: 'top 82%' }
        }
      );
    });
  }

  /* ── 10 · NAVBAR · scroll behavior ─────────────────────────
     La navbar se vuelve más compacta y opaca al hacer scroll
  ─────────────────────────────────────────────────────────── */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 80) {
            navbar.style.backdropFilter = 'blur(12px)';
            navbar.style.background = 'rgba(243,238,230,0.92)';
            navbar.style.boxShadow  = '0 1px 0 rgba(11,31,58,0.08)';
          } else {
            navbar.style.backdropFilter = '';
            navbar.style.background = '';
            navbar.style.boxShadow  = '';
          }
          /* Ocultar al scroll hacia abajo / mostrar al subir */
          if (y > lastY + 10 && y > 200) {
            gsap.to(navbar, { yPercent: -100, duration: 0.35, ease: EASE_SOFT });
          } else if (y < lastY - 5) {
            gsap.to(navbar, { yPercent: 0, duration: 0.35, ease: EASE_SOFT });
          }
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── INICIALIZAR ────────────────────────────────────────── */
  function init() {
    /* Esperar a que el DOM esté listo */
    initHeroEntrance();
    initParallax();
    initBannerStatement();
    initEditSection();
    initBannerCuero();
    initBannerCustom();
    initMagneticButtons();
    initMarquee();
    initGenericReveals();
    initNavbarScroll();

    /* Refrescar ScrollTrigger tras imágenes cargadas */
    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
