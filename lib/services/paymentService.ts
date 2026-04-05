/**
 * Payment Service
 * Handles payment processing with Paystack
 */

import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, TRANSACTION_STATUS } from '@/lib/constants/database';
import { recordTransaction } from '@/lib/services/memberService';

export interface PaystackPayment {
  reference: string;
  amount: number;
  email: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

/**
 * Initialize Paystack payment
 */
export async function initatePaystackPayment(
  amount: number,
  email: string,
  userId: string,
  fullName: string,
  onSuccess: (reference: string) => Promise<void>,
  onError: (error: string) => void
) {
  try {
    // Load Paystack script if not loaded
    if (!window.PaystackPop) {
      await loadPaystackScript();
    }

    const reference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
      id: reference,
      userId,
      type: 'deposit',
      amount,
      email,
      status: TRANSACTION_STATUS.PENDING,
      paymentMethod: 'paystack',
      createdAt: Timestamp.now(),
      metadata: { fullName },
    });

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      email: email,
      amount: amount * 100, // Convert to kobo
      ref: reference,
      onClose: function () {
        onError('Payment window closed');
      },
      onSuccess: async function (response: any) {
        try {
          // Verify payment on backend
          const isValid = await verifyPayment(response.reference, userId);

          if (isValid) {
            // Record transaction
            await recordTransaction(userId, 'deposit', amount, TRANSACTION_STATUS.COMPLETED);

            // Update payment record
            await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
              status: TRANSACTION_STATUS.COMPLETED,
              paymentRef: response.reference,
              updatedAt: Timestamp.now(),
            });

            await onSuccess(response.reference);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error: any) {
          onError(error.message || 'Payment verification failed');
        }
      },
    });

    handler.openIframe();
  } catch (error: any) {
    onError(error.message || 'Failed to initialize payment');
  }
}

/**
 * Load Paystack script
 */
function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });
}

/**
 * Verify payment with Paystack API
 * In production, this should be done on a backend server
 */
async function verifyPayment(reference: string, userId: string): Promise<boolean> {
  try {
    // In a real application, call your backend endpoint
    // backend will verify with Paystack using secret key
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference,
        userId,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(reference: string): Promise<string | null> {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, reference);
    const snapshot = await (await import('firebase/firestore')).getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data().status;
    }
    return null;
  } catch (error) {
    console.error('Error getting payment status:', error);
    return null;
  }
}
