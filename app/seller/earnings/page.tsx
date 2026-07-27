'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { orderService } from '@/lib/services/api/orderService';
import { auth } from '@/lib/firebase/config';

function formatCurrency(value: number) {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function SellerEarningsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutStatus, setPayoutStatus] = useState<'missing' | 'pending_verification' | 'verified'>('missing');
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    async function loadStats() {
      setLoading(true);
      setError(null);
      try {
        const sellerStats = await orderService.getSellerOrderStats(user.uid);
        setStats({
          ...sellerStats,
          averageOrderValue:
            sellerStats.totalOrders > 0
              ? Math.round((sellerStats.totalRevenue / sellerStats.totalOrders) * 100) / 100
              : 0,
        });
      } catch (err) {
        console.error('Failed to load seller earnings:', err);
        setError('Failed to load earnings data. Please refresh or try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    auth?.currentUser?.getIdToken().then((token) =>
      fetch('/api/seller/payout-profile', { headers: { Authorization: `Bearer ${token}` } })
    ).then((response) => response.ok ? response.json() : null)
      .then((result) => setPayoutStatus(result?.profile?.reviewStatus || 'missing'))
      .catch(() => setPayoutStatus('missing'));
  }, [user?.uid, refreshKey]);

  const pendingPayouts = stats ? Math.max(stats.totalRevenue - stats.paidRevenue, 0) : 0;
  const requestPayout = async () => {
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount < 1000) {
      setPayoutMessage('Enter an amount of at least ₦1,000.');
      return;
    }
    setPayoutBusy(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const response = await fetch('/api/payout-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount }) });
      await response.json();
      if (!response.ok) {
        setPayoutMessage(response.status === 409 ? 'This amount is not currently available for payout.' : response.status === 400 ? 'Check the amount and try again.' : 'Your payout request could not be submitted right now.');
        return;
      }
      setPayoutMessage('Payout request submitted for finance review.');
      setPayoutAmount('');
    } catch {
      setPayoutMessage('Your payout request could not be submitted right now.');
    } finally { setPayoutBusy(false); }
  };

  return (
    <ProtectedRoute currentPath="/seller/earnings" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Earnings Console</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
              Monitor revenue flow, payout status, and order health with live seller analytics.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/seller/orders')}
                className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-semibold"
              >
                Open Order Revenue
              </button>
              <button
                onClick={() => router.push('/seller/products')}
                className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold"
              >
                Optimize Product Margins
              </button>
              <button
                onClick={() => router.push('/seller/payout-profile')}
                className="px-4 py-2 rounded-lg bg-[#EAF6EF] dark:bg-gray-700 text-[#0B6B3A] dark:text-[#7FD4A9] text-sm font-semibold"
              >
                Payout Profile Settings
              </button>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading earnings data...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900 p-6">
              <p className="text-sm text-red-700 dark:text-red-200">Earnings are temporarily unavailable. Your account data has not been changed.</p>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Retry earnings sync
              </button>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Gross Sales</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.totalRevenue) : '₦0'}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Net Earnings</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.paidRevenue) : '₦0'}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending Payouts</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {formatCurrency(pendingPayouts)}
                </p>
              </article>
              <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Average Order Value</p>
                <p className="text-2xl font-bold text-[#0B6B3A] dark:text-[#7FD4A9] mt-1">
                  {stats ? formatCurrency(stats.averageOrderValue) : '₦0'}
                </p>
              </article>
            </section>
          )}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"><h2 className="font-bold text-gray-900 dark:text-white">Request a payout</h2><p className="mt-1 text-sm text-gray-500">Only your available delivered-order balance can be requested.</p>{payoutStatus !== 'verified' ? <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">{payoutStatus === 'missing' ? 'Add a payout bank account first.' : 'Your payout account is awaiting verification.'}</p><button onClick={() => router.push('/seller/payout-profile')} className="mt-2 font-bold underline">Open bank account settings</button></div> : <div className="mt-3 flex flex-wrap gap-2"><input aria-label="Payout amount in naira" type="number" min="1000" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount in NGN" className="min-h-11 rounded-lg border bg-white px-3 py-2 text-slate-950 dark:bg-white dark:text-slate-950"/><button disabled={payoutBusy} onClick={() => void requestPayout()} className="rounded-lg bg-[#0B6B3A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{payoutBusy ? 'Submitting…' : 'Submit payout request'}</button></div>}{payoutMessage && <p aria-live="polite" className="mt-2 text-sm text-gray-600 dark:text-gray-300">{payoutMessage}</p>}</section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
