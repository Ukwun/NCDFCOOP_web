'use client';

export const dynamic = 'force-dynamic';

import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function SellerPayoutProfile() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setStatus('Saving...');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        payout: { bankName, accountNumber },
      });
      setStatus('Saved');
    } catch (err) {
      console.error(err);
      setStatus('Failed to save');
    }
  };

  return (
    <ProtectedRoute currentPath="/seller/payout-profile" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Payout Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Configure your bank details for payouts.</p>

          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm">Bank Name</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
            <label className="text-sm">Account Number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-4 py-2 rounded-lg border" />
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Save Payout Profile</button>
              <div className="text-sm text-gray-500 mt-2">{status}</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
