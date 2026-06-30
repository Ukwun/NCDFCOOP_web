'use client';

import Link from 'next/link';
import { BadgeCheck, CircleAlert, FileClock, ShieldCheck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { USER_ROLES } from '@/lib/constants/database';

export default function WholesaleCompliancePage() {
  const { user } = useAuth();
  const { orders, isLoading, error } = useRealTimeOrders(user?.uid);
  const wholesale = orders.filter((order) => order.buyerType === 'wholesale');
  const exceptions = wholesale.filter((order) => order.complianceStatus && order.complianceStatus !== 'cleared');
  const cleared = wholesale.filter((order) => order.complianceStatus === 'cleared').length;
  const readiness = wholesale.length ? Math.round(cleared / wholesale.length * 100) : 100;

  return <ProtectedRoute currentPath="/wholesale/compliance" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}><div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6"><main className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Order-linked assurance</p><h1 className="mt-2 text-3xl font-black">Compliance Control Centre</h1><p className="mt-2 max-w-2xl text-sm text-slate-200">Every checkpoint below is recorded by the server when inventory is reserved and supplier identity is evaluated.</p><div className="mt-5 flex flex-wrap gap-2"><Link href="/wholesale/suppliers" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-900">Manage suppliers</Link><Link href="/notifications" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Alert inbox</Link><Link href="/wholesale/settings" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Alert preferences</Link></div></section>
    <section className="grid grid-cols-3 gap-3"><Metric label="Open exceptions" value={exceptions.length} icon={<CircleAlert/>} alert={exceptions.length > 0}/><Metric label="Orders assessed" value={wholesale.length} icon={<FileClock/>}/><Metric label="Audit readiness" value={`${readiness}%`} icon={<ShieldCheck/>}/></section>
    {error && <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800">{error.message}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-4"><h2 className="font-bold">Compliance checkpoints by order</h2></div>{isLoading ? <p className="p-8 text-slate-500">Checking live order controls…</p> : <div className="divide-y divide-slate-100">{wholesale.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="grid gap-3 p-4 transition hover:bg-slate-50 md:grid-cols-[1fr_180px_1fr] md:items-center"><div><p className="font-mono text-xs text-slate-400">{order.id}</p><p className="font-semibold">{order.items?.map((item) => item.sellerName).filter(Boolean).join(', ') || 'Supplier'}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${order.complianceStatus === 'cleared' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{order.complianceStatus === 'cleared' ? 'Cleared' : 'Awaiting seller KYC'}</span><div className="flex flex-wrap gap-1.5">{Object.entries(order.complianceCheckpoints || {}).map(([name, value]) => <span key={name} className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold capitalize text-slate-600">{name}: {String(value).replace(/_/g, ' ')}</span>)}</div></Link>)}</div>}{!isLoading && !wholesale.length && <p className="p-8 text-slate-500">Compliance checkpoints appear when the first wholesale order is created.</p>}</section>
  </main></div></ProtectedRoute>;
}

function Metric({ label, value, icon, alert = false }: { label: string; value: string | number; icon: React.ReactNode; alert?: boolean }) { return <div className={`rounded-2xl border p-4 shadow-sm ${alert ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white'}`}><span className={alert ? 'text-amber-700' : 'text-emerald-700'}>{icon}</span><p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs opacity-70">{label}</p></div>; }
