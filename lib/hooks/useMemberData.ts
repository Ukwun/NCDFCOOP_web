/**
 * Custom Hook: useMemberData
 * Real-time member data with reactive updates
 */

'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface MemberDataState {
  memberId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardsPoints: number;
  lifetimePoints: number;
  memberSince: string;
  isActive: boolean;
  discountPercentage: number;
  ordersCount: number;
  totalSpent: number;
  savingsBalance: number;
  savingsGoal: number;
  memberDividends: number;
}

interface UseMemberDataReturn {
  data: MemberDataState | null;
  loading: boolean;
  error: Error | null;
}

export function useMemberData(userId: string): UseMemberDataReturn {
  const [data, setData] = useState<MemberDataState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    try {
      const memberRef = doc(db, COLLECTIONS.MEMBERS, userId);

      const unsubscribe = onSnapshot(
        memberRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.data();
            
            // Calculate discount percentage based on tier
            const tierDiscounts: Record<string, number> = {
              bronze: 5,
              silver: 7,
              gold: 10,
              platinum: 15,
            };

            const processedData: MemberDataState = {
              memberId: userId,
              tier: (rawData.tier || 'bronze').toLowerCase() as any,
              rewardsPoints: rawData.rewardsPoints || 0,
              lifetimePoints: rawData.lifetimePoints || 0,
              memberSince: rawData.memberSince?.toDate?.() 
                ? new Date(rawData.memberSince.toDate()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  })
                : 'Jan 2024',
              isActive: rawData.isActive ?? true,
              discountPercentage: tierDiscounts[rawData.tier?.toLowerCase() || 'bronze'] || 5,
              ordersCount: rawData.ordersCount || 0,
              totalSpent: rawData.totalSpent || 0,
              savingsBalance: rawData.savingsBalance || 0,
              savingsGoal: rawData.savingsGoal || 50000,
              memberDividends: rawData.memberDividends || 0,
            };

            setData(processedData);
            setError(null);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching member data:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up member listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  return { data, loading, error };
}
