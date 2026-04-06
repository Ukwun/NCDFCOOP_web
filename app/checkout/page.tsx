'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getUserCart } from '@/lib/services/cartService';
import { initiateFlutterwavePayment, recordBankTransferIntent } from '@/lib/services/paymentService';
import { createOrder } from '@/lib/services/orderService';
import { Cart, Address } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'bank_transfer' | 'cash_on_delivery'>('flutterwave');

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
      router.push('/welcome');
    }
  }, [user, authLoading, router]);

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

      // Create order
      const orderId = await createOrder(
        user.uid,
        cart.items,
        cart.total,
        JSON.stringify(shippingAddress),
        paymentMethod
      );

      if (paymentMethod === 'flutterwave') {
        // Initiate Flutterwave payment
        await initiateFlutterwavePayment(
          cart.total,
          user.email || shippingAddress.email,
          user.uid,
          `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          orderId,
          async (_reference) => {
            // Payment successful
            router.push(`/order-confirmation/${orderId}`);
          },
          (error) => {
            setError(error);
            setIsProcessing(false);
          }
        );
      } else if (paymentMethod === 'bank_transfer') {
        // Record bank transfer intent
        await recordBankTransferIntent(
          cart.total,
          user.email || shippingAddress.email,
          user.uid,
          `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          orderId
        );
        // Redirect to bank transfer details page
        router.push(`/payment/bank-transfer/${orderId}`);
      } else if (paymentMethod === 'cash_on_delivery') {
        // Order confirmed, cash on delivery
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
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

              <div className="flex justify-between mb-8">
                <span style={{ ...AppTextStyles.h3, color: AppColors.textPrimary }}>Total</span>
                <span style={{ ...AppTextStyles.h2, color: AppColors.primary }}>
                  ₦{cart.total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-lg text-white font-bold transition-all hover:shadow-lg disabled:opacity-50"
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
