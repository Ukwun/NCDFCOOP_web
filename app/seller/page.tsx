'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getSellerStats, getSellerRecentOrders, getSellerTopProducts } from '@/lib/services/sellerService';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { BarChart3, Package, TrendingUp, Settings, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';

function isDevSellerSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem('dev_autologin'));
}

function loadDevSellerProducts(sellerId: string) {
  if (typeof window === 'undefined' || !sellerId) return [];
  try {
    const raw = window.localStorage.getItem(`dev_seller_products_${sellerId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to load dev seller products', error);
    return [];
  }
}

function getSellerStatsFromLocalProducts(products: any[]) {
  const totalProducts = products.length;
  const totalRevenue = products.reduce((sum, item) => sum + (item.price || item.retailPrice || 0) * (item.stock || item.quantity || 0), 0);
  const totalOrders = 0;
  const retailRevenue = products.reduce((sum, item) => {
    const isWholesale = item.type === 'wholesale' || item.productType === 'wholesale';
    return sum + (!isWholesale ? (item.price || item.retailPrice || 0) * (item.stock || item.quantity || 0) : 0);
  }, 0);
  const wholesaleRevenue = products.reduce((sum, item) => {
    const isWholesale = item.type === 'wholesale' || item.productType === 'wholesale';
    return sum + (isWholesale ? (item.wholesalePrice || item.price || 0) * (item.stock || item.quantity || 0) : 0);
  }, 0);

  return {
    totalProducts,
    totalRevenue,
    totalOrders,
    totalProducts,
    retailRevenue,
    wholesaleRevenue,
    averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
    conversionRate: 0,
    lastUpdated: new Date(),
  };
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading, currentRole, logout } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signin');
      } else if (currentRole !== USER_ROLES.SELLER) {
        router.push('/home');
      } else {
        loadDashboardData();
      }
    }
  }, [user, loading, currentRole, router]);

  const loadDashboardData = async () => {
    try {
      if (!user?.uid) return;
      const devMode = isDevSellerSession();

      if (devMode) {
        const localProducts = loadDevSellerProducts(user.uid);
        if (localProducts.length > 0) {
          const statsData = getSellerStatsFromLocalProducts(localProducts);
          setStats(statsData);
          setRecentOrders([]);
          setTopProducts(localProducts.slice(0, 5));
          setPageLoading(false);
          return;
        }
      }

      const [statsData, ordersData, productsData] = await Promise.all([
        getSellerStats(user.uid),
        getSellerRecentOrders(user.uid, 5),
        getSellerTopProducts(user.uid, 5),
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);
      setPageLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (user?.uid && isDevSellerSession()) {
        const localProducts = loadDevSellerProducts(user.uid);
        if (localProducts.length > 0) {
          setStats(getSellerStatsFromLocalProducts(localProducts));
          setRecentOrders([]);
          setTopProducts(localProducts.slice(0, 5));
          setPageLoading(false);
          return;
        }
      }
      setError('Failed to load dashboard data');
      setPageLoading(false);
    }
  };

  if (pageLoading || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: AppColors.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <div
              className="w-8 h-8 border-4 border-gray-300 rounded-full"
              style={{ borderTopColor: AppColors.primary }}
            />
          </div>
          <p style={{ color: AppColors.textSecondary }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: AppColors.background }}
      >
        <div className="text-center">
          <p style={{ color: '#EF4444', ...AppTextStyles.h2 }}>{error}</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 px-6 py-2 rounded-lg"
            style={{ backgroundColor: AppColors.primary, color: 'white' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  return (
    <ProtectedRoute currentPath="/seller" requiredRoles={[USER_ROLES.SELLER]}>
      <div style={{ backgroundColor: AppColors.background }} className="min-h-screen">
      {/* Header with Navigation */}
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
            Seller Dashboard
          </h1>
          <p
            style={{
              ...AppTextStyles.bodyLarge,
              color: AppColors.textSecondary,
              marginTop: AppSpacing.sm,
            }}
          >
            Welcome back! Manage your products, orders, and analytics
          </p>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Total Products */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    ...AppTextStyles.labelSmall,
                    color: AppColors.textSecondary,
                  }}
                >
                  Total Products
                </p>
                <p
                  style={{
                    ...AppTextStyles.h2,
                    color: AppColors.textPrimary,
                    marginTop: AppSpacing.sm,
                  }}
                >
                  0
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${AppColors.primary}20`,
                }}
              >
                📦
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    ...AppTextStyles.labelSmall,
                    color: AppColors.textSecondary,
                  }}
                >
                  Active Orders
                </p>
                <p
                  style={{
                    ...AppTextStyles.h2,
                    color: AppColors.textPrimary,
                    marginTop: AppSpacing.sm,
                  }}
                >
                  0
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `#48BB7820`,
                }}
              >
                📋
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    ...AppTextStyles.labelSmall,
                    color: AppColors.textSecondary,
                  }}
                >
                  Total Revenue
                </p>
                <p
                  style={{
                    ...AppTextStyles.h2,
                    color: AppColors.textPrimary,
                    marginTop: AppSpacing.sm,
                  }}
                >
                  ₦0
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `#9F7AEA20`,
                }}
              >
                💰
              </div>
            </div>
          </div>

          {/* Pending Shipments */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    ...AppTextStyles.labelSmall,
                    color: AppColors.textSecondary,
                  }}
                >
                  To Ship
                </p>
                <p
                  style={{
                    ...AppTextStyles.h2,
                    color: AppColors.textPrimary,
                    marginTop: AppSpacing.sm,
                  }}
                >
                  0
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `#4299E120`,
                }}
              >
                🚚
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Products Management */}
          <div
            className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
            onClick={() => router.push('/seller/products')}
          >
            <div
              className="p-6 border-b"
              style={{
                borderColor: AppColors.border,
              }}
            >
              <h2
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                }}
              >
                📦 Product Management
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  marginTop: AppSpacing.sm,
                }}
              >
                Add, edit, or remove retail and wholesale products in your store.
              </p>
            </div>
            <div className="p-6">
              <button
                className="w-full py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: AppColors.primary,
                  color: 'white',
                }}
              >
                Manage Products →
              </button>
            </div>
          </div>

          {/* Orders */}
          <div
            className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
            onClick={() => router.push('/seller/orders')}
          >
            <div
              className="p-6 border-b"
              style={{
                borderColor: AppColors.border,
              }}
            >
              <h2
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                }}
              >
                📋 Order Management
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  marginTop: AppSpacing.sm,
                }}
              >
                Track orders, approve requests, and keep inventory aligned with demand.
              </p>
            </div>
            <div className="p-6">
              <button
                className="w-full py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#48BB78',
                  color: 'white',
                }}
              >
                View Orders →
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2
                style={{
                  ...AppTextStyles.h3,
                  color: AppColors.textPrimary,
                }}
              >
                Ready to list a new product?
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  marginTop: AppSpacing.sm,
                }}
              >
                Create a new retail or wholesale listing in seconds and keep your store inventory visible to buyers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/seller/products/add')}
                className="px-5 py-3 rounded-full font-semibold text-white bg-[#0B6B3A] hover:bg-[#095234] transition-colors"
              >
                Add New Product
              </button>
              <button
                onClick={() => router.push('/seller/products')}
                className="px-5 py-3 rounded-full font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Open Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
