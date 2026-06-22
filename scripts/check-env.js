#!/usr/bin/env node
'use strict';

// Run before deploying: node scripts/check-env.js
// Validates that all required production env vars are set.

const REQUIRED = [
  ['ADMIN_PASSWORD',        'Admin panel password'],
  ['ADMIN_SECRET',          'JWT signing secret for admin sessions'],
  ['DATABASE_URL',          'PostgreSQL connection string'],
  ['STRIPE_SECRET_KEY',     'Stripe server-side secret key'],
  ['STRIPE_PUBLISHABLE_KEY','Stripe client-side publishable key'],
  ['STRIPE_WEBHOOK_SECRET', 'Stripe webhook signing secret'],
  ['SITE_URL',              'Production domain (e.g. https://ofeliavallejo.com)'],
];

const OPTIONAL = [
  ['SMTP_HOST',             'SMTP server (emails will be skipped if missing)'],
  ['BLOB_READ_WRITE_TOKEN', 'Vercel Blob token (image uploads)'],
  ['CUSTOMER_SECRET',       'JWT secret for customer sessions (defaults to ADMIN_SECRET)'],
  ['WHATSAPP_NUMBER',       'WhatsApp atelier number (digits only)'],
  ['LAUNCH_COUPON_CODE',    'Launch popup coupon code'],
  ['EMAIL_TO',              'Destination email for contact + personalización'],
];

let ok = true;

console.log('\n─── Ofelia Vallejo · env check ───\n');

console.log('REQUIRED:');
for (const [key, desc] of REQUIRED) {
  const set = Boolean(process.env[key]);
  console.log(`  ${set ? '✓' : '✗'} ${key.padEnd(28)} ${desc}`);
  if (!set) ok = false;
}

console.log('\nOPTIONAL:');
for (const [key, desc] of OPTIONAL) {
  const set = Boolean(process.env[key]);
  console.log(`  ${set ? '✓' : '○'} ${key.padEnd(28)} ${desc}`);
}

console.log('');

if (!ok) {
  console.error('✗ Missing required variables — fix before deploying to production.\n');
  process.exit(1);
} else {
  console.log('✓ All required variables are set.\n');
}
