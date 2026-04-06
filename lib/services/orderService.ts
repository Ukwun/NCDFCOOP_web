/**
 * Order Service
 * Handles order management
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  collection,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, ORDER_STATUS } from '@/lib/constants/database';
import { clearCart } from '@/lib/services/cartService';
import { Order } from '@/lib/types/product';

/**
 * Create order from cart
 */
export async function createOrder(
  userId: string,
  items: any[],
  totalAmount: number,
  shippingAddress: string,
  paymentMethod: string
): Promise<string> {
  try {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order: Order = {
      id: orderId,
      userId,
      items,
      totalAmount,
      status: ORDER_STATUS.PENDING,
      paymentStatus: 'pending',
      shippingAddress,
      paymentMethod,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      estimatedDelivery: new Timestamp(
        Timestamp.now().seconds + 7 * 24 * 60 * 60,
        Timestamp.now().nanoseconds
      ), // 7 days
    };

    await setDoc(doc(db, COLLECTIONS.ORDERS, orderId), order);

    // Clear cart
    await clearCart(userId);

    // Update member stats
    await updateDoc(doc(db, COLLECTIONS.MEMBERS, userId), {
      totalPurchases: increment(items.reduce((sum, item) => sum + item.quantity, 0)),
    });

    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get user orders
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Order));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    return docSnap.exists()
      ? ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Order)
      : null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
      paymentStatus,
      status: paymentStatus === 'completed' ? ORDER_STATUS.PAID : ORDER_STATUS.PENDING,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}
