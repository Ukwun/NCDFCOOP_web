import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { hasRole, verifyRequestUser } from "@/lib/server/requestAuth";
import { USER_ROLES } from "@/lib/constants/database";

function numberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= minimum && numeric <= maximum
    ? numeric
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(user, USER_ROLES.SELLER)) {
      return NextResponse.json(
        { error: "A seller account is required to create products." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const category = String(body.category || "").trim();
    const type = String(body.type || "retail");
    const price = numberInRange(body.price, 1, 1_000_000_000);
    const stock = numberInRange(body.stock, 0, 10_000_000);
    const wholesalePrice = body.wholesalePrice
      ? numberInRange(body.wholesalePrice, 1, 1_000_000_000)
      : null;
    const minOrderQuantity = numberInRange(
      body.minOrderQuantity || 1,
      1,
      1_000_000,
    );

    const requestedDraft = body.status === "draft";
    const requestedLive = !requestedDraft;

    if (
      name.length < 2 ||
      name.length > 160 ||
      (requestedLive && description.length < 10) ||
      description.length > 5_000 ||
      !category ||
      !["retail", "wholesale", "both"].includes(type) ||
      price === null ||
      stock === null ||
      minOrderQuantity === null ||
      (type !== "retail" && wholesalePrice === null)
    ) {
      return NextResponse.json(
        { error: "The product details are incomplete or invalid." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const profileSnapshot = await db.collection("users").doc(user.uid).get();
    const profile = profileSnapshot.data() || {};
    const sellerVerified =
      profile.sellerVerified === true ||
      profile.sellerStatus === "approved" ||
      profile.kycStatus === "verified";
    // Verified sellers can publish immediately. Unverified sellers submit to
    // the admin review queue; no browser-controlled field can bypass this.
    const status = requestedDraft
      ? "draft"
      : sellerVerified
        ? "live"
        : "pending";
    const images = Array.isArray(body.images)
      ? body.images
          .filter((image: unknown) => typeof image === "string")
          .slice(0, 10)
      : [];

    const product = {
      name,
      description:
        description || "Description will be added before publishing.",
      category,
      type,
      price,
      retailPrice: price,
      originalPrice:
        numberInRange(body.originalPrice, price, 1_000_000_000) || price,
      discount: numberInRange(body.discount, 0, 100) || 0,
      ...(type !== "retail" ? { wholesalePrice } : {}),
      minOrderQuantity,
      stock: Math.floor(stock),
      unit: String(body.unit || "unit").slice(0, 50),
      maxOrder: Math.max(Math.floor(stock), 1),
      status,
      images,
      thumbnail: String(body.thumbnail || images[0] || "").slice(0, 2_000),
      sellerId: user.uid,
      sellerName: String(profile.name || user.email || "Seller").slice(0, 160),
      sellerVerified,
      ownershipType: "seller",
      rating: 0,
      reviews: 0,
      isFeatured: false,
      isActive: status === "live",
      requiresReview: status === "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(status === "live"
        ? { publishedAt: FieldValue.serverTimestamp() }
        : {}),
    };

    const document = await db.collection("products").add(product);
    return NextResponse.json(
      {
        id: document.id,
        status,
        message:
          status === "live"
            ? "Product published successfully."
            : status === "pending"
              ? "Product submitted for admin review."
              : "Product saved as a draft.",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error(
      "Product creation failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      {
        error:
          "The product service is temporarily unavailable. Your seller workspace will retry securely.",
        code: "PRODUCT_SERVICE_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
}
