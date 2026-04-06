'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { useFavorites, useActivityTracking } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/authContext';
import { Heart } from 'lucide-react';

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
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const { isFavorited, toggleFavorite } = useFavorites({
    userId: user?.uid || '',
  });
  const { trackProductView, trackAddToCart } = useActivityTracking({
    userId: user?.uid || '',
  });

  const discountPercentage = product.discount || 0;
  const discountedPrice = product.price;
  const originalPrice = product.originalPrice || 0;
  const savings = originalPrice - product.price;

  const handleAddToCart = async () => {
    if (!onAddToCart) return;

    setIsAdding(true);
    try {
      // Track add to cart
      await trackAddToCart(product.id, quantity, product.price);
      
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
      <div 
        className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onViewDetails?.(product.id)}
      >
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            onError={(e) => {
              // Image failed to load, show placeholder
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <div
            className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            style={{
              backgroundColor: '#E53E3E',
            }}
          >
            -{product.discount}%
          </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div
            className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full text-white shadow-lg"
            style={{
              backgroundColor: AppColors.accent,
            }}
          >
            ⭐ Featured
          </div>
        )}

        {/* Stock Status Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <div className="text-white font-bold text-center">
              <div className="text-xl">❌ Out of Stock</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Seller Name */}
        <div
          className="text-xs font-semibold mb-2 px-2 py-1 inline-block rounded-full"
          style={{
            backgroundColor: '#F0F0F0',
            color: AppColors.textSecondary,
          }}
        >
          🏪 {product.sellerName}
        </div>

        {/* Product Name */}
        <h3
          className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer hover:underline"
          onClick={() => onViewDetails?.(product.id)}
          style={{
            ...AppTextStyles.labelLarge,
            color: AppColors.textPrimary,
            fontSize: '14px',
          }}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p
          className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed"
          style={{
            ...AppTextStyles.bodySmall,
            fontSize: '12px',
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
                  i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
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
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              ₦{discountedPrice.toLocaleString()}
            </span>
            {originalPrice > 0 && originalPrice > discountedPrice && (
              <span
                className="line-through text-gray-400"
                style={{
                  ...AppTextStyles.bodySmall,
                  fontSize: '12px',
                }}
              >
                ₦{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {savings > 0 && (
            <span
              className="text-green-600 text-xs font-bold inline-block"
              style={{
                ...AppTextStyles.bodySmall,
              }}
            >
              💚 Save ₦{savings.toLocaleString()}
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
            className="text-xs mb-1 font-semibold"
            style={{
              color: product.stock > 10 ? '#48BB78' : product.stock > 0 ? '#D69E2E' : '#E53E3E',
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
            onClick={() => {
              // Track product view
              trackProductView(product.id, product.name);
              onViewDetails?.(product.id);
            }}
            className="flex-1 px-3 py-2.5 border-2 rounded-lg font-bold text-xs transition-all duration-300 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95"
            style={{
              borderColor: AppColors.primary,
              color: AppColors.primary,
            }}
            disabled={isLoading}
            title="View product details"
          >
            👁️ View
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
              className="flex-1 px-3 py-2.5 rounded-lg font-bold text-xs text-white transition-all duration-300 hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: AppColors.primary,
              }}
              disabled={isAdding || isLoading}
              title="Add product to shopping cart"
            >
              {showQuantitySelector ? (
                isAdding ? '⏳ Adding...' : '✅ Add'
              ) : (
                '🛒 Add to Cart'
              )}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 px-3 py-2.5 rounded-lg font-bold text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              title="This product is out of stock"
            >
              Unavailable
            </button>
          )}

          {/* Favorite Button */}
          <button
            onClick={async () => {
              if (user) {
                await toggleFavorite(product.id, {
                  productName: product.name,
                  productPrice: product.price,
                  productImage: product.thumbnail || product.images[0],
                  productCategory: product.category,
                  sellerId: product.sellerId,
                  sellerName: product.sellerName,
                });
              }
            }}
            className="px-3 py-2.5 rounded-lg border-2 transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              borderColor: isFavorited(product.id) ? '#E53E3E' : AppColors.primary,
              backgroundColor: isFavorited(product.id) ? '#FFE8E8' : 'transparent',
            }}
            title={user ? (isFavorited(product.id) ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to favorite'}
            disabled={!user}
          >
            <Heart
              size={18}
              fill={isFavorited(product.id) ? '#E53E3E' : 'none'}
              color={isFavorited(product.id) ? '#E53E3E' : AppColors.primary}
            />
          </button>
        </div>

        {/* Quantity Selector */}
        {showQuantitySelector && product.stock > 0 && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2" style={{
            backgroundColor: '#F5F5F5',
            borderColor: AppColors.primary,
          }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 flex items-center justify-center rounded font-bold text-sm transition-all active:scale-90"
              style={{
                backgroundColor: 'white',
                color: AppColors.primary,
                border: `2px solid ${AppColors.primary}`,
              }}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={product.maxOrder || 999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 text-center bg-transparent font-bold text-sm outline-none"
            />
            <button
              onClick={() =>
                setQuantity(
                  Math.min(product.maxOrder || 999, quantity + 1)
                )
              }
              className="w-7 h-7 flex items-center justify-center rounded font-bold text-sm transition-all active:scale-90"
              style={{
                backgroundColor: AppColors.primary,
                color: 'white',
              }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
