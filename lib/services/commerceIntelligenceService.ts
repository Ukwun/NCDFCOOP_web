/**
 * Commerce Intelligence Operations Service
 *
 * Runs daily aggregation jobs for:
 * - Funnel and conversion metrics
 * - Churn-risk and segment snapshots
 * - Category and LTV indicators
 * - Anomaly alerts and operational actions
 */

import { addDoc, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { AnalyticsService } from './analyticsService';
import { IssueDetectionService } from './issueDetectionService';

export interface DailyIntelligenceSummary {
  reportId: string;
  rangeStartISO: string;
  rangeEndISO: string;
  anomalyCount: number;
  automatedActions: number;
}

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

export class CommerceIntelligenceService {
  static async runDailyAggregation(
    referenceDate: Date = new Date()
  ): Promise<DailyIntelligenceSummary> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const { start, end } = getPreviousUtcDayRange(referenceDate);
    const reportId = dateKey(start);

    const [conversion, cartAbandonment, peakHours, segments, issues] = await Promise.all([
      AnalyticsService.getConversionMetrics(start, end),
      AnalyticsService.getCartAbandonmentMetrics(start, end),
      AnalyticsService.getPeakHours(start, end),
      AnalyticsService.getUserSegments(),
      IssueDetectionService.detectAllIssues(start, end),
    ]);

    const ltvEstimate = segments.reduce((sum, segment) => {
      return sum + (segment.lifetimeValue || 0) * (segment.userCount || 0);
    }, 0);

    const categoryPreference = await AnalyticsService.getProductPopularity('views', 10);

    const reportDoc = {
      reportId,
      generatedAt: Timestamp.now(),
      rangeStart: Timestamp.fromDate(start),
      rangeEnd: Timestamp.fromDate(end),
      conversion,
      cartAbandonment,
      peakHours,
      segments,
      categoryPreference,
      ltvEstimate,
      issueCount: issues.length,
      highSeverityIssues: issues.filter((i) => i.severity === 'high' || i.severity === 'critical').length,
    };

    await setDoc(doc(db, COLLECTIONS.ANALYTICS_DAILY, reportId), reportDoc, { merge: true });

    const criticalIssues = issues.filter(
      (issue) => issue.severity === 'critical' || issue.severity === 'high'
    );

    for (const issue of criticalIssues) {
      await addDoc(collection(db, COLLECTIONS.ANOMALY_ALERTS), {
        issueId: issue.issueId,
        issueType: issue.issueType,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        impactValue: issue.impactValue || 0,
        suggestedAction: issue.suggestedAction,
        firstDetected: issue.firstDetected,
        lastDetected: issue.lastDetected,
        status: 'open',
        createdAt: Timestamp.now(),
        source: 'daily_aggregation',
      });
    }

    const automatedActions = await this.createSegmentAutomations(segments, reportId);

    await addDoc(collection(db, COLLECTIONS.INTELLIGENCE_RUNS), {
      reportId,
      rangeStart: Timestamp.fromDate(start),
      rangeEnd: Timestamp.fromDate(end),
      anomalyCount: criticalIssues.length,
      automatedActions,
      createdAt: Timestamp.now(),
      status: 'completed',
    });

    return {
      reportId,
      rangeStartISO: start.toISOString(),
      rangeEndISO: end.toISOString(),
      anomalyCount: criticalIssues.length,
      automatedActions,
    };
  }

  private static async createSegmentAutomations(
    segments: Array<{
      segment: string;
      userCount: number;
      avgOrderValue: number;
      conversionRate: number;
      churnRate: number;
      lifetimeValue: number;
    }>,
    reportId: string
  ): Promise<number> {
    if (!db) return 0;

    let actions = 0;

    for (const segment of segments) {
      const normalized = segment.segment.toLowerCase();

      if (normalized.includes('at risk') && segment.userCount > 0) {
        await addDoc(collection(db, COLLECTIONS.BROADCASTS), {
          audience: 'at_risk',
          type: 'retention_campaign',
          title: 'We miss you - return for member-exclusive deals',
          message:
            'Your favorites are waiting. Return today and unlock a personalized comeback offer.',
          sourceReportId: reportId,
          status: 'queued',
          createdAt: Timestamp.now(),
        });
        actions++;
      }

      if (normalized.includes('power') && segment.userCount > 0) {
        await addDoc(collection(db, COLLECTIONS.BROADCASTS), {
          audience: 'power_users',
          type: 'vip_reward_campaign',
          title: 'VIP early access unlocked',
          message:
            'You are eligible for early access inventory and priority pricing windows this week.',
          sourceReportId: reportId,
          status: 'queued',
          createdAt: Timestamp.now(),
        });
        actions++;
      }
    }

    return actions;
  }
}
