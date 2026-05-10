'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { useMemberData } from '@/lib/hooks/useMemberData';
import { useUtilityLiveData } from '@/lib/hooks/useUtilityLiveData';
import { addToCart } from '@/lib/services/cartService';
import { getProducts } from '@/lib/services/productService';
import { Product } from '@/lib/types/product';
import ProductCard from './ProductCard';
import GlobalUtilityLayer from '@/components/GlobalUtilityLayer';
import TrustSignalsStrip from './TrustSignalsStrip';
import { resolveProductOwnership } from '@/lib/utils/productOwnership';

export default function MemberHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData } = useMemberData(user?.uid || '');
  const liveData = useUtilityLiveData(user?.uid || '', 'member');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true);
        const products = await getProducts(80);
        if (mounted) {
          setCatalogProducts(products);
        }
      } catch (error) {
        console.error('Error loading member catalog products:', error);
        if (mounted) {
          setCatalogProducts([]);
        }
      } finally {
        if (mounted) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const tier = (memberData?.tier || 'bronze').toUpperCase();
    const points = memberData?.rewardsPoints || 0;
    const discount = memberData?.discountPercentage || 5;
    const spent = memberData?.totalSpent || 0;
    const projectedValue = Math.round(spent * (discount / 100));

    return { tier, points, discount, spent, projectedValue };
  }, [memberData]);

  const ncdfDirectProducts = useMemo(() => {
    return catalogProducts
      .filter((product) => resolveProductOwnership(product) === 'ncdf')
      .sort((a, b) => (b.rating || 0) * 10 + (b.reviews || 0) - ((a.rating || 0) * 10 + (a.reviews || 0)))
      .slice(0, 4);
  }, [catalogProducts]);

  const marketplaceProducts = useMemo(() => {
    return catalogProducts
      .filter((product) => resolveProductOwnership(product) === 'seller')
      .sort((a, b) => (b.rating || 0) * 10 + (b.reviews || 0) - ((a.rating || 0) * 10 + (a.reviews || 0)))
      .slice(0, 4);
  }, [catalogProducts]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <GlobalUtilityLayer
          role="member"
          kpiSummary={`Tier ${summary.tier} • ${summary.points.toLocaleString()} points • ${summary.discount}% active discount • Alerts ${liveData.unreadAlertCount}`}
          liveData={liveData}
        />

        <TrustSignalsStrip
          verifiedSuppliersCount={liveData.verifiedSuppliersCount}
          suppliersObservedCount={liveData.suppliersObservedCount}
          transactionProtectionRate={liveData.transactionProtectionRate}
          deliveryConfidenceRate={liveData.deliveryConfidenceRate}
          slaRiskCount={liveData.slaRiskCount}
          complianceDriftLevel={liveData.complianceDriftLevel}
        />

        <section className="rounded-2xl bg-gradient-to-r from-[#0D3D63] via-[#0E527F] to-[#1576A9] text-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Member Intelligence Console</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Welcome, {user?.displayName?.split(' ')[0] || 'Member'}</h1>
              <p className="mt-2 text-sm sm:text-base opacity-90 max-w-2xl">
                Your cooperative dashboard now prioritizes trust infrastructure first, then shopping execution.
                Track your tier, compliance posture, personalized offers, and conversion actions from one command surface.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <button onClick={() => router.push('/my-rewards')} className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors">
                Rewards Center
              </button>
              <button onClick={() => router.push('/offers')} className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                Active Offers
              </button>
              <button onClick={() => router.push('/orders')} className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors">
                Track Orders
              </button>
              <button onClick={() => router.push('/products')} className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors">
                Marketplace
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#B7D9EE] dark:border-gray-700 bg-[#EEF7FD] dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0D3D63] dark:text-[#7FC2EA]">Personalized Discovery</h2>
              <p className="text-sm text-[#2F5F82] dark:text-gray-300">Adaptive member intelligence that updates your next best financial and shopping actions.</p>
            </div>
            <button
              onClick={() => router.push('/member/analytics')}
              className="px-4 py-2 rounded-lg bg-[#0D3D63] hover:bg-[#0A304D] text-white text-sm font-medium"
            >
              Open My Telemetry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Recommended Savings Plans</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Personalized plans tuned to your spending rhythm and rewards behavior.</p>
              <button onClick={() => router.push('/my-rewards')} className="mt-3 text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Explore Savings Plans</button>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Featured Investments</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">High-confidence opportunities prioritized for cooperative members.</p>
              <button onClick={() => router.push('/member/investments')} className="mt-3 text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">View Investments</button>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Financial Education</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Practical learning modules to improve budgeting and long-term value creation.</p>
              <button onClick={() => router.push('/member-benefits')} className="mt-3 text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Open Learning Hub</button>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Portfolio Growth Insights</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Live insight snapshots from your intent, order, and engagement telemetry.</p>
              <button onClick={() => router.push('/member/analytics')} className="mt-3 text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Review Growth Insights</button>
            </article>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Loyalty Tier</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">{summary.tier}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Discount band: {summary.discount}%</p>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Points Balance</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">{summary.points.toLocaleString()}</p>
            <button onClick={() => router.push('/my-rewards')} className="mt-3 text-sm font-medium text-[#0E4B78] dark:text-[#7FC2EA] hover:underline">
              Redeem Points
            </button>
          </article>
          <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Projected Value Saved</p>
            <p className="text-2xl font-bold text-[#0D3D63] dark:text-[#7FC2EA] mt-1">₦{summary.projectedValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Protection rate: {liveData.transactionProtectionRate}%</p>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">NCDF Direct Picks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">First-party NCDF inventory curated for member value and fulfillment reliability.</p>
            </div>
            <button
              onClick={() => router.push('/member-products')}
              className="px-4 py-2 rounded-lg bg-[#0E4B78] hover:bg-[#0A3B5F] text-white text-sm font-medium"
            >
              Open NCDF Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ncdfDirectProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(targetId) => router.push(`/products/${targetId}`)}
                onAddToCart={async (prod, quantity) => {
                  if (!user) {
                    router.push('/signin');
                    return;
                  }

                  const safePrice = Number(prod.price);
                  if (!Number.isFinite(safePrice)) {
                    alert('This product has incomplete pricing data and cannot be added to cart yet.');
                    return;
                  }

                  await addToCart(
                    user.uid,
                    prod.id,
                    prod.name,
                    safePrice,
                    prod.thumbnail || prod.images?.[0] || '',
                    quantity
                  );
                }}
              />
            ))}
            {!catalogLoading && ncdfDirectProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-300">
                No NCDF Direct products are available right now. Use Open NCDF Catalog to browse the latest inventory.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marketplace Seller Picks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Third-party sellers competing on value and assortment inside the same ecosystem.</p>
            </div>
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-medium"
            >
              Open Marketplace
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {marketplaceProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(targetId) => router.push(`/products/${targetId}`)}
                onAddToCart={async (prod, quantity) => {
                  if (!user) {
                    router.push('/signin');
                    return;
                  }

                  const safePrice = Number(prod.price);
                  if (!Number.isFinite(safePrice)) {
                    alert('This product has incomplete pricing data and cannot be added to cart yet.');
                    return;
                  }

                  await addToCart(
                    user.uid,
                    prod.id,
                    prod.name,
                    safePrice,
                    prod.thumbnail || prod.images?.[0] || '',
                    quantity
                  );
                }}
              />
            ))}
            {!catalogLoading && marketplaceProducts.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-300">
                No marketplace seller products are available right now. Use Open Marketplace to browse current seller listings.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
