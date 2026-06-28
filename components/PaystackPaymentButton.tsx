'use client';

import { useState } from 'react';
import { initiateFlutterwavePayment } from '@/lib/services/paymentService';
import { createOrder } from '@/lib/services/orderService';

interface FlutterwavePaymentButtonProps {
  userId: string;
  email: string;
  fullName: string;
  amount: number;
  cartItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    sellerId?: string;
    sellerName?: string;
    minOrderQuantity?: number;
    unitOfMeasure?: string;
    type?: string;
  }>;
  shippingAddress: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  buyerType: 'member' | 'wholesale'; // Added buyerType prop
}

export default function PaystackPaymentButton({
  buyerType,
  userId,
  email,
  fullName,
  amount,
  cartItems,
  shippingAddress,
  onSuccess,
  onError,
}: FlutterwavePaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const createdOrder = await createOrder(
        userId,
        cartItems,
        amount,
        shippingAddress,
        'flutterwave',
        buyerType
      );

      // Initialize Flutterwave payment
      await initiateFlutterwavePayment(
        createdOrder.totals.totalAmount,
        email,
        userId,
        fullName,
        createdOrder.orderId,
        createdOrder.transactionRef || '',
        // onSuccess callback
        async () => {
          onSuccess();
        },
        // onError callback
        (error: string) => {
          onError(error);
        }
      );
    } catch (err) {
      console.error('Error initiating payment:', err);
      onError('Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || amount <= 0}
      className="w-full bg-green-600 text-white rounded-lg py-3 font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
    </button>
  );
}
