import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { USER_ROLES } from "@/lib/constants/database";
import { verifyRequestIdentity } from "@/lib/server/requestAuth";

const PUBLIC_ROLES = new Set<string>([
  USER_ROLES.MEMBER,
  USER_ROLES.SELLER,
  USER_ROLES.INSTITUTIONAL_BUYER,
]);

function normalizeRole(value: unknown): string | null {
  const role = String(value || "").trim().toLowerCase();
  if (role === "wholesale" || role === "wholesale_buyer" || role === "institutional buyer") {
    return USER_ROLES.INSTITUTIONAL_BUYER;
  }
  return PUBLIC_ROLES.has(role) ? role : null;
}

/**
 * Server-owned role selection prevents Firestore rule drift from blocking a
 * legitimate first-time account, while never allowing public users to grant
 * themselves an operational role or add a second commercial role.
 */
export async function POST(request: NextRequest) {
  try {
    const identity = await verifyRequestIdentity(request);
    if (!identity) {
      return NextResponse.json({ error: "Please sign in before selecting a role." }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const selectedRole = normalizeRole(payload?.role);
    if (!selectedRole) {
      return NextResponse.json({ error: "Choose a valid CoopX account role." }, { status: 400 });
    }

    const userRef = getAdminDb().collection("users").doc(identity.uid);
    const profile = await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(userRef);
      if (!snapshot.exists) {
        throw new Error("Your account profile is still being created. Please retry in a moment.");
      }

      const data = snapshot.data() || {};
      const roles = Array.isArray(data.roles)
        ? data.roles.filter((role): role is string => typeof role === "string")
        : [];
      const publicRoles = roles.filter((role) => PUBLIC_ROLES.has(role));
      const hasOperationalRole = roles.some((role) => !PUBLIC_ROLES.has(role));

      if (hasOperationalRole) {
        throw new Error("This operational account is managed by a CoopX administrator.");
      }

      const isInitialSelection = publicRoles.length === 0;
      if (!isInitialSelection && !publicRoles.includes(selectedRole)) {
        throw new Error("This role is not active on your account. Use a separately approved account for that role.");
      }

      const nextRoles = isInitialSelection ? [selectedRole] : publicRoles;
      const now = Timestamp.now();
      const membershipStatus = isInitialSelection
        ? selectedRole === USER_ROLES.MEMBER ? "pending" : "inactive"
        : typeof data.membershipStatus === "string" ? data.membershipStatus : "inactive";
      transaction.set(
        userRef,
        {
          roles: nextRoles,
          selectedRole,
          membershipType: selectedRole,
          roleSelectionComplete: true,
          membershipStatus,
          updatedAt: now,
        },
        { merge: true },
      );

      return {
        roles: nextRoles,
        selectedRole,
        roleSelectionComplete: true,
        membershipStatus,
      };
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not save your selected role.";
    const status = message.includes("managed") || message.includes("not active") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
