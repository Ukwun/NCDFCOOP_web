/**
 * Color Palette
 * Based on Material Design 3 with Deep Indigo primary
 */

export const colors = {
  // Primary Colors (Deep Indigo)
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  primaryContainer: '#F0F0FF',

  // Secondary Colors (Emerald Green)
  secondary: '#10B981',
  secondaryLight: '#34D399',
  secondaryDark: '#059669',
  secondaryContainer: '#D1FAE5',

  // Accent Colors
  accent: '#F3951A', // Orange/Gold
  gold: '#C9A227', // Premium/membership
  tertiary: '#F59E0B', // Amber - Warnings

  // Semantic Colors
  error: '#EF4444',
  errorLight: '#FCA5A5',
  errorDark: '#DC2626',

  success: '#22C55E',
  successLight: '#86EFAC',
  successDark: '#16A34A',

  warning: '#EAB308',
  warningLight: '#FCD34D',
  warningDark: '#C9A227',

  info: '#3B82F6',
  infoLight: '#93C5FD',
  infoDark: '#1D4ED8',

  // Neutral & Background
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  outline: '#E0E0E0',

  // Text Colors
  text: '#1F2937',
  textLight: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',

  // Status Colors
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#6366F1',
  delivered: '#10B981',
  cancelled: '#EF4444',
  returned: '#F59E0B',

  // Dark Mode
  darkBackground: '#121212',
  darkSurface: '#1E1E1E',
  darkCard: '#2A2A2A',
  darkText: '#FFFFFF',
  darkTextLight: '#B0B0B0',
  darkDivider: '#3A3A3A',
};

/**
 * Semantic color mappings for different contexts
 */
export const semanticColors = {
  light: {
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    text: colors.text,
    textLight: colors.textLight,
    textTertiary: colors.textTertiary,
    border: colors.outline,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
  },
  dark: {
    background: colors.darkBackground,
    surface: colors.darkSurface,
    surfaceVariant: colors.darkCard,
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    text: colors.darkText,
    textLight: colors.darkTextLight,
    textTertiary: colors.darkTextLight,
    border: colors.darkDivider,
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.info,
  },
};

/**
 * Order status color mapping
 */
export const statusColors = {
  pending: colors.pending,
  confirmed: colors.confirmed,
  processing: colors.processing,
  shipped: colors.shipped,
  delivered: colors.delivered,
  cancelled: colors.cancelled,
  returned: colors.returned,
} as const;
