'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Timestamp, collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { useMemberData } from '@/lib/hooks/useMemberData';
import ProductCard from './ProductCard';
import { addToCart } from '@/lib/services/cartService';
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
          <div className="text-sm sm:text-base font-semibold opacity-80">Loyalty • Exclusive Deals • Priority Access</div>
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
              <li>Special deals and early access offers just for you</li>
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
}
