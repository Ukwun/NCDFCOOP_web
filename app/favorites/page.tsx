"use client";


import { useAuth } from "@/lib/auth/authContext";
import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/lib/hooks";
import { addToCart } from '@/lib/services/cartService';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites({ userId: user?.uid || '', autoFetch: true });

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
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No favorites yet. Click the heart icon on any product to add it here!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <ProductCard
                key={product.productId || product.id}
                product={{
                  id: product.productId || product.id,
                  name: product.productName,
                  price: product.productPrice,
                  thumbnail: product.productImage,
                  category: product.productCategory ?? '',
                  sellerName: product.sellerName,
                  sellerId: product.sellerId,
                  stock: 10,
                  images: product.productImage ? [product.productImage] : [],
                  description: '',
                  rating: 0,
                  reviews: 0,
                }}
                onAddToCart={async (prod, quantity) => {
                  try {
                    const cartUserId = user?.uid || 'guest';
                    await addToCart(
                      cartUserId,
                      prod.id,
                      prod.name,
                      prod.price,
                      prod.thumbnail || prod.images?.[0] || '',
                      quantity
                    );
                    alert('Added to cart!');
                  } catch (err) {
                    alert('Failed to add to cart.');
                  }
                }}
                onViewDetails={() => {
                  const id = product.productId || product.id;
                  window.location.href = `/products/${id}`;
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
