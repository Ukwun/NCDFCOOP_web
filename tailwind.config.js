/** @type {import('tailwindcss').Config} */

// Import design tokens
const colors = require('./lib/tokens/colors').colors;
const semanticColors = require('./lib/tokens/colors').semanticColors;
const spacing = require('./lib/tokens/spacing').spacing;
const borderRadius = require('./lib/tokens/radius').borderRadius;
const shadows = require('./lib/tokens/shadows').shadows;
const typography = require('./lib/tokens/typography');

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Colors from design system
      colors: {
        // Primary colors
        primary: colors.primary,
        'primary-light': colors.primaryLight,
        'primary-dark': colors.primaryDark,
        'primary-container': colors.primaryContainer,

        // Secondary colors
        secondary: colors.secondary,
        'secondary-light': colors.secondaryLight,
        'secondary-dark': colors.secondaryDark,
        'secondary-container': colors.secondaryContainer,

        // Accent
        accent: colors.accent,
        gold: colors.gold,
        tertiary: colors.tertiary,

        // Semantic colors
        error: colors.error,
        'error-light': colors.errorLight,
        'error-dark': colors.errorDark,
        success: colors.success,
        'success-light': colors.successLight,
        'success-dark': colors.successDark,
        warning: colors.warning,
        'warning-light': colors.warningLight,
        'warning-dark': colors.warningDark,
        info: colors.info,
        'info-light': colors.infoLight,
        'info-dark': colors.infoDark,

        // Neutral
        bg: colors.background,
        surface: colors.surface,
        'surface-variant': colors.surfaceVariant,
        outline: colors.outline,

        // Text
        text: colors.text,
        'text-light': colors.textLight,
        'text-tertiary': colors.textTertiary,
        'text-disabled': colors.textDisabled,

        // Status colors
        pending: colors.pending,
        confirmed: colors.confirmed,
        processing: colors.processing,
        shipped: colors.shipped,
        delivered: colors.delivered,
        cancelled: colors.cancelled,
        returned: colors.returned,

        // Dark mode
        'dark-bg': colors.darkBackground,
        'dark-surface': colors.darkSurface,
        'dark-card': colors.darkCard,
        'dark-divider': colors.darkDivider,
      },

      // Spacing scale (4px base)
      spacing: {
        xs: spacing.xs,
        sm: spacing.sm,
        md: spacing.md,
        lg: spacing.lg,
        xl: spacing.xl,
        xxl: spacing.xxl,
        xxxl: spacing.xxxl,
        huge: spacing.huge,
      },

      // Padding
      padding: spacing,

      // Margin
      margin: spacing,

      // Gap
      gap: spacing,

      // Border radius
      borderRadius: {
        xs: borderRadius.xs,
        sm: borderRadius.sm,
        md: borderRadius.md,
        lg: borderRadius.lg,
        xl: borderRadius.xl,
        full: borderRadius.full,
      },

      // Shadows
      boxShadow: {
        none: shadows.none,
        subtle: shadows.subtle,
        sm: shadows.sm,
        md: shadows.md,
        lg: shadows.lg,
        xl: shadows.xl,
        button: shadows.button,
        card: shadows.card,
        elevated: shadows.elevated,
        modal: shadows.modal,
        dropdown: shadows.dropdown,
        floating: shadows.floating,
      },

      // Typography
      fontSize: {
        // Headings
        h1: typography.typography.h1.fontSize,
        h2: typography.typography.h2.fontSize,
        h3: typography.typography.h3.fontSize,
        h4: typography.typography.h4.fontSize,
        h5: typography.typography.h5.fontSize,
        h6: typography.typography.h6.fontSize,

        // Body
        'body-lg': typography.typography.bodyLarge.fontSize,
        'body-md': typography.typography.bodyMedium.fontSize,
        'body-sm': typography.typography.bodySmall.fontSize,

        // Labels
        'label-lg': typography.typography.labelLarge.fontSize,
        'label-md': typography.typography.labelMedium.fontSize,
        'label-sm': typography.typography.labelSmall.fontSize,

        // Display
        'display-lg': typography.typography.displayLarge.fontSize,
        'display-md': typography.typography.displayMedium.fontSize,
        'display-sm': typography.typography.displaySmall.fontSize,

        // Titles
        'title-lg': typography.typography.titleLarge.fontSize,
        'title-md': typography.typography.titleMedium.fontSize,
        'title-sm': typography.typography.titleSmall.fontSize,
      },

      // Font weight
      fontWeight: {
        normal: typography.fontWeight.normal,
        medium: typography.fontWeight.medium,
        bold: typography.fontWeight.bold,
      },

      // Line height
      lineHeight: {
        tight: typography.lineHeight.tight,
        normal: typography.lineHeight.normal,
        relaxed: typography.lineHeight.relaxed,
        loose: typography.lineHeight.loose,
      },

      // Letter spacing
      letterSpacing: {
        tight: typography.letterSpacing.tight,
        normal: typography.letterSpacing.normal,
        wide: typography.letterSpacing.wide,
        wider: typography.letterSpacing.wider,
      },

      // Font family
      fontFamily: {
        sans: typography.fontFamily.sans,
        mono: typography.fontFamily.mono,
      },
    },
  },

  plugins: [],

  // Dark mode using class strategy
  darkMode: 'class',
};
