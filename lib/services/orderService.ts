/**
 * Order Service
 * Handles order management
 */

import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  collection,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/constants/database";
import { Order } from "@/lib/types/product";

export interface CreatedOrderResult {
  orderId: string;
  transactionRef: string | null;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    totalAmount: number;
    currency: "NGN";
  };
  pricingAdjusted: boolean;
}
/**
 * Create order from cart
 */
export async function createOrder(
  userId: string,
  items: any[],
  totalAmount: number,
  shippingAddress: string,
  paymentMethod: "flutterwave" | "bank_transfer" | "cash_on_delivery",
  buyerType: "member" | "wholesale", // Added buyerType
  orderId?: string,
): Promise<CreatedOrderResult> {
  if (!auth?.currentUser || auth.currentUser.uid !== userId) {
    throw new Error("You must be signed in to create an order.");
  }

  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingAddress,
      paymentMethod,
      buyerType,
      clientTotal: totalAmount,
      requestedOrderId: orderId,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || "We could not create the order.");
  }

  return payload as CreatedOrderResult;
}

/**
 * Get user orders
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ORDERS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Order,
    );
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
}
/**
 * Get order by ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    return docSnap.exists()
      ? ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Order)
      : null;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  try {
    const token = await auth?.currentUser?.getIdToken();
    if (!token) throw new Error("You must be signed in to update an order.");

    const response = await fetch(
      `/api/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "Order update failed.");
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}
