'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => Promise<void>;
  onViewDetails?: (productId: string) => void;
  isLoading?: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  isLoading,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);

  const discountPercentage = product.discount || 0;
  const discountedPrice = product.originalPrice
    ? product.price
    : product.price;
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  const handleAddToCart = async () => {
    if (!onAddToCart) return;

    setIsAdding(true);
    try {
      await onAddToCart(product, quantity);
      setQuantity(1);
      setShowQuantitySelector(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="group rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      style={{
        borderRadius: '12px',
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Image
          src={product.thumbnail || product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={false}
        />

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div
            className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold"
            style={{
              backgroundColor: '#E53E3E',
            }}
          >
            -{discountPercentage}%
          </div>
        )}

        {/* Stock Status */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white font-bold text-center">
              <div className="text-lg">Out of Stock</div>
            </div>
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div
            className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-md text-white"
            style={{
              backgroundColor: AppColors.accent,
            }}
          >
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Seller Name */}
        <div
          style={{
            ...AppTextStyles.bodySmall,
            color: AppColors.textSecondary,
            marginBottom: AppSpacing.xs,
          }}
        >
          {product.sellerName}
        </div>

        {/* Product Name */}
        <h3
          className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
          onClick={() => onViewDetails?.(product.id)}
          style={{
            ...AppTextStyles.labelLarge,
            color: AppColors.textPrimary,
          }}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p
          className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2"
          style={{
            ...AppTextStyles.bodySmall,
          }}
        >
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span
            style={{
              ...AppTextStyles.bodySmall,
              color: AppColors.textSecondary,
            }}
          >
            ({product.reviews})
          </span>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              style={{
                ...AppTextStyles.h4,
                color: AppColors.primary,
              }}
            >
              ₦{discountedPrice.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span
                className="line-through text-gray-400"
                style={{
                  ...AppTextStyles.bodySmall,
                }}
              >
                ₦{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span
              className="text-green-600 text-sm font-semibold"
              style={{
                ...AppTextStyles.bodySmall,
              }}
            >
              Save ₦{savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* Unit Info */}
        {product.unit && (
          <div
            className="text-xs text-gray-500 mb-3"
            style={{
              ...AppTextStyles.bodySmall,
            }}
          >
            Price per {product.unit}
          </div>
        )}

        {/* Stock Indicator */}
        <div className="mb-4">
          <div
            className="text-xs mb-1"
            style={{
              color: product.stock > 10 ? green : product.stock > 0 ? '#D69E2E' : '#E53E3E',
            }}
          >
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(product.stock / (product.maxOrder || 100)) * 100}%`,
                backgroundColor: product.stock > 10 ? '#48BB78' : '#D69E2E',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onViewDetails?.(product.id)}
            className="flex-1 px-3 py-2 border-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            style={{
              borderColor: AppColors.primary,
              color: AppColors.primary,
            }}
            disabled={isLoading}
          >
            View
          </button>

          {product.stock > 0 ? (
            <button
              onClick={() => {
                if (showQuantitySelector) {
                  handleAddToCart();
                } else {
                  setShowQuantitySelector(true);
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm text-white transition-all duration-300 hover:opacity-90"
              style={{
                backgroundColor: AppColors.primary,
              }}
              disabled={isAdding || isLoading}
            >
              {showQuantitySelector ? (
                isAdding ? 'Adding...' : 'Add'
              ) : (
                'Add to Cart'
              )}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm text-gray-400 bg-gray-100 dark:bg-gray-700"
            >
              Unavailable
            </button>
          )}
        </div>

        {/* Quantity Selector */}
        {showQuantitySelector && product.stock > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-gray-600 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-500"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={product.maxOrder || 999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center bg-transparent font-semibold text-sm outline-none"
            />
            <button
              onClick={() =>
                setQuantity(
                  Math.min(product.maxOrder || 999, quantity + 1)
                )
              }
              className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-gray-600 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-500"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const green = '#48BB78';
