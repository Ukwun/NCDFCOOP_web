/**
 * App Spacing System
 * Consistent spacing values for margins, paddings, and gaps
 * Base unit: 4px
 */

export const AppSpacing = {
  // Base units
  xs: '4px',    // 4px
  sm: '8px',    // 8px
  md: '12px',   // 12px
  lg: '16px',   // 16px
  xl: '20px',   // 20px
  xxl: '24px',  // 24px
  xxxl: '32px', // 32px
  huge: '40px', // 40px

  // Spacing tokens in pixels (for CSS-in-JS)
  xs_px: 4,
  sm_px: 8,
  md_px: 12,
  lg_px: 16,
  xl_px: 20,
  xxl_px: 24,
  xxxl_px: 32,
  huge_px: 40,
} as const;

/**
 * Border Radius System
 * Consistent border radius values for components
 */
export const AppRadius = {
  xs: '4px',      // 4px
  sm: '8px',      // 8px
  md: '12px',     // 12px
  lg: '16px',     // 16px
  xl: '20px',     // 20px
  full: '100px',  // 100%
  circle: '50%',  // Perfect circle

  // Tailwind shortcuts
  xs_tw: 'rounded',
  sm_tw: 'rounded-lg',
  md_tw: 'rounded-xl',
  lg_tw: 'rounded-2xl',
  xl_tw: 'rounded-3xl',
  full_tw: 'rounded-full',
} as const;

/**
 * Shadow System
 * Predefined shadow configurations for different elevations
 */
export const AppShadows = {
  // Subtle shadow - minimal depth
  subtle: '0px 1px 2px rgba(0, 0, 0, 0.05)',

  // Small shadow - light elevation
  sm: '0px 2px 4px rgba(0, 0, 0, 0.1)',

  // Medium shadow - standard elevation
  md: '0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.06)',

  // Large shadow - pronounced elevation
  lg: '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',

  // Extra large shadow - strong elevation
  xl: '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',

  // Glass morphism shadow
  glass: '0px 8px 32px rgba(0, 0, 0, 0.1)',

  // Inset shadow for depth
  inset: 'inset 0px 2px 4px rgba(0, 0, 0, 0.06)',
} as const;

/**
 * Animation Timing
 * Standard duration values for animations
 */
export const AnimationTiming = {
  // Page transitions
  pageFade: 300,      // Fade transition (300ms)
  pageSlide: 450,     // Slide up transition (450ms)

  // Component animations
  splash: 1500,       // Splash screen fade (1500ms)
  welcome: 1200,      // Welcome screen fade (1200ms)
  onboarding: 1000,   // Onboarding transition (1000ms)

  // Micro interactions
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Z-index System
 * Predictable stacking order
 */
export const ZIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1070,
  notification: 1080,
} as const;

/**
 * Breakpoints for responsive design
 */
export const Breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
