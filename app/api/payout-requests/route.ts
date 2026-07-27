import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { canOperateFinance } from '@/lib/operations/access';
import { USER_ROLES } from '@/lib/constants/database';

const LARGE_PAYOUT_NGN = Number(process.env.LARGE_PAYOUT_NGN || 500000);

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getAdminDb();
  const snap = canOperateFinance(user)
    ? await db.collection('payoutRequests').orderBy('createdAt', 'desc').limit(100).get()
    : await db.collection('payoutRequests').where('sellerId', '==', user.uid).limit(50).get();
  return NextResponse.json({ requests: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
}

export async function POST(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!hasRole(user, USER_ROLES.SELLER)) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
  const body = await request.json(); const amount = Math.round(Number(body.amount || 0) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 1000) return NextResponse.json({ error: 'Minimum payout is ₦1,000.' }, { status: 400 });
  const db = getAdminDb(); const [profile, balance, openDispute] = await Promise.all([db.collection('payoutProfiles').doc(user!.uid).get(), db.collection('sellerBalances').doc(user!.uid).get(), db.collection('disputes').where('sellerIds', 'array-contains', user!.uid).where('active', '==', true).limit(1).get()]);
  const payoutProfile = profile.data() || {}; const funds = balance.data() || {}; const available = Number(funds.available || 0);
  if (payoutProfile.reviewStatus !== 'verified') return NextResponse.json({ error: 'Your payout account must be verified first.' }, { status: 409 });
  if (amount > available) return NextResponse.json({ error: 'The requested amount exceeds your available balance.' }, { status: 409 });
  const flags: string[] = [];
  if (!openDispute.empty) flags.push('open_dispute');
  if (amount >= LARGE_PAYOUT_NGN) flags.push('large_payout');
  if (payoutProfile.changedAfterVerification) flags.push('bank_account_changed');
  const now = Timestamp.now(); const ref = db.collection('payoutRequests').doc();
  await db.runTransaction(async (tx) => {
    tx.set(ref, { sellerId: user!.uid, amount, currency: 'NGN', status: flags.length ? 'exception_review' : 'pending_approval', exceptionFlags: flags, approvalIds: [], requiredApprovals: flags.length ? 2 : 1, payoutProfileSnapshot: { bankName: payoutProfile.bankName || '', accountName: payoutProfile.accountName || '', accountNumber: payoutProfile.accountNumber || '', accountLast4: payoutProfile.accountLast4 || '' }, createdAt: now, updatedAt: now });
    tx.set(db.collection('sellerBalances').doc(user!.uid), { available: FieldValue.increment(-amount), pendingPayout: FieldValue.increment(amount), updatedAt: now }, { merge: true });
    tx.set(db.collection('sellerLedgerEntries').doc(), { sellerId: user!.uid, type: 'payout_reserved', amount: -amount, payoutRequestId: ref.id, createdAt: now });
  });
  return NextResponse.json({ success: true, id: ref.id, status: flags.length ? 'exception_review' : 'pending_approval', flags }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await verifyRequestUser(request); if (!canOperateFinance(user)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
  const body = await request.json(); const id = String(body.payoutRequestId || ''); const action = String(body.action || '');
  const db = getAdminDb(); const ref = db.collection('payoutRequests').doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); if (!snap.exists) throw new Error('NOT_FOUND'); const payout = snap.data() || {}; const now = Timestamp.now();
    if (action === 'approve') {
      const approvals = Array.from(new Set([...(payout.approvalIds || []), user!.uid]));
      const approved = approvals.length >= Number(payout.requiredApprovals || 1);
      tx.update(ref, { approvalIds: approvals, status: approved ? 'approved' : payout.status, updatedAt: now });
    } else if (action === 'mark_processing' && payout.status === 'approved') {
      tx.update(ref, { status: 'processing', processingBy: user!.uid, updatedAt: now });
    } else if (action === 'mark_paid' && payout.status === 'processing' && String(body.externalReference || '').trim()) {
      tx.update(ref, { status: 'paid', externalReference: String(body.externalReference).trim(), paidBy: user!.uid, paidAt: now, updatedAt: now });
      tx.set(db.collection('sellerBalances').doc(payout.sellerId), { pendingPayout: FieldValue.increment(-Number(payout.amount)), lifetimePaid: FieldValue.increment(Number(payout.amount)), updatedAt: now }, { merge: true });
    } else if (action === 'reject' && !['paid', 'rejected'].includes(payout.status)) {
      tx.update(ref, { status: 'rejected', rejectionReason: String(body.reason || '').slice(0, 500), rejectedBy: user!.uid, updatedAt: now });
      tx.set(db.collection('sellerBalances').doc(payout.sellerId), { pendingPayout: FieldValue.increment(-Number(payout.amount)), available: FieldValue.increment(Number(payout.amount)), updatedAt: now }, { merge: true });
    } else throw new Error('INVALID_ACTION');
    tx.set(db.collection('activityLogs').doc(), { userId: user!.uid, action: `payout_${action}`, payoutRequestId: id, createdAt: now });
  }).catch((error) => { throw error; });
  return NextResponse.json({ success: true });
}
