/**
 * Design Token System
 * Central export for all design tokens
 * Based on Coop Commerce Design System
 */

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './radius';
export * from './shadows';

// Convenience exports for grouped tokens
export { colors, semanticColors, statusColors } from './colors';
export { spacing, padding, gap, margin } from './spacing';
export {
  typography,
  fontFamily,
  fontWeight,
  lineHeight,
  letterSpacing,
} from './typography';
export { borderRadius, radiusPresets } from './radius';
export { shadows, shadowPresets, interactiveShadows, insetShadows } from './shadows';

/**
 * Design Token Categories
 * Helpful for understanding the structure
 */
export const tokenCategories = {
  colors: 'Color palette and semantic mappings',
  spacing: 'Spacing, padding, gap, and margin scales',
  typography: 'Font sizes, weights, line heights, and families',
  radius: 'Border radius values for different components',
  shadows: 'Shadow system for elevation and depth',
} as const;
