'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { getMemberData, recordTransaction } from '@/lib/services/memberService';
import { validateTransactionAmount } from '@/lib/validation/inputValidation';
import { initatePaystackPayment } from '@/lib/services/paymentService';
import { trackActivity } from '@/lib/analytics/activityTracker';

export default function HomeScreen() {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch member data
  useEffect(() => {
    if (!user) return;

    const fetchMemberData = async () => {
      try {
        const data = await getMemberData(user.uid);
        setMemberData(data);
        await trackActivity('page_view', { page: 'home' }, user.uid);
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user]);

  const handleDeposit = async () => {
    setError('');

    // Validate amount
    const validation = validateTransactionAmount(depositAmount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    setProcessing(true);

    try {
      const amount = parseFloat(depositAmount);

      // Initialize payment with Paystack
      await initatePaystackPayment(
        amount,
        user!.email || 'member@ncdfcoop.com',
        user!.uid,
        user!.displayName || 'Member',
        async (reference) => {
          // Payment successful
          alert(`✅ Deposit of ₦${amount.toLocaleString()} successful! Reference: ${reference}`);
          setDepositAmount('');
          setShowDepositDialog(false);

          // Refresh member data
          const updatedData = await getMemberData(user!.uid);
          setMemberData(updatedData);

          await trackActivity('deposit_completed', { amount, reference }, user!.uid);
        },
        (errorMessage) => {
          setError(errorMessage);
          setProcessing(false);
          trackActivity('deposit_failed', { amount, error: errorMessage }, user!.uid);
        }
      );
    } catch (err: any) {
      setError(err.message || 'Deposit process failed');
      setProcessing(false);
      await trackActivity('deposit_error', { error: err.message }, user?.uid);
    }
  };

  const handleWithdrawal = async () => {
    setError('');

    // Validate amount
    const validation = validateTransactionAmount(withdrawAmount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    // Check if user has sufficient balance
    if (memberData && memberData.savingsBalance < amount) {
      setError(`Insufficient balance. Available: ₦${memberData.savingsBalance.toLocaleString()}`);
      return;
    }

    setProcessing(true);

    try {
      // Record withdrawal transaction
      const transactionId = await recordTransaction(
        user!.uid,
        'withdrawal',
        amount,
        'completed',
        'Member withdrawal request'
      );

      alert(`✅ Withdrawal request submitted! Reference: ${transactionId}\nAmount: ₦${amount.toLocaleString()}\nYour account will be processed within 1-2 business days.`);
      setWithdrawAmount('');
      setShowWithdrawalDialog(false);

      // Refresh member data
      const updatedData = await getMemberData(user!.uid);
      setMemberData(updatedData);

      await trackActivity('withdrawal_completed', { amount, transactionId }, user!.uid);
    } catch (err: any) {
      setError(err.message || 'Withdrawal process failed');
      await trackActivity('withdrawal_failed', { amount, error: err.message }, user?.uid);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading member data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.displayName || 'Member'} 🎉
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your savings and membership benefits</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Savings Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6 shadow-lg">
        <p className="text-blue-100 mb-2">Total Savings</p>
        <h2 className="text-4xl font-bold mb-4">₦{memberData?.savingsBalance?.toLocaleString() || '0'}</h2>
        <div className="flex justify-between text-blue-100 text-sm">
          <span>Member Tier: <strong>{memberData?.tier?.toUpperCase() || 'BRONZE'}</strong></span>
          <span>Loyalty Points: <strong>{memberData?.loyaltyPoints || 0}</strong></span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Deposit */}
        <button
          onClick={() => {
            setError('');
            setShowDepositDialog(true);
          }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
        >
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold text-gray-900 dark:text-white">Quick Deposit</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Add funds to your savings</p>
        </button>

        {/* Withdrawal */}
        <button
          onClick={() => {
            setError('');
            setShowWithdrawalDialog(true);
          }}
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
        >
          <div className="text-3xl mb-2">🏦</div>
          <h3 className="font-bold text-gray-900 dark:text-white">Withdraw</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Request withdrawal to account</p>
        </button>
      </div>

      {/* Member Benefits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏅 {memberData?.tier?.toUpperCase() || 'BRONZE'} Member Benefits</h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Access to member-exclusive deals</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Earn loyalty points on every purchase</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Free shipping on orders over ₦5,000</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Priority customer support</span>
          </li>
        </ul>
      </div>

      {/* Deposit Dialog */}
      {showDepositDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Deposit</h2>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter amount (min: ₦100)"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">This will redirect to Paystack for payment</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositDialog(false)}
                disabled={processing}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={processing}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Dialog */}
      {showWithdrawalDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Request Withdrawal</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Available balance: ₦{memberData?.savingsBalance?.toLocaleString() || '0'}
            </p>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter amount to withdraw"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawalDialog(false)}
                disabled={processing}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={processing}
                className="flex-1 bg-orange-600 text-white rounded-lg py-2 font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
