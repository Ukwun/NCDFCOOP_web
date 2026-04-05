'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { getMemberData } from '@/lib/services/memberService';
import { getUserOrders } from '@/lib/services/orderService';
import { trackActivity } from '@/lib/analytics/activityTracker';

export default function MyNCDFCOOPScreen() {
  const { user, logout } = useAuth();
  const [memberData, setMemberData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const memberInfo = await getMemberData(user.uid);
        setMemberData(memberInfo);

        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);

        await trackActivity('page_view', { page: 'profile' }, user.uid);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutDialog(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: '📋', title: 'My Orders', subtitle: 'Track purchases', count: orders.length },
    { icon: '💰', title: 'Savings Account', subtitle: 'View balance' },
    { icon: '🎁', title: 'Loyalty Points', subtitle: 'Earn rewards' },
    { icon: '📍', title: 'Addresses', subtitle: 'Manage delivery' },
    { icon: '💳', title: 'Payment Methods', subtitle: 'Manage cards' },
    { icon: '❤️', title: 'Wishlist', subtitle: 'Saved items' },
  ];

  const accountItems = [
    { icon: '⚙️', title: 'Settings', subtitle: 'Preferences' },
    { icon: '❓', title: 'Help & Support', subtitle: 'Get assistance' },
    { icon: 'ℹ️', title: 'About NCDFCOOP', subtitle: 'Our mission' },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  const tierColor = {
    bronze: 'from-amber-600 to-amber-700',
    silver: 'from-slate-600 to-slate-700',
    gold: 'from-yellow-600 to-yellow-700',
    platinum: 'from-purple-600 to-purple-700',
  };

  const tierBg = tierColor[memberData?.tier as keyof typeof tierColor] || 'from-blue-600 to-blue-700';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Member Header */}
      <div className={`bg-gradient-to-r ${tierBg} rounded-lg p-6 text-white mb-6`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
            {user?.displayName?.charAt(0) || 'M'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName || 'Member'}</h1>
            <p className="text-white/80">{user?.email}</p>
            <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-bold mt-2">
              🏅 {memberData?.tier?.toUpperCase() || 'BRONZE'} Member
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Orders</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₦{(memberData?.totalDeposits || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total Deposited</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {memberData?.loyaltyPoints || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Loyalty Points</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₦{(memberData?.savingsBalance || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Savings Balance</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Account</h2>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.count && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">{item.count}</span>}
                <span className="text-gray-400">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Settings</h2>
        <div className="space-y-2">
          {accountItems.map((item, index) => (
            <button
              key={index}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                </div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => setShowLogoutDialog(true)}
        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-bold transition-colors"
      >
        🚪 Logout
      </button>

      {/* Logout Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Logout?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
