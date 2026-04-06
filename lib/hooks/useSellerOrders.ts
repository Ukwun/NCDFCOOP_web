/**
 * Custom Hook: useSellerOrders
 * Real-time seller orders with Firestore listener
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface SellerOrder {
  id: string;
  sellerId: string;
  buyerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: any;
  updatedAt: any;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddress?: string;
}

interface UseSellerOrdersReturn {
  orders: SellerOrder[];
  loading: boolean;
  error: Error | null;
  getOrdersByStatus: (status: string) => SellerOrder[];
  recentOrders: SellerOrder[];
}

export function useSellerOrders(sellerId: string): UseSellerOrdersReturn {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId || !db) {
      setLoading(false);
      return;
    }

    try {
      // Note: This assumes you have a seller field in orders or a separate seller-orders collection
      // Adjust the query based on your Firestore structure
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        // For now, we'll fetch all orders and filter client-side
        // In production, you might have a seller-orders sub-collection
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          try {
            const ordersList: SellerOrder[] = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              } as SellerOrder))
              .filter((order) => {
                // Filter to only this seller's orders
                // This is a client-side filter; better to do server-side with proper schema
                return (
                  order.items?.some(
                    (item: any) => item.sellerId === sellerId
                  ) || false
                );
              });

            setOrders(ordersList);
            setError(null);
            setLoading(false);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            ErrorHandler.logError('SELLER_ORDERS_PARSE', error.message, 'error');
            setError(error);
            setLoading(false);
          }
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          ErrorHandler.logError('SELLER_ORDERS_LISTEN', error.message, 'error');
          setError(error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      ErrorHandler.logError('SELLER_ORDERS_SETUP', error.message, 'error');
      setError(error);
      setLoading(false);
    }
  }, [sellerId]);

  const getOrdersByStatus = (status: string): SellerOrder[] => {
    return orders.filter((order) => order.status === status);
  };

  const recentOrders = orders.slice(0, 5);

  return {
    orders,
    loading,
    error,
    getOrdersByStatus,
    recentOrders,
  };
}
