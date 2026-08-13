import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import {
  matchesExpectedPayment,
  verifyFlutterwaveTransaction,
} from '@/lib/server/flutterwave';
import { completeOrderPayment } from '@/lib/server/orderPayment';
import { sendOrderReceipt } from '@/lib/server/orderEmail';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { transactionId, orderId } = await request.json();
    if (!transactionId || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Transaction and order are required.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const orderSnapshot = await db.collection('orders').doc(String(orderId)).get();
    if (!orderSnapshot.exists) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    const order = orderSnapshot.data() || {};
    if (order.userId !== user.uid && order.buyerId !== user.uid) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const transactionRef = String(order.transactionRef || '');
    const paymentSnapshot = await db.collection('transactions').doc(transactionRef).get();
    const expectedPayment = paymentSnapshot.data();
    if (
      !transactionRef ||
      !paymentSnapshot.exists ||
      expectedPayment?.userId !== user.uid ||
      String(expectedPayment?.orderId || '') !== String(orderId)
    ) {
      return NextResponse.json(
        { success: false, message: 'Payment intent not found.' },
        { status: 409 }
      );
    }

    const payment = await verifyFlutterwaveTransaction(transactionId);
    if (
      !matchesExpectedPayment(payment, {
        reference: transactionRef,
        amount: Number(expectedPayment.amount),
        currency: String(expectedPayment.currency || 'NGN'),
      })
    ) {
      return NextResponse.json(
        { success: false, message: 'Payment details did not match this order.' },
        { status: 409 }
      );
    }

    const completion = await completeOrderPayment({
      transactionRef,
      providerTransactionId: payment.id,
      providerStatus: payment.status,
    });
    if (completion.requiresRefund) {
      return NextResponse.json({ success: false, message: 'This checkout expired before payment completed. Support has been alerted to review your refund.' }, { status: 409 });
    }
    if (!completion.alreadyCompleted) {
      await sendOrderReceipt(completion.orderId);
    }

    return NextResponse.json({
      success: true,
      message: completion.alreadyCompleted
        ? 'Payment was already confirmed.'
        : 'Payment verified successfully.',
      data: {
        transactionId: payment.id,
        reference: payment.tx_ref,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentType: payment.payment_type,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const configurationError = error?.message === 'FLUTTERWAVE_NOT_CONFIGURED';
    console.error('Payment verification failed:', error?.message);
    return NextResponse.json(
      {
        success: false,
        message: configurationError
          ? 'Payment verification is temporarily unavailable.'
          : 'We could not verify this payment. Please contact support if you were charged.',
      },
      { status: configurationError ? 503 : 502 }
    );
  }
}
