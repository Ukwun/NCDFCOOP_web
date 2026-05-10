/**
 * Activity Tracking Service
 * Tracks user activities and interactions across the app
 */

import { doc, setDoc, query, collection, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { CanonicalEventType, normalizeEventType } from '@/lib/analytics/eventTaxonomy';

export interface ActivityLog {
  id?: string;
  userId: string;
  eventType: CanonicalEventType;
  rawEventType?: string;
  eventData: {
    productId?: string;
    productName?: string;
    orderId?: string;
    orderAmount?: number;
    searchQuery?: string;
    quantity?: number;
    [key: string]: any;
  };
  userMetadata?: {
    userRole?: string;
    userEmail?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  timestamp: Timestamp;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    screenSize?: string;
  };
}

function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined) as unknown as T;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const proto = Object.getPrototypeOf(value);
  const isPlainObject = proto === Object.prototype || proto === null;
  if (!isPlainObject) {
    return value;
  }

  const cleaned: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
    if (val === undefined) return;
    const sanitized = sanitizeForFirestore(val);
    if (sanitized !== undefined) {
      cleaned[key] = sanitized;
    }
  });

  return cleaned as T;
}

function hasKeys(value?: Record<string, unknown>): boolean {
  return !!value && Object.keys(value).length > 0;
}

/**
 * Log a user activity
 */
export async function logActivity(
  userId: string,
  eventType: string,
  eventData: ActivityLog['eventData'],
  userMetadata?: ActivityLog['userMetadata'],
  deviceInfo?: ActivityLog['deviceInfo']
): Promise<void> {
  try {
    if (!db) {
      console.warn('Database not initialized for activity logging');
      return;
    }

    const activityId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sanitizedEventData = sanitizeForFirestore(eventData) as ActivityLog['eventData'];
    const sanitizedUserMetadata = sanitizeForFirestore(userMetadata) as ActivityLog['userMetadata'] | undefined;
    const sanitizedDeviceInfo = sanitizeForFirestore(deviceInfo) as ActivityLog['deviceInfo'] | undefined;

    const activity: Record<string, unknown> = {
      id: activityId,
      userId,
      eventType: normalizeEventType(eventType),
      rawEventType: eventType,
      eventData: sanitizedEventData,
      timestamp: Timestamp.now(),
    };

    if (hasKeys(sanitizedUserMetadata as Record<string, unknown> | undefined)) {
      activity.userMetadata = sanitizedUserMetadata;
    }

    if (hasKeys(sanitizedDeviceInfo as Record<string, unknown> | undefined)) {
      activity.deviceInfo = sanitizedDeviceInfo;
    }

    await setDoc(doc(db, COLLECTIONS.ACTIVITY_LOGS, activityId), activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not break the app
  }
}

/**
 * Get user activity history
 */
export async function getUserActivityHistory(
  userId: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  if (!db) {
    console.warn('Firestore database not initialized');
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return [];
  }
}

/**
 * Get activity logs for a specific event type
 */
export async function getActivityByType(
  userId: string,
  eventType: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  if (!db) {
    console.warn('Firestore database not initialized');
    return [];
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      where('userId', '==', userId),
      where('eventType', '==', normalizeEventType(eventType)),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));
  } catch (error) {
    console.error('Error fetching activity by type:', error);
    return [];
  }
}

/**
 * Get activity summary for a user
 */
export async function getActivitySummary(userId: string): Promise<{
  totalViews: number;
  totalSearches: number;
  totalCartAdditions: number;
  totalOrders: number;
  lastActiveDate: Date | null;
}> {
  try {
    const activities = await getUserActivityHistory(userId, 1000);

    const summary = {
      totalViews: 0,
      totalSearches: 0,
      totalCartAdditions: 0,
      totalOrders: 0,
      lastActiveDate: null as Date | null,
    };

    activities.forEach((activity) => {
      switch (activity.eventType) {
        case 'product_view':
          summary.totalViews++;
          break;
        case 'product_search':
          summary.totalSearches++;
          break;
        case 'cart_add':
          summary.totalCartAdditions++;
          break;
        case 'purchase_complete':
          summary.totalOrders++;
          break;
      }
    });

    if (activities.length > 0) {
      summary.lastActiveDate = new Date(activities[0].timestamp.toDate());
    }

    return summary;
  } catch (error) {
    console.error('Error getting activity summary:', error);
    return {
      totalViews: 0,
      totalSearches: 0,
      totalCartAdditions: 0,
      totalOrders: 0,
      lastActiveDate: null,
    };
  }
}
