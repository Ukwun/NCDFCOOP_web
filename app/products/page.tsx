'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getProducts, searchProducts } from '@/lib/services/productService';
import { addToCart } from '@/lib/services/cartService';
import ProductList from '@/components/ProductList';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular' | 'rating'>('newest');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getProducts(100);
        setProducts(result);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const displayedProducts = useMemo(() => {
    const cloned = [...products];

    switch (sortBy) {
      case 'price-low':
        cloned.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        cloned.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'popular':
        cloned.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case 'rating':
        cloned.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        cloned.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
          return bTime - aTime;
        });
        break;
    }

    return cloned;
  }, [products, sortBy]);

  const handleAddToCart = async (product: Product, quantity: number) => {
    if (!user) {
      router.push('/welcome');
      return;
    }

    try {
      await addToCart(
        user.uid,
        product.id,
        product.name,
        product.price,
        product.images?.[0] || product.thumbnail || '',
        quantity
      );
      alert(`${product.name} added to cart`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleSearch = async () => {
    try {
      if (!searchTerm.trim()) {
        setIsLoading(true);
        const result = await getProducts(100);
        setProducts(result);
        return;
      }

      setIsLoading(true);
      const result = await searchProducts(searchTerm.trim());
      setProducts(result);
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ backgroundColor: AppColors.background }}>
      <div className="py-8 md:py-12" style={{ backgroundColor: AppColors.surface, borderBottom: `1px solid ${AppColors.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 style={{ ...AppTextStyles.h1, color: AppColors.textPrimary, marginBottom: AppSpacing.md }}>Browse Products</h1>
          <p style={{ ...AppTextStyles.bodyLarge, color: AppColors.textSecondary }}>
            Explore verified products from trusted sellers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none dark:bg-gray-800 dark:text-white"
                  style={{ borderColor: AppColors.border, backgroundColor: AppColors.surface }}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: AppColors.primary }}
                >
                  Search
                </button>
              </div>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border-2 rounded-lg focus:outline-none dark:bg-gray-800 dark:text-white"
              style={{ borderColor: AppColors.border, backgroundColor: AppColors.surface }}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {error && (
            <div className="p-4 rounded-lg text-white mb-6" style={{ backgroundColor: '#E53E3E' }}>
              {error}
            </div>
          )}
        </div>

        <ProductList
          products={displayedProducts}
          isLoading={isLoading}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
          title="All Products"
          showPagination={true}
          itemsPerPage={12}
        />
      </div>
    </div>
  );
}
