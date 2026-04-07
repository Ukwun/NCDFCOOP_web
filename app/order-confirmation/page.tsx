'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getOrder } from '@/lib/services/orderService';
import { generateInvoiceData, previewInvoice } from '@/lib/services/invoiceService';
import { Order } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

interface ConfirmationStep {
  step: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const orderId = searchParams.get('orderId');
  const paymentStatus = searchParams.get('status'); // 'success' or 'failed'

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSteps, setConfirmationSteps] = useState<ConfirmationStep[]>([
    { step: 1, title: 'Payment Verified', status: 'pending', icon: '💳' },
    { step: 2, title: 'Order Confirmed', status: 'pending', icon: '✅' },
    { step: 3, title: 'Processing & Packing', status: 'pending', icon: '📦' },
    { step: 4, title: 'Shipped', status: 'pending', icon: '🚚' },
    { step: 5, title: 'Delivery', status: 'pending', icon: '🏠' },
  ]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) {
        setError('Invalid order information');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedOrder = await getOrder(orderId);

        if (!fetchedOrder) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        setOrder(fetchedOrder);

        // Update payment status based on payment gateway response
        if (paymentStatus === 'success') {
          // Update order payment status to completed
          setConfirmationSteps((prev) =>
            prev.map((step) =>
              step.step === 1
                ? { ...step, status: 'completed' }
                : step.step === 2
                  ? { ...step, status: 'processing' }
                  : step
            )
          );
        } else if (paymentStatus === 'failed') {
          setConfirmationSteps((prev) =>
            prev.map((step) => (step.step === 1 ? { ...step, status: 'failed' } : step))
          );
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

  const handleViewInvoice = () => {
    if (order && user) {
      const invoiceData = generateInvoiceData(order, user.displayName || 'Customer', user.email || '', user.phoneNumber || '');
      previewInvoice(invoiceData);
    }
  };

  const handleDownloadInvoice = () => {
    if (order && user) {
      const invoiceData = generateInvoiceData(order, user.displayName || 'Customer', user.email || '', user.phoneNumber || '');
      // Trigger print dialog for manual PDF save
      const html = require('@/lib/services/invoiceService').generateHTMLInvoice(invoiceData);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        newWindow.print();
      }
    }
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  const handleViewOrder = () => {
    router.push(`/orders/${orderId}`);
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
            Loading your order...
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
            Order Error
          </h2>
          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              marginBottom: AppSpacing.lg,
              textAlign: 'center',
            }}
          >
            {error || 'Unable to process your order. Please contact support.'}
          </p>
          <button
            onClick={handleContinueShopping}
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: AppColors.primary,
              color: 'white',
            }}
          >
            Back to Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: AppColors.background }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {paymentStatus === 'success' && (
          <div
            className="mb-8 p-6 rounded-lg border-l-4"
            style={{
              backgroundColor: '#d4edda',
              borderLeftColor: AppColors.success,
            }}
          >
            <h1
              style={{
                ...AppTextStyles.h1,
                color: AppColors.success,
                margin: 0,
              }}
            >
              ✅ Order Confirmed!
            </h1>
            <p
              style={{
                ...AppTextStyles.bodyMedium,
                color: '#155724',
                margin: AppSpacing.sm + ' 0 0 0',
              }}
            >
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
          </div>
        )}

        {/* Order Status Timeline */}
        <div
          className="mb-12 p-8 rounded-lg"
          style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        >
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.lg,
            }}
          >
            Order Timeline
          </h2>

          <div className="space-y-4">
            {confirmationSteps.map((step, index) => (
              <div key={step.step} className="flex items-start gap-4">
                {/* Step Icon */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    backgroundColor:
                      step.status === 'completed'
                        ? AppColors.success
                        : step.status === 'processing'
                          ? AppColors.primary
                          : step.status === 'failed'
                            ? AppColors.error
                            : '#e0e0e0',
                    color:
                      step.status === 'completed' || step.status === 'processing'
                        ? 'white'
                        : step.status === 'failed'
                          ? 'white'
                          : '#999',
                  }}
                >
                  {step.icon}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3
                    style={{
                      ...AppTextStyles.h3,
                      color: AppColors.textPrimary,
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      ...AppTextStyles.bodySmall,
                      color: AppColors.textSecondary,
                      margin: 0,
                    }}
                  >
                    {step.status === 'completed'
                      ? '✅ Completed'
                      : step.status === 'processing'
                        ? '⏳ In Progress'
                        : step.status === 'failed'
                          ? '❌ Failed'
                          : '⏸ Pending'}
                  </p>
                </div>

                {/* Connector Line */}
                {index < confirmationSteps.length - 1 && (
                  <div
                    className="absolute left-6 w-0.5 h-8"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      marginTop: AppSpacing.md,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Estimated Delivery */}
          <div
            className="mt-8 p-4 rounded-lg"
            style={{ backgroundColor: '#f8f9fa', borderLeft: `4px solid ${AppColors.info}` }}
          >
            <p
              style={{
                ...AppTextStyles.bodySmall,
                color: AppColors.textSecondary,
                margin: 0,
              }}
            >
              📦 <strong>Estimated Delivery:</strong> {(order.estimatedDelivery instanceof Date 
                ? order.estimatedDelivery 
                : order.estimatedDelivery?.toDate?.() || new Date()
              ).toLocaleDateString('en-NG') || '5-7 business days'}
            </p>
          </div>
        </div>

        {/* Order Details Card */}
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
            Order Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                }}
              >
                Order ID
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  margin: AppSpacing.sm + ' 0 0 0',
                }}
              >
                {order.id}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                }}
              >
                Order Date
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                  margin: AppSpacing.sm + ' 0 0 0',
                }}
              >
                {(order.createdAt instanceof Date 
                  ? order.createdAt 
                  : order.createdAt?.toDate?.() || new Date()
                ).toLocaleDateString('en-NG')}
              </p>
            </div>

            <div>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  margin: 0,
                }}
              >
                Total Amount
              </p>
              <p
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.success,
                  margin: AppSpacing.sm + ' 0 0 0',
                }}
              >
                ₦{order.totalAmount?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-6">
            <h3
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
              }}
            >
              Items Ordered
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b last:border-b-0">
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
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p
                    style={{
                      ...AppTextStyles.bodyMedium,
                      color: AppColors.textPrimary,
                      margin: 0,
                    }}
                  >
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t mt-6 pt-6">
            <h3
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.md,
              }}
            >
              Shipping Address
            </h3>
            <p
              style={{
                ...AppTextStyles.bodyMedium,
                color: AppColors.textPrimary,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {order.shippingAddress}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleViewInvoice}
            className="py-3 px-6 rounded-lg font-semibold transition-all border-2"
            style={{
              backgroundColor: 'white',
              borderColor: AppColors.primary,
              color: AppColors.primary,
            }}
          >
            📄 View Invoice
          </button>

          <button
            onClick={handleViewOrder}
            className="py-3 px-6 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: AppColors.primary,
              color: 'white',
            }}
          >
            📦 Track Order
          </button>

          <button
            onClick={handleContinueShopping}
            className="py-3 px-6 rounded-lg font-semibold transition-all border-2"
            style={{
              backgroundColor: 'white',
              borderColor: AppColors.secondary,
              color: AppColors.secondary,
            }}
          >
            🛍 Continue Shopping
          </button>
        </div>

        {/* Support Info */}
        <div
          className="mt-8 p-6 rounded-lg text-center"
          style={{
            backgroundColor: '#f8f9fa',
          }}
        >
          <p
            style={{
              ...AppTextStyles.bodyMedium,
              color: AppColors.textSecondary,
              margin: 0,
            }}
          >
            Have questions? Contact our support team at{' '}
            <strong style={{ color: AppColors.primary }}>support@ncdfcoop.com</strong> or call{' '}
            <strong style={{ color: AppColors.primary }}>+234-xxx-xxx-xxxx</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
