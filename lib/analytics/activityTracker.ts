/**
 * Activity Tracking Service
 * Track user activities for analytics and intelligence
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { normalizeEventType } from './eventTaxonomy';

export interface ActivityLog {
  userId?: string;
  action: string;
  details?: Record<string, any>;
  timestamp?: Timestamp;
  userAgent?: string;
  ip?: string;
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

/**
 * Track user activity in Firestore
 */
export async function trackActivity(action: string, details: Record<string, any> = {}, userId?: string) {
  try {
    if (!db) {
      console.warn('Database not initialized for tracking');
      return;
    }

    if (!userId && typeof window !== 'undefined') {
      // Get from localStorage or auth context if available
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) userId = storedUserId;
    }

    const activity: ActivityLog = {
      action: normalizeEventType(action),
      details: sanitizeForFirestore(details),
      timestamp: Timestamp.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    if (userId) {
      activity.userId = userId;
    }

    const sanitizedActivity = sanitizeForFirestore(activity);
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), sanitizedActivity);
  } catch (error) {
    console.warn('Activity tracking error:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Standard activity tracking events
 */
export const ACTIVITY_TYPES = {
  // Auth
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',

  // Navigation
  PAGE_VIEW: 'page_view',
  SCREEN_CHANGE: 'screen_change',

  // Commerce
  PRODUCT_VIEW: 'product_view',
  PRODUCT_SEARCH: 'product_search',
  CART_ADD: 'cart_add',
  CART_REMOVE: 'cart_remove',
  CHECKOUT_START: 'checkout_start',
  PURCHASE: 'purchase',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',

  // Messages
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  CONVERSATION_OPENED: 'conversation_opened',

  // Offers
  OFFER_VIEW: 'offer_view',
  OFFER_APPLIED: 'offer_applied',

  // Profile
  PROFILE_VIEW: 'profile_view',
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_CHANGED: 'settings_changed',

  // Errors
  ERROR: 'error',
  LOGIN_FAILED: 'login_failed',
  SIGNUP_FAILED: 'signup_failed',
} as const;

/**
 * Track a page view
 */
export async function trackPageView(pageName: string, userId?: string) {
  await trackActivity(ACTIVITY_TYPES.PAGE_VIEW, { pageName }, userId);
}

/**
 * Track a purchase/transaction
 */
export async function trackPurchase(amount: number, itemCount: number, userId?: string) {
  await trackActivity(ACTIVITY_TYPES.PURCHASE_COMPLETED, { amount, itemCount }, userId);
}

/**
 * Track an error
 */
export async function trackError(errorMessage: string, context: Record<string, any> = {}, userId?: string) {
  await trackActivity(ACTIVITY_TYPES.ERROR, { errorMessage, ...context }, userId);
}
