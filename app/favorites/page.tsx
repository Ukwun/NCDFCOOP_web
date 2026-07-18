"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/authContext";
import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/lib/hooks";
import { addToCart } from '@/lib/services/cartService';
import { getProduct } from "@/lib/services/productService";
import { Product } from "@/lib/types/product";
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { favorites, loading } = useFavorites({ userId: user?.uid || '', autoFetch: true });
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let active = true;

    const synchronizeProducts = async () => {
      if (!user?.uid || favorites.length === 0) {
        setLiveProducts([]);
        setProductsLoading(false);
        setSyncError("");
        return;
      }

      try {
        setProductsLoading(true);
        setSyncError("");
        const products = await Promise.all(
          favorites.map((favorite) => getProduct(favorite.productId)),
        );
        if (active) {
          setLiveProducts(products.filter((product): product is Product => Boolean(product)));
        }
      } catch (error) {
        console.error("Failed to synchronize favorite products:", error);
        if (active) {
          setLiveProducts([]);
          setSyncError("Your saved products could not be synchronized with the live marketplace.");
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    };

    void synchronizeProducts();
    return () => {
      active = false;
    };
  }, [favorites, user?.uid]);

  const unavailableCount = Math.max(0, favorites.length - liveProducts.length);
  const isLoading = loading || productsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#E53E3E] shadow-sm dark:bg-gray-900/70 dark:text-[#FF8A8A]">
              <Heart size={14} fill="currentColor" />
              Favorites
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your Favorites</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {favorites.length} item{favorites.length === 1 ? '' : 's'} saved for quick repeat shopping.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Saved Items</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
          </div>
        </div>
        {syncError && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {syncError}
          </div>
        )}
        {!isLoading && !syncError && unavailableCount > 0 && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {unavailableCount} saved {unavailableCount === 1 ? "product is" : "products are"} no longer available in the live marketplace.
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No favorites yet. Click the heart icon on any product to add it here!</div>
        ) : liveProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            None of your saved products are currently available for purchase.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {liveProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={async (prod, quantity) => {
                  if (!user?.uid) {
                    router.push("/signin?next=/favorites");
                    return;
                  }
                  try {
                    await addToCart(
                      user.uid,
                      prod.id,
                      prod.name,
                      prod.price,
                      prod.thumbnail || prod.images?.[0] || '',
                      quantity
                    );
                  } catch (err) {
                    console.error('Failed to add to cart:', err);
                  }
                }}
                onViewDetails={(id) => router.push(`/products/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
