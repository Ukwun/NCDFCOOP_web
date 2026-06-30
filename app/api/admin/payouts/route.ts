import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user?.roles.includes(USER_ROLES.ADMIN)) {
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
    if (!(await profileRef.get()).exists) {
      return NextResponse.json({ error: 'Payout profile not found.' }, { status: 404 });
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
