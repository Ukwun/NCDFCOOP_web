import { NextRequest, NextResponse } from 'next/server';
import { releaseExpiredOrderInventory } from '@/lib/server/orderInventory';
import { createHmac, timingSafeEqual } from 'crypto';
import { recordOperationalAlert } from '@/lib/server/operationalAlert';

function signingKey() {
  if (process.env.COMMERCE_INTELLIGENCE_CRON_TOKEN) return process.env.COMMERCE_INTELLIGENCE_CRON_TOKEN;
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) return process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) return '';
  for (const candidate of [encoded, (() => { try { return Buffer.from(encoded, 'base64').toString('utf8'); } catch { return ''; } })()]) {
    try { return String(JSON.parse(candidate).private_key || JSON.parse(candidate).privateKey || ''); } catch { /* try next representation */ }
  }
  return '';
}

function authorized(request: NextRequest) {
  const key = signingKey();
  if (!key) return false;
  if (request.headers.get('authorization') === `Bearer ${key}`) return true;
  const timestamp = request.headers.get('x-coopx-scheduled-at') || '';
  const signature = request.headers.get('x-coopx-signature') || '';
  if (!/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac('sha256', key).update(timestamp).digest('hex');
  const left = Buffer.from(signature); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await releaseExpiredOrderInventory(100);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    await recordOperationalAlert({ category: 'inventory', severity: 'critical', message: 'Scheduled expired-order inventory release failed.', error });
    return NextResponse.json({ error: 'Inventory release job failed.' }, { status: 500 });
  }
}
