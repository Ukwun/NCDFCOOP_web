'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, PackageCheck, ShieldCheck, ShoppingBag } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { USER_ROLES } from '@/lib/constants/database';

export default function MyRewardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: member, loading: memberLoading } = useMemberData(user?.uid || '');
  const { orders, loading: ordersLoading } = useBuyerOrders(user?.uid || '');
  const points = member?.rewardsPoints || 0;
  const completedOrders = orders.filter((order) => order.status === 'delivered');

  return (
    <ProtectedRoute currentPath="/my-rewards" requiredRoles={[USER_ROLES.MEMBER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
            <button onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition hover:-translate-x-0.5 dark:border-slate-700"><ArrowLeft size={19}/></button>
            <div><h1 className="text-2xl font-black text-slate-950 dark:text-white">My rewards</h1><p className="text-sm text-slate-500">Your live cooperative loyalty balance</p></div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
          {(memberLoading || ordersLoading) ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Synchronizing rewards…</div> : <>
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 p-7 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Available points</p>
              <p className="mt-2 text-5xl font-black">{points.toLocaleString()}</p>
              <p className="mt-3 max-w-2xl text-sm text-amber-50">Points shown here come from your member record. Cash values and redemption history are never estimated or fabricated.</p>
              <button onClick={() => router.push('/member-products')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-amber-800 transition hover:-translate-y-0.5"><ShoppingBag size={17}/> Continue shopping</button>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><Gift className="text-amber-600"/><p className="mt-4 text-xs font-bold uppercase text-slate-500">Current tier</p><p className="mt-1 text-xl font-black capitalize">{member?.tier || 'bronze'}</p></article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><PackageCheck className="text-emerald-600"/><p className="mt-4 text-xs font-bold uppercase text-slate-500">Completed orders</p><p className="mt-1 text-xl font-black">{completedOrders.length}</p></article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><ShieldCheck className="text-blue-600"/><p className="mt-4 text-xs font-bold uppercase text-slate-500">Redemption status</p><p className="mt-1 text-base font-black">Protected</p><p className="mt-1 text-xs text-slate-500">Redemptions open only when an administrator publishes a funded reward offer.</p></article>
            </section>
          </>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
