'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getUserOrders } from '@/lib/services/orderService';
import { useRealTimeOrders } from '@/lib/hooks/useRealTime';
import { Order } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import Image from 'next/image';
import { toDate } from '@/lib/utils/dateHelper';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Use real-time orders hook for live updates
  const { orders: realTimeOrders, isLoading: rtIsLoading, error: rtError } = useRealTimeOrders(user?.uid);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedFallback, setHasFetchedFallback] = useState(false);

  // Keep local state synchronized with real-time order updates.
  useEffect(() => {
    if (rtError) {
      setError(rtError.message);
    } else {
      setError(null);
    }

    setOrders(realTimeOrders);
    setIsLoading(rtIsLoading);
  }, [realTimeOrders, rtIsLoading, rtError]);

  // Fallback: fetch orders once if real-time subscription returns no data.
  useEffect(() => {
    const fetchOrdersFallback = async () => {
      if (!user || realTimeOrders.length > 0 || hasFetchedFallback) return;

      try {
        setIsLoading(true);
        setError(null);

        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Unable to load your orders at this time.');
      } finally {
        setIsLoading(false);
        setHasFetchedFallback(true);
      }
    };

    if (!authLoading && user) {
      fetchOrdersFallback();
    } else if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router, realTimeOrders.length, hasFetchedFallback]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F6AD55';
      case 'confirmed':
        return '#48BB78';
      case 'processing':
        return '#4299E1';
      case 'shipped':
        return '#9F7AEA';
      case 'delivered':
        return '#38A169';
      case 'cancelled':
        return '#E53E3E';
      default:
        return '#A0AEC0';
    }
  };

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

  if (!user) {
    return null;
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary,
              }}
            >
              My Orders
            </h1>
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#10B981' }}>Live Updates</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {orders.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.lg,
              }}
            >
              📦 No orders yet
            </p>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
                marginBottom: AppSpacing.xl,
              }}
            >
              Start shopping to create your first order
            </p>
            <button
              onClick={() => router.push('/products')}
              className="px-8 py-3 rounded-lg text-white font-bold"
              style={{
                backgroundColor: AppColors.primary,
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                style={{
                  backgroundColor: AppColors.surface,
                  borderColor: AppColors.border,
                }}
                onClick={() => router.push(`/order-confirmation/${order.id}`)}
              >
                {/* Order Header */}
                <div
                  className="p-6 border-b flex items-center justify-between"
                  style={{
                    borderColor: AppColors.border,
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textSecondary,
                      }}
                    >
                      Order ID
                    </p>
                    <p
                      style={{
                        ...AppTextStyles.h3,
                        color: AppColors.textPrimary,
                      }}
                    >
                      {order.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        style={{
                          ...AppTextStyles.labelLarge,
                          color: AppColors.textSecondary,
                        }}
                      >
                        Order Date
                      </p>
                      <p
                        style={{
                          ...AppTextStyles.bodyLarge,
                          color: AppColors.textPrimary,
                        }}
                      >
                        {toDate(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        style={{
                          ...AppTextStyles.labelLarge,
                          color: AppColors.textSecondary,
                        }}
                      >
                        Status
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(order.status),
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
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  <p
                    style={{
                      ...AppTextStyles.labelLarge,
                      color: AppColors.textSecondary,
                      marginBottom: AppSpacing.md,
                    }}
                  >
                    Items ({order.items?.length || 0})
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {order.items?.slice(0, 4).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-lg overflow-hidden relative group"
                      >
                        {item.productImage && (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {item.quantity > 1 && (
                          <div
                            className="absolute bottom-2 right-2 px-2 py-1 rounded text-white text-xs font-bold"
                            style={{
                              backgroundColor: AppColors.primary,
                            }}
                          >
                            ×{item.quantity}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items && order.items.length > 4 && (
                      <div
                        className="rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${AppColors.primary}20`,
                        }}
                      >
                        <p
                          style={{
                            ...AppTextStyles.labelLarge,
                            color: AppColors.primary,
                          }}
                        >
                          +{order.items.length - 4}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Total */}
                <div
                  className="px-6 py-4 border-t flex items-center justify-between"
                  style={{
                    borderColor: AppColors.border,
                    backgroundColor: `${AppColors.primary}05`,
                  }}
                >
                  <div>
                    <p
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textSecondary,
                      }}
                    >
                      Order Total
                    </p>
                    <p
                      style={{
                        ...AppTextStyles.h2,
                        color: AppColors.primary,
                      }}
                    >
                      ₦{order.totalAmount.toLocaleString()}
                    </p>
                  </div>

                  <button
                    className="px-6 py-3 rounded-lg font-bold border-2"
                    style={{
                      borderColor: AppColors.primary,
                      color: AppColors.primary,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/orders/${order.id}`);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
