import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasAnyRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    const body = await request.json(); const orderId = String(body.orderId || ''); const decision = String(body.decision || '');
    if (!orderId || !['cleared', 'exception'].includes(decision)) return NextResponse.json({ error: 'Invalid compliance decision.' }, { status: 400 });
    const db = getAdminDb(); const ref = db.collection('orders').doc(orderId); const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    const order = snapshot.data() || {}; const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (transaction) => {
      transaction.update(ref, { complianceStatus: decision, 'complianceCheckpoints.supplierKyc': decision === 'cleared' ? 'passed' : 'exception',
        ...(decision === 'cleared' && order.status === 'compliance_review' ? { status: 'pending' } : {}), complianceReviewedBy: user.uid, complianceReviewedAt: now, updatedAt: now });
      transaction.set(db.collection('notifications').doc(), { userId: String(order.userId || order.buyerId), title: decision === 'cleared' ? 'Order compliance cleared' : 'Order compliance exception',
        message: decision === 'cleared' ? `Order #${orderId} passed supplier compliance and can proceed.` : `Order #${orderId} requires supplier compliance action.`, type: 'alert', read: false,
        data: { orderId, link: `/orders/${orderId}`, category: 'compliance' }, createdAt: now });
      transaction.set(db.collection('activityLogs').doc(), { userId: user.uid, action: 'order_compliance_reviewed', orderId, decision, createdAt: now });
    });
    return NextResponse.json({ success: true, complianceStatus: decision });
  } catch (error) { console.error('Compliance review failed:', error); return NextResponse.json({ error: 'Unable to review order compliance.' }, { status: 500 }); }
}
