'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFlashDeals } from '@/lib/hooks/useFlashDeals';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

const CATEGORIES = [
  { name: 'Grains', emoji: '🥘', id: 'grains' },
  { name: 'Vegetables', emoji: '🌾', id: 'vegetables' },
  { name: 'Dairy', emoji: '🥛', id: 'dairy' },
  { name: 'Proteins', emoji: '🍖', id: 'proteins' },
  { name: 'Oils', emoji: '🧈', id: 'oils' },
  { name: 'More', emoji: '🛒', id: 'all' },
];

export default function WholesaleBuyerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { deals: flashDeals } = useFlashDeals();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);


  // Load recommended products on mount
  useEffect(() => {
    // TODO: Fetch from Firestore based on user preferences
    const mockProducts: Product[] = [
      { id: '1', name: 'Garlic Bulbs', price: 2500, image: '🧄' },
      { id: '2', name: 'Palm Oil', price: 4200, image: '🫒' },
      { id: '3', name: 'Cassava Flour', price: 1800, image: '🌾' },
      { id: '4', name: 'Eggs (30pc)', price: 3600, image: '🥚' },
    ];
    setRecommendedProducts(mockProducts);
  }, []);

  const firstName = user?.displayName?.split(' ')[0] || 'Guest';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-[#1E7F4E] text-white text-xs font-semibold rounded-full">
                🛍️ CONSUMER HOME (Retail Pricing)
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Shop quality products at great prices
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search Products..."
              className="w-full px-4 sm:px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E7F4E]"
            />
          </div>
        </div>

        {/* Flash Deals Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              ⚡ Flash Deals
            </h2>
            <button
              onClick={() => router.push('/flash-sales')}
              className="text-[#1E7F4E] hover:text-[#155a3a] font-semibold text-sm"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex gap-4 pb-2">
              {flashDeals.length > 0 ? (
                flashDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => router.push(`/products/${deal.id}`)}
                    className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl font-bold">
                      {deal.image || '📦'}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                        {deal.name}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#059669]">₦{deal.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 line-through">₦{deal.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-orange-600 font-semibold">
                        ⏱️ {deal.timeLeftDisplay}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-8 text-gray-500">
                  <p>No active flash deals at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Browse by Category
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => router.push(`/products?category=${category.id}`)}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
              >
                <div className="text-4xl mb-2">{category.emoji}</div>
                <p className="text-xs sm:text-sm font-semibold text-center text-gray-900 dark:text-white line-clamp-2">
                  {category.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Products */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recommended for You
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl">
                  {product.image}
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-lg font-bold text-[#059669] mt-2">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-[#C9A227] to-[#B89015] rounded-lg p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">💎 Become a Member</h3>
              <p className="text-sm sm:text-base opacity-90">
                Get exclusive prices & loyalty rewards. Earn points on every purchase!
              </p>
            </div>
            <button
              onClick={() => router.push('/membership')}
              className="px-6 py-2 bg-white text-[#C9A227] font-semibold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
