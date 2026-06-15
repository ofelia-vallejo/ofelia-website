'use strict';

// Admin router — single Serverless Function dispatches to sub-handlers.
// Keeps function count within Vercel Hobby limit (12 max).
// Routes: /api/admin/[action] where action = login | products | upload | inventory | categories

const { corsJson } = require('../../lib/auth');

const HANDLERS = {
  login:      () => require('./_login'),
  products:   () => require('./_products'),
  upload:     () => require('./_upload'),
  inventory:  () => require('./_inventory'),
  categories: () => require('./_categories'),
};

module.exports = async (req, res) => {
  corsJson(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action;
  const factory = HANDLERS[action];

  if (!factory) {
    return res.status(404).json({
      ok: false,
      error: `Ruta admin no encontrada: "${action || '(ninguna)'}". Rutas válidas: ${Object.keys(HANDLERS).join(', ')}.`,
    });
  }

  try {
    const handler = factory();
    return await handler(req, res);
  } catch (err) {
    console.error(`[admin/${action}]`, err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
    }
  }
};
