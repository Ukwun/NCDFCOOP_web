'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ProtectedRoute from '@/components/ProtectedRoute';
import { COLLECTIONS, USER_ROLES } from '@/lib/constants/database';
import { AppColors, AppTextStyles } from '@/lib/theme';
import Image from 'next/image';

const getDevSellerProductsKey = (sellerId: string) => `dev_seller_products_${sellerId}`;

function loadDevSellerProducts(sellerId: string) {
  if (typeof window === 'undefined') return [] as SellerProduct[];
  try {
    const raw = window.localStorage.getItem(getDevSellerProductsKey(sellerId));
    if (!raw) return [] as SellerProduct[];
    return JSON.parse(raw) as SellerProduct[];
  } catch (error) {
    console.warn('Unable to load local seller products', error);
    return [] as SellerProduct[];
  }
}

function saveDevSellerProducts(sellerId: string, products: SellerProduct[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getDevSellerProductsKey(sellerId), JSON.stringify(products));
  } catch (error) {
    console.warn('Unable to save local seller products', error);
  }
}

function isDevSellerSession(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem('dev_autologin'));
}

function updateDevSellerProductStockLocal(sellerId: string, productId: string, newStock: number) {
  const products = loadDevSellerProducts(sellerId);
  const next = products.map((product) =>
    product.id === productId ? { ...product, stock: newStock, updatedAt: new Date().toISOString() } : product
  );
  saveDevSellerProducts(sellerId, next);
}

function deleteDevSellerProductLocal(sellerId: string, productId: string) {
  const products = loadDevSellerProducts(sellerId);
  const next = products.filter((product) => product.id !== productId);
  saveDevSellerProducts(sellerId, next);
}

interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  thumbnail: string;
  sellerId: string;
  sellerName: string;
  rating: number;
  reviews: number;
  discount?: number;
  unit?: string;
}

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, loading, currentRole } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);

  // Fetch seller's products from Firestore
  useEffect(() => {
    if (!loading && user && currentRole === USER_ROLES.SELLER) {
      fetchSellerProducts();
    } else if (!loading && !user) {
      router.push('/signin');
    } else if (!loading && user && currentRole !== USER_ROLES.SELLER) {
      router.push('/home');
    }
  }, [user, loading, currentRole, router]);

  const fetchSellerProducts = async () => {
    if (!user) return;

    const devMode = isDevSellerSession();
    const localProducts = loadDevSellerProducts(user.uid);

    if (devMode && localProducts.length > 0) {
      setProducts(localProducts);
      setError('Developer seller session enabled; showing local product drafts.');
      setIsLoading(false);
      return;
    }

    if (!db) {
      setProducts(localProducts);
      setError(
        localProducts.length > 0
          ? 'Firebase unavailable; showing local product drafts.'
          : 'Database not initialized. Please refresh the page.'
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('sellerId', '==', user.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as SellerProduct));

      if (fetchedProducts.length === 0 && localProducts.length > 0) {
        setProducts(localProducts);
        setError('No live products found. Showing local drafts saved in your browser.');
      } else {
        setProducts(fetchedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (user) {
        if (localProducts.length > 0) {
          setProducts(localProducts);
          setError('Unable to load live products — showing local drafts.');
        } else {
          setError('Failed to load products');
        }
      } else {
        setError('Failed to load products');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    if (!db) {
      updateDevSellerProductStockLocal(user.uid, productId, newStock);
      setEditingId(null);
      fetchSellerProducts();
      return;
    }

    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, { stock: newStock });
      setEditingId(null);
      fetchSellerProducts();
    } catch (err) {
      console.error('Error updating stock:', err);
      if (user) {
        updateDevSellerProductStockLocal(user.uid, productId, newStock);
        setEditingId(null);
        fetchSellerProducts();
      } else {
        setError('Failed to update stock');
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    if (!db) {
      deleteDevSellerProductLocal(user.uid, productId);
      fetchSellerProducts();
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
      fetchSellerProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      if (user) {
        deleteDevSellerProductLocal(user.uid, productId);
        fetchSellerProducts();
      } else {
        setError('Failed to delete product');
      }
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin">
          <div
            className="w-8 h-8 border-4 border-gray-300 rounded-full"
            style={{ borderTopColor: AppColors.primary }}
          />
        </div>
      </div>
    );
  }

  // Unauthorized
  if (!user || currentRole !== USER_ROLES.SELLER) {
    return null;
  }

  // Calculate statistics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0
  );

  return (
    <ProtectedRoute currentPath="/seller/products" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div
          className="py-8 border-b"
          style={{
            backgroundColor: AppColors.surface,
            borderColor: AppColors.border,
          }}
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary,
              }}
            >
              My Products
            </h1>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
              }}
            >
              Manage your product listings and inventory
            </p>
          </div>
          <button
            onClick={() => router.push('/seller/products/add')}
            className="px-6 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            ➕ Add New Product
          </button>
        </div>
      </div>
      </div>

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Products */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              📦 Active Products
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: AppColors.primary,
              }}
            >
              {totalProducts}
            </p>
          </div>

          {/* Total Stock */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              📊 Total Stock
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: AppColors.primary,
              }}
            >
              {totalStock.toLocaleString()}
            </p>
          </div>

          {/* Inventory Value */}
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.labelLarge,
                color: AppColors.textSecondary,
              }}
            >
              💰 Inventory Value
            </p>
            <p
              style={{
                ...AppTextStyles.h2,
                color: '#48BB78',
              }}
            >
              ₦{totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <div
            className="rounded-lg p-12 text-center border-2"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <p
              style={{
                ...AppTextStyles.h3,
                color: AppColors.textSecondary,
              }}
            >
              📭 No products yet
            </p>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
              }}
            >
              Start selling by adding your first product!
            </p>
            {isDevSellerSession() && (
              <button
                onClick={() => router.push('/dev/seed-seller-products')}
                className="mt-4 inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: AppColors.primary }}
              >
                Seed Local Seller Products
              </button>
            )}
          </div>
        )}

        {/* Products Table */}
        {products.length > 0 && (
          <div
            className="rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      backgroundColor: AppColors.background,
                      borderBottom: `2px solid ${AppColors.border}`,
                    }}
                  >
                    <th style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }} className="px-6 py-4 text-left">
                      Product
                    </th>
                    <th style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }} className="px-6 py-4 text-left">
                      Category
                    </th>
                    <th style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }} className="px-6 py-4 text-right">
                      Price
                    </th>
                    <th style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }} className="px-6 py-4 text-center">
                      Stock
                    </th>
                    <th style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }} className="px-6 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        borderBottom: `1px solid ${AppColors.border}`,
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity duration-200" onClick={() => router.push(`/products/${product.id}`)}>
                          {product.thumbnail && (
                            <Image
                              src={product.thumbnail}
                              alt={product.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p
                              style={{
                                ...AppTextStyles.labelLarge,
                                color: AppColors.textPrimary,
                              }}
                            >
                              {product.name}
                            </p>
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: AppColors.textSecondary,
                              }}
                            >
                              {product.unit || 'unit'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <p
                          style={{
                            ...AppTextStyles.bodyMedium,
                            color: AppColors.textSecondary,
                            textTransform: 'capitalize',
                          }}
                        >
                          {product.category}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right">
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color: AppColors.primary,
                            }}
                          >
                            ₦{product.price.toLocaleString()}
                          </p>
                          {product.discount && product.discount > 0 && (
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: '#E53E3E',
                              }}
                            >
                              -{product.discount}%
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 text-center">
                        {editingId === product.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-center"
                              style={{ borderColor: AppColors.primary }}
                            />
                            <button
                              onClick={() =>
                                handleUpdateStock(product.id, editStock)
                              }
                              className="px-3 py-1 rounded text-white text-sm font-bold"
                              style={{ backgroundColor: AppColors.primary }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer px-4 py-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                            onClick={() => {
                              setEditingId(product.id);
                              setEditStock(product.stock);
                            }}
                          >
                            <p
                              style={{
                                ...AppTextStyles.labelLarge,
                                color:
                                  product.stock > 10
                                    ? '#48BB78'
                                    : product.stock > 0
                                    ? '#D69E2E'
                                    : '#E53E3E',
                              }}
                            >
                              {product.stock} {product.unit || 'pcs'}
                            </p>
                            <p
                              style={{
                                ...AppTextStyles.bodySmall,
                                color: AppColors.textSecondary,
                              }}
                            >
                              Click to edit
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/seller/products/${product.id}/edit`
                              )
                            }
                            className="px-3 py-1 rounded text-sm font-semibold transition-all duration-200 hover:bg-blue-50 active:scale-95"
                            style={{
                              borderColor: AppColors.primary,
                              color: AppColors.primary,
                              border: `2px solid ${AppColors.primary}`,
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 rounded text-sm font-semibold transition-all duration-200 hover:bg-red-600 active:scale-95 text-white"
                            style={{
                              backgroundColor: '#E53E3E',
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
