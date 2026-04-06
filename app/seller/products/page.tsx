'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { AppColors, AppTextStyles } from '@/lib/theme';
import Image from 'next/image';

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
    if (!loading && user && currentRole === 'seller') {
      fetchSellerProducts();
    } else if (!loading && !user) {
      router.push('/welcome');
    } else if (!loading && currentRole !== 'seller') {
      router.push('/home');
    }
  }, [user, loading, currentRole, router]);

  const fetchSellerProducts = async () => {
    if (!user) return;

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

      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      await updateDoc(productRef, { stock: newStock });
      setEditingId(null);
      fetchSellerProducts();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
      fetchSellerProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
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
  if (!user || currentRole !== 'seller') {
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
            <button
              onClick={() => router.push('/seller/products/add')}
              className="mt-6 px-8 py-3 rounded-lg text-white font-bold"
              style={{
                backgroundColor: AppColors.primary,
              }}
            >
              ➕ Add Your First Product
            </button>
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
                        <div className="flex items-center gap-4">
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
                            className="px-3 py-1 rounded text-sm font-semibold transition-all"
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
                            className="px-3 py-1 rounded text-sm font-semibold transition-all text-white"
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
    </div>
  );
}
      }
    }
  }, [user, loading, currentRole, router]);

  const handleInputChange = (field: keyof SellerProduct, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.description || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // Simulate product creation (would call API in production)
      const newProduct = {
        ...formData,
        id: Date.now().toString(),
      };

      setProducts([...products, newProduct]);
      setSuccess('Product added successfully!');
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        stock: 0,
        category: '',
        images: [],
        sku: '',
        minOrder: 1,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
      setSuccess('Product deleted successfully!');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: AppColors.background,
        }}
      >
        <div className="animate-spin">
          <div
            className="w-8 h-8 border-4 border-gray-300 rounded-full"
            style={{
              borderTopColor: AppColors.primary,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: AppColors.background,
      }}
    >
      {/* Header */}
      <div
        className="py-8 border-b"
        style={{
          backgroundColor: AppColors.surface,
          borderColor: AppColors.border,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1
              style={{
                ...AppTextStyles.h1,
                color: AppColors.textPrimary,
              }}
            >
              Product Management
            </h1>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
                marginTop: AppSpacing.sm,
              }}
            >
              Add and manage your products
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 rounded-lg text-white font-bold"
            style={{
              backgroundColor: AppColors.primary,
            }}
          >
            {showAddForm ? '✕ Close' : '+ Add Product'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {success && (
          <div
            className="p-4 rounded-lg text-white mb-6"
            style={{
              backgroundColor: '#48BB78',
            }}
          >
            {success}
          </div>
        )}

        {/* Add/Edit Product Form */}
        {showAddForm && (
          <div
            className="rounded-lg p-8 border mb-12"
            style={{
              backgroundColor: AppColors.surface,
              borderColor: AppColors.border,
            }}
          >
            <h2
              style={{
                ...AppTextStyles.h2,
                color: AppColors.textPrimary,
                marginBottom: AppSpacing.lg,
              }}
            >
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                placeholder="Product Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <input
                type="number"
                placeholder="Price (₦)"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <input
                type="number"
                placeholder="Original Price (₦)"
                value={formData.originalPrice || ''}
                onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value))}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={formData.stock || ''}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku || ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                className="px-4 py-3 border-2 rounded-lg outline-none"
                style={{
                  borderColor: AppColors.border,
                }}
              />
            </div>

            <textarea
              placeholder="Product Description *"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg outline-none mb-6"
              style={{
                borderColor: AppColors.border,
              }}
              rows={4}
            />

            <div className="flex gap-4">
              <button
                onClick={handleAddProduct}
                className="px-8 py-3 rounded-lg text-white font-bold"
                style={{
                  backgroundColor: AppColors.primary,
                }}
              >
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
                className="px-8 py-3 rounded-lg font-bold border-2"
                style={{
                  borderColor: AppColors.border,
                  color: AppColors.textPrimary,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products List */}
        {products.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center border"
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
              📦 No products yet
            </p>
            <p
              style={{
                ...AppTextStyles.bodyLarge,
                color: AppColors.textSecondary,
                marginTop: AppSpacing.lg,
              }}
            >
              Start by adding your first product
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                style={{
                  backgroundColor: AppColors.surface,
                  borderColor: AppColors.border,
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <h3
                        style={{
                          ...AppTextStyles.h3,
                          color: AppColors.textPrimary,
                        }}
                      >
                        {product.name}
                      </h3>
                      <p
                        style={{
                          ...AppTextStyles.bodySmall,
                          color: AppColors.textSecondary,
                          marginTop: AppSpacing.sm,
                        }}
                      >
                        {product.description}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelSmall,
                              color: AppColors.textSecondary,
                            }}
                          >
                            Price
                          </p>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color: AppColors.textPrimary,
                            }}
                          >
                            ₦{product.price.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelSmall,
                              color: AppColors.textSecondary,
                            }}
                          >
                            Stock
                          </p>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color:
                                product.stock > 10
                                  ? '#48BB78'
                                  : product.stock > 0
                                    ? '#F6AD55'
                                    : '#E53E3E',
                            }}
                          >
                            {product.stock}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelSmall,
                              color: AppColors.textSecondary,
                            }}
                          >
                            SKU
                          </p>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color: AppColors.textPrimary,
                            }}
                          >
                            {product.sku || '-'}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              ...AppTextStyles.labelSmall,
                              color: AppColors.textSecondary,
                            }}
                          >
                            Category
                          </p>
                          <p
                            style={{
                              ...AppTextStyles.labelLarge,
                              color: AppColors.textPrimary,
                            }}
                          >
                            {product.category || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        className="px-4 py-2 rounded-lg font-bold"
                        style={{
                          backgroundColor: `${AppColors.primary}20`,
                          color: AppColors.primary,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="px-4 py-2 rounded-lg font-bold"
                        style={{
                          backgroundColor: '#E53E3E20',
                          color: '#E53E3E',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
