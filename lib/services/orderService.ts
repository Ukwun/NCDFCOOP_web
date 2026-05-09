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
import { createNotification } from '@/lib/services/notificationService';
import { sendOrderConfirmationEmail } from '@/lib/services/emailService';

/**
 * Create order from cart
 */
export async function createOrder(
  userId: string,
  items: any[],
  totalAmount: number,
  shippingAddress: string,
  paymentMethod: 'flutterwave' | 'bank_transfer' | 'cash_on_delivery'
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

    // Save order
    await setDoc(doc(db, COLLECTIONS.ORDERS, orderId), order);

    // Reduce product stock for each item in the order
    for (const item of items) {
      try {
        const productRef = doc(db, COLLECTIONS.PRODUCTS, item.productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data()?.stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          await updateDoc(productRef, {
            stock: newStock,
            updatedAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error);
        // Continue with other items even if one fails
      }
    }

    // Clear cart
    await clearCart(userId);

    // Update member stats
    await updateDoc(doc(db, COLLECTIONS.MEMBERS, userId), {
      totalPurchases: increment(items.reduce((sum, item) => sum + item.quantity, 0)),
    });

    // Notify user (buyer)
    try {
      await createNotification(userId, {
        title: 'Order Placed',
        message: `Your order #${orderId} has been placed successfully!`,
        type: 'order',
        read: false,
        data: { orderId },
      });
    } catch (e) { /* ignore */ }

    // Send order confirmation email (buyer)
    try {
      // Find buyer email (assume items[0].buyerEmail or fetch from user profile if needed)
      // For demo, skip fetching email and use a placeholder
      const buyerEmail = items[0]?.buyerEmail || 'demo@buyer.com';
      await sendOrderConfirmationEmail(buyerEmail, {
        orderId,
        items: items.map((item: any) => ({ name: item.productName, quantity: item.quantity, price: item.price })),
        total: totalAmount,
        shippingAddress,
      });
    } catch (e) { /* ignore */ }

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

    // Fetch order to get userId
    const orderSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    if (orderSnap.exists()) {
      const order = orderSnap.data() as Order;
      // Create notification for user
      await createNotification(order.userId, {
        title: 'Order Status Updated',
        message: `Your order #${orderId} status changed to: ${status}`,
        type: 'order',
        read: false,
        data: { orderId, status },
      });
      // Email user on status update
      try {
        const firstItem = order.items[0] as (typeof order.items[number] & { buyerEmail?: string }) | undefined;
        const buyerEmail = firstItem?.buyerEmail || 'demo@buyer.com';
        await sendOrderConfirmationEmail(buyerEmail, {
          orderId,
          items: order.items.map((item: any) => ({ name: item.productName, quantity: item.quantity, price: item.price })),
          total: order.totalAmount,
          shippingAddress: order.shippingAddress,
        });
      } catch (e) { /* ignore */ }
    }
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

    // Fetch order to get userId
    const orderSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    if (orderSnap.exists()) {
      const order = orderSnap.data() as Order;
      // Create notification for user
      await createNotification(order.userId, {
        title: 'Payment Status Updated',
        message: `Your order #${orderId} payment status: ${paymentStatus}`,
        type: 'order',
        read: false,
        data: { orderId, paymentStatus },
      });
      // Email user on payment update
      try {
        const firstItem = order.items[0] as (typeof order.items[number] & { buyerEmail?: string }) | undefined;
        const buyerEmail = firstItem?.buyerEmail || 'demo@buyer.com';
        await sendOrderConfirmationEmail(buyerEmail, {
          orderId,
          items: order.items.map((item: any) => ({ name: item.productName, quantity: item.quantity, price: item.price })),
          total: order.totalAmount,
          shippingAddress: order.shippingAddress,
        });
      } catch (e) { /* ignore */ }
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}
