/**
 * Shopping Cart Service
 * Handles cart management
 */

import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Cart, CartItem } from '@/lib/types/product';

const CART_STORAGE_PREFIX = 'coop_commerce_cart_';

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
      const items = readBrowserCart(userId);
      const cartItemId = `${userId}_${productId}`;
      const existingIndex = items.findIndex((item) => item.id === cartItemId);
      const nextItem: CartItem = {
        id: cartItemId,
        userId,
        productId,
        productName,
        price,
        quantity,
        image,
        addedAt: new Date() as any,
      };

      if (existingIndex >= 0) {
        items[existingIndex] = nextItem;
      } else {
        items.unshift(nextItem);
      }

      writeBrowserCart(userId, items);
      return;
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
  } catch (error) {
    console.error('Error adding to cart:', error);
    if (typeof window !== 'undefined') {
      const items = readBrowserCart(userId);
      const cartItemId = `${userId}_${productId}`;
      const nextItem: CartItem = {
        id: cartItemId,
        userId,
        productId,
        productName,
        price,
        quantity,
        image,
        addedAt: new Date() as any,
      };

      const existingIndex = items.findIndex((item) => item.id === cartItemId);
      if (existingIndex >= 0) {
        items[existingIndex] = nextItem;
      } else {
        items.unshift(nextItem);
      }

      writeBrowserCart(userId, items);
      return;
    }

    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId: string, productId: string): Promise<void> {
  try {
    if (!db) {
      const cartItemId = `${userId}_${productId}`;
      writeBrowserCart(
        userId,
        readBrowserCart(userId).filter((item) => item.id !== cartItemId)
      );
      return;
    }

    const cartItemId = `${userId}_${productId}`;
    await deleteDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId));
  } catch (error) {
    console.error('Error removing from cart:', error);
    if (typeof window !== 'undefined') {
      const cartItemId = `${userId}_${productId}`;
      writeBrowserCart(
        userId,
        readBrowserCart(userId).filter((item) => item.id !== cartItemId)
      );
      return;
    }

    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  try {
    if (!db) {
      if (quantity <= 0) {
        await removeFromCart(userId, productId);
        return;
      }

      const cartItemId = `${userId}_${productId}`;
      const items = readBrowserCart(userId);
      const nextItems = items.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      writeBrowserCart(userId, nextItems);
      return;
    }

    const cartItemId = `${userId}_${productId}`;
    if (quantity <= 0) {
      await removeFromCart(userId, productId);
    } else {
      await updateDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId), {
        quantity,
      });
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    if (typeof window !== 'undefined') {
      if (quantity <= 0) {
        await removeFromCart(userId, productId);
        return;
      }

      const cartItemId = `${userId}_${productId}`;
      const items = readBrowserCart(userId);
      writeBrowserCart(
        userId,
        items.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
      );
      return;
    }

    throw error;
  }
}

/**
 * Get user cart
 */
export async function getUserCart(userId: string): Promise<Cart> {
  try {
    if (!db) {
      const items = readBrowserCart(userId);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = subtotal * 0.1;
      const shipping = subtotal > 50000 ? 0 : 2500;
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

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% VAT
    const shipping = subtotal > 50000 ? 0 : 2500;
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
    if (typeof window !== 'undefined') {
      const items = readBrowserCart(userId);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = subtotal * 0.1;
      const shipping = subtotal > 50000 ? 0 : 2500;
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
    }

    throw error;
  }
}

/**
 * Clear cart
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    if (!db) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`${CART_STORAGE_PREFIX}${userId}`);
      }
      return;
    }

    const q = query(collection(db, COLLECTIONS.CART_ITEMS), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing cart:', error);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`${CART_STORAGE_PREFIX}${userId}`);
      return;
    }

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
