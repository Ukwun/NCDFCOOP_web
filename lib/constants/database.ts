/**
 * Database Collection Names and Document Structure
 * Keep this centralized for easy refactoring
 */

export const COLLECTIONS = {
  USERS: 'users',
  MEMBERS: 'members',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  TRANSACTIONS: 'transactions',
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations',
  OFFERS: 'offers',
  LOYALTY_POINTS: 'loyaltyPoints',
  ACTIVITY_LOGS: 'activityLogs',
  CART_ITEMS: 'cartItems',
  REVIEWS: 'reviews',
} as const;

export const USER_ROLES = {
  MEMBER: 'member',
  SELLER: 'seller',
  FRANCHISE: 'franchise',
  INSTITUTIONAL_BUYER: 'institutional_buyer',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const;

export const MEMBER_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  LOYALTY_TRANSFER: 'loyalty_transfer',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;
