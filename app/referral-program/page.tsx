'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';

interface Referral {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  status: 'pending' | 'active' | 'completed';
  bonusEarned?: number;
}

export default function ReferralProgramPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('COOP2026');
  const [referralLink, setReferralLink] = useState(
    `https://coopcommerce.ng/?ref=${referralCode}`
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: '1',
      name: 'Chioma Obi',
      email: 'chioma.obi@email.com',
      joinDate: 'Feb 28, 2026',
      status: 'completed',
      bonusEarned: 2500,
    },
    {
      id: '2',
      name: 'Tunde Adebayo',
      email: 'tunde.a@email.com',
      joinDate: 'Mar 5, 2026',
      status: 'active',
    },
    {
      id: '3',
      name: 'Amara Nwosu',
      email: 'amara.nwosu@email.com',
      joinDate: 'Mar 15, 2026',
      status: 'pending',
    },
  ]);

  const stats = {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter((r) => r.status !== 'pending').length,
    totalBonusEarned: referrals
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.bonusEarned || 0), 0),
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-blue-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              👥 Referral Program
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Earn bonuses by inviting friends to COOP Commerce
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Referrals</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalReferrals}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats.activeReferrals} active referrals
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Bonus Earned</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₦{stats.totalBonusEarned.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              From completed referrals
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-sm">
            <p className="text-blue-100 text-sm mb-2">Next Bonus</p>
            <p className="text-3xl font-bold">₦2,500</p>
            <p className="text-xs text-blue-200 mt-2">
              When 1 more referral joins
            </p>
          </div>
        </div>

        {/* Share Your Referral Link */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            🔗 Share Your Referral Link
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  Copy Code
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referral Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    copiedLink
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedLink ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Share on social media:
            </p>
            <div className="flex gap-3 flex-wrap">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                📱 WhatsApp
              </button>
              <button className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                𝕏 Twitter
              </button>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                f Facebook
              </button>
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium">
                📧 Email
              </button>
            </div>
          </div>
        </div>

        {/* How to Earn */}
        <div className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-8">
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-6">
            💡 How to Earn Referral Bonuses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 1: Share</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Send your referral link to friends and family members
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 2: They Sign Up</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                They create an account using your referral link or code
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 3: Verify</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                They complete their profile and make their first purchase (₦5,000+)
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Step 4: Bonus!</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Earn ₦2,500 credit + 2% of their first purchase value
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong className="text-amber-900 dark:text-amber-100">Bonus Cap:</strong> Maximum ₦50,000 per month in referral bonuses
            </p>
          </div>
        </div>

        {/* Referral Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            📊 Your Referrals
          </h2>

          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{referral.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{referral.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Joined: {referral.joinDate}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {referral.bonusEarned && (
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +₦{referral.bonusEarned.toLocaleString()}
                      </p>
                    )}
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        referral.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : referral.status === 'active'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {referral.status.charAt(0).toUpperCase() +
                        referral.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
