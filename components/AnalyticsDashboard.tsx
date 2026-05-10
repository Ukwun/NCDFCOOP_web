/**
 * Analytics Dashboard Component
 * Displays comprehensive business intelligence and user behavior insights
 * 
 * Shows:
 * - Conversion metrics
 * - Cart abandonment issues
 * - Payment failure tracking
 * - Product popularity
 * - Peak shopping hours
 * - Detected issues
 * - Up-to-date recommendations
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useIntelligentTracking } from '@/lib/hooks/useIntelligentTracking';
import {
  ConversionMetrics,
  CartAbandonmentMetrics,
  ProductPopularity,
  PeakHours,
  IntentLayerTelemetryBreakdown,
  IntentLayerRoleStats,
} from '@/lib/services/analyticsService';
import { DetectedIssue } from '@/lib/services/issueDetectionService';

export interface AnalyticsDashboardProps {
  timeRange?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  refreshInterval?: number; // milliseconds
  showIssueDetection?: boolean;
}

export function AnalyticsDashboard({
  timeRange = 'month',
  refreshInterval = 60000, // 1 minute
  showIssueDetection = true,
}: AnalyticsDashboardProps) {
  // State
  const [conversionMetrics, setConversionMetrics] = useState<ConversionMetrics | null>(null);
  const [cartMetrics, setCartMetrics] = useState<CartAbandonmentMetrics | null>(null);
  const [topProducts, setTopProducts] = useState<ProductPopularity[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHours[]>([]);
  const [issues, setIssues] = useState<DetectedIssue[]>([]);
  const [intentTelemetry, setIntentTelemetry] = useState<IntentLayerTelemetryBreakdown | null>(null);
  const [intentRoleFilter, setIntentRoleFilter] = useState<'all' | 'member' | 'institutional_buyer' | 'seller'>('all');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Hooks
  const {
    getConversionMetrics,
    getCartAbandonmentMetrics,
    getProductPopularity,
    getPeakHours,
    detectAllIssues,
    getIntentLayerTelemetry,
  } = useIntelligentTracking({
    enableAnalytics: true,
  });

  // Date calculation
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();

      const [metrics, cartAbandon, products, hours, detectedIssues, intentBreakdown] =
        await Promise.all([
          getConversionMetrics(startDate, endDate),
          getCartAbandonmentMetrics(startDate, endDate),
          getProductPopularity('purchases', 10),
          getPeakHours(startDate, endDate),
          detectAllIssues(startDate, endDate),
          getIntentLayerTelemetry(startDate, endDate, 10),
        ]);

      setConversionMetrics(metrics);
      setCartMetrics(cartAbandon);
      setTopProducts(products);
      setPeakHours(hours);
      setIssues(detectedIssues);
      setIntentTelemetry(intentBreakdown);
      setLastUpdatedAt(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and set refresh interval
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [timeRange, refreshInterval]);

  const roleButtonClass = (role: 'all' | 'member' | 'institutional_buyer' | 'seller') => {
    const isActive = intentRoleFilter === role;
    return `px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;
  };

  const roleDisplayName = (role: string) => {
    if (role === 'institutional_buyer') return 'Wholesale';
    if (role === 'member') return 'Member';
    if (role === 'seller') return 'Seller';
    return role;
  };

  const filteredRoleStats = useMemo(() => {
    const rows = intentTelemetry?.roleStats || [];
    if (intentRoleFilter === 'all') return rows;
    return rows.filter((row) => row.role === intentRoleFilter);
  }, [intentRoleFilter, intentTelemetry?.roleStats]);

  const filteredTopIntents = useMemo(() => {
    const rows = intentTelemetry?.topIntents || [];
    if (intentRoleFilter === 'all') return rows;
    return rows.filter((row) => row.role === intentRoleFilter);
  }, [intentRoleFilter, intentTelemetry?.topIntents]);

  const filteredFunnel = useMemo(() => {
    if (intentRoleFilter === 'all') {
      return intentTelemetry?.funnel || {
        typedCount: 0,
        clickedCount: 0,
        landedCount: 0,
        typedToClickedRate: 0,
        clickedToLandedRate: 0,
        typedToLandedRate: 0,
      };
    }

    const roleRow = (intentTelemetry?.roleStats || []).find(
      (row) => row.role === intentRoleFilter
    ) as IntentLayerRoleStats | undefined;

    return {
      typedCount: roleRow?.typedCount || 0,
      clickedCount: roleRow?.clickedCount || 0,
      landedCount: roleRow?.landedCount || 0,
      typedToClickedRate: roleRow?.typedToClickedRate || 0,
      clickedToLandedRate: roleRow?.clickedToLandedRate || 0,
      typedToLandedRate: roleRow?.typedToLandedRate || 0,
    };
  }, [intentRoleFilter, intentTelemetry?.funnel, intentTelemetry?.roleStats]);

  if (loading && !conversionMetrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Business intelligence and user behavior insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            Overall Conversion Rate
          </div>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-bold text-indigo-600">
              {conversionMetrics?.overallConversionRate.toFixed(2)}%
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {conversionMetrics?.purchaseCount} of{' '}
            {conversionMetrics?.totalViewers} viewers purchased
          </p>
        </div>

        {/* Cart to Checkout Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            Cart to Checkout Rate
          </div>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-bold text-emerald-600">
              {conversionMetrics?.cartToCheckoutRate.toFixed(2)}%
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {conversionMetrics?.checkoutStartCount} of{' '}
            {conversionMetrics?.cartAddCount} carts proceeded
          </p>
        </div>

        {/* Cart Abandonment Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            Cart Abandonment
          </div>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-bold text-orange-600">
              {cartMetrics?.totalCartsAbandoned || 0}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Lost revenue: ₦
            {(cartMetrics?.totalAbandonedValue || 0).toLocaleString()}
          </p>
        </div>

        {/* Average Cart Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-600">
            Average Order Value
          </div>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-bold text-blue-600">
              ₦{(cartMetrics?.averageCartValue || 0).toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Based on abandoned carts
          </p>
        </div>
      </div>

      {/* Intent Layer Telemetry */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Intent Layer Telemetry
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tracks search intent interactions across roles from typed to click to landed destination.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIntentRoleFilter('all')}
              className={roleButtonClass('all')}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setIntentRoleFilter('member')}
              className={roleButtonClass('member')}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setIntentRoleFilter('institutional_buyer')}
              className={roleButtonClass('institutional_buyer')}
            >
              Wholesale
            </button>
            <button
              type="button"
              onClick={() => setIntentRoleFilter('seller')}
              className={roleButtonClass('seller')}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs uppercase text-indigo-700 font-semibold tracking-wide">Typed</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">{filteredFunnel.typedCount}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs uppercase text-amber-700 font-semibold tracking-wide">Clicked</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{filteredFunnel.clickedCount}</p>
              <p className="text-xs text-amber-700 mt-1">{filteredFunnel.typedToClickedRate.toFixed(1)}% from typed</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs uppercase text-emerald-700 font-semibold tracking-wide">Landed</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{filteredFunnel.landedCount}</p>
              <p className="text-xs text-emerald-700 mt-1">{filteredFunnel.clickedToLandedRate.toFixed(1)}% from clicked</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Typed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Clicked</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Landed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Typed→Clicked</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Clicked→Landed</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoleStats.map((row) => (
                  <tr key={row.role} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{roleDisplayName(row.role)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{row.typedCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{row.clickedCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{row.landedCount}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{row.typedToClickedRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{row.clickedToLandedRate.toFixed(1)}%</td>
                  </tr>
                ))}
                {filteredRoleStats.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No role telemetry available for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Intent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Clicks</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Landings</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">Intent Conversion</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopIntents.map((intent) => (
                  <tr key={`${intent.role}-${intent.intentId}`} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{intent.intentLabel}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{roleDisplayName(intent.role)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{intent.clicks}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{intent.landings}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{intent.conversionRate.toFixed(1)}%</td>
                  </tr>
                ))}
                {filteredTopIntents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                      No intent click telemetry captured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            Total intent telemetry events: {intentTelemetry?.totalTrackedEvents || 0}
          </p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Top Performing Products
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Views
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Cart Adds
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Purchases
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-600">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-900">
                      {product.viewCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-900">
                      {product.addToCartCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-emerald-600">
                      {product.purchaseCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-gray-900">
                      {product.viewToCartRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detected Issues */}
      {showIssueDetection && issues.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Detected Issues ({issues.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {issues.map((issue) => (
              <div key={issue.issueId} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {issue.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : issue.severity === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : issue.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {issue.description}
                    </p>
                    <p className="text-sm text-indigo-600 mt-2">
                      {issue.suggestedAction}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {issue.affectedCount}
                    </p>
                    <p className="text-xs text-gray-500">affected</p>
                    {issue.impactValue && (
                      <p className="text-sm font-medium text-red-600 mt-2">
                        ₦{issue.impactValue.toLocaleString()} impact
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Shopping Hours */}
      {peakHours.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Peak Shopping Hours
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Day & Hour
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Activity Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Purchases
                  </th>
                </tr>
              </thead>
              <tbody>
                {peakHours.slice(0, 10).map((hour, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {hour.dayOfWeek} {hour.hour}:00
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-900">
                        {hour.activityCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-emerald-600">
                        {hour.purchaseCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Refresh Indicator */}
      <div className="text-center text-xs text-gray-500">
        Last updated: {(lastUpdatedAt || new Date()).toLocaleTimeString()}
      </div>
    </div>
  );
}
