import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  matchesExpectedPayment,
  verifyFlutterwaveTransaction,
} from '@/lib/server/flutterwave';
import { completeOrderPayment, failOrderPayment } from '@/lib/server/orderPayment';
import { sendOrderReceipt } from '@/lib/server/orderEmail';
import { completeMembershipPayment } from '@/lib/server/membershipPayment';
import { Timestamp } from 'firebase-admin/firestore';

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function hasValidSignature(
  request: NextRequest,
  rawBody: string,
  secretHash: string
): boolean {
  const currentSignature = request.headers.get('flutterwave-signature');
  if (currentSignature) {
    const expected = createHmac('sha256', secretHash)
      .update(rawBody)
      .digest('base64');
    if (safeEqual(currentSignature, expected)) return true;
  }

  const legacySignature =
    request.headers.get('verif-hash') ||
    request.headers.get('verificationhash');
  return Boolean(legacySignature && safeEqual(legacySignature, secretHash));
}

export async function POST(request: NextRequest) {
  const secretHash =
    process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_SECRET_HASH;
  if (!secretHash) {
    console.error('Flutterwave webhook secret is not configured.');
    return NextResponse.json({ success: false }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!hasValidSignature(request, rawBody, secretHash)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    if (payload?.event !== 'charge.completed' || !payload?.data) {
      return NextResponse.json({ success: true });
    }

    const eventPayment = payload.data;
    const transactionRef = String(eventPayment.tx_ref || '');
    if (!transactionRef) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const db = getAdminDb();
    const expectedSnapshot = await db
      .collection('transactions')
      .doc(transactionRef)
      .get();
    if (!expectedSnapshot.exists) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    const expected = expectedSnapshot.data() || {};

    if (eventPayment.status === 'successful') {
      const verified = await verifyFlutterwaveTransaction(eventPayment.id);
      if (
        !matchesExpectedPayment(verified, {
          reference: transactionRef,
          amount: Number(expected.amount),
          currency: String(expected.currency || 'NGN'),
        })
      ) {
        return NextResponse.json({ success: false }, { status: 409 });
      }

      if (expected.type === 'membership_activation') {
        await completeMembershipPayment({
          reference: transactionRef,
          providerTransactionId: verified.id,
          providerStatus: verified.status,
        });
      } else {
        const completion = await completeOrderPayment({
          transactionRef,
          providerTransactionId: verified.id,
          providerStatus: verified.status,
        });
        if (!completion.alreadyCompleted) {
          await sendOrderReceipt(completion.orderId);
        }
      }
    } else if (eventPayment.status === 'failed') {
      if (expected.type === 'membership_activation') {
        await expectedSnapshot.ref.update({
          status: 'failed',
          providerTransactionId: String(eventPayment.id || ''),
          failureReason: eventPayment.processor_response || 'Payment failed',
          updatedAt: Timestamp.now(),
        });
      } else {
        await failOrderPayment({
          transactionRef,
          providerTransactionId: eventPayment.id,
          reason: eventPayment.processor_response || 'Payment failed',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Flutterwave webhook processing failed:', error?.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active' });
}
