import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { isTrustedOperator, verifyRequestUser } from '@/lib/server/requestAuth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const days = Number((await request.json()).days);
    if (!Number.isInteger(days) || days < 1 || days > 30) return NextResponse.json({ error: 'SLA must be between 1 and 30 days.' }, { status: 400 });
    const db = getAdminDb();
    const ref = db.collection('orders').doc(params.id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const order = snapshot.data() || {};
    const sellers = Array.isArray(order.sellerIds) ? order.sellerIds : [];
    const ownsOrder = order.sellerId === user.uid || sellers.includes(user.uid);
    if (order.buyerType !== 'wholesale' || (!ownsOrder && !isTrustedOperator(user))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const now = Timestamp.now();
    const promised = Timestamp.fromMillis(now.toMillis() + days * 86_400_000);
    await db.runTransaction(async (transaction) => {
      transaction.update(ref, { promisedDeliveryDate: promised, slaDays: days, slaCommittedBy: user.uid, updatedAt: now });
      transaction.set(db.collection('notifications').doc(), { userId: String(order.userId || order.buyerId), title: 'Supplier SLA committed', message: `The supplier committed to a ${days}-day delivery SLA for order #${params.id}.`, type: 'alert', read: false, data: { orderId: params.id, link: `/orders/${params.id}`, category: 'sla' }, createdAt: now });
    });
    return NextResponse.json({ success: true, promisedDeliveryDate: promised.toDate().toISOString() });
  } catch (error) {
    console.error('SLA update failed:', error);
    return NextResponse.json({ error: 'Unable to save the SLA commitment.' }, { status: 500 });
  }
}
