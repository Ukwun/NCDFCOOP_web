'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Loader2, Vote } from 'lucide-react';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';

interface GovernanceMotion {
  id: string;
  title: string;
  description: string;
  category?: string;
  deadline?: any;
  options: Array<{ id: string; label: string }>;
  status: 'draft' | 'active' | 'closed';
  resultPublished?: boolean;
  resultCounts?: Record<string, number>;
}

export default function MemberVotingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [motions, setMotions] = useState<GovernanceMotion[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyMotion, setBusyMotion] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!db || !user?.uid) return;
    let motionsReady = false;
    let votesReady = false;
    const finish = () => { if (motionsReady && votesReady) setLoading(false); };
    const activeMotions = query(collection(db, COLLECTIONS.GOVERNANCE_MOTIONS), where('status', '==', 'active'));
    const ownVotes = query(collection(db, COLLECTIONS.MEMBER_VOTES), where('userId', '==', user.uid));
    const stopMotions = onSnapshot(activeMotions, (snapshot) => {
      setMotions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as GovernanceMotion)));
      motionsReady = true; finish();
    }, () => { setNotice('Governance motions could not be synchronized.'); setLoading(false); });
    const stopVotes = onSnapshot(ownVotes, (snapshot) => {
      const next: Record<string, string> = {};
      snapshot.docs.forEach((item) => { const data = item.data(); next[String(data.motionId)] = String(data.optionId); });
      setUserVotes(next); votesReady = true; finish();
    }, () => { setNotice('Your voting record could not be synchronized.'); setLoading(false); });
    return () => { stopMotions(); stopVotes(); };
  }, [user?.uid]);

  const sortedMotions = useMemo(() => [...motions].sort((a, b) => {
    const millis = (value: any) => value?.toMillis?.() || value?.getTime?.() || Number.MAX_SAFE_INTEGER;
    return millis(a.deadline) - millis(b.deadline);
  }), [motions]);

  const castVote = async (motion: GovernanceMotion, optionId: string) => {
    if (!db || !user?.uid || busyMotion) return;
    const deadline = motion.deadline?.toDate?.() || (motion.deadline ? new Date(motion.deadline) : null);
    if (deadline && deadline.getTime() <= Date.now()) { setNotice('Voting for this motion has closed.'); return; }
    try {
      setBusyMotion(motion.id); setNotice('');
      await setDoc(doc(db, COLLECTIONS.MEMBER_VOTES, `${motion.id}_${user.uid}`), {
        motionId: motion.id,
        userId: user.uid,
        optionId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setNotice('Your vote was recorded securely. You may change it until the deadline.');
    } catch (error) {
      console.error('Vote submission failed:', error);
      setNotice('Your vote could not be recorded. Refresh your session and try again.');
    } finally { setBusyMotion(''); }
  };

  return (
    <ProtectedRoute currentPath="/member-voting" requiredRoles={[USER_ROLES.MEMBER]}>
      <main className="min-h-screen bg-slate-50 pb-16 dark:bg-slate-950">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
            <button onClick={() => router.back()} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 transition hover:-translate-x-0.5 hover:bg-slate-50 dark:border-slate-700"><ArrowLeft size={19}/></button>
            <div><h1 className="text-2xl font-black text-slate-950 dark:text-white">Member governance</h1><p className="text-sm text-slate-500">One authenticated member, one recorded choice per motion</p></div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
          {notice && <div aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">{notice}</div>}
          {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-10 text-slate-500 dark:bg-slate-900"><Loader2 className="animate-spin" size={18}/> Loading live motions…</div> : null}
          {!loading && sortedMotions.length === 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"><Vote className="mx-auto text-blue-700" size={32}/><h2 className="mt-4 text-xl font-bold">No active motions</h2><p className="mt-2 text-sm text-slate-500">New cooperative decisions will appear here when administrators formally open voting.</p></section>
          ) : sortedMotions.map((motion) => {
            const selected = userVotes[motion.id];
            const deadline = motion.deadline?.toDate?.() || (motion.deadline ? new Date(motion.deadline) : null);
            return <article key={motion.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{motion.category || 'Governance'}</p><h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{motion.title}</h2></div>{deadline && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Closes {deadline.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{motion.description}</p>
              <div className="mt-6 grid gap-3">{(motion.options || []).map((option) => <button key={option.id} disabled={busyMotion === motion.id} onClick={() => void castVote(motion, option.id)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${selected === option.id ? 'border-blue-600 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-100' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'}`}><span className="font-semibold">{option.label}</span>{selected === option.id && <CheckCircle2 className="text-blue-700" size={19}/>}</button>)}</div>
              {motion.resultPublished && <p className="mt-4 text-xs text-slate-500">Certified results are published after voting closes.</p>}
            </article>;
          })}
        </div>
      </main>
    </ProtectedRoute>
  );
}
