'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { orderService } from '@/lib/services/api/orderService';

function formatCurrency(value: number) {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function SellerEarningsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadStats() {
      setLoading(true);
      try {
        const sellerStats = await orderService.getSellerOrderStats(user.uid);
        setStats({
          ...sellerStats,
          averageOrderValue:
            sellerStats.totalOrders > 0
              ? Math.round((sellerStats.totalRevenue / sellerStats.totalOrders) * 100) / 100
              : 0,
        });
      } catch (err) {
        console.error('Failed to load seller earnings:', err);
        setError('Failed to load earnings data. Please refresh or try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user]);

  const pendingPayouts = stats ? Math.max(stats.totalRevenue - stats.paidRevenue, 0) : 0;

  return (
    <ProtectedRoute currentPath="/seller/earnings" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Earnings Console</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Monitor revenue flow, payout status, and order health with live seller analytics.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/seller/orders')}
                className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-semibold"
              >
                Open Order Revenue
              </button>
              <button
                onClick={() => router.push('/seller/products')}
                className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold"
              >
                Optimize Product Margins
              </button>
              <button
                onClick={() => router.push('/seller/payout-profile')}
                className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold"
              >
                Payout Profile Settings
              </button>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading earnings data...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900 p-6">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Gross Sales</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.totalRevenue) : '₦0'}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Earnings</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.paidRevenue) : '₦0'}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Payouts</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {formatCurrency(pendingPayouts)}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Order Value</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.averageOrderValue) : '₦0'}
                </p>
              </article>
            </section>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
