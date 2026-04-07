'use client';

import { useState } from 'react';
import { initiateFlutterwavePayment } from '@/lib/services/paymentService';
import { createOrder } from '@/lib/services/orderService';
import { clearCart } from '@/lib/services/cartService';

interface FlutterwavePaymentButtonProps {
  userId: string;
  email: string;
  fullName: string;
  amount: number;
  cartItems: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  shippingAddress: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PaystackPaymentButton({
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
      const orderId = `order_${userId}_${Date.now()}`;

      // Initialize Flutterwave payment
      await initiateFlutterwavePayment(
        amount,
        email,
        userId,
        fullName,
        orderId,
        // onSuccess callback
        async (reference: string) => {
          try {
            // Create order in database
            await createOrder(
              userId,
              cartItems,
              amount,
              shippingAddress,
              'flutterwave'
            );

            // Clear cart
            await clearCart(userId);

            // Call success callback
            onSuccess();
          } catch (err) {
            console.error('Error creating order:', err);
            onError('Payment verified but failed to create order. Please contact support.');
          }
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
