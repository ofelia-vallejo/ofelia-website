/**
 * Admin · un solo Serverless Function (límite Hobby: 12)
 * Rutas: /api/admin/login | products | upload | inventory | categories
 */
const ACTIONS = {
  login: './_login',
  products: './_products',
  upload: './_upload',
  inventory: './_inventory',
  categories: './_categories',
};

module.exports = async (req, res) => {
  const action = req.query.action;
  const mod = ACTIONS[action];
  if (!mod) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ ok: false, error: 'Ruta admin no encontrada.' });
  }
  return require(mod)(req, res);
};
