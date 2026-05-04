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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-green-50 dark:from-gray-900 dark:to-green-900">
      {/* WHOLESALE HEADER */}
      <div className="bg-[#1E7F4E] text-white border-b border-green-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <img src="/images/logo/NCDFCOOPLOGO.png" alt="NCDFCOOP Logo" className="h-10 w-auto" />
            <span className="text-lg sm:text-2xl font-bold tracking-wide">WHOLESALE BUYER DASHBOARD</span>
          </div>
          <div className="text-sm sm:text-base font-semibold opacity-80">Business Pricing • Bulk Orders • Priority Fulfillment</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bulk Order CTA */}
        <div className="bg-green-100 dark:bg-green-900 rounded-lg p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#155a3a] dark:text-green-200 mb-2">Welcome, {firstName}!</h2>
            <p className="text-gray-700 dark:text-green-100 mb-2">Access exclusive bulk pricing, volume discounts, and dedicated support for your business needs.</p>
            <ul className="list-disc ml-6 text-green-900 dark:text-green-100 text-sm mb-2">
              <li>Bulk pricing on all products</li>
              <li>Minimum order quantities apply</li>
              <li>Priority fulfillment & dedicated support</li>
            </ul>
            <button
              onClick={() => router.push('/wholesale/orders')}
              className="mt-2 px-6 py-2 bg-[#1E7F4E] text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >View Your Wholesale Orders →</button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl">📦</span>
            <span className="text-green-900 dark:text-green-100 font-bold">Business Account</span>
          </div>
        </div>

        {/* Bulk Product Grid */}
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#155a3a] dark:text-green-200 mb-4">Bulk Product Picks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <div key={product.id} style={{ minWidth: 240, maxWidth: 280, margin: '0 auto' }}>
                <ProductCard
                  product={{
                    ...product,
                    price: product.price * 10, // Show bulk price for 10 units as example
                    minOrder: 10,
                    bulkDiscount: 0.15,
                  }}
                  onAddToCart={async (prod, quantity) => {
                    if (!user) {
                      alert('Please sign in to add items to your cart.');
                      return;
                    }
                    if (quantity < 10) {
                      alert('Minimum order for wholesale is 10 units.');
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
                <div className="mt-2 text-xs text-green-800 dark:text-green-200 font-semibold">Min Order: 10 units • Bulk Discount: 15%</div>
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
            >View All Benefits</button>
          </div>
        </div>
      </div>
    </div>
  );
}
