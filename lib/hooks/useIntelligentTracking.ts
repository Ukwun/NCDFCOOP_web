import { AnalyticsService } from '@/lib/services/analyticsService';
import { IssueDetectionService } from '@/lib/services/issueDetectionService';
import { getSellerRevenueBreakdownOverTime } from '@/lib/services/sellerService';

export function useIntelligentTracking({ enableAnalytics }: { enableAnalytics: boolean }) {
  return {
    getConversionMetrics: AnalyticsService.getConversionMetrics,
    getCartAbandonmentMetrics: AnalyticsService.getCartAbandonmentMetrics,
    getProductPopularity: AnalyticsService.getProductPopularity,
    getPeakHours: AnalyticsService.getPeakHours,
    getUserSegments: AnalyticsService.getUserSegments,
    getIntentLayerTelemetry: AnalyticsService.getIntentLayerTelemetry,
    detectAllIssues: IssueDetectionService.detectAllIssues,
    getSellerRevenueBreakdownOverTime,
  };
}
