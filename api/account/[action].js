'use strict';

// Account router — single Serverless Function dispatches to sub-handlers.
// Keeps function count within Vercel Hobby limit (12 max).
// Routes: /api/account/[action] where action = login | register | me

const { corsJson } = require('../../lib/auth');

const HANDLERS = {
  login:    () => require('./_login'),
  register: () => require('./_register'),
  me:       () => require('./_me'),
};

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action;
  const factory = HANDLERS[action];

  if (!factory) {
    return res.status(404).json({
      ok: false,
      error: `Ruta de cuenta no encontrada: "${action || '(ninguna)'}". Rutas válidas: ${Object.keys(HANDLERS).join(', ')}.`,
    });
  }

  try {
    const handler = factory();
    return await handler(req, res);
  } catch (err) {
    console.error(`[account/${action}]`, err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
    }
  }
};
