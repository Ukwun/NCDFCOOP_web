/**
 * Member Data Service
 * Handles all member-related operations
 */

import { doc, getDoc, setDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, MEMBER_TIERS, TRANSACTION_TYPES, TRANSACTION_STATUS } from '@/lib/constants/database';

export interface MemberData {
  userId: string;
  memberSince: Timestamp;
  savingsBalance: number;
  loyaltyPoints: number;
  tier: string;
  totalPurchases: number;
  totalDeposits: number;
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

export async function updateMemberBalance(userId: string, newBalance: number): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.MEMBERS, userId);
    await updateDoc(docRef, {
      savingsBalance: newBalance,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating member balance:', error);
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

    let newTier = MEMBER_TIERS.BRONZE;
    const totalSpent = memberData.totalPurchases;

    if (totalSpent >= 1000000) {
      newTier = MEMBER_TIERS.PLATINUM;
    } else if (totalSpent >= 500000) {
      newTier = MEMBER_TIERS.GOLD;
    } else if (totalSpent >= 200000) {
      newTier = MEMBER_TIERS.SILVER;
    }

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
    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, 'temp');
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

    // Update member balance if deposit or withdrawal
    if (type === TRANSACTION_TYPES.DEPOSIT && status === TRANSACTION_STATUS.COMPLETED) {
      const memberData = await getMemberData(userId);
      if (memberData) {
        await updateMemberBalance(userId, memberData.savingsBalance + amount);
        // Award loyalty points (e.g., 1 point per ₦100)
        await addLoyaltyPoints(userId, Math.floor(amount / 100));
      }
    } else if (type === TRANSACTION_TYPES.WITHDRAWAL && status === TRANSACTION_STATUS.COMPLETED) {
      const memberData = await getMemberData(userId);
      if (memberData && memberData.savingsBalance >= amount) {
        await updateMemberBalance(userId, memberData.savingsBalance - amount);
      }
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
      savingsBalance: memberData.savingsBalance,
      loyaltyPoints: memberData.loyaltyPoints,
      tier: memberData.tier,
      memberSince: memberData.memberSince?.toDate().toLocaleDateString() || '',
      totalPurchases: memberData.totalPurchases,
      totalDeposits: memberData.totalDeposits,
      referralCode: memberData.referralCode,
      kycStatus: memberData.kycStatus,
    };
  } catch (error) {
    console.error('Error fetching member stats:', error);
    throw error;
  }
}
