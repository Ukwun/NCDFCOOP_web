'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { addToCart } from '@/lib/services/cartService';
import ProductCard from './ProductCard';
import GlobalUtilityLayer from './GlobalUtilityLayer';

const MEMBER_PRODUCTS = [
  {
    id: 'member-p1',
    name: 'Premium Family Basket',
    description: 'Curated essentials bundle with cooperative member pricing.',
    price: 18500,
    originalPrice: 22800,
    discount: 19,
    category: 'Essentials',
    stock: 34,
    sellerId: 'coop-seller-1',
    sellerName: 'NCDF Preferred Supply',
    rating: 4.8,
    reviews: 126,
    images: ['/images/essential basket1.png'],
    thumbnail: '/images/essential basket1.png',
    unit: 'bundle',
    createdAt: new Date(),
  },
  {
    id: 'member-p2',
    name: 'Member Grain Combo',
    description: 'Bulk-friendly weekly grain box with member discount locked in.',
    price: 14200,
    originalPrice: 17100,
    discount: 17,
    category: 'Grains',
    stock: 51,
    sellerId: 'coop-seller-2',
    sellerName: 'Coop Grain Network',
    rating: 4.7,
    reviews: 89,
    images: ['/images/Buck wheat1.png'],
    thumbnail: '/images/Buck wheat1.png',
    unit: 'pack',
    createdAt: new Date(),
  },
  {
    id: 'member-p3',
    name: 'Protein Plus Pack',
    description: 'Member-only protein pack for high-volume households.',
    price: 9200,
    originalPrice: 11400,
    discount: 19,
    category: 'Proteins',
    stock: 42,
    sellerId: 'coop-seller-3',
    sellerName: 'Member Fresh Protein',
    rating: 4.6,
    reviews: 71,
    images: ['/images/Beef1.png'],
    thumbnail: '/images/Beef1.png',
    unit: 'pack',
    createdAt: new Date(),
  },
  {
    id: 'member-p4',
    name: 'Member Spice Arsenal',
    description: '6-in-1 cooperative spice collection with loyalty pricing.',
    price: 6400,
    originalPrice: 7800,
    discount: 18,
    category: 'Spices',
    stock: 67,
    sellerId: 'coop-seller-4',
    sellerName: 'Coop Spice House',
    rating: 4.9,
    reviews: 153,
    images: ['/images/6in1spices1.png'],
    thumbnail: '/images/6in1spices1.png',
    unit: 'set',
    createdAt: new Date(),
  },
];

export default function MemberHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData } = useMemberData(user?.uid || '');

  const summary = useMemo(() => {
    const tier = (memberData?.tier || 'bronze').toUpperCase();
    const points = memberData?.rewardsPoints || 0;
    const discount = memberData?.discountPercentage || 5;
    const spent = memberData?.totalSpent || 0;
    const projectedValue = Math.round(spent * (discount / 100));

    return { tier, points, discount, spent, projectedValue };
  }, [memberData]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <GlobalUtilityLayer
          role="member"
          kpiSummary={`Tier ${summary.tier} • ${summary.points.toLocaleString()} points • ${summary.discount}% active discount`}
        />

        <section className="rounded-2xl bg-gradient-to-r from-[#0D3D63] via-[#0E527F] to-[#1576A9] text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Member Intelligence Console</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Welcome, {user?.displayName?.split(' ')[0] || 'Member'}</h1>
              <p className="mt-2 text-sm sm:text-base opacity-90 max-w-2xl">
                Your cooperative dashboard now prioritizes trust infrastructure first, then shopping execution.
                Track your tier, compliance posture, personalized offers, and conversion actions from one command surface.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <button onClick={() => router.push('/my-rewards')} className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors">
                Rewards Center
              </button>
              <button onClick={() => router.push('/offers')} className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                Active Offers
              </button>
              <button onClick={() => router.push('/orders')} className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                Track Orders
              </button>
              <button onClick={() => router.push('/products')} className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors">
                Marketplace
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Loyalty Tier</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">{summary.tier}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Discount band: {summary.discount}%</p>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Points Balance</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">{summary.points.toLocaleString()}</p>
            <button onClick={() => router.push('/my-rewards')} className="mt-3 text-sm font-medium text-[#0E4B78] dark:text-[#7FC2EA] hover:underline">
              Redeem Points
            </button>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Projected Value Saved</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">₦{summary.projectedValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Based on your purchase history.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Member Marketplace Picks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Real-time pricing intelligence for your tier and order behavior.</p>
            </div>
            <button
              onClick={() => router.push('/member-products')}
              className="px-4 py-2 rounded-lg bg-[#0E4B78] hover:bg-[#0A3B5F] text-white text-sm font-medium"
            >
              Open Member Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MEMBER_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
                onViewDetails={(productId) => router.push(`/products/${productId}`)}
                onAddToCart={async (prod, quantity) => {
                  if (!user) {
                    router.push('/signin');
                    return;
                  }

                  await addToCart(
                    user.uid,
                    prod.id,
                    prod.name,
                    prod.price,
                    prod.thumbnail || prod.images?.[0] || '',
                    quantity
                  );
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
