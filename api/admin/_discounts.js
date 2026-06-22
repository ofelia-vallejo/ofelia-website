const { corsJson, requireAdmin } = require('../../lib/auth');
const {
  listDiscounts,
  getDiscountById,
  getDiscountConditions,
  upsertDiscount,
  deleteDiscount,
} = require('../../lib/postgres');
const { parseDiscount } = require('../../lib/validation');
const config = require('../../lib/config');

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireAdmin(req, res)) return;

  if (!config.dbConfigured) {
    return res.status(503).json({ ok: false, error: 'Base de datos no configurada.' });
  }

  try {
    const id = req.query?.id;

    if (req.method === 'GET') {
      if (id) {
        const discount = await getDiscountById(id);
        if (!discount) return res.status(404).json({ ok: false, error: 'Descuento no encontrado.' });
        const conditions = await getDiscountConditions(id);
        return res.status(200).json({ ok: true, discount, conditions });
      }
      const discounts = await listDiscounts();
      return res.status(200).json({ ok: true, discounts });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const parsed = parseDiscount(req.body || {});
      if (!parsed.ok) {
        return res.status(400).json({ ok: false, error: parsed.error, issues: parsed.issues });
      }
      // Código único: si existe otro descuento con el mismo code y distinto id, rechazar.
      const data = parsed.data;
      const all = await listDiscounts();
      const codeUpper = String(data.code).trim().toUpperCase();
      const clash = all.find((d) => d.code === codeUpper && d.id !== (data.id || ''));
      if (clash) {
        return res.status(400).json({ ok: false, error: `Ya existe un cupón con el código "${codeUpper}".` });
      }
      const result = await upsertDiscount(data);
      return res.status(200).json({ ok: true, ...result });
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ ok: false, error: 'Falta id.' });
      const ok = await deleteDiscount(id);
      if (!ok) return res.status(404).json({ ok: false, error: 'Descuento no encontrado.' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/discounts]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Error del servidor.' });
  }
};
