import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { USER_ROLES } from "@/lib/constants/database";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasAnyRole, verifyRequestUser } from "@/lib/server/requestAuth";

const REVIEW_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasAnyRole(user, REVIEW_ROLES)) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    const payload = await request.json().catch(() => ({}));
    const productId = String(payload.productId || "").trim();
    const decision = String(payload.decision || "").trim();
    const reason = String(payload.reason || "")
      .trim()
      .slice(0, 500);
    if (!productId || !["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { error: "Select a pending product and a valid review decision." },
        { status: 400 },
      );
    }
    if (decision === "reject" && reason.length < 5) {
      return NextResponse.json(
        { error: "Provide a short reason for rejecting this product." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const productRef = db.collection("products").doc(productId);
    const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(productRef);
      if (!snapshot.exists) throw new Error("PRODUCT_NOT_FOUND");
      const product = snapshot.data() || {};
      if (product.status !== "pending" || product.requiresReview !== true) {
        throw new Error("PRODUCT_NOT_PENDING");
      }

      const approved = decision === "approve";
      transaction.update(productRef, {
        status: approved ? "live" : "rejected",
        isActive: approved,
        requiresReview: false,
        reviewedBy: user!.uid,
        reviewedAt: now,
        updatedAt: now,
        ...(approved
          ? { publishedAt: now, rejectionReason: FieldValue.delete() }
          : { rejectionReason: reason, publishedAt: FieldValue.delete() }),
      });
      transaction.set(db.collection("activityLogs").doc(), {
        userId: user!.uid,
        action: approved ? "product_approved" : "product_rejected",
        productId,
        sellerId: String(product.sellerId || ""),
        reason: approved ? "" : reason,
        createdAt: now,
      });
      if (product.sellerId) {
        transaction.set(db.collection("notifications").doc(), {
          userId: String(product.sellerId),
          title: approved ? "Product approved" : "Product needs changes",
          message: approved
            ? `${String(product.name || "Your product")} is now live in the marketplace.`
            : `${String(product.name || "Your product")} was not approved: ${reason}`,
          type: "product_review",
          read: false,
          data: { productId, decision, reason: approved ? "" : reason },
          createdAt: now,
        });
      }
    });

    return NextResponse.json({
      success: true,
      status: decision === "approve" ? "live" : "rejected",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }
    if (message === "PRODUCT_NOT_PENDING") {
      return NextResponse.json(
        { error: "This product has already been reviewed or changed." },
        { status: 409 },
      );
    }
    console.error("Product review failed:", error);
    return NextResponse.json(
      { error: "The product review could not be completed." },
      { status: 500 },
    );
  }
}
