import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

const DEFAULT_COMMISSION_PERCENT = 10;

function normalizePercentage(value: unknown): number | null {
  const percentage = Number(value);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 30) return null;
  return Math.round(percentage * 100) / 100;
}

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(user, USER_ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }
  const snapshot = await getAdminDb().collection('global_settings').doc('commerce').get();
  return NextResponse.json({
    sellerCommissionPercent:
      normalizePercentage(snapshot.data()?.sellerCommissionPercent) ?? DEFAULT_COMMISSION_PERCENT,
  });
}

export async function PUT(request: NextRequest) {
  const user = await verifyRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasRole(user, USER_ROLES.SUPER_ADMIN)) {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }
  const payload = await request.json().catch(() => ({}));
  const sellerCommissionPercent = normalizePercentage(payload.sellerCommissionPercent);
  if (sellerCommissionPercent === null) {
    return NextResponse.json({ error: 'Commission must be between 0% and 30%.' }, { status: 400 });
  }
  const db = getAdminDb();
  const now = FieldValue.serverTimestamp();
  await db.collection('global_settings').doc('commerce').set(
    { sellerCommissionPercent, updatedAt: now, updatedBy: user!.uid },
    { merge: true },
  );
  await db.collection('activityLogs').add({
    userId: user!.uid,
    action: 'seller_commission_updated',
    sellerCommissionPercent,
    createdAt: now,
  });
  return NextResponse.json({ sellerCommissionPercent });
}
