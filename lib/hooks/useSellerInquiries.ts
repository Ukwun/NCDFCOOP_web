/**
 * Custom Hook: useSellerInquiries
 * Real-time seller bulk purchase inquiries with Firestore listener
 */

'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface InquiryQuote {
  sellerId: string;
  amount: number;
  submittedAt: any;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface SellerInquiry {
  id: string;
  buyerId: string;
  productId: string;
  quantity: string;
  budget: number;
  deliveryDate: string;
  message?: string;
  status: 'new' | 'quoted' | 'accepted' | 'rejected';
  quotes: InquiryQuote[];
  createdAt: any;
  updatedAt: any;
  buyerName?: string;
  buyerEmail?: string;
  productName?: string;
}

interface UseSellerInquiriesReturn {
  inquiries: SellerInquiry[];
  loading: boolean;
  error: Error | null;
  getInquiriesByStatus: (status: string) => SellerInquiry[];
  newInquiries: SellerInquiry[];
  quotedInquiries: SellerInquiry[];
}

export function useSellerInquiries(sellerId: string): UseSellerInquiriesReturn {
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerId || !db) {
      setLoading(false);
      return;
    }

    try {
      const inquiriesQuery = query(
        collection(db, COLLECTIONS.INQUIRIES),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        inquiriesQuery,
        (snapshot) => {
          try {
            const inquiriesList: SellerInquiry[] = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              } as SellerInquiry))
              .filter((inquiry) => {
                // Filter to show inquiries that this seller can quote on
                // In production, you'd want a more sophisticated matching system
                return inquiry.quotes?.some(
                  (q: any) => q.sellerId === sellerId
                ) || !inquiry.quotes?.length; // Show new inquiries without quotes
              });

            setInquiries(inquiriesList);
            setError(null);
            setLoading(false);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            ErrorHandler.logError('SELLER_INQUIRIES_PARSE', error.message, 'error');
            setError(error);
            setLoading(false);
          }
        },
        (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          ErrorHandler.logError(
            'SELLER_INQUIRIES_LISTEN',
            error.message,
            'error'
          );
          setError(error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      ErrorHandler.logError('SELLER_INQUIRIES_SETUP', error.message, 'error');
      setError(error);
      setLoading(false);
    }
  }, [sellerId]);

  const getInquiriesByStatus = (status: string): SellerInquiry[] => {
    return inquiries.filter((inquiry) => inquiry.status === status);
  };

  const newInquiries = inquiries.filter((i) => i.status === 'new');
  const quotedInquiries = inquiries.filter((i) => i.status === 'quoted');

  return {
    inquiries,
    loading,
    error,
    getInquiriesByStatus,
    newInquiries,
    quotedInquiries,
  };
}
