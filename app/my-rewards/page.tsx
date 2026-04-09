'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { useState } from 'react';

export default function MyRewardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData, loading } = useMemberData(user?.uid || '');
  const [redeemAmount, setRedeemAmount] = useState(0);

  const points = memberData?.rewardsPoints || 0;
  const redeemablePoints = Math.floor(points / 100) * 100; // Redeem in increments of 100
  const estimatedValue = (redeemablePoints / 100) * 500; // 100 points = ₦500

  const handleRedeem = () => {
    if (redeemAmount < 100 || redeemAmount > points) {
      alert('Invalid amount. Please redeem in increments of 100 points.');
      return;
    }
    // TODO: Call backend to process redemption
    alert(`Redeemed ${redeemAmount} points for ₦${(redeemAmount / 100) * 500}`);
    setRedeemAmount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-[#C9A227]"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              🎁 My Rewards
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Redeem your loyalty points</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Points Summary */}
        <div className="bg-gradient-to-br from-[#C9A227] to-[#B89015] rounded-lg p-6 sm:p-8 text-white shadow-lg">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-2">Available Points</p>
              <p className="text-4xl font-bold">{points.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-2">Estimated Value</p>
              <p className="text-4xl font-bold">₦{estimatedValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Redemption Options */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">How to Redeem</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💰</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Instant Cash Back
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    100 points = ₦500 (5% value)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      max={points}
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(Number(e.target.value))}
                      placeholder="Enter points (min 100)"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleRedeem}
                      disabled={redeemAmount < 100 || redeemAmount > points}
                      className="px-6 py-2 bg-[#C9A227] hover:bg-[#B89015] disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🛍️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Shop Rewards
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Use points on exclusive member-only products
                  </p>
                  <button
                    onClick={() => router.push('/member-products')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Browse Products →
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎟️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Loyalty Vouchers
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Convert points to exclusive discount vouchers (250+ points)
                  </p>
                  <button
                    disabled={points < 250}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 disabled:opacity-50 text-gray-900 dark:text-white font-semibold rounded-lg text-sm"
                  >
                    Convert to Voucher
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redemption History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Redemptions</h2>
          <div className="space-y-3">
            {[
              { date: 'Apr 2, 2026', points: 500, value: 2500, type: 'Instant Cash Back' },
              { date: 'Mar 28, 2026', points: 250, value: 1250, type: 'Loyalty Voucher' },
              { date: 'Mar 20, 2026', points: 1000, value: 5000, type: 'Instant Cash Back' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.type}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    -{item.points} pts
                  </p>
                  <p className="text-sm text-green-600">+₦{item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
