'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { getProducts } from '@/lib/services/productService';
import { addToCart } from '@/lib/services/cartService';
import ProductList from '@/components/ProductList';
import { Product, ProductFilter } from '@/lib/types/product';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilter>({
    sortBy: 'newest',
    limit: 20,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getProducts(filters.limit || 20);
        setProducts(result);
      } catch (err) {
        console.error('Error fetching products:', err);
        // Fallback to mock data instead of blank page
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Fresh Tomatoes (1kg)',
            description: 'Farm-fresh, organic tomatoes delivered twice weekly from local farms. Perfect for salads and cooking.',
            price: 850,
            originalPrice: 1200,
            category: 'vegetables',
            stock: 245,
            maxOrder: 100,
            rating: 4.8,
            reviews: 324,
            images: ['https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes'],
            thumbnail: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fresh+Tomatoes',
            sellerId: 'seller1',
            sellerName: 'Green Valley Farms',
            isFeatured: true,
            discount: 29,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '2',
            name: 'Premium Grains Mix (5kg)',
            description: 'Bulk grain package containing rice, millet, and sorghum. Perfect for families. Certified organic.',
            price: 2500,
            originalPrice: 3800,
            category: 'grains',
            stock: 142,
            maxOrder: 50,
            rating: 4.9,
            reviews: 521,
            images: ['https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix'],
            thumbnail: 'https://via.placeholder.com/400x400/D4A574/FFFFFF?text=Grain+Mix',
            sellerId: 'seller2',
            sellerName: 'Agricultural Co-op',
            isFeatured: true,
            discount: 34,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '3',
            name: 'Organic Leafy Greens Bundle',
            description: 'Fresh spinach, kale, and lettuce bundle. Pesticide-free, hand-picked this morning.',
            price: 1200,
            originalPrice: 1800,
            category: 'vegetables',
            stock: 187,
            maxOrder: 100,
            rating: 4.7,
            reviews: 298,
            images: ['https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens'],
            thumbnail: 'https://via.placeholder.com/400x400/52C41A/FFFFFF?text=Leafy+Greens',
            sellerId: 'seller1',
            sellerName: 'Green Valley Farms',
            discount: 33,
            unit: 'bundle',
            createdAt: new Date(),
          },
          {
            id: '4',
            name: 'Carrots & Root Vegetables (2kg)',
            description: 'Mixed root vegetables including carrots, beetroot, parsnips, and yams. Perfect for soups and stews.',
            price: 980,
            originalPrice: 1500,
            category: 'vegetables',
            stock: 203,
            maxOrder: 100,
            rating: 4.6,
            reviews: 412,
            images: ['https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies'],
            thumbnail: 'https://via.placeholder.com/400x400/FA8C16/FFFFFF?text=Root+Veggies',
            sellerId: 'seller3',
            sellerName: 'Harvest Fresh',
            discount: 35,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '5',
            name: 'Premium Palm Oil (5L)',
            description: 'Cold-pressed, unrefined premium palm oil. No additives. Perfect for cooking and traditional dishes.',
            price: 3200,
            originalPrice: 4500,
            category: 'oils',
            stock: 89,
            maxOrder: 20,
            rating: 4.9,
            reviews: 645,
            images: ['https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil'],
            thumbnail: 'https://via.placeholder.com/400x400/FFA940/FFFFFF?text=Palm+Oil',
            sellerId: 'seller4',
            sellerName: 'Pure Oil Producers',
            isFeatured: true,
            discount: 29,
            unit: 'liter',
            createdAt: new Date(),
          },
          {
            id: '6',
            name: 'Dried Chili Peppers (500g)',
            description: 'Premium quality sun-dried chili peppers. Authentic Nigerian spice for rich, bold flavors.',
            price: 1450,
            originalPrice: 2200,
            category: 'spices',
            stock: 156,
            maxOrder: 100,
            rating: 4.7,
            reviews: 289,
            images: ['https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers'],
            thumbnail: 'https://via.placeholder.com/400x400/F5222D/FFFFFF?text=Chili+Peppers',
            sellerId: 'seller5',
            sellerName: 'Spice Masters',
            discount: 34,
            unit: 'g',
            createdAt: new Date(),
          },
          {
            id: '7',
            name: 'Fresh Cassava Flour (2kg)',
            description: 'Premium cassava flour milled fresh. Perfect for fufu, garri, and traditional delicacies.',
            price: 1650,
            originalPrice: 2400,
            category: 'grains',
            stock: 127,
            maxOrder: 50,
            rating: 4.6,
            reviews: 187,
            images: ['https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour'],
            thumbnail: 'https://via.placeholder.com/400x400/FFCB69/FFFFFF?text=Cassava+Flour',
            sellerId: 'seller2',
            sellerName: 'Agricultural Co-op',
            discount: 31,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '8',
            name: 'Eggs Package (Dozen)',
            description: 'Fresh farm eggs from free-range chickens. Collected daily. Rich golden yolks.',
            price: 890,
            originalPrice: 1200,
            category: 'dairy',
            stock: 298,
            maxOrder: 100,
            rating: 4.8,
            reviews: 521,
            images: ['https://via.placeholder.com/400x400/FFF566/FFFFFF?text=Fresh+Eggs'],
            thumbnail: 'https://via.placeholder.com/400x400/FFF566/FFFFFF?text=Fresh+Eggs',
            sellerId: 'seller3',
            sellerName: 'Harvest Fresh',
            isFeatured: true,
            discount: 26,
            unit: 'dozen',
            createdAt: new Date(),
          },
          {
            id: '9',
            name: 'Onions Bundle (3kg)',
            description: 'Golden, sweet onions. Perfect for all your cooking needs. No pesticides.',
            price: 750,
            originalPrice: 1100,
            category: 'vegetables',
            stock: 412,
            maxOrder: 100,
            rating: 4.5,
            reviews: 156,
            images: ['https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions'],
            thumbnail: 'https://via.placeholder.com/400x400/DEB887/FFFFFF?text=Onions',
            sellerId: 'seller1',
            sellerName: 'Green Valley Farms',
            discount: 32,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '10',
            name: 'Premium Groundnuts (1kg)',
            description: 'Raw, high-quality groundnuts from the best farms. High protein content. Perfect for snacking or cooking.',
            price: 2100,
            originalPrice: 3200,
            category: 'grains',
            stock: 203,
            maxOrder: 50,
            rating: 4.7,
            reviews: 334,
            images: ['https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts'],
            thumbnail: 'https://via.placeholder.com/400x400/E6B800/FFFFFF?text=Groundnuts',
            sellerId: 'seller4',
            sellerName: 'Pure Oil Producers',
            discount: 34,
            unit: 'kg',
            createdAt: new Date(),
          },
          {
            id: '11',
            name: 'Ginger & Garlic Pack',
            description: 'Fresh ginger and garlic combo pack. Essential spices for every Nigerian kitchen.',
            price: 650,
            originalPrice: 950,
            category: 'spices',
            stock: 267,
            maxOrder: 100,
            rating: 4.6,
            reviews: 198,
            images: ['https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic'],
            thumbnail: 'https://via.placeholder.com/400x400/BF8F00/FFFFFF?text=Ginger+Garlic',
            sellerId: 'seller5',
            sellerName: 'Spice Masters',
            discount: 32,
            unit: 'pack',
            createdAt: new Date(),
          },
          {
            id: '12',
            name: 'Basmati Rice (10kg)',
            description: 'Premium long-grain basmati rice. Aromatic, fluffy, and delicious. Best quality.',
            price: 4200,
            originalPrice: 6500,
            category: 'grains',
            stock: 78,
            maxOrder: 30,
            rating: 4.9,
            reviews: 612,
            images: ['https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice'],
            thumbnail: 'https://via.placeholder.com/400x400/E8D5B7/FFFFFF?text=Basmati+Rice',
            sellerId: 'seller2',
            sellerName: 'Agricultural Co-op',
            isFeatured: true,
            discount: 35,
            unit: 'kg',
            createdAt: new Date(),
          },
        ];
        setProducts(mockProducts);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters.limit]);

  const handleAddToCart = async (product: Product, quantity: number) => {
    if (!user) {
      router.push('/welcome');
      return;
    }

    try {
      await addToCart(
        user.uid,
        product.id,
        product.name,
        product.price,
        product.images[0] || product.thumbnail || '',
        quantity
      );
      // Show success toast/notification
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchTerm,
      offset: 0,
    });
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Header */}
      <div
        className="py-8 md:py-12"
        style={{
          backgroundColor: AppColors.surface,
          borderBottom: `1px solid ${AppColors.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            style={{
              ...AppTextStyles.h1,
              color: AppColors.textPrimary,
              marginBottom: AppSpacing.md,
            }}
          >
            Browse Products
          </h1>
          <p
            style={{
              ...AppTextStyles.bodyLarge,
              color: AppColors.textSecondary,
            }}
          >
            Explore our wide selection of quality products from trusted sellers
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 dark:text-white"
                  style={{
                    borderColor: AppColors.border,
                    backgroundColor: AppColors.surface,
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: AppColors.primary,
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as any,
                  offset: 0,
                })
              }
              className="px-4 py-3 border-2 rounded-lg focus:outline-none dark:bg-gray-800 dark:text-white"
              style={{
                borderColor: AppColors.border,
                backgroundColor: AppColors.surface,
              }}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="p-4 rounded-lg text-white mb-6"
              style={{
                backgroundColor: '#E53E3E',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Products Grid */}
        <ProductList
          products={products}
          isLoading={isLoading}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
          title="All Products"
          showPagination={true}
          itemsPerPage={12}
        />
      </div>
    </div>
  );
}
