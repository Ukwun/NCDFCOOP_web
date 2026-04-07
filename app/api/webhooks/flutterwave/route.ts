import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, TRANSACTION_STATUS } from '@/lib/constants/database';

/**
 * Flutterwave Webhook Handler
 * Handles payment confirmations from Flutterwave
 * 
 * Called by Flutterwave after payment is completed/failed
 * See: https://developer.flutterwave.com/docs/webhooks/
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('verificationhash');
    const body = await request.json();

    // 1. VERIFY WEBHOOK SIGNATURE
    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 401 }
      );
    }

    const flutterwaveSecretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!flutterwaveSecretHash) {
      console.error('Flutterwave webhook secret not configured');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify signature using crypto
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', flutterwaveSecretHash);
    hash.update(JSON.stringify(body));
    const expectedSignature = hash.digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 2. PROCESS WEBHOOK EVENT
    const event = body.event;
    const data = body.data;

    console.log(`[Flutterwave Webhook] Event: ${event}`, {
      txRef: data.tx_ref,
      transactionId: data.id,
      status: data.status,
      amount: data.amount,
    });

    // Only process charge.completed events
    if (event === 'charge.completed') {
      // Extract order ID from tx_ref (format: TXN-{timestamp}-{random}-{orderId})
      const txRef = data.tx_ref;
      const transactionId = data.id;
      const transactionStatus = data.status; // 'successful', 'pending', 'failed'

      // 3. UPDATE TRANSACTION RECORD
      const transactionRef = doc(db!, COLLECTIONS.TRANSACTIONS, txRef);
      const transactionDoc = await getDoc(transactionRef);

      if (!transactionDoc.exists()) {
        console.warn(`Transaction not found: ${txRef}`);
        return NextResponse.json(
          { success: false, message: 'Transaction not found' },
          { status: 404 }
        );
      }

      const transaction = transactionDoc.data();
      const orderId = transaction.orderId;

      // Update transaction status
      await updateDoc(transactionRef, {
        status:
          transactionStatus === 'successful'
            ? TRANSACTION_STATUS.COMPLETED
            : TRANSACTION_STATUS.FAILED,
        flutterwaveTransactionId: transactionId,
        flutterwaveStatus: transactionStatus,
        updatedAt: new Date(),
      });

      // 4. UPDATE ORDER PAYMENT STATUS
      if (orderId && transactionStatus === 'successful') {
        const orderRef = doc(db!, COLLECTIONS.ORDERS, orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          await updateDoc(orderRef, {
            paymentStatus: 'completed',
            transactionRef: txRef,
            updatedAt: new Date(),
            // Change order status from pending to confirmed
            status: 'confirmed',
          });

          // Send confirmation email (implemented later)
          // await sendOrderConfirmationEmail(orderId);

          console.log(`✅ Order ${orderId} payment confirmed and status updated to 'confirmed'`);
        }
      } else if (transactionStatus === 'failed') {
        // Update order to payment failed
        const orderRef = doc(db!, COLLECTIONS.ORDERS, orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          await updateDoc(orderRef, {
            paymentStatus: 'failed',
            transactionRef: txRef,
            failureReason: data.processor_response || 'Payment failed',
            updatedAt: new Date(),
          });

          console.log(`❌ Order ${orderId} payment failed`);
        }
      }
    }

    // Acknowledge receipt of webhook (keep response simple)
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Flutterwave Webhook Error]', {
      message: error.message,
      stack: error.stack,
    });

    // Still return 200 to prevent Flutterwave from retrying
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 200 } // Flutterwave expects 200 even on error to stop retries
    );
  }
}

/**
 * GET handler for webhook verification
 * Flutterwave sends a GET request to verify endpoint is active
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'active',
      message: 'Flutterwave webhook endpoint is ready',
    },
    { status: 200 }
  );
}
