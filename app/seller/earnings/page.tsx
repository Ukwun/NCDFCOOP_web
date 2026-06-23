'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function SellerEarningsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/seller/earnings" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Earnings Console</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Monitor revenue flow, payout status, and margin trends with live access to orders and product performance.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => router.push('/seller/orders')} className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-semibold">
                Open Order Revenue
              </button>
              <button onClick={() => router.push('/seller/products')} className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold">
                Optimize Product Margins
              </button>
              <button onClick={() => router.push('/seller/payout-profile')} className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold">
                Payout Profile Settings
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Gross Sales</p>
              <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">N 3.84M</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Earnings</p>
              <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">N 1.14M</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Payouts</p>
              <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">N 320K</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Order Margin</p>
              <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">24.6%</p>
            </article>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
