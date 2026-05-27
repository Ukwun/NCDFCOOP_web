/**
 * Real-Time Hooks for Firestore Listeners
 * These hooks provide real-time data updates in React components
 */

import { useEffect, useState } from 'react';
import { realTimeOrderService } from '@/lib/services/realTimeOrderService';
import { Order } from '@/lib/types/product';

/**
 * Hook to listen to user's orders in real-time
 * @param userId User ID to listen to
 * @returns [orders, isLoading, error]
 */
export function useRealTimeOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToUserOrders(
      userId,
      (orders) => {
        setOrders(orders);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { orders, isLoading, error };
}

/**
 * Hook to listen to seller's orders in real-time
 */
export function useRealTimeSellerOrders(sellerId: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToSellerOrders(
      sellerId,
      (orders) => {
        setOrders(orders);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sellerId]);

  return { orders, isLoading, error };
}

/**
 * Hook to listen to specific order status in real-time
 */
export function useRealTimeOrderStatus(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToOrderStatus(
      orderId,
      (order) => {
        setOrder(order);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  return { order, isLoading, error };
}

/**
 * Hook to listen to product inventory in real-time
 */
export function useRealTimeInventory(productId: string | undefined) {
  const [stock, setStock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setStock(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToProductInventory(
      productId,
      (stock) => {
        setStock(stock);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [productId]);

  return { stock, isLoading, error };
}

/**
 * Hook to listen to user activity feed in real-time
 */
export function useRealTimeActivity(userId: string | undefined) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToActivityFeed(
      userId,
      (activities) => {
        setActivities(activities);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { activities, isLoading, error };
}

/**
 * Hook to listen to shopping cart in real-time
 */
export function useRealTimeCart(userId: string | undefined) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToCart(
      userId,
      (items) => {
        setCartItems(items);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { cartItems, isLoading, error };
}

/**
 * Hook to listen to notifications in real-time
 */
export function useRealTimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = realTimeOrderService.subscribeToNotifications(
      userId,
      (notifications) => {
        setNotifications(notifications);
        // Count unread notifications
        const unread = notifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return { notifications, unreadCount, isLoading, error };
}
