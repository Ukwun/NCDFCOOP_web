import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership/tiers";

export type MembershipTierPrices = Record<MembershipTier, number>;

export const DEFAULT_MEMBERSHIP_TIER_PRICES: MembershipTierPrices = {
  bronze: 5_000,
  silver: 15_000,
  gold: 30_000,
  platinum: 50_000,
};

export const MEMBERSHIP_PRICE_MINIMUM = 100;
export const MEMBERSHIP_PRICE_MAXIMUM = 10_000_000;

export function normalizeMembershipTierPrices(
  value: unknown,
): MembershipTierPrices {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return MEMBERSHIP_TIERS.reduce<MembershipTierPrices>(
    (prices, tier) => {
      const candidate = Number(source[tier.id]);
      prices[tier.id] =
        Number.isInteger(candidate) &&
        candidate >= MEMBERSHIP_PRICE_MINIMUM &&
        candidate <= MEMBERSHIP_PRICE_MAXIMUM
          ? candidate
          : DEFAULT_MEMBERSHIP_TIER_PRICES[tier.id];
      return prices;
    },
    { ...DEFAULT_MEMBERSHIP_TIER_PRICES },
  );
}

export function validateMembershipTierPrices(
  value: unknown,
): MembershipTierPrices | null {
  if (typeof value !== "object" || value === null) return null;
  const source = value as Record<string, unknown>;
  const prices = { ...DEFAULT_MEMBERSHIP_TIER_PRICES };

  for (const tier of MEMBERSHIP_TIERS) {
    const candidate = Number(source[tier.id]);
    if (
      !Number.isInteger(candidate) ||
      candidate < MEMBERSHIP_PRICE_MINIMUM ||
      candidate > MEMBERSHIP_PRICE_MAXIMUM
    ) {
      return null;
    }
    prices[tier.id] = candidate;
  }

  return prices;
}
