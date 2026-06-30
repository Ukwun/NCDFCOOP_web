export const PRODUCT_IMAGE_FALLBACK = '/images/Groceries1.png';

export function resolveProductImage(source?: string | null): string {
  const value = String(source || '').trim();
  if (!value || value.includes('via.placeholder.com')) return PRODUCT_IMAGE_FALLBACK;
  return value;
}
