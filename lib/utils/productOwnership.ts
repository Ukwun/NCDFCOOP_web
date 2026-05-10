import { Product, ProductOwnershipType } from '@/lib/types/product';

const NCDF_SELLER_PREFIXES = ['ncdf', 'coop'];
const NCDF_SELLER_NAME_TOKENS = [
  'ncdf',
  'coopmart',
  'cooperative',
  'coop ',
  'ncdf preferred',
  'ncdf direct',
];

export function resolveProductOwnership(product: Product): ProductOwnershipType {
  if (product.ownershipType === 'ncdf' || product.ownershipType === 'seller') {
    return product.ownershipType;
  }

  const sellerId = (product.sellerId || '').toLowerCase();
  const sellerName = (product.sellerName || '').toLowerCase();

  const isNcdfById = NCDF_SELLER_PREFIXES.some((prefix) => sellerId.startsWith(prefix));
  const isNcdfByName = NCDF_SELLER_NAME_TOKENS.some((token) => sellerName.includes(token));

  return isNcdfById || isNcdfByName ? 'ncdf' : 'seller';
}

export function ownershipLabel(ownershipType: ProductOwnershipType): string {
  return ownershipType === 'ncdf' ? 'NCDF Direct' : 'Marketplace Seller';
}

export function ownershipBadgeClasses(ownershipType: ProductOwnershipType): string {
  return ownershipType === 'ncdf'
    ? 'bg-[#EAF4FB] text-[#0E4B78] dark:bg-[#0D3D63]/30 dark:text-[#7FC2EA]'
    : 'bg-[#EAF6EF] text-[#0B6B3A] dark:bg-[#0B6B3A]/30 dark:text-[#7FD4A9]';
}
