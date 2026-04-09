'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';

export default function MemberBenefitsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData } = useMemberData(user?.uid || '');

  const currentTier = memberData?.tier.toUpperCase() || 'GOLD';

  const tierBenefits = {
    BRONZE: {
      color: '#8B6914',
      emoji: '🥉',
      discount: 5,
      benefits: [
        '✓ 5% discount on all products',
        '✓ 1 point per ₦100 spent',
        '✓ Early access to flash deals',
        '✓ Member-only product catalog',
      ],
      nextTier: 'SILVER at ₦200,000 spent',
    },
    SILVER: {
      color: '#A9A9A9',
      emoji: '🥈',
      discount: 7,
      benefits: [
        '✓ 7% discount on all products',
        '✓ 1.5 points per ₦100 spent',
        '✓ Early access to flash deals',
        '✓ Priority customer support',
        '✓ Monthly bonus points (50 pts)',
        '✓ Exclusive silver-tier products',
      ],
      nextTier: 'GOLD at ₦500,000 spent',
    },
    GOLD: {
      color: '#C9A227',
      emoji: '🥇',
      discount: 10,
      benefits: [
        '✓ 10% discount on all products',
        '✓ 2 points per ₦100 spent',
        '✓ Early access to flash deals',
        '✓ Premium customer support (24/7)',
        '✓ Monthly bonus points (100 pts)',
        '✓ Exclusive gold-tier products',
        '✓ Quarterly rewards gift',
        '✓ Voting rights on major decisions',
      ],
      nextTier: 'PLATINUM at ₦1,000,000 spent',
    },
    PLATINUM: {
      color: '#9D4EDD',
      emoji: '💎',
      discount: 15,
      benefits: [
        '✓ 15% discount on all products',
        '✓ 3 points per ₦100 spent',
        '✓ VIP early access (24hrs)',
        '✓ Dedicated VIP support line',
        '✓ Monthly bonus points (200 pts)',
        '✓ All platinum-exclusive products',
        '✓ Quarterly rewards gift + bonus',
        '✓ Full voting rights',
        '✓ Invitation to exclusive VIP events',
        '✓ 2% annual dividend on savings',
      ],
      nextTier: 'You are at the highest tier!',
    },
  };

  const benefits = tierBenefits[currentTier as keyof typeof tierBenefits] || tierBenefits.GOLD;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-2xl hover:text-[#C9A227]"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ⭐ Your Benefits
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Tier: {currentTier}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Current Tier Banner */}
        <div
          className="rounded-lg p-6 sm:p-8 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${benefits.color} 0%, ${benefits.color}CC 100%)` }}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">{benefits.emoji}</span>
            <div>
              <h2 className="text-3xl font-bold">{currentTier} MEMBER</h2>
              <p className="text-sm opacity-90">{benefits.discount}% discount on all purchases</p>
            </div>
          </div>
          <p className="text-sm opacity-90 mb-4">Next milestone: {benefits.nextTier}</p>
          <div className="opacity-75 text-sm">
            💡 Earn more points by shopping with us to unlock higher tiers and even better benefits!
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Benefits</h3>
          <div className="space-y-3">
            {benefits.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-xl">✨</span>
                <p className="text-gray-900 dark:text-white font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tier Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    🥉 Bronze
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    🥈 Silver
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    🥇 Gold
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    💎 Platinum
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Discount</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">5%</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">7%</td>
                  <td className="text-center py-3 px-4 font-semibold text-[#C9A227]">10%</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">15%</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Points/₦100</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">1 pt</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">1.5 pts</td>
                  <td className="text-center py-3 px-4 font-semibold text-[#C9A227]">2 pts</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">3 pts</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Monthly Bonus</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">—</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">50 pts</td>
                  <td className="text-center py-3 px-4 font-semibold text-[#C9A227]">100 pts</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">200 pts</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Support</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">—</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">Standard</td>
                  <td className="text-center py-3 px-4 font-semibold text-[#C9A227]">Priority 24/7</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">VIP Line</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Voting Rights</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">—</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">—</td>
                  <td className="text-center py-3 px-4 font-semibold text-[#C9A227]">✓ Yes</td>
                  <td className="text-center py-3 px-4 text-gray-600 dark:text-gray-400">✓ Full</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
