/* Ofelia Vallejo — Cuenta · popup · atelier (MVP local) */

(function () {
  const KEY_ACCOUNTS = 'ov_accounts';
  const KEY_SESSION = 'ov_session';
  const KEY_POPUP = 'ov_popup_dismissed';
  const KEY_DRAFTS = 'ov_atelier_drafts';

  const IMG_MODAL = '/imagenes nuevas/detalle/firma-travel-bag-cognac.jpg';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function hashPassword(pw) {
    let h = 0;
    for (let i = 0; i < pw.length; i++) {
      h = ((h << 5) - h) + pw.charCodeAt(i);
      h |= 0;
    }
    return 'ov_' + Math.abs(h).toString(36);
  }

  function getAccounts() {
    return readJSON(KEY_ACCOUNTS, []);
  }

  function saveAccounts(list) {
    writeJSON(KEY_ACCOUNTS, list);
  }

  function getSession() {
    return readJSON(KEY_SESSION, null);
  }

  function setSession(user) {
    if (user) writeJSON(KEY_SESSION, user);
    else localStorage.removeItem(KEY_SESSION);
    syncNav();
    syncAtelier();
    document.dispatchEvent(new CustomEvent('ov:session', { detail: user }));
  }

  function register({ nombre, email, password }) {
    const accounts = getAccounts();
    const norm = email.trim().toLowerCase();
    if (accounts.some((a) => a.email === norm)) {
      return { ok: false, message: 'Este correo ya está registrado.' };
    }
    const user = {
      id: 'ov_' + Date.now().toString(36),
      nombre: nombre.trim(),
      email: norm,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };
    accounts.push(user);
    saveAccounts(accounts);
    setSession({ id: user.id, nombre: user.nombre, email: user.email });
    return { ok: true };
  }

  function login(email, password) {
    const norm = email.trim().toLowerCase();
    const accounts = getAccounts();
    const found = accounts.find(
      (a) => a.email === norm && a.passwordHash === hashPassword(password)
    );
    if (!found) {
      return { ok: false, message: 'Correo o contraseña incorrectos.' };
    }
    setSession({ id: found.id, nombre: found.nombre, email: found.email });
    return { ok: true };
  }

  function logout() {
    setSession(null);
  }

  function isLoggedIn() {
    return !!getSession();
  }

  function getDrafts(userId) {
    const all = readJSON(KEY_DRAFTS, {});
    return all[userId] || [];
  }

  function saveDraft(draft) {
    const session = getSession();
    if (!session) return false;
    const all = readJSON(KEY_DRAFTS, {});
    const list = all[session.id] || [];
    const entry = {
      id: draft.id || 'd_' + Date.now().toString(36),
      pieza: draft.pieza || '',
      texto: draft.texto || '',
      producto: draft.producto || '',
      updatedAt: new Date().toISOString()
    };
    const idx = list.findIndex((d) => d.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.unshift(entry);
    all[session.id] = list.slice(0, 12);
    writeJSON(KEY_DRAFTS, all);
    return entry;
  }

  window.OVAccount = {
    getSession,
    isLoggedIn,
    login,
    register,
    logout,
    saveDraft,
    getDrafts,
    openModal,
    closeModal
  };

  let modalEl = null;
  let activeTab = 'register';

  function assetPath(rel) {
    const depth = (window.location.pathname.match(/\//g) || []).length;
    const isSub = window.location.pathname.includes('/producto/');
    if (isSub) return '../' + rel;
    if (depth > 2) return rel.replace(/^\//, '');
    return rel.startsWith('/') ? rel.slice(1) : rel;
  }

  function cuentaHref() {
    const isSub = window.location.pathname.includes('/producto/');
    return isSub ? '../cuenta.html' : '/cuenta.html';
  }

  function personalizarHref() {
    const isSub = window.location.pathname.includes('/producto/');
    return isSub ? '../personalizar.html' : '/personalizar.html';
  }

  function buildModal() {
    if (document.getElementById('ovAccountModal')) {
      modalEl = document.getElementById('ovAccountModal');
      return;
    }

    const imgSrc = encodeURI(assetPath(IMG_MODAL));
    const root = document.createElement('div');
    root.id = 'ovAccountModal';
    root.className = 'ov-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'ovModalTitle');
    root.innerHTML =
      '<div class="ov-modal__dialog">' +
        '<button type="button" class="ov-modal__close" aria-label="Cerrar">×</button>' +
        '<div class="ov-modal__media">' +
          '<img src="' + imgSrc + '" alt="Cuero con firma Ofelia Vallejo grabada a láser" width="460" height="640" loading="lazy">' +
          '<span class="ov-modal__media-label">Leather House</span>' +
        '</div>' +
        '<div class="ov-modal__body">' +
          '<p class="ov-modal__eyebrow">Atelier Ofelia Vallejo</p>' +
          '<h2 class="ov-modal__title" id="ovModalTitle">Tu nombre. En cuero.</h2>' +
          '<p class="ov-modal__sub">Regístrate para guardar bocetos de grabado, seguir solicitudes y recibir novedades de la casa — sin ruido comercial.</p>' +
          '<div class="ov-modal__tabs" role="tablist">' +
            '<button type="button" class="ov-modal__tab is-active" data-tab="register" role="tab">Crear cuenta</button>' +
            '<button type="button" class="ov-modal__tab" data-tab="login" role="tab">Iniciar sesión</button>' +
          '</div>' +
          '<div class="ov-modal__panel is-active" data-panel="register">' +
            '<form class="ov-modal__form" id="ovFormRegister" novalidate>' +
              '<div class="ov-modal__field"><input type="text" name="nombre" placeholder="Nombre" autocomplete="name" required></div>' +
              '<div class="ov-modal__field"><input type="email" name="email" placeholder="Correo" autocomplete="email" required></div>' +
              '<div class="ov-modal__field"><input type="password" name="password" placeholder="Contraseña" autocomplete="new-password" minlength="6" required></div>' +
              '<button type="submit" class="ov-modal__submit">Crear cuenta</button>' +
            '</form>' +
          '</div>' +
          '<div class="ov-modal__panel" data-panel="login">' +
            '<form class="ov-modal__form" id="ovFormLogin" novalidate>' +
              '<div class="ov-modal__field"><input type="email" name="email" placeholder="Correo" autocomplete="email" required></div>' +
              '<div class="ov-modal__field"><input type="password" name="password" placeholder="Contraseña" autocomplete="current-password" required></div>' +
              '<button type="submit" class="ov-modal__submit">Entrar al atelier</button>' +
            '</form>' +
          '</div>' +
          '<p class="ov-modal__notice" id="ovModalNotice" aria-live="polite"></p>' +
          '<p class="ov-modal__legal">Al registrarte aceptas nuestra <a href="' + assetPath('contacto.html') + '">política de privacidad</a>. Puedes darte de baja en cualquier momento.</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    modalEl = root;

    root.querySelector('.ov-modal__close').addEventListener('click', closeModal);
    root.addEventListener('click', (e) => {
      if (e.target === root) closeModal();
    });

    root.querySelectorAll('.ov-modal__tab').forEach((tab) => {
      tab.addEventListener('click', () => setModalTab(tab.getAttribute('data-tab')));
    });

    document.getElementById('ovFormRegister').addEventListener('submit', onRegisterSubmit);
    document.getElementById('ovFormLogin').addEventListener('submit', onLoginSubmit);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
    });
  }

  function setModalTab(tab) {
    activeTab = tab;
    if (!modalEl) return;
    modalEl.querySelectorAll('.ov-modal__tab').forEach((t) => {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === tab);
    });
    modalEl.querySelectorAll('.ov-modal__panel').forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-panel') === tab);
    });
    const title = modalEl.querySelector('#ovModalTitle');
    const sub = modalEl.querySelector('.ov-modal__sub');
    if (tab === 'login') {
      title.textContent = 'Vuelve al atelier.';
      sub.textContent = 'Accede para retomar bocetos de grabado y solicitudes guardadas.';
    } else {
      title.textContent = 'Tu nombre. En cuero.';
      sub.textContent = 'Regístrate para guardar bocetos de grabado, seguir solicitudes y recibir novedades de la casa — sin ruido comercial.';
    }
    clearNotice();
  }

  function clearNotice() {
    const n = document.getElementById('ovModalNotice');
    if (n) {
      n.textContent = '';
      n.className = 'ov-modal__notice';
    }
  }

  function showNotice(msg, ok) {
    const n = document.getElementById('ovModalNotice');
    if (!n) return;
    n.textContent = msg;
    n.className = 'ov-modal__notice ' + (ok ? 'is-ok' : 'is-err');
  }

  function onRegisterSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nombre = fd.get('nombre');
    const email = fd.get('email');
    const password = fd.get('password');
    if (!nombre || !email || !password) {
      showNotice('Completa todos los campos.', false);
      return;
    }
    if (String(password).length < 6) {
      showNotice('La contraseña debe tener al menos 6 caracteres.', false);
      return;
    }
    const res = register({ nombre, email, password });
    if (!res.ok) {
      showNotice(res.message, false);
      return;
    }
    showNotice('Cuenta creada. Bienvenida al atelier.', true);
    setTimeout(() => {
      closeModal();
      if (window.location.pathname.includes('personalizar')) {
        syncAtelier();
        document.getElementById('atelier')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = personalizarHref() + '#atelier';
      }
    }, 700);
  }

  function onLoginSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = login(fd.get('email'), fd.get('password'));
    if (!res.ok) {
      showNotice(res.message, false);
      return;
    }
    showNotice('Sesión iniciada.', true);
    setTimeout(() => {
      closeModal();
      syncAtelier();
      prefillPersonalizarForm();
    }, 600);
  }

  function openModal(tab) {
    buildModal();
    if (tab) setModalTab(tab);
    modalEl.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    localStorage.setItem(KEY_POPUP, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    clearNotice();
  }

  function maybeAutoPopup() {
    if (isLoggedIn()) return;
    const page = document.body.getAttribute('data-ov-popup');
    if (!page) return;
    const until = parseInt(localStorage.getItem(KEY_POPUP) || '0', 10);
    if (Date.now() < until) return;
    setTimeout(() => openModal('register'), 2200);
  }

  function syncNav() {
    const right = document.querySelector('.navbar__right');
    if (!right) return;
    let link = document.getElementById('navAccountLink');
    const session = getSession();

    if (!link) {
      link = document.createElement('a');
      link.id = 'navAccountLink';
      link.className = 'nav-account';
      const menuBtn = document.getElementById('menuBtn');
      if (menuBtn) right.insertBefore(link, menuBtn);
      else right.appendChild(link);
    }

    if (session) {
      link.textContent = 'Mi atelier';
      link.href = personalizarHref() + '#atelier';
      link.classList.add('is-active');
    } else {
      link.textContent = 'Cuenta';
      link.href = cuentaHref();
      link.classList.remove('is-active');
    }

    const panel = document.getElementById('navPanel');
    if (panel && !panel.querySelector('[data-nav-cuenta]')) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = cuentaHref();
      a.setAttribute('data-nav-cuenta', 'true');
      a.textContent = session ? 'Mi atelier' : 'Cuenta';
      li.appendChild(a);
      const ul = panel.querySelector('ul');
      if (ul) ul.appendChild(li);
    }
  }

  function syncAtelier() {
    const gate = document.getElementById('atelierGate');
    const desk = document.getElementById('atelierDesk');
    if (!gate && !desk) return;

    const session = getSession();
    if (session) {
      if (gate) gate.hidden = true;
      if (desk) {
        desk.hidden = false;
        const nameEl = document.getElementById('atelierUserName');
        if (nameEl) nameEl.textContent = session.nombre;
        renderDrafts(session.id);
      }
    } else {
      if (gate) gate.hidden = false;
      if (desk) desk.hidden = true;
    }
    prefillPersonalizarForm();
  }

  function renderDrafts(userId) {
    const listEl = document.getElementById('atelierDraftList');
    if (!listEl) return;
    const drafts = getDrafts(userId);
    if (!drafts.length) {
      listEl.innerHTML = '<p class="atelier-draft">Aún no hay bocetos guardados. Completa el formulario y usa «Guardar boceto».</p>';
      return;
    }
    listEl.innerHTML = drafts.map((d) => {
      const date = new Date(d.updatedAt).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      return (
        '<div class="atelier-draft">' +
          '<strong>' + escapeHtml(d.pieza || 'Boceto') + '</strong>' +
          escapeHtml(d.texto ? '«' + d.texto + '»' : 'Sin texto de grabado') +
          '<div class="atelier-draft__meta">' + escapeHtml(date) +
            (d.producto ? ' · ' + escapeHtml(d.producto) : '') +
          '</div>' +
          '<button type="button" class="atelier-draft__load" data-draft-id="' + d.id + '">Cargar en formulario</button>' +
        '</div>'
      );
    }).join('');

    listEl.querySelectorAll('[data-draft-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-draft-id');
        const draft = drafts.find((d) => d.id === id);
        if (draft) loadDraftIntoForm(draft);
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadDraftIntoForm(draft) {
    const form = document.getElementById('form-personalizar');
    if (!form) return;
    const producto = form.querySelector('[name="producto"]');
    const texto = form.querySelector('[name="texto_grabado"]');
    if (texto && draft.texto) {
      texto.value = draft.texto;
      texto.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (producto && draft.pieza) {
      for (let i = 0; i < producto.options.length; i++) {
        if (producto.options[i].value === draft.pieza) {
          producto.selectedIndex = i;
          break;
        }
      }
    }
    document.getElementById('solicitud-formulario')?.scrollIntoView({ behavior: 'smooth' });
  }

  function prefillPersonalizarForm() {
    const session = getSession();
    if (!session) return;
    const form = document.getElementById('form-personalizar');
    if (!form) return;
    const nombre = form.querySelector('[name="nombre"]');
    const email = form.querySelector('[name="email"]');
    if (nombre && !nombre.value) nombre.value = session.nombre;
    if (email && !email.value) email.value = session.email;
  }

  function bindAtelierUI() {
    document.getElementById('atelierOpenLogin')?.addEventListener('click', () => openModal('login'));
    document.getElementById('atelierOpenRegister')?.addEventListener('click', () => openModal('register'));
    document.getElementById('atelierLogout')?.addEventListener('click', () => {
      logout();
      syncAtelier();
    });
    document.getElementById('atelierSaveDraft')?.addEventListener('click', () => {
      if (!isLoggedIn()) {
        openModal('register');
        return;
      }
      const form = document.getElementById('form-personalizar');
      if (!form) return;
      const fd = new FormData(form);
      saveDraft({
        pieza: fd.get('producto') || 'Solicitud',
        texto: fd.get('texto_grabado') || '',
        producto: new URLSearchParams(window.location.search).get('producto') || ''
      });
      const session = getSession();
      if (session) renderDrafts(session.id);
      const note = document.getElementById('atelierSaveNote');
      if (note) {
        note.textContent = 'Boceto guardado en tu atelier.';
        setTimeout(() => { note.textContent = ''; }, 3000);
      }
    });

    document.querySelectorAll('[data-ov-open-account]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = el.getAttribute('data-ov-tab') || 'register';
        openModal(tab);
      });
    });
  }

  function bindCuentaPage() {
    const page = document.getElementById('cuentaPage');
    if (!page) return;

    page.querySelectorAll('.ov-modal__tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-tab');
        page.querySelectorAll('.ov-modal__tab').forEach((x) => {
          x.classList.toggle('is-active', x.getAttribute('data-tab') === t);
        });
        page.querySelectorAll('.ov-modal__panel').forEach((p) => {
          p.classList.toggle('is-active', p.getAttribute('data-panel') === t);
        });
      });
    });

    const notice = document.getElementById('cuentaNotice');
    function showPageNotice(msg, ok) {
      if (!notice) return;
      notice.textContent = msg;
      notice.className = 'ov-modal__notice ' + (ok ? 'is-ok' : 'is-err');
    }

    document.getElementById('cuentaFormRegister')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = register({
        nombre: fd.get('nombre'),
        email: fd.get('email'),
        password: fd.get('password')
      });
      if (!res.ok) showPageNotice(res.message, false);
      else {
        showPageNotice('Cuenta creada.', true);
        setTimeout(() => { window.location.href = personalizarHref() + '#atelier'; }, 800);
      }
    });

    document.getElementById('cuentaFormLogin')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = login(fd.get('email'), fd.get('password'));
      if (!res.ok) showPageNotice(res.message, false);
      else {
        showPageNotice('Sesión iniciada.', true);
        setTimeout(() => { window.location.href = personalizarHref() + '#atelier'; }, 800);
      }
    });

    if (isLoggedIn()) {
      const session = getSession();
      showPageNotice('Ya tienes sesión como ' + session.nombre + '.', true);
    }

    function activatePageTab(tab) {
      page.querySelectorAll('.ov-modal__tab').forEach((x) => {
        x.classList.toggle('is-active', x.getAttribute('data-tab') === tab);
      });
      page.querySelectorAll('.ov-modal__panel').forEach((p) => {
        p.classList.toggle('is-active', p.getAttribute('data-panel') === tab);
      });
    }

    if (window.location.hash === '#login') activatePageTab('login');
    if (window.location.hash === '#register') activatePageTab('register');
  }

  function init() {
    buildModal();
    syncNav();
    syncAtelier();
    bindAtelierUI();
    bindCuentaPage();
    maybeAutoPopup();

    if (window.location.hash === '#login') openModal('login');
    if (window.location.hash === '#register') openModal('register');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
