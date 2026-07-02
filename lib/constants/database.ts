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
  NOTIFICATIONS: 'notifications',
  BROADCASTS: 'broadcasts',
  REFUNDS: 'refunds',
  DISPUTES: 'disputes',
  PAYOUT_REQUESTS: 'payoutRequests',
  SELLER_BALANCES: 'sellerBalances',
  SELLER_LEDGER_ENTRIES: 'sellerLedgerEntries',
  STAFF_INVITATIONS: 'staffInvitations',
  FAVORITES: 'favorites',
  REWARDS: 'rewards',
  INQUIRIES: 'inquiries',
  QUOTE_DRAFTS: 'quoteDrafts',
  ANALYTICS_DAILY: 'analyticsDaily',
  ANOMALY_ALERTS: 'anomalyAlerts',
  INTELLIGENCE_RUNS: 'intelligenceRuns',
  GOVERNANCE_MOTIONS: 'governanceMotions',
  MEMBER_VOTES: 'memberVotes',
} as const;

export const USER_ROLES = {
  MEMBER: 'member',
  SELLER: 'seller',
  FRANCHISE: 'franchise',
  INSTITUTIONAL_BUYER: 'institutional_buyer',
  ADMIN: 'admin',
  STAFF: 'staff',
  OPERATOR: 'operator',
  SUPPORT_AGENT: 'support_agent',
  DISPUTE_OFFICER: 'dispute_officer',
  FINANCE_OPERATOR: 'finance_operator',
  RISK_OFFICER: 'risk_officer',
  SUPER_ADMIN: 'super_admin',
} as const;

export const MEMBER_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export const TRANSACTION_TYPES = {
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
