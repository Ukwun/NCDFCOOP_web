'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function MemberInvestmentsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/member/investments" requiredRoles={[USER_ROLES.MEMBER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl bg-gradient-to-r from-[#0D3D63] via-[#0E527F] to-[#1576A9] text-white p-6 sm:p-8">
            <p className="text-xs uppercase tracking-widest opacity-80">Member Investments</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Grow value while you shop</h1>
            <p className="mt-2 text-sm sm:text-base opacity-90 max-w-3xl">
              This portfolio view tracks your reward yield, cooperative savings momentum, and vote-linked
              investment opportunities from one screen.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => router.push('/my-rewards')} className="px-4 py-2 rounded-lg bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors">
                Open Rewards Center
              </button>
              <button onClick={() => router.push('/member-benefits')} className="px-4 py-2 rounded-lg bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                View Tier Benefits
              </button>
              <button onClick={() => router.push('/member-voting')} className="px-4 py-2 rounded-lg bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                Governance Voting
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Portfolio Value</p>
              <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">N 214,500</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">+8.4% quarter-over-quarter</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Projected Yield</p>
              <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">N 19,300</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Next cycle estimate</p>
            </article>
            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Allocations</p>
              <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">4</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Consumer staples, logistics, and credit pools</p>
            </article>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Move from investment planning to execution in one click.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => router.push('/products')} className="px-4 py-3 rounded-lg bg-[#0E4B78] hover:bg-[#0A3B5F] text-white text-sm font-medium">
                Add Investment Basket
              </button>
              <button onClick={() => router.push('/orders')} className="px-4 py-3 rounded-lg bg-[#F3F7FB] dark:bg-gray-700 text-[#0E4B78] dark:text-[#7FC2EA] text-sm font-medium">
                Review Order Returns
              </button>
              <button onClick={() => router.push('/member-transparency')} className="px-4 py-3 rounded-lg bg-[#F3F7FB] dark:bg-gray-700 text-[#0E4B78] dark:text-[#7FC2EA] text-sm font-medium">
                Transparency Reports
              </button>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
