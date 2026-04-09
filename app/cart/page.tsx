'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/authContext';
import { getUserCart, removeFromCart, updateCartItemQuantity, clearCart } from '@/lib/services/cartService';
import { Cart } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const cartData = await getUserCart(user.uid);
        setCart(cartData);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load cart');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        router.push('/welcome');
      } else {
        fetchCart();
      }
    }
  }, [user, authLoading, router]);

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || !cart) return;

    try {
      setIsUpdating(true);
      await updateCartItemQuantity(user.uid, productId, newQuantity);
      // Fetch updated cart
      const updatedCart = await getUserCart(user.uid);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Failed to update quantity');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!user || !cart) return;

    if (!confirm('Remove this item from cart?')) return;

    try {
      setIsUpdating(true);
      await removeFromCart(user.uid, productId);
      // Fetch updated cart
      const updatedCart = await getUserCart(user.uid);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (!user) return;

    if (!confirm('Clear entire cart?')) return;

    try {
      setIsUpdating(true);
      await clearCart(user.uid);
      setCart(null);
    } catch (err) {
      console.error('Error clearing cart:', err);
      alert('Failed to clear cart');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    router.push('/checkout');
  };

  if (authLoading || isLoading) {
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

  if (!user) {
    return null;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Header */}
      <div
        className="py-8 border-b"
        style={{
          backgroundColor: AppColors.surface,
          borderColor: AppColors.border,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            style={{
              ...AppTextStyles.h1,
              color: AppColors.textPrimary,
            }}
          >
            Shopping Cart
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {isEmpty ? (
          <div className="text-center py-12">
            <div
              className="text-6xl mb-4"
            >
              🛒
            </div>
            <h2
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
              }}
            >
              Your cart is empty
            </h2>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.xl,
              }}
            >
              Explore our products and add items to get started
            </p>
            <button
              onClick={() => router.push('/products')}
              className="px-8 py-3 rounded-lg text-white font-semibold"
              style={{
                backgroundColor: AppColors.primary,
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: AppColors.surface,
                  borderColor: AppColors.border,
                }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2
                    style={{
                      ...AppTextStyles.h3,
                      color: AppColors.textPrimary,
                    }}
                  >
                    Items ({cart.items.length})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    disabled={isUpdating}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold disabled:opacity-50"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-4 pb-6 border-b"
                      style={{
                        borderColor: AppColors.border,
                      }}
                    >
                      {/* Product Image */}
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {item.productData?.thumbnail && (
                          <Image
                            src={item.productData.thumbnail}
                            alt={item.productData.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3
                          style={{
                            ...AppTextStyles.labelLarge,
                            color: AppColors.textPrimary,
                            marginBottom: AppSpacing.xs,
                          }}
                        >
                          {item.productData?.name || 'Product'}
                        </h3>
                        <p
                          style={{
                            ...AppTextStyles.bodySmall,
                            color: AppColors.textSecondary,
                            marginBottom: AppSpacing.sm,
                          }}
                        >
                          ₦{item.price.toLocaleString()}
                        </p>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 border-2 rounded-lg w-fit">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity === 1}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.productId,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            disabled={isUpdating}
                            className="w-12 text-center outline-none bg-transparent"
                            style={{
                              ...AppTextStyles.labelLarge,
                            }}
                          />
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price & Remove */}
                      <div className="text-right flex flex-col gap-2">
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.h4,
                              color: AppColors.primary,
                            }}
                          >
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div
                className="rounded-lg p-6 border sticky top-4"
                style={{
                  backgroundColor: AppColors.surface,
                  borderColor: AppColors.border,
                }}
              >
                <h2
                  style={{
                    ...AppTextStyles.h3,
                    color: AppColors.textPrimary,
                    marginBottom: AppSpacing.lg,
                  }}
                >
                  Order Summary
                </h2>

                <div className="space-y-4 pb-6 border-b"
                  style={{
                    borderColor: AppColors.border,
                  }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: AppColors.textSecondary }}>Subtotal</span>
                    <span
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                    >
                      ₦{cart.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: AppColors.textSecondary }}>Tax (VAT)</span>
                    <span
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                    >
                      ₦{cart.tax.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: AppColors.textSecondary }}>Shipping</span>
                    <span
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: cart.shipping === 0 ? '#48BB78' : AppColors.textPrimary,
                        fontWeight: cart.shipping === 0 ? 'bold' : 'normal',
                      }}
                    >
                      {cart.shipping === 0 ? 'FREE' : `₦${cart.shipping.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div
                  className="flex justify-between py-6 border-b"
                  style={{
                    borderColor: AppColors.border,
                  }}
                >
                  <span
                    style={{
                      ...AppTextStyles.h3,
                      color: AppColors.textPrimary,
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      ...AppTextStyles.h2,
                      color: AppColors.primary,
                    }}
                  >
                    ₦{cart.total.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isUpdating}
                  className="w-full mt-6 py-4 rounded-lg text-white font-bold transition-all hover:shadow-lg disabled:opacity-50"
                  style={{
                    backgroundColor: AppColors.primary,
                  }}
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => router.push('/products')}
                  className="w-full mt-3 py-3 rounded-lg font-semibold border-2 transition-all"
                  style={{
                    borderColor: AppColors.primary,
                    color: AppColors.primary,
                  }}
                >
                  Continue Shopping
                </button>

                {/* Shipping Info */}
                <div
                  className="mt-6 p-4 rounded-lg text-sm"
                  style={{
                    backgroundColor: AppColors.background,
                  }}
                >
                  <p
                    style={{
                      color: AppColors.textSecondary,
                      lineHeight: '1.6',
                    }}
                  >
                    💚 <strong>Free shipping</strong> on orders above ₦50,000. Standard delivery takes 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
