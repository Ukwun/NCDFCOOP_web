'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Timestamp, collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { useMemberData } from '@/lib/hooks/useMemberData';
import ProductCard from './ProductCard';
// Use real images from public/images for mock data
const MEMBER_PRODUCT_IMAGES = [
  '/images/Crayfish 1.png',
  '/images/Beef1.png',
  '/images/egusiseeds1.png',
  '/images/6in1spices1.png',
  '/images/Bag of garri1.png',
  '/images/Buck wheat1.png',
  '/images/Family pack1.png',
  '/images/essential basket1.png',
];
  // Member-exclusive products (mock)
  const memberProducts = [
    // ...existing code for products...
  ];

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
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Use real data with fallbacks
  const tier = memberData?.tier.toUpperCase() || 'GOLD';
  const points = memberData?.rewardsPoints || 2450;
  const pointsToNextTier = 5000; // TODO: Calculate based on tier
  const totalSpent = memberData?.totalSpent || 125000;
  const savedThisYear = Math.round(totalSpent * (memberData?.discountPercentage || 15) / 100);
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900 dark:to-gray-900">
      {/* MEMBER HEADER */}
      <div className="bg-[#C9A227] text-white border-b border-yellow-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <img src="/images/logo/NCDFCOOPLOGO.png" alt="NCDFCOOP Logo" className="h-10 w-auto" />
            <span className="text-lg sm:text-2xl font-bold tracking-wide">MEMBER HOME & REWARDS</span>
          </div>
          <div className="text-sm sm:text-base font-semibold opacity-80">Loyalty • Savings • Exclusive Deals</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loyalty Card & Stats */}
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#B89015] dark:text-yellow-200 mb-2">Welcome, {user?.displayName?.split(' ')[0] || 'Member'}!</h2>
            <p className="text-gray-700 dark:text-yellow-100 mb-2">Your loyalty tier: <span className="font-bold">{tier}</span></p>
            <ul className="list-disc ml-6 text-yellow-900 dark:text-yellow-100 text-sm mb-2">
              <li>Exclusive member pricing on all products</li>
              <li>Earn rewards points on every purchase</li>
              <li>Special deals and savings just for you</li>
            </ul>
            <button
              onClick={() => router.push('/my-rewards')}
              className="mt-2 px-6 py-2 bg-[#C9A227] text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
            >View Your Rewards →</button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">💎</span>
            <span className="text-yellow-900 dark:text-yellow-100 font-bold">Member Account</span>
          </div>
        </div>

        {/* Member Product Grid */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#B89015] dark:text-yellow-200 mb-4">Member-Exclusive Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memberProducts.map((product) => (
              <div key={product.id} style={{ minWidth: 240, maxWidth: 280, margin: '0 auto' }}>
                <ProductCard
                  product={{
                    ...product,
                    price: product.memberPrice || product.price,
                    memberOnly: true,
                  }}
                  onAddToCart={async (prod, quantity) => {
                    if (!user) {
                      alert('Please sign in to add items to your cart.');
                      return;
                    }
                    try {
                      await addToCart(
                        user.uid,
                        prod.id,
                        prod.name,
                        prod.price,
                        prod.thumbnail || prod.images?.[0] || '',
                        quantity
                      );
                      alert('Added to cart!');
                    } catch (err) {
                      alert('Failed to add to cart.');
                    }
                  }}
                  onViewDetails={() => router.push(`/products/${product.id}`)}
                />
                <div className="mt-2 text-xs text-yellow-800 dark:text-yellow-200 font-semibold">Member Price: ₦{product.memberPrice || product.price} • Save {product.discount || 0}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Benefits CTA */}
        <div className="bg-gradient-to-r from-[#C9A227] to-[#B89015] rounded-lg p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">⭐ Member Benefits</h3>
              <p className="text-sm sm:text-base opacity-90">
                Enjoy exclusive deals, rewards, and transparency as a valued member.
              </p>
            </div>
            <button
              onClick={() => router.push('/member-benefits')}
              className="px-6 py-2 bg-white text-[#C9A227] font-semibold rounded-lg hover:bg-yellow-100 transition-colors whitespace-nowrap"
            >View All Benefits</button>
          </div>
        </div>
      </div>
    </div>
  );

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
            <div className="flex gap-6 pb-2">
              {memberProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex-shrink-0" style={{ minWidth: 240, maxWidth: 280 }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Member Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memberProducts.map((product) => (
              <div key={product.id} style={{ minWidth: 240, maxWidth: 280, margin: '0 auto' }}>
                <ProductCard product={product} />
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
