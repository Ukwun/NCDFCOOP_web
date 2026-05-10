'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function WholesaleAnalyticsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/wholesale/analytics" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Wholesale Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Operational intelligence for procurement velocity, supplier performance, and cost trend forecasting.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => router.push('/wholesale/portfolio')} className="px-4 py-3 rounded-lg bg-[#164A2E] hover:bg-[#0F3521] text-white text-sm font-semibold">
                Portfolio Breakdown
              </button>
              <button onClick={() => router.push('/wholesale/orders')} className="px-4 py-3 rounded-lg bg-[#E8F6EE] dark:bg-gray-700 text-[#164A2E] dark:text-[#8FD8AE] text-sm font-semibold">
                Order Throughput
              </button>
              <button onClick={() => router.push('/wholesale/compliance')} className="px-4 py-3 rounded-lg bg-[#E8F6EE] dark:bg-gray-700 text-[#164A2E] dark:text-[#8FD8AE] text-sm font-semibold">
                Compliance Impact
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Procurement Velocity</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">+14%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">vs last month</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Cost Variance</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">-3.7%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">net savings</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Supplier Reliability</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">96.2%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">on-time fulfillment</p>
            </article>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
