'use client';

import { useState, useEffect } from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { CART_CHANGED_EVENT, getUserCart, removeFromCart, updateCartItemQuantity } from '@/lib/services/cartService';
import { Cart } from '@/lib/types/product';
import PaystackPaymentButton from '@/components/PaystackPaymentButton';
import OptimizedImage from '@/components/OptimizedImage';
import { useActivityTracking } from '@/lib/hooks';
import { USER_ROLES } from '@/lib/constants/database';

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { trackCheckoutStart } = useActivityTracking({
    userId: user?.uid || '',
  });
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const buyerType = useMemo(() => {
    if (!user?.currentRole) return 'member'; // Default to member if no role
    return user.currentRole === USER_ROLES.INSTITUTIONAL_BUYER ? 'wholesale' : 'member';
  }, [user?.currentRole]);

  // Fetch cart on mount and when user changes
  useEffect(() => {
    let active = true;

    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        if (user?.uid) {
          const userCart = await getUserCart(user.uid);
          if (active) {
            setCart(userCart);
          }
        } else {
          // Use mock data if no user
          if (active) {
            setCart({
            userId: '',
            items: [
              {
                id: '1',
                userId: '',
                productId: '1',
                productName: 'Fresh Vegetables Bundle',
                price: 3500,
                quantity: 2,
                image: '🥗',
                addedAt: { toDate: () => new Date() } as any,
              },
              {
                id: '2',
                userId: '',
                productId: '2',
                productName: 'Premium Grains',
                price: 2500,
                quantity: 1,
                image: '🌾',
                addedAt: { toDate: () => new Date() } as any,
              },
            ],
            subtotal: 9500,
            tax: 712.5,
            shipping: 500,
            total: 10712.5,
            updatedAt: new Date(),
            });
          }
        }
      } catch (err) {
        console.error('Error fetching cart:', err);
        if (active) {
          setError('Failed to load cart. Please try again.');
        }
        // Fallback to mock data
        if (active) {
          setCart({
          userId: user?.uid || '',
          items: [
            {
              id: '1',
              userId: user?.uid || '',
              productId: '1',
              productName: 'Fresh Vegetables Bundle',
              price: 3500,
              quantity: 2,
              image: '🥗',
              addedAt: { toDate: () => new Date() } as any,
            },
            {
              id: '2',
              userId: user?.uid || '',
              productId: '2',
              productName: 'Premium Grains',
              price: 2500,
              quantity: 1,
              image: '🌾',
              addedAt: { toDate: () => new Date() } as any,
            },
          ],
          subtotal: 9500,
          tax: 712.5,
          shipping: 500,
          total: 10712.5,
          updatedAt: new Date(),
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCart();

    const handleCartChanged = () => {
      fetchCart();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      }
    };
  }, [user]);

  const handleRemoveItem = async (productId: string) => {
    try {
      if (user?.uid) {
        await removeFromCart(user.uid, productId);
        // Refresh cart
        if (user?.uid) {
          const updatedCart = await getUserCart(user.uid);
          setCart(updatedCart);
        }
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      if (user?.uid && quantity > 0) {
        // Intelligence: Check for Wholesale MOQ requirements
        const item = cart?.items.find((i) => i.productId === productId);
        const moq = item?.productData?.minOrderQuantity || 1;
        const isWholesaleProduct = item?.productData?.type === 'wholesale' || item?.productData?.type === 'both';

        if (isWholesaleProduct && quantity < moq) {
          setError(`Minimum order quantity for ${item?.productName} is ${moq} units.`);
          return;
        }

        setError(null);
        await updateCartItemQuantity(user.uid, productId, quantity);
        // Refresh cart
        if (user?.uid) {
          const updatedCart = await getUserCart(user.uid);
          setCart(updatedCart);
        }
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const handleCheckoutSuccess = () => {
    setSuccessMessage('Order placed successfully! You will receive a confirmation email shortly.');
    setIsCheckingOut(false);
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  const handleCheckoutError = (err: string) => {
    setError(err);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🛒 Shopping Cart</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {cart?.items.length || 0} items in your cart
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2">
          <p className="text-green-700 dark:text-green-400">✅ {successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 animate-in slide-in-from-right-2" style={{ animation: 'shake 0.4s ease-in-out' }}>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading cart...</p>
        </div>
      )}

      {!loading && cart ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2">
            {cart.items.length > 0 ? (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    {item.productData?.minOrderQuantity && (item.productData.type === 'wholesale' || item.productData.type === 'both') && (
                      <div className="mb-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-300 rounded uppercase tracking-wider">
                        📦 Wholesale Listing (MOQ: {item.productData.minOrderQuantity})
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4 flex-1">
                        <OptimizedImage
                          src={item.image || ''}
                          alt={item.productName || ''}
                          type="thumbnail"
                          width={80}
                          height={80}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">{item.productName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">₦{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="bg-gray-200 dark:bg-gray-700 rounded px-3 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="bg-gray-200 dark:bg-gray-700 rounded px-3 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
              </div>
            )}
          </div>

          {/* Order Summary & Checkout */}
          {cart.items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 h-fit">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>₦{cart.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax (7.5%)</span>
                  <span>₦{cart.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>{cart.shipping === 0 ? 'FREE' : `₦${cart.shipping.toLocaleString()}`}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white mb-6">
                <span>Total</span>
                <span>₦{Math.round(cart.total).toLocaleString()}</span>
              </div>

              {/* Shipping Address */}
              {!isCheckingOut && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shipping Address
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your shipping address..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
              )}

              {/* Checkout Button */}
              {user && user.email && !isCheckingOut ? (
                <button
                  onClick={() => {
                    if (shippingAddress.trim()) {
                      // Final Intelligence Check: Validate all MOQs before allowing checkout
                      const violations = cart.items.filter(item => {
                        const moq = item.productData?.minOrderQuantity || 1;
                        const isWholesale = item.productData?.type === 'wholesale' || item.productData?.type === 'both';
                        return isWholesale && item.quantity < moq;
                      });

                      if (violations.length > 0) {
                        setError(`Checkout blocked: ${violations[0].productName} requires at least ${violations[0].productData?.minOrderQuantity} units for wholesale rates.`);
                        return;
                      }

                      // Track checkout start
                      trackCheckoutStart(Math.round(cart.total), cart.items.length);
                      setIsCheckingOut(true);
                    } else {
                      setError('Please enter a shipping address');
                    }
                  }}
                  className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700 transition-colors"
                >
                  Proceed to Payment
                </button>
              ) : isCheckingOut ? (
                <>
                  <PaystackPaymentButton
                    userId={user?.uid || ''}
                    email={user?.email || ''}
                    fullName={user?.displayName || 'Customer'}
                    amount={Math.round(cart.total)}
                    cartItems={cart.items.map((item) => ({
                      productId: item.productId,
                      productName: item.productName || '',
                      quantity: item.quantity,
                      price: item.price,
                      minOrderQuantity: item.productData?.minOrderQuantity,
                      unitOfMeasure: item.productData?.unitOfMeasure,
                      type: item.productData?.type,
                    }))}
                    buyerType={buyerType}
                    shippingAddress={shippingAddress}
                    onSuccess={handleCheckoutSuccess}
                    onError={handleCheckoutError}
                  />
                  <button
                    onClick={() => {
                      setIsCheckingOut(false);
                      setError(null);
                    }}
                    className="w-full mt-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg py-2 font-medium hover:bg-gray-400 dark:hover:bg-gray-600"
                  >
                    Back
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-700 rounded-lg py-3 font-bold cursor-not-allowed opacity-50"
                >
                  Sign in to checkout
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
