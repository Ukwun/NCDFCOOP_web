/**
 * Border Radius System
 * Consistent rounded corners across the design
 */

export const borderRadius = {
  xs: '4px', // Small elements (badges, chips)
  sm: '8px', // Small rounded corners
  md: '12px', // Standard rounded corners (buttons, inputs)
  lg: '16px', // Large rounded corners (cards, containers)
  xl: '20px', // Extra large rounded corners
  full: '100px', // Circular elements (avatars)

  // Aliases for common usage
  none: '0px',
  small: '4px',
  base: '12px',
  large: '16px',
  circle: '100px',
} as const;

/**
 * Radius presets for different component types
 */
export const radiusPresets = {
  // Button radius
  button: borderRadius.md, // 12px
  buttonSmall: borderRadius.sm, // 8px
  buttonLarge: borderRadius.md, // 12px

  // Input/Form radius
  input: borderRadius.md, // 12px
  inputSmall: borderRadius.sm, // 8px

  // Card radius
  card: borderRadius.lg, // 16px
  cardSmall: borderRadius.md, // 12px

  // Badge/Chip radius
  badge: borderRadius.xs, // 4px
  chip: borderRadius.sm, // 8px

  // Image radius
  image: borderRadius.lg, // 16px
  imageSmall: borderRadius.md, // 12px

  // Avatar radius
  avatar: borderRadius.full, // 100px

  // Modal/Dialog radius
  modal: borderRadius.lg, // 16px

  // Search bar radius
  searchBar: borderRadius.sm, // 8px
} as const;
