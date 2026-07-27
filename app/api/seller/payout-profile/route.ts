import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';
import { USER_ROLES } from '@/lib/constants/database';

interface StoredPayoutAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountLast4: string;
  reviewStatus: 'pending_verification' | 'verified' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

async function requireSeller(request: NextRequest) {
  const user = await verifyRequestUser(request);
  return hasRole(user, USER_ROLES.SELLER) ? user : null;
}

function storedAccounts(data: FirebaseFirestore.DocumentData): StoredPayoutAccount[] {
  if (Array.isArray(data.accounts)) return data.accounts.slice(0, 5);
  if (data.accountNumber) {
    return [{
      id: 'legacy',
      bankName: String(data.bankName || ''),
      accountName: String(data.accountName || ''),
      accountNumber: String(data.accountNumber || ''),
      accountLast4: String(data.accountLast4 || String(data.accountNumber).slice(-4)),
      reviewStatus: data.reviewStatus || 'pending_verification',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }];
  }
  return [];
}

function publicProfile(data: FirebaseFirestore.DocumentData) {
  const accounts = storedAccounts(data).map((account) => ({
    id: account.id,
    bankName: account.bankName,
    accountName: account.accountName,
    accountLast4: account.accountLast4,
    reviewStatus: account.reviewStatus,
  }));
  return {
    accounts,
    defaultAccountId: accounts.some((account) => account.id === data.defaultAccountId)
      ? data.defaultAccountId
      : accounts[0]?.id || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const snapshot = await getAdminDb().collection('payoutProfiles').doc(user.uid).get();
    return NextResponse.json({ profile: snapshot.exists ? publicProfile(snapshot.data() || {}) : null });
  } catch (error) {
    console.error('Payout profile read failed:', error);
    return NextResponse.json({ error: 'Unable to load payout accounts.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const body = await request.json();
    const bankName = String(body.bankName || '').trim().slice(0, 120);
    const accountName = String(body.accountName || '').trim().slice(0, 160);
    const accountNumber = String(body.accountNumber || '').replace(/\s+/g, '');
    if (bankName.length < 2 || accountName.length < 2 || !/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json({ error: 'Enter the bank, account name, and a valid 10-digit NUBAN account number.' }, { status: 400 });
    }

    const ref = getAdminDb().collection('payoutProfiles').doc(user.uid);
    const snapshot = await ref.get();
    const data = snapshot.data() || {};
    const accounts = storedAccounts(data);
    const existingIndex = accounts.findIndex((account) => account.accountNumber === accountNumber);
    if (existingIndex < 0 && accounts.length >= 5) {
      return NextResponse.json({ error: 'You can save up to five payout accounts.' }, { status: 409 });
    }
    const account: StoredPayoutAccount = {
      id: existingIndex >= 0 ? accounts[existingIndex].id : randomUUID(),
      bankName,
      accountName,
      accountNumber,
      accountLast4: accountNumber.slice(-4),
      reviewStatus: 'pending_verification',
      createdAt: existingIndex >= 0 ? accounts[existingIndex].createdAt : new Date(),
      updatedAt: new Date(),
    };
    if (existingIndex >= 0) accounts[existingIndex] = account;
    else accounts.push(account);
    const defaultAccountId = data.defaultAccountId && accounts.some((item) => item.id === data.defaultAccountId)
      ? data.defaultAccountId
      : account.id;
    await ref.set({
      sellerId: user.uid,
      sellerEmail: user.email || '',
      accounts,
      defaultAccountId,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!snapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
    }, { merge: true });
    return NextResponse.json({
      profile: publicProfile({ accounts, defaultAccountId }),
      message: existingIndex >= 0
        ? 'Bank account updated and resubmitted for verification.'
        : 'Bank account added and submitted for verification.',
    });
  } catch (error) {
    console.error('Payout account save failed:', error);
    return NextResponse.json({ error: 'Unable to save this payout account.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSeller(request);
    if (!user) return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const accountId = String(body.accountId || '');
    const action = String(body.action || '');
    const ref = getAdminDb().collection('payoutProfiles').doc(user.uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Payout profile not found.' }, { status: 404 });
    const data = snapshot.data() || {};
    let accounts = storedAccounts(data);
    if (!accounts.some((account) => account.id === accountId)) {
      return NextResponse.json({ error: 'Bank account not found.' }, { status: 404 });
    }
    let defaultAccountId = String(data.defaultAccountId || accounts[0]?.id || '');
    if (action === 'set_default') {
      defaultAccountId = accountId;
    } else if (action === 'remove') {
      accounts = accounts.filter((account) => account.id !== accountId);
      if (defaultAccountId === accountId) defaultAccountId = accounts[0]?.id || '';
    } else {
      return NextResponse.json({ error: 'Invalid payout account action.' }, { status: 400 });
    }
    await ref.update({ accounts, defaultAccountId, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ profile: publicProfile({ accounts, defaultAccountId }) });
  } catch (error) {
    console.error('Payout account action failed:', error);
    return NextResponse.json({ error: 'The payout account could not be updated.' }, { status: 500 });
  }
}
