'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getUserCart } from '@/lib/services/cartService';
import { initiateFlutterwavePayment } from '@/lib/services/paymentService';
import { createOrder } from '@/lib/services/orderService';
import { Cart, Address } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { RecommendationEngine, ProductRecommendation } from '@/lib/services/recommendationEngine';
import { getExperimentVariant } from '@/lib/services/featureFlagsService';
import RecommendationRail from '@/components/RecommendationRail';
import { emitGlobalActivity } from '@/components/GlobalActivityTracker';
import { USER_ROLES } from '@/lib/constants/database';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, currentRole, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'bank_transfer' | 'cash_on_delivery'>('flutterwave');
  const [useWholesalePrepayment, setUseWholesalePrepayment] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
  });

  const [billingAddress, setBillingAddress] = useState<Address>(shippingAddress);
  const sameAsShipping = true; // For future implementation of different billing address
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [e2eInfo, setE2eInfo] = useState<{ orderId?: string; txnRef?: string } | null>(null);
  const checkoutTrackedRef = useRef(false);

  const recommendationVariant = user?.uid
    ? getExperimentVariant(user.uid, 'checkout_recommendation_rail', 50)
    : 'control';

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const cartData = await getUserCart(user.uid);
        if (!cartData || cartData.items.length === 0) {
          router.push('/cart');
          return;
        }

        setCart(cartData);
        if (!checkoutTrackedRef.current) {
          checkoutTrackedRef.current = true;
          emitGlobalActivity('checkout_start', {
            cartTotal: cartData.total,
            itemCount: cartData.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            role: currentRole,
          });
        }
        setShippingAddress((prev) => ({
          ...prev,
          email: user.email || '',
        }));
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load cart');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCart();
    } else if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router, currentRole]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !cart || recommendationVariant === 'control') {
        setRecommendations([]);
        return;
      }

      try {
        setRecommendationsLoading(true);
        const recs = await RecommendationEngine.getPersonalizedRecommendations(
          user.uid,
          6
        );
        setRecommendations(recs);
      } catch (recError) {
        console.error('Failed to fetch checkout recommendations:', recError);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, cart, recommendationVariant]);

  useEffect(() => {
    if (paymentMethod === 'cash_on_delivery') setUseWholesalePrepayment(false);
  }, [paymentMethod]);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (sameAsShipping) {
      setBillingAddress((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!shippingAddress.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!shippingAddress.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!shippingAddress.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!shippingAddress.street.trim()) {
      setError('Street address is required');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      setError('State is required');
      return false;
    }
    if (!shippingAddress.postalCode.trim()) {
      setError('Postal code is required');
      return false;
    }

    if (!sameAsShipping) {
      if (!billingAddress.street.trim()) {
        setError('Billing address is required');
        return false;
      }
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm() || !user || !cart) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const buyerType = currentRole === 'institutional_buyer' ? 'wholesale' : 'member';

      // Create order
      const createdOrder = await createOrder(
        user.uid,
        cart.items,
        cart.total,
        JSON.stringify(shippingAddress),
        paymentMethod,
        buyerType,
        undefined,
        useWholesalePrepayment
      );
      const { orderId, transactionRef, totals } = createdOrder;
      const trustedTotal = totals.totalAmount;

      // Write order id to localStorage for E2E capture and show temporary banner
      try {
        if (orderId) {
          localStorage.setItem('coop_e2e_lastOrderId', orderId);
          setE2eInfo({ orderId });
        }
      } catch (writeErr) {
        console.warn('Failed to write E2E order id to localStorage', writeErr);
      }

      if (paymentMethod === 'flutterwave') {
        // Initiate Flutterwave payment
        await initiateFlutterwavePayment(
          trustedTotal,
          user.email || shippingAddress.email,
          user.uid,
          `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          orderId,
          transactionRef || '',
          async (_reference) => {
            // Payment successful
            try {
              if (_reference) {
                localStorage.setItem('coop_e2e_lastTransactionRef', String(_reference));
                setE2eInfo((prev) => ({ ...(prev || {}), txnRef: String(_reference) }));
              }
            } catch (writeErr) {
              console.warn('Failed to write E2E txn ref to localStorage', writeErr);
            }
            emitGlobalActivity('purchase_complete', {
              orderId,
              orderTotal: trustedTotal,
              itemCount: cart.items.length,
              paymentMethod: 'flutterwave',
              paymentReference: _reference,
            });
            router.push(`/order-confirmation/${orderId}`);
          },
          (error) => {
            emitGlobalActivity('payment_failed', {
              orderId,
              orderTotal: trustedTotal,
              paymentMethod: 'flutterwave',
              errorMessage: error,
            });
            setError(error);
            setIsProcessing(false);
          }
        );
      } else if (paymentMethod === 'bank_transfer') {
        try {
          localStorage.setItem('coop_e2e_lastOrderId', orderId);
          localStorage.setItem('coop_e2e_lastTransactionRef', transactionRef || 'BANK_TRANSFER');
          setE2eInfo({ orderId, txnRef: transactionRef || 'BANK_TRANSFER' });
        } catch (writeErr) {
          console.warn('Failed to write E2E bank transfer info', writeErr);
        }
        emitGlobalActivity('checkout_progress', {
          orderId,
          orderTotal: trustedTotal,
          paymentMethod: 'bank_transfer',
          checkoutStep: 'awaiting_bank_transfer',
        });
        // Redirect to bank transfer details page
        router.push(`/payment/bank-transfer/${orderId}`);
      } else if (paymentMethod === 'cash_on_delivery') {
        // Order confirmed, cash on delivery
        try {
          localStorage.setItem('coop_e2e_lastOrderId', orderId);
          localStorage.setItem('coop_e2e_lastTransactionRef', 'COD');
          setE2eInfo({ orderId, txnRef: 'COD' });
        } catch (writeErr) {
          console.warn('Failed to write E2E COD info', writeErr);
        }
        emitGlobalActivity('purchase_complete', {
          orderId,
          orderTotal: trustedTotal,
          itemCount: cart.items.length,
          paymentMethod: 'cash_on_delivery',
        });
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      emitGlobalActivity('purchase_failed', {
        orderTotal: cart?.total || 0,
        paymentMethod,
        errorMessage: err?.message || 'Checkout failed',
      });
      setError(err.message || 'Checkout failed');
      setIsProcessing(false);
    }
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

  if (!user || !cart) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* E2E capture banner (temporary) */}
      {e2eInfo && (
        <div className="fixed top-4 right-4 z-50 p-3 rounded-md shadow-lg bg-white border" style={{ borderColor: AppColors.border }}>
          <div className="text-sm font-semibold" style={{ color: AppColors.textPrimary }}>E2E Capture</div>
          <div className="text-xs text-gray-700">Order: {e2eInfo.orderId}</div>
          <div className="text-xs text-gray-700">Txn: {e2eInfo.txnRef}</div>
        </div>
      )}
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
            Checkout
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recommendationVariant === 'treatment' && (
          <div className="mb-6">
            <RecommendationRail
              title="You Might Also Need"
              recommendations={recommendations}
              loading={recommendationsLoading}
              emptyMessage="Personalized checkout suggestions are being prepared."
              onOpenProduct={(productId) => router.push(`/products/${productId}`)}
            />
          </div>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div
              className="rounded-lg p-6 border"
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
                Shipping Address
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={shippingAddress.firstName}
                  onChange={(e) => handleAddressChange('firstName', e.target.value)}
                  className="col-span-1 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                  }}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={shippingAddress.lastName}
                  onChange={(e) => handleAddressChange('lastName', e.target.value)}
                  className="col-span-1 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                  }}
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={shippingAddress.email}
                onChange={(e) => handleAddressChange('email', e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white mb-4"
                style={{
                  borderColor: AppColors.border,
                }}
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={shippingAddress.phone}
                onChange={(e) => handleAddressChange('phone', e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white mb-4"
                style={{
                  borderColor: AppColors.border,
                }}
              />

              <input
                type="text"
                placeholder="Street Address"
                value={shippingAddress.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white mb-4"
                style={{
                  borderColor: AppColors.border,
                }}
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="col-span-1 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                  }}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shippingAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="col-span-1 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Postal Code"
                value={shippingAddress.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                style={{
                  borderColor: AppColors.border,
                }}
              />
            </div>

            {/* Billing Address */}
            {!sameAsShipping && (
              <div
                className="rounded-lg p-6 border"
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
                  Billing Address
                </h2>
                {/* Similar form fields for billing address */}
              </div>
            )}

            {/* Payment Method */}
            <div
              className="rounded-lg p-6 border"
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
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer"
                  style={{
                    borderColor: paymentMethod === 'flutterwave' ? AppColors.primary : AppColors.border,
                    backgroundColor: paymentMethod === 'flutterwave' ? `${AppColors.primary}10` : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="flutterwave"
                    checked={paymentMethod === 'flutterwave'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <p
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                    >
                      🔐 Flutterwave (Card, Mobile Money, USSD)
                    </p>
                    <p
                      style={{
                        ...AppTextStyles.bodySmall,
                        color: AppColors.textSecondary,
                      }}
                    >
                      Pay instantly with your preferred method
                    </p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer"
                  style={{
                    borderColor: paymentMethod === 'bank_transfer' ? AppColors.primary : AppColors.border,
                    backgroundColor: paymentMethod === 'bank_transfer' ? `${AppColors.primary}10` : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <p
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                    >
                      🏦 Bank Transfer
                    </p>
                    <p
                      style={{
                        ...AppTextStyles.bodySmall,
                        color: AppColors.textSecondary,
                      }}
                    >
                      Transfer funds to our account
                    </p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer"
                  style={{
                    borderColor: paymentMethod === 'cash_on_delivery' ? AppColors.primary : AppColors.border,
                    backgroundColor: paymentMethod === 'cash_on_delivery' ? `${AppColors.primary}10` : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <p
                      style={{
                        ...AppTextStyles.labelLarge,
                        color: AppColors.textPrimary,
                      }}
                    >
                      💵 Cash on Delivery
                    </p>
                    <p
                      style={{
                        ...AppTextStyles.bodySmall,
                        color: AppColors.textSecondary,
                      }}
                    >
                      Pay when your order arrives
                    </p>
                  </div>
                </label>
              </div>
              {currentRole === USER_ROLES.INSTITUTIONAL_BUYER && (
                <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${useWholesalePrepayment ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'}`}>
                  <input type="checkbox" checked={useWholesalePrepayment} disabled={paymentMethod === 'cash_on_delivery'} onChange={(event) => setUseWholesalePrepayment(event.target.checked)} className="mt-1 h-5 w-5 accent-emerald-700" />
                  <span><strong className="block text-emerald-900">Institutional prepayment · 10% discount</strong><small className="text-gray-600">Available for Flutterwave or bank transfer. The server verifies the discount before creating the order.</small></span>
                </label>
              )}
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

              <div className="space-y-3 pb-6 border-b mb-6"
                style={{
                  borderColor: AppColors.border,
                }}
              >
                <div className="flex justify-between">
                  <span style={{ color: AppColors.textSecondary }}>Subtotal</span>
                  <span style={{ color: AppColors.textPrimary, fontWeight: 'bold' }}>
                    ₦{cart.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: AppColors.textSecondary }}>Tax</span>
                  <span style={{ color: AppColors.textPrimary, fontWeight: 'bold' }}>
                    ₦{cart.tax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: AppColors.textSecondary }}>Shipping</span>
                  <span style={{ color: cart.shipping === 0 ? '#48BB78' : AppColors.textPrimary, fontWeight: 'bold' }}>
                    {cart.shipping === 0 ? 'FREE' : `₦${cart.shipping.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {useWholesalePrepayment && <div className="mb-3 flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><span>Prepayment saving</span><span>-₦{(cart.subtotal * 0.1).toLocaleString()}</span></div>}
              <div className="flex justify-between mb-8">
                <span style={{ ...AppTextStyles.h3, color: AppColors.textPrimary }}>Total</span>
                <span style={{ ...AppTextStyles.h2, color: AppColors.primary }}>
                  ₦{(useWholesalePrepayment ? Math.max(0, cart.total - cart.subtotal * 0.11) : cart.total).toLocaleString()}
                </span>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-lg text-white font-bold transition-transform transform-gpu motion-safe:will-change-transform hover:scale-105 active:scale-95 duration-150 shadow-sm hover:shadow-lg disabled:opacity-50"
                style={{
                  backgroundColor: AppColors.primary,
                }}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>

              <button
                onClick={() => router.push('/cart')}
                disabled={isProcessing}
                className="w-full mt-3 py-3 rounded-lg font-semibold border-2 transition-all disabled:opacity-50"
                style={{
                  borderColor: AppColors.primary,
                  color: AppColors.primary,
                }}
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
