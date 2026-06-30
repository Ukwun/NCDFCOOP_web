'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock3, Radio, Truck } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { USER_ROLES } from '@/lib/constants/database';
import { toDate } from '@/lib/utils/dateHelper';

export default function SlaMonitoringPage() {
  const { user } = useAuth();
  const { orders, isLoading, error } = useRealTimeOrders(user?.uid);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const wholesale = orders.filter((order) => order.buyerType === 'wholesale');
  const rows = useMemo(() => wholesale.filter((order) => !['delivered', 'cancelled'].includes(order.status)).map((order) => {
    const ageHours = Math.max(0, (now - toDate(order.createdAt).getTime()) / 3_600_000);
    const promise = order.promisedDeliveryDate ? toDate(order.promisedDeliveryDate) : order.estimatedDelivery ? toDate(order.estimatedDelivery) : null;
    const estimated = order.estimatedDelivery ? toDate(order.estimatedDelivery) : null;
    const risk = (['pending', 'compliance_review', 'confirmed'].includes(order.status) && ageHours >= 72) || (!!promise && promise.getTime() < now);
    return { order, ageHours, promise, estimated, risk };
  }).sort((a, b) => Number(b.risk) - Number(a.risk) || b.ageHours - a.ageHours), [wholesale, now]);
  const delivered = wholesale.filter((order) => order.status === 'delivered' && order.deliveryDate && (order.promisedDeliveryDate || order.estimatedDelivery));
  const onTime = delivered.filter((order) => toDate(order.deliveryDate!) <= toDate(order.promisedDeliveryDate || order.estimatedDelivery!)).length;
  const rate = delivered.length ? Math.round(onTime / delivered.length * 100) : 0;
  const risks = rows.filter((row) => row.risk).length;

      return <ProtectedRoute currentPath="/wholesale/sla-monitoring" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}><div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6"><main className="mx-auto max-w-7xl">
    <header className="flex flex-col justify-between gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-emerald-950 p-7 md:flex-row md:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300"><Radio size={14} className="animate-pulse"/>Live fulfillment intelligence</p><h1 className="mt-2 text-3xl font-black">SLA Monitoring</h1><p className="mt-2 text-sm text-slate-300">Orders at risk are calculated from real status timestamps and promised delivery dates.</p></div><Link href="/wholesale/orders" className="rounded-xl bg-white px-4 py-2 text-center text-sm font-bold text-slate-950">Open order register</Link></header>
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Active orders" value={rows.length} icon={<Truck/>}/><Metric label="At risk" value={risks} icon={<AlertTriangle/>} alert={risks > 0}/><Metric label="On-time rate" value={`${rate}%`} icon={<CheckCircle2/>}/><Metric label="Measured deliveries" value={delivered.length} icon={<Clock3/>}/></section>
    {error && <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">{error.message}</div>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]"><div className="border-b border-white/10 p-4"><h2 className="font-bold">Active SLA register</h2></div>{isLoading ? <p className="p-8 text-slate-400">Synchronizing orders…</p> : <div className="divide-y divide-white/10">{rows.map(({ order, ageHours, promise, estimated, risk }) => <Link key={order.id} href={`/orders/${order.id}`} className="grid gap-3 p-4 transition hover:bg-white/[0.06] md:grid-cols-[1fr_150px_240px_130px] md:items-center"><div><p className="font-mono text-xs text-slate-400">{order.id}</p><p className="mt-1 font-semibold">{order.items?.map((item) => item.sellerName).filter(Boolean).join(', ') || 'Supplier pending'}</p></div><span className="text-sm capitalize text-slate-300">{order.status.replace(/_/g, ' ')}</span><span className="text-xs text-slate-300">Promised: {promise ? promise.toLocaleDateString() : 'Awaiting seller SLA'}<br/>Estimated: {estimated ? estimated.toLocaleDateString() : 'Not calculated'}</span><span className={`rounded-full px-3 py-1 text-center text-xs font-bold ${risk ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{risk ? `Risk · ${Math.floor(ageHours)}h` : 'On track'}</span></Link>)}</div>}{!isLoading && !rows.length && <p className="p-8 text-slate-400">No active wholesale orders.</p>}</section>
  </main></div></ProtectedRoute>;
}

function Metric({ label, value, icon, alert = false }: { label: string; value: string | number; icon: React.ReactNode; alert?: boolean }) { return <div className={`rounded-2xl border p-4 ${alert ? 'border-rose-400/30 bg-rose-500/10' : 'border-white/10 bg-white/[0.05]'}`}><span className={alert ? 'text-rose-300' : 'text-emerald-300'}>{icon}</span><p className="mt-3 text-2xl font-black">{value}</p><p className="text-xs text-slate-400">{label}</p></div>; }
