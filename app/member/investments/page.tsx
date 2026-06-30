'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { CircleDollarSign, Gift, PackageCheck, ShoppingBasket } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { USER_ROLES } from '@/lib/constants/database';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(value);
}

export default function MemberInvestmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: member, loading: memberLoading } = useMemberData(user?.uid || '');
  const { orders, activeOrders, totalSpent, loading: ordersLoading } = useBuyerOrders(user?.uid || '');
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;

  return (
    <ProtectedRoute currentPath="/member/investments" requiredRoles={[USER_ROLES.MEMBER]}>
      <main className="min-h-screen bg-[#F4F7FA] pb-16 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-3xl bg-gradient-to-r from-[#0D3D63] via-[#0E527F] to-[#1576A9] p-6 text-white shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Member purchase portfolio</p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Value created through your cooperative activity</h1>
            <p className="mt-2 max-w-3xl text-sm text-blue-50 sm:text-base">
              These figures come from your real orders and rewards account. NCDFCOOP does not present unverified investment yields or invented balances.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => router.push('/products')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0D3D63] transition hover:-translate-y-0.5 hover:bg-blue-50">Build purchase basket</button>
              <button onClick={() => router.push('/orders')} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">View order history</button>
              <button onClick={() => router.push('/my-rewards')} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">Open rewards</button>
            </div>
          </section>

          {(memberLoading || ordersLoading) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Synchronizing your live portfolio…</div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Tracked purchases', value: naira(totalSpent), detail: `${orders.length} non-deleted orders`, icon: CircleDollarSign },
                { label: 'Active orders', value: activeOrders.length.toLocaleString(), detail: 'Pending through shipment', icon: ShoppingBasket },
                { label: 'Delivered orders', value: deliveredOrders.toLocaleString(), detail: 'Completed fulfillment', icon: PackageCheck },
                { label: 'Reward points', value: (member?.rewardsPoints || 0).toLocaleString(), detail: member?.tier ? `${member.tier} tier` : 'Bronze tier', icon: Gift },
              ].map((metric) => (
                <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  <metric.icon className="h-5 w-5 text-[#0E527F] dark:text-blue-300" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{metric.value}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</p>
                </article>
              ))}
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">How this ecosystem creates value</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Member demand becomes seller revenue and purchasing data. Sellers fulfill the inventory, while wholesale buyers create larger supply commitments. Rewards and member benefits are calculated from completed activity—not projections.
            </p>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
