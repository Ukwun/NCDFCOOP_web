'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getOrder } from '@/lib/services/orderService';
import { Order } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import Image from 'next/image';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params?.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !orderId) return;

      try {
        setIsLoading(true);
        setError(null);

        const orderData = await getOrder(orderId);
        if (!orderData) {
          setError('Order not found');
          return;
        }

        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchOrder();
    } else if (!authLoading && !user) {
      router.push('/welcome');
    }
  }, [user, orderId, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: AppColors.background,
        }}
      >
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: AppColors.background,
        }}
      >
        <div
          className="p-8 rounded-lg"
          style={{
            backgroundColor: AppColors.surface,
          }}
        >
          <p style={{ color: '#E53E3E' }}>{error}</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 px-6 py-3 rounded-lg text-white font-bold"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Success Header */}
      <div
        className="py-12 text-center border-b"
        style={{
          backgroundColor: AppColors.surface,
          borderColor: AppColors.border,
        }}
      >
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: '#C6F6D5',
          }}
        >
          <span className="text-4xl">✓</span>
        </div>
        <h1
          style={{
            ...AppTextStyles.h1,
            color: '#22543D',
          }}
        >
          Thank you for your order!
        </h1>
        <p
          style={{
            ...AppTextStyles.bodyLarge,
            color: AppColors.textSecondary,
            marginTop: AppSpacing.md,
          }}
        >
          Your order has been confirmed and will be processed shortly.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Order Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Order Number Card */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelSmall,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.sm,
              }}
            >
              Order Number
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
              }}
            >
              {order.id}
            </p>
          </div>

          {/* Order Date Card */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelSmall,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.sm,
              }}
            >
              Order Date
            </p>
            <p
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textPrimary,
              }}
            >
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Status Card */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelSmall,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.sm,
              }}
            >
              Order Status
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    order.status === 'pending' ? '#F6AD55' :
                    order.status === 'confirmed' ? '#48BB78' :
                    order.status === 'processing' ? '#4299E1' :
                    order.status === 'shipped' ? '#9F7AEA' :
                    order.status === 'delivered' ? '#38A169' : '#A0AEC0'
                }}
              />
              <p
                style={{
                  ...AppTextStyles.labelLarge,
                  color: AppColors.textPrimary,
                  textTransform: 'capitalize',
                }}
              >
                {order.status}
              </p>
            </div>
          </div>

          {/* Estimated Delivery Card */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelSmall,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.sm,
              }}
            >
              Estimated Delivery
            </p>
            <p
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textPrimary,
              }}
            >
              3 - 5 business days
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div
          className="rounded-lg p-6 border mb-8"
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
            Order Items
          </h2>

          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-4 pb-4 border-b last:border-b-0"
                style={{
                  borderColor: AppColors.border,
                }}
              >
                {/* Product Image */}
                {item.productImage && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Product Details */}
                <div className="flex-grow">
                  <p
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                    }}
                  >
                    {item.productName}
                  </p>
                  <p
                    style={{
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                      marginTop: AppSpacing.xs,
                    }}
                  >
                    Quantity: {item.quantity}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textPrimary,
                    }}
                  >
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                  <p
                    style={{
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                    }}
                  >
                    ₦{item.price.toLocaleString()} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div
          className="rounded-lg p-6 border mb-8"
          style={{
            backgroundColor: AppColors.surface,
            borderColor: AppColors.border,
          }}
        >
          <div className="space-y-3">
            <div className="flex justify-between pb-3 border-b"
              style={{
                borderColor: AppColors.border,
              }}
            >
              <span style={{ color: AppColors.textSecondary }}>Order Total</span>
              <span style={{ color: AppColors.textPrimary, fontWeight: 'bold' }}>
                ₦{order.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ ...AppTextStyles.h3, color: AppColors.textPrimary }}>Final Amount</span>
              <span style={{ ...AppTextStyles.h2, color: AppColors.primary }}>
                ₦{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push(`/orders/${order.id}`)}
            className="flex-1 py-4 rounded-lg text-white font-bold transition-all hover:shadow-lg"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            Track Order
          </button>

          <button
            onClick={() => router.push('/products')}
            className="flex-1 py-4 rounded-lg font-bold border-2 transition-all"
            style={{
              borderColor: AppColors.primary,
              color: AppColors.primary,
            }}
          >
            Continue Shopping
          </button>
        </div>

        {/* Help Section */}
        <div
          className="mt-12 rounded-lg p-6 border"
          style={{
            backgroundColor: `${AppColors.primary}10`,
            borderColor: AppColors.primary,
          }}
        >
          <p
            style={{
              ...AppTextStyles.labelLarge,
              color: AppColors.textPrimary,
            }}
          >
            💡 Need Help?
          </p>
          <p
            style={{
              ...AppTextStyles.bodySmall,
              color: AppColors.textSecondary,
              marginTop: AppSpacing.sm,
            }}
          >
            A confirmation email has been sent to {order.shippingAddress ? JSON.parse(order.shippingAddress).email : user?.email}. You can track your order status anytime by visiting your account.
          </p>
        </div>
      </div>
    </div>
  );
}
