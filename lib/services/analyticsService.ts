/**
 * Analytics Aggregation Service
 * Analyzes user activities to provide business intelligence
 * 
 * Provides:
 * - User behavior patterns
 * - Conversion funnel analysis
 * - Cart abandonment metrics
 * - Product popularity
 * - Peak shopping hours
 * - User segmentation
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface ConversionMetrics {
  totalViewers: number;
  cartAddCount: number;
  checkoutStartCount: number;
  purchaseCount: number;
  cartToCheckoutRate: number; // percentage
  checkoutToPurchaseRate: number; // percentage
  overallConversionRate: number; // percentage
}

export interface CartAbandonmentMetrics {
  totalCartsAbandoned: number;
  cartsRecovered: number;
  recoveryRate: number; // percentage
  averageCartValue: number;
  totalAbandonedValue: number;
  commonReasons: Array<{ reason: string; count: number }>;
}

export interface ProductPopularity {
  productId: string;
  productName: string;
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
  averageRating?: number;
  category: string;
  viewToCartRate: number; // percentage
  cartToPurchaseRate: number; // percentage
}

export interface PeakHours {
  hour: number;
  dayOfWeek: string;
  activityCount: number;
  purchaseCount: number;
  revenue?: number;
}

export interface UserBehaviorPattern {
  userId: string;
  sessionCount: number;
  totalTimeSpent: number; // minutes
  averageSessionDuration: number; // minutes
  favoriteCategory: string;
  preferredPriceRange: { min: number; max: number };
  lastActiveTime: Date;
  isAtRisk: boolean; // hasn't visited in 30 days
  isFraudAtRisk: boolean; // unusual behavior patterns
}

export interface UserSegment {
  segment: string;
  userCount: number;
  avgOrderValue: number;
  conversionRate: number;
  churnRate: number;
  lifetimeValue: number;
}

/**
 * Analytics service for aggregating and analyzing user behavior
 */
export class AnalyticsService {
  /**
   * Get conversion metrics for a time period
   */
  static async getConversionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionMetrics> {
    try {
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      // Get metrics
      const viewers = await this.countActivityType(
        'product_view',
        startTs,
        endTs
      );
      const cartAdds = await this.countActivityType('cart_add', startTs, endTs);
      const checkouts = await this.countActivityType(
        'checkout_start',
        startTs,
        endTs
      );
      const purchases = await this.countActivityType(
        'purchase_complete',
        startTs,
        endTs
      );

      return {
        totalViewers: viewers,
        cartAddCount: cartAdds,
        checkoutStartCount: checkouts,
        purchaseCount: purchases,
        cartToCheckoutRate: cartAdds > 0 ? (checkouts / cartAdds) * 100 : 0,
        checkoutToPurchaseRate:
          checkouts > 0 ? (purchases / checkouts) * 100 : 0,
        overallConversionRate:
          viewers > 0 ? (purchases / viewers) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      return {
        totalViewers: 0,
        cartAddCount: 0,
        checkoutStartCount: 0,
        purchaseCount: 0,
        cartToCheckoutRate: 0,
        checkoutToPurchaseRate: 0,
        overallConversionRate: 0,
      };
    }
  }

  /**
   * Get cart abandonment metrics
   */
  static async getCartAbandonmentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<CartAbandonmentMetrics> {
    try {
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'cart_abandoned'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const snapshot = await getDocs(q);
      const abandonedCarts = snapshot.docs.map((doc) => doc.data());

      const totalAbandonedValue = abandonedCarts.reduce(
        (sum: number, cart: any) => sum + (cart.activityData?.orderTotal || 0),
        0
      );

      const reasonsMap: Record<string, number> = {};
      abandonedCarts.forEach((cart: any) => {
        const reason = cart.activityData?.abandonReason || 'Unknown';
        reasonsMap[reason] = (reasonsMap[reason] || 0) + 1;
      });

      const commonReasons = Object.entries(reasonsMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalCartsAbandoned: abandonedCarts.length,
        cartsRecovered: 0, // Would need to track recovery
        recoveryRate: 0,
        averageCartValue:
          abandonedCarts.length > 0
            ? totalAbandonedValue / abandonedCarts.length
            : 0,
        totalAbandonedValue,
        commonReasons,
      };
    } catch (error) {
      console.error('Error getting cart abandonment metrics:', error);
      return {
        totalCartsAbandoned: 0,
        cartsRecovered: 0,
        recoveryRate: 0,
        averageCartValue: 0,
        totalAbandonedValue: 0,
        commonReasons: [],
      };
    }
  }

  /**
   * Get top products by views, cart adds, or purchases
   */
  static async getProductPopularity(
    metricType: 'views' | 'cart' | 'purchases' = 'views',
    topN: number = 20
  ): Promise<ProductPopularity[]> {
    try {
      const activityType =
        metricType === 'views'
          ? 'product_view'
          : metricType === 'cart'
            ? 'cart_add'
            : 'purchase_complete';

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', activityType),
        orderBy('timestamp', 'desc'),
        limit(10000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Aggregate by product
      const productMap: Record<string, any> = {};

      activities.forEach((activity: any) => {
        const productId = activity.activityData?.productId;
        if (!productId) return;

        if (!productMap[productId]) {
          productMap[productId] = {
            productId,
            productName: activity.activityData?.productName,
            category: activity.activityData?.productCategory,
            viewCount: 0,
            addToCartCount: 0,
            purchaseCount: 0,
          };
        }

        if (activityType === 'product_view') {
          productMap[productId].viewCount++;
        } else if (activityType === 'cart_add') {
          productMap[productId].addToCartCount++;
        } else if (activityType === 'purchase_complete') {
          productMap[productId].purchaseCount++;
        }
      });

      // Calculate rates and sort
      const products = Object.values(productMap)
        .map((p: any) => ({
          ...p,
          viewToCartRate:
            p.viewCount > 0 ? (p.addToCartCount / p.viewCount) * 100 : 0,
          cartToPurchaseRate:
            p.addToCartCount > 0
              ? (p.purchaseCount / p.addToCartCount) * 100
              : 0,
        }))
        .sort((a: any, b: any) => {
          const aMetric =
            metricType === 'views'
              ? a.viewCount
              : metricType === 'cart'
                ? a.addToCartCount
                : a.purchaseCount;
          const bMetric =
            metricType === 'views'
              ? b.viewCount
              : metricType === 'cart'
                ? b.addToCartCount
                : b.purchaseCount;
          return bMetric - aMetric;
        })
        .slice(0, topN);

      return products;
    } catch (error) {
      console.error('Error getting product popularity:', error);
      return [];
    }
  }

  /**
   * Get peak shopping hours
   */
  static async getPeakHours(
    startDate: Date,
    endDate: Date
  ): Promise<PeakHours[]> {
    try {
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Group by hour and day of week
      const timeMap: Record<string, any> = {};

      activities.forEach((activity: any) => {
        const timestamp = activity.timestamp?.toDate?.() || new Date();
        const hour = timestamp.getHours();
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
          timestamp.getDay()
        ];
        const key = `${day}_${hour}`;

        if (!timeMap[key]) {
          timeMap[key] = {
            hour,
            dayOfWeek: day,
            activityCount: 0,
            purchaseCount: 0,
          };
        }

        timeMap[key].activityCount++;
        if (activity.activityType === 'purchase_complete') {
          timeMap[key].purchaseCount++;
        }
      });

      return Object.values(timeMap)
        .sort((a: any, b: any) => b.activityCount - a.activityCount)
        .slice(0, 48);
    } catch (error) {
      console.error('Error getting peak hours:', error);
      return [];
    }
  }

  /**
   * Analyze user behavior patterns
   */
  static async getUserBehaviorPattern(userId: string): Promise<UserBehaviorPattern | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      if (activities.length === 0) {
        return null;
      }

      // Calculate metrics
      const sessions = new Set();
      let totalTimeSpent = 0;
      const categories: Record<string, number> = {};
      const priceRanges: number[] = [];
      let lastActive = new Date(0);

      activities.forEach((activity: any) => {
        const sessionId = activity.sessionId;
        if (sessionId) sessions.add(sessionId);

        const timeSpent = activity.timeSpentMs || 0;
        totalTimeSpent += timeSpent;

        const category = activity.activityData?.productCategory;
        if (category) {
          categories[category] = (categories[category] || 0) + 1;
        }

        const price = activity.activityData?.productPrice;
        if (price) priceRanges.push(price);

        const timestamp = activity.timestamp?.toDate?.() || new Date();
        if (timestamp > lastActive) {
          lastActive = timestamp;
        }
      });

      // Determine at-risk status (no activity in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isAtRisk = lastActive < thirtyDaysAgo;

      // Favorite category
      const favoriteCategory =
        Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'Unknown';

      // Price range
      const preferredPriceRange =
        priceRanges.length > 0
          ? {
              min: Math.min(...priceRanges),
              max: Math.max(...priceRanges),
            }
          : { min: 0, max: 0 };

      return {
        userId,
        sessionCount: sessions.size,
        totalTimeSpent: totalTimeSpent / 1000 / 60, // convert to minutes
        averageSessionDuration:
          sessions.size > 0
            ? (totalTimeSpent / 1000 / 60 / sessions.size)
            : 0,
        favoriteCategory,
        preferredPriceRange,
        lastActiveTime: lastActive,
        isAtRisk,
        isFraudAtRisk: false, // Would implement fraud detection
      };
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return null;
    }
  }

  /**
   * Segment users by behavior
   */
  static async getUserSegments(): Promise<UserSegment[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        orderBy('timestamp', 'desc'),
        limit(50000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Segment users
      const userMetrics: Record<string, any> = {};

      activities.forEach((activity: any) => {
        const userId = activity.userId;
        if (!userId) return;

        if (!userMetrics[userId]) {
          userMetrics[userId] = {
            purchases: 0,
            totalSpent: 0,
            sessions: new Set(),
            lastActive: new Date(0),
          };
        }

        userMetrics[userId].sessions.add(activity.sessionId);

        if (activity.activityType === 'purchase_complete') {
          userMetrics[userId].purchases++;
          userMetrics[userId].totalSpent +=
            activity.activityData?.orderTotal || 0;
        }

        const timestamp = activity.timestamp?.toDate?.() || new Date();
        if (timestamp > userMetrics[userId].lastActive) {
          userMetrics[userId].lastActive = timestamp;
        }
      });

      // Create segments
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const segments: Record<string, any> = {
        power_users: {
          segment: 'Power Users',
          userCount: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          churnRate: 0,
          lifetimeValue: 0,
          totalValue: 0,
        },
        regular_users: {
          segment: 'Regular Users',
          userCount: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          churnRate: 0,
          lifetimeValue: 0,
          totalValue: 0,
        },
        at_risk: {
          segment: 'At Risk',
          userCount: 0,
          avgOrderValue: 0,
          conversionRate: 0,
          churnRate: 100,
          lifetimeValue: 0,
          totalValue: 0,
        },
      };

      Object.entries(userMetrics).forEach(([userId, metrics]: [string, any]) => {
        const segment =
          metrics.purchases > 10
            ? 'power_users'
            : metrics.purchases > 0
              ? 'regular_users'
              : metrics.lastActive < thirtyDaysAgo
                ? 'at_risk'
                : 'regular_users';

        segments[segment].userCount++;
        segments[segment].totalValue += metrics.totalSpent;
        segments[segment].lifetimeValue = Math.max(
          segments[segment].lifetimeValue,
          metrics.totalSpent
        );
      });

      // Calculate averages
      return Object.values(segments).map((seg: any) => ({
        ...seg,
        avgOrderValue:
          seg.userCount > 0
            ? seg.totalValue / seg.userCount / Math.max(seg.lifetimeValue, 1)
            : 0,
      }));
    } catch (error) {
      console.error('Error getting user segments:', error);
      return [];
    }
  }

  /**
   * Count specific activity type
   */
  private static async countActivityType(
    activityType: string,
    startTs: Timestamp,
    endTs: Timestamp
  ): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', activityType),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error(`Error counting activity type ${activityType}:`, error);
      return 0;
    }
  }
}
