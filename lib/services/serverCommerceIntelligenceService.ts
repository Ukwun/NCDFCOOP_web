import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/lib/constants/database';

export interface ServerDailyIntelligenceSummary {
  reportId: string;
  rangeStartISO: string;
  rangeEndISO: string;
  anomalyCount: number;
  automatedActions: number;
}

type ActivityRow = Record<string, any>;

function getPreviousUtcDayRange(referenceDate: Date = new Date()) {
  const end = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 1);
  return { start, end };
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function asDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function eventName(row: ActivityRow): string {
  return String(row.activityType || row.eventType || row.action || '').toLowerCase();
}

function numberOrZero(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export class ServerCommerceIntelligenceService {
  static async runDailyAggregation(referenceDate: Date = new Date()): Promise<ServerDailyIntelligenceSummary> {
    const db = getAdminDb();
    const { start, end } = getPreviousUtcDayRange(referenceDate);
    const reportId = dateKey(start);

    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);

    const activitySnap = await db
      .collection(COLLECTIONS.ACTIVITY_LOGS)
      .where('timestamp', '>=', startTs)
      .where('timestamp', '<=', endTs)
      .get();

    const rows = activitySnap.docs.map((doc) => doc.data());

    const byEvent = new Map<string, number>();
    const userOrderTotals = new Map<string, { purchases: number; total: number; views: number }>();
    const categoryViews = new Map<string, { productName: string; views: number; cartAdds: number; purchases: number }>();
    const peakHourMap = new Map<string, { hour: number; dayOfWeek: number; activityCount: number; conversionCount: number }>();

    let cartAbandonedCount = 0;
    let totalAbandonedValue = 0;

    for (const row of rows) {
      const name = eventName(row);
      byEvent.set(name, (byEvent.get(name) || 0) + 1);

      const ts = asDate(row.timestamp);
      if (ts) {
        const hour = ts.getUTCHours();
        const dayOfWeek = ts.getUTCDay();
        const key = `${dayOfWeek}-${hour}`;
        const current = peakHourMap.get(key) || { hour, dayOfWeek, activityCount: 0, conversionCount: 0 };
        current.activityCount += 1;
        if (name === 'purchase_complete' || name === 'checkout_complete') {
          current.conversionCount += 1;
        }
        peakHourMap.set(key, current);
      }

      const userId = String(row.userId || '').trim();
      if (userId) {
        const current = userOrderTotals.get(userId) || { purchases: 0, total: 0, views: 0 };
        if (name === 'product_view' || name === 'product_viewed') current.views += 1;
        if (name === 'purchase_complete' || name === 'checkout_complete') {
          current.purchases += 1;
          current.total += numberOrZero(row.activityData?.orderTotal || row.eventData?.orderTotal);
        }
        userOrderTotals.set(userId, current);
      }

      const data = (row.activityData || row.eventData || row.details || {}) as Record<string, any>;
      const productId = String(data.productId || data.id || row.productId || 'unknown-product');
      const productName = String(data.productName || row.productName || 'Unknown Product');
      const category = String(data.productCategory || data.category || row.category || 'general');
      const categoryKey = `${category}::${productId}`;
      if (name === 'product_view' || name === 'product_viewed' || name === 'cart_add' || name === 'purchase_complete') {
        const current = categoryViews.get(categoryKey) || { productName, views: 0, cartAdds: 0, purchases: 0 };
        if (name === 'product_view' || name === 'product_viewed') current.views += 1;
        if (name === 'cart_add') current.cartAdds += 1;
        if (name === 'purchase_complete') current.purchases += 1;
        categoryViews.set(categoryKey, current);
      }

      if (name === 'cart_abandoned') {
        cartAbandonedCount += 1;
        totalAbandonedValue += numberOrZero(data.orderTotal);
      }
    }

    const totalViewers = (byEvent.get('product_view') || 0) + (byEvent.get('product_viewed') || 0);
    const cartAddCount = byEvent.get('cart_add') || 0;
    const checkoutStartCount = byEvent.get('checkout_start') || byEvent.get('checkout_initiated') || 0;
    const purchaseCount = (byEvent.get('purchase_complete') || 0) + (byEvent.get('checkout_complete') || 0);

    const conversion = {
      totalViewers,
      cartAddCount,
      checkoutStartCount,
      purchaseCount,
      cartToCheckoutRate: pct(checkoutStartCount, cartAddCount),
      checkoutToPurchaseRate: pct(purchaseCount, checkoutStartCount),
      overallConversionRate: pct(purchaseCount, totalViewers),
    };

    const cartAbandonment = {
      abandonedCount: cartAbandonedCount,
      avgAbandonedValue: cartAbandonedCount > 0 ? totalAbandonedValue / cartAbandonedCount : 0,
      totalAbandonedValue,
    };

    const peakHours = Array.from(peakHourMap.values())
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 24)
      .map((row) => ({
        ...row,
        conversionRate: pct(row.conversionCount, row.activityCount),
      }));

    const categoryPreference = Array.from(categoryViews.entries())
      .map(([key, value]) => {
        const [category, productId] = key.split('::');
        return {
          productId,
          productName: value.productName,
          category,
          views: value.views,
          cartAdds: value.cartAdds,
          purchases: value.purchases,
          conversionRate: pct(value.purchases, value.views),
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    let powerUsers = 0;
    let atRisk = 0;
    let avgOrderValueSum = 0;
    let purchaseUsers = 0;

    for (const stats of userOrderTotals.values()) {
      if (stats.purchases >= 3) powerUsers += 1;
      if (stats.views > 0 && stats.purchases === 0) atRisk += 1;
      if (stats.purchases > 0) {
        purchaseUsers += 1;
        avgOrderValueSum += stats.total / stats.purchases;
      }
    }

    const avgOrderValue = purchaseUsers > 0 ? avgOrderValueSum / purchaseUsers : 0;

    const segments = [
      {
        segment: 'power_users',
        userCount: powerUsers,
        avgOrderValue,
        conversionRate: conversion.overallConversionRate,
        churnRate: 0,
        lifetimeValue: avgOrderValue * 8,
      },
      {
        segment: 'at_risk_users',
        userCount: atRisk,
        avgOrderValue: 0,
        conversionRate: 0,
        churnRate: atRisk > 0 ? 100 : 0,
        lifetimeValue: 0,
      },
    ];

    const issues: Array<{
      issueId: string;
      issueType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      impactValue: number;
      suggestedAction: string;
      firstDetected: Timestamp;
      lastDetected: Timestamp;
    }> = [];

    if (conversion.overallConversionRate < 2 && totalViewers > 25) {
      issues.push({
        issueId: `low-conversion-${reportId}`,
        issueType: 'conversion',
        severity: 'high',
        title: 'Low conversion detected',
        description: `Overall conversion is ${conversion.overallConversionRate.toFixed(2)}%.`,
        impactValue: totalViewers,
        suggestedAction: 'Review checkout friction and product pricing clarity.',
        firstDetected: Timestamp.now(),
        lastDetected: Timestamp.now(),
      });
    }

    const abandonmentRate = pct(cartAbandonedCount, Math.max(cartAddCount, 1));
    if (abandonmentRate > 45 && cartAddCount > 20) {
      issues.push({
        issueId: `cart-abandonment-${reportId}`,
        issueType: 'cart_abandonment',
        severity: 'high',
        title: 'High cart abandonment detected',
        description: `Cart abandonment is ${abandonmentRate.toFixed(2)}% for the period.`,
        impactValue: totalAbandonedValue,
        suggestedAction: 'Trigger cart recovery broadcast and review shipping/fees messaging.',
        firstDetected: Timestamp.now(),
        lastDetected: Timestamp.now(),
      });
    }

    const ltvEstimate = segments.reduce((sum, segment) => {
      return sum + (segment.lifetimeValue || 0) * (segment.userCount || 0);
    }, 0);

    await db.collection(COLLECTIONS.ANALYTICS_DAILY).doc(reportId).set(
      {
        reportId,
        generatedAt: Timestamp.now(),
        rangeStart: startTs,
        rangeEnd: endTs,
        conversion,
        cartAbandonment,
        peakHours,
        segments,
        categoryPreference,
        ltvEstimate,
        issueCount: issues.length,
        highSeverityIssues: issues.filter((i) => i.severity === 'high' || i.severity === 'critical').length,
      },
      { merge: true }
    );

    const criticalIssues = issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'high');
    for (const issue of criticalIssues) {
      await db.collection(COLLECTIONS.ANOMALY_ALERTS).add({
        issueId: issue.issueId,
        issueType: issue.issueType,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        impactValue: issue.impactValue,
        suggestedAction: issue.suggestedAction,
        firstDetected: issue.firstDetected,
        lastDetected: issue.lastDetected,
        status: 'open',
        createdAt: Timestamp.now(),
        source: 'daily_aggregation_admin',
      });
    }

    let automatedActions = 0;
    if (atRisk > 0) {
      await db.collection(COLLECTIONS.BROADCASTS).add({
        audience: 'at_risk',
        type: 'retention_campaign',
        title: 'We miss you - return for member-exclusive deals',
        message: 'Your favorites are waiting. Return today and unlock a personalized comeback offer.',
        sourceReportId: reportId,
        status: 'queued',
        createdAt: Timestamp.now(),
      });
      automatedActions += 1;
    }

    if (powerUsers > 0) {
      await db.collection(COLLECTIONS.BROADCASTS).add({
        audience: 'power_users',
        type: 'vip_reward_campaign',
        title: 'VIP early access unlocked',
        message: 'You are eligible for early access inventory and priority pricing windows this week.',
        sourceReportId: reportId,
        status: 'queued',
        createdAt: Timestamp.now(),
      });
      automatedActions += 1;
    }

    await db.collection(COLLECTIONS.INTELLIGENCE_RUNS).add({
      reportId,
      rangeStart: startTs,
      rangeEnd: endTs,
      anomalyCount: criticalIssues.length,
      automatedActions,
      createdAt: Timestamp.now(),
      status: 'completed',
      source: 'admin_sdk',
    });

    return {
      reportId,
      rangeStartISO: start.toISOString(),
      rangeEndISO: end.toISOString(),
      anomalyCount: criticalIssues.length,
      automatedActions,
    };
  }
}
