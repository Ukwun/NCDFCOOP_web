'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFlashDeals } from '@/lib/hooks/useFlashDeals';
import ProductCard from './ProductCard';

// Use real images from public/images for mock data
const PRODUCT_IMAGES = [
  '/images/Bag of garri1.png',
  '/images/Palm Oil.png',
  '/images/Cassava Flour.png',
  '/images/Eggs (30pc).png',
  '/images/Crayfish 1.png',
  '/images/Buck wheat1.png',
  '/images/Beef1.png',
  '/images/egusiseeds1.png',
  '/images/6in1spices1.png',
];

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
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);


  // Load recommended products on mount
  useEffect(() => {
    // Use real images for mock products
    const mockProducts = [
      {
        id: '1',
        name: 'Bag of Garri',
        price: 2500,
        originalPrice: 3200,
        thumbnail: PRODUCT_IMAGES[0],
        images: [PRODUCT_IMAGES[0]],
        stock: 20,
        sellerId: 'wholesale',
        sellerName: 'BulkMart',
        description: 'Premium quality garri in bulk.',
        rating: 4.7,
        reviews: 18,
        category: 'Grains',
      },
      {
        id: '2',
        name: 'Palm Oil',
        price: 4200,
        originalPrice: 4800,
        thumbnail: PRODUCT_IMAGES[1],
        images: [PRODUCT_IMAGES[1]],
        stock: 15,
        sellerId: 'wholesale',
        sellerName: 'AgroHub',
        description: 'Unadulterated palm oil for wholesale buyers.',
        rating: 4.5,
        reviews: 12,
        category: 'Oils',
      },
      {
        id: '3',
        name: 'Cassava Flour',
        price: 1800,
        originalPrice: 2100,
        thumbnail: PRODUCT_IMAGES[2],
        images: [PRODUCT_IMAGES[2]],
        stock: 30,
        sellerId: 'wholesale',
        sellerName: 'FarmersDirect',
        description: 'Finely milled cassava flour.',
        rating: 4.2,
        reviews: 9,
        category: 'Grains',
      },
      {
        id: '4',
        name: 'Eggs (30pc)',
        price: 3600,
        originalPrice: 4000,
        thumbnail: PRODUCT_IMAGES[3],
        images: [PRODUCT_IMAGES[3]],
        stock: 10,
        sellerId: 'wholesale',
        sellerName: 'EggDepot',
        description: 'Farm fresh eggs in bulk.',
        rating: 4.8,
        reviews: 22,
        category: 'Proteins',
      },
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
                flashDeals.map((deal, idx) => {
                  // Map FlashDealState to Product type
                  const product = {
                    id: deal.id,
                    name: deal.name,
                    price: deal.price,
                    originalPrice: deal.originalPrice,
                    thumbnail: deal.image || PRODUCT_IMAGES[(idx + 4) % PRODUCT_IMAGES.length],
                    images: [deal.image || PRODUCT_IMAGES[(idx + 4) % PRODUCT_IMAGES.length]],
                    sellerId: 'flash',
                    sellerName: 'Flash Seller',
                    stock: 10,
                    description: 'Limited time offer!',
                    rating: 4.5,
                    reviews: 10,
                    category: 'Deals',
                  };
                  return (
                    <div key={deal.id} style={{ minWidth: 240, maxWidth: 280 }}>
                      <ProductCard product={product} />
                    </div>
                  );
                })
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
            Wholesale Picks For You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <div key={product.id} style={{ minWidth: 240, maxWidth: 280, margin: '0 auto' }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Wholesale Info CTA */}
        <div className="bg-gradient-to-r from-[#1E7F4E] to-[#155a3a] rounded-lg p-6 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">🛒 Wholesale Buyer Benefits</h3>
              <p className="text-sm sm:text-base opacity-90">
                Access bulk pricing, priority fulfillment, and dedicated support for your business needs.
              </p>
            </div>
            <button
              onClick={() => router.push('/member-benefits')}
              className="px-6 py-2 bg-white text-[#1E7F4E] font-semibold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              View Benefits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
