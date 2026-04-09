'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getOrder } from '@/lib/services/orderService';
import { getBankTransferStatus } from '@/lib/services/bankTransferService';
import { Order } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { toDate } from '@/lib/utils/dateHelper';

interface OrderTimeline {
  step: number;
  title: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  icon: string;
  timestamp?: Date;
  description?: string;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { id: orderId } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<OrderTimeline[]>([]);
  const [bankTransferStatus, setBankTransferStatus] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) {
        setError('Invalid order or user information');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const fetchedOrder = (await getOrder(orderId as string)) as Order | null;

        if (!fetchedOrder) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        // Verify user owns this order
        if (fetchedOrder.userId !== user.uid) {
          setError('You do not have permission to view this order');
          setIsLoading(false);
          return;
        }

        setOrder(fetchedOrder);

        // Build timeline based on order status
        const newTimeline = buildTimeline(fetchedOrder);
        setTimeline(newTimeline);

        // If bank transfer, fetch transfer status
        if (fetchedOrder.paymentMethod === 'bank_transfer') {
          const transferStatus = await getBankTransferStatus(orderId as string);
          setBankTransferStatus(transferStatus);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  const buildTimeline = (order: Order): OrderTimeline[] => {
    const statuses: OrderTimeline[] = [
      {
        step: 1,
        title: 'Order Placed',
        status: 'completed',
        icon: '📋',
        timestamp: toDate(order.createdAt),
        description: `Order ${order.id} created`,
      },
      {
        step: 2,
        title: 'Payment Processing',
        status:
          order.paymentStatus === 'completed'
            ? 'completed'
            : order.paymentStatus === 'failed'
              ? 'failed'
              : 'active',
        icon: order.paymentStatus === 'failed' ? '❌' : '💳',
        description:
          order.paymentStatus === 'completed'
            ? 'Payment received'
            : order.paymentStatus === 'failed'
              ? 'Payment failed - please retry'
              : 'Waiting for payment',
      },
      {
        step: 3,
        title: 'Order Confirmed',
        status: order.status === 'confirmed' ? 'completed' : 'pending',
        icon: '✅',
        description:
          order.status === 'confirmed'
            ? 'Order confirmed and items reserved'
            : 'Awaiting payment confirmation',
      },
      {
        step: 4,
        title: 'Processing & Packing',
        status: order.status === 'processing' ? 'active' : order.status === 'confirmed' ? 'pending' : 'pending',
        icon: '📦',
        description:
          order.status === 'processing'
            ? 'We are picking and packing your items'
            : 'Will start once payment is confirmed',
      },
      {
        step: 5,
        title: 'Shipped',
        status: order.status === 'shipped' ? 'active' : order.status === 'processing' ? 'pending' : 'pending',
        icon: '🚚',
        description:
          order.status === 'shipped'
            ? `On the way - delivery by ${toDate(order.estimatedDelivery).toLocaleDateString('en-NG')}`
            : 'Awaiting shipment',
      },
      {
        step: 6,
        title: 'Delivered',
        status: order.status === 'delivered' ? 'completed' : 'pending',
        icon: '🏠',
        description: order.status === 'delivered' ? 'Order delivered successfully' : 'Pending delivery',
      },
    ];

    return statuses;
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: AppColors.background }}
      >
        <div className="text-center">
          <div style={{ fontSize: '48px', marginBottom: AppSpacing.md }}>⏳</div>
          <p
            style={{
              ...AppTextStyles.h3,
              color: AppColors.textPrimary,
            }}
          >
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: AppColors.background }}
      >
        <div
          className="w-full max-w-md p-8 rounded-lg"
          style={{
            backgroundColor: 'white',
            border: `2px solid ${AppColors.error}`,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: AppSpacing.md, textAlign: 'center' }}>
            ❌
          </div>
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.error,
              marginBottom: AppSpacing.md,
              textAlign: 'center',
            }}
          >
            Error
          </h2>
          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              marginBottom: AppSpacing.lg,
              textAlign: 'center',
            }}
          >
            {error || 'Order not found'}
          </p>
          <button
            onClick={() => router.push('/orders')}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: AppColors.primary,
              color: 'white',
            }}
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    order.status === 'delivered'
      ? AppColors.success
      : order.status === 'cancelled' || order.paymentStatus === 'failed'
        ? AppColors.error
        : AppColors.primary;

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: AppColors.background }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm font-semibold flex items-center gap-2"
            style={{ color: AppColors.primary }}
          >
            ← Back
          </button>

          <h1
            style={{
              ...AppTextStyles.h1,
              color: AppColors.textPrimary,
              margin: 0,
            }}
          >
            Order {order.id}
          </h1>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: statusColor,
                color: 'white',
              }}
            >
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </span>

            <span
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: order.paymentStatus === 'completed' ? AppColors.success : AppColors.warning,
                color: 'white',
              }}
            >
              {order.paymentStatus === 'completed' ? '✅ Paid' : '⏳ Payment Pending'}
            </span>
          </div>
        </div>

        {/* Order Timeline */}
        <div
          className="mb-8 p-8 rounded-lg"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.lg,
            }}
          >
            Order Status Timeline
          </h2>

          <div className="space-y-6">
            {timeline.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Timeline line */}
                {index < timeline.length - 1 && (
                  <div
                    className="absolute left-6 top-12 w-0.5 h-12"
                    style={{
                      backgroundColor:
                        step.status === 'completed'
                          ? AppColors.success
                          : step.status === 'active'
                            ? AppColors.primary
                            : '#e0e0e0',
                    }}
                  />
                )}

                {/* Timeline item */}
                <div className="flex gap-6">
                  {/* Icon circle */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl relative z-10"
                    style={{
                      backgroundColor:
                        step.status === 'completed'
                          ? AppColors.success
                          : step.status === 'active'
                            ? AppColors.primary
                            : step.status === 'failed'
                              ? AppColors.error
                              : '#f0f0f0',
                      color:
                        step.status === 'completed' || step.status === 'active'
                          ? 'white'
                          : step.status === 'failed'
                            ? 'white'
                            : '#999',
                    }}
                  >
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <h3
                      style={{
                        ...AppTextStyles.h3,
                        color: AppColors.textPrimary,
                        margin: 0,
                      }}
                    >
                      {step.title}
                    </h3>

                    {step.description && (
                      <p
                        style={{
                          ...AppTextStyles.bodyMedium,
                          color: AppColors.textSecondary,
                          margin: AppSpacing.sm + ' 0 0 0',
                        }}
                      >
                        {step.description}
                      </p>
                    )}

                    {step.timestamp && (
                      <p
                        style={{
                          ...AppTextStyles.bodySmall,
                          color: AppColors.textTertiary,
                          margin: AppSpacing.xs + ' 0 0 0',
                        }}
                      >
                        {step.timestamp.toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div
          className="mb-8 p-8 rounded-lg"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.lg,
            }}
          >
            Order Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                  marginBottom: AppSpacing.sm,
                }}
              >
                Order Date
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  margin: 0,
                }}
              >
                {toDate(order.createdAt).toLocaleDateString('en-NG')}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                  marginBottom: AppSpacing.sm,
                }}
              >
                Estimated Delivery
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  margin: 0,
                }}
              >
                {toDate(order.estimatedDelivery).toLocaleDateString('en-NG')}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                  marginBottom: AppSpacing.sm,
                }}
              >
                Payment Method
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  margin: 0,
                }}
              >
                {order.paymentMethod === 'flutterwave'
                  ? '💳 Flutterwave (Card/Mobile Money)'
                  : order.paymentMethod === 'bank_transfer'
                    ? '🏦 Bank Transfer'
                    : '🚚 Cash on Delivery'}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                  marginBottom: AppSpacing.sm,
                }}
              >
                Total Amount
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.success,
                  margin: 0,
                  fontSize: '24px',
                }}
              >
                ₦{order.totalAmount?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div
          className="mb-8 p-8 rounded-lg"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.lg,
            }}
          >
            Items
          </h2>

          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <div>
                  <p
                    style={{
                      ...AppTextStyles.bodyMedium,
                      color: AppColors.textPrimary,
                      margin: 0,
                    }}
                  >
                    {item.productName}
                  </p>
                  <p
                    style={{
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                      margin: AppSpacing.xs + ' 0 0 0',
                    }}
                  >
                    Qty: {item.quantity} × ₦{item.price?.toLocaleString()}
                  </p>
                </div>
                <p
                  style={{
                    ...AppTextStyles.bodyMedium,
                    color: AppColors.textPrimary,
                    margin: 0,
                    fontWeight: 'bold',
                  }}
                >
                  ₦{(item.price * item.quantity)?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div
          className="mb-8 p-8 rounded-lg"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.lg,
            }}
          >
            Shipping Address
          </h2>

          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textPrimary,
              margin: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
            }}
          >
            {order.shippingAddress}
          </p>
        </div>

        {/* Bank Transfer Status (if applicable) */}
        {order.paymentMethod === 'bank_transfer' && bankTransferStatus && (
          <div
            className="mb-8 p-8 rounded-lg"
            style={{ backgroundColor: '#f8f9fa', border: `2px solid ${AppColors.info}` }}
          >
            <h2
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.lg,
              }}
            >
              Bank Transfer Status
            </h2>

            <div className="space-y-4">
              <p>
                <strong>Status:</strong>{' '}
                <span
                  style={{
                    color:
                      bankTransferStatus.status === 'verified'
                        ? AppColors.success
                        : bankTransferStatus.status === 'failed'
                          ? AppColors.error
                          : AppColors.warning,
                  }}
                >
                  {bankTransferStatus.status}
                </span>
              </p>

              {bankTransferStatus.status === 'pending' && (
                <p style={AppTextStyles.bodySmall}>
                  Please transfer ₦{order.totalAmount?.toLocaleString()} to the account details provided at checkout.
                </p>
              )}

              {bankTransferStatus.status === 'proof_uploaded' && (
                <p style={AppTextStyles.bodySmall}>
                  We received your proof of payment and are verifying it. You will be notified within 24-48 hours.
                </p>
              )}

              {bankTransferStatus.verifiedAt && (
                <p style={AppTextStyles.bodySmall}>
                  Verified on:{' '}
                  {new Date(bankTransferStatus.verifiedAt).toLocaleDateString('en-NG')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Support */}
        <div
          className="p-6 rounded-lg text-center"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            Need help? Contact us at{' '}
            <strong style={{ color: AppColors.primary }}>support@ncdfcoop.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
