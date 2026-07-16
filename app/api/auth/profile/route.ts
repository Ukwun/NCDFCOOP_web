import { randomBytes } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestIdentity } from "@/lib/server/requestAuth";

const PENDING_ROLE = "pending_role";

function referralCode(): string {
  return `NCDF-${randomBytes(4).toString("hex").slice(0, 6).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const identity = await verifyRequestIdentity(request);
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const requestedName = String(payload?.name || "").trim().slice(0, 120);
    const email = String(identity.email || "").trim().toLowerCase();
    const name = requestedName || email.split("@")[0] || "NCDF COOP User";
    const onboardingCompleted = payload?.onboardingCompleted === true;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(identity.uid);
    const memberRef = db.collection("members").doc(identity.uid);

    await db.runTransaction(async (transaction) => {
      const [userSnapshot, memberSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(memberRef),
      ]);
      const now = Timestamp.now();

      if (!userSnapshot.exists) {
        transaction.create(userRef, {
          id: identity.uid,
          email,
          name,
          roles: [],
          selectedRole: PENDING_ROLE,
          membershipType: PENDING_ROLE,
          roleSelectionComplete: false,
          onboardingCompleted,
          membershipStatus: "pending",
          memberTier: "bronze",
          createdAt: now,
          updatedAt: now,
          profilePicture: "",
          phone: "",
          address: "",
          isActive: true,
        });
      }

      if (!memberSnapshot.exists) {
        transaction.create(memberRef, {
          userId: identity.uid,
          memberSince: now,
          loyaltyPoints: 0,
          tier: "bronze",
          totalPurchases: 0,
          referralCode: referralCode(),
          isVerified: false,
          isActive: false,
          kycStatus: "pending",
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    return NextResponse.json({ success: true, userId: identity.uid });
  } catch (error) {
    console.error("Profile provisioning failed:", error);
    return NextResponse.json(
      { error: "Profile provisioning is temporarily unavailable." },
      { status: 503 },
    );
  }
}
