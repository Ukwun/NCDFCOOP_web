'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

const PLANS = [
  { id: 'grain', name: 'Staple Grain Rotation', term: '90 days', target: 'N 3.5M', expected: '9.2%' },
  { id: 'protein', name: 'Protein Security Pool', term: '120 days', target: 'N 5.0M', expected: '11.1%' },
  { id: 'oil', name: 'Cooking Oil Forward Basket', term: '60 days', target: 'N 2.1M', expected: '7.8%' },
];

export default function WholesaleBulkInvestmentsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/wholesale/bulk-investments" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Bulk Investments</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Launch and manage high-volume purchase programs with structured terms, live execution tracking,
              and integrated procurement routing.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => router.push('/products')} className="px-4 py-2 rounded-lg bg-[#164A2E] hover:bg-[#0F3521] text-white text-sm font-semibold">
                Build New Basket
              </button>
              <button onClick={() => router.push('/cart')} className="px-4 py-2 rounded-lg bg-[#E8F6EE] dark:bg-gray-700 text-[#164A2E] dark:text-[#8FD8AE] text-sm font-semibold">
                Open Bulk Cart
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <article key={plan.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{plan.term}</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{plan.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">Capital Target: {plan.target}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Expected Return: {plan.expected}</p>
                <button
                  onClick={() => router.push('/wholesale/orders')}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#164A2E] hover:bg-[#0F3521] text-white text-sm font-medium"
                >
                  Allocate and Execute
                </button>
              </article>
            ))}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
