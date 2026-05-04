"use client";


import { useAuth } from "@/lib/auth/authContext";
import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/lib/hooks";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites({ userId: user?.uid || '', autoFetch: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Favorites</h1>
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
                  if (!user) {
                    alert('Please sign in to add items to your cart.');
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
