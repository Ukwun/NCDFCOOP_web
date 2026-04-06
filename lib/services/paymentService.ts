/**
 * Payment Service
 * Handles payment processing with Flutterwave and Bank Transfers
 */

import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, TRANSACTION_STATUS } from '@/lib/constants/database';

export interface FlutterwavePayment {
  reference: string;
  amount: number;
  email: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: 'flutterwave' | 'bank_transfer';
  createdAt: Timestamp;
}

export interface BankTransferDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  sortCode?: string;
}

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

/**
 * Initialize Flutterwave payment
 */
export async function initiateFlutterwavePayment(
  amount: number,
  email: string,
  userId: string,
  fullName: string,
  orderId: string,
  onSuccess: (reference: string) => Promise<void>,
  onError: (error: string) => void
) {
  try {
    // Load Flutterwave script if not loaded
    if (!window.FlutterwaveCheckout) {
      await loadFlutterwaveScript();
    }

    const reference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
      id: reference,
      userId,
      orderId,
      type: 'order_payment',
      amount,
      email,
      status: TRANSACTION_STATUS.PENDING,
      paymentMethod: 'flutterwave',
      createdAt: Timestamp.now(),
      metadata: { fullName },
    });

    // Initialize Flutterwave checkout
    window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount: amount,
      currency: 'NGN',
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: email,
        name: fullName,
      },
      customizations: {
        title: 'NCDFCOOP Commerce',
        description: `Order #${orderId}`,
        logo: 'https://ncdfcoop.com/logo.png',
      },
      callback: async (data: any) => {
        try {
          if (data.status === 'successful') {
            // Verify payment with Flutterwave
            const isValid = await verifyFlutterwavePayment(data.transaction_id, userId, orderId);

            if (isValid) {
              // Update payment record
              await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
                status: TRANSACTION_STATUS.COMPLETED,
                paymentRef: data.transaction_id,
                flutterwaveReference: data.tx_ref,
                updatedAt: Timestamp.now(),
              });

              await onSuccess(data.transaction_id);
            } else {
              throw new Error('Payment verification failed');
            }
          } else {
            throw new Error('Payment was not successful');
          }
        } catch (error: any) {
          onError(error.message || 'Payment verification failed');
        }
      },
      onclose: function () {
        onError('Payment window closed');
      },
    });
  } catch (error: any) {
    onError(error.message || 'Failed to initialize payment');
  }
}

/**
 * Load Flutterwave script
 */
function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave'));
    document.body.appendChild(script);
  });
}

/**
 * Verify payment with Flutterwave API
 * In production, this should be done on a backend server
 */
async function verifyFlutterwavePayment(
  transactionId: string,
  userId: string,
  orderId: string
): Promise<boolean> {
  try {
    // In a real application, call your backend endpoint
    // This verifies with Flutterwave using the secret key
    const response = await fetch('/api/verify-flutterwave-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        userId,
        orderId,
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
 * Get bank transfer details for manual payment
 */
export function getBankTransferDetails(): BankTransferDetails {
  return {
    accountName: 'NCDFCOOP Commerce',
    accountNumber: '1234567890',
    bankName: 'First Bank Nigeria',
    sortCode: '011',
  };
}

/**
 * Record bank transfer payment intent
 * User will manually transfer money to account and provide proof
 */
export async function recordBankTransferIntent(
  amount: number,
  email: string,
  userId: string,
  fullName: string,
  orderId: string
): Promise<string> {
  try {
    const reference = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record with pending status
    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
      id: reference,
      userId,
      orderId,
      type: 'order_payment',
      amount,
      email,
      status: TRANSACTION_STATUS.PENDING,
      paymentMethod: 'bank_transfer',
      createdAt: Timestamp.now(),
      metadata: {
        fullName,
        bankDetails: getBankTransferDetails(),
        instructions:
          'Please transfer the exact amount to the bank details provided and submit proof of payment',
      },
    });

    return reference;
  } catch (error: any) {
    console.error('Error recording bank transfer intent:', error);
    throw new Error(error.message || 'Failed to create bank transfer payment record');
  }
}

/**
 * Verify and complete bank transfer payment
 * Called when user submits proof of payment
 */
export async function completeBankTransferPayment(
  reference: string,
  proofOfPaymentUrl: string,
  userId: string,
  orderId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, reference), {
      status: TRANSACTION_STATUS.COMPLETED,
      proofOfPayment: proofOfPaymentUrl,
      verifiedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error completing bank transfer payment:', error);
    throw new Error(error.message || 'Failed to verify bank transfer payment');
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

/**
 * Get transaction details
 */
export async function getTransactionDetails(reference: string): Promise<any | null> {
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACTIONS, reference);
    const snapshot = await (await import('firebase/firestore')).getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting transaction details:', error);
    return null;
  }
}
