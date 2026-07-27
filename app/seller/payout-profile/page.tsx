'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Landmark, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { useAuth } from '@/lib/auth/authContext';
import { auth } from '@/lib/firebase/config';

interface PayoutAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  reviewStatus: 'pending_verification' | 'verified' | 'rejected';
}

interface PayoutProfile {
  accounts: PayoutAccount[];
  defaultAccountId: string;
}

export default function SellerPayoutProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PayoutProfile>({ accounts: [], defaultAccountId: '' });
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const api = useCallback(async (init?: RequestInit) => {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error('Your session expired. Please sign in again.');
    const response = await fetch('/api/seller/payout-profile', {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Your payout accounts could not be updated.');
    return result;
  }, []);

  const load = useCallback(async () => {
    try {
      const result = await api();
      setProfile(result.profile || { accounts: [], defaultAccountId: '' });
      setStatus('');
    } catch {
      setStatus('Your payout accounts could not be loaded. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function saveAccount() {
    if (!bankName.trim() || !accountName.trim() || !/^\d{10}$/.test(accountNumber)) {
      setStatus('Enter the bank, account name, and a valid 10-digit account number.');
      return;
    }
    setBusy(true); setStatus('');
    try {
      const result = await api({
        method: 'PUT',
        body: JSON.stringify({ bankName, accountName, accountNumber }),
      });
      setProfile(result.profile);
      setBankName(''); setAccountName(''); setAccountNumber('');
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'This account was not saved.');
    } finally { setBusy(false); }
  }

  async function accountAction(accountId: string, action: 'set_default' | 'remove') {
    setBusy(true); setStatus('');
    try {
      const result = await api({ method: 'PATCH', body: JSON.stringify({ accountId, action }) });
      setProfile(result.profile);
      setStatus(action === 'remove' ? 'Bank account removed.' : 'Default withdrawal account updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The account could not be updated.');
    } finally { setBusy(false); }
  }

  return (
    <ProtectedRoute currentPath="/seller/payout-profile" requiredRoles={[USER_ROLES.SELLER]}>
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <header><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Secure settlements</p><h1 className="mt-2 text-3xl font-black">Payout bank accounts</h1><p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">Save up to five accounts. Each account must be verified by an administrator before it can receive a withdrawal.</p></header>
          {status && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">{status}</p>}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-3">
              <div className="flex items-center justify-between"><h2 className="text-xl font-black">Saved accounts</h2><span className="text-sm text-slate-500">{profile.accounts.length}/5</span></div>
              {loading ? <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-900"><Loader2 className="mx-auto animate-spin"/></div> : profile.accounts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:bg-slate-900"><Landmark className="mx-auto mb-3"/>No bank account saved yet.</div> : profile.accounts.map((account) => {
                const isDefault = account.id === profile.defaultAccountId;
                return <article key={account.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${isDefault ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-white/10'}`}><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{account.accountName}</h3>{isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-800"><Star size={12}/>Default</span>}<span className={`rounded-full px-2 py-1 text-[11px] font-bold capitalize ${account.reviewStatus === 'verified' ? 'bg-blue-100 text-blue-800' : account.reviewStatus === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{account.reviewStatus.replace(/_/g, ' ')}</span></div><p className="mt-1 text-sm text-slate-500">{account.bankName} · ••••••{account.accountLast4}</p></div><div className="flex gap-2">{!isDefault && <button disabled={busy} onClick={() => void accountAction(account.id, 'set_default')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"><CheckCircle2 size={14}/>Use by default</button>}<button disabled={busy} onClick={() => void accountAction(account.id, 'remove')} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50" aria-label={`Remove ${account.bankName} account`}><Trash2 size={15}/></button></div></div></article>;
              })}
            </section>
            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-lg font-black"><Plus className="text-emerald-600"/>Add bank account</h2><div className="mt-5 space-y-4"><Field label="Bank name"><input value={bankName} onChange={(event) => setBankName(event.target.value)} autoComplete="organization" placeholder="Bank name" className="field"/></Field><Field label="Account number"><input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" maxLength={10} autoComplete="off" placeholder="10-digit NUBAN" className="field"/></Field><Field label="Account name"><input value={accountName} onChange={(event) => setAccountName(event.target.value)} autoComplete="name" placeholder="Name shown by the bank" className="field"/></Field><button onClick={() => void saveAccount()} disabled={busy || profile.accounts.length >= 5} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">{busy ? <Loader2 size={17} className="animate-spin"/> : <Plus size={17}/>}Save account</button></div></section>
          </div>
        </div>
        <style jsx>{`.field{width:100%;min-height:46px;border:1px solid rgb(203 213 225);border-radius:.75rem;background:white;padding:.65rem .8rem;color:rgb(15 23 42);outline:none}.field:focus{border-color:rgb(5 150 105);box-shadow:0 0 0 3px rgb(16 185 129/.14)}`}</style>
      </main>
    </ProtectedRoute>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span>{children}</label>;
}
