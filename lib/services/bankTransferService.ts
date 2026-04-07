/**
 * Bank Transfer Service
 * Handles manual bank transfer payment tracking and verification
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase/config';
import { storage } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface BankTransferPayment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: 'pending' | 'proof_uploaded' | 'verified' | 'failed';
  proofUrl?: string;
  proofFileName?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode: string;
  description: string;
}

const NCDF_BANK_DETAILS: BankAccountDetails = {
  bankName: 'First Bank Nigeria',
  accountName: 'NCDFCOOP Commerce Limited',
  accountNumber: '3136996240',
  sortCode: '011',
  description: 'First Bank of Nigeria - Use this account for bank transfers',
};

const PROOF_VERIFICATION_TIMEOUT = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Record bank transfer payment intent
 * User will manually transfer money to account and provide proof
 */
export async function recordBankTransferIntent(
  orderId: string,
  userId: string,
  amount: number
): Promise<string> {
  try {
    const paymentId = await createBankTransferPayment(orderId, userId, amount);
    return paymentId;
  } catch (error) {
    console.error('Error recording bank transfer intent:', error);
    throw error;
  }
}

/**
 * Get bank transfer details
 */
export function getBankTransferDetails(): BankAccountDetails {
  return NCDF_BANK_DETAILS;
}

/**
 * Create bank transfer payment record
 */
export async function createBankTransferPayment(
  orderId: string,
  userId: string,
  amount: number
): Promise<string> {
  try {
    const paymentId = `BANK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const bankTransferPayment: BankTransferPayment = {
      id: paymentId,
      orderId,
      userId,
      amount,
      bankName: NCDF_BANK_DETAILS.bankName,
      accountName: NCDF_BANK_DETAILS.accountName,
      accountNumber: NCDF_BANK_DETAILS.accountNumber,
      status: 'pending',
      expiresAt: new Timestamp(
        Timestamp.now().seconds + PROOF_VERIFICATION_TIMEOUT / 1000,
        Timestamp.now().nanoseconds
      ),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save bank transfer payment record
    await setDoc(
      doc(db, COLLECTIONS.TRANSACTIONS, paymentId),
      bankTransferPayment
    );

    return paymentId;
  } catch (error) {
    console.error('Error creating bank transfer payment:', error);
    throw error;
  }
}

/**
 * Upload proof of bank transfer (image/document)
 */
export async function uploadBankTransferProof(
  paymentId: string,
  file: File
): Promise<{
  success: boolean;
  url?: string;
  message: string;
}> {
  try {
    // Validate file
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.type)) {
      return {
        success: false,
        message: 'Invalid file type. Please upload JPG, PNG, WebP, or PDF',
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File too large. Maximum 10MB allowed',
      };
    }

    // Upload to Firebase Storage
    const uploadPath = `bank-transfer-proofs/${paymentId}/${file.name}`;
    const fileRef = ref(storage, uploadPath);
    
    // Upload file
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // Update payment record
    const paymentRef = doc(db, COLLECTIONS.TRANSACTIONS, paymentId);
    await updateDoc(paymentRef, {
      proofUrl: url,
      proofFileName: file.name,
      status: 'proof_uploaded',
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Bank transfer proof uploaded for ${paymentId}`);

    return {
      success: true,
      url,
      message: 'Proof uploaded successfully. We will verify within 24-48 hours.',
    };
  } catch (error: any) {
    console.error('Error uploading bank transfer proof:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload proof',
    };
  }
}

/**
 * Verify bank transfer proof (Admin only)
 */
export async function verifyBankTransferProof(
  paymentId: string,
  verified: boolean,
  adminId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const paymentRef = doc(db, COLLECTIONS.TRANSACTIONS, paymentId);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      return {
        success: false,
        message: 'Payment record not found',
      };
    }

    const payment = paymentDoc.data() as BankTransferPayment;

    if (verified) {
      // Update to verified
      await updateDoc(paymentRef, {
        status: 'verified',
        verifiedBy: adminId,
        verifiedAt: Timestamp.now(),
        notes,
        updatedAt: Timestamp.now(),
      });

      // Update corresponding order
      const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        await updateDoc(orderRef, {
          paymentStatus: 'completed',
          status: 'confirmed',
          transactionRef: paymentId,
          updatedAt: Timestamp.now(),
        });

        console.log(`✅ Bank transfer verified for order ${payment.orderId}`);
      }

      return {
        success: true,
        message: `Payment verified. Order ${payment.orderId} status updated.`,
      };
    } else {
      // Mark as failed
      await updateDoc(paymentRef, {
        status: 'failed',
        verifiedBy: adminId,
        verifiedAt: Timestamp.now(),
        notes: notes || 'Bank transfer proof rejected or payment not found',
        updatedAt: Timestamp.now(),
      });

      // Update order to failed
      const orderRef = doc(db, COLLECTIONS.ORDERS, payment.orderId);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        await updateDoc(orderRef, {
          paymentStatus: 'failed',
          status: 'cancelled',
          failureReason: notes || 'Bank transfer could not be verified',
          updatedAt: Timestamp.now(),
        });

        console.log(`❌ Bank transfer rejected for order ${payment.orderId}`);
      }

      return {
        success: true,
        message: `Payment rejected. Order ${payment.orderId} cancelled.`,
      };
    }
  } catch (error: any) {
    console.error('Error verifying bank transfer proof:', error);
    return {
      success: false,
      message: error.message || 'Verification failed',
    };
  }
}

/**
 * Get pending bank transfer verifications (Admin dashboard)
 */
export async function getPendingBankTransfers(limit: number = 50): Promise<
  (BankTransferPayment & { _id: string })[]
> {
  try {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('paymentMethod', '==', 'bank_transfer'),
      where('status', 'in', ['pending', 'proof_uploaded'])
    );

    const snapshots = await getDocs(q);
    const payments: (BankTransferPayment & { _id: string })[] = [];

    for (const doc of snapshots.docs) {
      payments.push({
        _id: doc.id,
        ...doc.data(),
      } as BankTransferPayment & { _id: string });
    }

    // Sort by createdAt descending
    payments.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return payments.slice(0, limit);
  } catch (error) {
    console.error('Error fetching pending bank transfers:', error);
    throw error;
  }
}

/**
 * Check if bank transfer proof has expired
 */
export function isProofExpired(payment: BankTransferPayment): boolean {
  if (!payment.expiresAt) return false;

  const expiryTime = payment.expiresAt?.toMillis?.() || 0;
  return Date.now() > expiryTime;
}

/**
 * Get bank transfer status for order
 */
export async function getBankTransferStatus(
  orderId: string
): Promise<BankTransferPayment | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where('orderId', '==', orderId),
      where('paymentMethod', '==', 'bank_transfer')
    );

    const snapshots = await getDocs(q);

    if (snapshots.empty) {
      return null;
    }

    const doc = snapshots.docs[0];
    return {
      ...doc.data(),
      id: doc.id,
    } as BankTransferPayment;
  } catch (error) {
    console.error('Error getting bank transfer status:', error);
    return null;
  }
}

/**
 * Format bank account for display (hide some digits)
 */
export function formatBankAccount(accountNumber: string): string {
  // Show only last 4 digits: XXXX 6240
  const last4 = accountNumber.slice(-4);
  return `****${last4}`;
}
