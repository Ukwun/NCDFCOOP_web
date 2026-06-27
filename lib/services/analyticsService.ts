export interface ConversionMetrics {
  overallConversionRate: number;
  purchaseCount: number;
  totalViewers: number;
  cartToCheckoutRate: number;
  checkoutStartCount: number;
  cartAddCount: number;
}

export interface CartAbandonmentMetrics {
  totalCartsAbandoned: number;
  totalAbandonedValue: number;
  averageCartValue: number;
}

export interface ProductPopularity {
  productId: string;
  productName: string;
  category: string;
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
  viewToCartRate: number;
}

export interface PeakHours {
  dayOfWeek: string;
  hour: number;
  activityCount: number;
  purchaseCount: number;
}

export interface IntentLayerRoleStats {
  role: string;
  typedCount: number;
  clickedCount: number;
  landedCount: number;
  typedToClickedRate: number;
  clickedToLandedRate: number;
  typedToLandedRate: number;
}

export interface IntentLayerTopIntent {
  intentId: string;
  intentLabel: string;
  role: string;
  clicks: number;
  landings: number;
  conversionRate: number;
}

export interface IntentLayerFunnel {
  typedCount: number;
  clickedCount: number;
  landedCount: number;
  typedToClickedRate: number;
  clickedToLandedRate: number;
  typedToLandedRate: number;
}

export interface IntentLayerTelemetryBreakdown {
  roleStats: IntentLayerRoleStats[];
  topIntents: IntentLayerTopIntent[];
  funnel: IntentLayerFunnel;
  totalTrackedEvents: number;
}

export interface UserBehaviorPattern {
  pattern: string;
  amplitude: number;
  stability: number;
  favoriteCategory?: string;
  averageSessionDuration?: number;
}

export interface UserSegment {
  segment: string;
  userCount: number;
  avgOrderValue: number;
  conversionRate: number;
  churnRate: number;
  lifetimeValue: number;
  segmentHealth?: 'healthy' | 'at_risk' | 'growth';
}

export class AnalyticsService {
  private static percentage(numerator: number, denominator: number): number {
    return denominator > 0 ? (numerator / denominator) * 100 : 0;
  }

  private static eventName(row: Record<string, any>): string {
    return String(row.eventType || row.activityType || row.action || '').toLowerCase();
  }

  private static eventData(row: Record<string, any>): Record<string, any> {
    return row.eventData || row.activityData || row.details || {};
  }

  private static toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    return null;
  }

  private static async getActivities(
    startDate?: Date,
    endDate?: Date,
    maxRows: number = 5000
  ): Promise<Record<string, any>[]> {
    if (!db) return [];

    const constraints: any[] = [];
    if (startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }
    constraints.push(orderBy('timestamp', 'desc'), firestoreLimit(maxRows));

    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ACTIVITY_LOGS), ...constraints)
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  static async getConversionMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ConversionMetrics> {
    const rows = await this.getActivities(startDate, endDate);
    const counts = rows.reduce<Record<string, number>>((result, row) => {
      const event = this.eventName(row);
      result[event] = (result[event] || 0) + 1;
      return result;
    }, {});

    const totalViewers = counts.product_view || 0;
    const cartAddCount = counts.cart_add || 0;
    const checkoutStartCount = counts.checkout_start || 0;
    const purchaseCount =
      (counts.purchase_complete || 0) + (counts.purchase_completed || 0);

    return {
      overallConversionRate: this.percentage(purchaseCount, totalViewers),
      purchaseCount,
      totalViewers,
      cartToCheckoutRate: this.percentage(checkoutStartCount, cartAddCount),
      checkoutStartCount,
      cartAddCount,
    };
  }

  static async getCartAbandonmentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<CartAbandonmentMetrics> {
    const rows = await this.getActivities(startDate, endDate);
    const abandoned = rows.filter(
      (row) =>
        this.eventName(row) === 'cart_abandoned' ||
        this.eventName(row) === 'checkout_abandoned'
    );
    const totalAbandonedValue = abandoned.reduce((sum, row) => {
      const data = this.eventData(row);
      return sum + Number(data.orderTotal || data.cartTotal || 0);
    }, 0);

    return {
      totalCartsAbandoned: abandoned.length,
      totalAbandonedValue,
      averageCartValue:
        abandoned.length > 0 ? totalAbandonedValue / abandoned.length : 0,
    };
  }

  static async getProductPopularity(
    metric: 'purchases' | 'views' | 'clicks',
    limit: number
  ): Promise<ProductPopularity[]> {
    const rows = await this.getActivities(undefined, undefined, 5000);
    const products = new Map<
      string,
      {
        productName: string;
        category: string;
        views: number;
        cartAdds: number;
        purchases: number;
      }
    >();

    rows.forEach((row) => {
      const event = this.eventName(row);
      if (!['product_view', 'cart_add', 'purchase_complete'].includes(event)) return;

      const data = this.eventData(row);
      const productId = String(data.productId || '').trim();
      if (!productId) return;

      const current = products.get(productId) || {
        productName: String(data.productName || 'Unknown product'),
        category: String(data.productCategory || data.category || 'General'),
        views: 0,
        cartAdds: 0,
        purchases: 0,
      };

      if (event === 'product_view') current.views += 1;
      if (event === 'cart_add') current.cartAdds += 1;
      if (event === 'purchase_complete') current.purchases += 1;
      products.set(productId, current);
    });

    const key =
      metric === 'purchases'
        ? 'purchases'
        : metric === 'views'
          ? 'views'
          : 'cartAdds';

    return Array.from(products.entries())
      .map(([productId, item]) => ({
        productId,
        productName: item.productName,
        category: item.category,
        viewCount: item.views,
        addToCartCount: item.cartAdds,
        purchaseCount: item.purchases,
        viewToCartRate: this.percentage(item.cartAdds, item.views),
      }))
      .sort((a, b) => {
        const left =
          key === 'purchases'
            ? a.purchaseCount
            : key === 'views'
              ? a.viewCount
              : a.addToCartCount;
        const right =
          key === 'purchases'
            ? b.purchaseCount
            : key === 'views'
              ? b.viewCount
              : b.addToCartCount;
        return right - left;
      })
      .slice(0, limit);
  }

  static async getPeakHours(
    startDate: Date,
    endDate: Date
  ): Promise<PeakHours[]> {
    const rows = await this.getActivities(startDate, endDate);
    const buckets = new Map<string, PeakHours>();

    rows.forEach((row) => {
      const timestamp = this.toDate(row.timestamp);
      if (!timestamp) return;

      const dayOfWeek = timestamp.toLocaleDateString('en-US', {
        weekday: 'long',
      });
      const hour = timestamp.getHours();
      const key = `${dayOfWeek}-${hour}`;
      const current = buckets.get(key) || {
        dayOfWeek,
        hour,
        activityCount: 0,
        purchaseCount: 0,
      };

      current.activityCount += 1;
      if (this.eventName(row) === 'purchase_complete') {
        current.purchaseCount += 1;
      }
      buckets.set(key, current);
    });

    return Array.from(buckets.values())
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 24);
  }

  static async getUserSegments(): Promise<UserSegment[]> {
    if (!db) return [];

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ANALYTICS_DAILY),
        orderBy('generatedAt', 'desc'),
        firestoreLimit(1)
      )
    );
    const latest = snapshot.docs[0]?.data();
    return Array.isArray(latest?.segments) ? latest.segments : [];
  }

  static async getIntentLayerTelemetry(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<IntentLayerTelemetryBreakdown> {
    const rows = (await this.getActivities(startDate, endDate)).filter((row) => {
      const data = this.eventData(row);
      return data.searchSurface === 'role_intent_layer';
    });
    const roles = new Map<
      string,
      { typedCount: number; clickedCount: number; landedCount: number }
    >();
    const intents = new Map<
      string,
      {
        intentId: string;
        intentLabel: string;
        role: string;
        clicks: number;
        landings: number;
      }
    >();

    rows.forEach((row) => {
      const data = this.eventData(row);
      const role = String(
        data.roleIntent || row.userMetadata?.userRole || 'member'
      );
      const stage = String(data.intentStage || data.stage || '').toLowerCase();
      const roleStats = roles.get(role) || {
        typedCount: 0,
        clickedCount: 0,
        landedCount: 0,
      };

      if (stage === 'typed') roleStats.typedCount += 1;
      if (stage === 'clicked') roleStats.clickedCount += 1;
      if (stage === 'landed') roleStats.landedCount += 1;
      roles.set(role, roleStats);

      const intentId = String(data.intentId || '').trim();
      if (!intentId) return;
      const key = `${role}:${intentId}`;
      const current = intents.get(key) || {
        intentId,
        intentLabel: String(data.intentLabel || intentId),
        role,
        clicks: 0,
        landings: 0,
      };
      if (stage === 'clicked') current.clicks += 1;
      if (stage === 'landed') current.landings += 1;
      intents.set(key, current);
    });

    const roleStats = Array.from(roles.entries()).map(([role, stats]) => ({
      role,
      ...stats,
      typedToClickedRate: this.percentage(stats.clickedCount, stats.typedCount),
      clickedToLandedRate: this.percentage(stats.landedCount, stats.clickedCount),
      typedToLandedRate: this.percentage(stats.landedCount, stats.typedCount),
    }));
    const totals = roleStats.reduce(
      (sum, row) => ({
        typedCount: sum.typedCount + row.typedCount,
        clickedCount: sum.clickedCount + row.clickedCount,
        landedCount: sum.landedCount + row.landedCount,
      }),
      { typedCount: 0, clickedCount: 0, landedCount: 0 }
    );

    return {
      roleStats,
      topIntents: Array.from(intents.values())
        .map((item) => ({
          ...item,
          conversionRate: this.percentage(item.landings, item.clicks),
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, limit),
      funnel: {
        ...totals,
        typedToClickedRate: this.percentage(
          totals.clickedCount,
          totals.typedCount
        ),
        clickedToLandedRate: this.percentage(
          totals.landedCount,
          totals.clickedCount
        ),
        typedToLandedRate: this.percentage(
          totals.landedCount,
          totals.typedCount
        ),
      },
      totalTrackedEvents: rows.length,
    };
  }

  static async getUserBehaviorPattern(userId: string): Promise<UserBehaviorPattern> {
    if (!db || !userId) {
      return { pattern: 'stable', amplitude: 0, stability: 0 };
    }

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(500)
      )
    );
    const rows = snapshot.docs.map((item) => item.data());
    const categoryCounts = new Map<string, number>();
    let totalSessionDuration = 0;
    let durationSamples = 0;

    rows.forEach((row) => {
      const data = this.eventData(row);
      const category = data.productCategory || data.category;
      if (category) {
        categoryCounts.set(
          String(category),
          (categoryCounts.get(String(category)) || 0) + 1
        );
      }
      const duration = Number(data.sessionDuration || row.timeSpentMs || 0);
      if (duration > 0) {
        totalSessionDuration += duration;
        durationSamples += 1;
      }
    });
    const favoriteCategory = Array.from(categoryCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      pattern: rows.length >= 100 ? 'highly_engaged' : rows.length >= 25 ? 'active' : 'developing',
      amplitude: rows.length,
      stability: Math.min(100, rows.length / 5),
      favoriteCategory,
      averageSessionDuration:
        durationSamples > 0 ? totalSessionDuration / durationSamples : 0,
    };
  }
}
import {
  collection,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
