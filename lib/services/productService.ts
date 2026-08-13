/**
 * Product & Offer Service
 * Handles product and offer data
 */

import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Product } from '@/lib/types/product';

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  targetTier?: string;
  status: 'active' | 'inactive';
  imageUrl?: string;
  code?: string;
  minPurchase?: number;
  maxUses?: number;
  currentUses?: number;
}

/**
 * Get all active offers
 */
export async function getActiveOffers(): Promise<Offer[]> {
  try {
    if (!db) {
      return [];
    }

    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('status', '==', 'active'),
      orderBy('startDate', 'desc')
    );

    const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Offer));
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
}

/**
 * Get offers for specific tier
 */
export async function getOffersForTier(tier: string): Promise<Offer[]> {
  try {
    if (!db) {
      return [];
    }

    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('status', '==', 'active'),
      where('targetTier', '==', tier)
    );

    const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Offer));
  } catch (error) {
    console.error('Error fetching tier offers:', error);
    throw error;
  }
}

/**
 * Get all products
 */
export async function getProducts(limitNumber: number = 20, type?: 'retail' | 'wholesale'): Promise<Product[]> {
  try {
    return (await getProductPage({ limit: limitNumber, type })).products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get product by ID
 */
export async function getProduct(productId: string): Promise<Product | null> {
  try {
    if (!db) {
      return null;
    }

    const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    return docSnap.exists()
      ? ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Product)
      : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string, type?: 'retail' | 'wholesale'): Promise<Product[]> {
  try {
    if (!db) {
      return [];
    }

    const products = await getProducts(100, type);
    return products.filter((product) => product.category === category);
  } catch (error) {
    console.error('Error fetching category products:', error);
    throw error;
  }
}

/**
 * Search products
 */
export async function searchProducts(searchTerm: string, type?: 'retail' | 'wholesale'): Promise<Product[]> {
  try {
    return (await getProductPage({ limit: 50, type, search: searchTerm })).products;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

export async function getProductPage(options: {
  limit?: number;
  type?: 'retail' | 'wholesale';
  search?: string;
  category?: string;
  cursor?: string | null;
}): Promise<{ products: Product[]; nextCursor: string | null }> {
  const params = new URLSearchParams({
    limit: String(Math.min(Math.max(options.limit || 24, 1), 50)),
    type: options.type || 'retail',
  });
  if (options.search?.trim()) params.set('q', options.search.trim());
  if (options.category && options.category !== 'All') params.set('category', options.category);
  if (options.cursor) params.set('cursor', options.cursor);
  const response = await fetch(`/api/catalog/products?${params.toString()}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Failed to load products');
  return { products: payload.products || [], nextCursor: payload.nextCursor || null };
}
