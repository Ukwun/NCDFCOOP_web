# Design Token System - Usage Guide

## Overview

The Coop Commerce Design Token System provides a centralized, structured approach to styling the web application. All design values (colors, spacing, typography, etc.) are defined once and reused consistently throughout the codebase.

---

## Quick Start

### 1. Using Tailwind Classes (Recommended)

All design tokens are integrated into Tailwind CSS:

```jsx
// Color usage
<button className="bg-primary text-surface hover:bg-primary-light">
  Add to Cart
</button>

// Spacing
<div className="p-lg m-md">
  Padded content with margin
</div>

// Typography
<h1 className="text-h1 font-bold text-text">Page Title</h1>
<p className="text-body-md text-text-light">Secondary text</p>

// Border radius
<div className="rounded-lg">Card content</div>

// Shadows
<div className="shadow-card rounded-lg">Elevated card</div>
```

### 2. Using CSS Custom Properties

CSS variables are available globally via `globals.css`:

```css
/* In any CSS file */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-surface);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
```

### 3. Importing Tokens in TypeScript/JavaScript

For dynamic styling or component configuration:

```tsx
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/tokens';

// Usage in component configuration
const buttonStyles = {
  backgroundColor: colors.primary,
  color: colors.surface,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.md,
  boxShadow: shadows.card,
};

export function MyButton() {
  return <button style={buttonStyles}>Click me</button>;
}
```

---

## Token Categories

### 1. Colors

Access colors through Tailwind classes or `colors` object:

#### Primary Colors
```jsx
// Tailwind
<div className="bg-primary">Primary Indigo</div>
<div className="bg-primary-light">Primary Light</div>
<div className="bg-primary-dark">Primary Dark</div>
<div className="bg-primary-container">Primary Container</div>

// TypeScript
import { colors } from '@/lib/tokens';
colors.primary        // #4F46E5
colors.primaryLight   // #6366F1
colors.primaryDark    // #4338CA
```

#### Secondary Colors (Emerald Green)
```jsx
<div className="bg-secondary">Secondary Green</div>
<div className="bg-secondary-light">Secondary Light</div>
```

#### Semantic Colors
```jsx
// Error
<div className="text-error">Error message</div>

// Success
<div className="text-success">Success message</div>

// Warning
<div className="text-warning">Warning message</div>

// Info
<div className="text-info">Info message</div>
```

#### Status Colors
```jsx
// Order statuses
<span className="bg-pending">Pending</span>
<span className="bg-confirmed">Confirmed</span>
<span className="bg-shipped">Shipped</span>
<span className="bg-delivered">Delivered</span>
<span className="bg-cancelled">Cancelled</span>
```

#### Neutral Colors
```jsx
<div className="bg-bg">Background</div>
<div className="bg-surface">White surface</div>
<div className="text-text">Primary text</div>
<div className="text-text-light">Secondary text</div>
```

### 2. Spacing

All spacing follows a 4px base unit:

```jsx
// Tailwind classes
<div className="p-xs">4px padding</div>
<div className="p-sm">8px padding</div>
<div className="p-md">12px padding</div>
<div className="p-lg">16px padding</div>
<div className="p-xl">20px padding</div>
<div className="p-xxl">24px padding</div>
<div className="p-xxxl">32px padding</div>
<div className="p-huge">40px padding</div>

// Margin
<div className="m-lg">16px margin</div>

// Gap (for flex/grid)
<div className="flex gap-md">Items with 12px gap</div>

// CSS variables
<div style={{ padding: 'var(--space-lg)' }}>Content</div>
```

### 3. Typography

#### Font Sizes
```jsx
// Headings
<h1 className="text-h1">32px heading</h1>
<h2 className="text-h2">28px heading</h2>
<h3 className="text-h3">24px heading</h3>
<h4 className="text-h4">20px heading</h4>

// Body text
<p className="text-body-lg">16px body text</p>
<p className="text-body-md">14px body text</p>
<span className="text-body-sm">12px body text</span>

// Labels
<label className="text-label-lg">Button text</label>
<label className="text-label-md">Small label</label>
```

#### Font Weight
```jsx
<span className="font-normal">Normal weight (400)</span>
<span className="font-medium">Medium weight (500)</span>
<span className="font-bold">Bold weight (700)</span>
```

#### Line Height
```jsx
<p className="leading-tight">Tight line height (1.2)</p>
<p className="leading-normal">Normal line height (1.4)</p>
<p className="leading-relaxed">Relaxed line height (1.5)</p>
<p className="leading-loose">Loose line height (1.8)</p>
```

#### Letter Spacing
```jsx
<p className="tracking-tight">-0.5px</p>
<p className="tracking-normal">0px</p>
<p className="tracking-wide">0.15px</p>
<p className="tracking-wider">0.5px</p>
```

### 4. Border Radius

```jsx
// Tailwind classes
<div className="rounded-xs">4px radius (badges)</div>
<div className="rounded-sm">8px radius</div>
<div className="rounded-md">12px radius (buttons, inputs)</div>
<div className="rounded-lg">16px radius (cards)</div>
<div className="rounded-xl">20px radius</div>
<div className="rounded-full">Circular (avatars)</div>

// Presets via CSS variables
<div style={{ borderRadius: 'var(--radius-card)' }}>Card</div>
<div style={{ borderRadius: 'var(--radius-button)' }}>Button</div>
```

### 5. Shadows

```jsx
// Tailwind classes
<div className="shadow-sm">Card shadow</div>
<div className="shadow-md">Elevated card</div>
<div className="shadow-lg">Modal shadow</div>
<div className="shadow-xl">Floating element</div>

// Specific use cases
<button className="shadow-button">Button shadow</button>
<div className="shadow-dropdown">Dropdown shadow</div>

// CSS variables
<div style={{ boxShadow: 'var(--shadow-card)' }}>Card</div>
```

---

## Common Component Patterns

### Product Card

```jsx
import { colors, spacing, borderRadius, shadows } from '@/lib/tokens';

export function ProductCard({ product }) {
  return (
    <div className="rounded-lg bg-surface border border-outline shadow-card">
      {/* Image */}
      <div className="w-full h-64 bg-surface-variant rounded-lg mb-md">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
      </div>

      {/* Content */}
      <div className="p-lg">
        {/* Badge */}
        {product.isExclusive && (
          <span className="inline-block bg-accent text-white text-label-sm font-medium px-md py-sm rounded-xs mb-md">
            Exclusive
          </span>
        )}

        {/* Product Name */}
        <h3 className="text-h5 font-bold text-text mb-sm line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-lg">
          <p className="text-h4 font-bold text-primary">${product.memberPrice}</p>
          <p className="text-body-md text-text-light line-through">
            ${product.marketPrice}
          </p>
        </div>

        {/* Button */}
        <button className="w-full bg-primary text-surface font-medium py-sm rounded-md hover:bg-primary-light transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

### Button Component

```jsx
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) {
  const variants = {
    primary: 'bg-primary text-surface hover:bg-primary-light',
    secondary: 'bg-secondary text-surface hover:bg-secondary-light',
    outline: 'border border-primary text-primary hover:bg-primary-container',
    danger: 'bg-error text-surface hover:bg-error-dark',
  };

  const sizes = {
    sm: 'px-md py-sm text-label-md rounded-sm',
    md: 'px-lg py-sm text-label-lg rounded-md',
    lg: 'px-lg py-md text-body-md rounded-md',
  };

  return (
    <button
      className={`font-medium transition-colors ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="md">Add to Cart</Button>
<Button variant="outline" size="sm">View Details</Button>
```

### Input Field

```jsx
export function TextField({ label, error, ...props }) {
  return (
    <div className="mb-lg">
      {label && (
        <label className="block text-label-lg font-medium text-text mb-sm">
          {label}
        </label>
      )}
      <input
        className={`w-full px-lg py-sm border rounded-md text-body-md transition-colors
          ${error ? 'border-error focus:border-error' : 'border-outline focus:border-primary'}
          bg-surface text-text placeholder-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-10`}
        {...props}
      />
      {error && <p className="text-body-sm text-error mt-sm">{error}</p>}
    </div>
  );
}
```

### Card Component

```jsx
export function Card({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface border border-outline shadow-sm',
    elevated: 'bg-surface shadow-md',
    outlined: 'bg-surface border-2 border-primary',
  };

  return (
    <div className={`rounded-lg p-lg ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

// Usage
<Card>Default card</Card>
<Card variant="elevated">Elevated card</Card>
```

---

## Dark Mode Implementation

Dark mode is automatically applied using CSS variables:

```jsx
// In your layout/app wrapper
export default function RootLayout({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <html className={isDark ? 'dark' : ''}>
      <body>
        {children}
      </body>
    </html>
  );
}
```

Colors automatically adjust when `dark` class is applied:
- Background: `#FAFAFA` → `#121212`
- Surface: `#FFFFFF` → `#1E1E1E`
- Text: `#1F2937` → `#FFFFFF`

---

## Best Practices

### ✅ Do

1. **Use Tailwind classes first** - They're the fastest and most maintainable
   ```jsx
   <div className="bg-primary text-surface p-lg rounded-md shadow-card">
   ```

2. **Import tokens for dynamic values**
   ```tsx
   const styles = { color: colors.primary };
   ```

3. **Use semantic variable names** - `bg-error` instead of `bg-red-600`
   ```jsx
   <div className="bg-error">Error message</div>
   ```

4. **Nest spacing values consistently**
   ```jsx
   <div className="p-lg">
     <div className="mb-md">Item 1</div>
     <div className="mb-md">Item 2</div>
   </div>
   ```

5. **Use status colors for order states**
   ```jsx
   <span className={`bg-${order.status}`}>Order Status</span>
   ```

### ❌ Don't

1. **Don't use arbitrary colors** - Always use the design tokens
   ```jsx
   // ❌ Bad
   <div className="bg-[#ff0000]">
   
   // ✅ Good
   <div className="bg-error">
   ```

2. **Don't hardcode spacing values** - Use token classes
   ```jsx
   // ❌ Bad
   <div className="p-4">
   
   // ✅ Good
   <div className="p-md">
   ```

3. **Don't mix styling approaches** - Pick one per component
   ```jsx
   // ❌ Bad - mixing Tailwind and inline styles
   <div className="bg-primary" style={{ padding: '16px' }}>
   
   // ✅ Good
   <div className="bg-primary p-lg">
   ```

---

## Token File Locations

- **Colors**: `lib/tokens/colors.ts`
- **Spacing**: `lib/tokens/spacing.ts`
- **Typography**: `lib/tokens/typography.ts`
- **Border Radius**: `lib/tokens/radius.ts`
- **Shadows**: `lib/tokens/shadows.ts`
- **Main Export**: `lib/tokens/index.ts`
- **CSS Variables**: `app/globals.css`
- **Tailwind Config**: `tailwind.config.js`

---

## Extending the Design System

To add new tokens:

1. **Add to the appropriate token file** (`lib/tokens/*.ts`)
2. **Update Tailwind config** (`tailwind.config.js`) if adding new classes
3. **Update CSS variables** (`app/globals.css`) if adding new variables
4. **Document in this guide** with examples

Example - Adding a new spacing value:

```tsx
// In lib/tokens/spacing.ts
export const spacing = {
  // ... existing values
  custom: '48px',
};

// In tailwind.config.js - automatically picked up
spacing: {
  custom: spacing.custom,
}

// In globals.css
:root {
  --space-custom: 48px;
}

// Usage
<div className="p-custom">Content</div>
<div style={{ padding: 'var(--space-custom)' }}>Content</div>
```

---

## Migration Guide

### From Old Colors to New Design System

| Old | New | Tailwind Class |
|-----|-----|---|
| `#0066FF` (old blue) | `#4F46E5` (Indigo) | `bg-primary` |
| `#10B981` (green) | `#10B981` (same) | `bg-secondary` |
| `#EF4444` (red) | `#EF4444` (same) | `bg-error` |
| Hardcoded `16px` | Token `spacing.lg` | `p-lg` |
| Hardcoded `12px` | Token `spacing.md` | `p-md` |

---

## Support

For questions or suggestions about the design token system, refer to:
- Flutter app reference: `flutter-app/lib/theme/`
- Design specification: DESIGN_SYSTEM.md
- Figma design file (if available)
