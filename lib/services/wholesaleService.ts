import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/constants/database';
import { Cart, Order } from '@/lib/types/product';
import { addToCart } from '@/lib/services/cartService';

export async function saveWholesaleQuoteDraft(userId: string, cart: Cart): Promise<string> {
  const violations = cart.items.filter((item) => item.quantity < Math.max(1, item.productData?.minOrderQuantity || item.productData?.minOrder || 1));
  const reference = await addDoc(collection(db, COLLECTIONS.QUOTE_DRAFTS), {
    userId, status: 'draft',
    items: cart.items.map((item) => ({ productId: item.productId, productName: item.productData?.name || item.productName || 'Product',
      quantity: item.quantity, price: item.price, sellerId: item.productData?.sellerId || '',
      minOrderQuantity: item.productData?.minOrderQuantity || item.productData?.minOrder || 1 })),
    subtotal: cart.subtotal, estimatedTotal: cart.total,
    moqCompliant: violations.length === 0, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  });
  return reference.id;
}

export async function bulkReorder(userId: string, order: Order): Promise<void> {
  for (const item of order.items || []) {
    await addToCart(userId, item.productId, item.productName, item.price, item.productImage || '', Math.max(1, item.quantity));
  }
}
