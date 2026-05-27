'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Boxes, ChartBar, ChevronRight, CircleCheck, Filter, Minus, Plus, Search, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useUtilityLiveData } from '@/lib/hooks/useUtilityLiveData';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { addToCart, CART_CHANGED_EVENT, getUserCart } from '@/lib/services/cartService';

interface WholesaleProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  stock: number;
  unit: string;
  thumbnail: string;
  minimumOrder: number;
  sellerName: string;
}

interface QuoteDraft {
  productId?: string;
  productName: string;
  quantity: string;
  targetPrice: string;
}

const WHOLESALE_PRODUCTS: WholesaleProduct[] = [
  {
    id: 'wholesale-p1',
    name: 'Bulk Garri Crates',
    description: 'Commercial-grade garri supply package for institutional buyers.',
    price: 99000,
    originalPrice: 116000,
    category: 'Grains',
    stock: 120,
    unit: 'crate',
    thumbnail: '/images/Bag of garri1.png',
    minimumOrder: 10,
    sellerName: 'NCDF Bulk Grain Desk',
  },
  {
    id: 'wholesale-p5',
    name: 'Institutional Rice Distribution Pack',
    description: 'Platform-operated rice inventory optimized for compliance and fulfillment.',
    price: 105000,
    originalPrice: 124000,
    category: 'Grains',
    stock: 145,
    unit: 'batch',
    thumbnail: '/images/Buck wheat1.png',
    minimumOrder: 10,
    sellerName: 'NCDF Institutional Supply',
  },
  {
    id: 'wholesale-p2',
    name: 'Institutional Palm Oil Pack',
    description: 'High-volume palm oil inventory for kitchen and retail operations.',
    price: 128000,
    originalPrice: 149000,
    category: 'Oils',
    stock: 85,
    unit: 'batch',
    thumbnail: '/images/Palm Oil.png',
    minimumOrder: 8,
    sellerName: 'Agro Supply Core',
  },
  {
    id: 'wholesale-p3',
    name: 'Cassava Flour Production Set',
    description: 'Wholesale flour lots for production teams and B2B procurement.',
    price: 87000,
    originalPrice: 102000,
    category: 'Grains',
    stock: 93,
    unit: 'lot',
    thumbnail: '/images/Cassava Flour.png',
    minimumOrder: 10,
    sellerName: 'FarmersDirect B2B',
  },
  {
    id: 'wholesale-p4',
    name: 'Commercial Egg Carton Grid',
    description: 'Consistent high-volume egg inventory for institutions.',
    price: 76000,
    originalPrice: 90500,
    category: 'Proteins',
    stock: 64,
    unit: 'grid',
    thumbnail: '/images/Eggs (30pc).png',
    minimumOrder: 12,
    sellerName: 'Protein Logistics Hub',
  },
];

function formatCurrency(value: number): string {
  return `NGN ${Math.round(value).toLocaleString()}`;
}

function savingsPerUnit(product: WholesaleProduct): number {
  return Math.max(0, product.originalPrice - product.price);
}

export default function WholesaleBuyerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const liveData = useUtilityLiveData(user?.uid || '', 'institutional_buyer');
  const { activeOrders, completedOrders, totalSpent } = useBuyerOrders(user?.uid || '');

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [desiredQuantities, setDesiredQuantities] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState(0);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>({
    productName: '',
    quantity: '100',
    targetPrice: '',
  });
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [bannerMessage, setBannerMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawHistory = window.localStorage.getItem('wholesale_recent_products');
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as string[];
        setRecentProductIds(parsed.slice(0, 8));
      } catch {
        setRecentProductIds([]);
      }
    }
  }, []);

  const refreshCartSummary = async () => {
    if (!user?.uid) {
      setCartItems(0);
      setCartSubtotal(0);
      return;
    }

    try {
      const cart = await getUserCart(user.uid);
      setCartItems(cart.items.reduce((acc, item) => acc + item.quantity, 0));
      setCartSubtotal(cart.subtotal);
    } catch {
      setCartItems(0);
      setCartSubtotal(0);
    }
  };

  useEffect(() => {
    refreshCartSummary();

    const handleCartChanged = () => {
      refreshCartSummary();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    }

    if (!user?.uid) {
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
        }
      };
    }

    const interval = setInterval(refreshCartSummary, 15000);
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
      }
    };
  }, [user?.uid]);

  const categories = useMemo(() => {
    const unique = new Set(['All']);
    WHOLESALE_PRODUCTS.forEach((product) => unique.add(product.category));
    return Array.from(unique);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchText.toLowerCase();
    return WHOLESALE_PRODUCTS
      .filter((product) => {
        const matchesSearch =
          query.length === 0 ||
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.sellerName.toLowerCase().includes(query);

        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesStock = !inStockOnly || product.stock > 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => savingsPerUnit(b) - savingsPerUnit(a));
  }, [inStockOnly, searchText, selectedCategory]);

  const recentProducts = useMemo(() => {
    if (recentProductIds.length === 0) return [] as WholesaleProduct[];
    const catalogById = Object.fromEntries(WHOLESALE_PRODUCTS.map((p) => [p.id, p]));
    return recentProductIds
      .map((id) => catalogById[id])
      .filter((product): product is WholesaleProduct => !!product);
  }, [recentProductIds]);

  const trackRecentProduct = (productId: string) => {
    if (typeof window === 'undefined') return;
    const next = [productId, ...recentProductIds.filter((id) => id !== productId)].slice(0, 8);
    setRecentProductIds(next);
    window.localStorage.setItem('wholesale_recent_products', JSON.stringify(next));
  };

  const onOpenProduct = (productId: string) => {
    trackRecentProduct(productId);
    router.push(`/products/${productId}`);
  };

  const updateQuantity = (productId: string, nextQuantity: number, minimumOrder: number) => {
    const min = Math.max(1, minimumOrder);
    setDesiredQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(min, nextQuantity),
    }));
  };

  const getDesiredQuantity = (product: WholesaleProduct) => {
    return desiredQuantities[product.id] ?? Math.max(1, product.minimumOrder);
  };

  const onAddToCart = async (product: WholesaleProduct) => {
    if (!user?.uid) {
      setBannerMessage('Sign in is required before adding wholesale items to cart.');
      router.push('/signin');
      return;
    }

    const quantity = getDesiredQuantity(product);

    try {
      await addToCart(
        user.uid,
        product.id,
        product.name,
        product.price,
        product.thumbnail,
        quantity
      );
      await refreshCartSummary();
      setBannerMessage(`Added ${quantity} x ${product.name} to cart.`);
    } catch {
      setBannerMessage('Unable to add this item to cart. Please retry.');
    }
  };

  const openQuoteDialog = (product?: WholesaleProduct) => {
    setQuoteDraft({
      productId: product?.id,
      productName: product?.name || '',
      quantity: product ? String(product.minimumOrder) : '100',
      targetPrice: product ? String(Math.round(product.price)) : '',
    });
    setIsQuoteOpen(true);
  };

  const submitQuoteRequest = () => {
    setIsQuoteOpen(false);
    setBannerMessage('Quote request drafted. Continue the conversation in Inquiries.');
    router.push('/inquiries');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <ModeTab label="Discover" isActive={false} onClick={() => router.push('/products')} />
          <ModeTab label="Wholesale" isActive onClick={() => {}} />
          <ModeTab label="Orders" isActive={false} onClick={() => router.push('/wholesale/orders')} />
        </div>

        <section className="rounded-2xl border border-[#B6DCC6] bg-white dark:bg-gray-800 p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#CBE4D6] bg-[#F8FCFA] px-3 py-2">
              <Search size={18} className="text-gray-500" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search products, SKUs, or suppliers"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {searchText ? (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <button
              onClick={() => router.push(`/products${searchText ? `?q=${encodeURIComponent(searchText)}` : ''}`)}
              className="rounded-xl bg-[#164A2E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#113924]"
            >
              Search
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <MetricCard
            icon={<ShoppingCart size={16} />}
            label="Live Cart"
            value={`${cartItems} items`}
            detail={formatCurrency(cartSubtotal)}
            onClick={() => router.push('/cart')}
          />
          <MetricCard
            icon={<Truck size={16} />}
            label="Active Orders"
            value={String(activeOrders.length)}
            detail={`${completedOrders.length} completed`}
            onClick={() => router.push('/wholesale/orders')}
          />
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricCard
            icon={<ShieldCheck size={16} />}
            label="Compliance Drift"
            value={liveData.complianceDriftLevel.toUpperCase()}
            detail="live operational posture"
            onClick={() => router.push('/wholesale/compliance')}
          />
          <MetricCard
            icon={<CircleCheck size={16} />}
            label="Delivery Confidence"
            value={`${liveData.deliveryConfidenceRate}%`}
            detail="based on current logistics telemetry"
            onClick={() => router.push('/wholesale/analytics')}
          />
          <MetricCard
            icon={<ChartBar size={16} />}
            label="SLA Risk Alerts"
            value={String(liveData.slaRiskCount)}
            detail="supplier exceptions requiring attention"
            onClick={() => router.push('/wholesale/analytics')}
          />
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <QuickAction
            title="Browse by Category"
            icon={<Boxes size={20} />}
            onClick={() => router.push('/products')}
          />
          <QuickAction
            title="Request Quotation"
            icon={<ChartBar size={20} />}
            onClick={() => openQuoteDialog()}
          />
          <QuickAction
            title="Open Cart"
            icon={<ShoppingCart size={20} />}
            onClick={() => router.push('/cart')}
          />
          <QuickAction
            title="Chat Suppliers"
            icon={<Bell size={20} />}
            onClick={() => router.push('/inquiries')}
          />
        </section>

        <section className="rounded-2xl border border-[#D9E7DF] bg-gradient-to-r from-[#E9F7EF] to-[#F6FBF8] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              className="text-left"
              onClick={() => router.push('/wholesale/compliance')}
            >
              <TrustRow
                icon={<Truck size={18} />}
                title="Priority freight"
                subtitle="for compliant wholesale orders"
              />
            </button>
            <button
              className="text-left"
              onClick={() => router.push('/wholesale/settings')}
            >
              <TrustRow
                icon={<ShieldCheck size={18} />}
                title="Trade protection"
                subtitle="verified seller and payment security"
              />
            </button>
          </div>
        </section>

        {recentProducts.length > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Buying Activity</h2>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
              {recentProducts.map((product) => (
                <article key={product.id} className="min-w-[220px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="h-24 rounded-lg bg-gray-100">
                    <img src={product.thumbnail} alt={product.name} className="h-full w-full rounded-lg object-cover" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                  <button
                    onClick={() => onOpenProduct(product.id)}
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                  >
                    Re-open <ChevronRight size={14} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const active = category === selectedCategory;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  active
                    ? 'border-[#164A2E] bg-[#164A2E] text-white'
                    : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </section>

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setInStockOnly((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
              inStockOnly
                ? 'bg-[#164A2E] text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            <Filter size={14} /> In-stock only
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {searchText ? `Filtered by "${searchText}"` : 'Showing top wholesale opportunities'}
          </p>
          <p className="text-sm font-semibold text-[#164A2E] dark:text-[#8FD8AE] ml-auto">
            Total spend: {formatCurrency(totalSpent)}
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live Wholesale Deals</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Sorted by highest real savings compared to market price.</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              No products match your current wholesale filters.
            </div>
          ) : (
            filteredProducts.slice(0, 24).map((product) => {
              const quantity = getDesiredQuantity(product);
              const savings = savingsPerUnit(product);

              return (
                <article key={product.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <button
                      onClick={() => onOpenProduct(product.id)}
                      className="h-24 w-full md:w-32 overflow-hidden rounded-lg bg-gray-100"
                    >
                      <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                    </button>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{product.description}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-[#164A2E] dark:text-[#8FD8AE]">{formatCurrency(product.price)}</span>
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                        <Tag text={`Save ${formatCurrency(savings)} / unit`} />
                        <Tag text={`MOQ ${product.minimumOrder}`} />
                        <Tag text={product.stock > 0 ? `Stock ${product.stock}` : 'Out of stock'} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Quantity</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1, product.minimumOrder)}
                          className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1, product.minimumOrder)}
                          className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => openQuoteDialog(product)}
                          className="ml-auto rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                        >
                          Quote
                        </button>
                        <button
                          onClick={() => onAddToCart(product)}
                          disabled={product.stock <= 0}
                          className="rounded-lg bg-[#164A2E] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#113924] disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {bannerMessage ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 rounded-xl border border-[#B6DCC6] bg-white px-4 py-3 shadow-lg dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <CircleCheck size={16} className="text-[#164A2E]" />
            <span>{bannerMessage}</span>
            <button
              onClick={() => setBannerMessage('')}
              className="ml-auto rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {isQuoteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 md:items-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Wholesale Quote</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Share target quantity and price. Your request continues in supplier chat.</p>

            <div className="mt-4 space-y-3">
              <input
                value={quoteDraft.productName}
                onChange={(event) => setQuoteDraft((prev) => ({ ...prev, productName: event.target.value }))}
                placeholder="Product"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              <input
                value={quoteDraft.quantity}
                onChange={(event) => setQuoteDraft((prev) => ({ ...prev, quantity: event.target.value }))}
                placeholder="Quantity"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
              <input
                value={quoteDraft.targetPrice}
                onChange={(event) => setQuoteDraft((prev) => ({ ...prev, targetPrice: event.target.value }))}
                placeholder="Target price per unit (NGN)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsQuoteOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitQuoteRequest}
                className="rounded-lg bg-[#164A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#113924]"
              >
                Submit Quote Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModeTab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="min-w-[84px] text-left">
      <p className={`text-base ${isActive ? 'font-extrabold text-gray-900 dark:text-white' : 'font-semibold text-gray-500 dark:text-gray-300'}`}>{label}</p>
      <div className={`mt-1 h-1 rounded-full ${isActive ? 'bg-[#164A2E]' : 'bg-transparent'}`} />
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#A5CEB5] dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-300">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-300">{detail}</p>
    </button>
  );
}

function QuickAction({ title, icon, onClick }: { title: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-[#A5CEB5] dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="rounded-lg bg-[#E6F4EC] p-2 text-[#164A2E]">{icon}</div>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
    </button>
  );
}

function TrustRow({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="rounded-md bg-white p-1.5 text-[#164A2E]">{icon}</div>
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Tag({ text }: { text: string }) {
  return <span className="rounded-full bg-[#E6F4EC] px-2 py-1 text-[11px] font-semibold text-[#164A2E]">{text}</span>;
}
