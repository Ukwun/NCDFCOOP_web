'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { getProduct } from '@/lib/services/productService';
import { addToCart } from '@/lib/services/cartService';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!productId) {
          setError('Product not found');
          return;
        }

        const data = await getProduct(productId);
        if (!data) {
          setError('Product not found');
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/welcome');
      return;
    }

    if (!product) return;

    try {
      setIsAdding(true);
      await addToCart(user.uid, product.id, product.name, product.price, product.images[0], quantity);
      alert(`${product.name} added to cart!`);
      setQuantity(1);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div
            className="w-8 h-8 border-4 border-gray-300 rounded-full"
            style={{
              borderTopColor: AppColors.primary,
            }}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            {error || 'Product not found'}
          </h2>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 rounded-lg text-white font-semibold"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const discountPercentage = product.discount || 0;
  const savings = product.originalPrice ? product.originalPrice - product.price : 0;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-semibold"
          style={{
            color: AppColors.primary,
          }}
        >
          ← Back
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images Section */}
          <div>
            {/* Main Image */}
            <div
              className="relative aspect-square rounded-lg overflow-hidden mb-4"
              style={{
                backgroundColor: AppColors.border,
              }}
            >
              <Image
                src={product.images[selectedImage] || product.thumbnail || product.images[0] || ''}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {discountPercentage > 0 && (
                <div
                  className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg text-lg font-bold"
                  style={{
                    backgroundColor: '#E53E3E',
                  }}
                >
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImage === index ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                    style={{
                      borderColor:
                        selectedImage === index
                          ? AppColors.primary
                          : AppColors.border,
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            {/* Seller Info */}
            <div className="mb-4">
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                }}
              >
                Sold by{' '}
                <span style={{ color: AppColors.primary, fontWeight: 'bold' }}>
                  {product.sellerName}
                </span>
              </p>
            </div>

            {/* Title */}
            <h1
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
              }}
            >
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-2xl ${
                      i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span
                style={{
                  ...AppTextStyles.bodyMedium,
                  color: AppColors.textSecondary,
                }}
              >
                {(product.rating || 0).toFixed(1)} ({product.reviews || 0} reviews)
              </span>
            </div>

            {/* Price Section */}
            <div
              className="p-6 rounded-lg mb-6"
              style={{
                backgroundColor: AppColors.surface,
                border: `1px solid ${AppColors.border}`,
              }}
            >
              <div className="flex items-baseline gap-4 mb-4">
                <span
                  style={{
                    ...AppTextStyles.h2,
                    color: AppColors.primary,
                  }}
                >
                  ₦{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span
                    className="line-through"
                    style={{
                      ...AppTextStyles.bodyLarge,
                      color: AppColors.textSecondary,
                    }}
                  >
                    ₦{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <p
                  className="text-green-600 font-semibold"
                  style={{
                    ...AppTextStyles.bodyMedium,
                  }}
                >
                  Save ₦{savings.toLocaleString()} ({discountPercentage}%)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  marginBottom: AppSpacing.sm,
                }}
              >
                About this product
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodyMedium,
                  color: AppColors.textSecondary,
                  lineHeight: '1.6',
                }}
              >
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div
              className="p-6 rounded-lg mb-6 space-y-3"
              style={{
                backgroundColor: AppColors.surface,
                border: `1px solid ${AppColors.border}`,
              }}
            >
              {product.unit && (
                <div className="flex justify-between">
                  <span style={{ color: AppColors.textSecondary }}>Unit:</span>
                  <span style={{ color: AppColors.textPrimary, fontWeight: 'bold' }}>
                    {product.unit}
                  </span>
                </div>
              )}
              {product.minOrder && (
                <div className="flex justify-between">
                  <span style={{ color: AppColors.textSecondary }}>Min. Order:</span>
                  <span style={{ color: AppColors.textPrimary, fontWeight: 'bold' }}>
                    {product.minOrder}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: AppColors.textSecondary }}>In Stock:</span>
                <span
                  style={{
                    color: product.stock > 0 ? '#48BB78' : '#E53E3E',
                    fontWeight: 'bold',
                  }}
                >
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Quantity & CTA */}
            {product.stock > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span style={{ ...AppTextStyles.bodyMedium, color: AppColors.textPrimary }}>
                    Quantity:
                  </span>
                  <div className="flex items-center border-2 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{
                        fontSize: '20px',
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.maxOrder || 999}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-20 text-center outline-none bg-transparent"
                      style={{
                        ...AppTextStyles.bodyMedium,
                      }}
                    />
                    <button
                      onClick={() =>
                        setQuantity(Math.min(product.maxOrder || 999, quantity + 1))
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{
                        fontSize: '20px',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full py-4 rounded-lg text-white font-bold text-lg transition-all hover:shadow-lg disabled:opacity-50"
                  style={{
                    backgroundColor: AppColors.primary,
                  }}
                >
                  {isAdding ? 'Adding to cart...' : 'Add to Cart'}
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-4 rounded-lg bg-gray-300 text-gray-600 font-bold text-lg cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
