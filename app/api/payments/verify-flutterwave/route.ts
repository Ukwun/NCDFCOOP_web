import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, TRANSACTION_STATUS } from '@/lib/constants/database';

/**
 * Verify Flutterwave Payment
 * Server-side payment verification using Flutterwave API
 * Called by client after payment completes, before webhook arrives
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId, orderId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction ID is required',
        },
        { status: 400 }
      );
    }

    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flutterwaveSecretKey) {
      console.error('Flutterwave secret key not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    // 1. VERIFY WITH FLUTTERWAVE API
    console.log(`Verifying Flutterwave transaction: ${transactionId}`);

    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error(`Flutterwave API error: ${verifyResponse.status}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to verify payment with Flutterwave',
        },
        { status: verifyResponse.status }
      );
    }

    const verificationData = await verifyResponse.json();

    if (verificationData.status !== 'success') {
      console.warn('Payment verification failed:', verificationData);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment could not be verified',
          data: verificationData,
        },
        { status: 400 }
      );
    }

    const paymentData = verificationData.data;

    // 2. VERIFY TRANSACTION DETAILS
    if (!paymentData || paymentData.status !== 'successful') {
      console.warn('Payment status is not successful', paymentData?.status);
      return NextResponse.json(
        {
          success: false,
          message: 'Payment was not successful',
        },
        { status: 400 }
      );
    }

    // 3. UPDATE ORDER AND TRANSACTION RECORDS
    // Find transaction by tx_ref
    const txRef = paymentData.tx_ref;

    if (txRef && orderId) {
      try {
        // Update transaction record
        const transactionRef = doc(db!, COLLECTIONS.TRANSACTIONS, txRef);
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
          await updateDoc(transactionRef, {
            status: TRANSACTION_STATUS.COMPLETED,
            flutterwaveTransactionId: transactionId,
            flutterwaveStatus: paymentData.status,
            updatedAt: new Date(),
          });
        }

        // Update order record
        const orderRef = doc(db!, COLLECTIONS.ORDERS, orderId);
        const orderDoc = await getDoc(orderRef);

        if (orderDoc.exists()) {
          await updateDoc(orderRef, {
            paymentStatus: 'completed',
            transactionRef: txRef,
            updatedAt: new Date(),
            status: 'confirmed',
          });

          console.log(`✅ Order ${orderId} payment verified and confirmed`);
        }
      } catch (error) {
        console.error('Error updating Firebase records:', error);
        // Don't fail response - payment is verified even if DB update fails
      }
    }

    // 4. RETURN SUCCESS RESPONSE
    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        data: {
          transactionId: paymentData.id,
          reference: paymentData.tx_ref,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          paymentType: paymentData.payment_type,
          customer: {
            id: paymentData.customer.id,
            email: paymentData.customer.email,
            name: paymentData.customer.name,
            phone: paymentData.customer.phone_number,
          },
          chargeResponse: paymentData.processor_response,
          verifiedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
