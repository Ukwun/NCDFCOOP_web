/**
 * App Color Palette
 * Consistent color system used throughout the application
 */

export const AppColors = {
  // Primary - Indigo
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  primaryContainer: '#F0F0FF',

  // Secondary - Emerald
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  secondaryContainer: '#D1FAE5',

  // Accent - Gold/Orange
  accent: '#F3951A',
  gold: '#C9A227',
  goldPremium: '#FFD700',

  // Tertiary - Amber
  tertiary: '#F59E0B',

  // Background & Surface
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',

  // Text Colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textLight: '#6B7280',

  // Status Colors
  error: '#EF4444',
  errorDark: '#DC2626',
  success: '#22C55E',
  warning: '#EAB308',
  info: '#3B82F6',
  disabled: '#9CA3AF',

  // Border & Divider
  border: '#E0E0E0',
  divider: '#E5E7EB',

  // Role-specific Colors
  roles: {
    member: '#8B6F47',         // Brown
    wholesaleBuyer: '#2E5090', // Dark Blue
    seller: '#1A472A',          // Dark Green
    wholesaleBuyer2: '#1E7F4E', // Emerald Green
    coopMember: '#C9A227',      // Gold
    premiumMember: '#FFD700',   // Bright Gold
    franchiseOwner: '#F3951A',  // Orange
    storeManager: '#F3951A',    // Orange
    storeStaff: '#F3951A',      // Orange
    institutionalBuyer: '#8B5CF6', // Purple
    institutionalApprover: '#8B5CF6', // Purple
    warehouseStaff: '#EC4899',  // Pink
    deliveryDriver: '#06B6D4',  // Cyan
    admin: '#EF4444',           // Red
    superAdmin: '#DC2626',      // Dark Red
  },

  // Splash Screen
  splashBackground: '#12202F',
  splashCoopGreen: '#1A472A',

  // Glass Morphism
  glassOverlay: 'rgba(250, 250, 250, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassShadow: 'rgba(0, 0, 0, 0.1)',

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    secondary: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    accent: 'linear-gradient(135deg, #F3951A 0%, #F59E0B 100%)',
    dark: 'linear-gradient(135deg, #12202F 0%, #1A472A 100%)',
  },
} as const;

// Tailwind CSS class mappings
export const ColorClasses = {
  primary: 'bg-indigo-500 text-indigo-500 border-indigo-500',
  secondary: 'bg-emerald-500 text-emerald-500 border-emerald-500',
  accent: 'bg-orange-400 text-orange-400 border-orange-400',
  error: 'bg-red-500 text-red-500 border-red-500',
  success: 'bg-green-500 text-green-500 border-green-500',
  warning: 'bg-yellow-400 text-yellow-400 border-yellow-400',
  info: 'bg-blue-500 text-blue-500 border-blue-500',
} as const;
