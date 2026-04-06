/**
 * Favorites Hook
 * React hook for managing user favorites
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUserFavorites,
  getFavoritesCount,
  isProductFavorited,
  addToFavorites,
  removeFromFavorites,
  clearAllFavorites,
  FavoriteItem,
} from '@/lib/services';

interface UseFavoritesOptions {
  userId: string;
  autoFetch?: boolean;
}

export function useFavorites({ userId, autoFetch = true }: UseFavoritesOptions) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const [items, totalCount] = await Promise.all([
        getUserFavorites(userId, 100),
        getFavoritesCount(userId),
      ]);

      setFavorites(items);
      setCount(totalCount);
      setFavoriteIds(new Set(items.map((f) => f.productId)));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchFavorites();
    }
  }, [autoFetch, fetchFavorites]);

  const addFavorite = useCallback(
    async (productId: string, productData: Omit<FavoriteItem, 'id' | 'userId' | 'productId' | 'addedAt'>) => {
      try {
        await addToFavorites(userId, productId, productData);

        // Update local state
        setFavorites((prev) => [
          {
            ...productData,
            id: `${userId}_${productId}`,
            userId,
            productId,
            addedAt: new Date() as any,
          } as FavoriteItem,
          ...prev,
        ]);

        setCount((prev) => prev + 1);
        setFavoriteIds((prev) => new Set(prev).add(productId));
      } catch (err) {
        console.error('Failed to add favorite:', err);
        throw err;
      }
    },
    [userId]
  );

  const removeFavorite = useCallback(
    async (productId: string) => {
      try {
        await removeFromFavorites(userId, productId);

        // Update local state
        setFavorites((prev) => prev.filter((f) => f.productId !== productId));
        setCount((prev) => prev - 1);

        const newIds = new Set(favoriteIds);
        newIds.delete(productId);
        setFavoriteIds(newIds);
      } catch (err) {
        console.error('Failed to remove favorite:', err);
        throw err;
      }
    },
    [userId, favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string, productData?: Omit<FavoriteItem, 'id' | 'userId' | 'productId' | 'addedAt'>) => {
      const isFavorited = favoriteIds.has(productId);

      if (isFavorited) {
        await removeFavorite(productId);
      } else if (productData) {
        await addFavorite(productId, productData);
      }
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  const isFavorited = useCallback(
    (productId: string): boolean => {
      return favoriteIds.has(productId);
    },
    [favoriteIds]
  );

  const getFavoritesByCategory = useCallback(
    (category: string): FavoriteItem[] => {
      return favorites.filter((f) => f.productCategory === category);
    },
    [favorites]
  );

  const getFavoritesByPrice = useCallback(
    (minPrice: number, maxPrice: number): FavoriteItem[] => {
      return favorites.filter((f) => f.productPrice >= minPrice && f.productPrice <= maxPrice);
    },
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    try {
      await clearAllFavorites(userId);
      setFavorites([]);
      setCount(0);
      setFavoriteIds(new Set());
    } catch (err) {
      console.error('Failed to clear favorites:', err);
      throw err;
    }
  }, [userId]);

  return {
    favorites,
    count,
    loading,
    error,
    isFavorited,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoritesByCategory,
    getFavoritesByPrice,
    clearFavorites,
    refresh: fetchFavorites,
  };
}
