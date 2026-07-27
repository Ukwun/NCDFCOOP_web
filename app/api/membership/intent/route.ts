import { randomUUID } from "crypto";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/server/requestAuth";
import { normalizeMembershipTier } from "@/lib/membership/tiers";
import { normalizeMembershipTierPrices } from "@/lib/membership/pricing";
import {
  initializePaystackTransaction,
  isPaystackConfigured,
  paystackEnvironment,
} from "@/lib/server/paystack";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const requestedTier = String(payload.tier || "bronze").toLowerCase();
    const membershipTier = normalizeMembershipTier(requestedTier);
    if (membershipTier !== requestedTier) {
      return NextResponse.json(
        { error: "Select a valid membership tier." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const profileSnapshot = await db.collection("users").doc(user.uid).get();
    if (profileSnapshot.data()?.membershipStatus === "active") {
      return NextResponse.json(
        { error: "Your membership is already active." },
        { status: 409 },
      );
    }

    const settingsSnapshot = await db
      .collection("global_settings")
      .doc("commerce")
      .get();
    const membershipTierPrices = normalizeMembershipTierPrices(
      settingsSnapshot.data()?.membershipTierPrices,
    );
    const membershipFee = membershipTierPrices[membershipTier];
    const reference = `MEM-${Date.now()}-${randomUUID().slice(0, 10)}`;
    const now = Timestamp.now();
    const paymentProvider = isPaystackConfigured()
      ? "paystack"
      : "flutterwave";
    await db
      .collection("transactions")
      .doc(reference)
      .set({
        id: reference,
        userId: user.uid,
        email: user.email || "",
        type: "membership_activation",
        amount: membershipFee,
        currency: "NGN",
        membershipTier,
        pricingSource: "global_settings/commerce",
        status: "pending",
        paymentMethod: paymentProvider,
        createdAt: now,
        updatedAt: now,
      });

    if (paymentProvider === "paystack") {
      try {
        const initialized = await initializePaystackTransaction({
          email: user.email || "",
          amount: membershipFee,
          currency: "NGN",
          reference,
          callbackUrl: new URL(
            "/membership/payment/callback",
            request.nextUrl.origin,
          ).toString(),
          metadata: {
            userId: user.uid,
            membershipTier,
            transactionType: "membership_activation",
          },
        });
        await db.collection("transactions").doc(reference).update({
          providerReference: initialized.reference,
          providerAccessCode: initialized.accessCode,
          updatedAt: Timestamp.now(),
        });
        return NextResponse.json(
          {
            reference,
            amount: membershipFee,
            currency: "NGN",
            membershipTier,
            paymentProvider,
            paymentEnvironment: paystackEnvironment(),
            authorizationUrl: initialized.authorizationUrl,
          },
          { status: 201 },
        );
      } catch (providerError) {
        await db.collection("transactions").doc(reference).update({
          status: "initialization_failed",
          updatedAt: Timestamp.now(),
        });
        throw providerError;
      }
    }

    return NextResponse.json(
      {
        reference,
        amount: membershipFee,
        currency: "NGN",
        membershipTier,
        paymentProvider,
        paymentEnvironment: /^FLWPUBK_LIVE-/i.test(
          process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
        )
          ? "live"
          : "test",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error(
      "Membership intent failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Membership payment could not be prepared." },
      { status: 500 },
    );
  }
}
