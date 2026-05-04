import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

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
