import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';

const CODE_PATTERN = /^NCDF-[A-Z0-9]{6}$/;

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await request.json().catch(() => ({}));
    const referralCode = String(payload.referralCode || '').trim().toUpperCase();
    if (!CODE_PATTERN.test(referralCode)) {
      return NextResponse.json({ error: 'This referral code is not valid.' }, { status: 400 });
    }

    const db = getAdminDb();
    const attributionRef = db.collection('referralAttributions').doc(user.uid);
    const referrerQuery = await db.collection('members')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();
    if (referrerQuery.empty) {
      return NextResponse.json({ error: 'This referral code was not found.' }, { status: 404 });
    }

    const referrerId = referrerQuery.docs[0].id;
    if (referrerId === user.uid) {
      return NextResponse.json({ error: 'You cannot refer your own account.' }, { status: 409 });
    }

    const now = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(attributionRef);
      if (existing.exists) {
        const data = existing.data() || {};
        if (data.referrerId !== referrerId) throw new Error('REFERRAL_ALREADY_ATTRIBUTED');
        return;
      }

      const referralRef = db.collection('members').doc(referrerId)
        .collection('referrals').doc(user.uid);
      transaction.create(attributionRef, {
        referredUserId: user.uid,
        referredEmail: user.email || '',
        referrerId,
        referralCode,
        status: 'pending',
        qualificationMinimum: 5000,
        rewardPoints: 2500,
        createdAt: now,
        updatedAt: now,
      });
      transaction.set(referralRef, {
        referredUserId: user.uid,
        referredEmail: user.email || '',
        status: 'pending',
        bonusEarned: 0,
        rewardPoints: 2500,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      transaction.set(db.collection('members').doc(user.uid), {
        referredBy: referrerId,
        referralAttributedAt: now,
      }, { merge: true });
      transaction.set(db.collection('members').doc(referrerId), {
        referralCount: FieldValue.increment(1),
        updatedAt: now,
      }, { merge: true });
    });

    return NextResponse.json({ success: true, status: 'pending' });
  } catch (error: any) {
    if (error?.message === 'REFERRAL_ALREADY_ATTRIBUTED') {
      return NextResponse.json({ error: 'This account already has a different referrer.' }, { status: 409 });
    }
    console.error('Referral attribution failed:', error?.message);
    return NextResponse.json({ error: 'Referral attribution is temporarily unavailable.' }, { status: 503 });
  }
}
