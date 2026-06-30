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
  retailRevenue: number;
  wholesaleRevenue: number;
  conversionRate: number;
  lastUpdated: Date;
}

export interface SellerRevenueDataPoint {
  date: string; // YYYY-MM-DD
  retailRevenue: number;
  wholesaleRevenue: number;
  totalRevenue: number;
}

export interface SellerPerformance {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

async function fetchSellerOrders(sellerId: string): Promise<Order[]> {
  const results = await Promise.allSettled([
    getDocs(query(collection(db, COLLECTIONS.ORDERS), where('sellerIds', 'array-contains', sellerId))),
    getDocs(query(collection(db, COLLECTIONS.ORDERS), where('sellerId', '==', sellerId))),
  ]);

  const snapshots = results.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    console.warn('A compatible seller order query was unavailable:', result.reason);
    return [];
  });

  // Orders have existed under both schemas. A seller should still get a
  // usable dashboard when one legacy query is unavailable or denied.
  if (snapshots.length === 0) return [];

  const orderMap = new Map<string, Order>();
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((document) => {
    orderMap.set(document.id, { id: document.id, ...document.data() } as Order);
  });
  return Array.from(orderMap.values());
}

function sellerOrderAmount(order: Order, sellerId: string): number {
  const sellerItems = (order.items || []).filter((item) => item.sellerId === sellerId);
  return sellerItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
}

function orderDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof (value as any).toDate === 'function') return (value as any).toDate();
  return new Date(value ? String(value) : 0);
}

// Fetch seller dashboard statistics
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  try {
    // Get seller's orders
    const orders = await fetchSellerOrders(sellerId);

    // Get seller's products
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('sellerId', '==', sellerId)
    );
    const productsSnap = await getDocs(productsQuery);

    // Calculate stats
    let totalRevenue = 0;
    let totalOrders = 0;
    let retailRevenue = 0;
    let wholesaleRevenue = 0;

    orders.forEach((order) => {
      const amount = sellerOrderAmount(order, sellerId);
      totalRevenue += amount;
      totalOrders += 1;

      if (order.buyerType === 'wholesale' || (order as any).buyerRole === 'institutional_buyer') {
        wholesaleRevenue += amount;
      } else {
        retailRevenue += amount;
      }
    });

    const totalProducts = productsSnap.size;
    const totalSales = totalOrders; // In this context, sales = orders
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalSales,
      totalRevenue,
      totalOrders,
      totalProducts,
      retailRevenue,
      wholesaleRevenue,
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
    const orders = (await fetchSellerOrders(sellerId))
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
    const orders = await fetchSellerOrders(sellerId);

    const performanceMap = new Map<string, { sales: number; revenue: number; orders: number }>();

    orders.forEach((order) => {
      const date = orderDate(order.createdAt);
      const dateStr = date.toISOString().split('T')[0];

      if (!performanceMap.has(dateStr)) {
        performanceMap.set(dateStr, { sales: 0, revenue: 0, orders: 0 });
      }

      const data = performanceMap.get(dateStr)!;
      data.sales += 1;
      data.revenue += sellerOrderAmount(order, sellerId);
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

/**
 * Get seller's revenue breakdown (retail vs. wholesale) over time.
 * Aggregates data daily.
 */
export async function getSellerRevenueBreakdownOverTime(
  sellerId: string,
  startDate: Date,
  endDate: Date
): Promise<SellerRevenueDataPoint[]> {
  try {
    const orders = (await fetchSellerOrders(sellerId)).filter((order) => {
      const createdAt = orderDate(order.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const dailyRevenueMap = new Map<string, { retail: number; wholesale: number; total: number }>();

    orders.forEach((order) => {
      const amount = sellerOrderAmount(order, sellerId);
      const createdDate = orderDate(order.createdAt);
      const dateStr = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyRevenueMap.has(dateStr)) {
        dailyRevenueMap.set(dateStr, { retail: 0, wholesale: 0, total: 0 });
      }

      const data = dailyRevenueMap.get(dateStr)!;
      data.total += amount;

      if (order.buyerType === 'wholesale' || (order as any).buyerRole === 'institutional_buyer') {
        data.wholesale += amount;
      } else {
        data.retail += amount;
      }
    });

    return Array.from(dailyRevenueMap.entries())
      .map(([date, data]) => ({
        date,
        retailRevenue: data.retail,
        wholesaleRevenue: data.wholesale,
        totalRevenue: data.total,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching seller revenue breakdown over time:', error);
    return [];
  }
}
