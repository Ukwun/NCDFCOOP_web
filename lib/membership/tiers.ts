export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface MembershipTierDefinition {
  id: MembershipTier;
  name: string;
  minimumSpend: number;
  discountPercentage: number;
  pointsPerHundredNaira: number;
  freeShippingThreshold: number;
  supportLabel: string;
}

export const MEMBERSHIP_TIERS: MembershipTierDefinition[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minimumSpend: 0,
    discountPercentage: 5,
    pointsPerHundredNaira: 1,
    freeShippingThreshold: 50_000,
    supportLabel: 'Member support',
  },
  {
    id: 'silver',
    name: 'Silver',
    minimumSpend: 200_000,
    discountPercentage: 10,
    pointsPerHundredNaira: 2,
    freeShippingThreshold: 5_000,
    supportLabel: 'Priority support',
  },
  {
    id: 'gold',
    name: 'Gold',
    minimumSpend: 500_000,
    discountPercentage: 15,
    pointsPerHundredNaira: 3,
    freeShippingThreshold: 0,
    supportLabel: 'Dedicated support',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minimumSpend: 1_000_000,
    discountPercentage: 20,
    pointsPerHundredNaira: 4,
    freeShippingThreshold: 0,
    supportLabel: 'VIP support',
  },
];

export function normalizeMembershipTier(value?: string): MembershipTier {
  const normalized = String(value || '').toLowerCase();
  return MEMBERSHIP_TIERS.some((tier) => tier.id === normalized)
    ? (normalized as MembershipTier)
    : 'bronze';
}

export function getMembershipTier(value?: string): MembershipTierDefinition {
  const normalized = normalizeMembershipTier(value);
  return MEMBERSHIP_TIERS.find((tier) => tier.id === normalized)!;
}

export function membershipTierForSpend(totalSpent: number): MembershipTierDefinition {
  return [...MEMBERSHIP_TIERS]
    .reverse()
    .find((tier) => totalSpent >= tier.minimumSpend)!;
}

export function applyMemberDiscount(
  amount: number,
  tier?: string
): number {
  const discount = getMembershipTier(tier).discountPercentage;
  return Math.round(amount * (1 - discount / 100) * 100) / 100;
}
