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
  const categoriesTable = $('#categoriesTable');
  const inventoryTable = $('#inventoryTable');
  const categoriesNotice = $('#categoriesNotice');
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
    $('#panelCategories').hidden = name !== 'categories';
    $('#panelInventory').hidden = name !== 'inventory';
    $('#panelOrders').hidden = name !== 'orders';
    $('#panelDiscounts').hidden = name !== 'discounts';
    $('#panelEdit').hidden = name !== 'edit';
  }

  // Muestra el error del servidor, anteponiendo el campo si zod devolvió issues.
  function showServerError(el, err) {
    let msg = err.message || 'Error.';
    showNotice(el, msg, false);
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

  function productCode(p) {
    return (p.meta && p.meta.productCode) || '—';
  }

  function renderProductsTable() {
    renderStats();
    productsTable.innerHTML = (catalog.products || []).map((p) => {
      return (
        '<tr>' +
          '<td><code>' + esc(productCode(p)) + '</code><br><strong>' + esc(p.name) + '</strong><br><small>' + esc(p.slug) + '</small></td>' +
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
      const colorKey = variant && variant.colorKey ? variant.colorKey : '';
      const inv = variant ? variant.inventory : product.inventory;
      const id = product.id;
      const vid = variant ? variant.id : '';
      const low = Number(inv) <= (product.lowStockAt || 2);
      const code = productCode(product);
      return (
        '<tr data-pid="' + esc(id) + '" data-vid="' + esc(vid) + '">' +
          '<td><code>' + esc(code) + '</code><br>' + esc(sku) +
            (colorKey ? '<br><small>' + esc(colorKey) + ' · ' + esc(color) + '</small>' : '<br><small>' + esc(color) + '</small>') + '</td>' +
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
        const value = Number(tr.querySelector('.inv-input').value);
        try {
          await api('/admin/inventory', {
            method: 'PATCH',
            body: JSON.stringify({ productId, variantId, mode: 'set', value, reason: 'correction' }),
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

  function renderCategoriesTable() {
    const rows = (catalog.categories || [])
      .slice()
      .sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99));

    categoriesTable.innerHTML = rows.map((c) => {
      return (
        '<tr data-cat="' + esc(c.id) + '">' +
          '<td><code>' + esc(c.id) + '</code></td>' +
          '<td><input type="text" class="cat-label" value="' + esc(c.label) + '"></td>' +
          '<td><input type="number" class="cat-sort" min="1" step="1" value="' + (c.sort || 1) + '"></td>' +
          '<td><select class="cat-cols"><option value="3"' + (c.gridCols !== 2 ? ' selected' : '') + '>3</option><option value="2"' + (c.gridCols === 2 ? ' selected' : '') + '>2</option></select></td>' +
          '<td><input type="checkbox" class="cat-active"' + (c.active !== false ? ' checked' : '') + '></td>' +
        '</tr>'
      );
    }).join('');
  }

  function collectCategoriesFromTable() {
    return Array.from(categoriesTable.querySelectorAll('tr[data-cat]')).map((row) => ({
      id: row.getAttribute('data-cat'),
      label: row.querySelector('.cat-label').value.trim(),
      sort: Number(row.querySelector('.cat-sort').value) || 1,
      gridCols: Number(row.querySelector('.cat-cols').value) === 2 ? 2 : 3,
      active: row.querySelector('.cat-active').checked,
    }));
  }

  async function saveCategories() {
    try {
      const categories = collectCategoriesFromTable();
      await api('/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ categories }),
      });
      await loadCatalog();
      showNotice(categoriesNotice, 'Secciones guardadas. La colección web se actualiza al instante.', true);
      renderCategoriesTable();
      fillCategories();
    } catch (err) {
      showNotice(categoriesNotice, err.message, false);
    }
  }

  function goCategories() {
    mainTitle.textContent = 'Secciones de colección';
    mainActions.innerHTML = '';
    setNav('categories');
    showView('categories');
    renderCategoriesTable();
  }

  function renderVariants(variants) {
    variantsList.innerHTML = (variants || []).map((v, i) => variantRowHtml(v, i)).join('');
    bindVariantRows();
  }

  function variantRowHtml(v, i) {
    return (
      '<div class="variant-row" data-i="' + i + '">' +
        '<input type="hidden" value="' + esc(v.id || '') + '" data-f="id">' +
        '<input type="text" placeholder="SKU" value="' + esc(v.sku || '') + '" data-f="sku">' +
        '<input type="text" placeholder="colorKey" value="' + esc(v.colorKey || '') + '" data-f="colorKey" title="Token cuero (cuentagotas)">' +
        '<input type="text" placeholder="Color" value="' + esc(v.colorName || '') + '" data-f="colorName">' +
        '<input type="text" placeholder="#hex" value="' + esc(v.colorHex || '') + '" data-f="colorHex">' +
        '<input type="number" placeholder="Precio CHF" value="' + (v.priceCHF != null && v.priceCHF !== '' ? v.priceCHF : '') + '" data-f="priceCHF" min="0" title="Precio de esta variante (vacío = precio base)">' +
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
    return Array.from(variantsList.querySelectorAll('.variant-row')).map((row, i) => {
      const idVal = row.querySelector('[data-f="id"]').value.trim();
      const priceRaw = row.querySelector('[data-f="priceCHF"]').value.trim();
      return {
        id: idVal || 'v_' + i,
        sku: row.querySelector('[data-f="sku"]').value.trim(),
        colorKey: row.querySelector('[data-f="colorKey"]').value.trim(),
        colorName: row.querySelector('[data-f="colorName"]').value.trim(),
        colorHex: row.querySelector('[data-f="colorHex"]').value.trim(),
        priceCHF: priceRaw === '' ? null : Number(priceRaw),
        inventory: Number(row.querySelector('[data-f="inventory"]').value) || 0,
        sort: i,
      };
    });
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
    $('#fieldStatus').value = p.status || (p.active !== false ? 'active' : 'draft');
    $('#fieldSeoTitle').value = p.seoTitle || '';
    $('#fieldSeoDescription').value = p.seoDescription || '';
    $('#fieldPersonalizable').checked = p.personalizable !== false;
    $('#fieldSort').value = p.sort != null ? p.sort : 10;
    $('#fieldCollectionDisplay').value = p.collectionDisplay === 'variants' ? 'variants' : 'product';
    $('#fieldCollectionWide').checked = p.collectionWide === true;
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
      status: $('#fieldStatus').value,
      seoTitle: $('#fieldSeoTitle').value.trim(),
      seoDescription: $('#fieldSeoDescription').value.trim(),
      personalizable: $('#fieldPersonalizable').checked,
      sort: Number($('#fieldSort').value) || 10,
      collectionDisplay: $('#fieldCollectionDisplay').value,
      collectionWide: $('#fieldCollectionWide').checked,
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

  // ───────────────────────── PEDIDOS ─────────────────────────
  const ordersTable = $('#ordersTable');
  const orderDetail = $('#orderDetail');

  function money(n) { return 'CHF ' + (Number(n) || 0); }

  async function goOrders() {
    mainTitle.textContent = 'Pedidos';
    mainActions.innerHTML = '';
    setNav('orders');
    showView('orders');
    orderDetail.hidden = true;
    try {
      const data = await api('/admin/orders');
      renderOrdersTable(data.orders || []);
    } catch (err) {
      ordersTable.innerHTML = '<tr><td colspan="7">' + esc(err.message) + '</td></tr>';
    }
  }

  function renderOrdersTable(orders) {
    if (!orders.length) {
      ordersTable.innerHTML = '<tr><td colspan="7" class="hint">Aún no hay pedidos.</td></tr>';
      return;
    }
    ordersTable.innerHTML = orders.map((o) => {
      const fin = o.financial_status || o.status;
      const date = o.created_at ? new Date(o.created_at).toLocaleDateString('es') : '';
      return (
        '<tr>' +
          '<td><code>' + esc(o.id) + '</code></td>' +
          '<td>' + esc(o.customer_name || o.customer_email || '—') + '</td>' +
          '<td>' + money(o.total_chf) + (Number(o.refunded_chf) > 0 ? '<br><small>−' + money(o.refunded_chf) + '</small>' : '') + '</td>' +
          '<td>' + esc(fin) + '</td>' +
          '<td>' + esc(o.fulfillment_status || '') + '</td>' +
          '<td>' + esc(date) + '</td>' +
          '<td><button type="button" class="btn btn--sm btn--ghost" data-order="' + esc(o.id) + '">Ver</button></td>' +
        '</tr>'
      );
    }).join('');
    ordersTable.querySelectorAll('[data-order]').forEach((btn) => {
      btn.addEventListener('click', () => openOrderDetail(btn.getAttribute('data-order')));
    });
  }

  async function openOrderDetail(id) {
    try {
      const d = await api('/admin/orders?id=' + encodeURIComponent(id));
      const o = d.order;
      const lines = (d.lines || []).map((l) =>
        '<tr><td>' + esc(l.product_name || l.slug) + (l.variant_label ? ' · ' + esc(l.variant_label) : '') + '</td>' +
        '<td>' + l.quantity + '</td><td>' + money(l.line_total_chf) + '</td></tr>'
      ).join('');
      const refundable = (Number(o.total_chf) || 0) - (Number(o.refunded_chf) || 0);
      const addr = (d.addresses || [])[0];
      orderDetail.hidden = false;
      orderDetail.innerHTML =
        '<div class="section-block">' +
        '<h3>Pedido ' + esc(o.id) + '</h3>' +
        '<p class="hint">' + esc(o.customer_name || '') + ' · ' + esc(o.customer_email || '') +
          (addr ? ' · ' + esc([addr.city, addr.country].filter(Boolean).join(', ')) : '') + '</p>' +
        '<table class="table"><thead><tr><th>Pieza</th><th>Cant.</th><th>Total</th></tr></thead><tbody>' + lines + '</tbody></table>' +
        '<p style="margin-top:12px">Subtotal ' + money(o.subtotal_chf) + ' · Envío ' + money(o.shipping_chf) +
          ' · Impuesto ' + money(o.tax_chf) + ' · <strong>Total ' + money(o.total_chf) + '</strong>' +
          (Number(o.refunded_chf) > 0 ? ' · Reembolsado ' + money(o.refunded_chf) : '') + '</p>' +
        (refundable > 0
          ? '<div class="refund-box">' +
              '<label class="field" style="max-width:220px"><span>Reembolsar (máx ' + refundable + ' CHF)</span>' +
              '<input type="number" id="refundAmount" min="1" max="' + refundable + '" value="' + refundable + '"></label>' +
              '<label class="field field--check"><input type="checkbox" id="refundRestock" checked><span>Reponer stock</span></label>' +
              '<button type="button" class="btn btn--danger" id="btnDoRefund">Registrar reembolso</button>' +
              '<p class="form-notice" id="refundNotice" aria-live="polite"></p>' +
            '</div>'
          : '<p class="hint">Pedido totalmente reembolsado.</p>') +
        '</div>';
      const btnRefund = $('#btnDoRefund');
      if (btnRefund) {
        btnRefund.addEventListener('click', async () => {
          const amountChf = Number($('#refundAmount').value);
          const restock = $('#refundRestock').checked;
          if (!confirm('¿Registrar un reembolso de ' + amountChf + ' CHF?')) return;
          try {
            await api('/admin/orders?id=' + encodeURIComponent(o.id), {
              method: 'POST',
              body: JSON.stringify({ amountChf, restock, reason: 'customer' }),
            });
            showNotice($('#refundNotice'), 'Reembolso registrado.', true);
            setTimeout(() => { goOrders(); }, 700);
          } catch (err) {
            showNotice($('#refundNotice'), err.message, false);
          }
        });
      }
    } catch (err) {
      alert(err.message);
    }
  }

  // ───────────────────────── CUPONES ─────────────────────────
  const discountsTable = $('#discountsTable');
  const discountForm = $('#discountForm');
  const discountNotice = $('#discountNotice');

  async function goDiscounts() {
    mainTitle.textContent = 'Cupones y descuentos';
    mainActions.innerHTML = '';
    setNav('discounts');
    showView('discounts');
    resetDiscountForm();
    try {
      const data = await api('/admin/discounts');
      renderDiscountsTable(data.discounts || []);
    } catch (err) {
      discountsTable.innerHTML = '<tr><td colspan="8">' + esc(err.message) + '</td></tr>';
    }
  }

  function renderDiscountsTable(discounts) {
    if (!discounts.length) {
      discountsTable.innerHTML = '<tr><td colspan="8" class="hint">Aún no hay cupones.</td></tr>';
      return;
    }
    discountsTable.innerHTML = discounts.map((d) => {
      const val = d.type === 'percentage' ? (Number(d.value) + ' %') : ('CHF ' + Number(d.value));
      return (
        '<tr>' +
          '<td><code>' + esc(d.code) + '</code></td>' +
          '<td>' + esc(d.type) + (d.target_type === 'shipping' ? ' · envío' : '') + '</td>' +
          '<td>' + esc(val) + '</td>' +
          '<td>' + esc(d.method) + '</td>' +
          '<td>' + (Number(d.min_subtotal_chf) || 0) + '</td>' +
          '<td>' + (Number(d.used_count) || 0) + (d.usage_limit ? '/' + d.usage_limit : '') + '</td>' +
          '<td>' + (d.active ? '<span class="badge badge--ok">Sí</span>' : '<span class="badge badge--out">No</span>') + '</td>' +
          '<td><button type="button" class="btn btn--sm btn--ghost" data-disc="' + esc(d.id) + '">Editar</button></td>' +
        '</tr>'
      );
    }).join('');
    discountsTable.querySelectorAll('[data-disc]').forEach((btn) => {
      btn.addEventListener('click', () => editDiscount(btn.getAttribute('data-disc')));
    });
  }

  function resetDiscountForm() {
    $('#dscId').value = '';
    $('#dscCode').value = '';
    $('#dscType').value = 'percentage';
    $('#dscValue').value = '';
    $('#dscMethod').value = 'code';
    $('#dscTarget').value = 'order';
    $('#dscMinSubtotal').value = 0;
    $('#dscUsageLimit').value = '';
    $('#dscActive').checked = true;
    $('#dscDescription').value = '';
    $('#discountFormTitle').textContent = 'Nuevo cupón';
    $('#btnDeleteDiscount').hidden = true;
    showNotice(discountNotice, '', true);
  }

  async function editDiscount(id) {
    try {
      const d = await api('/admin/discounts?id=' + encodeURIComponent(id));
      const x = d.discount;
      $('#dscId').value = x.id;
      $('#dscCode').value = x.code;
      $('#dscType').value = x.type;
      $('#dscValue').value = Number(x.value);
      $('#dscMethod').value = x.method;
      $('#dscTarget').value = x.target_type;
      $('#dscMinSubtotal').value = Number(x.min_subtotal_chf) || 0;
      $('#dscUsageLimit').value = x.usage_limit || '';
      $('#dscActive').checked = x.active !== false;
      $('#dscDescription').value = x.description || '';
      $('#discountFormTitle').textContent = 'Editar cupón · ' + x.code;
      $('#btnDeleteDiscount').hidden = false;
    } catch (err) {
      showNotice(discountNotice, err.message, false);
    }
  }

  async function saveDiscount(e) {
    e.preventDefault();
    const id = $('#dscId').value || undefined;
    const body = {
      id,
      code: $('#dscCode').value.trim(),
      type: $('#dscType').value,
      value: Number($('#dscValue').value),
      method: $('#dscMethod').value,
      targetType: $('#dscTarget').value,
      minSubtotalChf: Number($('#dscMinSubtotal').value) || 0,
      usageLimit: $('#dscUsageLimit').value ? Number($('#dscUsageLimit').value) : null,
      active: $('#dscActive').checked,
      description: $('#dscDescription').value.trim(),
    };
    try {
      await api('/admin/discounts', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      showNotice(discountNotice, 'Cupón guardado.', true);
      const data = await api('/admin/discounts');
      renderDiscountsTable(data.discounts || []);
      resetDiscountForm();
    } catch (err) {
      showNotice(discountNotice, err.message, false);
    }
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
      if (v === 'categories') goCategories();
      if (v === 'orders') goOrders();
      if (v === 'discounts') goDiscounts();
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
  $('#btnSaveCategories').addEventListener('click', saveCategories);
  discountForm.addEventListener('submit', saveDiscount);
  $('#btnNewDiscount').addEventListener('click', resetDiscountForm);
  $('#btnDeleteDiscount').addEventListener('click', async () => {
    const id = $('#dscId').value;
    if (!id || !confirm('¿Eliminar este cupón?')) return;
    try {
      await api('/admin/discounts?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await api('/admin/discounts');
      renderDiscountsTable(data.discounts || []);
      resetDiscountForm();
    } catch (err) {
      showNotice(discountNotice, err.message, false);
    }
  });

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
