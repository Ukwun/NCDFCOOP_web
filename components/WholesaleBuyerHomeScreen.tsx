'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { addToCart } from '@/lib/services/cartService';
import ProductCard from './ProductCard';
import GlobalUtilityLayer from './GlobalUtilityLayer';

const WHOLESALE_PRODUCTS = [
  {
    id: 'wholesale-p1',
    name: 'Bulk Garri Crates',
    description: 'Commercial-grade garri supply package for institutional buyers.',
    price: 99000,
    originalPrice: 116000,
    discount: 15,
    category: 'Grains',
    stock: 120,
    sellerId: 'wholesale-network-1',
    sellerName: 'NCDF Bulk Grain Desk',
    rating: 4.8,
    reviews: 204,
    images: ['/images/Bag of garri1.png'],
    thumbnail: '/images/Bag of garri1.png',
    unit: 'crate',
    createdAt: new Date(),
  },
  {
    id: 'wholesale-p2',
    name: 'Institutional Palm Oil Pack',
    description: 'High-volume palm oil inventory for kitchen and retail operations.',
    price: 128000,
    originalPrice: 149000,
    discount: 14,
    category: 'Oils',
    stock: 85,
    sellerId: 'wholesale-network-2',
    sellerName: 'Agro Supply Core',
    rating: 4.7,
    reviews: 158,
    images: ['/images/Palm Oil.png'],
    thumbnail: '/images/Palm Oil.png',
    unit: 'batch',
    createdAt: new Date(),
  },
  {
    id: 'wholesale-p3',
    name: 'Cassava Flour Production Set',
    description: 'Wholesale flour lots for production teams and B2B procurement.',
    price: 87000,
    originalPrice: 102000,
    discount: 15,
    category: 'Grains',
    stock: 93,
    sellerId: 'wholesale-network-3',
    sellerName: 'FarmersDirect B2B',
    rating: 4.6,
    reviews: 117,
    images: ['/images/Cassava Flour.png'],
    thumbnail: '/images/Cassava Flour.png',
    unit: 'lot',
    createdAt: new Date(),
  },
  {
    id: 'wholesale-p4',
    name: 'Commercial Egg Carton Grid',
    description: 'Consistent high-volume egg inventory for institutions.',
    price: 76000,
    originalPrice: 90500,
    discount: 16,
    category: 'Proteins',
    stock: 64,
    sellerId: 'wholesale-network-4',
    sellerName: 'Protein Logistics Hub',
    rating: 4.7,
    reviews: 139,
    images: ['/images/Eggs (30pc).png'],
    thumbnail: '/images/Eggs (30pc).png',
    unit: 'grid',
    createdAt: new Date(),
  },
];

export default function WholesaleBuyerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const wholesaleSummary = useMemo(() => {
    const monthlyProcurement = 4250000;
    const fulfillmentRate = 96;
    const openRfqs = 7;
    const complianceGrade = 'A-';

    return { monthlyProcurement, fulfillmentRate, openRfqs, complianceGrade };
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <GlobalUtilityLayer
          role="institutional_buyer"
          kpiSummary={`Fulfillment ${wholesaleSummary.fulfillmentRate}% • Open RFQs ${wholesaleSummary.openRfqs} • Compliance ${wholesaleSummary.complianceGrade}`}
        />

        <section className="rounded-2xl bg-gradient-to-r from-[#164A2E] via-[#1E7F4E] to-[#2A9B61] text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Wholesale Operations Console</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Institutional Procurement Hub</h1>
              <p className="mt-2 text-sm sm:text-base opacity-90 max-w-2xl">
                Infrastructure-first control panel for compliance, sourcing, and high-volume procurement.
                Discover products, execute repeat orders, and monitor risk alerts in one operational surface.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <button onClick={() => router.push('/wholesale/orders')} className="px-4 py-3 rounded-xl bg-white text-[#164A2E] font-semibold text-sm hover:bg-[#E8F6EE] transition-colors">
                Orders Console
              </button>
              <button onClick={() => router.push('/cart')} className="px-4 py-3 rounded-xl bg-[#12643D] text-white font-semibold text-sm hover:bg-[#0F5634] transition-colors">
                Bulk Cart
              </button>
              <button onClick={() => router.push('/products')} className="px-4 py-3 rounded-xl bg-[#12643D] text-white font-semibold text-sm hover:bg-[#0F5634] transition-colors">
                Source Products
              </button>
              <button onClick={() => router.push('/settings')} className="px-4 py-3 rounded-xl bg-white text-[#164A2E] font-semibold text-sm hover:bg-[#E8F6EE] transition-colors">
                Team Settings
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly Procurement</p>
            <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">₦{wholesaleSummary.monthlyProcurement.toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Fulfillment Rate</p>
            <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">{wholesaleSummary.fulfillmentRate}%</p>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Open RFQs</p>
            <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">{wholesaleSummary.openRfqs}</p>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Compliance Grade</p>
            <p className="text-2xl font-bold text-[#164A2E] dark:text-[#8FD8AE] mt-1">{wholesaleSummary.complianceGrade}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Institutional Supply Picks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Curated for recurring wholesale demand and operational continuity.</p>
            </div>
            <button
              onClick={() => router.push('/wholesale/orders')}
              className="px-4 py-2 rounded-lg bg-[#164A2E] hover:bg-[#0F3521] text-white text-sm font-medium"
            >
              Open Procurement Queue
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHOLESALE_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
                onViewDetails={(productId) => router.push(`/products/${productId}`)}
                onAddToCart={async (prod, quantity) => {
                  if (!user) {
                    router.push('/signin');
                    return;
                  }

                  const effectiveQty = Math.max(10, quantity);
                  await addToCart(
                    user.uid,
                    prod.id,
                    prod.name,
                    prod.price,
                    prod.thumbnail || prod.images?.[0] || '',
                    effectiveQty
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
