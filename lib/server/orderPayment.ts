import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  getMembershipTier,
  membershipTierForSpend,
} from '@/lib/membership/tiers';

function money(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

export async function completeOrderPayment(input: {
  transactionRef: string;
  providerTransactionId: string | number;
  providerStatus: string;
}): Promise<{ orderId: string; userId: string; alreadyCompleted: boolean }> {
  const db = getAdminDb();
  const transactionRef = db.collection('transactions').doc(input.transactionRef);

  return db.runTransaction(async (transaction) => {
    const transactionSnapshot = await transaction.get(transactionRef);
    if (!transactionSnapshot.exists) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    const payment = transactionSnapshot.data() || {};
    const orderId = String(payment.orderId || '');
    const userId = String(payment.userId || '');
    if (!orderId || !userId) throw new Error('TRANSACTION_INVALID');

    const orderRef = db.collection('orders').doc(orderId);
    const memberRef = db.collection('members').doc(userId);
    const userRef = db.collection('users').doc(userId);
    const [orderSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(memberRef),
    ]);

    if (!orderSnapshot.exists) throw new Error('ORDER_NOT_FOUND');
    const order = orderSnapshot.data() || {};
    if (order.paymentStatus === 'completed') {
      return { orderId, userId, alreadyCompleted: true };
    }

    const now = Timestamp.now();
    transaction.update(transactionRef, {
      status: 'completed',
      providerTransactionId: String(input.providerTransactionId),
      providerStatus: input.providerStatus,
      completedAt: now,
      updatedAt: now,
    });
    transaction.update(orderRef, {
      paymentStatus: 'completed',
      status: 'confirmed',
      transactionRef: input.transactionRef,
      paidAt: now,
      updatedAt: now,
    });

    if (order.buyerType === 'member') {
      const currentMember = memberSnapshot.data() || {};
      const currentSpent = money(
        currentMember.totalSpent ?? currentMember.totalPurchases ?? 0
      );
      const orderAmount = money(order.totalAmount);
      const nextSpent = money(currentSpent + orderAmount);
      const earningTier = getMembershipTier(
        currentMember.tier || order.memberTier || 'bronze'
      );
      const pointsEarned =
        Math.floor(orderAmount / 100) * earningTier.pointsPerHundredNaira;
      const tier = membershipTierForSpend(nextSpent).id;

      transaction.set(
        memberRef,
        {
          userId,
          totalSpent: nextSpent,
          totalPurchases: nextSpent,
          ordersCount: FieldValue.increment(1),
          loyaltyPoints: FieldValue.increment(pointsEarned),
          rewardsPoints: FieldValue.increment(pointsEarned),
          lifetimePoints: FieldValue.increment(pointsEarned),
          tier,
          isActive: true,
          updatedAt: now,
          ...(memberSnapshot.exists ? {} : { memberSince: now }),
        },
        { merge: true }
      );
      transaction.set(
        userRef,
        { memberTier: tier, updatedAt: now },
        { merge: true }
      );
    }

    transaction.set(db.collection('notifications').doc(), {
      userId,
      title: 'Payment confirmed',
      message: `Payment for order #${orderId} has been confirmed.`,
      type: 'payment',
      read: false,
      data: { orderId, transactionRef: input.transactionRef },
      createdAt: now,
    });

    return { orderId, userId, alreadyCompleted: false };
  });
}

export async function failOrderPayment(input: {
  transactionRef: string;
  providerTransactionId?: string | number;
  reason?: string;
}): Promise<void> {
  const db = getAdminDb();
  const paymentRef = db.collection('transactions').doc(input.transactionRef);

  await db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) return;

    const payment = paymentSnapshot.data() || {};
    const orderRef = db.collection('orders').doc(String(payment.orderId || ''));
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) return;

    const order = orderSnapshot.data() || {};
    if (order.paymentStatus === 'completed' || order.inventoryReleased === true) {
      return;
    }

    const productReads = await Promise.all(
      (Array.isArray(order.items) ? order.items : []).map(async (item: any) => {
        const ref = db.collection('products').doc(String(item.productId || ''));
        return { item, ref, snapshot: await transaction.get(ref) };
      })
    );
    const now = Timestamp.now();

    productReads.forEach(({ item, ref, snapshot }) => {
      if (!snapshot.exists) return;
      transaction.update(ref, {
        stock: Number(snapshot.data()?.stock || 0) + Number(item.quantity || 0),
        updatedAt: now,
      });
    });
    transaction.update(paymentRef, {
      status: 'failed',
      providerTransactionId: input.providerTransactionId
        ? String(input.providerTransactionId)
        : '',
      failureReason: input.reason || 'Payment failed',
      updatedAt: now,
    });
    transaction.update(orderRef, {
      paymentStatus: 'failed',
      status: 'cancelled',
      inventoryReleased: true,
      failureReason: input.reason || 'Payment failed',
      updatedAt: now,
    });
  });
}
