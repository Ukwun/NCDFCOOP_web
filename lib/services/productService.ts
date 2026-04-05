/**
 * Product & Offer Service
 * Handles product and offer data
 */

import { collection, getDocs, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  sellerId: string;
  category: string;
  stock: number;
  rating: number;
  reviews: number;
  createdAt: Timestamp;
}

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
    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('status', '==', 'active'),
      orderBy('startDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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
    const q = query(
      collection(db, COLLECTIONS.OFFERS),
      where('status', '==', 'active'),
      where('targetTier', '==', tier)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Offer));
  } catch (error) {
    console.error('Error fetching tier offers:', error);
    throw error;
  }
}

/**
 * Get all products
 */
export async function getProducts(limit: number = 20): Promise<Product[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTS),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
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
export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Product));
  } catch (error) {
    console.error('Error fetching category products:', error);
    throw error;
  }
}

/**
 * Search products
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    // Note: Full-text search requires Firestore extension
    // For now, this fetches all and filters client-side
    const products = await getProducts(100);
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
