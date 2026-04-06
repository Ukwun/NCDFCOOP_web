/**
 * Payment Service
 * Handles payment processing and transactions
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../constants/database';
import { ErrorHandler } from '../../error/errorHandler';

export interface ProcessPaymentPayload {
  orderId: string;
  amount: number;
  paymentMethod: 'card' | 'bank_transfer' | 'wallet';
  transactionDetails?: {
    cardLast4?: string;
    bankName?: string;
  };
}

export interface InitiateRefundPayload {
  orderId: string;
  amount: number;
  reason: string;
}

class PaymentService {
  /**
   * Process payment for an order
   */
  async processPayment(payload: ProcessPaymentPayload) {
    try {
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const transaction = {
        transactionId,
        orderId: payload.orderId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        status: 'completed',
        transactionDetails: payload.transactionDetails || {},
        createdAt: Timestamp.now(),
      };

      // Save transaction
      const txRef = doc(collection(db, COLLECTIONS.TRANSACTIONS), transactionId);
      await setDoc(txRef, transaction);

      // Update order payment status
      const orderRef = doc(db, COLLECTIONS.ORDERS, payload.orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'paid',
        transactionId,
        updatedAt: Timestamp.now(),
      });

      ErrorHandler.logInfo('PAYMENT_PROCESSED', `Payment processed for order ${payload.orderId}`);
      return { success: true, transactionId };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('PROCESS_PAYMENT_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(payload: InitiateRefundPayload) {
    try {
      const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const refund = {
        refundId,
        orderId: payload.orderId,
        amount: payload.amount,
        reason: payload.reason,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      // Save refund record
      const refundRef = doc(collection(db, COLLECTIONS.REFUNDS), refundId);
      await setDoc(refundRef, refund);

      // Update order payment status
      const orderRef = doc(db, COLLECTIONS.ORDERS, payload.orderId);
      await updateDoc(orderRef, {
        paymentStatus: 'refunded',
        updatedAt: Timestamp.now(),
      });

      ErrorHandler.logInfo('REFUND_INITIATED', `Refund initiated for order ${payload.orderId}`);
      return { success: true, refundId };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('INITIATE_REFUND_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string) {
    try {
      const txRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId);
      const txDoc = await (await import('firebase/firestore')).getDoc(txRef);

      if (!txDoc.exists()) {
        throw new Error(`Transaction ${transactionId} not found`);
      }

      return {
        id: txDoc.id,
        ...txDoc.data(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('GET_TRANSACTION_ERROR', err.message, 'error');
      throw err;
    }
  }
}

export const paymentService = new PaymentService();
