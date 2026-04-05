/**
 * App Typography System
 * Consistent text styles used throughout the application
 */

export const AppTextStyles = {
  // Heading Styles
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  h2: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '1.3',
    letterSpacing: '-0.3px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  h3: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '1.4',
    letterSpacing: '-0.2px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  h4: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  h5: {
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  h6: {
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // Body Styles
  bodyLarge: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  bodyMedium: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  bodySmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // Label Styles
  labelLarge: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '1.25',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  labelMedium: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: '1.25',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  labelSmall: {
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: '1.25',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },

  // Special Styles
  libreBaskerville: {
    fontFamily: '"Libre Baskerville", serif',
    fontWeight: 700,
  },
  displayLarge: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: '1.1',
    letterSpacing: '-1px',
    fontFamily: '"Libre Baskerville", serif',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: '1.5',
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.5',
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '1.4',
  },
} as const;

/**
 * Tailwind CSS class shortcuts for common text styles
 */
export const TextClasses = {
  h1: 'text-4xl font-bold leading-tight tracking-tight',
  h2: 'text-3xl font-bold leading-snug tracking-tight',
  h3: 'text-2xl font-bold leading-snug tracking-tighter',
  h4: 'text-xl font-bold leading-relaxed',
  h5: 'text-lg font-bold leading-relaxed',
  h6: 'text-base font-bold leading-relaxed',
  
  bodyLarge: 'text-base font-normal leading-relaxed',
  bodyMedium: 'text-sm font-normal leading-relaxed',
  bodySmall: 'text-xs font-normal leading-relaxed',
  
  labelLarge: 'text-sm font-semibold leading-tight',
  labelMedium: 'text-xs font-semibold leading-tight',
  labelSmall: 'text-xs font-semibold leading-tight',
  
  title: 'text-xl font-bold leading-relaxed',
  subtitle: 'text-sm font-medium leading-relaxed',
  caption: 'text-xs font-normal leading-snug',
} as const;

/**
 * Font sizes (in pixels)
 */
export const FontSizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  '5xl': '36px',
  '6xl': '48px',
} as const;

/**
 * Font weights
 */
export const FontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/**
 * Line heights
 */
export const LineHeights = {
  tight: '1.1',
  snug: '1.3',
  normal: '1.5',
  relaxed: '1.6',
  loose: '1.8',
} as const;

/**
 * Letter spacing
 */
export const LetterSpacing = {
  tighter: '-0.5px',
  tight: '-0.25px',
  normal: '0px',
  wide: '0.5px',
  wider: '1px',
  widest: '2px',
} as const;
