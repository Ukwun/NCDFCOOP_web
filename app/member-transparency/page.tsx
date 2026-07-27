'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CircleDollarSign, PackageCheck, ShieldCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { USER_ROLES } from '@/lib/constants/database';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function MemberTransparencyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, totalSpent, loading } = useBuyerOrders(user?.uid || '');
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const paid = orders.filter((order) => order.paymentStatus === 'paid').length;

  return (
    <ProtectedRoute currentPath="/member-transparency" requiredRoles={[USER_ROLES.MEMBER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6"><button onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition hover:-translate-x-0.5 dark:border-slate-700"><ArrowLeft size={19}/></button><div><h1 className="text-2xl font-black">Account transparency</h1><p className="text-sm text-slate-500">Auditable activity tied to your own account</p></div></div></header>
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
          <section className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-600 p-7 text-white shadow-xl"><ShieldCheck size={28}/><h2 className="mt-4 text-3xl font-black">Real figures only</h2><p className="mt-2 max-w-3xl text-sm text-blue-50">CoopX will publish cooperative financial statements only after they are formally approved and stored by authorized administrators. This page does not invent revenue, dividends, or personal distributions.</p></section>
          {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Synchronizing your account ledger…</div> : <section className="grid gap-4 sm:grid-cols-3">{[
            { label: 'Recorded orders', value: orders.length.toLocaleString(), icon: CheckCircle2 },
            { label: 'Tracked spend', value: naira(totalSpent), icon: CircleDollarSign },
            { label: 'Delivered / paid', value: `${delivered} / ${paid}`, icon: PackageCheck },
          ].map((metric) => <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><metric.icon className="text-blue-700"/><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p><p className="mt-1 text-2xl font-black">{metric.value}</p></article>)}</section>}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-xl font-black">What you can verify</h2><ul className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2"><li className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">Order totals and payment status in your order history</li><li className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">Seller and item attribution for each purchase</li><li className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">Reward balances derived from completed payments</li><li className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">Governance choices stored against your authenticated membership</li></ul></section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
