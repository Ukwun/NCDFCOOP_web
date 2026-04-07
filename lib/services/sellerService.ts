/**
 * Seller Dashboard Service
 * Fetch and manage seller-specific data
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Order, Product } from '@/lib/types/product';

export interface SellerStats {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  lastUpdated: Date;
}

export interface SellerPerformance {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

// Fetch seller dashboard statistics
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  try {
    // Get seller's orders
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('sellerId', '==', sellerId)
    );
    const ordersSnap = await getDocs(ordersQuery);

    // Get seller's products
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('sellerId', '==', sellerId)
    );
    const productsSnap = await getDocs(productsQuery);

    // Calculate stats
    let totalRevenue = 0;
    let totalOrders = 0;

    ordersSnap.forEach((doc) => {
      const order = doc.data();
      totalRevenue += order.total || 0;
      totalOrders += 1;
    });

    const totalProducts = productsSnap.size;
    const totalSales = totalOrders; // In this context, sales = orders
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalSales,
      totalRevenue,
      totalOrders,
      totalProducts,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      conversionRate: 0, // Would need views data to calculate
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    throw new Error('Failed to fetch seller statistics');
  }
}

// Fetch seller's recent orders
export async function getSellerRecentOrders(sellerId: string, limit: number = 5): Promise<Order[]> {
  try {
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('sellerId', '==', sellerId)
    );
    const ordersSnap = await getDocs(ordersQuery);

    const orders = ordersSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Order))
      .sort((a, b) => {
        const getTime = (date: any) => {
          if (date instanceof Timestamp) {
            return date.toDate().getTime();
          }
          if (date instanceof Date) {
            return date.getTime();
          }
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      })
      .slice(0, limit);

    return orders;
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    throw new Error('Failed to fetch seller orders');
  }
}

// Fetch seller's top products
export async function getSellerTopProducts(sellerId: string, maxResults: number = 5): Promise<Product[]> {
  try {
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('sellerId', '==', sellerId)
    );
    const productsSnap = await getDocs(productsQuery);

    const products = productsSnap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Product))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, maxResults);

    return products;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw new Error('Failed to fetch seller products');
  }
}

// Get seller profile
export async function getSellerProfile(sellerId: string) {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, sellerId));
    if (!docSnap.exists()) {
      throw new Error('Seller profile not found');
    }
    return docSnap.data();
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    throw new Error('Failed to fetch seller profile');
  }
}

// Update seller profile
export async function updateSellerProfile(sellerId: string, profileData: any) {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, sellerId), {
      ...profileData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    throw new Error('Failed to update seller profile');
  }
}

// Get seller's store settings
export async function getSellerSettings(sellerId: string) {
  try {
    const docSnap = await getDoc(
      doc(db, COLLECTIONS.USERS, sellerId, 'settings', 'store')
    );
    if (!docSnap.exists()) {
      return {
        storeName: '',
        storeDescription: '',
        paymentMethods: [],
        shippingRates: [],
      };
    }
    return docSnap.data();
  } catch (error) {
    console.error('Error fetching seller settings:', error);
    return {
      storeName: '',
      storeDescription: '',
      paymentMethods: [],
      shippingRates: [],
    };
  }
}

// Update seller's store settings
export async function updateSellerSettings(sellerId: string, settings: any) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, sellerId, 'settings', 'store'), settings, {
      merge: true,
    });
  } catch (error) {
    console.error('Error updating seller settings:', error);
    throw new Error('Failed to update seller settings');
  }
}

// Get seller's performance data (sales over time)
export async function getSellerPerformance(
  sellerId: string,
  days: number = 30
): Promise<SellerPerformance[]> {
  try {
    const ordersQuery = query(
      collection(db, COLLECTIONS.ORDERS),
      where('sellerId', '==', sellerId)
    );
    const ordersSnap = await getDocs(ordersQuery);

    const performanceMap = new Map<string, { sales: number; revenue: number; orders: number }>();

    ordersSnap.forEach((doc) => {
      const order = doc.data();
      const date = order.createdAt?.toDate?.() || new Date();
      const dateStr = date.toISOString().split('T')[0];

      if (!performanceMap.has(dateStr)) {
        performanceMap.set(dateStr, { sales: 0, revenue: 0, orders: 0 });
      }

      const data = performanceMap.get(dateStr)!;
      data.sales += 1;
      data.revenue += order.total || 0;
      data.orders += 1;
    });

    return Array.from(performanceMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching seller performance:', error);
    return [];
  }
}
