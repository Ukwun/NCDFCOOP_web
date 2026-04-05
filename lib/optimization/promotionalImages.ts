/**
 * Promotional Image Helper
 * 
 * Generates promotional images for offers based on discount type
 * Week 1 Image Optimization: Promotional image handling
 */

/**
 * Get promotional image for an offer based on discount type
 * Returns emoji emoji for MVP, can be replaced with real images
 * 
 * @param discountType - Type of discount (percentage, points, shipping, etc.)
 * @param discountValue - Discount percentage or value
 * @returns Image path or emoji for the offer
 */
export function getPromotionalImage(discountType: string, discountValue: number): string {
  // Map discount types to promotional images/emojis
  const promotionalMap: Record<string, string> = {
    '30': '🥬',     // Fresh Vegetables Bundle
    '25': '🌾',     // Premium Grains
    '100': '💎',    // Double Points (premium)
    '0': '🚚',      // Free Shipping
    'vegetable': '🥬',
    'grain': '🌾',
    'points': '💎',
    'shipping': '🚚',
    'general': '🎁',
  };

  // Try to find by exact discount value
  const discountKey = `${discountValue}`;
  if (promotionalMap[discountKey]) {
    return promotionalMap[discountKey];
  }

  // Try to find by type
  if (promotionalMap[discountType]) {
    return promotionalMap[discountType];
  }

  // Default promotional emoji
  return '🎁';
}

/**
 * Get promotional image filename for real image storage
 * Can be used when real images are available in /public/images/offers/
 * 
 * @param discountValue - Discount percentage
 * @returns Image filename path
 */
export function getPromotionalImagePath(discountValue: number): string {
  const imageMap: Record<number, string> = {
    30: '/images/offers/vegetables-bundle.webp',
    25: '/images/offers/grains-package.webp',
    100: '/images/offers/double-points.webp',
    0: '/images/offers/free-shipping.webp',
  };

  return imageMap[discountValue] || '/images/offers/general-offer.webp';
}

/**
 * Image optimization config for promotional images
 */
export const promotionalImageConfig = {
  quality: 80,
  sizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 400 },
  },
  formats: ['image/webp', 'image/jpeg'],
  maxAge: 604800, // 1 week for promotional images
};
