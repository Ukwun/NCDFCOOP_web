'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { USER_ROLES } from '@/lib/constants/database';
import { COLLECTIONS } from '@/lib/constants/database';
import { AppColors, AppTextStyles } from '@/lib/theme';
import styles from './animations.module.css';

const getDevSellerProductsKey = (sellerId: string) => `dev_seller_products_${sellerId}`;

function loadDevSellerProducts(sellerId: string) {
  if (typeof window === 'undefined') return [] as any[];

  try {
    const raw = window.localStorage.getItem(getDevSellerProductsKey(sellerId));
    if (!raw) return [] as any[];
    return JSON.parse(raw) as any[];
  } catch (error) {
    console.warn('Unable to read local seller product drafts', error);
    return [] as any[];
  }
}

function saveDevSellerProducts(sellerId: string, products: any[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getDevSellerProductsKey(sellerId), JSON.stringify(products));
  } catch (error) {
    console.warn('Unable to save local seller product drafts', error);
  }
}

function createLocalSellerProduct(sellerId: string, product: any) {
  const currentProducts = loadDevSellerProducts(sellerId);
  const nextProducts = [...currentProducts, product];
  saveDevSellerProducts(sellerId, nextProducts);
}

const PRODUCT_CATEGORIES = [
  { id: 'vegetables', name: 'Vegetables', emoji: '🥬' },
  { id: 'grains', name: 'Grains & Cereals', emoji: '🌾' },
  { id: 'fruits', name: 'Fruits', emoji: '🍎' },
  { id: 'oils', name: 'Oils & Fats', emoji: '🫒' },
  { id: 'spices', name: 'Spices', emoji: '🌶️' },
  { id: 'dairy', name: 'Dairy & Eggs', emoji: '🥛' },
  { id: 'proteins', name: 'Proteins', emoji: '🥩' },
  { id: 'beverages', name: 'Beverages', emoji: '☕' },
];

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading, currentRole } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    wholesalePrice: 0,
    originalPrice: 0,
    category: 'vegetables',
    stock: 0,
    unit: 'kg',
    productType: 'retail' as 'retail' | 'wholesale' | 'both',
    wholesaleMinOrder: 1,
    images: [] as string[],
    thumbnail: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: any) => {
    const numericFields = ['price', 'wholesalePrice', 'originalPrice', 'stock', 'wholesaleMinOrder'];
    const nextValue = numericFields.includes(field)
      ? value === ''
        ? 0
        : Number(value)
      : value;

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const calculateDiscount = () => {
    if (formData.originalPrice && formData.originalPrice > formData.price) {
      return Math.round(
        ((formData.originalPrice - formData.price) / formData.originalPrice) * 100
      );
    }
    return 0;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    } else if (!loading && user && currentRole !== USER_ROLES.SELLER) {
      router.push('/home');
    }
  }, [loading, user, currentRole, router]);

  const saveProduct = async (publish = false) => {
    // publish=true will set status to 'live'

    if (!user) {
      setError('You must be logged in');
      return;
    }

    const currentErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) currentErrors.name = 'Product name is required';
    if (!formData.category) currentErrors.category = 'Select a category';
    if (formData.price <= 0) currentErrors.price = 'Please enter a valid base price';
    if (formData.stock <= 0) currentErrors.stock = 'Stock quantity must be greater than zero';
    if (!formData.unit) currentErrors.unit = 'Please choose a unit measure';
    if (formData.productType !== 'retail' && formData.wholesalePrice <= 0) {
      currentErrors.wholesalePrice = 'Wholesale price is required for wholesale products';
    }
    if (formData.productType !== 'retail' && formData.wholesaleMinOrder < 1) {
      currentErrors.wholesaleMinOrder = 'Wholesale minimum order must be at least 1';
    }

    if (Object.keys(currentErrors).length > 0) {
      setFieldErrors(currentErrors);
      setError('Please fix the highlighted fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    const wholesalePriceValue = formData.productType !== 'retail'
      ? parseFloat(formData.wholesalePrice.toString())
      : 0;

    const timestampValue = db ? Timestamp.now() : new Date().toISOString();

    const newProduct = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      type: formData.productType,
      price: parseFloat(formData.price.toString()),
      retailPrice: parseFloat(formData.price.toString()),
      wholesalePrice: wholesalePriceValue > 0 ? wholesalePriceValue : undefined,
      originalPrice: formData.originalPrice
        ? parseFloat(formData.originalPrice.toString())
        : parseFloat(formData.price.toString()),
      discount: calculateDiscount(),
      minOrderQuantity: formData.productType !== 'retail' ? parseInt(formData.wholesaleMinOrder.toString()) : 1,
      stock: parseInt(formData.stock.toString()),
      unit: formData.unit,
      maxOrder: 100,
      status: publish ? 'live' : 'pending',
      images: formData.images.length > 0 ? formData.images : ['https://via.placeholder.com/400x400'],
      thumbnail: formData.thumbnail || 'https://via.placeholder.com/400x400',
      sellerId: user.uid,
      sellerName: user.displayName || 'Seller',
      ownershipType: 'seller',
      rating: 4.5,
      reviews: 0,
      isFeatured: false,
      isActive: true,
      createdAt: timestampValue,
      updatedAt: timestampValue,
    };

    try {
      if (!db) {
        createLocalSellerProduct(user.uid, {
          ...newProduct,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Remove any `undefined` fields before sending to Firestore
        const sanitizedProduct = Object.fromEntries(
          Object.entries(newProduct).filter(([, v]) => v !== undefined)
        );

        await addDoc(collection(db, COLLECTIONS.PRODUCTS), sanitizedProduct as any);
      }

      setFormData({
        name: '',
        description: '',
        price: 0,
        wholesalePrice: 0,
        originalPrice: 0,
        category: 'vegetables',
        stock: 0,
        unit: 'kg',
        productType: 'retail',
        wholesaleMinOrder: 1,
        images: [],
        thumbnail: '',
      });

      router.push('/seller/products');
    } catch (err) {
      console.error('Error adding product:', err);
      if (user) {
        createLocalSellerProduct(user.uid, {
          ...newProduct,
          id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        router.push('/seller/products');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    if (!user) {
      setUploadError('You must be logged in to upload images');
      return;
    }

    if (!storage) {
      setUploadError('Storage is not configured in this environment');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const path = `products/${user.uid}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const ref = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(ref, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadProgress(percent);
          },
          (err) => {
            setUploadError(err instanceof Error ? err.message : String(err));
            setIsUploading(false);
            reject(err);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setFormData((prev) => ({
              ...prev,
              thumbnail: url,
              images: prev.images && prev.images.length > 0 ? [url, ...prev.images] : [url],
            }));
            setIsUploading(false);
            setUploadProgress(100);
            resolve();
          }
        );
      });
    } catch (err) {
      console.error('Upload error', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute currentPath="/seller/products/add" requiredRoles={[USER_ROLES.SELLER]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4 font-semibold"
          >
            ← Back to Products
          </button>
          <h1 style={{ ...AppTextStyles.h1, color: AppColors.textPrimary }}>
            Add New Product
          </h1>
          <p style={{ ...AppTextStyles.bodyLarge, color: AppColors.textSecondary }}>
            List a new product for sale. Fill in all details below.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); saveProduct(false); }} className={`${styles.formContainer} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6`}>
          
          {/* Product Name */}
          <div className={styles.formGroup}>
            <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Fresh Tomatoes (1kg)"
              className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 ${
                fieldErrors.name ? styles.inputError : ''
              }`}
              style={{
                borderColor: fieldErrors.name ? '#dc2626' : AppColors.border,
              }}
              required
            />
            {fieldErrors.name && <p className={styles.fieldErrorText}>{fieldErrors.name}</p>}
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your product, quality, origin, uses..."
              className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 h-24 resize-none`}
              style={{
                borderColor: AppColors.border,
              }}
            />
          </div>

          {/* Category */}
          <div className={styles.formGroup}>
            <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
              Category *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleInputChange('category', cat.id)}
                  className={`${styles.categoryButton} p-4 rounded-lg border-2 transition-all ${
                    formData.category === cat.id
                      ? `${styles.categoryButtonSelected} border-blue-600`
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-xs font-semibold">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div className={styles.formGroup}>
            <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
              Listing Type *
            </label>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { id: 'retail', label: 'Retail', description: 'Sell to all consumers' },
                { id: 'wholesale', label: 'Wholesale', description: 'Bulk buyers only' },
                { id: 'both', label: 'Both', description: 'Retail + wholesale' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleInputChange('productType', option.id)}
                  className={`${styles.typeButton} p-4 rounded-lg border-2 text-left transition-all ${
                    formData.productType === option.id
                      ? `${styles.typeButtonSelected} border-emerald-600`
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                  }`}
                >
                  <p className="font-semibold">{option.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price Section */}
          <div className={`${styles.formGroup} grid grid-cols-2 gap-4`}>
            <div>
              <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                Price per unit (₦) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className={`${styles.input} w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none transition duration-200 focus:ring-2 ${
                  fieldErrors.price ? styles.inputError : 'focus:border-blue-500'
                }`}
                style={{
                  borderColor: fieldErrors.price ? '#dc2626' : AppColors.border,
                }}
                required
              />
              {fieldErrors.price && <p className={styles.fieldErrorText}>{fieldErrors.price}</p>}
            </div>

            <div>
              <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                Original Price (₦)
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                placeholder="Leave blank if no discount"
                min="0"
                className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                style={{
                  borderColor: AppColors.border,
                }}
              />
            </div>
          </div>

          {(formData.productType === 'wholesale' || formData.productType === 'both') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                  Wholesale Price (₦) *
                </label>
                <input
                  type="number"
                  value={formData.wholesalePrice}
                  onChange={(e) => handleInputChange('wholesalePrice', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                  style={{
                    borderColor: AppColors.border,
                  }}
                  required
                />
                {fieldErrors.wholesalePrice && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.wholesalePrice}</p>
                )}
              </div>
              <div>
                <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                  Wholesale MOQ *
                </label>
                <input
                  type="number"
                  value={formData.wholesaleMinOrder}
                  onChange={(e) => handleInputChange('wholesaleMinOrder', e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                  style={{
                    borderColor: AppColors.border,
                  }}
                  required
                />
                {fieldErrors.wholesaleMinOrder && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.wholesaleMinOrder}</p>
                )}
              </div>
            </div>
          )}

          {/* Discount Display */}
          {calculateDiscount() > 0 && (
            <div
              className="p-4 rounded-lg text-white font-bold text-center"
              style={{ backgroundColor: '#E53E3E' }}
            >
              🎉 Discount: {calculateDiscount()}% off (Saves ₦
              {(formData.originalPrice - formData.price).toLocaleString()})
            </div>
          )}

          {/* Stock & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
                style={{
                  borderColor: AppColors.border,
                }}
                required
              />
            </div>

            <div>
              <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
                Unit *
              </label>
              <div className="relative mt-2">
                <select
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full appearance-none pr-10 bg-white dark:bg-gray-900 mt-0 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2 focus:border-blue-500 transition duration-200"
                  style={{
                    borderColor: AppColors.border,
                    color: AppColors.textPrimary,
                  }}
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="liter">Liters (L)</option>
                  <option value="pack">Pack</option>
                  <option value="dozen">Dozen</option>
                  <option value="bundle">Bundle</option>
                  <option value="piece">Piece</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label style={{ ...AppTextStyles.labelLarge, color: AppColors.textPrimary }}>
              Product Image URL
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => handleInputChange('thumbnail', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full mt-2 px-4 py-3 border-2 rounded-lg outline-none focus:ring-2"
              style={{
                borderColor: AppColors.border,
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank for default placeholder image
            </p>

            <div className="mt-3">
              <label className="text-sm font-medium" style={{ color: AppColors.textPrimary }}>Or upload an image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) handleFileSelected(file);
                }}
                className="mt-2"
              />

              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2 overflow-hidden">
                  <div className="h-3 bg-emerald-500" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
              {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {formData.thumbnail ? (
                <img
                  src={formData.thumbnail}
                  alt="Product preview"
                  className="w-full h-56 object-cover"
                  onError={(event) => {
                    const target = event.currentTarget as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x400?text=Preview+Unavailable';
                  }}
                />
              ) : (
                <div className="flex h-56 items-center justify-center px-4 text-sm text-gray-500 dark:text-gray-400">
                  Product image preview will appear here when you paste a valid URL.
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-3 rounded-lg border-2 font-bold transition-all"
              style={{
                borderColor: AppColors.primary,
                color: AppColors.primary,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveProduct(true)}
              disabled={loading || isSaving || isUploading}
              className="px-4 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: '#0ea5a4',
              }}
            >
              {isSaving && 'Publishing…'}{!isSaving && isUploading && 'Uploading…'}{!isSaving && !isUploading && '🚀 Publish Now'}
            </button>
            <button
              type="submit"
              disabled={loading || isSaving || isUploading}
              className="px-4 py-3 rounded-lg text-white font-bold transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: AppColors.primary,
              }}
            >
              {isSaving ? 'Saving product…' : loading ? 'Checking auth…' : '✅ Save as Draft'}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <h3 style={{ ...AppTextStyles.h4, color: AppColors.primary }} className="mb-3">
            💡 Tips for Selling Success
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: AppColors.textSecondary }}>
            <li>✓ Use clear, descriptive product names</li>
            <li>✓ Highlight quality, origin, and uses in description</li>
            <li>✓ Set competitive prices compared to market</li>
            <li>✓ Offer discounts to attract more buyers</li>
            <li>✓ Keep stock levels accurate</li>
            <li>✓ Update your products regularly</li>
          </ul>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
