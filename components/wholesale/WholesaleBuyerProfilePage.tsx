'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BadgeDollarSign,
  Bell,
  Clock3,
  CreditCard,
  FileCheck2,
  Headset,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  MessageSquare,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  ShoppingCart,
  Target,
  Ticket,
  User,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/authContext';
import { USER_ROLES, COLLECTIONS } from '@/lib/constants/database';
import { db } from '@/lib/firebase/config';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { useUtilityLiveData } from '@/lib/hooks/useUtilityLiveData';
import ProtectedRoute from '@/components/ProtectedRoute';

interface FeatureItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

interface InterestProduct {
  id: string;
  title: string;
  image: string;
  href: string;
  supplier: string;
  supplierRegion: string;
  moq: string;
  unitPrice: string;
  leadTime: string;
  inStock: boolean;
}

const FEATURE_ITEMS: FeatureItem[] = [
  { id: 'favorites', label: 'Favorites', icon: Heart, href: '/favorites' },
  { id: 'history', label: 'Browsing history', icon: Clock3, href: '/orders' },
  { id: 'subscription', label: 'Subscription', icon: Ticket, href: '/notifications', badge: 'New' },
  { id: 'coupons', label: 'Coupons & credit', icon: BadgeDollarSign, href: '/offers' },
  { id: 'payment', label: 'Payment', icon: Wallet, href: '/wholesale/settings' },
  { id: 'shipping', label: 'Shipping addresses', icon: MapPin, href: '/delivery/dashboard' },
  { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, href: '/inquiries' },
  { id: 'rfq', label: 'Request for Quotation', icon: Target, href: '/inquiries' },
  { id: 'tax', label: 'Tax information', icon: ReceiptText, href: '/wholesale/compliance' },
];

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/home' },
  { id: 'categories', label: 'Categories', icon: LayoutGrid, href: '/products' },
  { id: 'messenger', label: 'Messenger', icon: MessageSquare, href: '/inquiries' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, href: '/cart' },
  { id: 'my-alibaba', label: 'My Alibaba', icon: User, href: '/wholesale/profile' },
];

const INTEREST_TABS = ['All', 'Apparel & Accessories', 'Mother, Kids & Toys'];

const INTEREST_PRODUCTS: InterestProduct[] = [
  {
    id: 'interest-1',
    title: 'Fortified White Garri 50kg Export Grade',
    image: '/images/Bag of garri1.png',
    href: '/products?q=fortified%20garri',
    supplier: 'Nasarawa Agro Cooperative Hub',
    supplierRegion: 'Nasarawa, NG',
    moq: '120 bags',
    unitPrice: 'NGN 18,400 / bag',
    leadTime: '4-6 days',
    inStock: true,
  },
  {
    id: 'interest-2',
    title: 'Parboiled Rice 25kg Institutional Pack',
    image: '/images/Buck wheat1.png',
    href: '/products?q=parboiled%20rice%2025kg',
    supplier: 'Middle Belt Grain Alliance',
    supplierRegion: 'Kaduna, NG',
    moq: '80 bags',
    unitPrice: 'NGN 31,900 / bag',
    leadTime: '5-8 days',
    inStock: true,
  },
];

function formatCurrency(value: number): string {
  return `NGN ${Math.round(value).toLocaleString()}`;
}

export default function WholesaleBuyerProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeOrders, totalSpent, error: ordersError } = useBuyerOrders(user?.uid || '');
  const liveData = useUtilityLiveData(user?.uid || '', 'institutional_buyer');

  const [activeTab, setActiveTab] = useState('All');
  const [liveClock, setLiveClock] = useState(() => new Date());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    setLiveClock(new Date());
    const timer = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(window.navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || !db) {
      setCartCount(0);
      return;
    }

    const cartQuery = query(
      collection(db, COLLECTIONS.CART_ITEMS),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      cartQuery,
      (snapshot) => {
        setCartCount(snapshot.size);
      },
      () => {
        setCartCount(0);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadMessages = liveData.unreadNotificationCount + liveData.unreadAlertCount;
  const displayTime = isHydrated
    ? liveClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const backendHealth = (() => {
    const message = ordersError?.message?.toLowerCase() || '';

    if (!isOnline) {
      return {
        tone: 'network' as const,
        title: 'You are offline',
        body: 'Live order and alert updates are paused until your connection is restored.',
      };
    }

    if (message.includes('permission')) {
      return {
        tone: 'warning' as const,
        title: 'Permission sync required',
        body: 'Some live account data is blocked by backend permissions. Contact platform support to restore full visibility.',
      };
    }

    if (message.includes('index')) {
      return {
        tone: 'warning' as const,
        title: 'Analytics index still provisioning',
        body: 'Core actions are available, but some live aggregates may remain unavailable until backend indexing completes.',
      };
    }

    if (ordersError) {
      return {
        tone: 'warning' as const,
        title: 'Live sync delay detected',
        body: 'The system is retrying real-time data sync. You can continue using operational actions.',
      };
    }

    return null;
  })();

  const isPreviewMode = process.env.NODE_ENV === 'development' && searchParams.get('preview') === '1';

  const withPreviewHref = (href: string) => {
    if (!isPreviewMode) return href;
    const delimiter = href.includes('?') ? '&' : '?';
    return `${href}${delimiter}preview=1`;
  };

  const content = (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900 md:pb-10">
      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{displayTime}</span>
            <span>Wholesale buyer workspace</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={withPreviewHref('/account')}
                aria-label="Open account avatar"
                data-audit-id="header-avatar"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl font-bold text-slate-700"
              >
                {(user?.displayName || 'S').charAt(0).toUpperCase()}
              </Link>

              <Link
                href={withPreviewHref('/account')}
                aria-label="Open account profile"
                data-audit-id="header-profile"
                className="min-w-0"
              >
                <p className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{user?.displayName || 'Wholesale Buyer'}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" /> Deliver to NG
                </p>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <IconButton icon={<Headset size={18} />} href={withPreviewHref('/inquiries')} label="Support" />
              <IconButton icon={<ScanLine size={18} />} href={withPreviewHref('/products')} label="Scan" />
              <IconButton icon={<Settings size={18} />} href={withPreviewHref('/wholesale/settings')} label="Settings" />
            </div>
          </div>
        </section>

        {backendHealth ? (
          <section className="mt-3">
            <div
              className={`rounded-xl border px-4 py-3 ${
                backendHealth.tone === 'network' ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'
              }`}
            >
              <p className="text-sm font-bold text-slate-900">{backendHealth.title}</p>
              <p className="mt-1 text-sm text-slate-600">{backendHealth.body}</p>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Recheck Health
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Role Operations</h2>
            <Link
              href={withPreviewHref('/wholesale/settings')}
              data-audit-id="feature-manage"
              className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Manage
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {FEATURE_ITEMS.map((item) => {
              const Icon = item.icon;
              const targetHref = isPreviewMode && item.id === 'history' ? '/wholesale/orders' : item.href;

              return (
                <Link
                  key={item.id}
                  href={withPreviewHref(targetHref)}
                  data-audit-id={`feature-${item.id}`}
                  className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
                >
                  {item.badge ? (
                    <span className="absolute right-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700">
                    <Icon size={20} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{item.label}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Order Intelligence</h3>
            <Link href={withPreviewHref('/wholesale/orders')} data-audit-id="orders-view-all" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Active" value={String(activeOrders.length)} href={withPreviewHref('/wholesale/orders')} />
            <MiniStat label="Alerts" value={String(liveData.slaRiskCount)} href={withPreviewHref('/wholesale/compliance')} />
            <MiniStat label="Spend" value={formatCurrency(totalSpent)} href={withPreviewHref('/wholesale/analytics')} />
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <Link
            href={withPreviewHref('/referral-program')}
            data-audit-id="referral-banner"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
          >
            <p className="text-lg font-bold text-amber-900">Referral credits for wholesale teams</p>
            <p className="mt-1 text-sm text-amber-800">Earn incentives and unlock more procurement credits.</p>
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <PromoRow title="AI sourcing assistant trial" href={withPreviewHref('/offers')} />
            <PromoRow title="Start selling as supplier" href={withPreviewHref('/seller/onboarding')} borderTop />
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Interest-based procurement</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Live wholesale signals refreshed at {liveClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(withPreviewHref('/products'))}
              aria-label="Search interests"
              data-audit-id="interests-search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700"
            >
              <Search size={18} />
            </button>

            {INTEREST_TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  data-audit-id={`interests-tab-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INTEREST_PRODUCTS.map((product) => {
              const cardId = product.id === 'interest-1' ? '1' : '2';
              return (
                <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div className="relative h-40 w-full bg-slate-100">
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        product.inStock ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {product.inStock ? 'In stock' : 'Limited stock'}
                    </span>
                  </div>

                  <div className="space-y-2 px-3 py-3">
                    <Link
                      href={withPreviewHref(product.href)}
                      data-audit-id={`interest-product-${cardId}`}
                      className="block text-sm font-bold leading-snug text-slate-900 hover:underline"
                    >
                      {product.title}
                    </Link>

                    <p className="text-xs text-slate-600">
                      Supplier: <span className="font-semibold text-slate-700">{product.supplier}</span> • {product.supplierRegion}
                    </p>

                    <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-2 text-[11px] text-slate-600">
                      <div>
                        <p className="font-semibold text-slate-500">MOQ</p>
                        <p className="font-bold text-slate-800">{product.moq}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500">Unit price</p>
                        <p className="font-bold text-slate-800">{product.unitPrice}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500">Lead time</p>
                        <p className="font-bold text-slate-800">{product.leadTime}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={withPreviewHref(product.href)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View Product
                      </Link>
                      <Link
                        href={withPreviewHref(`/inquiries?intent=rfq&product=${encodeURIComponent(product.title)}`)}
                        className="rounded-md bg-emerald-700 px-2 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        Request Quote
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'my-alibaba';
            const targetHref = isPreviewMode && item.id === 'cart' ? '/signin?next=/cart' : item.href;
            const countBadge = item.id === 'messenger' ? unreadMessages : item.id === 'cart' ? cartCount : 0;

            return (
              <Link
                key={item.id}
                href={withPreviewHref(targetHref)}
                data-audit-id={item.id === 'my-alibaba' ? 'bottom-profile' : `bottom-${item.id}`}
                className={`relative flex flex-col items-center justify-center rounded-md px-1 py-2 ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}
              >
                <span className="relative inline-flex">
                  <Icon size={20} className={isActive ? 'stroke-[2.2]' : 'stroke-[1.9]'} />
                  {countBadge > 0 ? (
                    <span className="absolute -right-2 -top-2 min-w-[17px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {countBadge > 99 ? '99+' : countBadge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  if (isPreviewMode) {
    return content;
  }

  return (
    <ProtectedRoute currentPath="/wholesale/profile" requiredRoles={[USER_ROLES.INSTITUTIONAL_BUYER]}>
      {content}
    </ProtectedRoute>
  );
}

function IconButton({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      data-audit-id={`header-${label.toLowerCase()}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
    >
      {icon}
    </Link>
  );
}

function MiniStat({ label, value, href }: { label: string; value: string; href: string }) {
  const statId = `orders-${label.toLowerCase()}`;
  return (
    <Link
      href={href}
      data-audit-id={statId}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left hover:bg-slate-100"
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-slate-900">{value}</p>
    </Link>
  );
}

function PromoRow({ title, href, borderTop = false }: { title: string; href: string; borderTop?: boolean }) {
  const promoId = title.includes('assistant') ? 'promo-accio' : 'promo-start-selling';
  return (
    <Link
      href={href}
      data-audit-id={promoId}
      className={`block w-full px-4 py-4 text-left ${borderTop ? 'border-t border-slate-200' : ''}`}
    >
      <p className="text-base font-semibold text-slate-800">{title}</p>
    </Link>
  );
}
