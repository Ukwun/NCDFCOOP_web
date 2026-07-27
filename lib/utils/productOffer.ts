import { Product, ProductOffer } from '@/lib/types/product';
import { USER_ROLES } from '@/lib/constants/database';

function asDate(value: ProductOffer['startAt']): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function getActiveProductOffer(product: Product, role?: string): ProductOffer | null {
  const offer = product.activeOffer;
  if (!offer || offer.status === 'inactive') return null;
  const roleAudience = role === USER_ROLES.INSTITUTIONAL_BUYER ? 'wholesale' : 'member';
  if (offer.audience !== 'both' && offer.audience !== roleAudience) return null;
  const now = Date.now();
  const start = asDate(offer.startAt)?.getTime();
  const end = asDate(offer.endAt)?.getTime();
  if (!start || !end || now < start || now >= end) return null;
  return offer;
}

export function applyOfferPrice(price: number, discountPercentage: number) {
  const discount = Math.min(90, Math.max(0, discountPercentage));
  return Math.max(0, Math.round(price * (1 - discount / 100) * 100) / 100);
}
