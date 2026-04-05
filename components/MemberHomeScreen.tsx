'use client';

import { useAuth } from '@/lib/auth/authContext';

export default function MemberHomeScreen() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.displayName || 'Member'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready to find amazing deals and earn rewards?
          </p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Loyalty Points</div>
            <div className="text-3xl font-bold text-[#C9A227]">1,250</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Keep shopping to earn more</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Savings</div>
            <div className="text-3xl font-bold text-green-600">₦2,500</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">This month</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Member Since</div>
            <div className="text-3xl font-bold text-blue-600">Jan 2024</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Enjoying benefits</div>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="bg-gradient-to-r from-[#C9A227] to-[#B89015] rounded-lg p-6 mb-8 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Unlock More Savings</h3>
              <p className="text-sm opacity-90">Upgrade to Premium for 10% discount on all purchases</p>
            </div>
            <button className="px-6 py-2 bg-white text-[#C9A227] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Product Name</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">₦500</p>
                  <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member-Only Deals Banner */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Member-Only Deals</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Exclusive discounts available only to our members. Check back daily for new deals!
          </p>
        </div>
      </div>
    </div>
  );
}
