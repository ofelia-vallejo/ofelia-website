'use strict';

// Guardias compartidos del panel admin — auth + DB obligatoria.
const config = require('./config');

function requireDatabase(res) {
  if (!config.dbConfigured) {
    res.status(503).json({
      ok: false,
      error: 'Base de datos no configurada. Contacta soporte técnico.',
      dbConfigured: false,
    });
    return false;
  }
  return true;
}

module.exports = { requireDatabase };
