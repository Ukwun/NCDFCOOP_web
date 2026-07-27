import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasAnyRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    const body = await request.json();
    const sellerId = String(body.sellerId || '');
    const reviewStatus = String(body.reviewStatus || '');
    if (!sellerId || !['verified', 'rejected', 'pending_verification'].includes(reviewStatus)) {
      return NextResponse.json({ error: 'Invalid payout review action.' }, { status: 400 });
    }
    const db = getAdminDb();
    const profileRef = db.collection('payoutProfiles').doc(sellerId);
    const profile = await profileRef.get();
    if (!profile.exists) {
      return NextResponse.json({ error: 'Payout profile not found.' }, { status: 404 });
    }
    const details = profile.data() || {};
    if (reviewStatus === 'verified' && (!/^\d{10}$/.test(String(details.accountNumber || '')) || !details.bankName || !details.accountName)) {
      return NextResponse.json({ error: 'This payout profile is incomplete and cannot be verified.' }, { status: 409 });
    }
    await db.runTransaction(async (transaction) => {
      transaction.update(profileRef, { reviewStatus, reviewedBy: user.uid,
        reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      transaction.set(db.collection('activityLogs').doc(), { userId: user.uid,
        action: 'payout_profile_reviewed', sellerId, reviewStatus, createdAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ success: true, reviewStatus });
  } catch (error) {
    console.error('Payout review failed:', error);
    return NextResponse.json({ error: 'Unable to review payout profile.' }, { status: 500 });
  }
}
