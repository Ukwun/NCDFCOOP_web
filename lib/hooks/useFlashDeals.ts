/**
 * Custom Hook: useFlashDeals
 * Flash deals with real-time countdown timers
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface FlashDealState {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image?: string;
  timeLeftSeconds: number;
  timeLeftDisplay: string;
  discountPercent: number;
  active: boolean;
  expiresAt: Date;
}

interface UseFlashDealsReturn {
  deals: FlashDealState[];
  loading: boolean;
  error: Error | null;
}

export function useFlashDeals(): UseFlashDealsReturn {
  const [deals, setDeals] = useState<FlashDealState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [, setTimerTick] = useState(0);

  // Timer effect for countdown updates
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const dealsQuery = query(
        collection(db, COLLECTIONS.OFFERS),
        where('status', '==', 'active'),
        where('endDate', '>', now)
      );

      const unsubscribe = onSnapshot(
        dealsQuery,
        (snapshot) => {
          const dealsList: FlashDealState[] = [];
          const now = new Date();

          snapshot.forEach((doc) => {
            const rawData = doc.data();
            const expiresAt = rawData.endDate?.toDate?.() || new Date();
            const timeLeftSeconds = Math.max(
              0,
              Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
            );
            const active = timeLeftSeconds > 0;

            const discountPercent = rawData.discount 
              ? Math.round(rawData.discount * 100)
              : 0;

            dealsList.push({
              id: doc.id,
              name: rawData.title || 'Flash Deal',
              price: Math.round(
                (rawData.originalPrice || 0) * (1 - (rawData.discount || 0)) * 100
              ) / 100,
              originalPrice: rawData.originalPrice || 0,
              image: rawData.imageUrl,
              timeLeftSeconds,
              timeLeftDisplay: formatTimeLeft(timeLeftSeconds),
              discountPercent,
              active,
              expiresAt,
            });
          });

          // Sort by time left (soonest first)
          dealsList.sort((a, b) => a.timeLeftSeconds - b.timeLeftSeconds);
          // Take only active deals
          setDeals(dealsList.filter((d) => d.active).slice(0, 5));
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching flash deals:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up deals listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  // Update display time on each timer tick
  useEffect(() => {
    setDeals((prevDeals) =>
      prevDeals
        .map((deal) => ({
          ...deal,
          timeLeftSeconds: Math.max(0, deal.timeLeftSeconds - 1),
          timeLeftDisplay: formatTimeLeft(
            Math.max(0, deal.timeLeftSeconds - 1)
          ),
          active: deal.timeLeftSeconds > 1,
        }))
        .filter((d) => d.active)
    );
  }, []);

  return { deals, loading, error };
}

/**
 * Format seconds to human-readable time
 * Examples: "2 hrs 30m", "45 mins", "30s"
 */
export function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
