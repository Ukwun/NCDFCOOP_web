"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getProducts, searchProducts } from '@/lib/services/productService';
import ProductList from '@/components/ProductList';
import { Product } from '@/lib/types/product';
import { USER_ROLES } from '@/lib/constants/database';
import { AppColors } from '@/lib/theme';
import { resolveProductOwnership } from '@/lib/utils/productOwnership';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, currentRole } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [error, setError] = useState<string | null>(null);

  // Intelligence: Determine if we should show wholesale or retail listings
  const productViewType = useMemo(() => {
    if (!currentRole) return 'retail';
    return (currentRole === USER_ROLES.INSTITUTIONAL_BUYER || currentRole === 'wholesale_buyer') 
      ? 'wholesale' 
      : 'retail';
  }, [currentRole]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryTerm = searchParams.get('q')?.trim();
      let result;
      if (queryTerm) {
        result = await searchProducts(queryTerm, productViewType);
      } else {
        result = await getProducts(100, productViewType);
      }
      setProducts(result);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, productViewType]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = category === 'All' || p.category === category;
      return matchesCategory;
    });
  }, [products, category]);

  const stats = useMemo(() => {
    const ncdf = products.filter((p) => resolveProductOwnership(p) === 'ncdf').length;
    return {
      all: products.length,
      ncdf,
      seller: Math.max(0, products.length - ncdf),
    };
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ backgroundColor: AppColors.background }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {productViewType === 'wholesale' ? 'Institutional Bulk Catalog' : 'Marketplace'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover products verified for the cooperative ecosystem.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium">
              Total: {stats.all}
            </div>
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800 text-xs font-medium">
              NCDF Direct: {stats.ncdf}
            </div>
            <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full border border-green-100 dark:border-green-800 text-xs font-medium">
              Seller Marketplace: {stats.seller}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <ProductList 
          products={filteredProducts} 
          isLoading={isLoading} 
          onViewDetails={(id) => router.push(`/products/${id}`)}
        />
      </div>
    </div>
  );
}