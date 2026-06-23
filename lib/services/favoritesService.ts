/**
 * Favorites Service
 * Manages user favorites and wishlist
 */

import {
  doc,
  setDoc,
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { isDevAutologin } from '@/lib/utils/devSession';

const FAVORITES_STORAGE_PREFIX = 'coop_commerce_favorites_';
export const FAVORITES_CHANGED_EVENT = 'coop-commerce:favorites-changed';

function notifyFavoritesChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

function readBrowserFavorites(userId: string): FavoriteItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(`${FAVORITES_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBrowserFavorites(userId: string, items: FavoriteItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${FAVORITES_STORAGE_PREFIX}${userId}`, JSON.stringify(items));
}

export interface FavoriteItem {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  productCategory?: string;
  sellerId?: string;
  sellerName?: string;
  addedAt: Timestamp;
  notes?: string;
}

/**
 * Add product to favorites
 */
export async function addToFavorites(
  userId: string,
  productId: string,
  productData: Omit<FavoriteItem, 'id' | 'userId' | 'productId' | 'addedAt'>
): Promise<void> {
  try {
    if (!db || isDevAutologin()) {
      const favoriteId = `${userId}_${productId}`;
      const existing = readBrowserFavorites(userId).filter((item) => item.productId !== productId);
      writeBrowserFavorites(userId, [
        {
          id: favoriteId,
          userId,
          productId,
          addedAt: new Date() as any,
          ...productData,
        } as FavoriteItem,
        ...existing,
      ]);
      notifyFavoritesChanged();
      return;
    }

    const favoriteId = `${userId}_${productId}`;

    // Sanitize productData to remove undefined values (Firestore requirement)
    const sanitizedData: any = {
      id: favoriteId,
      userId,
      productId,
      addedAt: Timestamp.now(),
    };

    // Only include defined fields
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitizedData[key] = value;
      }
    });

    await setDoc(doc(db, COLLECTIONS.FAVORITES, favoriteId), sanitizedData);
    notifyFavoritesChanged();
  } catch (error) {
    console.error('Error adding to favorites:', error);
    if (typeof window !== 'undefined') {
      const favoriteId = `${userId}_${productId}`;
      const existing = readBrowserFavorites(userId).filter((item) => item.productId !== productId);
      writeBrowserFavorites(userId, [
        {
          id: favoriteId,
          userId,
          productId,
          addedAt: new Date() as any,
          ...productData,
        } as FavoriteItem,
        ...existing,
      ]);
      notifyFavoritesChanged();
      return;
    }

    throw error;
  }
}

/**
 * Remove product from favorites
 */
export async function removeFromFavorites(userId: string, productId: string): Promise<void> {
  try {
    if (!db) {
      writeBrowserFavorites(
        userId,
        readBrowserFavorites(userId).filter(
          (item) => item.productId !== productId && item.id !== `${userId}_${productId}`
        )
      );
      notifyFavoritesChanged();
      return;
    }

    const favoriteId = `${userId}_${productId}`;
    await deleteDoc(doc(db, COLLECTIONS.FAVORITES, favoriteId));
    notifyFavoritesChanged();
  } catch (error) {
    console.error('Error removing from favorites:', error);
    if (typeof window !== 'undefined') {
      writeBrowserFavorites(
        userId,
        readBrowserFavorites(userId).filter(
          (item) => item.productId !== productId && item.id !== `${userId}_${productId}`
        )
      );
      notifyFavoritesChanged();
      return;
    }

    throw error;
  }
}

/**
 * Check if product is in favorites
 */
export async function isProductFavorited(userId: string, productId: string): Promise<boolean> {
  try {
    if (!db) {
      return readBrowserFavorites(userId).some((item) => item.productId === productId);
    }

    const favoriteId = `${userId}_${productId}`;
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.FAVORITES), where('id', '==', favoriteId)));
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return readBrowserFavorites(userId).some((item) => item.productId === productId);
  }
}

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string, limit: number = 100): Promise<FavoriteItem[]> {
  try {
    if (!db || isDevAutologin()) {
      return readBrowserFavorites(userId).slice(0, limit);
    }

    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as FavoriteItem))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return readBrowserFavorites(userId).slice(0, limit);
  }
}

/**
 * Get favorites by category
 */
export async function getFavoritesByCategory(
  userId: string,
  category: string
): Promise<FavoriteItem[]> {
  try {
    if (!db) {
      return readBrowserFavorites(userId).filter((item) => item.productCategory === category);
    }

    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      where('productCategory', '==', category)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FavoriteItem));
  } catch (error) {
    console.error('Error fetching favorites by category:', error);
    return readBrowserFavorites(userId).filter((item) => item.productCategory === category);
  }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(userId: string): Promise<number> {
  try {
    if (!db || isDevAutologin()) {
      return readBrowserFavorites(userId).length;
    }

    const q = query(collection(db, COLLECTIONS.FAVORITES), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting favorites count:', error);
    return readBrowserFavorites(userId).length;
  }
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(userId: string): Promise<void> {
  try {
    if (!db) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`${FAVORITES_STORAGE_PREFIX}${userId}`);
      }
      notifyFavoritesChanged();
      return;
    }

    const favorites = await getUserFavorites(userId, 1000);

    for (const favorite of favorites) {
      if (favorite.id) {
        await deleteDoc(doc(db, COLLECTIONS.FAVORITES, favorite.id));
      }
    }
    notifyFavoritesChanged();
  } catch (error) {
    console.error('Error clearing favorites:', error);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`${FAVORITES_STORAGE_PREFIX}${userId}`);
      notifyFavoritesChanged();
      return;
    }

    throw error;
  }
}

/**
 * Get average price of favorited products
 */
export async function getAverageFavoritePrice(userId: string): Promise<number> {
  try {
    if (!db) {
      const favorites = readBrowserFavorites(userId);
      if (favorites.length === 0) {
        return 0;
      }
      const totalPrice = favorites.reduce((sum, item) => sum + item.productPrice, 0);
      return totalPrice / favorites.length;
    }

    const favorites = await getUserFavorites(userId, 1000);

    if (favorites.length === 0) {
      return 0;
    }

    const totalPrice = favorites.reduce((sum, item) => sum + item.productPrice, 0);
    return totalPrice / favorites.length;
  } catch (error) {
    console.error('Error calculating average favorite price:', error);
    const favorites = readBrowserFavorites(userId);
    if (favorites.length === 0) {
      return 0;
    }

    const totalPrice = favorites.reduce((sum, item) => sum + item.productPrice, 0);
    return totalPrice / favorites.length;
  }
}
