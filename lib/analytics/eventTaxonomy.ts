/**
 * Canonical event taxonomy for commerce intelligence.
 *
 * All tracking calls should emit one of these canonical names so dashboards,
 * anomaly detection, and recommendation training are consistent.
 */

export const EVENT_TAXONOMY = {
  // Navigation
  PAGE_VIEW: 'page_view',
  PAGE_EXIT: 'page_exit',
  NAVIGATION: 'navigation',

  // Product discovery
  PRODUCT_VIEW: 'product_view',
  PRODUCT_SEARCH: 'product_search',
  PRODUCT_FILTER: 'product_filter',
  PRODUCT_COMPARE: 'product_compare',

  // Cart
  CART_ADD: 'cart_add',
  CART_REMOVE: 'cart_remove',
  CART_UPDATE: 'cart_update',
  CART_VIEW: 'cart_view',
  CART_ABANDONED: 'cart_abandoned',

  // Checkout / purchase
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_PROGRESS: 'checkout_progress',
  CHECKOUT_ABANDONED: 'checkout_abandoned',
  PURCHASE_COMPLETE: 'purchase_complete',
  PURCHASE_FAILED: 'purchase_failed',

  // Account
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  SIGNUP_FAILED: 'signup_failed',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  ROLE_CHANGED: 'role_changed',

  // Engagement
  OFFER_VIEWED: 'offer_viewed',
  OFFER_APPLIED: 'offer_applied',
  WISHLIST_ADD: 'wishlist_add',
  REVIEW_SUBMITTED: 'review_submitted',
  RATING_SUBMITTED: 'rating_submitted',

  // Messaging / support
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  SUPPORT_CONTACT: 'support_contact',

  // Seller
  PRODUCT_ADDED_BY_SELLER: 'product_added_by_seller',
  PRODUCT_UPDATED_BY_SELLER: 'product_updated_by_seller',
  ORDER_SHIPPED: 'order_shipped',

  // Reliability
  ERROR: 'error',
  PAYMENT_FAILED: 'payment_failed',
  NETWORK_ERROR: 'network_error',
  PAGE_ERROR: 'page_error',
} as const;

export type CanonicalEventType =
  (typeof EVENT_TAXONOMY)[keyof typeof EVENT_TAXONOMY];

const LEGACY_EVENT_ALIASES: Record<string, CanonicalEventType> = {
  add_to_cart: EVENT_TAXONOMY.CART_ADD,
  remove_from_cart: EVENT_TAXONOMY.CART_REMOVE,
  order_placed: EVENT_TAXONOMY.PURCHASE_COMPLETE,
  order_confirmed: EVENT_TAXONOMY.PURCHASE_COMPLETE,
  product_added: EVENT_TAXONOMY.PRODUCT_ADDED_BY_SELLER,
  product_edited: EVENT_TAXONOMY.PRODUCT_UPDATED_BY_SELLER,
  screen_change: EVENT_TAXONOMY.NAVIGATION,
  offer_view: EVENT_TAXONOMY.OFFER_VIEWED,
  settings_changed: EVENT_TAXONOMY.SETTINGS_CHANGE,
};

export function normalizeEventType(eventType: string): CanonicalEventType {
  const lowered = String(eventType || '').trim().toLowerCase();

  if (!lowered) {
    return EVENT_TAXONOMY.ERROR;
  }

  if (Object.values(EVENT_TAXONOMY).includes(lowered as CanonicalEventType)) {
    return lowered as CanonicalEventType;
  }

  return LEGACY_EVENT_ALIASES[lowered] || EVENT_TAXONOMY.ERROR;
}
