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
    const accountId = String(body.accountId || 'legacy');
    const reviewStatus = String(body.reviewStatus || '');
    if (!sellerId || !['verified', 'rejected', 'pending_verification'].includes(reviewStatus)) {
      return NextResponse.json({ error: 'Invalid payout review action.' }, { status: 400 });
    }
    const db = getAdminDb();
    const profileRef = db.collection('payoutProfiles').doc(sellerId);
    await db.runTransaction(async (transaction) => {
      const profile = await transaction.get(profileRef);
      if (!profile.exists) throw new Error('PROFILE_NOT_FOUND');
      const details = profile.data() || {};
      if (Array.isArray(details.accounts)) {
        const accounts = details.accounts.map((account: Record<string, unknown>) =>
          account.id === accountId
            ? { ...account, reviewStatus, reviewedBy: user.uid, reviewedAt: new Date(), updatedAt: new Date() }
            : account,
        );
        const account = accounts.find((candidate: Record<string, unknown>) => candidate.id === accountId);
        if (!account) throw new Error('ACCOUNT_NOT_FOUND');
        if (reviewStatus === 'verified' && (!/^\d{10}$/.test(String(account.accountNumber || '')) || !account.bankName || !account.accountName)) {
          throw new Error('ACCOUNT_INCOMPLETE');
        }
        transaction.update(profileRef, { accounts, updatedAt: FieldValue.serverTimestamp() });
      } else {
        if (accountId !== 'legacy') throw new Error('ACCOUNT_NOT_FOUND');
        if (reviewStatus === 'verified' && (!/^\d{10}$/.test(String(details.accountNumber || '')) || !details.bankName || !details.accountName)) {
          throw new Error('ACCOUNT_INCOMPLETE');
        }
        transaction.update(profileRef, { reviewStatus, reviewedBy: user.uid,
          reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      }
      transaction.set(db.collection('activityLogs').doc(), { userId: user.uid,
        action: 'payout_profile_reviewed', sellerId, accountId, reviewStatus, createdAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ success: true, reviewStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'PROFILE_NOT_FOUND' || message === 'ACCOUNT_NOT_FOUND') {
      return NextResponse.json({ error: 'Payout account not found.' }, { status: 404 });
    }
    if (message === 'ACCOUNT_INCOMPLETE') {
      return NextResponse.json({ error: 'This payout account is incomplete and cannot be verified.' }, { status: 409 });
    }
    console.error('Payout review failed:', error);
    return NextResponse.json({ error: 'Unable to review payout profile.' }, { status: 500 });
  }
}
