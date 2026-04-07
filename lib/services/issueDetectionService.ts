/**
 * Issue Detection Service
 * Identifies problems in user experience and business metrics
 * 
 * Detects:
 * - Cart abandonment at various stages
 * - Page performance issues
 * - Payment failures and issues
 * - User friction points
 * - Conversion bottlenecks
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

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DetectedIssue {
  issueId: string;
  issueType: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  affectedCount: number; // number of users/transactions affected
  impactValue?: number; // revenue or other impact
  firstDetected: Date;
  lastDetected: Date;
  suggestedAction: string;
  data: Record<string, any>;
}

export class IssueDetectionService {
  /**
   * Scan for all issues
   */
  static async detectAllIssues(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];

      // Run all detection routines
      const cartAbandonIssues = await this.detectCartAbandonmentIssues(
        startDate,
        endDate
      );
      const checkoutIssues = await this.detectCheckoutIssues(
        startDate,
        endDate
      );
      const paymentIssues = await this.detectPaymentIssues(startDate, endDate);
      const performanceIssues = await this.detectPerformanceIssues(
        startDate,
        endDate
      );
      const errorIssues = await this.detectErrorSpikes(startDate, endDate);
      const frictionIssues = await this.detectUserFrictionPoints(
        startDate,
        endDate
      );

      issues.push(
        ...cartAbandonIssues,
        ...checkoutIssues,
        ...paymentIssues,
        ...performanceIssues,
        ...errorIssues,
        ...frictionIssues
      );

      return issues.sort((a, b) => {
        // Sort by severity, then by impact
        const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
        return (
          severityScore[b.severity] - severityScore[a.severity] ||
          (b.impactValue || 0) - (a.impactValue || 0)
        );
      });
    } catch (error) {
      console.error('Error detecting issues:', error);
      return [];
    }
  }

  /**
   * Detect cart abandonment issues
   */
  private static async detectCartAbandonmentIssues(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      // Count abandoned carts
      const abandonedQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'cart_abandoned'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const abandonedSnapshot = await getDocs(abandonedQ);
      const abandonedCarts = abandonedSnapshot.docs.map((doc) => doc.data());

      // Count checkouts
      const checkoutQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'checkout_start'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const checkoutSnapshot = await getDocs(checkoutQ);
      const checkoutCount = checkoutSnapshot.size;

      const abandonmentRate =
        checkoutCount > 0 ? (abandonedCarts.length / checkoutCount) * 100 : 0;

      // Issue: High cart abandonment rate (>40% is concerning)
      if (abandonmentRate > 40) {
        const totalAbandonedValue = abandonedCarts.reduce(
          (sum: number, cart: any) => sum + (cart.activityData?.orderTotal || 0),
          0
        );

        // Group by reason
        const reasonMap: Record<string, any> = {};
        abandonedCarts.forEach((cart: any) => {
          const reason =
            cart.activityData?.abandonReason || 'Unknown reason';
          if (!reasonMap[reason]) {
            reasonMap[reason] = { count: 0, value: 0 };
          }
          reasonMap[reason].count++;
          reasonMap[reason].value +=
            cart.activityData?.orderTotal || 0;
        });

        const topReason = Object.entries(reasonMap).sort(
          (a: any, b: any) => b[1].count - a[1].count
        )[0];

        issues.push({
          issueId: `cart_abandonment_${Date.now()}`,
          issueType: 'cart_abandonment',
          severity: abandonmentRate > 60 ? 'critical' : 'high',
          title: `High Cart Abandonment Rate (${abandonmentRate.toFixed(1)}%)`,
          description: `${abandonedCarts.length} carts abandoned in the selected period. Top reason: "${topReason?.[0]}" (${topReason?.[1].count} cases).`,
          affectedCount: abandonedCarts.length,
          impactValue: totalAbandonedValue,
          firstDetected: abandonedCarts[abandonedCarts.length - 1]?.timestamp
            ?.toDate?.() || new Date(),
          lastDetected:
            abandonedCarts[0]?.timestamp?.toDate?.() || new Date(),
          suggestedAction: `Implement targeted recovery emails for cart abandoners. Consider simplifying checkout process or offering incentives. Top issue: "${topReason?.[0]}"`,
          data: {
            abandonmentRate,
            abandonedCarts: abandonedCarts.length,
            totalAbandonedValue,
            reasonBreakdown: reasonMap,
          },
        });
      }

      return issues;
    } catch (error) {
      console.error('Error detecting cart abandonment issues:', error);
      return [];
    }
  }

  /**
   * Detect checkout process issues
   */
  private static async detectCheckoutIssues(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      // Get checkout progression
      const checkoutStartQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'checkout_start'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const checkoutStartSnapshot = await getDocs(checkoutStartQ);
      const checkoutStarts = checkoutStartSnapshot.docs.map((doc) =>
        doc.data()
      );

      const checkoutAbandonQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'checkout_abandoned'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const checkoutAbandonSnapshot = await getDocs(checkoutAbandonQ);
      const checkoutAbandons = checkoutAbandonSnapshot.docs.map((doc) =>
        doc.data()
      );

      const checkoutAbandonmentRate =
        checkoutStarts.length > 0
          ? (checkoutAbandons.length / checkoutStarts.length) * 100
          : 0;

      // Issue: High abandonment during checkout
      if (checkoutAbandonmentRate > 30) {
        // Find where users are dropping off
        const stepsMap: Record<string, number> = {};
        checkoutAbandons.forEach((abandon: any) => {
          const step = abandon.activityData?.checkoutStep || 'unknown';
          stepsMap[step] = (stepsMap[step] || 0) + 1;
        });

        const problemStep = Object.entries(stepsMap).sort(
          (a: any, b: any) => b[1] - a[1]
        )[0]?.[0];

        issues.push({
          issueId: `checkout_abandonment_${Date.now()}`,
          issueType: 'checkout_abandonment',
          severity: checkoutAbandonmentRate > 50 ? 'critical' : 'high',
          title: `High Checkout Abandonment (${checkoutAbandonmentRate.toFixed(1)}%)`,
          description: `${checkoutAbandons.length} users abandoned checkout. Most common drop-off point: "${problemStep}"`,
          affectedCount: checkoutAbandons.length,
          firstDetected:
            checkoutAbandons[checkoutAbandons.length - 1]?.timestamp
              ?.toDate?.() || new Date(),
          lastDetected:
            checkoutAbandons[0]?.timestamp?.toDate?.() || new Date(),
          suggestedAction: `Focus on simplifying "${problemStep}" step. Test with actual users to identify pain points.`,
          data: {
            checkoutAbandonmentRate,
            abandonedCheckouts: checkoutAbandons.length,
            dropOffByStep: stepsMap,
          },
        });
      }

      return issues;
    } catch (error) {
      console.error('Error detecting checkout issues:', error);
      return [];
    }
  }

  /**
   * Detect payment processing issues
   */
  private static async detectPaymentIssues(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      // Count payment failures
      const failureQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_failed'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const failureSnapshot = await getDocs(failureQ);
      const failures = failureSnapshot.docs.map((doc) => doc.data());

      // Count successful purchases
      const successQ = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_complete'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const successSnapshot = await getDocs(successQ);
      const successCount = successSnapshot.size;

      const failureRate =
        successCount + failures.length > 0
          ? (failures.length / (successCount + failures.length)) * 100
          : 0;

      // Issue: High payment failure rate (>5% is concerning)
      if (failureRate > 5) {
        // Group by error code
        const errorMap: Record<string, number> = {};
        failures.forEach((failure: any) => {
          const errorCode =
            failure.activityData?.errorCode || 'UNKNOWN_ERROR';
          errorMap[errorCode] = (errorMap[errorCode] || 0) + 1;
        });

        const topError = Object.entries(errorMap).sort(
          (a: any, b: any) => b[1] - a[1]
        )[0];

        const totalFailedRevenue = failures.reduce(
          (sum: number, failure: any) => sum + (failure.activityData?.orderTotal || 0),
          0
        );

        issues.push({
          issueId: `payment_failure_${Date.now()}`,
          issueType: 'payment_failure',
          severity: failureRate > 10 ? 'critical' : 'high',
          title: `High Payment Failure Rate (${failureRate.toFixed(1)}%)`,
          description: `${failures.length} payment failures recorded. Top error: "${topError?.[0]}" (${topError?.[1]} occurrences).`,
          affectedCount: failures.length,
          impactValue: totalFailedRevenue,
          firstDetected:
            failures[failures.length - 1]?.timestamp?.toDate?.() ||
            new Date(),
          lastDetected: failures[0]?.timestamp?.toDate?.() || new Date(),
          suggestedAction: `Investigate "${topError?.[0]}" error with payment provider. Check network logs and error handling.`,
          data: {
            failureRate,
            totalFailures: failures.length,
            totalFailedRevenue,
            errorBreakdown: errorMap,
          },
        });
      }

      return issues;
    } catch (error) {
      console.error('Error detecting payment issues:', error);
      return [];
    }
  }

  /**
   * Detect performance issues
   */
  private static async detectPerformanceIssues(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs),
        limit(10000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Analyze page load times
      let slowPageLoadCount = 0;
      let avgPageLoadTime = 0;
      let pageLoadTimes: number[] = [];

      activities.forEach((activity: any) => {
        const loadTime = activity.performanceMetrics?.pageLoadTime;
        if (loadTime) {
          pageLoadTimes.push(loadTime);
          avgPageLoadTime += loadTime;
          if (loadTime > 3000) {
            // More than 3 seconds is slow
            slowPageLoadCount++;
          }
        }
      });

      if (pageLoadTimes.length > 0) {
        avgPageLoadTime /= pageLoadTimes.length;

        if (slowPageLoadCount > pageLoadTimes.length * 0.1) {
          // More than 10% of pages are slow
          issues.push({
            issueId: `performance_${Date.now()}`,
            issueType: 'performance',
            severity: slowPageLoadCount > pageLoadTimes.length * 0.3
              ? 'high'
              : 'medium',
            title: `Slow Page Load Times (${(avgPageLoadTime / 1000).toFixed(2)}s avg)`,
            description: `${slowPageLoadCount} page loads exceeded 3 seconds. Average load time: ${(avgPageLoadTime / 1000).toFixed(2)}s.`,
            affectedCount: slowPageLoadCount,
            firstDetected: new Date(startDate),
            lastDetected: new Date(endDate),
            suggestedAction: `Optimize images, enable compression, use CDN. Run Lighthouse audit on slowest pages.`,
            data: {
              avgPageLoadTime,
              slowPageCount: slowPageLoadCount,
              totalMeasurements: pageLoadTimes.length,
              p95LoadTime:
                pageLoadTimes.length > 0
                  ? pageLoadTimes.sort((a, b) => a - b)[
                      Math.ceil(pageLoadTimes.length * 0.95)
                    ]
                  : 0,
            },
          });
        }
      }

      return issues;
    } catch (error) {
      console.error('Error detecting performance issues:', error);
      return [];
    }
  }

  /**
   * Detect error spikes
   */
  private static async detectErrorSpikes(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];
      const startTs = Timestamp.fromDate(startDate);
      const endTs = Timestamp.fromDate(endDate);

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'error'),
        where('timestamp', '>=', startTs),
        where('timestamp', '<=', endTs)
      );

      const snapshot = await getDocs(q);
      const errors = snapshot.docs.map((doc) => doc.data());

      if (errors.length > 10) {
        // More than 10 errors in the period
        const errorMap: Record<string, any> = {};

        errors.forEach((error: any) => {
          const errorCode = error.activityData?.errorCode || 'UNKNOWN';
          if (!errorMap[errorCode]) {
            errorMap[errorCode] = { count: 0, lastMessage: '' };
          }
          errorMap[errorCode].count++;
          errorMap[errorCode].lastMessage =
            error.activityData?.errorMessage;
        });

        const topError = Object.entries(errorMap).sort(
          (a: any, b: any) => b[1].count - a[1].count
        )[0];

        issues.push({
          issueId: `error_spike_${Date.now()}`,
          issueType: 'error_spike',
          severity: errors.length > 50 ? 'critical' : 'high',
          title: `Error Spike Detected (${errors.length} errors)`,
          description: `${errors.length} errors in selected period. Most common: "${topError?.[0]}" (${topError?.[1].count}x)`,
          affectedCount: errors.length,
          firstDetected:
            errors[errors.length - 1]?.timestamp?.toDate?.() ||
            new Date(),
          lastDetected: errors[0]?.timestamp?.toDate?.() || new Date(),
          suggestedAction: `Check application logs. ${topError?.[1].lastMessage || 'Review error details.'}`,
          data: {
            totalErrors: errors.length,
            errorBreakdown: errorMap,
          },
        });
      }

      return issues;
    } catch (error) {
      console.error('Error detecting error spikes:', error);
      return [];
    }
  }

  /**
   * Detect user friction points
   */
  private static async detectUserFrictionPoints(
    startDate: Date,
    endDate: Date
  ): Promise<DetectedIssue[]> {
    try {
      const issues: DetectedIssue[] = [];

      // High page exit rate (users leaving without converting)
      // Low engagement on product pages
      // Quick exits from checkout
      // These would be detected through session analysis

      return issues;
    } catch (error) {
      console.error('Error detecting user friction points:', error);
      return [];
    }
  }
}
