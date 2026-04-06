'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMemberData } from '@/lib/hooks/useMemberData';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
}

export default function MemberHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: memberData, loading: memberLoading } = useMemberData(user?.uid || '');
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  // Use real data with fallbacks
  const tier = memberData?.tier.toUpperCase() || 'GOLD';
  const points = memberData?.rewardsPoints || 2450;
  const pointsToNextTier = 5000; // TODO: Calculate based on tier
  const totalSpent = memberData?.totalSpent || 125000;
  const savedThisYear = Math.round(totalSpent * (memberData?.discountPercentage || 15) / 100);
  const discountRate = memberData?.discountPercentage || 15;
  const savingsGoal = memberData?.savingsGoal || 50000;
  const currentSavings = memberData?.savingsBalance || 19000;

  const tierColor = {
    BRONZE: '#8B6914',
    SILVER: '#A9A9A9',
    GOLD: '#C9A227',
    PLATINUM: '#9D4EDD',
  }[tier] || '#C9A227';

  const tierEmoji = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
  }[tier] || '🥇';

  const progressPercent = Math.round((points / pointsToNextTier) * 100);
  const savingsPercent = Math.round((currentSavings / savingsGoal) * 100);

  const quickActions: QuickAction[] = [
    { id: 'redeem', label: 'Redeem\nRewards', icon: '🎁', route: '/my-rewards', color: 'bg-pink-100 dark:bg-pink-900' },
    { id: 'benefits', label: 'Your\nBenefits', icon: '⭐', route: '/member-benefits', color: 'bg-yellow-100 dark:bg-yellow-900' },
    { id: 'refer', label: 'Refer &\nEarn', icon: '👥', route: '/referral-program', color: 'bg-blue-100 dark:bg-blue-900' },
    { id: 'deposit', label: 'Quick\nDeposit', icon: '➕', route: '', color: 'bg-green-100 dark:bg-green-900' },
    { id: 'withdraw', label: 'Quick\nWithdraw', icon: '➖', route: '', color: 'bg-red-100 dark:bg-red-900' },
    { id: 'savings', label: 'My\nSavings', icon: '📈', route: '/member-savings', color: 'bg-purple-100 dark:bg-purple-900' },
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'deposit') {
      setShowDepositDialog(true);
    } else if (action.id === 'withdraw') {
      // Handle withdraw
      console.log('Withdraw action');
    } else {
      router.push(action.route);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Member';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-[#C9A227] text-white text-xs font-semibold rounded-full">
                ♥️ MEMBER HOME (Loyalty & Rewards)
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {firstName}! 👋
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Loyalty Card (Hero) */}
        <div
          className="rounded-lg p-6 sm:p-8 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}CC 100%)` }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Tier</p>
              <h2 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                {tierEmoji} {tier}
              </h2>
            </div>
            <div className="text-4xl opacity-80">💳</div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Available Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{points.toLocaleString()}</span>
                <span className="text-sm opacity-75">pts</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/my-rewards')}
              className="w-full bg-white text-[#C9A227] font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
            >
              🎁 Redeem Rewards
            </button>

            <div className="border-t border-white border-opacity-30 pt-4">
              <p className="text-sm opacity-90 mb-2">Next Tier at {pointsToNextTier.toLocaleString()} pts</p>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs opacity-75 mt-2">{progressPercent}% Complete</p>
            </div>
          </div>
        </div>

        {/* Savings & Impact Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2">Total Spent</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ₦{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2">Saved This Year</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">
              ₦{savedThisYear.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">({discountRate}% discount)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2">Member Since</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#C9A227]">Jan 2024</p>
            <p className="text-xs text-gray-500 mt-1">15 months</p>
          </div>
        </div>

        {/* Savings Goal */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-lg p-6 sm:p-8 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Savings Goal</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ₦{currentSavings.toLocaleString()}
            </span>
            <span className="text-gray-600 dark:text-gray-400">/ ₦{savingsGoal.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${savingsPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {savingsPercent}% Complete - {savingsGoal - currentSavings > 0 ? `₦${(savingsGoal - currentSavings).toLocaleString()} to go` : 'Goal reached! 🎉'}
          </p>
          <button
            onClick={() => setShowDepositDialog(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            💚 Deposit Money to Savings
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className={`${action.color} rounded-lg p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95`}
              >
                <span className="text-2xl sm:text-3xl">{action.icon}</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white text-center break-normal">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Voting Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🗳️ Upcoming Voting
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                3 votes open • Annual board election & budget approval
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/member-voting')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Vote Now
          </button>
        </div>

        {/* Transparency Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            📄 Cooperative Transparency
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Annual Financials 2025', icon: '📊' },
              { title: 'Impact Report Q4 2025', icon: '📈' },
              { title: 'Farmer Support Fund - ₦5.2M Donated', icon: '🌾' },
            ].map((report, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{report.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{report.title}</span>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/member-transparency')}
            className="w-full mt-4 text-center text-sm font-semibold text-[#C9A227] hover:text-[#B89015]"
          >
            View All Reports →
          </button>
        </div>

        {/* Member-Exclusive Deals */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Exclusive Member Deals
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mb-6">
            <div className="flex gap-4 pb-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex-shrink-0 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl">
                    {['🥘', '🌾', '🥛', '🍖'][item - 1]}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Product {item}</p>
                    <p className="text-xs text-green-600 font-bold mt-1">-{15 + item * 5}% off</p>
                    <p className="text-xs text-gray-500 mt-2">Only {10 - item} left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl">
                  {['🥘', '🌾', '🥛', '🍖', '🧈', '⚡', '🎁', '✨'][item - 1]}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                    Member Product {item}
                  </p>
                  <p className="text-[#C9A227] font-bold text-sm mt-2">₦{(item * 1500).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/member-products')}
            className="w-full mt-6 bg-[#C9A227] hover:bg-[#B89015] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🛒 Shop All Member Products
          </button>
        </div>
      </div>

      {/* Deposit Dialog */}
      {showDepositDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Deposit to Savings</h3>
            <input
              type="number"
              placeholder="Amount (₦)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 mb-4"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your savings are secure and earn dividend interest.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDepositDialog(false);
                  // Handle deposit
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
