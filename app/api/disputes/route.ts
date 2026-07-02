import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { canDecideDisputes, canOperateDisputes } from '@/lib/operations/access';

const REASONS = ['not_received', 'not_as_described', 'damaged', 'missing_items', 'unauthorized', 'other'];
const DECISIONS = ['full_refund', 'partial_refund', 'release_seller', 'replacement', 'escalated'];

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getAdminDb();
  const snapshot = canOperateDisputes(user)
    ? await db.collection('disputes').orderBy('updatedAt', 'desc').limit(100).get()
    : await db.collection('disputes').where('participantIds', 'array-contains', user.uid).limit(50).get();
  return NextResponse.json({ disputes: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
}

export async function POST(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json(); const orderId = String(body.orderId || ''); const reason = String(body.reason || ''); const description = String(body.description || '').trim();
  if (!orderId || !REASONS.includes(reason) || description.length < 10 || description.length > 3000) return NextResponse.json({ error: 'Provide a valid order, reason, and description.' }, { status: 400 });
  const db = getAdminDb(); const orderRef = db.collection('orders').doc(orderId); const orderSnap = await orderRef.get();
  if (!orderSnap.exists) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const order = orderSnap.data() || {}; const buyerId = String(order.userId || order.buyerId || '');
  if (buyerId !== user.uid) return NextResponse.json({ error: 'Only the buyer can open this dispute.' }, { status: 403 });
  if (order.paymentStatus !== 'completed' || !['shipped', 'delivered'].includes(String(order.status || ''))) return NextResponse.json({ error: 'A dispute can be opened after a paid order has shipped.' }, { status: 409 });
  const sellerIds: string[] = Array.from(new Set<string>((order.sellerIds || (order.sellerId ? [order.sellerId] : [])).map((value: unknown) => String(value))));
  const duplicate = await db.collection('disputes').where('orderId', '==', orderId).where('active', '==', true).limit(1).get();
  if (!duplicate.empty) return NextResponse.json({ error: 'An active dispute already exists for this order.' }, { status: 409 });
  const id = db.collection('disputes').doc(); const now = Timestamp.now(); const holdAmount = Number(order.sellerNetAmount || order.totalAmount || order.total || 0);
  const holdAllocations: Record<string, number> = {};
  (Array.isArray(order.items) ? order.items : []).forEach((item: any) => { const sellerId = String(item.sellerId || order.sellerId || ''); if (!sellerId) return; const amount = Number(item.total || item.subtotal || (Number(item.price || 0) * Number(item.quantity || 0))); holdAllocations[sellerId] = (holdAllocations[sellerId] || 0) + (Number.isFinite(amount) ? amount : 0); });
  if (!Object.keys(holdAllocations).length && sellerIds.length) holdAllocations[sellerIds[0]] = holdAmount;
  await db.runTransaction(async (tx) => {
    tx.set(id, { orderId, buyerId, sellerIds, participantIds: [buyerId, ...sellerIds], reason, description, evidence: Array.isArray(body.evidence) ? body.evidence.slice(0, 10) : [], status: 'open', active: true, assignedTo: null, holdAmount, holdAllocations, resolution: null, internalNotes: [], history: [{ action: 'opened', by: user.uid, at: now }], createdAt: now, updatedAt: now });
    tx.update(orderRef, { disputeStatus: 'open', payoutHold: true, payoutHoldAmount: holdAmount, updatedAt: now });
    Object.entries(holdAllocations).forEach(([sellerId, amount]) => tx.set(db.collection('sellerBalances').doc(sellerId), { available: FieldValue.increment(-amount), held: FieldValue.increment(amount), updatedAt: now }, { merge: true }));
  });
  return NextResponse.json({ success: true, id: id.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json(); const disputeId = String(body.disputeId || ''); const action = String(body.action || '');
  const db = getAdminDb(); const ref = db.collection('disputes').doc(disputeId); const snap = await ref.get(); if (!snap.exists) return NextResponse.json({ error: 'Dispute not found.' }, { status: 404 });
  const dispute = snap.data() || {}; const now = Timestamp.now(); const updates: any = { updatedAt: now, history: FieldValue.arrayUnion({ action, by: user!.uid, at: now }) };
  const participant = Array.isArray(dispute.participantIds) && dispute.participantIds.includes(user.uid);
  if (action === 'message' && (participant || canOperateDisputes(user))) {
    const message = String(body.message || '').trim(); if (!message || message.length > 3000) return NextResponse.json({ error: 'Enter a valid message.' }, { status: 400 });
    updates.history = FieldValue.arrayUnion({ action: 'message', by: user.uid, message, at: now });
  }
  else if (action === 'appeal' && participant && dispute.status === 'resolved') { updates.status = 'appealed'; updates.active = true; updates.history = FieldValue.arrayUnion({ action: 'appealed', by: user.uid, reason: String(body.reason || '').slice(0, 2000), at: now }); }
  else if (!canOperateDisputes(user)) return NextResponse.json({ error: 'Dispute staff access required.' }, { status: 403 });
  else if (action === 'assign') { updates.assignedTo = body.assignedTo || user!.uid; updates.status = 'under_review'; }
  else if (action === 'request_seller_response') updates.status = 'awaiting_seller';
  else if (action === 'resolve' && DECISIONS.includes(body.decision)) {
    if (!canDecideDisputes(user)) return NextResponse.json({ error: 'A dispute officer must make this decision.' }, { status: 403 });
    const staysOpen = ['escalated', 'replacement'].includes(body.decision);
    const amount = body.decision === 'partial_refund' ? Number(body.amount || 0) : body.decision === 'full_refund' ? Number(dispute.holdAmount || 0) : 0;
    if (body.decision === 'partial_refund' && (!Number.isFinite(amount) || amount <= 0 || amount > Number(dispute.holdAmount || 0))) return NextResponse.json({ error: 'Enter a valid partial refund amount.' }, { status: 400 });
    updates.status = body.decision === 'escalated' ? 'under_review' : body.decision === 'replacement' ? 'awaiting_seller' : 'resolved'; updates.active = staysOpen; updates.resolution = { decision: body.decision, amount, summary: String(body.summary || '').slice(0, 2000), decidedBy: user!.uid, decidedAt: now };
  }
  else return NextResponse.json({ error: 'Invalid dispute action.' }, { status: 400 });
  await db.runTransaction(async (tx) => {
    tx.update(ref, updates);
    if (action === 'resolve' && !updates.active) {
      const held = Number(dispute.holdAmount || 0); const refund = Number(updates.resolution?.amount || 0); const releaseRatio = held > 0 ? Math.max(held - refund, 0) / held : 0;
      Object.entries(dispute.holdAllocations || {}).forEach(([sellerId, rawAmount]) => { const allocation = Number(rawAmount || 0); tx.set(db.collection('sellerBalances').doc(sellerId), { held: FieldValue.increment(-allocation), available: FieldValue.increment(allocation * releaseRatio), updatedAt: now }, { merge: true }); });
      tx.set(db.collection('orders').doc(dispute.orderId), { payoutHold: false, disputeStatus: 'resolved', updatedAt: now }, { merge: true });
      if (refund > 0) tx.set(db.collection('refunds').doc(), { disputeId, orderId: dispute.orderId, buyerId: dispute.buyerId, amount: refund, status: 'approved_pending_provider', approvedBy: user!.uid, createdAt: now });
    }
    tx.set(db.collection('activityLogs').doc(), { userId: user!.uid, action: `dispute_${action}`, disputeId, createdAt: now });
  });
  return NextResponse.json({ success: true });
}
