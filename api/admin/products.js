const { corsJson, requireAdmin } = require('../../lib/auth');
const {
  loadCatalog,
  saveCatalog,
  findProduct,
  slugify,
  newProductId,
} = require('../../lib/store');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

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
      const body = req.body || {};
      const slug = slugify(body.slug || body.name || 'producto');
      if (findProduct(catalog, slug)) {
        return res.status(400).json({ ok: false, error: 'Ya existe un producto con ese slug.' });
      }
      const product = {
        id: body.id || slug,
        slug,
        name: body.name || 'Nuevo producto',
        shortDescription: body.shortDescription || '',
        description: body.description || '',
        category: body.category || 'mujer',
        line: body.line || '',
        numeral: body.numeral || '',
        active: body.active !== false,
        personalizable: body.personalizable !== false,
        basePrice: Number(body.basePrice) || 0,
        engravePrice: Number(body.engravePrice) || 0,
        inventory: Number(body.inventory) || 0,
        lowStockAt: Number(body.lowStockAt) || 2,
        pdpPath: body.pdpPath || `/personalizar.html?producto=${encodeURIComponent(body.name || slug)}`,
        images: Array.isArray(body.images) ? body.images : [],
        variants: Array.isArray(body.variants) ? body.variants : [],
        engrave: body.engrave || {
          fonts: ['romana', 'clasica'],
          sizes: { S: { maxChars: 3, label: 'Iniciales' }, M: { maxChars: 12, label: 'Nombre' } },
          layouts: ['texto'],
          zone: { x: 0.7, y: 0.78, width: 0.2, height: 0.1 },
        },
      };
      catalog.products.push(product);
      const storage = await saveCatalog(catalog);
      return res.status(201).json({ ok: true, product, storage });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) return res.status(400).json({ ok: false, error: 'Falta id del producto.' });
      const idx = catalog.products.findIndex((p) => p.id === id || p.slug === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: 'No encontrado.' });
      const prev = catalog.products[idx];
      const body = req.body || {};
      const next = {
        ...prev,
        ...body,
        id: prev.id,
        slug: body.slug ? slugify(body.slug) : prev.slug,
        basePrice: body.basePrice != null ? Number(body.basePrice) : prev.basePrice,
        engravePrice: body.engravePrice != null ? Number(body.engravePrice) : prev.engravePrice,
        inventory: body.inventory != null ? Number(body.inventory) : prev.inventory,
        lowStockAt: body.lowStockAt != null ? Number(body.lowStockAt) : prev.lowStockAt,
      };
      catalog.products[idx] = next;
      const storage = await saveCatalog(catalog);
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
