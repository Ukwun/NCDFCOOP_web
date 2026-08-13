import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export type InventoryReleaseResult = 'released' | 'already_released' | 'not_expired' | 'not_found' | 'paid';

export async function releaseOrderInventory(
  orderId: string,
  options: { now?: FirebaseFirestore.Timestamp; reason?: string; requireExpired?: boolean } = {},
): Promise<InventoryReleaseResult> {
  const db = getAdminDb();
  const orderRef = db.collection('orders').doc(orderId);
  const now = options.now || Timestamp.now();

  return db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) return 'not_found';
    const order = orderSnapshot.data() || {};
    if (order.paymentStatus === 'completed') return 'paid';
    if (order.inventoryReserved !== true || order.inventoryReleased === true) return 'already_released';
    const expiryMillis = order.reservationExpiresAt?.toMillis?.() || 0;
    if (options.requireExpired !== false && (!expiryMillis || expiryMillis > now.toMillis())) {
      return 'not_expired';
    }

    const rows: Array<{ ref: FirebaseFirestore.DocumentReference; stock: number; quantity: number }> = [];
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const productId = String(item.productId || '');
      const quantity = Number(item.quantity || 0);
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) continue;
      const ref = db.collection('products').doc(productId);
      const product = await transaction.get(ref);
      if (product.exists) rows.push({ ref, stock: Number(product.data()?.stock || 0), quantity });
    }

    for (const row of rows) {
      transaction.update(row.ref, { stock: row.stock + row.quantity, updatedAt: now });
    }
    const reason = String(options.reason || 'payment_reservation_expired').slice(0, 160);
    transaction.update(orderRef, {
      inventoryReserved: false,
      inventoryReleased: true,
      inventoryReleasedAt: now,
      paymentStatus: 'expired',
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: now,
    });
    if (order.transactionRef) {
      transaction.set(db.collection('transactions').doc(String(order.transactionRef)), {
        status: 'expired',
        failureReason: reason,
        updatedAt: now,
      }, { merge: true });
    }
    transaction.set(db.collection('notifications').doc(), {
      userId: String(order.buyerId || order.userId || ''),
      title: 'Checkout expired',
      message: `Order #${orderId} expired before payment was completed. Reserved stock has been released.`,
      type: 'payment',
      read: false,
      data: { orderId, status: 'expired' },
      createdAt: now,
    });
    transaction.set(db.collection('activityLogs').doc(), {
      action: 'order_inventory_released',
      orderId,
      reason,
      createdAt: now,
    });
    return 'released';
  });
}

export async function releaseExpiredOrderInventory(limit = 100) {
  const db = getAdminDb();
  const now = Timestamp.now();
  const snapshot = await db.collection('orders')
    .where('inventoryReserved', '==', true)
    .where('reservationExpiresAt', '<=', now)
    .orderBy('reservationExpiresAt', 'asc')
    .limit(Math.min(Math.max(limit, 1), 250))
    .get();
  const results = await Promise.all(snapshot.docs.map((doc) =>
    releaseOrderInventory(doc.id, { now, reason: 'payment_reservation_expired', requireExpired: true }),
  ));
  return {
    scanned: snapshot.size,
    released: results.filter((result) => result === 'released').length,
    skipped: results.filter((result) => result !== 'released').length,
    hasMore: snapshot.size >= Math.min(Math.max(limit, 1), 250),
  };
}

