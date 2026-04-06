/**
 * Notification Service
 * Handles notifications and announcements
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { COLLECTIONS } from '../../constants/database';
import { ErrorHandler } from '../../error/errorHandler';

export interface SendNotificationPayload {
  userId: string;
  type: 'order' | 'promotion' | 'system' | 'seller' | 'buyer';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface BroadcastNotificationPayload {
  type: 'order' | 'promotion' | 'system' | 'seller' | 'buyer';
  title: string;
  message: string;
  targetAudience?: 'all' | 'sellers' | 'buyers' | 'premium';
  icon?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}

class NotificationService {
  /**
   * Send notification to a specific user
   */
  async sendNotification(payload: SendNotificationPayload) {
    try {
      const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const notification = {
        notificationId,
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        icon: payload.icon || null,
        actionUrl: payload.actionUrl || null,
        data: payload.data || {},
        read: false,
        createdAt: Timestamp.now(),
      };

      const notifRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS), notificationId);
      await setDoc(notifRef, notification);

      // Try to send push notification if user has FCM token
      try {
        await this.sendPushNotification(payload.userId, {
          title: payload.title,
          body: payload.message,
          icon: payload.icon,
        });
      } catch (pushError) {
        // Log but don't fail if push notification fails
        ErrorHandler.logError('PUSH_NOTIFICATION_FAILED', String(pushError), 'warning');
      }

      ErrorHandler.logInfo('NOTIFICATION_SENT', `Notification sent to user ${payload.userId}`);
      return { id: notificationId, ...notification };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('SEND_NOTIFICATION_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(payload: BroadcastNotificationPayload) {
    try {
      const broadcastId = `BROADCAST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const broadcast = {
        broadcastId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        targetAudience: payload.targetAudience || 'all',
        icon: payload.icon || null,
        actionUrl: payload.actionUrl || null,
        data: payload.data || {},
        createdAt: Timestamp.now(),
      };

      const broadcastRef = doc(
        collection(db, COLLECTIONS.BROADCASTS),
        broadcastId
      );
      await setDoc(broadcastRef, broadcast);

      ErrorHandler.logInfo('BROADCAST_SENT', `Broadcast notification created: ${broadcastId}`);
      return { id: broadcastId, ...broadcast };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('BROADCAST_NOTIFICATION_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: Timestamp.now(),
      });

      ErrorHandler.logInfo('NOTIFICATION_READ', `Notification ${notificationId} marked as read`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('MARK_AS_READ_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const notifRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await deleteDoc(notifRef);

      ErrorHandler.logInfo('NOTIFICATION_DELETED', `Notification ${notificationId} deleted`);
      return { success: true };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      ErrorHandler.logError('DELETE_NOTIFICATION_ERROR', err.message, 'error');
      throw err;
    }
  }

  /**
   * Send push notification (requires FCM setup)
   */
  private async sendPushNotification(
    userId: string,
    notification: { title: string; body: string; icon?: string }
  ) {
    // This would be implemented with Firebase Cloud Messaging (FCM)
    // For now, we'll just log that it would be sent
    ErrorHandler.logInfo('FCM_QUEUE', `Push notification queued for user ${userId}`);
  }
}

export const notificationService = new NotificationService();
