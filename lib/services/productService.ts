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
    if (!db) {
      return [];
    }

    // The status constraint is both the visibility boundary enforced by
    // Firestore rules and the scalable public catalog query.
    const liveProductsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('status', '==', 'live'),
      limit(Math.max(limitNumber, 100))
    );
    const snapshot = await getDocs(liveProductsQuery);
    const products = snapshot.docs
      .map((document) => ({
        id: document.id,
        ...(document.data() as any),
      } as Product))
      .filter((product) => !type || product.type === type || product.type === 'both')
      .sort((a, b) => {
        const toMillis = (value: any) => value?.toMillis?.() || value?.getTime?.() || 0;
        return toMillis(b.createdAt) - toMillis(a.createdAt);
      })
      .slice(0, limitNumber);

    return products;
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
    const products = await getProducts(100, type);
    const term = searchTerm.toLowerCase();

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}
