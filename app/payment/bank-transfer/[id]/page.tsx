'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Copy, UploadCloud } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { BankTransferPayment, getBankTransferStatus, uploadBankTransferProof } from '@/lib/services/bankTransferService';

export default function BankTransferPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter(); const { user, loading: authLoading } = useAuth();
  const [payment, setPayment] = useState<BankTransferPayment | null>(null); const [loading, setLoading] = useState(true); const [notice, setNotice] = useState(''); const [uploading, setUploading] = useState(false);
  const load = async () => { const result = await getBankTransferStatus(id); setPayment(result); setLoading(false); };
  useEffect(() => { if (!authLoading && !user) router.push(`/signin?next=/payment/bank-transfer/${id}`); else if (user) void load(); }, [user, authLoading, id, router]);
  const upload = async (file?: File) => { if (!file || !payment) return; setUploading(true); const result = await uploadBankTransferProof(payment.id, file); setNotice(result.message); if (result.success) await load(); setUploading(false); };
  if (authLoading || loading) return <div className="min-h-screen bg-slate-100 p-12 text-center text-slate-500">Loading secure transfer instructions…</div>;
  if (!payment) return <div className="min-h-screen bg-slate-100 p-12 text-center"><p>Bank transfer record not found.</p><button onClick={() => router.push('/orders')} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-white">View orders</button></div>;
  return <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900"><main className="mx-auto max-w-2xl space-y-5"><header className="rounded-3xl bg-gradient-to-br from-slate-950 to-emerald-800 p-7 text-white"><Building2 className="text-emerald-300"/><h1 className="mt-4 text-3xl font-black">Complete bank transfer</h1><p className="mt-2 text-sm text-emerald-100">Order {id} · Amount ₦{Number(payment.amount || 0).toLocaleString()}</p></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Transfer destination</p><h2 className="mt-2 text-xl font-bold">{payment.accountName}</h2><p className="mt-1 text-slate-600">{payment.bankName}</p><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 p-4"><span className="font-mono text-2xl font-black tracking-wider">{payment.accountNumber}</span><button onClick={() => { void navigator.clipboard.writeText(payment.accountNumber); setNotice('Account number copied.'); }} aria-label="Copy account number" className="rounded-lg bg-white p-2"><Copy size={18}/></button></div><p className="mt-3 text-xs text-slate-500">Use the order ID as your transfer narration. Proof is reviewed within 24–48 hours.</p></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="font-bold">Payment proof</p><p className="text-sm capitalize text-slate-500">Status: {payment.status.replace(/_/g, ' ')}</p></div>{payment.status === 'proof_uploaded' || payment.status === 'verified' ? <CheckCircle2 className="text-emerald-600"/> : <UploadCloud className="text-slate-400"/>}</div>{payment.status !== 'verified' && <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])}/>{uploading ? 'Uploading securely…' : payment.status === 'proof_uploaded' ? 'Replace proof' : 'Upload transfer proof'}</label>}{notice && <p aria-live="polite" className="mt-3 text-sm text-slate-600">{notice}</p>}</section>
    <button onClick={() => router.push(`/orders/${id}`)} className="w-full rounded-xl bg-emerald-700 py-3 font-bold text-white">Track order</button>
  </main></div>;
}
