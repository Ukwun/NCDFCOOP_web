'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getSellerStats, getSellerRecentOrders, getSellerTopProducts } from '@/lib/services/sellerService';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { BarChart3, Package, ShoppingCart, TrendingUp, Settings, LogOut } from 'lucide-react';

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
        router.push('/welcome');
      } else if (currentRole !== 'seller') {
        router.push('/home');
      } else {
        loadDashboardData();
      }
    }
  }, [user, loading, currentRole]);

  const loadDashboardData = async () => {
    try {
      if (!user?.uid) return;

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
    router.push('/welcome');
  };

  return (
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
                Add, edit, or remove your products from the catalog
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
                View and fulfill pending orders
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

          {/* Analytics */}
          <div
            className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
            onClick={() => router.push('/seller/analytics')}
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
                📊 Sales Analytics
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  marginTop: AppSpacing.sm,
                }}
              >
                Review sales trends and performance metrics
              </p>
            </div>
            <div className="p-6">
              <button
                className="w-full py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#9F7AEA',
                  color: 'white',
                }}
              >
                View Analytics →
              </button>
            </div>
          </div>

          {/* Settings */}
          <div
            className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
            onClick={() => router.push('/seller/settings')}
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
                ⚙️ Store Settings
              </h2>
              <p
                style={{
                  ...AppTextStyles.bodySmall,
                  color: AppColors.textSecondary,
                  marginTop: AppSpacing.sm,
                }}
              >
                Manage store information and preferences
              </p>
            </div>
            <div className="p-6">
              <button
                className="w-full py-3 rounded-lg font-bold border-2"
                style={{
                  borderColor: AppColors.primary,
                  color: AppColors.primary,
                }}
              >
                Configure Store →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
