'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getSellerStats, SellerStats } from '@/lib/services/sellerService';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { BarChart3, Package, TrendingUp, Settings, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';


export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading, currentRole, logout } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);

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

      setError(null);
      const statsData = await getSellerStats(user.uid);
      setStats(statsData);
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
                  {stats?.totalProducts ?? 0}
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
                  {stats?.totalOrders ?? 0}
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
                  ₦{(stats?.totalRevenue ?? 0).toLocaleString()}
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
                  {stats?.totalOrders ?? 0}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

          <div
            className="overflow-hidden rounded-lg border border-emerald-300 bg-gradient-to-br from-emerald-950 to-emerald-700 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            onClick={() => router.push('/seller/wholesale-orders')}
          >
            <div className="border-b border-white/15 p-6"><span className="rounded-full bg-amber-300 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-950">B2B priority</span><h2 className="mt-3 text-xl font-bold">Wholesale Fulfillment</h2><p className="mt-2 text-sm text-emerald-100">See bulk pricing, MOQ commitments, compliance gates, and set delivery SLAs.</p></div>
            <div className="p-6"><button onClick={(event) => { event.stopPropagation(); router.push('/seller/wholesale-orders'); }} className="w-full rounded-lg bg-white py-3 font-bold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-50">Open Bulk Orders →</button></div>
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
