/**
 * Custom Hook: useSellerOrders
 * Real-time seller orders with Firestore listener
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
    sellerId?: string;
    productName?: string;
    minOrderQuantity?: number;
    unitOfMeasure?: string;
    type?: 'retail' | 'wholesale' | 'both';
  }>;
  totalAmount: number;
  status: 'compliance_review' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: any;
  updatedAt: any;
  buyerName?: string;
  buyerEmail?: string;
  shippingAddress?: string;
  buyerType?: 'member' | 'wholesale';
  complianceStatus?: string;
  promisedDeliveryDate?: any;
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
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const multiSellerQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('sellerIds', 'array-contains', sellerId)
      );
      const singleSellerQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('sellerId', '==', sellerId)
      );

      let multiSellerOrders: SellerOrder[] = [];
      let singleSellerOrders: SellerOrder[] = [];
      let multiReady = false;
      let singleReady = false;

      const publishOrders = () => {
        const merged = new Map<string, SellerOrder>();
        [...multiSellerOrders, ...singleSellerOrders].forEach((order) => merged.set(order.id, order));
        const ordersList = Array.from(merged.values())
          .filter((order) => order.items?.some((item) => item.sellerId === sellerId))
          .sort((a, b) => {
            const toMillis = (value: any) => value?.toMillis?.() || value?.getTime?.() || 0;
            return toMillis(b.createdAt) - toMillis(a.createdAt);
          });
        setOrders(ordersList);
        setError(null);
        if (multiReady && singleReady) setLoading(false);
      };

      const unsubscribeMulti = onSnapshot(
        multiSellerQuery,
        (snapshot) => {
          try {
            multiSellerOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SellerOrder));
            multiReady = true;
            publishOrders();
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

      const unsubscribeSingle = onSnapshot(
        singleSellerQuery,
        (snapshot) => {
          singleSellerOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SellerOrder));
          singleReady = true;
          publishOrders();
        },
        (err) => {
          const subscriptionError = err instanceof Error ? err : new Error(String(err));
          ErrorHandler.logError('SELLER_LEGACY_ORDERS_LISTEN', subscriptionError.message, 'error');
          setError(subscriptionError);
          setLoading(false);
        }
      );

      return () => {
        unsubscribeMulti();
        unsubscribeSingle();
      };
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
