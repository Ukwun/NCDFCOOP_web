/**
 * Custom Hook: useBuyerOrders
 * Real-time buyer orders with Firestore listener
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
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
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
}

export function useBuyerOrders(buyerId: string): UseBuyerOrdersReturn {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (nextCursor?: string | null) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Your session expired. Sign in again.');
    const params = new URLSearchParams({ limit: '25' });
    if (nextCursor) params.set('cursor', nextCursor);
    const response = await fetch(`/api/orders?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Orders could not be loaded.');
    return { orders: (payload.orders || []) as BuyerOrder[], cursor: payload.nextCursor || null };
  }, []);

  useEffect(() => {
    if (!buyerId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      void fetchPage().then((page) => {
        setOrders(page.orders);
        setCursor(page.cursor);
        setError(null);
      }).catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        ErrorHandler.logError('BUYER_ORDERS_PAGE', error.message, 'error');
        setError(error);
      }).finally(() => setLoading(false));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      ErrorHandler.logError('BUYER_ORDERS_SETUP', error.message, 'error');
      setError(error);
      setLoading(false);
    }
  }, [buyerId, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const page = await fetchPage(cursor);
      setOrders((current) => [...current, ...page.orders.filter((order) => !current.some((existing) => existing.id === order.id))]);
      setCursor(page.cursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, fetchPage, loadingMore]);

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
    hasMore: Boolean(cursor),
    loadingMore,
    loadMore,
  };
}
