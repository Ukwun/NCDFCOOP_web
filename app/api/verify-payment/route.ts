import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatus } from '@/lib/services/orderService';

/**
 * Verify Paystack payment reference
 * This endpoint verifies payment status with Paystack backend
 */
export async function POST(request: NextRequest) {
  try {
    const { reference, orderId } = await request.json();

    if (!reference) {
      return NextResponse.json({
        success: false,
        message: 'Payment reference is required',
      }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = await paystackResponse.json();

    if (!paymentData.status) {
      return NextResponse.json({
        success: false,
        message: 'Payment verification failed',
      }, { status: 400 });
    }

    const { data } = paymentData;

    if (data.status === 'success') {
      // Update order payment status if orderId provided
      if (orderId) {
        try {
          await updatePaymentStatus(orderId, 'completed');
        } catch (error) {
          console.error('Failed to update order payment status:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference: data.reference,
          amount: data.amount / 100, // Convert from kobo to naira
          status: data.status,
          customer: data.customer,
        },
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Payment was not successful',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Payment verification failed',
    }, { status: 500 });
  }
}
