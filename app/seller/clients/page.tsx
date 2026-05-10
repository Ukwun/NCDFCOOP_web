'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

const CLIENTS = [
  { id: 'c1', name: 'Prime Retail Hub', segment: 'Wholesale', orders: 28, value: 1840000 },
  { id: 'c2', name: 'Family Essentials Coop', segment: 'Member Group', orders: 16, value: 592000 },
  { id: 'c3', name: 'Urban Kitchens Ltd', segment: 'Institutional', orders: 11, value: 1250000 },
];

export default function SellerClientsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute currentPath="/seller/clients" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Client Relationships</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Manage repeat buyers, track relationship value, and accelerate order conversion across member and wholesale segments.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => router.push('/seller/inquiries')} className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-semibold">
                Open Client Inquiries
              </button>
              <button onClick={() => router.push('/seller/orders')} className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold">
                Track Client Orders
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLIENTS.map((client) => (
              <article key={client.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{client.segment}</p>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{client.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Orders: {client.orders}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Value: N {client.value.toLocaleString()}</p>
                <button onClick={() => router.push('/seller/inquiries')} className="mt-4 px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-medium">
                  Continue Conversation
                </button>
              </article>
            ))}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
