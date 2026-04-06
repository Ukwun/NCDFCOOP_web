/**
 * Notification Service
 * Handles notification preferences and delivery
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  weeklyDigest: boolean;
  newProductAlerts: boolean;
  priceDropAlerts: boolean;
  reviewReminders: boolean;
  updatedAt: Timestamp;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'alert' | 'message' | 'system';
  read: boolean;
  data?: {
    orderId?: string;
    productId?: string;
    link?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, 'preferences', 'notifications');
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return snapshot.data() as NotificationPreferences;
    }

    // Return default preferences if not set
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      orderUpdates: true,
      promotionalEmails: false,
      weeklyDigest: false,
      newProductAlerts: true,
      priceDropAlerts: true,
      reviewReminders: true,
      updatedAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId, 'preferences', 'notifications');

    const updateData = {
      ...preferences,
      updatedAt: Timestamp.now(),
    };

    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const notificationId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notificationData: Notification = {
      ...notification,
      id: notificationId,
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), notificationData);

    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  try {
    let q;

    if (unreadOnly) {
      q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        where('read', '==', false)
      );
    } else {
      q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('userId', '==', userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Notification))
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notifications = await getUserNotifications(userId, true, 1000);

    for (const notification of notifications) {
      if (notification.id) {
        await markNotificationAsRead(notification.id);
      }
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
      expiresAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}
