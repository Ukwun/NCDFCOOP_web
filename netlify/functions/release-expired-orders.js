exports.handler = async function handler(event) {
  const crypto = require('crypto');
  let token = process.env.COMMERCE_INTELLIGENCE_CRON_TOKEN || process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!token && encoded) {
    for (const candidate of [encoded, (() => { try { return Buffer.from(encoded, 'base64').toString('utf8'); } catch { return ''; } })()]) {
      try { const parsed = JSON.parse(candidate); token = parsed.private_key || parsed.privateKey || ''; if (token) break; } catch { /* try next representation */ }
    }
  }
  const baseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL;
  if (!token || !baseUrl) {
    return { statusCode: 503, body: JSON.stringify({ success: false, message: 'Scheduled inventory release is not configured.' }) };
  }
  try {
    const timestamp = String(Date.now());
    const signature = crypto.createHmac('sha256', token).update(timestamp).digest('hex');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/operations/release-expired-orders`, {
      method: 'POST',
      headers: { 'x-coopx-scheduled-at': timestamp, 'x-coopx-signature': signature, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'netlify-scheduled-function', schedule: event?.schedule || null }),
    });
    return { statusCode: response.status, body: await response.text(), headers: { 'Content-Type': 'application/json' } };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Inventory release failed.' }) };
  }
};
