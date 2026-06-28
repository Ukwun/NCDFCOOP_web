import { randomUUID } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';

const MEMBERSHIP_FEE = 5_000;

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const profileSnapshot = await db.collection('users').doc(user.uid).get();
    if (profileSnapshot.data()?.membershipStatus === 'active') {
      return NextResponse.json(
        { error: 'Your membership is already active.' },
        { status: 409 }
      );
    }

    const reference = `MEM-${Date.now()}-${randomUUID().slice(0, 10)}`;
    const now = Timestamp.now();
    await db.collection('transactions').doc(reference).set({
      id: reference,
      userId: user.uid,
      email: user.email || '',
      type: 'membership_activation',
      amount: MEMBERSHIP_FEE,
      currency: 'NGN',
      status: 'pending',
      paymentMethod: 'flutterwave',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { reference, amount: MEMBERSHIP_FEE, currency: 'NGN' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Membership intent failed:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'Membership payment could not be prepared.' },
      { status: 500 }
    );
  }
}
