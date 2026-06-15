'use strict';

// Singleton Stripe client. SRP: one place owns Stripe initialization.
// All API handlers import getStripe() instead of calling new Stripe() per request.

const Stripe = require('stripe');
const config = require('./config');

const API_VERSION = '2024-11-20.acacia';

let _stripe = null;

function getStripe() {
  if (!config.stripeSecretKey) {
    const err = new Error('Pasarela de pago no configurada. Verifica STRIPE_SECRET_KEY.');
    err.statusCode = 503;
    err.expose = true;
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
