/**
 * Custom Hook: useBuyerOrders
 * Real-time buyer orders with Firestore listener
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface BuyerOrder {
  id: string;
  buyerId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    sellerId: string;
    sellerName: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: any;
  updatedAt: any;
  deliveryDate?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  notes?: string;
}

interface UseBuyerOrdersReturn {
  orders: BuyerOrder[];
  loading: boolean;
  error: Error | null;
  getOrdersByStatus: (status: string) => BuyerOrder[];
  activeOrders: BuyerOrder[];
  completedOrders: BuyerOrder[];
  totalSpent: number;
}

export function useBuyerOrders(buyerId: string): UseBuyerOrdersReturn {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!buyerId || !db) {
      setLoading(false);
      return;
    }

    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('buyerId', '==', buyerId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          try {
            const ordersList: BuyerOrder[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            } as BuyerOrder));

            setOrders(ordersList);
            setError(null);
            setLoading(false);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            ErrorHandler.logError('BUYER_ORDERS_PARSE', error.message, 'error');
            setError(error);
            setLoading(false);
          }
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          ErrorHandler.logError('BUYER_ORDERS_LISTEN', error.message, 'error');
          setError(error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      ErrorHandler.logError('BUYER_ORDERS_SETUP', error.message, 'error');
      setError(error);
      setLoading(false);
    }
  }, [buyerId]);

  const getOrdersByStatus = (status: string): BuyerOrder[] => {
    return orders.filter((order) => order.status === status);
  };

  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const completedOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  );

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return {
    orders,
    loading,
    error,
    getOrdersByStatus,
    activeOrders,
    completedOrders,
    totalSpent,
  };
}
