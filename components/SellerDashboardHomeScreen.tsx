'use client';

import { useAuth } from '@/lib/auth/authContext';

export default function SellerDashboardHomeScreen() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Store - Your Business Name
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your products and sales
          </p>
        </div>

        {/* Store Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Products</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">12</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Active on store</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Approval</div>
            <div className="text-3xl font-bold text-amber-600">2</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Awaiting review</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Approved Products</div>
            <div className="text-3xl font-bold text-green-600">10</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Live on marketplace</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                tab === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="space-y-3 mb-8">
          {/* Pending Product */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Product Name</h4>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-semibold">
                    🟡 Pending
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">₦500</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Last updated: 2 days ago</p>
              </div>
              <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors">
                Edit
              </button>
            </div>
          </div>

          {/* Approved Product */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Product Name</h4>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold">
                    🟢 Approved
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">₦750</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Last updated: Today</p>
              </div>
              <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Add New Product Button */}
        <button className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mb-8">
          + Add New Product
        </button>

        {/* Educational Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Why Approval Matters</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Quality assurance for buyer trust</li>
            <li>✓ Fraud prevention across the platform</li>
            <li>✓ Export compliance verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
