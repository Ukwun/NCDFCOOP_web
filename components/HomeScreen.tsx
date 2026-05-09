'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { getMemberData } from '@/lib/services/memberService';
import { useActivityTracking } from '@/lib/hooks';

export default function HomeScreen() {
  const { user } = useAuth();
  const { trackProductView } = useActivityTracking({
    userId: user?.uid || '',
  });

  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchMemberData = async () => {
      try {
        const data = await getMemberData(user.uid);
        setMemberData(data);
        await trackProductView('member_home', 'Member Home');
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError('Failed to load member data');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user, trackProductView]);

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, {user?.displayName || 'Member'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Your member dashboard and loyalty profile</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6 shadow-lg">
        <p className="text-blue-100 mb-2">Membership Tier</p>
        <h2 className="text-4xl font-bold mb-4">{memberData?.tier?.toUpperCase() || 'BRONZE'}</h2>
        <div className="flex justify-between text-blue-100 text-sm">
          <span>Total Purchases: <strong>₦{(memberData?.totalPurchases || 0).toLocaleString()}</strong></span>
          <span>Loyalty Points: <strong>{memberData?.loyaltyPoints || 0}</strong></span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Member Benefits</h3>
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
            <span className="text-gray-700 dark:text-gray-300">Priority support and member campaigns</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
