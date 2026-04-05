/**
 * Spacing System
 * Base unit: 4px
 */

export const spacing = {
  // Base spacing scale
  xs: '4px', // Tiny gaps, inline spacing
  sm: '8px', // Small padding
  md: '12px', // Standard padding
  lg: '16px', // Large padding, screen padding
  xl: '20px', // Extra large spacing
  xxl: '24px', // Section spacing
  xxxl: '32px', // Major section spacing
  huge: '40px', // Large gaps between major areas

  // Aliases for common usage
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
} as const;

/**
 * Padding presets for components
 */
export const padding = {
  // Card padding
  card: spacing.md, // 12px
  cardLarge: spacing.lg, // 16px

  // Button padding
  buttonSmall: `${spacing.sm} ${spacing.md}`, // 8px 12px
  buttonDefault: `${spacing.sm} ${spacing.lg}`, // 8px 16px
  buttonLarge: `${spacing.md} ${spacing.lg}`, // 12px 16px

  // Screen padding
  screen: spacing.lg, // 16px
  screenLarge: spacing.xxl, // 24px

  // Input padding
  input: `${spacing.sm} ${spacing.lg}`, // 12px 16px
} as const;

/**
 * Gap values for flex/grid layouts
 */
export const gap = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
} as const;

/**
 * Margin presets
 */
export const margin = {
  // Section margins
  sectionSmall: spacing.md, // 12px
  sectionDefault: spacing.xxl, // 24px
  sectionLarge: spacing.xxxl, // 32px

  // Component margins
  componentSmall: spacing.sm, // 8px
  componentDefault: spacing.md, // 12px
  componentLarge: spacing.lg, // 16px
} as const;
