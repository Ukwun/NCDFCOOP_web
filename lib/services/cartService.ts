/**
 * Shopping Cart Service
 * Handles cart management
 */

import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  addedAt: Timestamp;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
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
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId: string, productId: string): Promise<void> {
  try {
    const cartItemId = `${userId}_${productId}`;
    await deleteDoc(doc(db, COLLECTIONS.CART_ITEMS, cartItemId));
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
    throw error;
  }
}

/**
 * Get user cart
 */
export async function getUserCart(userId: string): Promise<Cart> {
  try {
    const q = query(collection(db, COLLECTIONS.CART_ITEMS), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const items: CartItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CartItem));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.075; // 7.5% tax
    const shipping = subtotal > 5000 ? 0 : 500;
    const total = subtotal + tax + shipping;

    return {
      items,
      subtotal,
      tax,
      shipping,
      total,
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
    const q = query(collection(db, COLLECTIONS.CART_ITEMS), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
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
