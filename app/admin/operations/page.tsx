'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/authContext';

const ROLES = ['support_agent', 'dispute_officer', 'finance_operator', 'risk_officer', 'admin', 'super_admin'];

export default function OperationsPage() {
  const { user } = useAuth(); const [disputes, setDisputes] = useState<any[]>([]); const [payouts, setPayouts] = useState<any[]>([]); const [error, setError] = useState(''); const [email, setEmail] = useState(''); const [staffRole, setStaffRole] = useState('support_agent');
  const call = useCallback(async (url: string, init?: RequestInit) => { const token = await auth?.currentUser?.getIdToken(); const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Operation failed'); return data; }, []);
  const load = useCallback(async () => { try { setError(''); const [d, p] = await Promise.allSettled([call('/api/disputes'), call('/api/payout-requests')]); if (d.status === 'fulfilled') setDisputes(d.value.disputes || []); if (p.status === 'fulfilled') setPayouts(p.value.requests || []); } catch (e: any) { setError(e.message); } }, [call]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [load]);
  const act = async (url: string, body: any) => { try { setError(''); await call(url, { method: 'PATCH', body: JSON.stringify(body) }); await load(); } catch (e: any) { setError(e.message); } };
  const invite = async () => { try { const result = await call('/api/admin/staff', { method: 'POST', body: JSON.stringify({ email, role: staffRole }) }); setEmail(''); setError(result.message); } catch (e: any) { setError(e.message); } };
  const isSuper = user?.roles?.includes('super_admin');
  return <ProtectedRoute currentPath="/admin/operations" requiredRoles={ROLES}>
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-8"><div className="mx-auto max-w-7xl space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Private staff workspace</p><h1 className="text-3xl font-black">Operations queues</h1><p className="text-sm text-slate-400">Refreshes every 15 seconds. Every decision is checked again by the server.</p></div>
      {error && <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">{error}</div>}
      {isSuper && <section className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-bold">Assign verified staff by email</h2><div className="mt-3 flex flex-wrap gap-2"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@company.com" className="min-w-64 rounded-lg bg-slate-900 px-3 py-2"/><select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2">{ROLES.filter((r) => r !== 'super_admin').map((r) => <option key={r}>{r}</option>)}</select><button onClick={() => void invite()} className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950">Assign role</button></div></section>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Queue title="Disputes" empty="No disputes waiting.">{disputes.map((d) => <article key={d.id} className="border-t border-white/10 p-4"><div className="flex justify-between"><b>Order {d.orderId}</b><span className="text-xs">{d.status}</span></div><p className="mt-2 text-sm text-slate-300">{d.reason}: {d.description}</p><p className="mt-1 text-xs text-amber-300">Held: ₦{Number(d.holdAmount || 0).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void act('/api/disputes', { disputeId: d.id, action: 'assign' })} className="rounded bg-sky-500 px-2 py-1 text-xs font-bold">Take case</button><button onClick={() => void act('/api/disputes', { disputeId: d.id, action: 'request_seller_response' })} className="rounded bg-amber-500 px-2 py-1 text-xs font-bold text-slate-950">Ask seller</button>{['full_refund','release_seller','replacement','escalated'].map((decision) => <button key={decision} onClick={() => void act('/api/disputes', { disputeId: d.id, action: 'resolve', decision, summary: decision })} className="rounded border border-white/20 px-2 py-1 text-xs">{decision.replace('_',' ')}</button>)}</div></article>)}</Queue>
        <Queue title="Payouts" empty="No payout requests waiting.">{payouts.map((p) => <article key={p.id} className="border-t border-white/10 p-4"><div className="flex justify-between"><b>₦{Number(p.amount || 0).toLocaleString()}</b><span className="text-xs">{p.status}</span></div><p className="text-xs text-slate-400">Seller {p.sellerId} · approvals {(p.approvalIds || []).length}/{p.requiredApprovals || 1}</p><p className="text-xs text-rose-300">{(p.exceptionFlags || []).join(', ')}</p><div className="mt-3 flex gap-2"><button onClick={() => void act('/api/payout-requests', { payoutRequestId: p.id, action: 'approve' })} className="rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-slate-950">Approve</button><button onClick={() => void act('/api/payout-requests', { payoutRequestId: p.id, action: 'reject', reason: 'Rejected by finance review' })} className="rounded bg-rose-500/30 px-2 py-1 text-xs">Reject</button></div></article>)}</Queue>
      </div>
    </div></main>
  </ProtectedRoute>;
}

function Queue({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"><h2 className="p-4 text-lg font-bold">{title}</h2>{children || <p className="p-4 text-sm text-slate-400">{empty}</p>}</section>; }
