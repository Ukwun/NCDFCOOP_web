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
    const favoriteId = `${userId}_${productId}`;

    const favorite: FavoriteItem = {
      id: favoriteId,
      userId,
      productId,
      addedAt: Timestamp.now(),
      ...productData,
    };

    await setDoc(doc(db, COLLECTIONS.FAVORITES, favoriteId), favorite);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

/**
 * Remove product from favorites
 */
export async function removeFromFavorites(userId: string, productId: string): Promise<void> {
  try {
    const favoriteId = `${userId}_${productId}`;
    await deleteDoc(doc(db, COLLECTIONS.FAVORITES, favoriteId));
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

/**
 * Check if product is in favorites
 */
export async function isProductFavorited(userId: string, productId: string): Promise<boolean> {
  try {
    const favoriteId = `${userId}_${productId}`;
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.FAVORITES), where('id', '==', favoriteId)));
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Get user favorites
 */
export async function getUserFavorites(userId: string, limit: number = 100): Promise<FavoriteItem[]> {
  try {
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
    return [];
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
    return [];
  }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(userId: string): Promise<number> {
  try {
    const q = query(collection(db, COLLECTIONS.FAVORITES), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting favorites count:', error);
    return 0;
  }
}

/**
 * Clear all favorites
 */
export async function clearAllFavorites(userId: string): Promise<void> {
  try {
    const favorites = await getUserFavorites(userId, 1000);

    for (const favorite of favorites) {
      if (favorite.id) {
        await deleteDoc(doc(db, COLLECTIONS.FAVORITES, favorite.id));
      }
    }
  } catch (error) {
    console.error('Error clearing favorites:', error);
    throw error;
  }
}

/**
 * Get average price of favorited products
 */
export async function getAverageFavoritePrice(userId: string): Promise<number> {
  try {
    const favorites = await getUserFavorites(userId, 1000);

    if (favorites.length === 0) {
      return 0;
    }

    const totalPrice = favorites.reduce((sum, item) => sum + item.productPrice, 0);
    return totalPrice / favorites.length;
  } catch (error) {
    console.error('Error calculating average favorite price:', error);
    return 0;
  }
}
