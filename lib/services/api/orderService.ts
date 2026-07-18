/**
 * Order Service
 * Handles all order-related API operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { COLLECTIONS } from '../../constants/database';
import { ErrorHandler } from '../../error/errorHandler';

export interface UpdateOrderStatusPayload {
  orderId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
}

class OrderService {
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
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('Your session expired. Please sign in again.');
      const response = await fetch(`/api/orders/${encodeURIComponent(payload.orderId)}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: payload.status, trackingNumber: payload.trackingNumber, notes: payload.notes }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Order status update failed.');

      ErrorHandler.logInfo('ORDER_STATUS_UPDATED', `Order ${payload.orderId} status updated to ${payload.status}`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('UPDATE_ORDER_STATUS_ERROR', err.message, 'error');
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
      // Keep both shapes while legacy orders are still in circulation. These
      // are single-field seller-scoped queries, so they need no composite
      // index and remain compatible with Firestore security rules.
      const multiSellerOrdersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('sellerIds', 'array-contains', sellerId)
      );
      const singleSellerOrdersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('sellerId', '==', sellerId)
      );

      const [multiSellerSnapshot, singleSellerSnapshot] = await Promise.all([
        getDocs(multiSellerOrdersQuery),
        getDocs(singleSellerOrdersQuery),
      ]);
      const orderMap = new Map<string, any>();
      [...multiSellerSnapshot.docs, ...singleSellerSnapshot.docs].forEach((document) => {
        orderMap.set(document.id, { id: document.id, ...document.data() });
      });

      return Array.from(orderMap.values()).sort((a, b) => {
        const toMillis = (value: any) => value?.toMillis?.() || value?.getTime?.() || 0;
        return toMillis(b.createdAt) - toMillis(a.createdAt);
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('GET_SELLER_ORDERS_ERROR', err.message, 'error');
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
