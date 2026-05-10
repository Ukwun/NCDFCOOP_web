'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function WholesalePortfolioPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/wholesale/portfolio" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl bg-gradient-to-r from-[#164A2E] via-[#1E7F4E] to-[#2A9B61] text-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest opacity-80">Wholesale Portfolio</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Institutional position dashboard</h1>
            <p className="mt-2 text-sm sm:text-base opacity-90 max-w-3xl">
              Track bulk procurement exposure, supplier concentration, and working-capital usage across all active contracts.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => router.push('/wholesale/orders')} className="px-4 py-2 rounded-lg bg-white text-[#164A2E] font-semibold text-sm hover:bg-[#E8F6EE] transition-colors">
                Open Bulk Orders
              </button>
              <button onClick={() => router.push('/wholesale/analytics')} className="px-4 py-2 rounded-lg bg-[#12643D] text-white font-semibold text-sm hover:bg-[#0F5634] transition-colors">
                Run Portfolio Analytics
              </button>
              <button onClick={() => router.push('/wholesale/compliance')} className="px-4 py-2 rounded-lg bg-[#12643D] text-white font-semibold text-sm hover:bg-[#0F5634] transition-colors">
                Review Compliance Gates
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Deployed Capital</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">N 12.4M</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Supplier Count</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">28</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Margin Gain</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">11.6%</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Risk Alerts</p>
              <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">3</p>
            </article>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
