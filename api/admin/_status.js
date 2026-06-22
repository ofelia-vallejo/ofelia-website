'use strict';

// GET /api/admin/status — resumen para dashboard (pedidos recientes, stock bajo).
const { corsJson, requireAdmin } = require('../../lib/auth');
const { requireDatabase } = require('../../lib/admin-guard');
const { loadCatalog, totalInventory } = require('../../lib/store');
const { listOrders, listInventoryDetailed } = require('../../lib/postgres');
const config = require('../../lib/config');

const LOW_STOCK_THRESHOLD = 3;
const LOCATION_LABEL = 'Atelier Medellín';

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!requireDatabase(res)) return;

  try {
    const catalog = await loadCatalog();
    const products = catalog.products || [];
    const orders = await listOrders(8);
    const levels = await listInventoryDetailed();

    const lowStock = [];
    products.forEach((p) => {
      if (p.variants && p.variants.length) {
        p.variants.forEach((v) => {
          const row = levels.find(
            (l) => l.product_id === p.id && (l.sku === v.sku || l.color_key === v.colorKey || l.variant_id.endsWith('::' + v.id))
          );
          const available = row ? Number(row.available) : (Number(v.inventory) || 0);
          if (available > 0 && available < LOW_STOCK_THRESHOLD) {
            lowStock.push({
              productId: p.id,
              productName: p.name,
              variantId: v.id,
              sku: v.sku,
              colorName: v.colorName,
              available,
              location: LOCATION_LABEL,
            });
          }
        });
      } else {
        const n = totalInventory(p);
        if (n > 0 && n < LOW_STOCK_THRESHOLD) {
          lowStock.push({
            productId: p.id,
            productName: p.name,
            variantId: null,
            sku: null,
            colorName: 'Único',
            available: n,
            location: LOCATION_LABEL,
          });
        }
      }
    });

    return res.status(200).json({
      ok: true,
      dbConfigured: config.dbConfigured,
      location: LOCATION_LABEL,
      stats: {
        products: products.length,
        activeProducts: products.filter((p) => p.active).length,
        lowStockCount: lowStock.length,
        outOfStock: products.filter((p) => totalInventory(p) <= 0).length,
        recentOrders: orders.length,
      },
      recentOrders: orders.slice(0, 5),
      lowStock: lowStock.slice(0, 12),
    });
  } catch (err) {
    console.error('[admin/status]', err);
    return res.status(500).json({ ok: false, error: 'No se pudo cargar el resumen.' });
  }
};
