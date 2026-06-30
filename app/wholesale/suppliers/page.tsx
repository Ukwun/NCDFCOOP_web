'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BadgeCheck, Building2, Clock3, MessageSquare, ShieldAlert, Truck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { USER_ROLES } from '@/lib/constants/database';
import { toDate } from '@/lib/utils/dateHelper';

export default function WholesaleSuppliersPage() {
  const { user } = useAuth();
  const { orders, isLoading, error } = useRealTimeOrders(user?.uid);
  const suppliers = useMemo(() => {
    const rows = new Map<string, { id: string; name: string; orders: Set<string>; delivered: number; onTime: number; spend: number; verified: boolean; lastOrder: Date | null }>();
    orders.filter((order) => order.buyerType === 'wholesale').forEach((order) => (order.items || []).forEach((item) => {
      if (!item.sellerId) return;
      const row = rows.get(item.sellerId) || { id: item.sellerId, name: item.sellerName || 'Supplier', orders: new Set<string>(), delivered: 0, onTime: 0, spend: 0, verified: true, lastOrder: null };
      row.orders.add(order.id); row.spend += (item.price || 0) * (item.quantity || 0); row.verified = row.verified && item.sellerVerified === true;
      const created = toDate(order.createdAt); if (!row.lastOrder || created > row.lastOrder) row.lastOrder = created;
      if (order.status === 'delivered') { row.delivered += 1; const delivered = order.deliveryDate ? toDate(order.deliveryDate) : null; const promised = order.promisedDeliveryDate ? toDate(order.promisedDeliveryDate) : order.estimatedDelivery ? toDate(order.estimatedDelivery) : null; if (delivered && promised && delivered <= promised) row.onTime += 1; }
      rows.set(item.sellerId, row);
    }));
    return Array.from(rows.values()).sort((a, b) => b.spend - a.spend);
  }, [orders]);

  return <ProtectedRoute currentPath="/wholesale/suppliers" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}><div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6"><main className="mx-auto max-w-7xl">
    <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Relationship intelligence</p><h1 className="mt-2 text-3xl font-black">Supplier Management</h1><p className="mt-2 max-w-2xl text-sm text-slate-200">Live supplier verification, fulfillment performance, spend exposure, and direct contact—derived from your procurement history.</p></header>
    {error && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800">{error.message}</div>}
    {isLoading ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-white"/>)}</div> : <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{suppliers.map((supplier) => {
      const onTimeRate = supplier.delivered ? Math.round(supplier.onTime / supplier.delivered * 100) : null;
      return <article key={supplier.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-800"><Building2/></span><div><h2 className="font-bold">{supplier.name}</h2><p className="text-xs text-slate-500">{supplier.orders.size} procurement order{supplier.orders.size === 1 ? '' : 's'}</p></div></div>{supplier.verified ? <BadgeCheck className="text-emerald-600"/> : <ShieldAlert className="text-amber-500"/>}</div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Relationship spend</p><p className="mt-1 font-black">₦{supplier.spend.toLocaleString()}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">On-time SLA</p><p className="mt-1 font-black">{onTimeRate === null ? 'No deliveries' : `${onTimeRate}%`}</p></div></div>
        <div className="mt-3 space-y-2 text-xs text-slate-600"><p className="flex items-center gap-2"><Truck size={15}/>Contract activity: {supplier.orders.size ? 'Active procurement relationship' : 'No active relationship'}</p><p className="flex items-center gap-2"><Clock3 size={15}/>Last order: {supplier.lastOrder?.toLocaleDateString() || 'None'}</p><p className={`flex items-center gap-2 font-semibold ${supplier.verified ? 'text-emerald-700' : 'text-amber-700'}`}>{supplier.verified ? <BadgeCheck size={15}/> : <ShieldAlert size={15}/>} {supplier.verified ? 'Supplier KYC verified' : 'Verification evidence required'}</p></div>
        <div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/inquiries?seller=${encodeURIComponent(supplier.id)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50"><MessageSquare size={16}/>Message</Link><Link href={`/wholesale/orders?supplier=${encodeURIComponent(supplier.id)}`} className="rounded-xl bg-emerald-700 px-3 py-2 text-center text-sm font-bold text-white hover:bg-emerald-800">View orders</Link></div>
      </article>})}</div>}
    {!isLoading && !suppliers.length && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Suppliers will appear after your first wholesale order or RFQ.</div>}
  </main></div></ProtectedRoute>;
}
