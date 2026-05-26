const { corsJson } = require('../lib/auth');
const { loadCatalog, findProduct } = require('../lib/store');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const catalog = await loadCatalog();
    const slug = req.query?.slug;
    const id = req.query?.id;
    const activeOnly = req.query?.active !== 'false';

    if (slug || id) {
      const product = findProduct(catalog, slug || id);
      if (!product || (activeOnly && !product.active)) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
      }
      return res.status(200).json({
        ok: true,
        currency: catalog.currency,
        product,
      });
    }

    let products = catalog.products.slice();
    if (activeOnly) products = products.filter((p) => p.active);

    return res.status(200).json({
      ok: true,
      currency: catalog.currency,
      categories: catalog.categories,
      products,
      updatedAt: catalog.updatedAt,
    });
  } catch (err) {
    console.error('[products]', err);
    return res.status(500).json({ ok: false, error: 'Error al cargar catálogo.' });
  }
};
