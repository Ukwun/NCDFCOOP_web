import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import {
  matchesExpectedPayment,
  verifyFlutterwaveTransaction,
} from '@/lib/server/flutterwave';
import { completeMembershipPayment } from '@/lib/server/membershipPayment';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, reference } = await request.json();
    if (!transactionId || !reference) {
      return NextResponse.json(
        { error: 'Transaction details are required.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const paymentRef = db.collection('transactions').doc(String(reference));
    const paymentSnapshot = await paymentRef.get();
    const intent = paymentSnapshot.data();
    if (
      !paymentSnapshot.exists ||
      intent?.userId !== user.uid ||
      intent?.type !== 'membership_activation'
    ) {
      return NextResponse.json({ error: 'Payment intent not found.' }, { status: 404 });
    }

    const payment = await verifyFlutterwaveTransaction(transactionId);
    if (
      !matchesExpectedPayment(payment, {
        reference: String(reference),
        amount: Number(intent.amount),
        currency: String(intent.currency || 'NGN'),
      })
    ) {
      return NextResponse.json(
        { error: 'Payment details did not match this membership.' },
        { status: 409 }
      );
    }

    const completion = await completeMembershipPayment({
      reference: String(reference),
      providerTransactionId: payment.id,
      providerStatus: payment.status,
    });

    return NextResponse.json({
      success: true,
      membershipCode: completion.membershipCode,
      message: 'Membership activated successfully.',
    });
  } catch (error: any) {
    console.error('Membership verification failed:', error?.message);
    return NextResponse.json(
      { error: 'We could not verify the membership payment.' },
      { status: 502 }
    );
  }
}
