/**
 * Product & Offer Service
 * Handles product and offer data
 */

import { collection, getDocs, doc, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Product } from '@/lib/types/product';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'fallback_tomatoes',
    name: 'Fresh Tomatoes (1kg)',
    description: 'Farm-fresh tomatoes for everyday cooking and salads.',
    type: 'both',
    price: 850,
    originalPrice: 1200,
    category: 'vegetables',
    images: ['/images/Tomatoes1.png'],
    thumbnail: '/images/Tomatoes1.png',
    stock: 245,
    sellerId: 'seller_green_valley',
    sellerName: 'Green Valley Farms',
    rating: 4.8,
    reviews: 324,
    isFeatured: true,
    unit: 'kg',
    createdAt: new Date(),
  },
  {
    id: 'fallback_grains',
    name: 'Premium Grains Mix (5kg)',
    description: 'Bulk grain pack for families and small businesses.',
    type: 'wholesale',
    price: 2500,
    originalPrice: 3800,
    category: 'grains',
    images: ['/images/Buck wheat1.png'],
    thumbnail: '/images/Buck wheat1.png',
    stock: 142,
    sellerId: 'seller_agri_coop',
    sellerName: 'Agricultural Co-op',
    rating: 4.9,
    reviews: 521,
    isFeatured: true,
    unit: 'kg',
    createdAt: new Date(),
  },
  {
    id: 'fallback_greens',
    name: 'Organic Leafy Greens Bundle',
    description: 'Fresh spinach, kale, and lettuce bundle.',
    type: 'retail',
    price: 1200,
    originalPrice: 1800,
    category: 'vegetables',
    images: ['/images/Groceries1.png'],
    thumbnail: '/images/Groceries1.png',
    stock: 187,
    sellerId: 'seller_green_valley',
    sellerName: 'Green Valley Farms',
    rating: 4.7,
    reviews: 298,
    unit: 'bundle',
    createdAt: new Date(),
  },
  {
    id: 'fallback_palm_oil',
    name: 'Premium Palm Oil (5L)',
    description: 'Cold-pressed premium palm oil for cooking and trading.',
    type: 'both',
    price: 3200,
    originalPrice: 4500,
    category: 'oils',
    images: ['/images/Groundnut oil1.png'],
    thumbnail: '/images/Groundnut oil1.png',
    stock: 89,
    sellerId: 'seller_pure_oil',
    sellerName: 'Pure Oil Producers',
    rating: 4.9,
    reviews: 645,
    isFeatured: true,
    unit: 'liter',
    createdAt: new Date(),
  },
];

function getFallbackProducts(limit: number): Product[] {
  return FALLBACK_PRODUCTS.slice(0, limit);
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
      const fallback = getFallbackProducts(limitNumber);
      return type ? fallback.filter(p => p.type === type || p.type === 'both') : fallback;
    }

    let q;
    if (type) {
      // Query products that match the requested type or are available for 'both'
      q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('type', 'in', [type, 'both']),
        orderBy('createdAt', 'desc'),
        limit(limitNumber)
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        orderBy('createdAt', 'desc'),
        limit(limitNumber)
      );
    }

    try {
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Product));

      return products.length > 0 ? products : getFallbackProducts(limitNumber);
    } catch (error: any) {
      // Fallback if index isn't created yet for type + createdAt
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        const simpleQuery = query(collection(db, COLLECTIONS.PRODUCTS), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(simpleQuery);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Product));
        const filtered = type ? products.filter(p => p.type === type || p.type === 'both') : products;
        return filtered.slice(0, limitNumber);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return getFallbackProducts(limitNumber);
  }
}

/**
 * Get product by ID
 */
export async function getProduct(productId: string): Promise<Product | null> {
  try {
    if (!db) {
      return FALLBACK_PRODUCTS.find((product) => product.id === productId) || FALLBACK_PRODUCTS[0] || null;
    }

    const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    return docSnap.exists()
      ? ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Product)
      : FALLBACK_PRODUCTS.find((product) => product.id === productId) || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return FALLBACK_PRODUCTS.find((product) => product.id === productId) || null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string, type?: 'retail' | 'wholesale'): Promise<Product[]> {
  try {
    if (!db) {
      const fallback = getFallbackProducts(100).filter((product) => product.category === category);
      return type ? fallback.filter(p => p.type === type || p.type === 'both') : fallback;
    }

    let q;
    if (type) {
      q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('category', '==', category),
        where('type', 'in', [type, 'both']),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }

    try {
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      } as Product));

      return products.length > 0 ? products : getFallbackProducts(100).filter((product) => product.category === category);
    } catch (error: any) {
      // Fallback for missing composite index
      const simpleQ = query(collection(db, COLLECTIONS.PRODUCTS), where('category', '==', category), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(simpleQ);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Product));
      const filtered = type ? products.filter(p => p.type === type || p.type === 'both') : products;
      return filtered;
    }
  } catch (error) {
    console.error('Error fetching category products:', error);
    const fallback = getFallbackProducts(100).filter((product) => product.category === category);
    return type ? fallback.filter(p => p.type === type || p.type === 'both') : fallback;
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
