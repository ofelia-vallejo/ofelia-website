(function () {
  const TOKEN_KEY = 'ov_admin_token';
  const API = '/api';

  let catalog = { products: [], categories: [] };
  let editingId = null;

  const $ = (sel) => document.querySelector(sel);
  const viewLogin = $('#viewLogin');
  const viewApp = $('#viewApp');
  const loginForm = $('#loginForm');
  const loginNotice = $('#loginNotice');
  const productsTable = $('#productsTable');
  const inventoryTable = $('#inventoryTable');
  const statsRow = $('#statsRow');
  const mainTitle = $('#mainTitle');
  const mainActions = $('#mainActions');
  const productForm = $('#productForm');
  const formNotice = $('#formNotice');
  const imagesGrid = $('#imagesGrid');
  const variantsList = $('#variantsList');
  const fieldCategory = $('#fieldCategory');

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token(),
    };
  }

  async function api(path, options) {
    const res = await fetch(API + path, {
      ...options,
      headers: { ...authHeaders(), ...(options && options.headers) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || res.statusText);
    return json;
  }

  function showNotice(el, msg, ok) {
    el.textContent = msg || '';
    el.className = (el.className.split(' ')[0] || '') + (ok ? ' is-ok' : msg ? ' is-err' : '');
  }

  function showView(name) {
    $('#panelProducts').hidden = name !== 'products';
    $('#panelInventory').hidden = name !== 'inventory';
    $('#panelEdit').hidden = name !== 'edit';
  }

  function setNav(view) {
    document.querySelectorAll('.sidebar__link').forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-view') === view);
    });
    $('#navEdit').hidden = view !== 'edit';
  }

  function totalStock(p) {
    if (p.variants && p.variants.length) {
      return p.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
    }
    return Number(p.inventory) || 0;
  }

  function stockBadge(p) {
    const n = totalStock(p);
    const low = p.lowStockAt || 2;
    if (n <= 0) return '<span class="badge badge--out">Agotado</span>';
    if (n <= low) return '<span class="badge badge--low">Bajo</span>';
    return '<span class="badge badge--ok">' + n + '</span>';
  }

  function renderStats() {
    const products = catalog.products || [];
    const active = products.filter((p) => p.active).length;
    const low = products.filter((p) => totalStock(p) <= (p.lowStockAt || 2) && totalStock(p) > 0).length;
    const out = products.filter((p) => totalStock(p) <= 0).length;
    statsRow.innerHTML =
      '<div class="stat"><div class="stat__val">' + products.length + '</div><div class="stat__label">Piezas</div></div>' +
      '<div class="stat"><div class="stat__val">' + active + '</div><div class="stat__label">Activas</div></div>' +
      '<div class="stat"><div class="stat__val">' + low + '</div><div class="stat__label">Stock bajo</div></div>' +
      '<div class="stat"><div class="stat__val">' + out + '</div><div class="stat__label">Agotadas</div></div>';
  }

  function renderProductsTable() {
    renderStats();
    productsTable.innerHTML = (catalog.products || []).map((p) => {
      return (
        '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong><br><small>' + esc(p.slug) + '</small></td>' +
          '<td>' + esc(p.category) + '</td>' +
          '<td>CHF ' + p.basePrice + '</td>' +
          '<td>+ CHF ' + (p.engravePrice || 0) + '</td>' +
          '<td>' + stockBadge(p) + '</td>' +
          '<td><button type="button" class="btn btn--sm btn--ghost" data-edit="' + esc(p.id) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');

    productsTable.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => openEdit(btn.getAttribute('data-edit')));
    });
  }

  function renderInventoryTable() {
    const rows = [];
    (catalog.products || []).forEach((p) => {
      if (p.variants && p.variants.length) {
        p.variants.forEach((v) => {
          rows.push({ product: p, variant: v });
        });
      } else {
        rows.push({ product: p, variant: null });
      }
    });

    inventoryTable.innerHTML = rows.map(({ product, variant }) => {
      const sku = variant ? variant.sku : '—';
      const color = variant ? variant.colorName : 'Único';
      const inv = variant ? variant.inventory : product.inventory;
      const id = product.id;
      const vid = variant ? variant.id : '';
      const low = Number(inv) <= (product.lowStockAt || 2);
      return (
        '<tr data-pid="' + esc(id) + '" data-vid="' + esc(vid) + '">' +
          '<td>' + esc(sku) + '<br><small>' + esc(color) + '</small></td>' +
          '<td>' + esc(product.name) + '</td>' +
          '<td><input type="number" class="inv-input" value="' + inv + '" min="0" style="width:72px;padding:6px"></td>' +
          '<td>' + (Number(inv) <= 0 ? '<span class="badge badge--out">Agotado</span>' : low ? '<span class="badge badge--low">Bajo</span>' : '<span class="badge badge--ok">OK</span>') + '</td>' +
          '<td><button type="button" class="btn btn--sm inv-save">Guardar</button></td>' +
        '</tr>'
      );
    }).join('');

    inventoryTable.querySelectorAll('.inv-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const productId = tr.getAttribute('data-pid');
        const variantId = tr.getAttribute('data-vid') || undefined;
        const inventory = Number(tr.querySelector('.inv-input').value);
        try {
          await api('/admin/inventory', {
            method: 'PATCH',
            body: JSON.stringify({ productId, variantId, inventory }),
          });
          await loadCatalog();
          renderInventoryTable();
        } catch (e) {
          alert(e.message);
        }
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  async function loadCatalog() {
    const data = await api('/admin/products');
    catalog.products = data.products;
    catalog.categories = data.categories;
    catalog.currency = data.currency;
  }

  function fillCategories() {
    fieldCategory.innerHTML = (catalog.categories || []).map((c) => {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>';
    }).join('');
  }

  function renderVariants(variants) {
    variantsList.innerHTML = (variants || []).map((v, i) => variantRowHtml(v, i)).join('');
    bindVariantRows();
  }

  function variantRowHtml(v, i) {
    return (
      '<div class="variant-row" data-i="' + i + '">' +
        '<input type="text" placeholder="SKU" value="' + esc(v.sku || '') + '" data-f="sku">' +
        '<input type="text" placeholder="Color" value="' + esc(v.colorName || '') + '" data-f="colorName">' +
        '<input type="text" placeholder="#hex" value="' + esc(v.colorHex || '') + '" data-f="colorHex">' +
        '<input type="number" placeholder="Stock" value="' + (v.inventory != null ? v.inventory : 0) + '" data-f="inventory" min="0">' +
        '<button type="button" class="btn btn--sm btn--danger var-del">×</button>' +
      '</div>'
    );
  }

  function bindVariantRows() {
    variantsList.querySelectorAll('.var-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.closest('.variant-row').remove();
      });
    });
  }

  function collectVariants() {
    return Array.from(variantsList.querySelectorAll('.variant-row')).map((row, i) => ({
      id: 'v_' + i,
      sku: row.querySelector('[data-f="sku"]').value.trim(),
      colorName: row.querySelector('[data-f="colorName"]').value.trim(),
      colorHex: row.querySelector('[data-f="colorHex"]').value.trim(),
      inventory: Number(row.querySelector('[data-f="inventory"]').value) || 0,
      sort: i,
    }));
  }

  function renderImages(images) {
    imagesGrid.innerHTML = (images || []).map((img, i) => {
      return (
        '<div class="img-card" data-i="' + i + '">' +
          '<img src="' + esc(img.url) + '" alt="">' +
          '<div class="img-card__actions">' +
            '<button type="button" data-hero="' + i + '">Hero</button>' +
            '<button type="button" data-del="' + i + '">Quitar</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    imagesGrid.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-del'));
        const p = getFormProduct();
        p.images.splice(i, 1);
        renderImages(p.images);
      });
    });

    imagesGrid.querySelectorAll('[data-hero]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-hero'));
        const p = getFormProduct();
        const img = p.images.splice(i, 1)[0];
        img.kind = 'hero';
        img.sort = 0;
        p.images.forEach((x, j) => { x.sort = j + 1; x.kind = x.kind === 'hero' ? 'gallery' : x.kind; });
        p.images.unshift(img);
        renderImages(p.images);
      });
    });
  }

  let formProduct = null;

  function getFormProduct() {
    if (!formProduct) {
      formProduct = { images: [], variants: [] };
    }
    return formProduct;
  }

  function openEdit(id) {
    editingId = id;
    const p = id === 'new'
      ? {
          id: '',
          slug: '',
          name: '',
          shortDescription: '',
          description: '',
          category: 'mujer',
          line: '',
          numeral: '',
          active: true,
          personalizable: true,
          basePrice: 0,
          engravePrice: 0,
          inventory: 0,
          lowStockAt: 2,
          pdpPath: '',
          images: [],
          variants: [],
        }
      : catalog.products.find((x) => x.id === id);

    if (!p) return;

    formProduct = JSON.parse(JSON.stringify(p));

    $('#fieldId').value = p.id || '';
    $('#fieldName').value = p.name || '';
    $('#fieldSlug').value = p.slug || '';
    fieldCategory.value = p.category || 'mujer';
    $('#fieldLine').value = p.line || '';
    $('#fieldNumeral').value = p.numeral || '';
    $('#fieldPdpPath').value = p.pdpPath || '';
    $('#fieldShortDesc').value = p.shortDescription || '';
    $('#fieldDesc').value = p.description || '';
    $('#fieldBasePrice').value = p.basePrice || 0;
    $('#fieldEngravePrice').value = p.engravePrice || 0;
    $('#fieldInventory').value = p.inventory || 0;
    $('#fieldLowStock').value = p.lowStockAt || 2;
    $('#fieldActive').checked = p.active !== false;
    $('#fieldPersonalizable').checked = p.personalizable !== false;
    $('#btnDeleteProduct').hidden = id === 'new';

    renderVariants(formProduct.variants);
    renderImages(formProduct.images);

    mainTitle.textContent = id === 'new' ? 'Nueva pieza' : 'Editar · ' + p.name;
    setNav('edit');
    showView('edit');
  }

  function goProducts() {
    mainTitle.textContent = 'Productos';
    mainActions.innerHTML = '<button type="button" class="btn btn--primary" id="btnNewProduct">+ Nueva pieza</button>';
    $('#btnNewProduct').addEventListener('click', () => openEdit('new'));
    setNav('products');
    showView('products');
    renderProductsTable();
  }

  async function saveProduct(e) {
    e.preventDefault();
    const body = {
      id: $('#fieldId').value || undefined,
      name: $('#fieldName').value.trim(),
      slug: $('#fieldSlug').value.trim(),
      category: fieldCategory.value,
      line: $('#fieldLine').value.trim(),
      numeral: $('#fieldNumeral').value.trim(),
      pdpPath: $('#fieldPdpPath').value.trim(),
      shortDescription: $('#fieldShortDesc').value.trim(),
      description: $('#fieldDesc').value.trim(),
      basePrice: Number($('#fieldBasePrice').value),
      engravePrice: Number($('#fieldEngravePrice').value),
      inventory: Number($('#fieldInventory').value),
      lowStockAt: Number($('#fieldLowStock').value),
      active: $('#fieldActive').checked,
      personalizable: $('#fieldPersonalizable').checked,
      variants: collectVariants(),
      images: getFormProduct().images,
    };

    try {
      if (editingId === 'new') {
        body.id = body.slug;
        await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
        showNotice(formNotice, 'Producto creado.', true);
      } else {
        await api('/admin/products?id=' + encodeURIComponent(editingId), {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        showNotice(formNotice, 'Guardado correctamente.', true);
      }
      await loadCatalog();
      setTimeout(goProducts, 600);
    } catch (err) {
      showNotice(formNotice, err.message, false);
    }
  }

  async function uploadFiles(files) {
    const pid = $('#fieldId').value || $('#fieldSlug').value;
    if (!pid) {
      showNotice(formNotice, 'Guarda nombre y slug antes de subir fotos.', false);
      return;
    }

    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) {
        showNotice(formNotice, file.name + ' supera 4 MB.', false);
        continue;
      }
      const dataBase64 = await fileToBase64(file);
      try {
        const res = await api('/admin/upload', {
          method: 'POST',
          body: JSON.stringify({
            productId: pid,
            filename: file.name,
            contentType: file.type,
            dataBase64,
            alt: $('#fieldName').value,
            kind: getFormProduct().images.length ? 'gallery' : 'hero',
          }),
        });
        getFormProduct().images.push(res.image);
        renderImages(getFormProduct().images);
        showNotice(formNotice, 'Foto subida.', true);
      } catch (err) {
        showNotice(formNotice, err.message, false);
      }
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showNotice(loginNotice, '', true);
    try {
      const res = await fetch(API + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: $('#loginPassword').value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      localStorage.setItem(TOKEN_KEY, json.token);
      await initApp();
    } catch (err) {
      showNotice(loginNotice, err.message, false);
    }
  });

  $('#btnLogout').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    viewApp.hidden = true;
    viewLogin.hidden = false;
  });

  document.querySelectorAll('.sidebar__link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-view');
      if (v === 'products') goProducts();
      if (v === 'inventory') {
        mainTitle.textContent = 'Inventario';
        mainActions.innerHTML = '';
        setNav('inventory');
        showView('inventory');
        renderInventoryTable();
      }
      if (v === 'edit' && editingId) openEdit(editingId);
    });
  });

  $('#btnBackList').addEventListener('click', goProducts);
  productForm.addEventListener('submit', saveProduct);

  $('#btnDeleteProduct').addEventListener('click', async () => {
    if (!confirm('¿Eliminar este producto del catálogo?')) return;
    try {
      await api('/admin/products?id=' + encodeURIComponent(editingId), { method: 'DELETE' });
      await loadCatalog();
      goProducts();
    } catch (err) {
      showNotice(formNotice, err.message, false);
    }
  });

  $('#btnAddVariant').addEventListener('click', () => {
    variantsList.insertAdjacentHTML('beforeend', variantRowHtml({}, variantsList.children.length));
    bindVariantRows();
  });

  const uploadZone = $('#uploadZone');
  const fileInput = $('#fileInput');
  $('#btnPickFiles').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => uploadFiles(fileInput.files));
  uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('is-drag'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('is-drag'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('is-drag');
    uploadFiles(e.dataTransfer.files);
  });

  async function initApp() {
    try {
      await loadCatalog();
      fillCategories();
      viewLogin.hidden = true;
      viewApp.hidden = false;
      goProducts();
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      showNotice(loginNotice, err.message || 'Sesión expirada.', false);
      viewLogin.hidden = false;
      viewApp.hidden = true;
    }
  }

  if (token()) {
    initApp();
  }
})();
