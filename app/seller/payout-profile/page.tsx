'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { useAuth } from '@/lib/auth/authContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function maskAccountNumber(accountNumber: string) {
  return accountNumber.replace(/\d(?=\d{4})/g, '*');
}

export default function SellerPayoutProfile() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [status, setStatus] = useState('');
  const [savedPayout, setSavedPayout] = useState<{ bankName: string; accountNumber: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadSavedBankDetails() {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data() as Record<string, any>;
        const payout = userData.payout || userData.bankAccount || {};

        if (payout.bankName || payout.accountNumber) {
          setBankName(payout.bankName || '');
          setAccountNumber(payout.accountNumber || '');
          if (payout.bankName && payout.accountNumber) {
            setSavedPayout({ bankName: payout.bankName, accountNumber: payout.accountNumber });
          }
        }
      } catch (err) {
        console.error('Failed to load payout profile:', err);
      }
    }

    loadSavedBankDetails();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!bankName.trim() || !accountNumber.trim()) {
      setStatus('Please enter both bank name and account number.');
      return;
    }

    setStatus('Saving...');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        payout: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
        },
      });
      setSavedPayout({ bankName: bankName.trim(), accountNumber: accountNumber.trim() });
      setStatus('Payout profile saved successfully.');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save payout profile. Please try again.');
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
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{savedPayout.bankName}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {maskAccountNumber(savedPayout.accountNumber)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm">Bank Name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700"
              placeholder="First Bank Nigeria"
            />

            <label className="text-sm">Account Number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700"
              placeholder="3136996240"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Save Payout Profile
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-300">{status}</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
