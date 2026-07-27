import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MEMBERSHIP_TIERS } from "@/lib/membership/tiers";
import { normalizeMembershipTierPrices } from "@/lib/membership/pricing";

export async function GET() {
  try {
    const snapshot = await getAdminDb()
      .collection("global_settings")
      .doc("commerce")
      .get();
    const prices = normalizeMembershipTierPrices(
      snapshot.data()?.membershipTierPrices,
    );

    return NextResponse.json(
      {
        tiers: MEMBERSHIP_TIERS.map((tier) => ({
          ...tier,
          subscriptionPrice: prices[tier.id],
        })),
        currency: "NGN",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Membership pricing is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
