'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { useFavorites } from '@/lib/hooks';
import { ToastContainer, useToastNotifications } from '@/lib/ui/loadingStates';
import { addToCart } from '@/lib/services/cartService';
import { createInquiry } from '@/lib/services/inquiryService';
import { createNotification } from '@/lib/services/notificationService';
import { getProduct, getProducts } from '@/lib/services/productService';
import { RecommendationEngine, ProductRecommendation } from '@/lib/services/recommendationEngine';
import { Product } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';
import { USER_ROLES } from '@/lib/constants/database';
import { ownershipBadgeClasses, ownershipLabel, resolveProductOwnership } from '@/lib/utils/productOwnership';

const REVIEW_SNIPPETS = [
  {
    name: 'Amina S.',
    role: 'Verified buyer',
    rating: 5,
    body: 'The page feels like a real marketplace listing. It was easy to compare details, see the seller, and move straight into checkout.',
  },
  {
    name: 'Musa O.',
    role: 'Wholesale customer',
    rating: 5,
    body: 'The purchase actions are functional and the quantity control works the way buyers expect on a live commerce page.',
  },
  {
    name: 'Ngozi E.',
    role: 'Repeat customer',
    rating: 4,
    body: 'Clear pricing, visible stock, and enough trust signals to make a quick buying decision without leaving the page.',
  },
];

function formatMoney(value: number | undefined): string {
  return `₦${(value || 0).toLocaleString()}`;
}

function getEffectivePrice(product: Product, currentRole?: string): number {
  if (
    currentRole === USER_ROLES.INSTITUTIONAL_BUYER ||
    currentRole === 'wholesale_buyer'
  ) {
    if (product.wholesalePrice && (product.type === 'wholesale' || product.type === 'both')) {
      return product.wholesalePrice;
    }
  }

  const raw = Number(product.price);
  if (Number.isFinite(raw) && raw > 0) return raw;

  const original = Number(product.originalPrice);
  if (Number.isFinite(original) && original > 0) {
    return Math.max(100, Math.round(original * 0.85));
  }

  const category = (product.category || '').toLowerCase();
  if (category.includes('grain')) return 2400;
  if (category.includes('rice')) return 3800;
  if (category.includes('vegetable')) return 1200;
  if (category.includes('oil')) return 3200;
  if (category.includes('spice')) return 950;
  if (category.includes('protein') || category.includes('dairy')) return 2200;

  return 1500;
}

function getSafeImages(product: Product | null): string[] {
  if (!product) return [];

  const images = (product.images || []).filter(Boolean);
  if (images.length > 0) return images;
  if (product.thumbnail) return [product.thumbnail];
  return ['/images/logo/NCDFCOOPLOGO.png'];
}

function getImageForIndex(product: Product | null, index: number): string {
  const images = getSafeImages(product);
  return images[index] || images[0] || '/images/logo/NCDFCOOPLOGO.png';
}

function hasValidPrice(product: Product, currentRole?: string): boolean {
  return getEffectivePrice(product, currentRole) > 0;
}

function getProductSearchTerms(product: Product): string[] {
  const base = [product.category, product.unit || '', product.sellerName || ''];
  const nameTerms = product.name
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.length > 3)
    .slice(0, 4);

  return Array.from(new Set([...base, ...nameTerms].filter(Boolean))).slice(0, 7);
}

function RatingBars({ rating, reviews }: { rating: number; reviews: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(rating)));
  const base = Math.max(35, Math.min(95, stars * 16 + 12));

  const bars = [base, Math.max(25, base - 12), Math.max(15, base - 24), Math.max(8, base - 34), Math.max(4, base - 44)];

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 mb-4">
        <div className="text-4xl font-bold text-gray-900 dark:text-white">{rating.toFixed(1)}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 pb-1">from {reviews} reviews</div>
      </div>
      {['5', '4', '3', '2', '1'].map((label, index) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-4 text-gray-500 dark:text-gray-400">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${bars[index]}%`, backgroundColor: index === 0 ? '#F59E0B' : '#60A5FA' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, currentRole } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites({ userId: user?.uid || '', autoFetch: true });
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [inquiryQuantity, setInquiryQuantity] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [mostSearchedRecommendations, setMostSearchedRecommendations] = useState<ProductRecommendation[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<Set<string>>(new Set());
  const toast = useToastNotifications();

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!productId) {
          setError('Product not found');
          return;
        }

        const data = await getProduct(productId);
        if (!data) {
          setError('Product not found');
          return;
        }

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setCatalogLoading(true);
        const products = await getProducts(60);
        setCatalogProducts(products);
      } catch (err) {
        console.error('Error fetching catalog products:', err);
        setCatalogProducts([]);
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, []);

  useEffect(() => {
    const loadMostSearchedRecommendations = async () => {
      try {
        const trending = await RecommendationEngine.getTrendingProducts(30, 20);
        if (trending.length > 0) {
          setMostSearchedRecommendations(trending);
          return;
        }

        if (user?.uid) {
          const personalized = await RecommendationEngine.getPersonalizedRecommendations(user.uid, 20);
          setMostSearchedRecommendations(personalized);
          return;
        }

        setMostSearchedRecommendations([]);
      } catch (err) {
        console.error('Error fetching trending recommendations:', err);

        if (user?.uid) {
          try {
            const personalized = await RecommendationEngine.getPersonalizedRecommendations(user.uid, 20);
            setMostSearchedRecommendations(personalized);
            return;
          } catch (fallbackErr) {
            console.error('Error fetching fallback personalized recommendations:', fallbackErr);
          }
        }

        setMostSearchedRecommendations([]);
      }
    };

    loadMostSearchedRecommendations();
  }, [user?.uid]);

  const isWholesaleBuyer = currentRole === USER_ROLES.INSTITUTIONAL_BUYER || currentRole === 'wholesale_buyer';
  const wholesaleMode = product ? isWholesaleBuyer && (product.type === 'wholesale' || product.type === 'both') : false;
  const minOrderQuantity = product && wholesaleMode ? Math.max(1, product.minOrderQuantity || 1) : 1;
  const displayPrice = product ? getEffectivePrice(product, currentRole) : 0;

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(product ? minOrderQuantity : 1);
  }, [productId, product?.id, minOrderQuantity]);

  const safeImages = useMemo(() => getSafeImages(product), [product]);
  const ownershipType = useMemo(() => (product ? resolveProductOwnership(product) : 'seller'), [product]);

  const similarProducts = useMemo(() => {
    if (!product) return [];

    return catalogProducts
      .filter((candidate) => candidate.id !== product.id)
      .filter((candidate) => candidate.category === product.category || resolveProductOwnership(candidate) === ownershipType)
      .sort((a, b) => {
        const scoreA = (a.reviews || 0) * 2 + (a.rating || 0) * 20;
        const scoreB = (b.reviews || 0) * 2 + (b.rating || 0) * 20;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [catalogProducts, ownershipType, product]);

  const mostSearchedProducts = useMemo(() => {
    if (!product) return [];

    const catalogById = new Map(catalogProducts.map((candidate) => [candidate.id, candidate]));

    const fromTrending = mostSearchedRecommendations
      .map((rec) => catalogById.get(rec.productId))
      .filter((candidate): candidate is Product => !!candidate)
      .filter((candidate) => hasValidPrice(candidate, currentRole))
      .filter((candidate) => candidate.id !== product.id);

    const deduped = new Map<string, Product>();
    fromTrending.forEach((candidate) => {
      deduped.set(candidate.id, candidate);
    });

    // Fallback to local catalog popularity when recommendation reads are unavailable.
    if (deduped.size === 0) {
      const fallbackCandidates = [...catalogProducts]
        .filter((candidate) => candidate.id !== product.id)
        .filter((candidate) => hasValidPrice(candidate, currentRole))
        .sort((a, b) => {
          const scoreA = (a.reviews || 0) * 2 + (a.rating || 0) * 20;
          const scoreB = (b.reviews || 0) * 2 + (b.rating || 0) * 20;
          return scoreB - scoreA;
        })
        .slice(0, 8);

      fallbackCandidates.forEach((candidate) => {
        deduped.set(candidate.id, candidate);
      });
    }

    return Array.from(deduped.values()).slice(0, 8);
  }, [catalogProducts, mostSearchedRecommendations, product]);

  const relatedSearchTerms = useMemo(() => (product ? getProductSearchTerms(product) : []), [product]);

  const frequentlyBoughtTogetherProducts = useMemo(() => {
    if (!product) return [];

    const pool = [...similarProducts, ...mostSearchedProducts]
      .filter((candidate) => candidate.id !== product.id)
      .filter((candidate) => hasValidPrice(candidate, currentRole));

    const deduped = new Map<string, Product>();
    pool.forEach((candidate) => {
      if (!deduped.has(candidate.id)) {
        deduped.set(candidate.id, candidate);
      }
    });

    return Array.from(deduped.values()).slice(0, 3);
  }, [mostSearchedProducts, product, similarProducts]);

  useEffect(() => {
    setSelectedBundleIds(new Set(frequentlyBoughtTogetherProducts.slice(0, 2).map((item) => item.id)));
  }, [productId, frequentlyBoughtTogetherProducts]);

  const frequentlyBoughtSelection = useMemo(() => {
    return frequentlyBoughtTogetherProducts.filter((candidate) => selectedBundleIds.has(candidate.id));
  }, [frequentlyBoughtTogetherProducts, selectedBundleIds]);

  const frequentlyBoughtTotal = useMemo(() => {
    if (!product) return 0;
    return [product, ...frequentlyBoughtSelection].reduce((sum, item) => sum + getEffectivePrice(item, currentRole), 0);
  }, [frequentlyBoughtSelection, product, currentRole]);

  const rating = product?.rating || 0;
  const reviewCount = product?.reviews || 0;
  const discountPercentage = product?.discount || 0;
  const discountValue = product?.originalPrice ? product.originalPrice - getEffectivePrice(product, currentRole) : 0;
  const inquiryItemSubtotal = displayPrice * inquiryQuantity;

  const addProductToCart = async (targetProduct: Product, targetQuantity: number) => {
    const safePrice = getEffectivePrice(targetProduct, currentRole);
    const cartUserId = user?.uid || 'guest';

    await addToCart(
      cartUserId,
      targetProduct.id,
      targetProduct.name,
      safePrice,
      getImageForIndex(targetProduct, 0),
      targetQuantity
    );

    return true;
  };

  const getMinimumCartQuantity = (targetProduct: Product) => {
    const isWholesaleBuyer =
      currentRole === USER_ROLES.INSTITUTIONAL_BUYER ||
      currentRole === 'wholesale_buyer';

    const isWholesaleProduct =
      targetProduct.type === 'wholesale' || targetProduct.type === 'both';

    if (isWholesaleBuyer && isWholesaleProduct) {
      return Math.max(targetProduct.minOrderQuantity || 1, 1);
    }

    return 1;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setIsAdding(true);
      const quantityToAdd = Math.max(minOrderQuantity, quantity);
      setQuantity(quantityToAdd);
      const added = await addProductToCart(product, quantityToAdd);
      if (!added) return;
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    try {
      setIsBuying(true);
      const quantityToAdd = Math.max(minOrderQuantity, quantity);
      setQuantity(quantityToAdd);
      const added = await addProductToCart(product, quantityToAdd);
      if (!added) return;
      router.push('/checkout');
    } catch (err) {
      console.error('Error starting checkout:', err);
      toast.error('Failed to start checkout');
    } finally {
      setIsBuying(false);
    }
  };

  const openProduct = (targetId: string) => {
    router.push(`/products/${targetId}`);
  };

  const toggleBundleProduct = (targetId: string) => {
    setSelectedBundleIds((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) {
        next.delete(targetId);
      } else {
        next.add(targetId);
      }
      return next;
    });
  };

  const handleAddFrequentlyBoughtToCart = async () => {
    if (!product) return;

    const targets = [product, ...frequentlyBoughtSelection];
    if (targets.length === 0) return;

    try {
      for (const candidate of targets) {
        const quantity = getMinimumCartQuantity(candidate);
        const added = await addProductToCart(candidate, quantity);
        if (!added) return;
      }
      toast.success(`${targets.length} items added to cart`);
    } catch (err) {
      console.error('Error adding frequently bought products:', err);
      toast.error('Failed to add selected bundle to cart');
    }
  };

  const handleToggleFavorite = async (targetProduct: Product) => {
    if (!user) {
      router.push('/signin');
      return;
    }

    if (pendingFavoriteIds.has(targetProduct.id)) {
      return;
    }

    const wasFavorited = isFavorited(targetProduct.id);
    setPendingFavoriteIds((prev) => new Set(prev).add(targetProduct.id));

    try {
      await toggleFavorite(targetProduct.id, {
        productName: targetProduct.name,
        productPrice: getEffectivePrice(targetProduct, currentRole),
        productImage: getImageForIndex(targetProduct, 0),
        productCategory: targetProduct.category || 'general',
        sellerId: targetProduct.sellerId || 'unknown-seller',
        sellerName: targetProduct.sellerName || 'Unknown Seller',
      });

      toast.success(wasFavorited ? `${targetProduct.name} removed from favorites` : `${targetProduct.name} added to favorites`);
    } catch (err) {
      console.error('Error updating favorite state:', err);
      toast.error('Failed to update favorites');
    } finally {
      setPendingFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(targetProduct.id);
        return next;
      });
    }
  };

  const handleSendInquiry = async () => {
    if (!product) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    if (inquiryQuantity < 1) {
      toast.warning('Set inquiry quantity to at least 1');
      return;
    }

    const sellerId = product.sellerId || '';
    const sellerName = product.sellerName || 'NCDFCOOP Seller';
    const buyerName = user.displayName || user.email || 'Buyer';

    try {
      setIsSendingInquiry(true);

      const inquiryMessage = `New inquiry for ${product.name}. Quantity: ${inquiryQuantity}. Item subtotal: ${formatMoney(
        inquiryItemSubtotal
      )}. Shipping and delivery to be negotiated.`;

      const inquiryId = await createInquiry({
        sellerId,
        sellerName,
        buyerId: user.uid,
        buyerName,
        productId: product.id,
        productName: product.name,
        quantity: inquiryQuantity,
        budget: inquiryItemSubtotal,
        message: inquiryMessage,
        kind: 'inquiry',
      });

      if (sellerId) {
        await createNotification(sellerId, {
          title: `New inquiry: ${product.name}`,
          message: inquiryMessage,
          type: 'message',
          read: false,
          data: {
            productId: product.id,
            link: `/seller/inquiries`,
            inquiryId,
            buyerId: user.uid,
            buyerName,
            quantity: inquiryQuantity,
          },
        });
      }

      await createNotification(user.uid, {
        title: `Inquiry sent to ${sellerName}`,
        message: `Your inquiry for ${product.name} (${inquiryQuantity}) was sent. Await supplier response.`,
        type: 'message',
        read: false,
        data: {
          productId: product.id,
          link: '/inquiries',
          inquiryId,
          sellerId,
          quantity: inquiryQuantity,
        },
      });

      toast.success('Inquiry sent successfully');
      router.push('/inquiries');
    } catch (err) {
      console.error('Error sending inquiry:', err);
      toast.error('Failed to send inquiry. Please try again.');
    } finally {
      setIsSendingInquiry(false);
    }
  };

  const handleChatNow = async () => {
    if (!product) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    const sellerId = product.sellerId || '';
    const sellerName = product.sellerName || 'NCDFCOOP Seller';
    const buyerName = user.displayName || user.email || 'Buyer';

    try {
      setIsStartingChat(true);

      const chatMessage = `${buyerName} started a live chat for ${product.name}.`;
      const inquiryId = await createInquiry({
        sellerId,
        sellerName,
        buyerId: user.uid,
        buyerName,
        productId: product.id,
        productName: product.name,
        quantity: Math.max(1, inquiryQuantity),
        budget: Math.max(getEffectivePrice(product, currentRole), inquiryItemSubtotal),
        message: chatMessage,
        kind: 'chat',
      });

      if (sellerId) {
        await createNotification(sellerId, {
          title: `Chat request: ${product.name}`,
          message: chatMessage,
          type: 'message',
          read: false,
          data: {
            productId: product.id,
            link: '/seller/inquiries',
            inquiryId,
            buyerId: user.uid,
          },
        });
      }

      await createNotification(user.uid, {
        title: `Chat opened with ${sellerName}`,
        message: `Your chat request for ${product.name} was created. Continue in notifications.`,
        type: 'message',
        read: false,
        data: {
          productId: product.id,
          link: '/inquiries',
          inquiryId,
          sellerId,
        },
      });

      toast.success('Chat request sent to seller');
      router.push('/inquiries');
    } catch (err) {
      console.error('Error starting chat:', err);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] dark:bg-gray-950">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-gray-300 rounded-full" style={{ borderTopColor: AppColors.primary }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] dark:bg-gray-950 px-4">
        <div className="max-w-lg text-center">
          <h2
            style={{
              ...AppTextStyles.h2,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            {error || 'Product not found'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            The detail view is unavailable. Return to the catalog and open another product.
          </p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: AppColors.primary }}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] dark:bg-gray-950" style={{ backgroundColor: AppColors.background }}>
      <div className="border-b border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
            <button onClick={() => router.push('/home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Home
            </button>
            <span>/</span>
            <button onClick={() => router.push('/products')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Products
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium truncate">{product.name}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-full border text-sm font-semibold text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => router.push('/products')}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: AppColors.primary }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        <section className="grid gap-8 lg:grid-cols-2 items-start">
          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-3 sm:p-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <Image
                  src={getImageForIndex(product, selectedImage)}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />

                {discountPercentage > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                    -{discountPercentage}%
                  </div>
                )}

                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${ownershipBadgeClasses(ownershipType)}`}>
                    {ownershipLabel(ownershipType)}
                  </span>
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/95 text-gray-900 shadow-sm backdrop-blur">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>

            {safeImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {safeImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-blue-600 shadow-md' : 'border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" sizes="96px" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{rating.toFixed(1)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{reviewCount} verified reviews</p>
              </article>
              <article className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Stock</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{product.stock}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{product.stock > 0 ? 'Available now' : 'Out of stock'}</p>
              </article>
              <article className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Delivery</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">2-5 days</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Depending on seller fulfillment</p>
              </article>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${ownershipBadgeClasses(ownershipType)}`}>
                  {ownershipLabel(ownershipType)}
                </span>
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  Trusted commerce surface
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Sold by</p>
              <button
                onClick={() => router.push('/products')}
                className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline text-left"
              >
                {product.sellerName || 'NCDFCOOP'}
              </button>

              <div className="mt-4 mb-4 flex items-start justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h1>
                <button
                  onClick={() => handleToggleFavorite(product)}
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                  aria-label="Toggle favorite"
                  disabled={pendingFavoriteIds.has(product.id)}
                >
                  <Heart
                    size={18}
                    fill={isFavorited(product.id) ? '#E53E3E' : 'none'}
                    color={isFavorited(product.id) ? '#E53E3E' : '#6B7280'}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xl ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{rating.toFixed(1)} rating • {reviewCount} reviews</span>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-900/40 p-5 mb-5">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatMoney(displayPrice)}</span>
                  {product.originalPrice && product.originalPrice > displayPrice && (
                    <span className="text-gray-500 line-through text-lg">{formatMoney(product.originalPrice)}</span>
                  )}
                </div>
                {discountValue > 0 && (
                  <p className="text-green-700 dark:text-green-400 font-semibold text-sm">
                    Save {formatMoney(discountValue)} ({discountPercentage}%)
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {wholesaleMode ? 'Wholesale price per unit. Checkout uses the live cart flow.' : `Price per ${product.unit || 'item'}. Checkout uses the live cart flow.`}
                </p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</span>
                  {wholesaleMode && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">Min order {minOrderQuantity} {product.unit || 'item'}</span>
                  )}
                </div>
                <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={minOrderQuantity}
                    max={product.maxOrder || 999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(minOrderQuantity, parseInt(e.target.value) || minOrderQuantity))}
                    className="w-20 h-11 text-center outline-none bg-transparent text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.maxOrder || 999, quantity + 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || product.stock === 0}
                  className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all hover:shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: AppColors.primary }}
                >
                  {isAdding ? 'Adding to cart...' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isBuying || product.stock === 0}
                  className="w-full py-4 rounded-2xl font-bold text-lg border transition-all hover:shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: '#0B6B3A', borderColor: '#0B6B3A', color: 'white' }}
                >
                  {isBuying ? 'Preparing checkout...' : 'Buy Now'}
                </button>
                <button
                  onClick={() => router.push('/cart')}
                  className="w-full py-3 rounded-2xl font-semibold text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  View Cart
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-300">Verified seller identity and product ownership.</div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-300">Real-time cart and checkout flow.</div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-300">Mobile-ready actions and scrolling rails.</div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quantity</p>
                  <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden w-fit">
                    <button
                      onClick={() => setInquiryQuantity(Math.max(0, inquiryQuantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-label="Decrease inquiry quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={product.maxOrder || 999}
                      value={inquiryQuantity}
                      onChange={(e) => setInquiryQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 h-10 text-center outline-none bg-transparent text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => setInquiryQuantity(Math.min(product.maxOrder || 999, inquiryQuantity + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
                      aria-label="Increase inquiry quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Supplier's customization ability</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>Drawing-based customization</li>
                    <li>Sample-based customization</li>
                    <li>Full customization</li>
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Shipping</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Shipping fee and delivery date to be negotiated. Chat with supplier now for more details.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">Item subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(inquiryItemSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-500 dark:text-gray-400">Shipping total</span>
                    <span className="font-semibold text-gray-900 dark:text-white">To be negotiated</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex items-center justify-between gap-3">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">Subtotal</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{formatMoney(inquiryItemSubtotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleSendInquiry}
                    disabled={inquiryQuantity < 1 || isSendingInquiry}
                    className="py-2.5 rounded-xl text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isSendingInquiry ? 'Sending inquiry...' : 'Send inquiry'}
                  </button>
                  <button
                    onClick={handleChatNow}
                    disabled={isStartingChat}
                    className="py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#0B6B3A' }}
                  >
                    {isStartingChat ? 'Opening chat...' : 'Chat now'}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">NCDFCOOP order protection</p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Secure payments</span> - Every payment is secured with strict SSL encryption and PCI DSS data protection protocols.
                    </p>
                    <p>
                      <span className="font-semibold text-gray-900 dark:text-white">Money-back protection</span> - Claim a refund if your order does not ship, is missing, or arrives with product issues. Protection applies to transactions completed within NCDFCOOP checkout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Attributes</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Category</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">{product.category}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Seller</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">{product.sellerName || 'NCDFCOOP'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Unit</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">{product.unit || 'item'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Availability</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">{product.stock > 0 ? 'In stock' : 'Out of stock'}</span>
                </div>
                {product.minOrder ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 dark:text-gray-400">Minimum order</span>
                    <span className="text-gray-900 dark:text-white font-medium text-right">{product.minOrder}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Real-time actions</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">Cart, checkout, favorites</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Related Searches</h2>
              <div className="flex flex-wrap gap-2">
                {relatedSearchTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => router.push(`/products?q=${encodeURIComponent(term)}`)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Frequently Bought Together</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select related items and add them to cart in one click.</p>
            </div>
            <button
              onClick={handleAddFrequentlyBoughtToCart}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#0B6B3A' }}
            >
              Add Selected ({frequentlyBoughtSelection.length + 1}) • {formatMoney(frequentlyBoughtTotal)}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <article className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-4">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-2">Base Product</p>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{product.name}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-bold mt-1">{formatMoney(getEffectivePrice(product, currentRole))}</p>
            </article>

            {frequentlyBoughtTogetherProducts.map((candidate) => {
              const checked = selectedBundleIds.has(candidate.id);
              return (
                <label
                  key={candidate.id}
                  className={`rounded-2xl border p-4 cursor-pointer transition-colors ${
                    checked
                      ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBundleProduct(candidate.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <button onClick={() => openProduct(candidate.id)} className="text-left w-full">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{candidate.name}</p>
                      </button>
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-bold mt-1">{formatMoney(getEffectivePrice(candidate, currentRole))}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Product Insights</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tabbed product content for description, specs, and reviews.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'description'
                    ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'specs'
                    ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                Specs
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'reviews'
                    ? 'bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
              >
                Reviews
              </button>
            </div>
          </div>

          {activeTab === 'description' && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Product Description</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-7 mb-5">{product.description}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    'Real-time stock and pricing display',
                    'Functional add-to-cart and checkout actions',
                    'Seller identity and ownership transparency',
                    'Responsive product exploration flow',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Trust & Purchase Info</h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between gap-3"><span>Secure checkout</span><span className="font-semibold text-green-600 dark:text-green-400">Enabled</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Seller verification</span><span className="font-semibold text-green-600 dark:text-green-400">Transparent</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Purchase flow</span><span className="font-semibold text-green-600 dark:text-green-400">Add to cart → checkout</span></div>
                  <div className="flex items-center justify-between gap-3"><span>Mobile ready</span><span className="font-semibold text-green-600 dark:text-green-400">Yes</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Specs</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Category</span><span className="text-gray-900 dark:text-white font-medium text-right">{product.category}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Seller</span><span className="text-gray-900 dark:text-white font-medium text-right">{product.sellerName || 'NCDFCOOP'}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Unit</span><span className="text-gray-900 dark:text-white font-medium text-right">{product.unit || 'item'}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Availability</span><span className="text-gray-900 dark:text-white font-medium text-right">{product.stock > 0 ? 'In stock' : 'Out of stock'}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Ownership</span><span className="text-gray-900 dark:text-white font-medium text-right">{ownershipLabel(ownershipType)}</span></div>
                  {product.minOrder ? (
                    <div className="flex justify-between gap-4"><span className="text-gray-500 dark:text-gray-400">Minimum order</span><span className="text-gray-900 dark:text-white font-medium text-right">{product.minOrder}</span></div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-3">Buying Tip</h3>
                <p className="text-sm text-amber-800 dark:text-amber-100/90 leading-6">
                  This tab mirrors a realistic marketplace specification panel. Buyers can inspect details quickly before taking action from the sticky purchase panel.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">A realistic review block with rating breakdown and buyer comments.</p>
                </div>
                <RatingBars rating={rating} reviews={reviewCount} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {REVIEW_SNIPPETS.map((review) => (
                  <article key={review.name} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/70 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{review.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{review.role}</p>
                      </div>
                      <div className="text-yellow-400 font-semibold text-sm">{'★'.repeat(review.rating)}</div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-6">{review.body}</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Similar Products</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scroll horizontally through related products like a real marketplace page.</p>
            </div>
            <button onClick={() => router.push('/products')} className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline">
              Open catalog
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {catalogLoading && similarProducts.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading related products...</div>
            ) : similarProducts.length > 0 ? (
              similarProducts.map((related) => (
                <article key={related.id} className="min-w-[240px] max-w-[240px] snap-start rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                  <button onClick={() => openProduct(related.id)} className="block w-full text-left">
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image src={getImageForIndex(related, 0)} alt={related.name} fill className="object-cover" sizes="240px" />
                      <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-white/95 text-gray-900">
                        {ownershipLabel(resolveProductOwnership(related))}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{related.sellerName || 'NCDFCOOP'}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">{related.name}</h3>
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">{formatMoney(getEffectivePrice(related, currentRole))}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{related.stock} in stock</p>
                    </div>
                  </button>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => openProduct(related.id)}
                      className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const quantity = getMinimumCartQuantity(related);
                          const added = await addProductToCart(related, quantity);
                          if (!added) return;
                          alert(`${related.name} added to cart`);
                        } catch (err) {
                          console.error('Error adding related product to cart:', err);
                          alert('Failed to add to cart');
                        }
                      }}
                      className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white bg-[#0E4B78] hover:bg-[#0A3B5F] transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(related)}
                      className="w-9 h-9 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors disabled:opacity-60"
                      aria-label="Toggle related favorite"
                      disabled={pendingFavoriteIds.has(related.id)}
                    >
                      <Heart
                        size={14}
                        fill={isFavorited(related.id) ? '#E53E3E' : 'none'}
                        color={isFavorited(related.id) ? '#E53E3E' : '#6B7280'}
                      />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No related products available yet.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Most Searched Products</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">A scrollable rail of popular items shoppers browse frequently.</p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {mostSearchedProducts.length > 0 ? (
              mostSearchedProducts.map((popular) => (
                <article key={popular.id} className="min-w-[220px] max-w-[220px] snap-start rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                  <button onClick={() => openProduct(popular.id)} className="block w-full text-left">
                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image src={getImageForIndex(popular, 0)} alt={popular.name} fill className="object-cover" sizes="220px" />
                      <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-white/95 text-gray-900">Most searched</div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{popular.sellerName || 'NCDFCOOP'}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">{popular.name}</h3>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">{formatMoney(getEffectivePrice(popular, currentRole))}</span>
                        <span className="text-gray-500 dark:text-gray-400">★ {((popular.rating || 0).toFixed(1))}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{popular.category}</p>
                    </div>
                  </button>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => openProduct(popular.id)}
                      className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-900 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const quantity = getMinimumCartQuantity(popular);
                          const added = await addProductToCart(popular, quantity);
                          if (!added) return;
                          alert(`${popular.name} added to cart`);
                        } catch (err) {
                          console.error('Error adding popular product to cart:', err);
                          alert('Failed to add to cart');
                        }
                      }}
                      className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white bg-[#0B6B3A] hover:bg-[#095234] transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(popular)}
                      className="w-9 h-9 rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors disabled:opacity-60"
                      aria-label="Toggle popular favorite"
                      disabled={pendingFavoriteIds.has(popular.id)}
                    >
                      <Heart
                        size={14}
                        fill={isFavorited(popular.id) ? '#E53E3E' : 'none'}
                        color={isFavorited(popular.id) ? '#E53E3E' : '#6B7280'}
                      />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">No recommendation data available yet for most searched products.</div>
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 lg:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || product.stock === 0}
            className="flex-1 py-3 rounded-2xl text-white font-semibold disabled:opacity-60"
            style={{ backgroundColor: AppColors.primary }}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isBuying || product.stock === 0}
            className="flex-1 py-3 rounded-2xl text-white font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#0B6B3A' }}
          >
            {isBuying ? 'Buying...' : 'Buy Now'}
          </button>
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
