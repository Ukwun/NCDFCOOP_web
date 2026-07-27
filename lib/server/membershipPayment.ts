import { randomBytes } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  getMembershipTier,
  normalizeMembershipTier,
} from "@/lib/membership/tiers";

export async function completeMembershipPayment(input: {
  reference: string;
  providerTransactionId: string | number;
  providerStatus: string;
}): Promise<{
  userId: string;
  membershipCode: string;
  alreadyCompleted: boolean;
}> {
  const db = getAdminDb();
  const paymentRef = db.collection("transactions").doc(input.reference);

  return db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef);
    if (!paymentSnapshot.exists) throw new Error("TRANSACTION_NOT_FOUND");

    const payment = paymentSnapshot.data() || {};
    if (payment.type !== "membership_activation" || !payment.userId) {
      throw new Error("TRANSACTION_INVALID");
    }
    if (payment.status === "completed") {
      return {
        userId: String(payment.userId),
        membershipCode: String(payment.membershipCode || ""),
        alreadyCompleted: true,
      };
    }

    const userId = String(payment.userId);
    const membershipTier = normalizeMembershipTier(payment.membershipTier);
    const membershipTierDefinition = getMembershipTier(membershipTier);
    const membershipCode = `COOPX-${randomBytes(4).toString("hex").toUpperCase()}`;
    const now = Timestamp.now();
    transaction.update(paymentRef, {
      status: "completed",
      membershipCode,
      providerTransactionId: String(input.providerTransactionId),
      providerStatus: input.providerStatus,
      completedAt: now,
      updatedAt: now,
    });
    transaction.set(
      db.collection("users").doc(userId),
      {
        roles: FieldValue.arrayUnion("member"),
        membershipStatus: "active",
        memberTier: membershipTier,
        membershipPlanTier: membershipTier,
        membershipSubscriptionPrice: Number(payment.amount || 0),
        membershipCode,
        membershipPaidAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      db.collection("members").doc(userId),
      {
        userId,
        isActive: true,
        tier: membershipTier,
        membershipPlanTier: membershipTier,
        membershipSubscriptionPrice: Number(payment.amount || 0),
        loyaltyPoints: FieldValue.increment(0),
        rewardsPoints: FieldValue.increment(0),
        totalSpent: FieldValue.increment(0),
        ordersCount: FieldValue.increment(0),
        memberSince: now,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(db.collection("notifications").doc(), {
      userId,
      title: "Membership activated",
      message: `Your ${membershipTierDefinition.name} CoopX member benefits are now active.`,
      type: "membership",
      read: false,
      data: { membershipCode, membershipTier },
      createdAt: now,
    });

    return { userId, membershipCode, alreadyCompleted: false };
  });
}
