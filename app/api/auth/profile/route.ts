import { randomBytes } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestIdentity } from "@/lib/server/requestAuth";
import { USER_ROLES } from "@/lib/constants/database";
import operationsConfig from "@/operations.config.json";

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
    const name = requestedName || email.split("@")[0] || "CoopX User";
    const onboardingCompleted = payload?.onboardingCompleted === true;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(identity.uid);
    const memberRef = db.collection("members").doc(identity.uid);
    const configuredOwnerEmail = String(
      process.env.INITIAL_SUPER_ADMIN_EMAIL ||
        operationsConfig.initialSuperAdminEmail ||
        "",
    )
      .trim()
      .toLowerCase();
    const isConfiguredOwner =
      identity.emailVerified &&
      !!configuredOwnerEmail &&
      email === configuredOwnerEmail;
    let tokenRefreshRequired = false;

    if (
      isConfiguredOwner &&
      !identity.operationalRoles.includes(USER_ROLES.SUPER_ADMIN)
    ) {
      const auth = getAdminAuth();
      const authUser = await auth.getUser(identity.uid);
      const claims = authUser.customClaims || {};
      const operationalRoles = Array.from(
        new Set([
          ...(Array.isArray(claims.operationalRoles)
            ? claims.operationalRoles.filter(
                (role): role is string => typeof role === "string",
              )
            : []),
          USER_ROLES.SUPER_ADMIN,
        ]),
      );
      await auth.setCustomUserClaims(identity.uid, {
        ...claims,
        operationalRoles,
      });
      tokenRefreshRequired = true;
    }

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
          roles: isConfiguredOwner ? [USER_ROLES.SUPER_ADMIN] : [],
          selectedRole: isConfiguredOwner
            ? USER_ROLES.SUPER_ADMIN
            : PENDING_ROLE,
          membershipType: isConfiguredOwner
            ? USER_ROLES.SUPER_ADMIN
            : PENDING_ROLE,
          roleSelectionComplete: isConfiguredOwner,
          onboardingCompleted,
          membershipStatus: isConfiguredOwner ? "inactive" : "pending",
          memberTier: "bronze",
          createdAt: now,
          updatedAt: now,
          profilePicture: "",
          phone: "",
          address: "",
          isActive: true,
          ...(isConfiguredOwner
            ? {
                isOperationalStaff: true,
                staffStatus: "active",
              }
            : {}),
        });
      } else if (isConfiguredOwner) {
        transaction.set(
          userRef,
          {
            email,
            roles: FieldValue.arrayUnion(USER_ROLES.SUPER_ADMIN),
            selectedRole: USER_ROLES.SUPER_ADMIN,
            roleSelectionComplete: true,
            isOperationalStaff: true,
            staffStatus: "active",
            updatedAt: now,
          },
          { merge: true },
        );
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

    return NextResponse.json({
      success: true,
      userId: identity.uid,
      tokenRefreshRequired,
    });
  } catch (error) {
    console.error("Profile provisioning failed:", error);
    return NextResponse.json(
      { error: "Profile provisioning is temporarily unavailable." },
      { status: 503 },
    );
  }
}
