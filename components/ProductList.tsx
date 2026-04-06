'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

interface ProductListProps {
  products: Product[];
  isLoading?: boolean;
  onAddToCart?: (product: Product, quantity: number) => Promise<void>;
  onViewDetails?: (productId: string) => void;
  title?: string;
  showPagination?: boolean;
  itemsPerPage?: number;
}

export default function ProductList({
  products,
  isLoading,
  onAddToCart,
  onViewDetails,
  title,
  showPagination = false,
  itemsPerPage = 12,
}: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

  return (
    <div className="w-full">
      {/* Title */}
      {title && (
        <div className="mb-6">
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            {title}
          </h2>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4" style={{ fontSize: '48px' }}>
            📦
          </div>
          <h3
            style={{
              ...AppTextStyles.h3,
              color: AppColors.textSecondary,
              marginBottom: AppSpacing.sm,
            }}
          >
            No products found
          </h3>
          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
            }}
          >
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Pagination */}
          {showPagination && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  borderColor: AppColors.primary,
                  color: currentPage === 1 ? AppColors.border : AppColors.primary,
                }}
              >
                ← Previous
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                const showPage =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                if (!showPage && pageNum !== 2 && pageNum !== totalPages - 1) {
                  return null;
                }

                if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span
                      key={pageNum}
                      className="px-1"
                      style={{ color: AppColors.textSecondary }}
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10 h-10 rounded-lg font-semibold transition-all"
                    style={{
                      backgroundColor:
                        pageNum === currentPage
                          ? AppColors.primary
                          : 'transparent',
                      color:
                        pageNum === currentPage
                          ? 'white'
                          : AppColors.textPrimary,
                      border:
                        pageNum === currentPage
                          ? 'none'
                          : `2px solid ${AppColors.border}`,
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  borderColor: AppColors.primary,
                  color:
                    currentPage === totalPages
                      ? AppColors.border
                      : AppColors.primary,
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Results info */}
          {showPagination && totalPages > 0 && (
            <div
              className="text-center mt-4"
              style={{
                ...AppTextStyles.bodySmall,
                color: AppColors.textSecondary,
              }}
            >
              Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of{' '}
              {products.length} products
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(itemsPerPage)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse aspect-square"
            />
          ))}
        </div>
      )}
    </div>
  );
}
