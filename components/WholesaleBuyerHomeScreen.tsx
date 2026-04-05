'use client';

import { useAuth } from '@/lib/auth/authContext';

export default function WholesaleBuyerHomeScreen() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Business Dashboard 🏢
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wholesale account and bulk orders
          </p>
        </div>

        {/* Account Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                B2B Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className="font-semibold text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Credit Limit</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₦100,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₦45,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Available</span>
                  <span className="font-semibold text-green-600">₦54,800</span>
                </div>
              </div>
            </div>

            {/* Billing Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Terms
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Account Manager</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Invoice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Billing Date</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Apr 15, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Recent Orders</p>
          </button>
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Bulk Pricing</p>
          </button>
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Delivery Locations</p>
          </button>
          <button className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-2xl mb-2">📄</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoices</p>
          </button>
        </div>

        {/* Categories Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bulk Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-2xl mb-3">📦</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Category {item}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Bulk pricing available</p>
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors">
                  Browse
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
