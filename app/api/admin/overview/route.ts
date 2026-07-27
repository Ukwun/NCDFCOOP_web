import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasAnyRole, verifyRequestUser } from "@/lib/server/requestAuth";
import { USER_ROLES } from "@/lib/constants/database";

function iso(value: unknown): string | null {
  const timestamp = value as { toDate?: () => Date } | null;
  return timestamp?.toDate instanceof Function
    ? timestamp.toDate().toISOString()
    : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasAnyRole(user, [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }
    const db = getAdminDb();
    const [
      users,
      products,
      live,
      drafts,
      orders,
      transactions,
      recentOrders,
      payouts,
      pendingProducts,
    ] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("products").count().get(),
      db.collection("products").where("status", "==", "live").count().get(),
      db.collection("products").where("status", "==", "draft").count().get(),
      db.collection("orders").count().get(),
      db.collection("transactions").count().get(),
      db.collection("orders").orderBy("createdAt", "desc").limit(12).get(),
      db
        .collection("payoutProfiles")
        .orderBy("updatedAt", "desc")
        .limit(30)
        .get(),
      db
        .collection("products")
        .where("status", "==", "pending")
        .limit(30)
        .get(),
    ]);
    const productCount = products.data().count;
    return NextResponse.json({
      metrics: {
        users: users.data().count,
        products: productCount,
        liveProducts: live.data().count,
        draftProducts: drafts.data().count,
        pendingProducts: Math.max(
          productCount - live.data().count - drafts.data().count,
          0,
        ),
        orders: orders.data().count,
        transactions: transactions.data().count,
      },
      recentOrders: recentOrders.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          status: data.status || "pending",
          total: Number(data.total || data.totalAmount || 0),
          buyerEmail: data.customerEmail || data.buyerEmail || data.email || "",
          createdAt: iso(data.createdAt),
          buyerType: data.buyerType || "member",
          complianceStatus: data.complianceStatus || null,
        };
      }),
      payoutProfiles: payouts.docs.map((document) => {
        const data = document.data();
        return {
          sellerId: document.id,
          sellerEmail: data.sellerEmail || "",
          bankName: data.bankName || "",
          accountName: data.accountName || "",
          accountNumber: data.accountNumber || "",
          accountLast4: data.accountLast4 || "",
          reviewStatus: data.reviewStatus || "pending_verification",
          updatedAt: iso(data.updatedAt),
        };
      }),
      pendingProducts: pendingProducts.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: String(data.name || "Untitled product"),
          sellerName: String(data.sellerName || "Seller"),
          sellerId: String(data.sellerId || ""),
          price: Number(data.price || 0),
          stock: Number(data.stock || 0),
          type: String(data.type || "retail"),
          thumbnail: String(data.thumbnail || ""),
        };
      }),
    });
  } catch (error) {
    console.error("Admin overview failed:", error);
    return NextResponse.json(
      { error: "Unable to load admin operations." },
      { status: 500 },
    );
  }
}
