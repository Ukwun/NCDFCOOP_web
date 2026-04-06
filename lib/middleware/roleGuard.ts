import { ReactNode } from 'react';
import { AuthUser } from '@/lib/auth/authContext';

// Define required roles for specific routes
export const ROUTE_ROLE_REQUIREMENTS: Record<string, string[]> = {
  '/home': [], // All authenticated users
  '/seller/dashboard': ['seller'],
  '/seller/onboarding': ['seller'],
  '/institutional/dashboard': ['institutional_buyer', 'institutional_approver'],
  '/admin': ['admin', 'super_admin'],
  '/franchise': ['franchise', 'store_manager', 'store_staff'],
  '/warehouse': ['warehouse_staff', 'delivery_driver'],
};

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) return true; // No role requirement
  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Get workflow status for route decisions
 */
export function getWorkflowStatus(user: AuthUser | null, onboardingCompleted: boolean, roleSelectionComplete: boolean) {
  return {
    isAuthenticated: !!user,
    onboardingCompleted,
    roleSelectionComplete,
    canAccessApp: !!user && onboardingCompleted && roleSelectionComplete,
  };
}

/**
 * Determine next route based on user state
 */
export function getNextRoute(
  user: AuthUser | null,
  onboardingCompleted: boolean,
  roleSelectionComplete: boolean,
  currentRoute: string
): string | null {
  // Public routes that don't require auth
  const publicRoutes = ['/splash', '/welcome', '/auth/login', '/auth/signup', '/auth/forgot-password', '/onboarding'];
  if (publicRoutes.includes(currentRoute)) {
    return null;
  }

  // Step 1: Not authenticated - must see onboarding first
  if (!user && !onboardingCompleted) {
    return '/onboarding';
  }

  // Step 2: After onboarding, not authenticated - go to signup
  if (!user && onboardingCompleted) {
    return '/welcome';
  }

  // Step 3: Authenticated but role not selected - go to role selection
  if (user && !roleSelectionComplete) {
    return '/role-selection';
  }

  // Step 4: All done - can access app
  return null;
}

/**
 * Permission enum for granular access control
 */
export enum Permission {
  // Buyer permissions
  VIEW_PRODUCTS = 'view_products',
  ADD_TO_CART = 'add_to_cart',
  CHECKOUT = 'checkout',
  VIEW_ORDER_HISTORY = 'view_order_history',
  ADD_MONEY_TO_ACCOUNT = 'add_money_to_account',
  SAVE_MONEY_ON_PLATFORM = 'save_money_on_platform',

  // Seller permissions
  LIST_PRODUCTS = 'list_products',
  EDIT_PRODUCTS = 'edit_products',
  VIEW_SALES_ANALYTICS = 'view_sales_analytics',
  FULFILL_ORDERS = 'fulfill_orders',
  VIEW_SELLER_STATS = 'view_seller_stats',

  // Admin permissions
  VIEW_ALL_USERS = 'view_all_users',
  MODIFY_USER_ROLES = 'modify_user_roles',
  APPROVE_PRODUCTS = 'approve_products',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MODIFY_PRICES = 'modify_prices',
  ACCESS_CONTROL_PANEL = 'access_control_panel',

  // Approval permissions
  APPROVE_ORDERS = 'approve_orders',
  REJECT_ORDERS = 'reject_orders',
}

/**
 * Map roles to permissions
 */
export function getPermissionsForRole(role: string): Permission[] {
  const permissionMap: Record<string, Permission[]> = {
    wholesale_buyer: [
      Permission.VIEW_PRODUCTS,
      Permission.ADD_TO_CART,
      Permission.CHECKOUT,
      Permission.VIEW_ORDER_HISTORY,
      Permission.ADD_MONEY_TO_ACCOUNT,
    ],
    coopMember: [
      Permission.VIEW_PRODUCTS,
      Permission.ADD_TO_CART,
      Permission.CHECKOUT,
      Permission.VIEW_ORDER_HISTORY,
      Permission.ADD_MONEY_TO_ACCOUNT,
      Permission.SAVE_MONEY_ON_PLATFORM,
    ],
    seller: [
      Permission.LIST_PRODUCTS,
      Permission.EDIT_PRODUCTS,
      Permission.VIEW_SALES_ANALYTICS,
      Permission.FULFILL_ORDERS,
      Permission.VIEW_SELLER_STATS,
    ],
    admin: [
      Permission.VIEW_ALL_USERS,
      Permission.MODIFY_USER_ROLES,
      Permission.APPROVE_PRODUCTS,
      Permission.VIEW_AUDIT_LOGS,
      Permission.ACCESS_CONTROL_PANEL,
    ],
    super_admin: Object.values(Permission),
  };

  return permissionMap[role] || [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}
