import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

async function requireSeller(request: NextRequest) {
  const user = await verifyRequestUser(request);
  return user?.roles.some((role) => role === USER_ROLES.SELLER || role === USER_ROLES.FRANCHISE) ? user : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const snapshot = await getAdminDb().collection('payoutProfiles').doc(user.uid).get();
    if (!snapshot.exists) return NextResponse.json({ profile: null });
    const data = snapshot.data() || {};
    return NextResponse.json({ profile: {
      bankName: data.bankName || '', accountName: data.accountName || '',
      accountLast4: data.accountLast4 || '', reviewStatus: data.reviewStatus || 'pending_verification',
    }});
  } catch (error) {
    console.error('Payout profile read failed:', error);
    return NextResponse.json({ error: 'Unable to load payout profile.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const body = await request.json();
    const bankName = String(body.bankName || '').trim();
    const accountName = String(body.accountName || '').trim();
    const accountNumber = String(body.accountNumber || '').replace(/\s+/g, '');
    if (bankName.length < 2 || accountName.length < 2 || !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ error: 'Enter the bank, account name, and a valid 10-digit NUBAN account number.' }, { status: 400 });
    }
    await getAdminDb().collection('payoutProfiles').doc(user.uid).set({
      sellerId: user.uid, sellerEmail: user.email || '', bankName: bankName.slice(0, 120),
      accountName: accountName.slice(0, 160), accountNumber, accountLast4: accountNumber.slice(-4),
      reviewStatus: 'pending_verification', updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({
      profile: { bankName, accountName, accountLast4: accountNumber.slice(-4), reviewStatus: 'pending_verification' },
      message: 'Payout profile saved and submitted for verification.',
    });
  } catch (error) {
    console.error('Payout profile save failed:', error);
    return NextResponse.json({ error: 'Unable to save payout profile.' }, { status: 500 });
  }
}
