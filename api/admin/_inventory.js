const { corsJson, requireAdmin } = require('../../lib/auth');
const { loadCatalog, saveCatalog, findProduct, totalInventory } = require('../../lib/store');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  try {
    const catalog = await loadCatalog();

    if (req.method === 'GET') {
      const summary = catalog.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        inventory: totalInventory(p),
        lowStockAt: p.lowStockAt || 2,
        lowStock: totalInventory(p) <= (p.lowStockAt || 2),
        variants: (p.variants || []).map((v) => ({
          id: v.id,
          sku: v.sku,
          colorName: v.colorName,
          inventory: Number(v.inventory) || 0,
        })),
      }));
      return res.status(200).json({ ok: true, inventory: summary });
    }

    if (req.method === 'PATCH') {
      const { productId, variantId, inventory, delta } = req.body || {};
      if (!productId) {
        return res.status(400).json({ ok: false, error: 'productId requerido.' });
      }
      const product = findProduct(catalog, productId);
      if (!product) return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });

      if (variantId && product.variants && product.variants.length) {
        const v = product.variants.find((x) => x.id === variantId || x.sku === variantId);
        if (!v) return res.status(404).json({ ok: false, error: 'Variante no encontrada.' });
        if (delta != null) v.inventory = Math.max(0, (Number(v.inventory) || 0) + Number(delta));
        else if (inventory != null) v.inventory = Math.max(0, Number(inventory));
      } else if (inventory != null) {
        product.inventory = Math.max(0, Number(inventory));
      } else if (delta != null) {
        product.inventory = Math.max(0, (Number(product.inventory) || 0) + Number(delta));
      } else {
        return res.status(400).json({ ok: false, error: 'inventory o delta requerido.' });
      }

      const storage = await saveCatalog(catalog);
      return res.status(200).json({
        ok: true,
        productId: product.id,
        inventory: totalInventory(product),
        storage,
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/inventory]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error.' });
  }
};
