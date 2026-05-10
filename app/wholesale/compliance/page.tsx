'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

export default function WholesaleCompliancePage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/wholesale/compliance" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Compliance Control Center</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Validate supplier certifications, contract obligations, and regulatory checkpoints before capital is deployed.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => router.push('/wholesale/portfolio')} className="px-4 py-2 rounded-lg bg-[#164A2E] hover:bg-[#0F3521] text-white text-sm font-semibold">
                Portfolio Risk Map
              </button>
              <button onClick={() => router.push('/notifications')} className="px-4 py-2 rounded-lg bg-[#E8F6EE] dark:bg-gray-700 text-[#164A2E] dark:text-[#8FD8AE] text-sm font-semibold">
                Alert Inbox
              </button>
              <button onClick={() => router.push('/settings')} className="px-4 py-2 rounded-lg bg-[#E8F6EE] dark:bg-gray-700 text-[#164A2E] dark:text-[#8FD8AE] text-sm font-semibold">
                Policy Settings
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current Compliance Status</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="rounded-xl bg-[#F6FCF9] dark:bg-gray-700 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Open Exceptions</p>
                <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">2</p>
              </article>
              <article className="rounded-xl bg-[#F6FCF9] dark:bg-gray-700 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending Renewals</p>
                <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">5</p>
              </article>
              <article className="rounded-xl bg-[#F6FCF9] dark:bg-gray-700 p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Audit Readiness</p>
                <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">98%</p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
