/**
 * useIntelligentTracking Hook
 * React hook for integrating intelligent user tracking throughout the app
 * 
 * Usage:
 * ```
 * const { tracker, trackEvent } = useIntelligentTracking();
 * 
 * // Track page view on mount
 * useEffect(() => {
 *   tracker?.trackPageView('Products Page', '/products');
 * }, []);
 * 
 * // Track product view
 * const handleProductClick = (product) => {
 *   tracker?.trackProductView(product.id, product.name, product.category, product.price);
 * };
 * ```
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import {
  EnhancedActivityTracker,
  initializeTracker,
  getTracker,
} from '@/lib/services/enhancedActivityTracker';
import { RecommendationEngine, ProductRecommendation } from '@/lib/services/recommendationEngine';
import { AnalyticsService } from '@/lib/services/analyticsService';
import { IssueDetectionService, DetectedIssue } from '@/lib/services/issueDetectionService';

export interface UseIntelligentTrackingOptions {
  enableTracking?: boolean;
  enableAnalytics?: boolean;
  enableRecommendations?: boolean;
  trackPageView?: boolean;
}

export function useIntelligentTracking(
  options: UseIntelligentTrackingOptions = {}
) {
  const {
    enableTracking = true,
    enableAnalytics = true,
    enableRecommendations = true,
    trackPageView: trackPageViewOnMount = true,
  } = options;

  const { user } = useAuth();
  const trackerRef = useRef<EnhancedActivityTracker | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize tracker on mount
  useEffect(() => {
    if (!enableTracking || !user?.uid || isInitializedRef.current) return;

    trackerRef.current = initializeTracker(user.uid);
    isInitializedRef.current = true;

    // Track page view on mount
    if (trackPageViewOnMount && typeof window !== 'undefined') {
      const title = document.title;
      const url = window.location.href;
      const referrer = document.referrer;

      trackerRef.current.trackPageView(title, url, referrer);
    }

    // Cleanup on unmount - track page exit
    return () => {
      if (trackerRef.current && typeof window !== 'undefined') {
        trackerRef.current.trackPageExit(window.location.href);
      }
    };
  }, [user?.uid, enableTracking, trackPageViewOnMount]);

  // Get tracker instance
  const getTrackerInstance = useCallback((): EnhancedActivityTracker | null => {
    if (!enableTracking) return null;
    return trackerRef.current || getTracker();
  }, [enableTracking]);

  // Track custom event
  const trackEvent = useCallback(
    (activityType: string, details: Record<string, any>) => {
      const tracker = getTrackerInstance();
      if (!tracker) return;

      // Most events are handled through tracker methods, but this allows custom events
      console.log('Track event:', activityType, details);
    },
    [getTrackerInstance]
  );

  // Recommendation hooks
  const getRecommendations = useCallback(
    async (limit: number = 10): Promise<ProductRecommendation[]> => {
      if (!enableRecommendations || !user?.uid) return [];
      return RecommendationEngine.getPersonalizedRecommendations(
        user.uid,
        limit
      );
    },
    [enableRecommendations, user?.uid]
  );

  const getTrendingProducts = useCallback(
    async (days: number = 7, limit: number = 10): Promise<ProductRecommendation[]> => {
      if (!enableRecommendations) return [];
      return RecommendationEngine.getTrendingProducts(days, limit);
    },
    [enableRecommendations]
  );

  const getFrequentlyBoughtTogether = useCallback(
    async (productId: string, limit: number = 5): Promise<ProductRecommendation[]> => {
      if (!enableRecommendations) return [];
      return RecommendationEngine.getFrequentlyBoughtTogether(productId, limit);
    },
    [enableRecommendations]
  );

  // Analytics hooks
  const getConversionMetrics = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!enableAnalytics) return null;
      return AnalyticsService.getConversionMetrics(startDate, endDate);
    },
    [enableAnalytics]
  );

  const getCartAbandonmentMetrics = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!enableAnalytics) return null;
      return AnalyticsService.getCartAbandonmentMetrics(startDate, endDate);
    },
    [enableAnalytics]
  );

  const getProductPopularity = useCallback(
    async (metric: 'views' | 'cart' | 'purchases' = 'views', topN: number = 20) => {
      if (!enableAnalytics) return [];
      return AnalyticsService.getProductPopularity(metric, topN);
    },
    [enableAnalytics]
  );

  const getPeakHours = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!enableAnalytics) return [];
      return AnalyticsService.getPeakHours(startDate, endDate);
    },
    [enableAnalytics]
  );

  const getUserBehavior = useCallback(
    async (userId: string) => {
      if (!enableAnalytics) return null;
      return AnalyticsService.getUserBehaviorPattern(userId);
    },
    [enableAnalytics]
  );

  // Issue detection hooks
  const detectAllIssues = useCallback(
    async (startDate: Date, endDate: Date): Promise<DetectedIssue[]> => {
      if (!enableAnalytics) return [];
      return IssueDetectionService.detectAllIssues(startDate, endDate);
    },
    [enableAnalytics]
  );

  // Direct tracking methods
  const tracker = {
    // Page tracking
    trackPageView: useCallback(
      async (title: string, url: string, referrer?: string) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackPageView(title, url, referrer);
        }
      },
      [getTrackerInstance]
    ),

    trackPageExit: useCallback(
      async (url?: string) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackPageExit(url);
        }
      },
      [getTrackerInstance]
    ),

    // Product tracking
    trackProductView: useCallback(
      async (
        productId: string,
        productName: string,
        category: string,
        price: number,
        sellerId?: string,
        viewType: 'grid' | 'detail' = 'grid'
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackProductView(
            productId,
            productName,
            category,
            price,
            sellerId,
            viewType
          );
        }
      },
      [getTrackerInstance]
    ),

    trackSearch: useCallback(
      async (query: string, resultsCount: number, filters?: Record<string, any>) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackSearch(query, resultsCount, filters);
        }
      },
      [getTrackerInstance]
    ),

    trackFilter: useCallback(
      async (filterType: string, filterValue: string, resultsCount: number) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackFilter(filterType, filterValue, resultsCount);
        }
      },
      [getTrackerInstance]
    ),

    // Cart tracking
    trackAddToCart: useCallback(
      async (
        productId: string,
        productName: string,
        quantity: number,
        price: number,
        category: string
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackAddToCart(
            productId,
            productName,
            quantity,
            price,
            category
          );
        }
      },
      [getTrackerInstance]
    ),

    trackCartAbandonment: useCallback(
      async (
        cartItems: Array<{
          productId: string;
          name: string;
          price: number;
          quantity: number;
        }>,
        cartTotal: number,
        reason?: string
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackCartAbandonment(cartItems, cartTotal, reason);
        }
      },
      [getTrackerInstance]
    ),

    // Checkout tracking
    trackCheckoutStart: useCallback(
      async (cartItems: any[], cartTotal: number) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackCheckoutStart(cartItems, cartTotal);
        }
      },
      [getTrackerInstance]
    ),

    trackCheckoutProgress: useCallback(
      async (step: string, formFieldsFilled: number, totalFields: number) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackCheckoutProgress(step, formFieldsFilled, totalFields);
        }
      },
      [getTrackerInstance]
    ),

    trackCheckoutAbandonment: useCallback(
      async (
        step: string,
        cartTotal: number,
        formFieldsFilled: number,
        totalFields: number,
        reason?: string
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackCheckoutAbandonment(
            step,
            cartTotal,
            formFieldsFilled,
            totalFields,
            reason
          );
        }
      },
      [getTrackerInstance]
    ),

    // Purchase tracking
    trackPurchaseComplete: useCallback(
      async (
        orderId: string,
        orderTotal: number,
        cartItems: any[],
        paymentMethod?: string
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackPurchaseComplete(
            orderId,
            orderTotal,
            cartItems,
            paymentMethod
          );
        }
      },
      [getTrackerInstance]
    ),

    trackPurchaseFailed: useCallback(
      async (
        orderTotal: number,
        cartItems: any[],
        errorCode?: string,
        errorMessage?: string
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackPurchaseFailed(
            orderTotal,
            cartItems,
            errorCode,
            errorMessage
          );
        }
      },
      [getTrackerInstance]
    ),

    // Error tracking
    trackError: useCallback(
      async (
        errorName: string,
        errorMessage: string,
        stackTrace?: string,
        context?: Record<string, any>
      ) => {
        const instance = getTrackerInstance();
        if (instance) {
          await instance.trackError(errorName, errorMessage, stackTrace, context);
        }
      },
      [getTrackerInstance]
    ),

    // Session management
    getSessionId: useCallback(() => {
      const instance = getTrackerInstance();
      return instance?.getSessionId() || '';
    }, [getTrackerInstance]),
  };

  return {
    // Tracker instance for direct use
    tracker,
    trackerInstance: getTrackerInstance(),

    // Event tracking
    trackEvent,

    // Recommendations
    getRecommendations,
    getTrendingProducts,
    getFrequentlyBoughtTogether,

    // Analytics
    getConversionMetrics,
    getCartAbandonmentMetrics,
    getProductPopularity,
    getPeakHours,
    getUserBehavior,

    // Issue detection
    detectAllIssues,
  };
}
