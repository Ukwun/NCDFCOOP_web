/**
 * Rewards Hook
 * React hook for managing user rewards and points
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUserPoints,
  getPointsHistory,
  getAvailableRewards,
  getRewardsByCategory,
  UserPoints,
  Reward,
  PointsTransaction,
} from '@/lib/services';

interface UseRewardsOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useRewards({
  userId,
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds default
}: UseRewardsOptions) {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    try {
      setLoading(true);
      const userPoints = await getUserPoints(userId);
      setPoints(userPoints);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch points:', err);
      setError('Failed to load points');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchHistory = useCallback(async (limit = 50) => {
    try {
      const transactions = await getPointsHistory(userId, limit);
      setHistory(transactions);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [userId]);

  const fetchRewards = useCallback(async () => {
    try {
      const availableRewards = await getAvailableRewards();
      setRewards(availableRewards);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    Promise.all([fetchPoints(), fetchHistory(), fetchRewards()]);
  }, [fetchPoints, fetchHistory, fetchRewards]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPoints();
      fetchHistory();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPoints, fetchHistory]);

  const getRewardsByType = useCallback(
    (category: string) => {
      return rewards.filter((r) => r.category === category);
    },
    [rewards]
  );

  const getAffordableRewards = useCallback(() => {
    if (!points) return [];

    return rewards.filter((r) => r.pointsRequired <= points.availablePoints);
  }, [rewards, points]);

  const getRecentTransactions = useCallback((limit = 10) => {
    return history.slice(0, limit);
  }, [history]);

  const getTotalEarned = useCallback(() => {
    return history
      .filter((t) => t.type === 'earn')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [history]);

  const getTotalRedeemed = useCallback(() => {
    return history
      .filter((t) => t.type === 'redeem')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [history]);

  return {
    points,
    history,
    rewards,
    loading,
    error,
    fetchPoints,
    fetchHistory,
    fetchRewards,
    getRewardsByType,
    getAffordableRewards,
    getRecentTransactions,
    getTotalEarned,
    getTotalRedeemed,
  };
}
