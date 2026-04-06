/**
 * Activity Tracking Hook
 * React hook for tracking user activities
 */

'use client';

import { useCallback, useRef } from 'react';
import { logActivity, ActivityLog } from '@/lib/services';

interface UseActivityTrackingOptions {
  userId: string;
  debounceMs?: number;
  includeDeviceInfo?: boolean;
  includeUserMetadata?: boolean;
}

export function useActivityTracking({
  userId,
  debounceMs = 500,
  includeDeviceInfo = false,
  includeUserMetadata = false,
}: UseActivityTrackingOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const trackActivity = useCallback(
    (
      eventType: ActivityLog['eventType'],
      eventData: ActivityLog['eventData']
    ) => {
      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const metadata = includeUserMetadata
            ? {
                userRole: localStorage.getItem('userRole') || '',
                userEmail: localStorage.getItem('userEmail') || '',
              }
            : undefined;

          const deviceInfo = includeDeviceInfo
            ? {
                platform: navigator.platform,
                browser: navigator.userAgent.split(' ').pop() || '',
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
              }
            : undefined;

          await logActivity(userId, eventType, eventData, metadata, deviceInfo);
        } catch (error) {
          console.error('Failed to track activity:', error);
        }
      }, debounceMs);
    },
    [userId, debounceMs, includeDeviceInfo, includeUserMetadata]
  );

  const trackProductView = useCallback(
    (productId: string, productName: string, category?: string) => {
      trackActivity('product_view', {
        productId,
        productName,
        productCategory: category,
      });
    },
    [trackActivity]
  );

  const trackProductSearch = useCallback(
    (query: string, resultsCount?: number) => {
      trackActivity('product_search', {
        searchQuery: query,
        resultsCount,
      });
    },
    [trackActivity]
  );

  const trackAddToCart = useCallback(
    (productId: string, quantity: number, price: number) => {
      trackActivity('add_to_cart', {
        productId,
        quantity,
        subtotal: quantity * price,
      });
    },
    [trackActivity]
  );

  const trackCheckoutStart = useCallback(
    (cartTotal: number, itemCount: number) => {
      trackActivity('checkout_start', {
        cartTotal,
        itemCount,
      });
    },
    [trackActivity]
  );

  const trackOrderPlaced = useCallback(
    (orderId: string, orderAmount: number) => {
      trackActivity('order_placed', {
        orderId,
        orderAmount,
      });
    },
    [trackActivity]
  );

  return {
    trackActivity,
    trackProductView,
    trackProductSearch,
    trackAddToCart,
    trackCheckoutStart,
    trackOrderPlaced,
  };
}
