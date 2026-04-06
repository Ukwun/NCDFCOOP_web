/**
 * Seller Product Management Service
 * Handle product CRUD operations for sellers
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { SellerProduct } from '@/lib/types/product';

// Create new product
export async function createProduct(
  sellerId: string,
  productData: Omit<SellerProduct, 'id' | 'sellerId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
      ...productData,
      sellerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      rating: 0,
      reviews: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
}

// Get all products for a seller
export async function getSellerProducts(sellerId: string): Promise<SellerProduct[]> {
  try {
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('sellerId', '==', sellerId)
    );
    const productsSnap = await getDocs(productsQuery);

    return productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SellerProduct[];
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw new Error('Failed to fetch products');
  }
}

// Get single product by ID
export async function getProductById(productId: string): Promise<SellerProduct | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    if (!docSnap.exists()) {
      return null;
    }
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SellerProduct;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
}

// Update product
export async function updateProduct(
  productId: string,
  updates: Partial<SellerProduct>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

// Delete product
export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
}

// Bulk update product stock
export async function updateProductStock(
  productId: string,
  newStock: number
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw new Error('Failed to update product stock');
  }
}

// Update product pricing
export async function updateProductPricing(
  productId: string,
  price: number,
  originalPrice?: number
): Promise<void> {
  try {
    const updates: any = { price, updatedAt: Timestamp.now() };
    if (originalPrice) updates.originalPrice = originalPrice;
    
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), updates);
  } catch (error) {
    console.error('Error updating pricing:', error);
    throw new Error('Failed to update pricing');
  }
}

// Publish/Unpublish product
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
      isActive,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    throw new Error('Failed to update product status');
  }
}

// Get product analytics (views, conversions, etc.)
export async function getProductAnalytics(productId: string): Promise<any> {
  try {
    // Fetch activity logs for this product
    const activitiesQuery = query(
      collection(db, COLLECTIONS.ACTIVITY_LOGS),
      where('productId', '==', productId)
    );
    const activitiesSnap = await getDocs(activitiesQuery);

    let views = 0;
    let addToCarts = 0;
    let purchases = 0;

    activitiesSnap.forEach((doc) => {
      const activity = doc.data();
      if (activity.eventType === 'product_view') views++;
      if (activity.eventType === 'add_to_cart') addToCarts++;
      if (activity.eventType === 'product_sold') purchases++;
    });

    return {
      views,
      addToCarts,
      purchases,
      conversionRate: views > 0 ? Math.round((purchases / views) * 100) : 0,
    };
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return {
      views: 0,
      addToCarts: 0,
      purchases: 0,
      conversionRate: 0,
    };
  }
}

// Search seller products
export async function searchSellerProducts(
  sellerId: string,
  searchTerm: string
): Promise<SellerProduct[]> {
  try {
    const products = await getSellerProducts(sellerId);
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw new Error('Failed to search products');
  }
}

// Get product categories
export async function getProductCategories(): Promise<string[]> {
  const categories = [
    'Fresh Produce',
    'Grains & Cereals',
    'Legumes',
    'Spices',
    'Dairy Products',
    'Meat & Poultry',
    'Fish & Seafood',
    'Beverages',
    'Baked Goods',
    'Other',
  ];
  return categories;
}
