/**
 * Cuenta · un solo Serverless Function (límite Hobby: 12)
 * Rutas: /api/account/login | register | me
 */
const ACTIONS = {
  login: './_login',
  register: './_register',
  me: './_me',
};

module.exports = async (req, res) => {
  const action = req.query.action;
  const mod = ACTIONS[action];
  if (!mod) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({ ok: false, error: 'Ruta de cuenta no encontrada.' });
  }
  return require(mod)(req, res);
};
