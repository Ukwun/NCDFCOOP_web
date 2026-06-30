'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { Boxes, CircleDollarSign, Clock3, PackageCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { USER_ROLES } from '@/lib/constants/database';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function WholesaleBulkInvestmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, activeOrders, totalSpent, loading, error } = useBuyerOrders(user?.uid || '');
  const wholesaleOrders = orders.filter((order: any) => order.buyerType === 'wholesale');
  const delivered = wholesaleOrders.filter((order) => order.status === 'delivered').length;

  return (
    <ProtectedRoute currentPath="/wholesale/bulk-investments" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-7 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Institutional procurement portfolio</p>
            <h1 className="mt-2 text-3xl font-black">Bulk programs backed by real orders</h1>
            <p className="mt-2 max-w-3xl text-sm text-emerald-50">This register reflects committed procurement and fulfillment. It does not advertise fictional capital targets or unapproved investment returns.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => router.push('/wholesale/products')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-950 transition hover:-translate-y-0.5">Build bulk basket</button>
              <button onClick={() => router.push('/wholesale/orders')} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">Open procurement orders</button>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">The procurement portfolio could not synchronize. Refresh the page after checking your connection.</div>
          ) : loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Synchronizing procurement activity…</div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Committed spend', value: naira(totalSpent), icon: CircleDollarSign },
                { label: 'Bulk orders', value: wholesaleOrders.length.toLocaleString(), icon: Boxes },
                { label: 'Active pipeline', value: activeOrders.length.toLocaleString(), icon: Clock3 },
                { label: 'Delivered', value: delivered.toLocaleString(), icon: PackageCheck },
              ].map((metric) => (
                <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <metric.icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{metric.value}</p>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
