const { corsJson, requireAdmin } = require('../../lib/auth');
const { requireDatabase } = require('../../lib/admin-guard');
const { loadCatalog, saveCatalog, findProduct, totalInventory } = require('../../lib/store');
const {
  hasPostgres,
  listInventoryDetailed,
  getVariantAvailable,
  setInventoryLevel,
  recordInventoryMovement,
} = require('../../lib/postgres');
const { parseInventoryAdjust } = require('../../lib/validation');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;
  if (!requireDatabase(res)) return;

  try {
    const catalog = await loadCatalog();

    if (req.method === 'GET') {
      // Si hay Postgres, exponemos la capa normalizada inventory_levels (la real
      // que usa el corte de stock en checkout); si no, caemos al espejo del catálogo.
      let levels = [];
      if (hasPostgres()) {
        levels = await listInventoryDetailed();
      }

      const summary = catalog.products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        inventory: totalInventory(p),
        lowStockAt: p.lowStockAt || 2,
        lowStock: totalInventory(p) <= (p.lowStockAt || 2),
        variants: (p.variants || []).map((v) => {
          const row = levels.find(
            (l) => l.product_id === p.id && (l.sku === v.sku || l.color_key === v.colorKey || l.variant_id.endsWith('::' + v.id))
          );
          return {
            id: v.id,
            sku: v.sku,
            colorName: v.colorName,
            colorKey: v.colorKey,
            inventory: row ? Number(row.available) : (Number(v.inventory) || 0),
            available: row ? Number(row.available) : null,
            locationId: row ? row.location_id : 'loc-medellin',
          };
        }),
      }));
      return res.status(200).json({ ok: true, inventory: summary, levels });
    }

    if (req.method === 'PATCH') {
      // Validación server-side: mode set|delta, value entero, no negativos.
      const parsed = parseInventoryAdjust(req.body || {});
      if (!parsed.ok) {
        return res.status(400).json({ ok: false, error: parsed.error, issues: parsed.issues });
      }
      const { productId, variantId, locationId, mode, value, reason, note } = parsed.data;

      const product = findProduct(catalog, productId);
      if (!product) return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });

      // Variante con stock normalizado (inventory_levels) — ruta robusta con ledger.
      if (variantId && hasPostgres()) {
        const v = (product.variants || []).find((x) => x.id === variantId || x.sku === variantId);
        if (!v) return res.status(404).json({ ok: false, error: 'Variante no encontrada.' });

        let result;
        if (mode === 'delta') {
          result = await recordInventoryMovement({
            productId, variantId: v.id, locationId, delta: value,
            reason: reason || 'manual', referenceType: 'admin', note, createdBy: 'admin',
          });
        } else {
          result = await setInventoryLevel({
            productId, variantId: v.id, locationId, target: value,
            reason: reason || 'correction', note, createdBy: 'admin',
          });
        }
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: 'No se pudo ajustar el inventario (' + (result.reason || 'desconocido') + ').' });
        }
        return res.status(200).json({
          ok: true, productId, variantId: v.id,
          available: result.available, delta: result.delta,
        });
      }

      // Sin variante o sin Postgres: espejo en el catálogo (sin ledger).
      if (variantId && product.variants && product.variants.length) {
        const v = product.variants.find((x) => x.id === variantId || x.sku === variantId);
        if (!v) return res.status(404).json({ ok: false, error: 'Variante no encontrada.' });
        v.inventory = mode === 'delta'
          ? Math.max(0, (Number(v.inventory) || 0) + value)
          : Math.max(0, value);
      } else {
        product.inventory = mode === 'delta'
          ? Math.max(0, (Number(product.inventory) || 0) + value)
          : Math.max(0, value);
      }

      const storage = await saveCatalog(catalog);
      return res.status(200).json({
        ok: true, productId: product.id, inventory: totalInventory(product), storage,
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/inventory]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error.' });
  }
};
