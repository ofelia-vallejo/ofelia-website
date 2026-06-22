const { corsJson, requireAdmin } = require('../../lib/auth');
const { requireDatabase } = require('../../lib/admin-guard');
const {
  loadCatalog,
  saveCatalog,
  findProduct,
  slugify,
} = require('../../lib/store');
const { setMetafield } = require('../../lib/postgres');
const { parseProduct } = require('../../lib/validation');

// Bloque de grabado por defecto para piezas nuevas (se preserva al editar).
const DEFAULT_ENGRAVE = {
  fonts: ['romana', 'clasica'],
  sizes: { S: { maxChars: 3, label: 'Iniciales' }, M: { maxChars: 12, label: 'Nombre' } },
  layouts: ['texto'],
  zone: { x: 0.7, y: 0.78, width: 0.2, height: 0.1 },
};

// Normaliza la coherencia status ↔ active. status manda si viene; si no, se deriva.
function normalizeStatusActive(data, prev) {
  let status = data.status;
  let active = data.active;
  if (status) {
    active = status === 'active';
  } else if (active != null) {
    status = active ? 'active' : (prev && prev.status === 'archived' ? 'archived' : 'draft');
  } else if (prev) {
    status = prev.status || (prev.active ? 'active' : 'draft');
    active = prev.active;
  } else {
    status = 'active';
    active = true;
  }
  return { status, active };
}

// Persiste metafields del producto (tabla metafields). No bloquea el guardado.
async function persistMetafields(productId, metafields) {
  if (!Array.isArray(metafields) || !metafields.length) return;
  for (const m of metafields) {
    if (!m.key) continue;
    try {
      await setMetafield('product', productId, m.key, m.value, {
        namespace: m.namespace || 'custom',
        valueType: m.valueType || 'single_line_text_field',
      });
    } catch (err) {
      console.warn('[admin/products] metafield:', err.message);
    }
  }
}

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;
  if (!requireDatabase(res)) return;

  try {
    const catalog = await loadCatalog();
    const id = req.query?.id;

    if (req.method === 'GET') {
      if (id) {
        const product = findProduct(catalog, id);
        if (!product) return res.status(404).json({ ok: false, error: 'No encontrado.' });
        return res.status(200).json({ ok: true, product, categories: catalog.categories });
      }
      return res.status(200).json({
        ok: true,
        products: catalog.products,
        categories: catalog.categories,
        currency: catalog.currency,
        updatedAt: catalog.updatedAt,
      });
    }

    if (req.method === 'POST') {
      const parsed = parseProduct(req.body || {});
      if (!parsed.ok) {
        return res.status(400).json({ ok: false, error: parsed.error, issues: parsed.issues });
      }
      const data = parsed.data;
      const slug = slugify(data.slug || data.name || 'producto');

      // Categoría debe existir (FK válida) — evita estados huérfanos.
      if (!catalog.categories.some((c) => c.id === data.category)) {
        return res.status(400).json({ ok: false, error: `La categoría "${data.category}" no existe.` });
      }
      if (findProduct(catalog, slug)) {
        return res.status(400).json({ ok: false, error: 'Ya existe un producto con ese slug.' });
      }

      const { status, active } = normalizeStatusActive(data, null);
      const product = {
        id: data.id || slug,
        slug,
        name: data.name,
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        category: data.category,
        line: data.line || '',
        numeral: data.numeral || '',
        status,
        active,
        personalizable: data.personalizable !== false,
        basePrice: data.basePrice,
        engravePrice: data.engravePrice || 0,
        inventory: data.inventory || 0,
        lowStockAt: data.lowStockAt || 2,
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        sort: data.sort,
        collectionDisplay: data.collectionDisplay,
        collectionWide: data.collectionWide,
        pdpPath: data.pdpPath || `/personalizar?producto=${encodeURIComponent(data.name)}`,
        images: data.images || [],
        variants: data.variants || [],
        engrave: DEFAULT_ENGRAVE,
      };
      catalog.products.push(product);
      const storage = await saveCatalog(catalog);
      await persistMetafields(product.id, data.metafields);
      return res.status(201).json({ ok: true, product, storage });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) return res.status(400).json({ ok: false, error: 'Falta id del producto.' });
      const idx = catalog.products.findIndex((p) => p.id === id || p.slug === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'No encontrado.' });
      const prev = catalog.products[idx];

      const parsed = parseProduct(req.body || {});
      if (!parsed.ok) {
        return res.status(400).json({ ok: false, error: parsed.error, issues: parsed.issues });
      }
      const data = parsed.data;
      const slug = data.slug ? slugify(data.slug) : prev.slug;

      if (!catalog.categories.some((c) => c.id === data.category)) {
        return res.status(400).json({ ok: false, error: `La categoría "${data.category}" no existe.` });
      }
      // Slug único entre OTROS productos.
      if (slug !== prev.slug && catalog.products.some((p, i) => i !== idx && p.slug === slug)) {
        return res.status(400).json({ ok: false, error: 'Ya existe otro producto con ese slug.' });
      }

      const { status, active } = normalizeStatusActive(data, prev);

      // Mezcla validada SOBRE el producto previo: preserva campos no editables aquí
      // (engrave, colorData, accordion, copy editorial, meta) que no se deben perder.
      const next = {
        ...prev,
        name: data.name,
        slug,
        category: data.category,
        line: data.line || '',
        numeral: data.numeral || '',
        status,
        active,
        personalizable: data.personalizable !== false,
        basePrice: data.basePrice,
        engravePrice: data.engravePrice || 0,
        inventory: data.inventory != null ? data.inventory : prev.inventory,
        lowStockAt: data.lowStockAt != null ? data.lowStockAt : prev.lowStockAt,
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
        sort: data.sort != null ? data.sort : prev.sort,
        collectionDisplay: data.collectionDisplay,
        collectionWide: data.collectionWide,
        pdpPath: data.pdpPath || prev.pdpPath || '',
        shortDescription: data.shortDescription || '',
        description: data.description || prev.description || '',
        images: Array.isArray(data.images) ? data.images : prev.images || [],
        variants: Array.isArray(data.variants) ? data.variants : prev.variants || [],
        id: prev.id,
      };
      catalog.products[idx] = next;
      const storage = await saveCatalog(catalog);
      await persistMetafields(next.id, data.metafields);
      return res.status(200).json({ ok: true, product: next, storage });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ ok: false, error: 'Falta id.' });
      const idx = catalog.products.findIndex((p) => p.id === id || p.slug === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'No encontrado.' });
      catalog.products.splice(idx, 1);
      const storage = await saveCatalog(catalog);
      return res.status(200).json({ ok: true, storage });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/products]', err);
    const code = err.code === 'STORE_READONLY' ? 503 : 500;
    return res.status(code).json({ ok: false, error: err.message || 'Error del servidor.' });
  }
};
