/**
 * Notifications Hook
 * React hook for managing user notifications
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  Notification,
} from '@/lib/services';

interface UseNotificationsOptions {
  userId: string;
  refreshInterval?: number; // milliseconds
  initialLimit?: number;
}

export function useNotifications({
  userId,
  refreshInterval = 30000, // 30 seconds default
  initialLimit = 50,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        getUserNotifications(userId, false, initialLimit),
        getUnreadNotificationCount(userId),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, initialLimit]);

  // Fetch notifications on mount and set up refresh interval
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchNotifications, refreshInterval]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotificationAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    []
  );

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const getNotificationsByType = useCallback(
    (type: Notification['type']) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refresh: fetchNotifications,
    getUnreadNotifications,
    getNotificationsByType,
  };
}
