'use strict';

// Single source of truth for all env-derived constants.
// Import this instead of accessing process.env directly in business logic.

const REQUIRED_PROD = [
  'ADMIN_PASSWORD',
  'ADMIN_SECRET',
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

function validate() {
  if (process.env.NODE_ENV !== 'production' && process.env.STORE_MODE === 'file') return;
  const missing = REQUIRED_PROD.filter((k) => !process.env[k]);
  if (!missing.length) return;
  const msg = `[config] Missing required env vars: ${missing.join(', ')}`;
  // Log loudly but NEVER throw on import: throwing here crashes EVERY API function
  // (all of them import config), turning one missing var into a full backend outage
  // (FUNCTION_INVOCATION_FAILED). Each subsystem degrades on its own instead:
  // catalog falls back to data/catalog.json, Stripe returns 503, email logs in dev mode.
  console.error(msg);
}

// Run once on first import
validate();

const config = {
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  storeMode: process.env.STORE_MODE || 'postgres',

  // Site
  siteUrl: process.env.SITE_URL || 'https://ofeliavallejo.com',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Storage
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',

  // Admin auth
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminSecret: process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'dev-change-me',

  // Customer auth
  customerSecret:
    process.env.CUSTOMER_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'ov-customer-dev-secret',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  emailTo: process.env.EMAIL_TO || 'atelierofelia.vallejo@gmail.com',

  // Features
  launchCouponCode: process.env.LAUNCH_COUPON_CODE || 'OV-TEMPORADA',
  launchDiscountLabel:
    process.env.LAUNCH_DISCOUNT_LABEL || '10% en tu primera pieza · lanzamiento de temporada',
  whatsappNumber: (process.env.WHATSAPP_NUMBER || '573005526208').replace(/\D/g, ''),

  // Derived helpers
  get smtpConfigured() {
    return Boolean(this.smtp.host && this.smtp.user && this.smtp.pass);
  },
  get stripeConfigured() {
    return Boolean(this.stripeSecretKey && this.stripePublishableKey);
  },
  get dbConfigured() {
    return Boolean(this.databaseUrl);
  },
};

module.exports = config;
