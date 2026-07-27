import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { canOperateFinance } from '@/lib/operations/access';
import { USER_ROLES } from '@/lib/constants/database';

const LARGE_PAYOUT_NGN = Number(process.env.LARGE_PAYOUT_NGN || 500000);

interface PayoutAccount {
  id: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  accountLast4?: string;
  reviewStatus?: string;
}

function payoutAccounts(profile: FirebaseFirestore.DocumentData): PayoutAccount[] {
  if (Array.isArray(profile.accounts)) return profile.accounts.slice(0, 5);
  return profile.accountNumber ? [{
    id: 'legacy',
    bankName: profile.bankName,
    accountName: profile.accountName,
    accountNumber: profile.accountNumber,
    accountLast4: profile.accountLast4,
    reviewStatus: profile.reviewStatus,
  }] : [];
}

function iso(value: unknown): string | null {
  const timestamp = value as { toDate?: () => Date } | null;
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getAdminDb();
    const financeAccess = canOperateFinance(user);
    if (!financeAccess && !hasRole(user, USER_ROLES.SELLER)) {
      return NextResponse.json({ error: 'Seller or finance access required.' }, { status: 403 });
    }
    const snapshot = financeAccess
      ? await db.collection('payoutRequests').orderBy('createdAt', 'desc').limit(100).get()
      : await db.collection('payoutRequests').where('sellerId', '==', user.uid).limit(50).get();
    const requests = snapshot.docs
      .map((document) => {
        const data = document.data();
        const payoutProfileSnapshot = data.payoutProfileSnapshot || {};
        return {
          id: document.id,
          sellerId: data.sellerId,
          sellerEmail: data.sellerEmail || '',
          amount: Number(data.amount || 0),
          currency: data.currency || 'NGN',
          status: data.status || 'pending_approval',
          exceptionFlags: Array.isArray(data.exceptionFlags) ? data.exceptionFlags : [],
          approvalIds: Array.isArray(data.approvalIds) ? data.approvalIds : [],
          requiredApprovals: Number(data.requiredApprovals || 1),
          payoutAccountId: data.payoutAccountId || '',
          payoutProfileSnapshot: {
            bankName: payoutProfileSnapshot.bankName || '',
            accountName: payoutProfileSnapshot.accountName || '',
            accountLast4: payoutProfileSnapshot.accountLast4 || '',
            ...(financeAccess
              ? { accountNumber: payoutProfileSnapshot.accountNumber || '' }
              : {}),
          },
          externalReference: data.externalReference || '',
          rejectionReason: data.rejectionReason || '',
          createdAt: iso(data.createdAt),
          updatedAt: iso(data.updatedAt),
          paidAt: iso(data.paidAt),
        };
      })
      .sort((left, right) =>
        String(right.createdAt || '').localeCompare(String(left.createdAt || '')),
      );
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Payout request read failed:', error);
    return NextResponse.json({ error: 'Payout requests are temporarily unavailable.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasRole(user, USER_ROLES.SELLER)) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const body = await request.json();
    const amount = Math.round(Number(body.amount || 0) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 1000) {
      return NextResponse.json({ error: 'Minimum payout is ₦1,000.' }, { status: 400 });
    }

    const db = getAdminDb();
    const [profileSnapshot, sellerDisputes] = await Promise.all([
      db.collection('payoutProfiles').doc(user!.uid).get(),
      db.collection('disputes').where('sellerIds', 'array-contains', user!.uid).limit(20).get(),
    ]);
    const profile = profileSnapshot.data() || {};
    const accounts = payoutAccounts(profile);
    const accountId = String(body.accountId || profile.defaultAccountId || accounts[0]?.id || '');
    const account = accounts.find((candidate) => candidate.id === accountId);
    if (!account || account.reviewStatus !== 'verified') {
      return NextResponse.json({ error: 'Select a verified payout account.' }, { status: 409 });
    }
    const flags: string[] = [];
    if (sellerDisputes.docs.some((document) => document.data().active === true)) {
      flags.push('open_dispute');
    }
    if (amount >= LARGE_PAYOUT_NGN) flags.push('large_payout');

    const now = Timestamp.now();
    const requestRef = db.collection('payoutRequests').doc();
    await db.runTransaction(async (transaction) => {
      const balanceRef = db.collection('sellerBalances').doc(user!.uid);
      const balance = await transaction.get(balanceRef);
      const available = Number(balance.data()?.available || 0);
      if (amount > available) throw new Error('INSUFFICIENT_BALANCE');
      transaction.set(requestRef, {
        sellerId: user!.uid,
        sellerEmail: user!.email || '',
        amount,
        currency: 'NGN',
        status: flags.length ? 'exception_review' : 'pending_approval',
        exceptionFlags: flags,
        approvalIds: [],
        requiredApprovals: flags.length ? 2 : 1,
        payoutAccountId: account.id,
        payoutProfileSnapshot: {
          bankName: account.bankName || '',
          accountName: account.accountName || '',
          accountNumber: account.accountNumber || '',
          accountLast4: account.accountLast4 || '',
        },
        createdAt: now,
        updatedAt: now,
      });
      transaction.set(balanceRef, {
        available: FieldValue.increment(-amount),
        pendingPayout: FieldValue.increment(amount),
        updatedAt: now,
      }, { merge: true });
      transaction.set(db.collection('sellerLedgerEntries').doc(), {
        sellerId: user!.uid,
        type: 'payout_reserved',
        amount: -amount,
        payoutRequestId: requestRef.id,
        createdAt: now,
      });
      transaction.set(db.collection('notifications').doc(), {
        userId: user!.uid,
        title: 'Withdrawal request submitted',
        message: `Your ${amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} withdrawal is awaiting review.`,
        type: 'payout',
        read: false,
        data: {
          payoutRequestId: requestRef.id,
          status: flags.length ? 'exception_review' : 'pending_approval',
        },
        createdAt: now,
      });
    });
    return NextResponse.json({
      success: true,
      id: requestRef.id,
      status: flags.length ? 'exception_review' : 'pending_approval',
      flags,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'The requested amount exceeds your available balance.' }, { status: 409 });
    }
    console.error('Payout request creation failed:', error);
    return NextResponse.json({ error: 'The payout request could not be submitted.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!canOperateFinance(user)) return NextResponse.json({ error: 'Finance access required.' }, { status: 403 });
    const body = await request.json();
    const id = String(body.payoutRequestId || '');
    const action = String(body.action || '');
    if (!id) return NextResponse.json({ error: 'Payout request is required.' }, { status: 400 });
    const db = getAdminDb();
    const ref = db.collection('payoutRequests').doc(id);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('NOT_FOUND');
      const payout = snapshot.data() || {};
      const now = Timestamp.now();
      let resultingStatus = String(payout.status || '');
      if (action === 'approve' && ['pending_approval', 'exception_review'].includes(payout.status)) {
        const approvals = Array.from(new Set([...(payout.approvalIds || []), user!.uid]));
        const approved = approvals.length >= Number(payout.requiredApprovals || 1);
        resultingStatus = approved ? 'approved' : payout.status;
        transaction.update(ref, { approvalIds: approvals, status: resultingStatus, updatedAt: now });
      } else if (action === 'mark_processing' && payout.status === 'approved') {
        resultingStatus = 'processing';
        transaction.update(ref, { status: 'processing', processingBy: user!.uid, updatedAt: now });
      } else if (action === 'mark_paid' && payout.status === 'processing' && String(body.externalReference || '').trim()) {
        resultingStatus = 'paid';
        transaction.update(ref, { status: 'paid', externalReference: String(body.externalReference).trim().slice(0, 160), paidBy: user!.uid, paidAt: now, updatedAt: now });
        transaction.set(db.collection('sellerBalances').doc(payout.sellerId), { pendingPayout: FieldValue.increment(-Number(payout.amount)), lifetimePaid: FieldValue.increment(Number(payout.amount)), updatedAt: now }, { merge: true });
        transaction.set(db.collection('sellerLedgerEntries').doc(), { sellerId: payout.sellerId, payoutRequestId: id, type: 'payout_paid', amount: Number(payout.amount), externalReference: String(body.externalReference).trim().slice(0, 160), createdAt: now });
      } else if (action === 'reject' && !['paid', 'rejected'].includes(payout.status)) {
        resultingStatus = 'rejected';
        transaction.update(ref, { status: 'rejected', rejectionReason: String(body.reason || '').slice(0, 500), rejectedBy: user!.uid, updatedAt: now });
        transaction.set(db.collection('sellerBalances').doc(payout.sellerId), { pendingPayout: FieldValue.increment(-Number(payout.amount)), available: FieldValue.increment(Number(payout.amount)), updatedAt: now }, { merge: true });
        transaction.set(db.collection('sellerLedgerEntries').doc(), { sellerId: payout.sellerId, payoutRequestId: id, type: 'payout_released', amount: Number(payout.amount), createdAt: now });
      } else {
        throw new Error('INVALID_ACTION');
      }
      const payoutAmount = Number(payout.amount || 0).toLocaleString('en-NG', {
        style: 'currency',
        currency: 'NGN',
      });
      const notificationCopy: Record<string, { title: string; message: string }> = {
        approved: {
          title: 'Withdrawal approved',
          message: `Your ${payoutAmount} withdrawal was approved and is ready for bank processing.`,
        },
        processing: {
          title: 'Withdrawal transfer started',
          message: `Your ${payoutAmount} withdrawal is being transferred to your selected bank account.`,
        },
        paid: {
          title: 'Withdrawal paid',
          message: `Your ${payoutAmount} withdrawal has been marked paid.`,
        },
        rejected: {
          title: 'Withdrawal returned to balance',
          message: `Your ${payoutAmount} withdrawal was not approved. The reserved amount is available again.`,
        },
      };
      const copy = notificationCopy[resultingStatus];
      if (copy) {
        transaction.set(db.collection('notifications').doc(), {
          userId: payout.sellerId,
          ...copy,
          type: 'payout',
          read: false,
          data: { payoutRequestId: id, status: resultingStatus },
          createdAt: now,
        });
      }
      transaction.set(db.collection('activityLogs').doc(), { userId: user!.uid, action: `payout_${action}`, payoutRequestId: id, createdAt: now });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Payout request not found.' }, { status: 404 });
    if (message === 'INVALID_ACTION') return NextResponse.json({ error: 'This payout action is not valid for the current status.' }, { status: 409 });
    console.error('Payout operation failed:', error);
    return NextResponse.json({ error: 'The payout action could not be completed.' }, { status: 500 });
  }
}
