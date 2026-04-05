/**
 * Typography System
 * Based on Material Design 3 scale
 */

export const typography = {
  // Heading Styles (H1-H6)
  h1: {
    fontSize: '32px',
    fontWeight: 700, // Bold
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
  },
  h2: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '1.3',
    letterSpacing: '-0.25px',
  },
  h3: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '1.4',
    letterSpacing: '0px',
  },
  h4: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: '1.5',
    letterSpacing: '0.15px',
  },
  h5: {
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: '1.5',
    letterSpacing: '0.15px',
  },
  h6: {
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '1.5',
    letterSpacing: '0.15px',
  },

  // Body Text Styles
  bodyLarge: {
    fontSize: '16px',
    fontWeight: 400, // Normal
    lineHeight: '1.5',
    letterSpacing: '0.15px',
  },
  bodyMedium: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '1.5',
    letterSpacing: '0.25px',
  },
  bodySmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '1.4',
    letterSpacing: '0.4px',
  },

  // Label Styles
  labelLarge: {
    fontSize: '14px',
    fontWeight: 500, // Medium
    lineHeight: '1.4',
    letterSpacing: '0.1px',
  },
  labelMedium: {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '1.4',
    letterSpacing: '0.5px',
  },
  labelSmall: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '1.4',
    letterSpacing: '0.5px',
  },

  // Display styles (for special cases)
  displayLarge: {
    fontSize: '57px',
    fontWeight: 400,
    lineHeight: '1.2',
    letterSpacing: '0px',
  },
  displayMedium: {
    fontSize: '45px',
    fontWeight: 400,
    lineHeight: '1.2',
    letterSpacing: '0px',
  },
  displaySmall: {
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: '1.2',
    letterSpacing: '0px',
  },

  // Title styles
  titleLarge: {
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '1.3',
    letterSpacing: '0px',
  },
  titleMedium: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '1.4',
    letterSpacing: '0.15px',
  },
  titleSmall: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '1.4',
    letterSpacing: '0.1px',
  },
} as const;

/**
 * Font family definitions
 */
export const fontFamily = {
  // System fonts stack
  sans: [
    '-apple-system',
    'BlinkMacSystemFont',
    "'Segoe UI'",
    "'Roboto'",
    "'Oxygen'",
    "'Ubuntu'",
    "'Cantarell'",
    "'Fira Sans'",
    "'Droid Sans'",
    "'Helvetica Neue'",
    'sans-serif',
  ],
  mono: [
    'source-code-pro',
    'Menlo',
    'Monaco',
    'Consolas',
    "'Courier New'",
    'monospace',
  ],
} as const;

/**
 * Font weight constants
 */
export const fontWeight = {
  normal: 400,
  medium: 500,
  bold: 700,
} as const;

/**
 * Line height constants
 */
export const lineHeight = {
  tight: '1.2',
  normal: '1.4',
  relaxed: '1.5',
  loose: '1.8',
} as const;

/**
 * Letter spacing constants
 */
export const letterSpacing = {
  tight: '-0.5px',
  normal: '0px',
  wide: '0.15px',
  wider: '0.5px',
} as const;
