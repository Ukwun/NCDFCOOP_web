'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { useAuth } from '@/lib/auth/authContext';
import { auth } from '@/lib/firebase/config';

export default function SellerPayoutProfile() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPayout, setSavedPayout] = useState<{ bankName: string; accountName: string; accountLast4: string; reviewStatus: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadSavedBankDetails() {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) return;
        const response = await fetch('/api/seller/payout-profile', { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load payout profile');
        if (result.profile) {
          setSavedPayout(result.profile);
          setBankName(result.profile.bankName || '');
          setAccountName(result.profile.accountName || '');
        }
      } catch (err) {
        console.error('Failed to load payout profile:', err);
        setStatus('Your saved bank details could not be loaded. Please retry.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedBankDetails();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!bankName.trim() || !accountName.trim() || !/^\d{10}$/.test(accountNumber.replace(/\s/g, ''))) {
      setStatus('Enter the bank, account name, and a valid 10-digit account number.');
      return;
    }

    setStatus('Saving...');
    setIsSaving(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('Your session expired. Please sign in again.');
      const response = await fetch('/api/seller/payout-profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankName, accountName, accountNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save payout profile');
      setSavedPayout(result.profile);
      setAccountNumber('');
      setStatus(result.message);
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : 'Your payout details were not saved yet. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute currentPath="/seller/payout-profile" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Payout Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Configure your bank details for seller payouts.</p>

          {savedPayout && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-950 p-4">
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">Saved payout account</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{savedPayout.accountName} · {savedPayout.bankName}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ••••••{savedPayout.accountLast4} · {savedPayout.reviewStatus.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm">Bank Name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              autoComplete="organization"
              className="w-full px-4 py-3 rounded-lg border bg-white text-slate-950 placeholder:text-slate-400 dark:bg-white dark:text-slate-950"
              placeholder="First Bank Nigeria"
            />

            <label className="text-sm">Account Number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border bg-white text-slate-950 placeholder:text-slate-400 dark:bg-white dark:text-slate-950"
              placeholder="3136996240"
            />

            <label className="text-sm">Account Name</label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoComplete="name"
              className="w-full px-4 py-3 rounded-lg border bg-white text-slate-950 placeholder:text-slate-400 dark:bg-white dark:text-slate-950"
              placeholder="Name exactly as shown by your bank"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isSaving ? 'Saving securely…' : 'Save Payout Profile'}
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-300">{status}</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
