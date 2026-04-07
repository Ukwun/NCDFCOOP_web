'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface FlashProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  sold: number;
  vendor: string;
  rating: number;
  reviews: number;
  category: string;
  description: string;
  endsAt: string;
}

export default function FlashSalesPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState('');
  const [products, _setProducts] = useState<FlashProduct[]>([
    {
      id: '1',
      name: 'Premium Milled Rice (25kg)',
      image: '🍚',
      price: 12500,
      originalPrice: 15800,
      discount: 21,
      stock: 45,
      sold: 127,
      vendor: 'Golden Grain Farm Collective',
      rating: 4.8,
      reviews: 342,
      category: 'Food & Grains',
      description: 'Premium quality white rice, freshly milled. Perfect for family table.',
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Organic Cocoa Powder (500g)',
      image: '🍫',
      price: 4200,
      originalPrice: 5800,
      discount: 28,
      stock: 78,
      sold: 89,
      vendor: 'Cocoa Farmers Cooperative',
      rating: 4.9,
      reviews: 156,
      category: 'Food & Spices',
      description: 'Pure organic cocoa powder. No additives. Single-origin from premium beans.',
      endsAt: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Fresh Ginger Root (5kg Box)',
      image: '🌿',
      price: 3500,
      originalPrice: 5000,
      discount: 30,
      stock: 34,
      sold: 156,
      vendor: 'Tropical Produce Alliance',
      rating: 4.7,
      reviews: 289,
      category: 'Fresh Produce',
      description: 'Fresh, pungent ginger root. Great for cooking, teas, and remedies.',
      endsAt: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: 'Shea Butter (Pure, 500ml)',
      image: '🧴',
      price: 6800,
      originalPrice: 9500,
      discount: 28,
      stock: 62,
      sold: 203,
      vendor: 'Shea Beauty Cooperative',
      rating: 4.8,
      reviews: 421,
      category: 'Beauty & Wellness',
      description: ' 100% pure shea butter. Perfect for skin, hair, and lips. No additives.',
      endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      name: 'Organic Honey (1 liter)',
      image: '🍯',
      price: 8500,
      originalPrice: 11200,
      discount: 24,
      stock: 28,
      sold: 78,
      vendor: 'Bee Farmers Network',
      rating: 4.9,
      reviews: 234,
      category: 'Food & Honey',
      description: 'Raw, unfiltered honey. Rich in natural enzymes and antioxidants.',
      endsAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const firstProduct = products[0];
      const diff = new Date(firstProduct.endsAt).getTime() - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Sale Ended');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [products]);

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
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ⚡ Flash Sales
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Limited-time deals on quality products
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Flash Sale Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">🎉 Member-Only Flash Sale</h2>
              <p className="text-red-100 text-lg">
                Exclusive deals for COOP members only
              </p>
            </div>
            <div className="bg-black bg-opacity-30 rounded-lg px-6 py-4 text-center">
              <p className="text-red-100 text-sm mb-2">Time Remaining</p>
              <p className="text-2xl font-bold font-mono">{timeLeft}</p>
            </div>
          </div>
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
              All Products
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">
              Food & Grains
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600">
              Beauty & Wellness
            </button>
          </div>
          <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
            <option>Sort by: Bestselling</option>
            <option>Highest Discount</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {products.map((product) => {
            const stockPercentage = (product.sold / (product.sold + product.stock)) * 100;
            const endsTime = new Date(product.endsAt).getTime() - Date.now();
            const hours = Math.floor(endsTime / (1000 * 60 * 60));
            const minutes = Math.floor((endsTime % (1000 * 60 * 60)) / (1000 * 60));

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image & Discount */}
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 h-32 flex items-center justify-center">
                  <span className="text-5xl">{product.image}</span>
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount}%
                  </div>
                  {stockPercentage > 75 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Selling fast!
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {product.vendor}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {product.rating}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      ({product.reviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₦{product.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      ₦{product.originalPrice.toLocaleString()}
                    </p>
                  </div>

                  {/* Stock Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {product.sold} sold
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {product.stock} left
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-red-600"
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Time Left */}
                  {hours >= 1 ? (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                      ⏱️ Ends in {hours}h {minutes}m
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                      ⏱️ Ends in {minutes}m
                    </p>
                  )}

                  {/* Add to Cart */}
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Add to Cart
                  </button>

                  {/* View Details */}
                  <button className="w-full py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flash Sale Rules */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4">
            ⚡ Flash Sale Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <p className="font-semibold mb-1">🎁 Member Exclusive</p>
              <p>Only for logged-in COOP members</p>
            </div>
            <div>
              <p className="font-semibold mb-1">⏰ Limited Time</p>
              <p>24 hours or while stock lasts</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📦 Bulk Discounts</p>
              <p>5% extra off on orders 3+ products</p>
            </div>
            <div>
              <p className="font-semibold mb-1">🚚 Free Shipping</p>
              <p>On orders over ₦10,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
