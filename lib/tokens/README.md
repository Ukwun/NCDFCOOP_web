# Design Token System

A comprehensive, structured design token system for the Coop Commerce web application. All design values (colors, spacing, typography, shadows, and border radius) are defined once and reused consistently across the application.

## Overview

This token system is based on the Coop Commerce Design System specification, which itself is derived from the Flutter app's Material Design 3 implementation.

### Key Features

- **Centralized definitions** - All design values in one place
- **Multiple interfaces** - Use via Tailwind CSS, CSS variables, or TypeScript imports
- **Type-safe** - Full TypeScript support with IntelliSense
- **Dark mode ready** - Automatic color adjustments for dark theme
- **Consistent scaling** - 4px-based spacing system
- **Material Design 3** - Aligned with modern design standards

## File Structure

```
lib/tokens/
├── colors.ts          # Color palette and semantic colors
├── spacing.ts         # Spacing, padding, gap, margin scales
├── typography.ts      # Font sizes, weights, line heights, families
├── radius.ts          # Border radius values
├── shadows.ts         # Shadow system for elevation
├── index.ts           # Main export file
├── USAGE_GUIDE.md     # Detailed usage examples
└── README.md          # This file
```

## Token Categories

### 1. Colors (`colors.ts`)

Comprehensive color palette organized by purpose:

```typescript
// Primary colors (Indigo)
colors.primary         // #4F46E5
colors.primaryLight    // #6366F1
colors.primaryDark     // #4338CA

// Secondary colors (Green)
colors.secondary       // #10B981
colors.secondaryLight  // #34D399

// Semantic colors
colors.error           // #EF4444
colors.success         // #22C55E
colors.warning         // #EAB308
colors.info            // #3B82F6

// Neutral colors
colors.background      // #FAFAFA
colors.surface         // #FFFFFF
colors.text            // #1F2937
colors.textLight       // #6B7280

// Order status colors
colors.pending, colors.confirmed, colors.shipped, etc.
```

**Usage:**
```jsx
// Tailwind
<div className="bg-primary text-surface">Primary button</div>

// CSS
<div style={{ color: 'var(--color-primary)' }}>Primary text</div>

// TypeScript
import { colors } from '@/lib/tokens';
const bgColor = colors.primary;
```

### 2. Spacing (`spacing.ts`)

4px-based spacing scale for padding, margins, and gaps:

```typescript
spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 12px
spacing.lg      // 16px
spacing.xl      // 20px
spacing.xxl     // 24px
spacing.xxxl    // 32px
spacing.huge    // 40px
```

**Usage:**
```jsx
// Tailwind
<div className="p-lg m-md">Box with 16px padding and 12px margin</div>
<div className="flex gap-md">Flex items with 12px gap</div>

// CSS
<div style={{ padding: 'var(--space-lg)' }}>Content</div>
```

### 3. Typography (`typography.ts`)

Font sizes, weights, line heights, and font family definitions:

```typescript
// Heading sizes
typography.h1   // 32px, bold
typography.h2   // 28px, bold
typography.h3   // 24px, bold
typography.h4   // 20px, bold

// Body text
typography.bodyLarge   // 16px, normal
typography.bodyMedium  // 14px, normal
typography.bodySmall   // 12px, normal

// Labels
typography.labelLarge  // 14px, medium weight
typography.labelSmall  // 11px, medium weight

// Font properties
fontWeight.normal      // 400
fontWeight.medium      // 500
fontWeight.bold        // 700

lineHeight.tight       // 1.2
lineHeight.normal      // 1.4
lineHeight.relaxed     // 1.5
```

**Usage:**
```jsx
// Tailwind
<h1 className="text-h1 font-bold leading-tight">Page Title</h1>
<p className="text-body-md leading-relaxed">Body text</p>

// CSS
<div style={{ fontSize: 'var(--font-size-h1)', fontWeight: 700 }}>Title</div>
```

### 4. Border Radius (`radius.ts`)

Consistent border radius values for different component types:

```typescript
borderRadius.xs        // 4px   (badges, chips)
borderRadius.sm        // 8px   (small elements)
borderRadius.md        // 12px  (buttons, inputs)
borderRadius.lg        // 16px  (cards)
borderRadius.xl        // 20px  (modals)
borderRadius.full      // 100px (circular/avatar)

// Component presets
radiusPresets.button       // 12px
radiusPresets.card         // 16px
radiusPresets.badge        // 4px
radiusPresets.avatar       // 100px
```

**Usage:**
```jsx
// Tailwind
<button className="rounded-md">Standard button</button>
<div className="rounded-lg">Card</div>
<img className="rounded-full" src="" alt="" />

// CSS
<div style={{ borderRadius: 'var(--radius-card)' }}>Card</div>
```

### 5. Shadows (`shadows.ts`)

Elevation system with subtle, layered shadows:

```typescript
shadows.subtle     // Minimal elevation (1px blur)
shadows.sm         // Small cards (2px blur)
shadows.md         // Elevated cards (4px blur)
shadows.lg         // Modals (6px blur)
shadows.xl         // Floating (8px blur)

// Component presets
shadows.button     // 0 2px 4px rgba(0,0,0,0.12)
shadows.card       // 0 2px 4px rgba(0,0,0,0.12)
shadows.dropdown   // 0 4px 12px rgba(0,0,0,0.12)
shadows.modal      // 0 6px 12px rgba(0,0,0,0.12)
```

**Usage:**
```jsx
// Tailwind
<div className="shadow-card rounded-lg">Elevated card</div>

// CSS
<div style={{ boxShadow: 'var(--shadow-lg)' }}>Modal background</div>
```

## Integration Points

### Tailwind CSS

All tokens are integrated into `tailwind.config.js`:

```javascript
// Colors are available as Tailwind classes
<div className="bg-primary text-surface">

// Spacing tokens
<div className="p-lg m-md gap-xl">

// Typography tokens
<h1 className="text-h1 font-bold leading-tight">

// Border radius
<div className="rounded-lg">

// Shadows
<div className="shadow-card">
```

### CSS Custom Properties

All tokens are exposed as CSS variables in `app/globals.css`:

```css
:root {
  --color-primary: #4F46E5;
  --space-lg: 16px;
  --radius-md: 12px;
  --shadow-card: 0 2px 4px rgba(0, 0, 0, 0.12);
  /* ... all other tokens ... */
}
```

### TypeScript/JavaScript

Import tokens directly for dynamic styling:

```typescript
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '@/lib/tokens';

// Use in component configuration
const styles = {
  backgroundColor: colors.primary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  boxShadow: shadows.card,
};
```

## Dark Mode

Dark mode is automatically handled through CSS variables:

```css
/* Light mode (default) */
:root {
  --color-background: #FAFAFA;
  --color-text: #1F2937;
}

/* Dark mode */
.dark {
  --color-background: #121212;
  --color-text: #FFFFFF;
}
```

When dark mode is active (by adding `dark` class to `<html>`), all colors automatically adjust.

## Quick Reference

### Most Common Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | #4F46E5 | Main actions, buttons, links |
| `secondary` | #10B981 | Success, availability |
| `accent` | #F3951A | Highlights, badges |
| `error` | #EF4444 | Errors, deletion |
| `lg` (space) | 16px | Standard padding |
| `md` (space) | 12px | Component padding |
| `md` (radius) | 12px | Buttons, inputs |
| `lg` (radius) | 16px | Cards |
| `card` (shadow) | 2px blur | Standard cards |

### Common Class Combinations

```jsx
// Button
className="bg-primary text-surface px-lg py-sm rounded-md shadow-button hover:bg-primary-light"

// Card
className="bg-surface border border-outline rounded-lg p-lg shadow-card"

// Input
className="w-full px-lg py-sm border border-outline rounded-md text-body-md focus:border-primary"

// Badge
className="inline-block bg-accent text-white px-md py-sm rounded-xs text-label-sm"
```

## Extending the System

To add new tokens:

1. **Add to the appropriate file** in `lib/tokens/`
2. **Update `tailwind.config.js`** if creating new Tailwind classes
3. **Update CSS variables** in `app/globals.css` if creating new CSS variables
4. **Document in `USAGE_GUIDE.md`** with examples

### Example: Adding a Custom Spacing Value

```typescript
// lib/tokens/spacing.ts
export const spacing = {
  // ... existing values
  custom: '48px',
};

// tailwind.config.js
spacing: {
  // ... existing
  custom: spacing.custom,
}

// app/globals.css
:root {
  --space-custom: 48px;
}

// Usage everywhere
<div className="p-custom">...</div>
```

## Best Practices

1. **Prefer Tailwind classes** - Fastest, most maintainable approach
2. **Use semantic tokens** - `bg-error` instead of `bg-red-600`
3. **Follow consistent spacing** - Use token multiples (don't mix `p-md` with custom padding)
4. **Maintain hierarchy** - Use `h1-h6` consistently for text levels
5. **Respect shadows** - Use built-in shadow presets for consistent elevation

## File Dependencies

```
index.ts
├── colors.ts
├── spacing.ts
├── typography.ts
├── radius.ts
└── shadows.ts

tailwind.config.js
└── (imports all lib/tokens files)

app/globals.css
├── (exports CSS custom properties)
└── (uses typography and spacing tokens)
```

## Resources

- **Full Usage Guide**: See [USAGE_GUIDE.md](./USAGE_GUIDE.md)
- **Design System Specification**: See project root `DESIGN_SYSTEM.md`
- **Tailwind Config**: `../../tailwind.config.js`
- **Global Styles**: `../../app/globals.css`

## Contributing

When making changes to tokens:

1. Update the token file (e.g., `colors.ts`)
2. Update `tailwind.config.js` if needed
3. Update CSS variables in `globals.css` if needed
4. Test across light and dark modes
5. Update documentation in `USAGE_GUIDE.md`

---

**Last Updated**: April 2026
**Design System Version**: 1.0
**Based on**: Flutter app Material Design 3 implementation
