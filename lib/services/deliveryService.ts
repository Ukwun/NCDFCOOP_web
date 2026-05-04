/**
 * Delivery Service
 * Handles delivery assignment and status updates
 */

import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, ORDER_STATUS } from '@/lib/constants/database';
import { createNotification } from './notificationService';

// Get deliveries assigned to a delivery personnel
export async function getAssignedDeliveries(deliveryUserId: string) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('deliveryUserId', '==', deliveryUserId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Assign delivery to self
export async function assignDeliveryToSelf(deliveryUserId: string, orderId: string) {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    deliveryUserId,
    deliveryAssignedAt: Timestamp.now(),
    status: ORDER_STATUS.PROCESSING,
  });
  // Notify buyer
  const orderSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  if (orderSnap.exists()) {
    const order = orderSnap.data();
    await createNotification(order.userId, {
      title: 'Order Out for Delivery',
      message: `Your order #${orderId} is now out for delivery!`,
      type: 'order',
      read: false,
      data: { orderId },
    });
  }
}

// Update delivery status (shipped/delivered)
export async function updateDeliveryStatus(orderId: string, status: string) {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status,
    updatedAt: Timestamp.now(),
  });
  // Notify buyer
  const orderSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
  if (orderSnap.exists()) {
    const order = orderSnap.data();
    let message = '';
    if (status === ORDER_STATUS.SHIPPED) message = `Your order #${orderId} has been shipped!`;
    if (status === ORDER_STATUS.DELIVERED) message = `Your order #${orderId} has been delivered!`;
    await createNotification(order.userId, {
      title: 'Order Update',
      message,
      type: 'order',
      read: false,
      data: { orderId, status },
    });
  }
}

// Get orders available for delivery or assigned to this courier
export async function getDeliveryOrders(courierId: string) {
  const q = query(
    collection(db, COLLECTIONS.ORDERS),
    where('status', 'in', ['shipped', 'processing'])
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((o) => !o.courierId || o.courierId === courierId);
}

// Assign order to courier
export async function assignOrderToCourier(orderId: string, courierId: string) {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    courierId,
  });
}

// Update order status (wrapper)
export async function updateOrderStatus(orderId: string, status: string) {
  await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
    status,
  });
}
