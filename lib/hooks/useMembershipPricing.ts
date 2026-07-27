"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MEMBERSHIP_TIERS,
  type MembershipTierDefinition,
} from "@/lib/membership/tiers";
import { DEFAULT_MEMBERSHIP_TIER_PRICES } from "@/lib/membership/pricing";

export type PricedMembershipTier = MembershipTierDefinition & {
  subscriptionPrice: number;
};

const DEFAULT_TIERS: PricedMembershipTier[] = MEMBERSHIP_TIERS.map((tier) => ({
  ...tier,
  subscriptionPrice: DEFAULT_MEMBERSHIP_TIER_PRICES[tier.id],
}));

export function useMembershipPricing() {
  const [tiers, setTiers] = useState<PricedMembershipTier[]>(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/membership/pricing", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload.tiers)) {
        throw new Error(
          payload.error || "Membership pricing could not be refreshed.",
        );
      }
      setTiers(payload.tiers);
      setError("");
    } catch (pricingError) {
      setError(
        pricingError instanceof Error
          ? pricingError.message
          : "Membership pricing could not be refreshed.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { tiers, loading, error, refresh };
}
