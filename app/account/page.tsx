'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AccountPage() {
  const { user, currentRole, logout } = useAuth();
  const router = require('next/navigation').useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute currentPath="/account">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Display Name</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.displayName || 'User'}
                  </p>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-lg text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Role</p>
                  <p className="text-lg font-semibold text-blue-600 capitalize">
                    {currentRole || 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* User ID */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-6">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">User ID</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{user?.uid}</p>
            </div>

            {/* Email Verification Status */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Email Verification</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${user?.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}>
                  {user?.emailVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>

            {/* Account Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
              <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                ✏️ Edit Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                🔐 Change Password
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                🔔 Notifications
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Role-Specific Info */}
          {currentRole === USER_ROLES.MEMBER && (
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                Member Benefits
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li>✓ Access to member-only deals and discounts</li>
                <li>✓ Earn loyalty points on every purchase</li>
                <li>✓ Priority customer support</li>
                <li>✓ Monthly exclusive offers</li>
                <li>✓ Free shipping on orders over ₦5,000</li>
              </ul>
            </div>
          )}

          {currentRole === USER_ROLES.SELLER && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                Seller Benefits
              </h3>
              <ul className="space-y-2 text-green-800 dark:text-green-200">
                <li>✓ Unlimited product listings</li>
                <li>✓ Real-time sales analytics</li>
                <li>✓ Marketing tools and insights</li>
                <li>✓ Dedicated seller support</li>
                <li>✓ Fast checkout for your customers</li>
              </ul>
            </div>
          )}

          {currentRole === USER_ROLES.INSTITUTIONAL_BUYER && (
            <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">
                Wholesale Buyer Benefits  
              </h3>
              <ul className="space-y-2 text-purple-800 dark:text-purple-200">
                <li>✓ Bulk pricing on all products</li>
                <li>✓ Volume discounts up to 40%</li>
                <li>✓ Flexible payment terms (Net 30)</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Priority fulfillment and delivery</li>
              </ul>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-4">
              Account Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
              >
                🚪 Logout
              </button>
              <button className="w-full px-4 py-2 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-900 dark:text-red-100 font-semibold rounded transition-colors">
                🗑️ Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
