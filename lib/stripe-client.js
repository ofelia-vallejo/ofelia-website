'use strict';

// Singleton Stripe client. SRP: one place owns Stripe initialization.
// All API handlers import getStripe() instead of calling new Stripe() per request.

const Stripe = require('stripe');
const config = require('./config');

const API_VERSION = '2024-11-20.acacia';

let _stripe = null;

function getStripe() {
  if (!config.stripeSecretKey) {
    // Mensaje apto para el cliente (no filtra nombres de variables); el detalle
    // técnico queda en logs del servidor para el desarrollador.
    console.warn('[stripe] STRIPE_SECRET_KEY ausente: el checkout responde 503 (pago deshabilitado).');
    const err = new Error('El pago en línea no está disponible por ahora. Escríbenos para completar tu pedido.');
    err.statusCode = 503;
    err.expose = true;
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }
  if (!_stripe) {
    _stripe = new Stripe(config.stripeSecretKey, { apiVersion: API_VERSION });
  }
  return _stripe;
}

function isConfigured() {
  return config.stripeConfigured;
}

module.exports = { getStripe, isConfigured };
