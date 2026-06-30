'use client';

import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Landmark, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';

export default function WholesalePortfolioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useRealTimeOrders(user?.uid);
  const [credit, setCredit] = useState({ limit: 0, used: 0, balance: 0 });
  useEffect(() => { if (!user?.uid || !db) return; getDoc(doc(db, COLLECTIONS.USERS, user.uid)).then((snapshot) => { const data = snapshot.data() || {}; setCredit({ limit: Number(data.wholesaleCreditLimit || 0), used: Number(data.wholesaleCreditUsed || 0), balance: Number(data.accountBalance || 0) }); }).catch(() => undefined); }, [user?.uid]);
  const wholesale = orders.filter((order) => order.buyerType === 'wholesale');
  const pipeline = wholesale.filter((order) => !['delivered', 'cancelled'].includes(order.status)).reduce((sum, order) => sum + order.totalAmount, 0);
  const deployed = wholesale.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.totalAmount, 0);
  const savings = wholesale.reduce((sum, order) => sum + (order.prepaymentDiscount || 0), 0);
  const supplierCount = useMemo(() => new Set(wholesale.flatMap((order) => order.items || []).map((item) => item.sellerId).filter(Boolean)).size, [wholesale]);
  const available = Math.max(0, credit.limit - credit.used);
  const forecastUtilization = credit.limit ? Math.min(100, Math.round((credit.used + pipeline) / credit.limit * 100)) : 0;

  return <ProtectedRoute currentPath="/wholesale/portfolio" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}><div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6"><main className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Live capital position</p><h1 className="mt-2 text-3xl font-black">Wholesale Portfolio & Credit</h1><p className="mt-2 max-w-2xl text-sm text-emerald-100">Real order exposure, prepayment savings, available institutional credit, and pipeline utilization.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => router.push('/wholesale/products')} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-900">Source inventory</button><button onClick={() => router.push('/wholesale/orders')} className="rounded-xl bg-emerald-950/40 px-4 py-2 text-sm font-bold">Open orders</button></div></section>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Card label="Deployed capital" value={`₦${deployed.toLocaleString()}`} icon={<Landmark/>}/><Card label="Pipeline exposure" value={`₦${pipeline.toLocaleString()}`} icon={<TrendingUp/>}/><Card label="Prepayment savings" value={`₦${savings.toLocaleString()}`} icon={<Banknote/>}/><Card label="Active suppliers" value={supplierCount.toString()} icon={<CreditCard/>}/></section>
    <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Institutional credit facility</p><h2 className="text-2xl font-black">₦{available.toLocaleString()} available</h2></div><CreditCard className="text-emerald-700" size={30}/></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700" style={{ width: `${credit.limit ? Math.min(100, credit.used / credit.limit * 100) : 0}%` }}/></div><div className="mt-3 grid grid-cols-3 gap-3 text-sm"><div><p className="text-xs text-slate-500">Limit</p><p className="font-bold">₦{credit.limit.toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Used</p><p className="font-bold">₦{credit.used.toLocaleString()}</p></div><div><p className="text-xs text-slate-500">Cash balance</p><p className="font-bold">₦{credit.balance.toLocaleString()}</p></div></div>{credit.limit === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No credit facility has been approved for this account. Contact operations for underwriting.</p>}</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Pipeline credit forecast</p><p className="mt-1 text-4xl font-black text-emerald-800">{forecastUtilization}%</p><p className="mt-2 text-sm text-slate-600">Projected utilization if all active procurement orders settle against credit.</p><div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Prepay instead:</strong> choose institutional prepayment during checkout for a server-verified 10% subtotal discount.</div></div></section>
  </main></div></ProtectedRoute>;
}

function Card({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><span className="text-emerald-700">{icon}</span><p className="mt-4 truncate text-xl font-black">{value}</p><p className="text-xs text-slate-500">{label}</p></div>; }
