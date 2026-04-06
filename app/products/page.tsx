'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getProducts } from '@/lib/services/productService';
import { addToCart } from '@/lib/services/cartService';
import ProductList from '@/components/ProductList';
import { Product, ProductFilter } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function ProductsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilter>({
    sortBy: 'newest',
    limit: 20,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getProducts(filters);
        setProducts(result.products);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleAddToCart = async (product: Product, quantity: number) => {
    if (!user) {
      router.push('/welcome');
      return;
    }

    try {
      await addToCart(user.uid, product, quantity);
      // Show success toast/notification
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm,
      offset: 0,
    });
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Header */}
      <div
        className="py-8 md:py-12"
        style={{
          backgroundColor: AppColors.surface,
          borderBottom: `1px solid ${AppColors.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            style={{
              ...AppTextStyles.h1,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            Browse Products
          </h1>
          <p
            style={{
              ...AppTextStyles.bodyLarge,
              color: AppColors.textSecondary,
            }}
          >
            Explore our wide selection of quality products from trusted sellers
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                    backgroundColor: AppColors.surface,
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: AppColors.primary,
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as any,
                  offset: 0,
                })
              }
              className="px-4 py-3 border-2 rounded-lg focus:outline-none dark:bg-gray-800 dark:text-white"
              style={{
                borderColor: AppColors.border,
                backgroundColor: AppColors.surface,
              }}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="p-4 rounded-lg text-white mb-6"
              style={{
                backgroundColor: '#E53E3E',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <ProductList
          products={products}
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
