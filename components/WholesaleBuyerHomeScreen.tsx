'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Boxes, ChartBar, ChevronRight, CircleCheck, Filter, Minus, Plus, Search, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useUtilityLiveData } from '@/lib/hooks/useUtilityLiveData';
import { getProducts } from '@/lib/services/productService';
import { createInquiry } from '@/lib/services/inquiryService';
import { createNotification } from '@/lib/services/notificationService';
import { Product } from '@/lib/types/product';
import { useBuyerOrders } from '@/lib/hooks/useBuyerOrders';
import { addToCart, CART_CHANGED_EVENT, getUserCart } from '@/lib/services/cartService';

interface QuoteDraft {
  productId?: string;
  productName: string;
  quantity: string;
  targetPrice: string;
}

function formatCurrency(value: number | undefined): string {
  return `₦${Math.round(value || 0).toLocaleString()}`;
}

function savingsPerUnit(product: Product): number {
  const original = product.originalPrice || 0;
  const current = product.wholesalePrice || product.price || 0;
  return Math.max(0, original - current);
}

export default function WholesaleBuyerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const liveData = useUtilityLiveData(user?.uid || '', 'institutional_buyer');
  const { activeOrders, completedOrders, totalSpent } = useBuyerOrders(user?.uid || '');
  const [wholesaleProducts, setWholesaleProducts] = useState<Product[]>([]);

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

  // Fetch wholesale products from the service
  useEffect(() => {
    const fetchWholesaleProducts = async () => {
      try {
        const products = await getProducts(100, 'wholesale'); // Fetch products of type 'wholesale' or 'both'
        setWholesaleProducts(products);
      } catch (error) {
        console.error('Error fetching wholesale products:', error);
      }
    };
    fetchWholesaleProducts();
  }, []);

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
    const unique = new Set(['All', ...wholesaleProducts.map(p => p.category)]);
    return Array.from(unique);
  }, [wholesaleProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchText.toLowerCase();
    return wholesaleProducts
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
  }, [wholesaleProducts, inStockOnly, searchText, selectedCategory]);

  const recentProducts = useMemo(() => {
    if (recentProductIds.length === 0) return [] as Product[];
    const catalogById = Object.fromEntries(wholesaleProducts.map((p) => [p.id, p]));
    return recentProductIds
      .map((id) => catalogById[id])
      .filter((product): product is Product => !!product);
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

  const updateQuantity = (productId: string, nextQuantity: number, minimumOrder: number = 1) => {
    const min = Math.max(1, minimumOrder);
    setDesiredQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(min, nextQuantity),
    }));
  };

  const getDesiredQuantity = (product: Product) => {
    return desiredQuantities[product.id] ?? Math.max(1, product.minOrderQuantity || 1);
  };

  const onAddToCart = async (product: Product) => {
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
        product.wholesalePrice || product.price, // Use wholesale price if available
        product.thumbnail,
        quantity
      );
      await refreshCartSummary();
      setBannerMessage(`Added ${quantity} x ${product.name} to cart.`);
    } catch {
      setBannerMessage('Unable to add this item to cart. Please retry.');
    }
  };

  const openQuoteDialog = (product?: Product) => {
    setQuoteDraft({
      productId: product?.id,
      productName: product?.name || '',
      quantity: product ? String(product.minOrderQuantity || 100) : '100',
      targetPrice: product ? String(Math.round(product.wholesalePrice || product.price)) : '',
    });
    setIsQuoteOpen(true);
  };

  const submitQuoteRequest = () => {
    // Send a real inquiry when a quote is submitted so sellers receive it
    (async () => {
      setIsQuoteOpen(false);

      if (!user) {
        setBannerMessage('Sign in is required to send quote requests.');
        router.push('/signin');
        return;
      }

      try {
        const product = wholesaleProducts.find((p) => p.id === quoteDraft.productId);
        const sellerId = product?.sellerId || '';
        const sellerName = product?.sellerName || 'NCDFCOOP Seller';
        const buyerName = user.displayName || user.email || 'Buyer';
        const quantity = Number(quoteDraft.quantity) || 1;
        const budget = Number(quoteDraft.targetPrice) || 0;

        const message = `Quote request for ${quoteDraft.productName || 'item'}. Quantity: ${quantity}. Target price: ${budget ? `₦${budget}` : 'negotiable'}.`;

        const inquiryId = await createInquiry({
          sellerId,
          sellerName,
          buyerId: user.uid,
          buyerName,
          productId: quoteDraft.productId || '',
          productName: quoteDraft.productName,
          quantity,
          budget,
          message,
          kind: 'inquiry',
        });

        if (sellerId) {
          await createNotification(sellerId, {
            title: `New quote request: ${quoteDraft.productName}`,
            message,
            type: 'message',
            read: false,
            data: {
              productId: quoteDraft.productId,
              link: '/seller/inquiries',
              inquiryId,
              buyerId: user.uid,
              buyerName,
            },
          });
        }

        await createNotification(user.uid, {
          title: `Quote request sent to ${sellerName}`,
          message: `Your quote request for ${quoteDraft.productName} was sent. Await supplier response.`,
          type: 'message',
          read: false,
          data: {
            productId: quoteDraft.productId,
            link: '/inquiries',
            inquiryId,
            sellerId,
          },
        });

        setBannerMessage('Quote request sent. Continue the conversation in Inquiries.');
        router.push('/inquiries');
      } catch (err) {
        console.error('Error sending quote request:', err);
        setBannerMessage('Failed to send quote request. Please try again.');
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <ModeTab label="Discover" isActive={false} onClick={() => router.push('/products')} />
          <ModeTab label="Wholesale" isActive onClick={() => router.refresh()} />
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
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 transition-all hover:scale-[1.02]"
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
              const displayPrice = product.wholesalePrice || product.price;
              const quantity = getDesiredQuantity(product);
              const savings = product.originalPrice && displayPrice ? product.originalPrice - displayPrice : 0;

              return (
                <article key={product.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 transition-all hover:shadow-md hover:scale-[1.01]">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <button
                      onClick={() => onOpenProduct(product.id)}
                      className="h-24 w-full md:w-32 overflow-hidden rounded-lg bg-gray-100 group-hover:scale-105 transition-transform duration-300"
                    >
                      <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
                    </button>

                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{product.description}</p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold text-[#164A2E] dark:text-[#8FD8AE]">{formatCurrency(displayPrice)}</span>
                        {product.originalPrice && <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>}
                        <Tag text={`Save ${formatCurrency(savings)} / unit`} />
                        <Tag text={`MOQ ${product.minOrderQuantity || 1}`} />
                        <Tag text={product.stock > 0 ? `Stock ${product.stock}` : 'Out of stock'} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Quantity</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1, product.minOrderQuantity || 1)}
                          className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1, product.minOrderQuantity || 1)}
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
        <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 rounded-xl border border-[#B6DCC6] bg-white px-4 py-3 shadow-lg dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 animate-in fade-in slide-in-from-bottom-2">
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-center md:pb-4 animate-in fade-in">
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors hover:scale-[1.02]"
              >
                Cancel
              </button>
              <button
                onClick={submitQuoteRequest}
                className="rounded-lg bg-[#164A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#113924] transition-colors hover:scale-[1.02]"
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
    <button onClick={onClick} className="min-w-[84px] text-left transition-all hover:scale-[1.02]">
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
      onClick={onClick} // Ensure this button is clickable
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
      onClick={onClick} // Ensure this button is clickable
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
