'use client';


import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSellerProducts } from '@/lib/hooks/useSellerProducts';
import { ProductPopularity } from '@/lib/services/analyticsService';

import { getSellerRecentOrders } from '@/lib/services/sellerService';
import { ORDER_STATUS } from '@/lib/constants/database';


export default function SellerDashboardHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filterTab, setFilterTab] = useState('All');
  const [onboardingComplete] = useState(true);

  // Get real-time seller products
  const { products, loading: productsLoading, filtered } = useSellerProducts(user?.uid || '');
  const filteredProducts = filtered(filterTab);

  // Define business name from user display name or default
  const businessName = user?.displayName || 'My Store';

  // Seller analytics state
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [topProducts, setTopProducts] = useState<ProductPopularity[]>([]);
  const [orderTrends, setOrderTrends] = useState<number[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Calculate stats
  const stats = {
    total: products.length,
    pending: products.filter((p) => p.status === 'pending').length,
    approved: products.filter((p) => p.status === 'approved').length,
    revenue: products
      .filter((p) => p.status === 'approved')
      .reduce((sum, p) => sum + (p.price * p.quantity * 0.1), 0), // Estimate 10% commission
    rating: 4.8,
  };

  // Fetch seller analytics
  useEffect(() => {
    if (!user?.uid) return;
    const fetchAnalytics = async () => {
      // Keep seller dashboard scoped to seller-owned product data.
      const top = products
        .slice()
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map((p) => ({
          productId: p.id,
          productName: p.name,
          category: p.category,
          price: p.price,
          viewCount: 0,
          addToCartCount: 0,
          purchaseCount: 0,
          viewToCartRate: 0,
          cartToPurchaseRate: 0,
          reason: 'Seller inventory performance',
          score: Math.min(100, p.quantity),
        } as ProductPopularity));
      setTopProducts(top);
      // Order trends (dummy: last 4 weeks)
      setOrderTrends([12, 18, 22, 15]);
      // Average order value (dummy)
      setAvgOrderValue(15000);
      // Fetch recent orders for segmentation and escrow/payment status
      try {
        const orders = await getSellerRecentOrders(user.uid, 10);
        setRecentOrders(orders);
      } catch {
        setRecentOrders([]);
      }
    };
    fetchAnalytics();
  }, [user?.uid, products]);
  // Segment orders by buyer type (member/wholesale)
  const memberOrders = recentOrders.filter((o) => o.buyerType === 'member');
  const wholesaleOrders = recentOrders.filter((o) => o.buyerType === 'wholesale');

  // Escrow/payment status summary
  const escrowOrders = recentOrders.filter((o) => o.status === 'pending' && o.paymentStatus !== 'completed');
  const paidOrders = recentOrders.filter((o) => o.paymentStatus === 'completed');
  // Helper for realistic status display
  const getOrderStatusLabel = (order: any) => {
    if (order.status === 'pending' && order.paymentStatus !== 'completed') return 'Awaiting Escrow';
    if (order.status === 'pending' && order.paymentStatus === 'completed') return 'Escrow Funded';
    if (order.status === 'processing') return 'Processing';
    if (order.status === 'shipped') return 'Shipped';
    if (order.status === 'delivered') return 'Delivered';
    if (order.status === 'cancelled') return 'Cancelled';
    return order.status;
  };



  // Move onboarding check to top-level before main return
  if (!onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Start Selling</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete the onboarding process to access your seller dashboard and manage products.
          </p>
          <button
            onClick={() => router.push('/seller/onboarding')}
            className="w-full bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Selling →
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending':
        return '🟡';
      case 'approved':
        return '🟢';
      case 'rejected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (!onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Start Selling</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complete the onboarding process to access your seller dashboard and manage products.
          </p>
          <button
            onClick={() => router.push('/seller/onboarding')}
            className="w-full bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Selling →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="inline-block px-3 py-1 bg-[#0B6B3A] text-white text-xs font-semibold rounded-full mb-2">
              🏪 SELLER DASHBOARD
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              My Store
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{businessName}</p>
          </div>
          <button
            onClick={() => router.push('/account')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">👤</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Business Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Total Products</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Review</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">Approved</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">This Month Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#0B6B3A]">₦{stats.revenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Seller Analytics */}
                {/* Realistic Order Segmentation & Escrow Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Recent Member Orders</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {memberOrders.length === 0 && <li className="py-2 text-gray-500">No member orders yet.</li>}
                      {memberOrders.slice(0, 5).map((order) => (
                        <li key={order.id} className="py-2 flex flex-col">
                          <span className="font-medium">Order #{order.id}</span>
                          <span className="text-xs">{getOrderStatusLabel(order)}</span>
                          <span className="text-xs text-gray-500">₦{order.totalAmount?.toLocaleString()} | {order.items?.length} items</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Recent Wholesale Orders</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {wholesaleOrders.length === 0 && <li className="py-2 text-gray-500">No wholesale orders yet.</li>}
                      {wholesaleOrders.slice(0, 5).map((order) => (
                        <li key={order.id} className="py-2 flex flex-col">
                          <span className="font-medium">Order #{order.id}</span>
                          <span className="text-xs">{getOrderStatusLabel(order)}</span>
                          <span className="text-xs text-gray-500">₦{order.totalAmount?.toLocaleString()} | {order.items?.length} items</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Escrow/Payment Status Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Orders Awaiting Escrow</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {escrowOrders.length === 0 && <li className="py-2 text-gray-500">No orders awaiting escrow.</li>}
                      {escrowOrders.slice(0, 5).map((order) => (
                        <li key={order.id} className="py-2 flex flex-col">
                          <span className="font-medium">Order #{order.id}</span>
                          <span className="text-xs">{getOrderStatusLabel(order)}</span>
                          <span className="text-xs text-gray-500">₦{order.totalAmount?.toLocaleString()} | {order.items?.length} items</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Paid Orders (Escrow Funded)</h3>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paidOrders.length === 0 && <li className="py-2 text-gray-500">No paid orders yet.</li>}
                      {paidOrders.slice(0, 5).map((order) => (
                        <li key={order.id} className="py-2 flex flex-col">
                          <span className="font-medium">Order #{order.id}</span>
                          <span className="text-xs">{getOrderStatusLabel(order)}</span>
                          <span className="text-xs text-gray-500">₦{order.totalAmount?.toLocaleString()} | {order.items?.length} items</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Average Order Value</p>
            <p className="text-2xl font-bold text-indigo-600">₦{avgOrderValue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Top Products</p>
            <ul className="space-y-1">
              {topProducts.map((p) => (
                <li key={p.productId} className="flex justify-between">
                  <span>{p.productName}</span>
                  <span className="font-semibold">{p.purchaseCount} sales</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Order Trends (Last 4 Weeks)</p>
            <div className="flex gap-2 items-end h-16">
              {orderTrends.map((v, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full">
                  <div className="w-6 bg-green-400 rounded-t" style={{ height: `${v * 3}px` }}></div>
                  <span className="text-xs mt-1">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/seller/orders')}
            className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl mb-2">📋</div>
            <p className="font-semibold text-gray-900 dark:text-white">Manage Orders</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and process customer orders</p>
          </button>

          <button
            onClick={() => router.push('/seller/inquiries')}
            className="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg p-6 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl mb-2">💬</div>
            <p className="font-semibold text-gray-900 dark:text-white">Bulk Inquiries</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Respond to wholesale requests</p>
          </button>

          <button
            onClick={() => router.push('/seller/product-upload')}
            className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 hover:shadow-md transition-all text-left"
          >
            <div className="text-3xl mb-2">📦</div>
            <p className="font-semibold text-gray-900 dark:text-white">Upload Product</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a new product to your store</p>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                filterTab === tab
                  ? 'bg-[#0B6B3A] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 sm:p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                No {filterTab !== 'All' ? filterTab.toLowerCase() : ''} products yet.
              </p>
              <button
                onClick={() => router.push('/seller/product-upload')}
                className="inline-block bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-3xl sm:text-4xl">
                      {product.image}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 flex-wrap mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </h4>
                        <span
                          className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${getStatusColor(
                            product.status
                          )}`}
                        >
                          {getStatusEmoji(product.status)} {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </div>

                      {product.status === 'rejected' && product.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                          ⚠️ {product.rejectionReason}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Price</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ₦{product.price.toLocaleString()}/unit
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Qty Available</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.quantity.toLocaleString()} units
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">MOQ</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.moq.toLocaleString()} units
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Inquiries</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.inquiries > 0 ? product.inquiries : 'None'}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Added {product.createdAt}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => router.push(`/seller/product-edit/${product.id}`)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Product FAB */}
        <div className="sticky bottom-6 flex justify-center">
          <button
            onClick={() => router.push('/seller/product-upload')}
            className="inline-flex items-center gap-2 fixed bottom-6 right-6 sm:relative sm:bottom-auto sm:right-auto w-full sm:w-auto bg-[#0B6B3A] hover:bg-[#095234] text-white font-semibold py-3 sm:py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-xl">➕</span>
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add Product</span>
          </button>
        </div>

        {/* Educational Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Why Approval Matters</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Quality assurance for buyer trust</li>
            <li>✓ Fraud prevention across the platform</li>
            <li>✓ Export compliance verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
