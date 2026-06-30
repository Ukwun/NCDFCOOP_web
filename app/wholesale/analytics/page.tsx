'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { BarChart3, CircleDollarSign, PackageCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { USER_ROLES } from '@/lib/constants/database';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function WholesaleAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, totalSpent, loading, error } = useBuyerOrders(user?.uid || '');
  const wholesale = orders.filter((order: any) => order.buyerType === 'wholesale');
  const delivered = wholesale.filter((order) => order.status === 'delivered').length;
  const completionRate = wholesale.length ? Math.round((delivered / wholesale.length) * 100) : 0;

  return (
    <ProtectedRoute currentPath="/wholesale/analytics" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Live procurement intelligence</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Wholesale analytics</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">Metrics are calculated from this organization’s actual orders. No synthetic percentages or projected savings are presented as facts.</p>
            <div className="mt-5 flex flex-wrap gap-3"><button onClick={() => router.push('/wholesale/portfolio')} className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5">Portfolio breakdown</button><button onClick={() => router.push('/wholesale/orders')} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900">Order throughput</button><button onClick={() => router.push('/wholesale/sla-monitoring')} className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900">SLA monitoring</button></div>
          </section>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Analytics could not synchronize.</div> : loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Calculating live metrics…</div> : <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Procurement orders', value: wholesale.length.toLocaleString(), icon: BarChart3, detail: 'Recorded wholesale orders' },
              { label: 'Committed spend', value: naira(totalSpent), icon: CircleDollarSign, detail: 'Excluding cancelled orders' },
              { label: 'Completion rate', value: `${completionRate}%`, icon: PackageCheck, detail: `${delivered} delivered orders` },
            ].map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><metric.icon className="text-emerald-700"/><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{metric.value}</p><p className="mt-1 text-sm text-slate-500">{metric.detail}</p></article>)}
          </section>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
