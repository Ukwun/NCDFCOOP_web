'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth/authContext';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';

export default function WholesaleSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ orderUpdates: true, priceAlerts: true, complianceAlerts: true, weeklyDigest: false });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !db) return;
    getDoc(doc(db, COLLECTIONS.USERS, user.uid, 'preferences', 'wholesale'))
      .then((snapshot) => { if (snapshot.exists()) setSettings((current) => ({ ...current, ...snapshot.data() })); })
      .catch(() => setStatus('Preferences could not be loaded.'))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const save = async () => {
    if (!user?.uid || !db) return;
    try {
      setStatus('Saving…');
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid, 'preferences', 'wholesale'), { ...settings, updatedAt: Timestamp.now() }, { merge: true });
      setStatus('Procurement preferences saved.');
    } catch { setStatus('Unable to save preferences. Please try again.'); }
  };

  return (
    <ProtectedRoute currentPath="/wholesale/settings" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Wholesale workspace</p><h1 className="mt-1 text-2xl font-bold">Procurement preferences</h1><p className="mt-2 text-sm text-slate-500">Choose which live operational signals your team receives.</p></div>
          <div className="space-y-3 p-6">
            {[
              ['orderUpdates', 'Order and delivery updates', 'Status changes, dispatches, and delivery events.'],
              ['priceAlerts', 'Wholesale price alerts', 'Material price movements on products you follow.'],
              ['complianceAlerts', 'Compliance exceptions', 'Supplier or fulfillment risks requiring attention.'],
              ['weeklyDigest', 'Weekly procurement digest', 'A weekly summary of spend, orders, and savings.'],
            ].map(([key, title, description]) => <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"><span><span className="block font-semibold">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><input type="checkbox" checked={settings[key as keyof typeof settings]} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-5 w-5 accent-emerald-700" /></label>)}
            <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between"><p aria-live="polite" className="text-sm text-slate-500">{loading ? 'Loading preferences…' : status}</p><button onClick={() => void save()} disabled={loading} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">Save preferences</button></div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
