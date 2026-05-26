const { corsJson, requireAdmin } = require('../../lib/auth');
const { loadCatalog, saveCatalog } = require('../../lib/store');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  try {
    const catalog = await loadCatalog();

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        categories: catalog.categories || [],
      });
    }

    if (req.method === 'PUT') {
      const { categories } = req.body || {};
      if (!Array.isArray(categories) || !categories.length) {
        return res.status(400).json({ ok: false, error: 'Envía un arreglo de categorías.' });
      }

      catalog.categories = categories.map((c, i) => ({
        id: String(c.id || '').trim(),
        label: String(c.label || c.id || '').trim(),
        sort: Number(c.sort) || i + 1,
        gridCols: Number(c.gridCols) === 2 ? 2 : 3,
        active: c.active !== false,
      })).filter((c) => c.id);

      if (!catalog.categories.length) {
        return res.status(400).json({ ok: false, error: 'Debe existir al menos una categoría.' });
      }

      const storage = await saveCatalog(catalog);
      return res.status(200).json({ ok: true, categories: catalog.categories, storage });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/categories]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error del servidor.' });
  }
};
