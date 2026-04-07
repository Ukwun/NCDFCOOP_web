/**
 * Recommendation Engine
 * Intelligently suggests products based on user behavior
 * 
 * Algorithms:
 * - Collaborative filtering (users like you also bought...)
 * - Content-based (similar products)
 * - Behavioral (what you viewed, what you might want next)
 * - Trending (what's hot right now)
 * - Personalized (based on your purchase history)
 */

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  price: number;
  rating?: number;
  imageUrl?: string;
  reason: string; // Why recommended
  score: number; // 0-100 confidence score
  sellerId?: string;
}

export class RecommendationEngine {
  /**
   * Get personalized recommendations for a user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations: ProductRecommendation[] = [];

      // 1. Get user's purchase history and preferences
      const userHistory = await this.getUserPurchaseHistory(userId);
      const viewedProducts = await this.getUserViewedProducts(userId);
      const favoriteCategories = await this.getUserFavoriteCategories(
        userId
      );

      // 2. Collaborative filtering - users like you also bought
      const collaborativeRecs = await this.getCollaborativeRecommendations(
        userId,
        userHistory.purchasedProductIds,
        5
      );

      // 3. Content-based - similar products to what they viewed
      const contentBasedRecs = await this.getContentBasedRecommendations(
        viewedProducts,
        3
      );

      // 4. Category-based - trending in their favorite categories
      const categoryRecs = await this.getCategoryTrendingProducts(
        favoriteCategories,
        3
      );

      // 5. Behavior-based - what users view next after this
      const behaviorRecs = await this.getBehaviorBasedRecommendations(
        userHistory.lastViewedProductId,
        2
      );

      // Combine and score recommendations
      recommendations.push(...collaborativeRecs);
      recommendations.push(...contentBasedRecs);
      recommendations.push(...categoryRecs);
      recommendations.push(...behaviorRecs);

      // Remove duplicates and sort by score
      const uniqueRecs = new Map<string, ProductRecommendation>();
      recommendations.forEach((rec) => {
        if (!uniqueRecs.has(rec.productId)) {
          uniqueRecs.set(rec.productId, rec);
        } else {
          // Merge scores if product appears in multiple recommendation types
          const existing = uniqueRecs.get(rec.productId)!;
          existing.score = Math.min(100, existing.score + rec.score * 0.3);
        }
      });

      return Array.from(uniqueRecs.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending products across the platform
   */
  static async getTrendingProducts(
    timeWindowDays: number = 7,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
      const cutoffTs = Timestamp.fromDate(cutoffDate);

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_complete'),
        where('timestamp', '>=', cutoffTs),
        orderBy('timestamp', 'desc'),
        limit(10000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Count purchases by product
      const productPurchaseCount: Record<string, any> = {};

      activities.forEach((activity: any) => {
        const items = activity.activityData?.cartItems || [];
        items.forEach((item: any) => {
          const productId = item.productId;
          if (!productId) return;

          if (!productPurchaseCount[productId]) {
            productPurchaseCount[productId] = {
              productId,
              productName: item.name,
              purchases: 0,
              totalRevenue: 0,
              category: activity.activityData?.productCategory,
            };
          }

          productPurchaseCount[productId].purchases++;
          productPurchaseCount[productId].totalRevenue +=
            item.price * item.quantity;
        });
      });

      return Object.values(productPurchaseCount)
        .sort(
          (a: any, b: any) => b.purchases - a.purchases
        )
        .slice(0, limit)
        .map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          category: p.category,
          price: 0, // Would fetch from products collection
          reason: `Trending - ${p.purchases} purchases in last ${timeWindowDays} days`,
          score: Math.min(100, (p.purchases / 100) * 100), // Normalize to 0-100
        }));
    } catch (error) {
      console.error('Error getting trending products:', error);
      return [];
    }
  }

  /**
   * Get frequently together products (product association)
   */
  static async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    try {
      // Get all purchases containing this product
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_complete')
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Find products that are often purchased together
      const companionProducts: Record<string, number> = {};

      activities.forEach((activity: any) => {
        const items = activity.activityData?.cartItems || [];
        const carts = items.map((item: any) => item.productId);

        if (carts.includes(productId)) {
          carts.forEach((cartProductId: string) => {
            if (cartProductId !== productId) {
              companionProducts[cartProductId] =
                (companionProducts[cartProductId] || 0) + 1;
            }
          });
        }
      });

      return Object.entries(companionProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({
          productId: id,
          productName: `Product ${id}`,
          category: '',
          price: 0,
          reason: `Frequently bought together`,
          score: Math.min(100, (count / 100) * 100),
        }));
    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      return [];
    }
  }

  /**
   * Get products to recover abandoned carts
   */
  static async getCartRecoveryRecommendations(
    userId: string,
    cartItems: any[]
  ): Promise<ProductRecommendation[]> {
    try {
      const recommendations: ProductRecommendation[] = [];

      // 1. Suggest complementary products
      for (const item of cartItems.slice(0, 2)) {
        const together = await this.getFrequentlyBoughtTogether(
          item.productId,
          2
        );
        together.forEach((rec) => {
          rec.reason = `Pairs well with ${item.name}`;
          rec.score = 80;
          recommendations.push(rec);
        });
      }

      // 2. Suggest similar products in same category
      const categories = cartItems.map((item: any) => item.category);
      for (const category of categories) {
        const similar = await this.getCategoryTrendingProducts([category], 2);
        similar.forEach((rec) => {
          rec.reason = `Popular in ${category}`;
          rec.score = 70;
          recommendations.push(rec);
        });
      }

      return recommendations
        .slice(0, 3)
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting cart recovery recommendations:', error);
      return [];
    }
  }

  /**
   * Get back-in-stock recommendations for wishlist items
   */
  static async getBackInStockAlerts(
    userId: string
  ): Promise<ProductRecommendation[]> {
    try {
      // Would fetch user's wishlisted items and check if back in stock
      // Implementation depends on wishlist schema
      return [];
    } catch (error) {
      console.error('Error getting back-in-stock alerts:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on browsing history
   */
  private static async getContentBasedRecommendations(
    viewedProducts: string[],
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      if (viewedProducts.length === 0) return [];

      // Get categories of viewed products
      const categories: Record<string, number> = {};

      // This is simplified - in production you'd fetch full product details
      viewedProducts.forEach((productId) => {
        categories[productId] = 1;
      });

      return Array.from(Object.entries(categories))
        .slice(0, limit)
        .map(([id, _]) => ({
          productId: id,
          productName: `Product ${id}`,
          category: 'Similar',
          price: 0,
          reason: 'Similar to products you viewed',
          score: 75,
        }));
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  private static async getCollaborativeRecommendations(
    userId: string,
    userPurchasedProducts: string[],
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      if (userPurchasedProducts.length === 0) return [];

      // Find similar users (users who bought same products)
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_complete')
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      const similarUsers: Record<string, number> = {};

      activities.forEach((activity: any) => {
        if (activity.userId === userId) return;

        const items = activity.activityData?.cartItems || [];
        const productIds = items.map((item: any) => item.productId);

        // Count shared products
        const sharedCount = productIds.filter((id: string) =>
          userPurchasedProducts.includes(id)
        ).length;

        if (sharedCount > 0) {
          similarUsers[activity.userId] =
            (similarUsers[activity.userId] || 0) + sharedCount;
        }
      });

      // Get products recommended by similar users
      const recommendedProducts: Record<string, any> = {};

      activities.forEach((activity: any) => {
        if (!similarUsers[activity.userId]) return;

        const items = activity.activityData?.cartItems || [];
        items.forEach((item: any) => {
          if (!userPurchasedProducts.includes(item.productId)) {
            if (!recommendedProducts[item.productId]) {
              recommendedProducts[item.productId] = {
                productId: item.productId,
                productName: item.name,
                category: item.category,
                price: item.price,
                score: 0,
              };
            }
            recommendedProducts[item.productId].score +=
              similarUsers[activity.userId] || 0;
          }
        });
      });

      return Object.values(recommendedProducts)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit)
        .map((p: any) => ({
          ...p,
          reason: 'Users like you also bought this',
          score: Math.min(100, p.score * 10),
        }));
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending products in user's favorite categories
   */
  private static async getCategoryTrendingProducts(
    categories: string[],
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      if (categories.length === 0) return [];

      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityType', '==', 'purchase_complete'),
        limit(5000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      const categoryProducts: Record<string, any> = {};

      activities.forEach((activity: any) => {
        const items = activity.activityData?.cartItems || [];
        items.forEach((item: any) => {
          if (categories.includes(item.category)) {
            if (!categoryProducts[item.productId]) {
              categoryProducts[item.productId] = {
                productId: item.productId,
                productName: item.name,
                category: item.category,
                price: item.price,
                purchases: 0,
              };
            }
            categoryProducts[item.productId].purchases++;
          }
        });
      });

      return Object.values(categoryProducts)
        .sort((a: any, b: any) => b.purchases - a.purchases)
        .slice(0, limit)
        .map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          category: p.category,
          price: p.price,
          reason: `Trending in ${p.category}`,
          score: 85,
        }));
    } catch (error) {
      console.error('Error getting category trending products:', error);
      return [];
    }
  }

  /**
   * Get behavior-based recommendations
   */
  private static async getBehaviorBasedRecommendations(
    lastViewedProductId: string,
    limit: number
  ): Promise<ProductRecommendation[]> {
    try {
      if (!lastViewedProductId) return [];

      // Find what products are typically viewed/purchased after this one
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('activityData.productId', '==', lastViewedProductId),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      // Extract sessions and see what comes next
      const nextProducts: Record<string, number> = {};

      // This is simplified - in production you'd track session sequences
      return [];
    } catch (error) {
      console.error('Error getting behavior-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get user's purchase history
   */
  private static async getUserPurchaseHistory(userId: string): Promise<{
    purchasedProductIds: string[];
    lastViewedProductId: string;
    totalSpent: number;
  }> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      const purchasedProductIds = new Set<string>();
      let lastViewedProductId = '';
      let totalSpent = 0;

      activities.forEach((activity: any) => {
        if (activity.activityType === 'purchase_complete') {
          const items = activity.activityData?.cartItems || [];
          items.forEach((item: any) => {
            purchasedProductIds.add(item.productId);
          });
          totalSpent += activity.activityData?.orderTotal || 0;
        } else if (
          activity.activityType === 'product_view' &&
          !lastViewedProductId
        ) {
          lastViewedProductId = activity.activityData?.productId || '';
        }
      });

      return {
        purchasedProductIds: Array.from(purchasedProductIds),
        lastViewedProductId,
        totalSpent,
      };
    } catch (error) {
      console.error('Error getting user purchase history:', error);
      return {
        purchasedProductIds: [],
        lastViewedProductId: '',
        totalSpent: 0,
      };
    }
  }

  /**
   * Get user's viewed products
   */
  private static async getUserViewedProducts(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        where('activityType', '==', 'product_view'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => doc.data().activityData?.productId)
        .filter((id): id is string => !!id);
    } catch (error) {
      console.error('Error getting user viewed products:', error);
      return [];
    }
  }

  /**
   * Get user's favorite categories
   */
  private static async getUserFavoriteCategories(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.ACTIVITY_LOGS),
        where('userId', '==', userId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map((doc) => doc.data());

      const categoryCount: Record<string, number> = {};

      activities.forEach((activity: any) => {
        const category = activity.activityData?.productCategory;
        if (category) {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });

      return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, _]) => category);
    } catch (error) {
      console.error('Error getting user favorite categories:', error);
      return [];
    }
  }
}
