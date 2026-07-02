import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { isTrustedOperator, verifyRequestUser } from '@/lib/server/requestAuth';

const TRANSITIONS: Record<string, string[]> = {
  compliance_review: ['confirmed', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  paid: ['processing'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, trackingNumber, notes } = await request.json();
    const nextStatus = String(status || '').toLowerCase();
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(params.id);
    const orderSnapshot = await orderRef.get();
    if (!orderSnapshot.exists) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const order = orderSnapshot.data() || {};
    const sellerIds = Array.isArray(order.sellerIds) ? order.sellerIds : [];
    const ownsOrder =
      order.sellerId === user.uid || sellerIds.includes(user.uid);
    if (!ownsOrder && !isTrustedOperator(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentStatus = String(order.status || 'pending').toLowerCase();
    if (currentStatus === 'compliance_review' && order.complianceStatus !== 'cleared' && !isTrustedOperator(user)) {
      return NextResponse.json(
        { error: 'Compliance clearance is required before fulfillment can begin.' },
        { status: 409 }
      );
    }
    if (!(TRANSITIONS[currentStatus] || []).includes(nextStatus)) {
      return NextResponse.json(
        { error: `Order cannot move from ${currentStatus} to ${nextStatus}.` },
        { status: 409 }
      );
    }

    const now = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      transaction.update(orderRef, {
        status: nextStatus,
        updatedAt: now,
        ...(trackingNumber
          ? { trackingNumber: String(trackingNumber).slice(0, 120) }
          : {}),
        ...(notes ? { notes: String(notes).slice(0, 1000) } : {}),
        ...(nextStatus === 'delivered' ? { deliveryDate: now, sellerFundsCredited: true } : {}),
      });
      if (nextStatus === 'delivered' && order.sellerFundsCredited !== true && order.paymentStatus === 'completed') {
        const items = Array.isArray(order.items) ? order.items : [];
        const allocations = new Map<string, number>();
        items.forEach((item: any) => {
          const sellerId = String(item.sellerId || order.sellerId || '');
          if (!sellerId) return;
          const lineTotal = Number(item.total || item.subtotal || (Number(item.price || 0) * Number(item.quantity || 0)));
          allocations.set(sellerId, (allocations.get(sellerId) || 0) + (Number.isFinite(lineTotal) ? lineTotal : 0));
        });
        if (!allocations.size && order.sellerId) allocations.set(String(order.sellerId), Number(order.sellerNetAmount || order.totalAmount || order.total || 0));
        allocations.forEach((amount, sellerId) => {
          transaction.set(db.collection('sellerBalances').doc(sellerId), { available: FieldValue.increment(amount), lifetimeEarned: FieldValue.increment(amount), updatedAt: now }, { merge: true });
          transaction.set(db.collection('sellerLedgerEntries').doc(), { sellerId, orderId: params.id, type: 'order_delivered', amount, createdAt: now });
        });
      }
      transaction.set(db.collection('notifications').doc(), {
        userId: String(order.userId || order.buyerId),
        title: 'Order status updated',
        message: `Order #${params.id} is now ${nextStatus}.`,
        type: 'order',
        read: false,
        data: { orderId: params.id, status: nextStatus },
        createdAt: now,
      });
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error: any) {
    console.error('Order status update failed:', error?.code || error?.message);
    return NextResponse.json(
      { error: 'We could not update the order status.' },
      { status: 500 }
    );
  }
}
