/**
 * Custom Hook: useSellerProducts
 * Real-time seller product data
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface SellerProductState {
  id: string;
  name: string;
  price: number;
  quantity: number;
  moq: number;
  image?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  inquiries: number;
  createdAt: string;
  description?: string;
}

interface UseSellerProductsReturn {
  products: SellerProductState[];
  loading: boolean;
  error: Error | null;
  filtered: (status?: string) => SellerProductState[];
}

export function useSellerProducts(sellerId: string): UseSellerProductsReturn {
  const [products, setProducts] = useState<SellerProductState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId || !db) {
      setLoading(false);
      return;
    }

    try {
      const productsQuery = query(
        collection(db, COLLECTIONS.PRODUCTS),
        where('sellerId', '==', sellerId)
      );

      const unsubscribe = onSnapshot(
        productsQuery,
        (snapshot) => {
          const productsList: SellerProductState[] = [];
          snapshot.forEach((doc) => {
            const rawData = doc.data();
            productsList.push({
              id: doc.id,
              name: rawData.name || 'Unnamed Product',
              price: rawData.price || 0,
              quantity: rawData.quantity || 0,
              moq: rawData.moq || 1,
              image: rawData.image,
              category: rawData.category || 'General',
              status: rawData.status || 'pending',
              rejectionReason: rawData.rejectionReason,
              inquiries: rawData.inquiries || 0,
              createdAt: rawData.createdAt?.toDate?.() 
                ? getRelativeTime(rawData.createdAt.toDate())
                : 'Recently added',
              description: rawData.description,
            });
          });

          // Sort by creation date (newest first)
          productsList.sort((a, b) => {
            const getTime = (dateStr: string) => {
              if (dateStr.includes('ago')) return Infinity;
              return 0;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
          });

          setProducts(productsList);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching seller products:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up products listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [sellerId]);

  const filtered = (status?: string) => {
    if (!status || status === 'All') return products;
    return products.filter((p) => p.status === status.toLowerCase());
  };

  return { products, loading, error, filtered };
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
