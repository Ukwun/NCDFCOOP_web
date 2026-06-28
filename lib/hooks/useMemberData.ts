/**
 * Custom Hook: useMemberData
 * Real-time member data with reactive updates
 */

'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { getMembershipTier, normalizeMembershipTier } from '@/lib/membership/tiers';

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
            
            const tier = normalizeMembershipTier(rawData.tier);
            const tierDefinition = getMembershipTier(tier);

            const processedData: MemberDataState = {
              memberId: userId,
              tier,
              rewardsPoints: rawData.rewardsPoints ?? rawData.loyaltyPoints ?? 0,
              lifetimePoints: rawData.lifetimePoints ?? rawData.loyaltyPoints ?? 0,
              memberSince: rawData.memberSince?.toDate?.() 
                ? new Date(rawData.memberSince.toDate()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                  })
                : 'Not activated',
              isActive: rawData.isActive === true,
              discountPercentage: tierDefinition.discountPercentage,
              ordersCount: rawData.ordersCount || 0,
              totalSpent: rawData.totalSpent ?? rawData.totalPurchases ?? 0,
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
