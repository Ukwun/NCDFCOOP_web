/**
 * Real-Time Order Tracking Service
 * Uses Firestore listeners for live order updates
 */

import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, Unsubscribe, getDocs, doc } from 'firebase/firestore';
import { Order } from '@/lib/types/product';

function timestampMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

class RealTimeOrderService {
  private unsubscribers: Map<string, Unsubscribe> = new Map();

  /**
   * Subscribe to user's orders with real-time updates
   * Returns unsubscribe function
   */
  subscribeToUserOrders(
    userId: string,
    onOrdersChange: (orders: Order[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, where('userId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }) as Order);

          // Sort by createdAt descending (newest first)
          orders.sort((a, b) => {
            const aTime = timestampMillis(a.createdAt);
            const bTime = timestampMillis(b.createdAt);
            return bTime - aTime;
          });

          onOrdersChange(orders);
        },
        (error) => {
          console.error('Error listening to orders:', error);
          if (onError) onError(error as Error);
        }
      );

      // Store unsubscriber for cleanup
      this.unsubscribers.set(`orders_${userId}`, unsubscribe);

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to orders:', error);
      throw error;
    }
  }

  /**
   * Subscribe to seller's orders with real-time updates
   */
  subscribeToSellerOrders(
    sellerId: string,
    onOrdersChange: (orders: Order[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, where('sellerIds', 'array-contains', sellerId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }) as Order);

          orders.sort((a, b) => {
            const aTime = timestampMillis(a.createdAt);
            const bTime = timestampMillis(b.createdAt);
            return bTime - aTime;
          });

          onOrdersChange(orders);
        },
        (error) => {
          console.error('Error listening to seller orders:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`seller_orders_${sellerId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to seller orders:', error);
      throw error;
    }
  }

  /**
   * Subscribe to specific order for real-time status updates
   */
  subscribeToOrderStatus(
    orderId: string,
    onOrderChange: (order: Order) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(
        orderDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const order = {
              id: snapshot.id,
              ...snapshot.data(),
            } as Order;
            onOrderChange(order);
          }
        },
        (error) => {
          console.error('Error listening to order status:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`order_${orderId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to order status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time inventory updates for a product
   */
  subscribeToProductInventory(
    productId: string,
    onStockChange: (stock: number) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const productDocRef = doc(db, 'products', productId);

      const unsubscribe = onSnapshot(
        productDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const product = snapshot.data();
            onStockChange(product.stock || 0);
          }
        },
        (error) => {
          console.error('Error listening to inventory:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`inventory_${productId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to inventory:', error);
      throw error;
    }
  }

  /**
   * Subscribe to activity feed (all activities visible to user)
   */
  subscribeToActivityFeed(
    userId: string,
    onActivityChange: (activities: any[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const activityCollection = collection(db, 'activityLogs');
      const q = query(activityCollection, where('userId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activities = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }) as any)
            .sort((a: any, b: any) => {
              const aTime = a.timestamp ? new Date(a.timestamp as any).getTime() : 0;
              const bTime = b.timestamp ? new Date(b.timestamp as any).getTime() : 0;
              return bTime - aTime;
            });

          onActivityChange(activities);
        },
        (error) => {
          console.error('Error listening to activity feed:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`activity_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to activity feed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to cart updates
   */
  subscribeToCart(
    userId: string,
    onCartChange: (items: any[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const cartCollection = collection(db, 'cartItems');
      const q = query(cartCollection, where('userId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          onCartChange(items);
        },
        (error) => {
          console.error('Error listening to cart:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`cart_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to cart:', error);
      throw error;
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(
    userId: string,
    onNotificationsChange: (notifications: any[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const notificationsCollection = collection(db, 'notifications');
      const q = query(notificationsCollection, where('userId', '==', userId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifications = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }) as any)
            .sort((a: any, b: any) => {
              const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
              return bTime - aTime;
            });

          onNotificationsChange(notifications);
        },
        (error) => {
          console.error('Error listening to notifications:', error);
          if (onError) onError(error as Error);
        }
      );

      this.unsubscribers.set(`notifications_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from specific listener
   */
  unsubscribe(key: string): void {
    const unsubscriber = this.unsubscribers.get(key);
    if (unsubscriber) {
      unsubscriber();
      this.unsubscribers.delete(key);
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscriber) => {
      try {
        unsubscriber();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.unsubscribers.clear();
  }
}

export const realTimeOrderService = new RealTimeOrderService();
