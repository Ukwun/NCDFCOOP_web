'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Heart, ShoppingCart, Store } from 'lucide-react';
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

function fallbackImageForCategory(category?: string): string {
  const key = (category || '').toLowerCase();
  if (key.includes('vegetable')) return '/images/Tomatoes1.png';
  if (key.includes('grain')) return '/images/Buck wheat1.png';
  if (key.includes('oil')) return '/images/Groundnut oil1.png';
  if (key.includes('spice')) return '/images/Spices hamper1.png';
  if (key.includes('dairy')) return '/images/One crate eggs1.png';
  return '/images/Groceries1.png';
}

function sanitizeProductImage(url: string | undefined, category?: string): string {
  const fallback = fallbackImageForCategory(category);
  if (!url || url.includes('via.placeholder.com')) return fallback;
  return url;
}

export default function MemberHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: memberData } = useMemberData(user?.uid || '');
  const liveData = useUtilityLiveData(user?.uid || '', 'member');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [marketPulseTime, setMarketPulseTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setMarketPulseTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCatalog = async () => {
      try {
        setCatalogLoading(true);
        const products = await getProducts(80, 'retail');
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

  const sanitizedCatalogProducts = useMemo(() => {
    return catalogProducts.map((product) => {
      const safeThumbnail = sanitizeProductImage(product.thumbnail, product.category);
      const safeImages =
        product.images && product.images.length > 0
          ? product.images.map((img) => sanitizeProductImage(img, product.category))
          : [safeThumbnail];

      return {
        ...product,
        thumbnail: safeThumbnail,
        images: safeImages,
      };
    });
  }, [catalogProducts]);

  const ncdfDirectProducts = useMemo(() => {
    return sanitizedCatalogProducts
      .filter((product) => resolveProductOwnership(product) === 'ncdf')
      .sort((a, b) => (b.rating || 0) * 10 + (b.reviews || 0) - ((a.rating || 0) * 10 + (a.reviews || 0)))
      .slice(0, 4);
  }, [sanitizedCatalogProducts]);

  const marketplaceProducts = useMemo(() => {
    return sanitizedCatalogProducts
      .filter((product) => resolveProductOwnership(product) === 'seller')
      .sort((a, b) => (b.rating || 0) * 10 + (b.reviews || 0) - ((a.rating || 0) * 10 + (a.reviews || 0)))
      .slice(0, 4);
  }, [sanitizedCatalogProducts]);

  const categoryPanel = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of sanitizedCatalogProducts) {
      const key = (product.category || 'Other').trim();
      map.set(key, (map.get(key) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [sanitizedCatalogProducts]);

  const frequentlySearched = useMemo(() => {
    return [...sanitizedCatalogProducts]
      .sort((a, b) => {
        const scoreB = (b.reviews || 0) * 2 + (b.rating || 0) * 10;
        const scoreA = (a.reviews || 0) * 2 + (a.rating || 0) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [sanitizedCatalogProducts]);

  const displayCategoryPanel = categoryPanel;
  const displayFrequentlySearched = frequentlySearched.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price || 0),
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    image: product.thumbnail || product.images?.[0] || fallbackImageForCategory(product.category),
    href: `/products/${product.id}`,
  }));

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D3D63] via-[#0E527F] to-[#159A54] p-5 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ring-1 ring-white/25">
                <Store size={15} aria-hidden="true" />
                Member marketplace
              </span>
              <h1 className="mt-4 text-2xl font-black sm:text-4xl">
                Shop products from NCDF and verified sellers
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
                Browse live products, save favourites, add items to your cart and complete secure purchases using your member account.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Link
                href="/member-products"
                data-testid="member-open-marketplace"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-black text-[#0D3D63] shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse Marketplace
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} aria-hidden="true" />
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/favorites" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/20">
                  <Heart size={17} aria-hidden="true" />
                  Favourites
                </Link>
                <Link href="/cart" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/20">
                  <ShoppingCart size={17} aria-hidden="true" />
                  Cart
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marketplace Pulse</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Frequently searched product lanes, refreshed {marketPulseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <Link
              href="/products"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Open full marketplace
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_1fr]">
            <aside className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Product Categories</p>
              <div className="space-y-1">
                {displayCategoryPanel.map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm text-gray-800 hover:bg-white dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {cat.count}
                      <ChevronRight size={14} />
                    </span>
                  </Link>
                ))}
                {!catalogLoading && displayCategoryPanel.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    Categories will appear when sellers publish active products.
                  </p>
                )}
              </div>
            </aside>

            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-3 pb-2">
                {displayFrequentlySearched.map((product) => (
                  <Link
                    key={product.id}
                    href={product.href}
                    className="w-[210px] overflow-hidden rounded-xl border border-gray-200 bg-white text-left hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="h-28 w-full bg-gray-100 dark:bg-gray-700">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                      <p className="text-sm font-bold text-[#0B6B3A]">₦{Number(product.price || 0).toLocaleString()}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {(product.reviews || 0).toLocaleString()} searches • {product.rating?.toFixed(1) || '4.0'}★
                      </p>
                    </div>
                  </Link>
                ))}

                {!catalogLoading && displayFrequentlySearched.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
                    No active marketplace products are available yet. New seller listings will appear here automatically.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

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
              <Link href="/my-rewards" className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors text-center">
                Rewards Center
              </Link>
              <Link href="/offers" className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors text-center">
                Active Offers
              </Link>
              <Link href="/orders" className="px-4 py-3 rounded-xl bg-[#1E88C2] text-white font-semibold text-sm hover:bg-[#1977AB] transition-colors text-center">
                Track Orders
              </Link>
              <Link href="/products" className="px-4 py-3 rounded-xl bg-white text-[#0D3D63] font-semibold text-sm hover:bg-[#EAF2FA] transition-colors text-center">
                Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#B7D9EE] dark:border-gray-700 bg-[#EEF7FD] dark:bg-gray-800 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0D3D63] dark:text-[#7FC2EA]">Personalized Discovery</h2>
              <p className="text-sm text-[#2F5F82] dark:text-gray-300">Adaptive member intelligence that updates your next best financial and shopping actions.</p>
            </div>
            <Link
              href="/member/analytics"
              className="px-4 py-2 rounded-lg bg-[#0D3D63] hover:bg-[#0A304D] text-white text-sm font-medium"
            >
              Open My Telemetry
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Recommended Savings Plans</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Personalized plans tuned to your spending rhythm and rewards behavior.</p>
              <Link href="/my-rewards" className="mt-3 inline-block text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Explore Savings Plans</Link>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Featured Investments</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">High-confidence opportunities prioritized for cooperative members.</p>
              <Link href="/member/investments" className="mt-3 inline-block text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">View Investments</Link>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Financial Education</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Practical learning modules to improve budgeting and long-term value creation.</p>
              <Link href="/member-benefits" className="mt-3 inline-block text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Open Learning Hub</Link>
            </article>
            <article className="rounded-xl bg-white dark:bg-gray-900 border border-[#C9E4F4] dark:border-gray-700 p-4">
              <p className="text-xs uppercase tracking-wide text-[#4B7291] dark:text-gray-400">Portfolio Growth Insights</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">Live insight snapshots from your intent, order, and engagement telemetry.</p>
              <Link href="/member/analytics" className="mt-3 inline-block text-sm font-semibold text-[#0D3D63] dark:text-[#7FC2EA] hover:underline">Review Growth Insights</Link>
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
            <Link href="/my-rewards" className="mt-3 inline-block text-sm font-medium text-[#0E4B78] dark:text-[#7FC2EA] hover:underline">
              Redeem Points
            </Link>
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
            <Link
              href="/member-products"
              className="px-4 py-2 rounded-lg bg-[#0E4B78] hover:bg-[#0A3B5F] text-white text-sm font-medium"
            >
              Open NCDF Catalog
            </Link>
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
                  if (!Number.isFinite(safePrice) || safePrice <= 0) return;

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
            <Link
              href="/products"
              className="px-4 py-2 rounded-lg bg-[#0B6B3A] hover:bg-[#095234] text-white text-sm font-medium"
            >
              Open Marketplace
            </Link>
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
                  if (!Number.isFinite(safePrice) || safePrice <= 0) return;

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
