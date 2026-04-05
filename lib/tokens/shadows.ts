/**
 * Shadow System
 * Provides depth and elevation with subtle shadows
 * Color: Black at 12% opacity
 */

const shadowColor = 'rgba(0, 0, 0, 0.12)';

export const shadows = {
  // Shadow levels
  none: 'none',

  // Subtle - minimal elevation
  subtle: `0 1px 2px ${shadowColor}`,

  // Small - cards, standard elements
  sm: `0 2px 4px ${shadowColor}`,

  // Medium - elevated cards
  md: `0 4px 8px ${shadowColor}`,

  // Large - modal dialogs
  lg: `0 6px 12px ${shadowColor}`,

  // Extra large - floating elements
  xl: `0 8px 16px ${shadowColor}`,

  // Aliases for common use cases
  button: `0 2px 4px ${shadowColor}`,
  card: `0 2px 4px ${shadowColor}`,
  elevated: `0 4px 8px ${shadowColor}`,
  modal: `0 6px 12px ${shadowColor}`,
  dropdown: `0 4px 12px ${shadowColor}`,
  floating: `0 8px 16px ${shadowColor}`,
} as const;

/**
 * Shadow presets for TailwindCSS
 * Used in tailwind.config.js
 */
export const shadowPresets = {
  subtle: {
    0: `0 1px 2px ${shadowColor}`,
  },
  sm: {
    0: `0 2px 4px ${shadowColor}`,
  },
  md: {
    0: `0 4px 8px ${shadowColor}`,
  },
  lg: {
    0: `0 6px 12px ${shadowColor}`,
  },
  xl: {
    0: `0 8px 16px ${shadowColor}`,
  },
} as const;

/**
 * Box shadow variations for different depths
 * Useful for interactive states
 */
export const interactiveShadows = {
  // Hover state - slight elevation
  hover: `0 2px 8px ${shadowColor}`,

  // Active/Pressed state - more elevation
  active: `0 4px 12px ${shadowColor}`,

  // Focus state - for accessibility
  focus: `0 0 0 3px rgba(79, 70, 229, 0.1)`, // Primary with 10% opacity

  // Disabled state - reduced elevation
  disabled: `0 1px 2px ${shadowColor}`,
} as const;

/**
 * Inset shadows (for depth effect)
 */
export const insetShadows = {
  inset: `inset 0 1px 2px ${shadowColor}`,
  insetSmall: `inset 0 1px 0 ${shadowColor}`,
} as const;
