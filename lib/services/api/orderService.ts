/**
 * Order Service
 * Handles all order-related API operations
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../constants/database';
import { ErrorHandler } from '../../error/errorHandler';

export interface CreateOrderPayload {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    sellerId: string;
    sellerName: string;
  }>;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
}

export interface UpdatePaymentStatusPayload {
  orderId: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  transactionId?: string;
}

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(payload: CreateOrderPayload) {
    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData = {
        ...payload,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await setDoc(orderRef, orderData);

      // Create order items as a subcollection
      const itemsRef = collection(orderRef, 'items');
      for (const item of payload.items) {
        await setDoc(doc(itemsRef), item);
      }

      ErrorHandler.logInfo('ORDER_CREATED', `Order ${orderId} created successfully`);
      return { id: orderId, ...orderData };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('CREATE_ORDER_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error(`Order ${orderId} not found`);
      }

      return {
        id: orderDoc.id,
        ...orderDoc.data(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('GET_ORDER_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(payload: UpdateOrderStatusPayload) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, payload.orderId);

      const updateData: any = {
        status: payload.status,
        updatedAt: Timestamp.now(),
      };

      if (payload.trackingNumber) {
        updateData.trackingNumber = payload.trackingNumber;
      }

      if (payload.notes) {
        updateData.notes = payload.notes;
      }

      await updateDoc(orderRef, updateData);

      ErrorHandler.logInfo('ORDER_STATUS_UPDATED', `Order ${payload.orderId} status updated to ${payload.status}`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('UPDATE_ORDER_STATUS_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(payload: UpdatePaymentStatusPayload) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, payload.orderId);

      const updateData: any = {
        paymentStatus: payload.paymentStatus,
        updatedAt: Timestamp.now(),
      };

      if (payload.transactionId) {
        updateData.transactionId = payload.transactionId;
      }

      await updateDoc(orderRef, updateData);

      ErrorHandler.logInfo('PAYMENT_STATUS_UPDATED', `Order ${payload.orderId} payment status updated`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('UPDATE_PAYMENT_STATUS_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Get buyer orders
   */
  async getBuyerOrders(buyerId: string) {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('buyerId', '==', buyerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('GET_BUYER_ORDERS_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Get seller orders
   */
  async getSellerOrders(sellerId: string) {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('items', 'array-contains', { sellerId }),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(ordersQuery);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      // Fall back to client-side filtering if array-contains fails
      try {
        const allOrdersQuery = query(
          collection(db, COLLECTIONS.ORDERS),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(allOrdersQuery);
        return querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((order: any) =>
            order.items?.some((item: any) => item.sellerId === sellerId)
          );
      } catch (fallbackError) {
        const err = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
        ErrorHandler.logError('GET_SELLER_ORDERS_ERROR', err.message, 'error');
        throw err;
      }
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string) {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);

      const updateData: any = {
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      };

      if (reason) {
        updateData.cancellationReason = reason;
      }

      await updateDoc(orderRef, updateData);

      ErrorHandler.logInfo('ORDER_CANCELLED', `Order ${orderId} has been cancelled`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('CANCEL_ORDER_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Get order statistics for seller
   */
  async getSellerOrderStats(sellerId: string) {
    try {
      const orders = await this.getSellerOrders(sellerId);

      const stats = {
        totalOrders: orders.length,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        paidRevenue: 0,
      };

      orders.forEach((order: any) => {
        switch (order.status) {
          case 'pending':
            stats.pendingOrders++;
            break;
          case 'confirmed':
            stats.confirmedOrders++;
            break;
          case 'shipped':
            stats.shippedOrders++;
            break;
          case 'delivered':
            stats.deliveredOrders++;
            break;
          case 'cancelled':
            stats.cancelledOrders++;
            break;
        }

        const sellerItems = order.items?.filter(
          (item: any) => item.sellerId === sellerId
        ) || [];
        const itemsTotal = sellerItems.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );

        stats.totalRevenue += itemsTotal;
        if (order.paymentStatus === 'paid') {
          stats.paidRevenue += itemsTotal;
        }
      });

      return stats;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('GET_SELLER_STATS_ERROR', err.message, 'error');
      throw err;
    }
  }
}

export const orderService = new OrderService();
