/**
 * Rewards and Points Service
 * Manages user rewards, points, and loyalty programs
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  pendingPoints: number;
  lastUpdatedAt: Timestamp;
  pointsHistory?: PointsTransaction[];
}

export interface PointsTransaction {
  id?: string;
  userId: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  amount: number;
  source?: string;
  orderId?: string;
  rewardId?: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface Reward {
  id?: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: string;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  code?: string;
  validFrom: Timestamp;
  validUntil: Timestamp;
  maxRedemptions?: number;
  currentRedemptions: number;
  active: boolean;
  createdAt: Timestamp;
}

/**
 * Get user points
 */
export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, 'rewards', 'points');
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserPoints;
    }

    // Initialize with zero points if not exists
    const initialPoints: UserPoints = {
      userId,
      totalPoints: 0,
      availablePoints: 0,
      redeemedPoints: 0,
      pendingPoints: 0,
      lastUpdatedAt: Timestamp.now(),
    };

    await setDoc(docRef, initialPoints);
    return initialPoints;
  } catch (error) {
    console.error('Error fetching user points:', error);
    return null;
  }
}

/**
 * Add points to user account
 */
export async function addPoints(
  userId: string,
  amount: number,
  source: string,
  description: string,
  relatedId?: string // orderId, productId, etc.
): Promise<void> {
  try {
    const pointsRef = doc(db, COLLECTIONS.USERS, userId, 'rewards', 'points');
    const userPoints = await getUserPoints(userId);

    if (!userPoints) {
      throw new Error('User points document not found');
    }

    // Create transaction record
    const balanceBefore = userPoints.availablePoints;
    const balanceAfter = balanceBefore + amount;

    const transaction: PointsTransaction = {
      id: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'earn',
      amount,
      source,
      description,
      balanceBefore,
      balanceAfter,
      createdAt: Timestamp.now(),
    };

    if (relatedId) {
      transaction.orderId = relatedId;
    }

    // Update points
    await updateDoc(pointsRef, {
      totalPoints: increment(amount),
      availablePoints: increment(amount),
      lastUpdatedAt: Timestamp.now(),
    });

    // Log transaction
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId, 'rewards', 'transactions', transaction.id!),
      transaction
    );
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}

/**
 * Redeem points
 */
export async function redeemPoints(
  userId: string,
  amount: number,
  rewardId: string,
  description: string
): Promise<void> {
  try {
    const pointsRef = doc(db, COLLECTIONS.USERS, userId, 'rewards', 'points');
    const userPoints = await getUserPoints(userId);

    if (!userPoints) {
      throw new Error('User points document not found');
    }

    if (userPoints.availablePoints < amount) {
      throw new Error('Insufficient points for redemption');
    }

    // Create transaction record
    const balanceBefore = userPoints.availablePoints;
    const balanceAfter = balanceBefore - amount;

    const transaction: PointsTransaction = {
      id: `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'redeem',
      amount,
      rewardId,
      description,
      balanceBefore,
      balanceAfter,
      createdAt: Timestamp.now(),
    };

    // Update points
    await updateDoc(pointsRef, {
      availablePoints: increment(-amount),
      redeemedPoints: increment(amount),
      lastUpdatedAt: Timestamp.now(),
    });

    // Log transaction
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId, 'rewards', 'transactions', transaction.id!),
      transaction
    );
  } catch (error) {
    console.error('Error redeeming points:', error);
    throw error;
  }
}

/**
 * Get points history
 */
export async function getPointsHistory(userId: string, limit: number = 50): Promise<PointsTransaction[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS, userId, 'rewards', 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as PointsTransaction))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
}

/**
 * Get available rewards
 */
export async function getAvailableRewards(): Promise<Reward[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.REWARDS),
      where('active', '==', true),
      orderBy('pointsRequired', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Reward));
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
}

/**
 * Get rewards by category
 */
export async function getRewardsByCategory(category: string): Promise<Reward[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.REWARDS),
      where('active', '==', true),
      where('category', '==', category),
      orderBy('pointsRequired', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Reward));
  } catch (error) {
    console.error('Error fetching rewards by category:', error);
    return [];
  }
}

/**
 * Calculate points earned from order
 */
export function calculatePointsFromOrder(orderAmount: number, pointsPerNaira: number = 1): number {
  return Math.floor(orderAmount * pointsPerNaira);
}
