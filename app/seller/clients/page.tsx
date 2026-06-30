'use client';

export const dynamic = 'force-dynamic';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CircleDollarSign, ShoppingBag, Users } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useSellerOrders } from '@/lib/hooks/useSellerOrders';
import { USER_ROLES } from '@/lib/constants/database';

function naira(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

export default function SellerClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders, loading, error } = useSellerOrders(user?.uid || '');
  const clients = useMemo(() => {
    const rows = new Map<string, { id: string; name: string; email: string; segment: string; orders: number; value: number }>();
    orders.forEach((order) => {
      const id = order.buyerId || order.buyerEmail || order.id;
      const current = rows.get(id) || {
        id,
        name: order.buyerName || order.buyerEmail?.split('@')[0] || 'Marketplace buyer',
        email: order.buyerEmail || '',
        segment: order.buyerType === 'wholesale' ? 'Wholesale buyer' : 'Member buyer',
        orders: 0,
        value: 0,
      };
      const sellerValue = (order.items || [])
        .filter((item) => item.sellerId === user?.uid)
        .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
      current.orders += 1;
      current.value += sellerValue;
      rows.set(id, current);
    });
    return Array.from(rows.values()).sort((a, b) => b.value - a.value);
  }, [orders, user?.uid]);

  return (
    <ProtectedRoute currentPath="/seller/clients" requiredRoles={[USER_ROLES.SELLER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Live buyer relationships</p><h1 className="mt-2 text-3xl font-black">Seller clients</h1><p className="mt-2 max-w-3xl text-sm text-emerald-50">Buyer relationships are derived from orders containing your products. No sample clients or fabricated sales values are shown.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => router.push('/seller/inquiries')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-900 transition hover:-translate-y-0.5">Open inquiries</button><button onClick={() => router.push('/seller/orders')} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20">Track orders</button></div></section>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Client relationships could not synchronize.</div> : loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 dark:bg-slate-900">Synchronizing client orders…</div> : clients.length === 0 ? <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"><Users className="mx-auto text-emerald-700" size={32}/><h2 className="mt-4 text-xl font-bold">No purchasing clients yet</h2><p className="mt-2 text-sm text-slate-500">Clients appear here after a member or wholesale buyer orders one of your products.</p></section> : <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => <article key={client.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Building2 size={19}/></span><div className="min-w-0"><p className="truncate font-black text-slate-950 dark:text-white">{client.name}</p><p className="truncate text-xs text-slate-500">{client.email || client.segment}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><ShoppingBag size={15}/><p className="mt-2 text-lg font-black">{client.orders}</p><p className="text-xs text-slate-500">Orders</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><CircleDollarSign size={15}/><p className="mt-2 text-lg font-black">{naira(client.value)}</p><p className="text-xs text-slate-500">Your sales</p></div></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-emerald-700">{client.segment}</p></article>)}</section>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
