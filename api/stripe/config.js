const { corsJson } = require('../../lib/auth');

module.exports = async (req, res) => {
  corsJson(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return res.status(200).json({
    ok: true,
    publishableKey,
    enabled: Boolean(publishableKey && process.env.STRIPE_SECRET_KEY),
  });
};
