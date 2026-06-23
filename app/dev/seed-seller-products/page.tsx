'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/constants/database';

const getDevSellerProductsKey = (sellerId: string) => `dev_seller_products_${sellerId}`;

function loadDevSellerProducts(sellerId: string) {
  if (typeof window === 'undefined') return [] as any[];

  try {
    const raw = window.localStorage.getItem(getDevSellerProductsKey(sellerId));
    if (!raw) return [] as any[];
    return JSON.parse(raw) as any[];
  } catch (error) {
    console.warn('Unable to read saved seller products', error);
    return [] as any[];
  }
}

function saveDevSellerProducts(sellerId: string, products: any[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getDevSellerProductsKey(sellerId), JSON.stringify(products));
  } catch (error) {
    console.warn('Unable to write seller products', error);
  }
}

export default function SeedSellerProductsPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Seeding seller products, please wait...');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawDevUser = window.localStorage.getItem('dev_autologin');
    if (!rawDevUser) {
      setMessage('Dev login session not found. Redirecting to /dev-login...');
      window.setTimeout(() => router.push('/dev-login'), 600);
      return;
    }

    try {
      const devUser = JSON.parse(rawDevUser) as any;
      const role = devUser.currentRole || devUser.selectedRole;
      if (role !== USER_ROLES.SELLER && role !== 'seller') {
        setMessage('Dev session is not a seller role. Redirecting to /dev-login...');
        window.setTimeout(() => router.push('/dev-login'), 800);
        return;
      }

      const sellerId = devUser.uid || 'dev-seller-1';
      const sellerName = devUser.displayName || 'Dev Seller';
      const now = new Date().toISOString();
      const existingProducts = loadDevSellerProducts(sellerId);

      const sampleProducts = [
        {
          id: `local-retail-${Date.now()}-1`,
          name: 'Dev Retail Tomatoes 1kg',
          description: 'Fresh local tomatoes seeded for retail testing.',
          category: 'vegetables',
          type: 'retail',
          price: 1200,
          retailPrice: 1200,
          originalPrice: 1400,
          discount: 14,
          stock: 50,
          unit: 'kg',
          minOrderQuantity: 1,
          status: 'live',
          images: ['https://via.placeholder.com/400x400.png?text=Retail+Tomatoes'],
          thumbnail: 'https://via.placeholder.com/400x400.png?text=Retail+Tomatoes',
          sellerId,
          sellerName,
          ownershipType: 'seller',
          rating: 4.7,
          reviews: 5,
          isFeatured: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `local-wholesale-${Date.now()}-2`,
          name: 'Dev Wholesale Beans 25kg',
          description: 'Seeded wholesale beans for bulk buyer testing.',
          category: 'grains',
          type: 'wholesale',
          price: 45000,
          retailPrice: 45000,
          wholesalePrice: 35000,
          originalPrice: 50000,
          discount: 10,
          stock: 100,
          unit: 'kg',
          minOrderQuantity: 1,
          status: 'live',
          images: ['https://via.placeholder.com/400x400.png?text=Wholesale+Beans'],
          thumbnail: 'https://via.placeholder.com/400x400.png?text=Wholesale+Beans',
          sellerId,
          sellerName,
          ownershipType: 'seller',
          rating: 4.8,
          reviews: 8,
          isFeatured: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];

      const existingIds = new Set(existingProducts.map((product) => product.id));
      const localProducts = [
        ...existingProducts,
        ...sampleProducts.filter((product) => !existingIds.has(product.id)),
      ];

      saveDevSellerProducts(sellerId, localProducts);
      setMessage('Products seeded successfully. Redirecting to seller products...');
      window.setTimeout(() => router.push('/seller/products'), 800);
    } catch (error) {
      console.error('Seed seller products failed', error);
      setMessage('Could not seed seller products. Redirecting to /dev-login...');
      window.setTimeout(() => router.push('/dev-login'), 800);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-xl w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-10 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Seed Seller Products</h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
        <div className="mt-8 text-left text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>• This page creates two local seller product drafts in browser storage.</p>
          <p>• If Firebase is configured, use the seller add page to create live listings instead.</p>
          <p>• If the dev login session is missing, you will be redirected to <code>/dev-login</code>.</p>
        </div>
      </div>
    </div>
  );
}
