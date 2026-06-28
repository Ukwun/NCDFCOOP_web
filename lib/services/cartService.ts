/**
 * Shopping Cart Service
 * Handles cart management
 */

import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Cart, CartItem } from '@/lib/types/product';
import {
  applyMemberDiscount,
  getMembershipTier,
} from '@/lib/membership/tiers';

const CART_STORAGE_PREFIX = 'coop_commerce_cart_';
export const CART_CHANGED_EVENT = 'coop-commerce:cart-changed';

function notifyCartChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

function readBrowserCart(userId: string): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(`${CART_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBrowserCart(userId: string, items: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`${CART_STORAGE_PREFIX}${userId}`, JSON.stringify(items));
}

/**
 * Add item to cart
 */
export async function addToCart(
  userId: string,
  productId: string,
  productName: string,
  price: number,
  image: string,
  quantity: number = 1
): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized. Cart service unavailable.');
    }

    const cartItemId = `${userId}_${productId}`;
    const cartItem: CartItem = {
      id: cartItemId,
      userId,
      productId,
      productName,
      price,
      quantity,
      image,
      addedAt: Timestamp.now(),
    };

    await setDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId), cartItem);
    notifyCartChanged();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId: string, productId: string): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized. Cart service unavailable.');
    }

    const cartItemId = `${userId}_${productId}`;
    await deleteDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId));
    notifyCartChanged();
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized. Cart service unavailable.');
    }

    const cartItemId = `${userId}_${productId}`;
    if (quantity <= 0) {
      await removeFromCart(userId, productId);
    } else {
      await updateDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId), {
        quantity,
      });
      notifyCartChanged();
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

/**
 * Get user cart
 */
export async function getUserCart(userId: string): Promise<Cart> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized. Cart service unavailable.');
    }

    const q = query(collection(db, COLLECTIONS.CART_ITEMS), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    let items: CartItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CartItem));

    // Enrich cart items with full product data
    items = await Promise.all(
      items.map(async (item) => {
        try {
          const productDoc = await getDoc(doc(db, COLLECTIONS.PRODUCTS, item.productId));
          if (productDoc.exists()) {
            return {
              ...item,
              productData: {
                id: productDoc.id,
                ...productDoc.data(),
              } as any,
            };
          }
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
        }
        return item;
      })
    );

    const profileSnapshot = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    const profile = profileSnapshot.data() || {};
    const isWholesaleBuyer = profile.selectedRole === 'institutional_buyer';
    const isActiveMember =
      profile.selectedRole === 'member' && profile.membershipStatus === 'active';
    const memberTier = getMembershipTier(profile.memberTier);

    items = items.map((item) => {
      const product = item.productData;
      if (!product) return item;

      const retailPrice = Number(
        product.price || product.retailPrice || product.originalPrice || item.price
      );
      let effectivePrice = retailPrice;

      if (
        isWholesaleBuyer &&
        ['wholesale', 'both'].includes(product.type || 'retail')
      ) {
        const bulkPrice = [...(product.bulkPrices || [])]
          .filter(
            (row) =>
              item.quantity >= row.minQuantity &&
              (!row.maxQuantity || item.quantity <= row.maxQuantity)
          )
          .sort((left, right) => right.minQuantity - left.minQuantity)[0]?.price;
        effectivePrice = Number(bulkPrice || product.wholesalePrice || retailPrice);
      } else if (isActiveMember) {
        effectivePrice = applyMemberDiscount(retailPrice, memberTier.id);
      }

      return { ...item, price: effectivePrice };
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% VAT
    const freeShippingThreshold = isActiveMember
      ? memberTier.freeShippingThreshold
      : 50000;
    const shipping =
      freeShippingThreshold === 0 || subtotal > freeShippingThreshold ? 0 : 2500;
    const total = subtotal + tax + shipping;

    return {
      userId,
      items,
      subtotal,
      tax,
      shipping,
      total,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

/**
 * Clear cart
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firebase not initialized. Cart service unavailable.');
    }

    const q = query(collection(db, COLLECTIONS.CART_ITEMS), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    notifyCartChanged();
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

/**
 * Get cart item count
 */
export async function getCartItemCount(userId: string): Promise<number> {
  try {
    const cart = await getUserCart(userId);
    return cart.items.length;
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}
