/**
 * Member Data Service
 * Handles all member-related operations
 */

import { doc, getDoc, setDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/lib/constants/database';
import { membershipTierForSpend } from '@/lib/membership/tiers';

export interface MemberData {
  userId: string;
  memberSince: Timestamp;
  loyaltyPoints: number;
  tier: string;
  totalPurchases: number;
  referralCode: string;
  isVerified: boolean;
  kycStatus: string;
}

export async function getMemberData(userId: string): Promise<MemberData | null> {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as MemberData) : null;
  } catch (error) {
    console.error('Error fetching member data:', error);
    throw error;
  }
}

export async function addLoyaltyPoints(userId: string, points: number): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, userId);
    await updateDoc(docRef, {
      loyaltyPoints: increment(points),
      updatedAt: Timestamp.now(),
    });

    // Check and update tier
    await updateMemberTier(userId);
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    throw error;
  }
}

export async function updateMemberTier(userId: string): Promise<void> {
  try {
    const memberData = await getMemberData(userId);
    if (!memberData) return;

    const totalSpent = memberData.totalPurchases;
    const newTier = membershipTierForSpend(totalSpent).id;

    if (newTier !== memberData.tier) {
      const docRef = doc(db, COLLECTIONS.MEMBERS, userId);
      await updateDoc(docRef, {
        tier: newTier,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error updating member tier:', error);
    throw error;
  }
}

export async function recordTransaction(
  userId: string,
  type: string,
  amount: number,
  status: string = TRANSACTION_STATUS.COMPLETED,
  description: string = ''
): Promise<string> {
  try {
    const transactionId = `TXN${Date.now()}`;

    await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId), {
      id: transactionId,
      userId,
      type,
      amount,
      status,
      description,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {},
    });

    // Loyalty points can still be awarded for qualifying purchase transactions.
    if (type === TRANSACTION_TYPES.PURCHASE && status === TRANSACTION_STATUS.COMPLETED) {
      await addLoyaltyPoints(userId, Math.floor(amount / 100));
    }

    return transactionId;
  } catch (error) {
    console.error('Error recording transaction:', error);
    throw error;
  }
}

export async function getMemberStats(userId: string) {
  try {
    const memberData = await getMemberData(userId);
    if (!memberData) return null;

    return {
      loyaltyPoints: memberData.loyaltyPoints,
      tier: memberData.tier,
      memberSince: memberData.memberSince?.toDate().toLocaleDateString() || '',
      totalPurchases: memberData.totalPurchases,
      referralCode: memberData.referralCode,
      kycStatus: memberData.kycStatus,
    };
  } catch (error) {
    console.error('Error fetching member stats:', error);
    throw error;
  }
}
