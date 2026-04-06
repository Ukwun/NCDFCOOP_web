'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MembershipPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('benefits');

  const membershipTiers = [
    {
      name: 'Bronze',
      emoji: '🥉',
      color: '#8B6914',
      minSpend: '₦0',
      maxSpend: '₦99,999',
      benefits: [
        'Member discount: 5%',
        'Basic rewards (1pt = ₦1 spent)',
        'Monthly newsletter',
        'Access to community events',
        'Priority customer support',
      ],
      features: [
        'Voting rights',
        'Dividend payments (if profitable)',
        'Product pre-orders',
      ],
    },
    {
      name: 'Silver',
      emoji: '🥈',
      color: '#A9A9A9',
      minSpend: '₦100,000',
      maxSpend: '₦499,999',
      benefits: [
        'Member discount: 10%',
        'Double rewards (2pts = ₦1 spent)',
        'Exclusive deals every week',
        'Free shipping on orders > ₦5,000',
        '24/7 member support line',
      ],
      features: [
        'All Bronze benefits',
        'Eligible for credit line',
        'Sponsor 1 referral bonus',
      ],
    },
    {
      name: 'Gold',
      emoji: '🥇',
      color: '#C9A227',
      minSpend: '₦500,000',
      maxSpend: '₦1,999,999',
      benefits: [
        'Member discount: 15%',
        'Triple rewards (3pts = ₦1 spent)',
        'Weekly exclusive member deals',
        'Free shipping on all orders',
        'Dedicated account manager',
      ],
      features: [
        'All Silver benefits',
        'Premium credit line',
        'Sponsor up to 5 referrals',
        'Invite to quarterly member meetups',
      ],
    },
    {
      name: 'Platinum',
      emoji: '💎',
      color: '#9D4EDD',
      minSpend: '₦2,000,000+',
      maxSpend: 'Unlimited',
      benefits: [
        'Member discount: 20%',
        'Quad rewards (4pts = ₦1 spent)',
        'Daily exclusive deals',
        'Free shipping worldwide',
        'VIP concierge service',
      ],
      features: [
        'All Gold benefits',
        'Premium VIP credit line',
        'Unlimited referrals with rewards',
        'Monthly VIP events & merchant meetings',
        'Quarterly dividend bonus',
      ],
    },
  ];

  const memberTypes = [
    {
      type: 'Regular Member',
      icon: '👤',
      description: 'Individual member with personal shopping benefits',
      features: ['Personal rewards account', 'Individual discounts', 'Personal referral link'],
    },
    {
      type: 'Wholesale Buyer',
      icon: '🏢',
      description: 'Business bulk buyer with wholesale pricing',
      features: ['Bulk order discounts', 'Business credit line', 'Dedicated merchant support'],
    },
    {
      type: 'Seller/Producer',
      icon: '🏪',
      description: 'Farmers & producers selling through the platform',
      features: ['Commission-based payment', 'Product approval system', 'Marketing support'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="text-2xl hover:scale-110 transition-transform"
            >
              ←
            </button>
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-[#0B6B3A] text-white text-xs font-semibold rounded-full">
                🎯 MEMBERSHIP INFO
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            NCDFCOOP Membership
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Join thousands of members enjoying cooperative benefits, exclusive deals, and rewards
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Tabs */}
        <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'benefits', label: '💎 Membership Tiers' },
            { id: 'types', label: '🎯 Member Types' },
            { id: 'faq', label: '❓ FAQ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#0B6B3A] border-[#0B6B3A]'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tiers Section */}
        {activeTab === 'benefits' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {membershipTiers.map((tier) => (
                <div
                  key={tier.name}
                  className="rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105"
                  style={{ backgroundColor: tier.color, color: 'white' }}
                >
                  {/* Tier Header */}
                  <div className="p-6 text-center border-b border-white border-opacity-20">
                    <div className="text-4xl mb-2">{tier.emoji}</div>
                    <h3 className="text-2xl font-bold">{tier.name}</h3>
                    <p className="text-sm opacity-90 mt-2">Spending: {tier.minSpend} - {tier.maxSpend}</p>
                  </div>

                  {/* Benefits */}
                  <div className="p-6">
                    <h4 className="text-sm font-bold mb-3 opacity-90">Benefits</h4>
                    <ul className="space-y-2 mb-6">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span>✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <h4 className="text-sm font-bold mb-3 opacity-90 border-t border-white border-opacity-20 pt-4">
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span>⭐</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                📈 How Tiers Work
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                Your tier is automatically determined by your total spending in the last 12 months. As you spend more, you unlock better benefits and higher discounts. All tier advancements are instant!
              </p>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>💡 <strong>Tip:</strong> Refer friends to earn bonus points and reach higher tiers faster</p>
                <p>💡 <strong>Tip:</strong> Your tier resets annually on January 1st based on your previous year spending</p>
              </div>
            </div>
          </div>
        )}

        {/* Member Types Section */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {memberTypes.map((type) => (
                <div
                  key={type.type}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{type.type}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                        <span>✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full mt-6 bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Learn More →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: 'How much does it cost to become a member?',
                a: 'Membership is FREE! You only pay for the products and services you use. We take a small commission on certain services to support operations.',
              },
              {
                q: 'Can I change my membership type later?',
                a: 'Yes! You can switch between Regular Member, Wholesale Buyer, or Seller status at any time. Just contact our support team or visit your account settings.',
              },
              {
                q: 'How are rewards points calculated?',
                a: 'Points vary by tier: Bronze (1pt = ₦1), Silver (2pts), Gold (3pts), Platinum (4pts). You earn points on every purchase and can redeem them for discounts or products.',
              },
              {
                q: 'What if I don\'t meet the spending requirement for my tier?',
                a: 'Tiers are based on spending in the past 12 months. If you drop below a tier threshold, you\'ll automatically move to the lower tier the next month. You can always work towards the higher tier again!',
              },
              {
                q: 'Are member discounts stackable?',
                a: 'Member discounts are applied automatically to your purchases. Some promotions may not stack, but we always apply the best discount available to you.',
              },
              {
                q: 'How do referrals work?',
                a: 'Share your unique referral link with friends. When they sign up and make their first purchase, you both get bonus rewards points! Higher tiers can sponsor more referrals.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">{item.q}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#0B6B3A] to-[#095234] rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to Join NCDFCOOP?</h3>
          <p className="mb-6">Start earning rewards today and become part of Nigeria's most trusted cooperative commerce platform</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/signup')}
              className="bg-white text-[#0B6B3A] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Sign Up Now
            </button>
            <button
              onClick={() => router.push('/home')}
              className="border-2 border-white text-white hover:bg-white hover:bg-opacity-10 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
