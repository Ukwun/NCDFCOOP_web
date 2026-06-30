'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { useFavorites, useActivityTracking } from '@/lib/hooks';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES } from '@/lib/constants/database';
import { Heart } from 'lucide-react';
import {
  ownershipBadgeClasses,
  ownershipLabel,
  resolveProductOwnership,
} from '@/lib/utils/productOwnership';
import { addToCart } from '@/lib/services/cartService';
import { applyMemberDiscount, getMembershipTier } from '@/lib/membership/tiers';

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
  const router = useRouter();
  const { user, currentRole } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [recentCartLabel, setRecentCartLabel] = useState<string | null>(null);
  const { isFavorited, toggleFavorite } = useFavorites({
    userId: user?.uid || '',
  });
  const { trackProductView, trackAddToCart } = useActivityTracking({
    userId: user?.uid || '',
  });

  const discountPercentage = product.discount || 0;
  const discountedPrice = product.price && product.price > 0
    ? product.price
    : product.originalPrice && product.originalPrice > 0
      ? Math.max(100, Math.round(product.originalPrice * 0.85))
      : 0;
  const originalPrice = product.originalPrice || 0;
  const discountValue = originalPrice > discountedPrice ? originalPrice - discountedPrice : 0;
  const cartPrice = discountedPrice > 0 ? discountedPrice : originalPrice > 0 ? originalPrice : 0;
  const ownershipType = resolveProductOwnership(product);

  // Intelligence: Determine if viewing as a wholesale buyer
  const isWholesaleBuyer = currentRole === USER_ROLES.INSTITUTIONAL_BUYER;
  const showWholesaleInfo = isWholesaleBuyer && (product.type === 'wholesale' || product.type === 'both');
  const isActiveMember =
    currentRole === USER_ROLES.MEMBER && user?.membershipStatus === 'active';
  const memberTier = getMembershipTier(user?.memberTier);
  
  // Logic: Use wholesale price if applicable
  const displayPrice = showWholesaleInfo && product.wholesalePrice
    ? product.wholesalePrice
    : isActiveMember
      ? applyMemberDiscount(cartPrice, memberTier.id)
      : cartPrice;

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/signin?reason=cart');
      return;
    }
    if (displayPrice <= 0) return;

    // Intelligence: Automatically apply MOQ for wholesale buyers
    const quantity = showWholesaleInfo ? (product.minOrderQuantity || 1) : 1;

    setIsAdding(true);
    try {
      await trackAddToCart(product.id, quantity, displayPrice);
      if (onAddToCart) {
        await onAddToCart({ ...product, price: displayPrice }, quantity);
      } else {
        await addToCart(
          user.uid,
          product.id,
          product.name,
          displayPrice,
          product.thumbnail || product.images?.[0] || '',
          quantity
        );
      }
      setRecentCartLabel('Added');
      window.setTimeout(() => setRecentCartLabel(null), 1500);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="group rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 ease-out hover:scale-[1.01] flex flex-col h-full motion-reduce:transform-none"
      style={{
        borderRadius: '18px',
      }}
    >
      {/* Image Container */}
      <div 
            className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:shadow-md transition-shadow cursor-pointer motion-safe:transform-gpu"
        onClick={() => onViewDetails?.(product.id)}
      >
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            onError={(e) => {
              // Image failed to load, show placeholder
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <img src="/images/logo/NCDFCOOPLOGO.png" alt="NCDFCOOP Logo" className="h-16 w-auto" />
          </div>
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
        {/* Ownership + Seller */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${ownershipBadgeClasses(ownershipType)}`}>
            {ownershipLabel(ownershipType)}
          </div>
          <div
            className="text-xs font-semibold px-2 py-1 inline-flex items-center gap-1 rounded-full"
            style={{
              backgroundColor: '#F0F0F0',
              color: AppColors.textSecondary,
            }}
          >
            <img src="/images/logo/NCDFCOOPLOGO.png" alt="NCDFCOOP Logo" className="inline h-4 w-auto align-middle mr-1" style={{marginRight: '4px'}} />
            {product.sellerName || 'NCDFCOOP'}
          </div>
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

        {/* Wholesale info (MOQ) - Intelligence Layer */}
        {showWholesaleInfo && product.minOrderQuantity && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-1">
            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              📦 Wholesale Bulk Deal
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
              Min. Order: {product.minOrderQuantity} {product.unitOfMeasure || product.unit || 'units'}
            </p>
          </div>
        )}

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex flex-col mb-1">
            <div className="flex items-baseline gap-2">
            <span
              style={{
                ...AppTextStyles.h4,
                color: showWholesaleInfo ? '#2B6CB0' : AppColors.primary,
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >              ₦{displayPrice.toLocaleString()}
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
            {showWholesaleInfo && (
              <span className="text-[10px] text-blue-600 font-bold uppercase">Institutional Bulk Rate</span>
            )}
            {isActiveMember && !showWholesaleInfo && (
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                {memberTier.name} member price · {memberTier.discountPercentage}% off
              </span>
            )}
          </div>
          {discountValue > 0 && (
            <span
              className="text-green-600 text-xs font-bold inline-block"
              style={{
                ...AppTextStyles.bodySmall,
              }}
            >
              Discount ₦{discountValue.toLocaleString()}
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
            className="flex-1 px-3 py-2.5 border-2 rounded-lg font-bold text-xs transition-all duration-300 hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 hover:-translate-y-0.5 motion-reduce:transform-none"
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
              onClick={handleAddToCart}
              className="flex-1 px-3 py-2.5 rounded-lg font-bold text-xs text-white transition-all duration-300 hover:shadow-xl active:scale-95 hover:-translate-y-0.5"
              style={{ backgroundColor: AppColors.primary }}
              disabled={isAdding || isLoading}
              title="Add product to shopping cart"
            >
              {isAdding ? '⏳ Adding...' : recentCartLabel ? '✓ Added' : '🛒 Add to Cart'}
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
              if (!user) {
                router.push('/signin?reason=favorite');
                return;
              }

              if (isTogglingFavorite) return;

              setIsTogglingFavorite(true);
              try {
                await toggleFavorite(product.id, {
                  productName: product.name,
                  productPrice: discountedPrice,
                  productImage: product.thumbnail || product.images?.[0] || '',
                  productCategory: product.category || 'general',
                  sellerId: product.sellerId || 'unknown-seller',
                  sellerName: product.sellerName || 'Unknown Seller',
                });
              } finally {
                setIsTogglingFavorite(false);
              }
            }}
            className="px-3 py-2.5 rounded-lg border-2 transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              borderColor: isFavorited(product.id) ? '#E53E3E' : AppColors.primary,
              backgroundColor: isFavorited(product.id) ? '#FFE8E8' : 'transparent',
            }}
            title={user ? (isFavorited(product.id) ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to favorite'}
            disabled={isTogglingFavorite}
            aria-pressed={isFavorited(product.id)}
          >
            {isTogglingFavorite ? (
              <span className="text-[11px] font-bold text-gray-500">...</span>
            ) : (
              <Heart
                size={18}
                fill={isFavorited(product.id) ? '#E53E3E' : 'none'}
                color={isFavorited(product.id) ? '#E53E3E' : AppColors.primary}
              />
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
