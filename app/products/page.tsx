"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getProductPage } from '@/lib/services/productService';
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Intelligence: Determine if we should show wholesale or retail listings
  const productViewType = useMemo(() => {
    if (!currentRole) return 'retail';
    return currentRole === USER_ROLES.INSTITUTIONAL_BUYER
      ? 'wholesale' 
      : 'retail';
  }, [currentRole]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getProductPage({ limit: 24, type: productViewType, search: searchParams.get('q') || '', category });
      setProducts(result.products);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, productViewType, category]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredProducts = products;

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) params.set('q', searchTerm.trim()); else params.delete('q');
    router.push(`/products${params.toString() ? `?${params}` : ''}`);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      const result = await getProductPage({ limit: 24, type: productViewType, search: searchParams.get('q') || '', category, cursor: nextCursor });
      setProducts((current) => [...current, ...result.products.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'More products could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

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

        <form onSubmit={submitSearch} className="mb-6 flex gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search the live marketplace" aria-label="Search products" className="min-h-11 flex-1 rounded-xl px-4 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
          <button className="rounded-xl bg-emerald-700 px-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800">Search</button>
        </form>

        <ProductList 
          products={filteredProducts} 
          isLoading={isLoading} 
          onViewDetails={(id) => router.push(`/products/${id}`)}
        />
        {nextCursor && <button onClick={() => void loadMore()} disabled={loadingMore} className="mx-auto mt-8 block min-h-11 rounded-xl border border-emerald-700 bg-white px-6 font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:opacity-50">{loadingMore ? 'Loading…' : 'Load more products'}</button>}
      </div>
    </div>
  );
}
