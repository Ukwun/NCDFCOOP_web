'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import ProductCard from '@/components/ProductCard';
import { addToCart } from '@/lib/services/cartService';

export default function MemberProductsPage() {
  const router = useRouter();
  const { user: _user } = useAuth();
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['All', 'Grains & Cereals', 'Proteins', 'Dairy', 'Fresh Produce', 'Value Deals'];

  // Use real images for member-exclusive products
  const MEMBER_PRODUCT_IMAGES = [
    '/images/Crayfish 1.png',
    '/images/Beef1.png',
    '/images/egusiseeds1.png',
    '/images/6in1spices1.png',
    '/images/Bag of garri1.png',
    '/images/Buck wheat1.png',
    '/images/Family pack1.png',
    '/images/essential basket1.png',
    '/images/Frame 174.png',
    '/images/Frame 175.png',
    '/images/Frame 176.png',
    '/images/All inclusive pack.png',
  ];
  const products = [
    { id: '1', name: 'Premium Milled Rice', category: 'Grains & Cereals', price: 15000, memberPrice: 12750, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[0], images: [MEMBER_PRODUCT_IMAGES[0]], stock: 45, sellerId: 'coop', sellerName: 'CoopMart', description: 'Premium rice for members.', rating: 4.8, reviews: 20 }, // Display logic is in ProductCard
    { id: '2', name: 'Free-Range Eggs (30pc)', category: 'Proteins', price: 8500, memberPrice: 6800, discount: 20, thumbnail: MEMBER_PRODUCT_IMAGES[1], images: [MEMBER_PRODUCT_IMAGES[1]], stock: 12, sellerId: 'coop', sellerName: 'CoopMart', description: 'Farm fresh eggs.', rating: 4.7, reviews: 14 },
    { id: '3', name: 'Fresh Organic Milk (1L)', category: 'Dairy', price: 1200, memberPrice: 960, discount: 20, thumbnail: MEMBER_PRODUCT_IMAGES[2], images: [MEMBER_PRODUCT_IMAGES[2]], stock: 78, sellerId: 'coop', sellerName: 'CoopMart', description: 'Organic milk for your family.', rating: 4.9, reviews: 18 },
    { id: '4', name: 'Gourmet Butter (500g)', category: 'Dairy', price: 4500, memberPrice: 3825, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[3], images: [MEMBER_PRODUCT_IMAGES[3]], stock: 23, sellerId: 'coop', sellerName: 'CoopMart', description: 'Rich gourmet butter.', rating: 4.6, reviews: 11 },
    { id: '5', name: 'Beef Cuts Pack (2kg)', category: 'Proteins', price: 22000, memberPrice: 18700, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[4], images: [MEMBER_PRODUCT_IMAGES[4]], stock: 8, sellerId: 'coop', sellerName: 'CoopMart', description: 'Fresh beef cuts.', rating: 4.7, reviews: 13 },
    { id: '6', name: 'Chickpeas (5kg)', category: 'Grains & Cereals', price: 6000, memberPrice: 5100, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[5], images: [MEMBER_PRODUCT_IMAGES[5]], stock: 34, sellerId: 'coop', sellerName: 'CoopMart', description: 'Nutritious chickpeas.', rating: 4.5, reviews: 8 },
    { id: '7', name: 'Fresh Tomatoes Crate', category: 'Fresh Produce', price: 5500, memberPrice: 4400, discount: 20, thumbnail: MEMBER_PRODUCT_IMAGES[6], images: [MEMBER_PRODUCT_IMAGES[6]], stock: 16, sellerId: 'coop', sellerName: 'CoopMart', description: 'Fresh tomatoes.', rating: 4.8, reviews: 15 },
    { id: '8', name: 'Assorted Vegetables Bundle', category: 'Fresh Produce', price: 3000, memberPrice: 2400, discount: 20, thumbnail: MEMBER_PRODUCT_IMAGES[7], images: [MEMBER_PRODUCT_IMAGES[7]], stock: 52, sellerId: 'coop', sellerName: 'CoopMart', description: 'Assorted vegetables.', rating: 4.7, reviews: 12 },
    { id: '9', name: 'Nigerian Garri (50kg)', category: 'Grains & Cereals', price: 12000, memberPrice: 10200, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[8], images: [MEMBER_PRODUCT_IMAGES[8]], stock: 19, sellerId: 'coop', sellerName: 'CoopMart', description: 'Classic garri.', rating: 4.6, reviews: 10 },
    { id: '10', name: 'Honey Premium (1kg)', category: 'Value Deals', price: 8000, memberPrice: 6400, discount: 20, thumbnail: MEMBER_PRODUCT_IMAGES[9], images: [MEMBER_PRODUCT_IMAGES[9]], stock: 7, sellerId: 'coop', sellerName: 'CoopMart', description: 'Pure honey.', rating: 4.9, reviews: 9 },
    { id: '11', name: 'Groundnut Oil (5L)', category: 'Value Deals', price: 7000, memberPrice: 5950, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[10], images: [MEMBER_PRODUCT_IMAGES[10]], stock: 29, sellerId: 'coop', sellerName: 'CoopMart', description: 'Healthy groundnut oil.', rating: 4.7, reviews: 11 },
    { id: '12', name: 'Pasteurized Cheese (500g)', category: 'Dairy', price: 3500, memberPrice: 2975, discount: 15, thumbnail: MEMBER_PRODUCT_IMAGES[11], images: [MEMBER_PRODUCT_IMAGES[11]], stock: 14, sellerId: 'coop', sellerName: 'CoopMart', description: 'Delicious cheese.', rating: 4.8, reviews: 10 },
  ];

  const filteredProducts = filterCategory === 'all'
    ? products
    : products.filter((p) => p.category === filterCategory);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.memberPrice - b.memberPrice;
      case 'price-high':
        return b.memberPrice - a.memberPrice;
      case 'discount':
        return b.discount - a.discount;
      default:
        return 0;
    }
  });

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
              <div className="inline-block px-3 py-1 bg-[#C9A227] text-white text-xs font-semibold rounded-full">
                ⭐ MEMBER EXCLUSIVE
              </div>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Member-Only Products
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Special prices for cooperative members - Extra savings on quality products
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filters & Sort */}
        <div className="mb-6 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Category
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat === 'All' ? 'all' : cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${
                    (cat === 'All' && filterCategory === 'all') || filterCategory === cat
                      ? 'bg-[#0B6B3A] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {sortedProducts.map((product) => (
            <div key={product.id} style={{ minWidth: 240, maxWidth: 280, margin: '0 auto' }}>
              <ProductCard
                product={{
                  ...product,
                  price: product.memberPrice, // Always show member price
                  originalPrice: product.price,
                }}
                onAddToCart={async (prod, quantity) => {
                  if (!_user) {
                    alert('Please sign in to add items to your cart.');
                    return;
                  }
                  try {
                    await addToCart(
                      _user.uid,
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
              />
            </div>
          ))}
        </div>

        {/* Member Benefits Info */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
            💎 Why Shop Member Products?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>✓ Extra discounts on all products (10-20% off)</li>
            <li>✓ Direct from our cooperative farms & partners</li>
            <li>✓ Quality guaranteed - no intermediaries</li>
            <li>✓ Every purchase supports farmers in your community</li>
            <li>✓ Earn double rewards points on member products</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
