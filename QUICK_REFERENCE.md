# Quick Reference: Onboarding Workflow

## 🎯 Key Files

### Design System
- **Colors**: `lib/theme/colors.ts`
- **Spacing**: `lib/theme/spacing.ts`
- **Typography**: `lib/theme/typography.ts`
- **Animations**: `lib/theme/animations.ts`
- **Export all**: `lib/theme/index.ts`

### Screens (All in `components/`)
- `SplashScreen.tsx`
- `WelcomeScreen.tsx`
- `SignInScreen.tsx`
- `SignupScreen.tsx`
- `OnboardingScreen1.tsx`
- `OnboardingScreen2.tsx`
- `OnboardingScreen3.tsx`
- `RoleSelectionScreen.tsx`

### Routes (All in `app/`)
- `/splash` → `splash/page.tsx`
- `/welcome` → `welcome/page.tsx`
- `/signin` → `signin/page.tsx`
- `/signup` → `signup/page.tsx`
- `/onboarding` → `onboarding/page.tsx`
- `/onboarding2` → `onboarding2/page.tsx`
- `/onboarding3` → `onboarding3/page.tsx`
- `/role-selection` → `role-selection/page.tsx`

### Global Styles
- `app/globals.css` - CSS variables, animations, utilities

---

## 🎨 Color Constants

```typescript
import { AppColors } from '@/lib/theme';

AppColors.primary              // #4F46E5
AppColors.secondary            // #10B981
AppColors.accent              // #F3951A
AppColors.error               // #EF4444
AppColors.success             // #22C55E
AppColors.textPrimary         // #1F2937
AppColors.splashBackground    // #12202F
AppColors.roles.member        // #8B6F47
AppColors.roles.wholesaleBuyer // #2E5090
AppColors.roles.seller        // #1A472A
```

---

## 📏 Spacing Constants

```typescript
import { AppSpacing } from '@/lib/theme';

AppSpacing.xs    // 4px
AppSpacing.sm    // 8px
AppSpacing.md    // 12px
AppSpacing.lg    // 16px
AppSpacing.xl    // 20px
AppSpacing.xxl   // 24px
AppSpacing.xxxl  // 32px
AppSpacing.huge  // 40px
```

---

## 🔤 Typography

```typescript
import { AppTextStyles } from '@/lib/theme';

// Headings
AppTextStyles.h1    // 32px, bold
AppTextStyles.h2    // 28px, bold
AppTextStyles.h3    // 24px, bold
AppTextStyles.h4    // 20px, bold

// Body
AppTextStyles.bodyLarge   // 16px
AppTextStyles.bodyMedium  // 14px
AppTextStyles.bodySmall   // 12px

// Labels
AppTextStyles.labelLarge   // 14px, 600
AppTextStyles.labelMedium  // 12px, 600
AppTextStyles.labelSmall   // 11px, 600
```

---

## 🏗️ Component Template

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppColors, AppSpacing, AppTextStyles } from '@/lib/theme';

export default function MyScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div style={{ backgroundColor: AppColors.background, padding: AppSpacing.lg }}>
      <div style={{ ...AppTextStyles.h1, color: AppColors.textPrimary }}>
        Heading
      </div>
      <div style={{ ...AppTextStyles.bodyMedium, color: AppColors.textSecondary }}>
        Content
      </div>
    </div>
  );
}
```

---

## 🔐 Auth Hook Usage

```typescript
import { useAuth } from '@/lib/auth/authContext';

export default function MyComponent() {
  const {
    user,                    // Current user or null
    loading,                 // Boolean, auth loading
    error,                   // Error string or null
    onboardingCompleted,     // Boolean
    roleSelectionComplete,   // Boolean
    currentRole,            // Selected role or null
    
    // Methods
    login,                  // (email, password) => Promise
    signup,                 // (email, password, type?, name?) => Promise
    logout,                 // () => Promise
    selectRole,             // (role) => Promise
    completeOnboarding,     // () => Promise
    switchRole,             // (role) => Promise
  } = useAuth();

  // Usage
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return <div>User: {user.email}</div>;
}
```

---

## 🎬 Animation Usage

### In JSX
```tsx
<div className="animate-fade-in">
  Fades in over 300ms
</div>

<div className="animate-slide-up animation-delay-200">
  Slides up with 200ms delay
</div>
```

### In CSS-in-JS
```typescript
import { AnimationTiming } from '@/lib/theme';

<style>{`
  .my-div {
    animation: fadeIn ${AnimationTiming.pageFade}ms ease-in forwards;
  }
`}</style>
```

### Available Animations
- `fadeIn` - Fade in (300ms)
- `slideUp` - Slide up from bottom (400ms)
- `slideDown` - Slide down from top (400ms)
- `slideLeft` - Slide left from right (400ms)
- `slideRight` - Slide right from left (400ms)
- `fadeInScale` - Fade + scale (300ms)
- `bounce` - Bounce effect (600ms infinite)
- `pulse` - Pulse effect (2000ms infinite)
- `spin` - Rotation (1000ms infinite)

---

## 🔄 Navigation Examples

### From Welcome to Signup
```typescript
router.push(`/signup?type=${membershipType}`);
```

### From Signup to Role Selection
```typescript
router.push('/role-selection');
```

### From Role Selection to Home
```typescript
router.push('/home');
```

### Check Auth Status and Redirect
```typescript
if (!user) {
  router.push('/welcome');
} else if (!onboardingCompleted) {
  router.push('/onboarding');
} else if (!roleSelectionComplete) {
  router.push('/role-selection');
} else {
  router.push('/home');
}
```

---

## 🧪 Form Validation

```typescript
// Email validation
const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password validation
const isValidPassword = password.length >= 8;

// Match password
const passwordsMatch = password === confirmPassword;

// Show errors
{error && (
  <div
    style={{
      padding: AppSpacing.md,
      backgroundColor: `${AppColors.error}20`,
      border: `1px solid ${AppColors.error}`,
      borderRadius: '8px',
      color: AppColors.error,
    }}
  >
    {error}
  </div>
)}
```

---

## 🎨 Glass Morphism Pattern

```typescript
<div
  className="glass-effect"
  style={{
    background: 'rgba(250, 250, 250, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '25px',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)',
    padding: AppSpacing.xxxl,
  }}
>
  Content
</div>
```

---

## 📱 Responsive Design

```typescript
// Mobile-first with media queries
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: AppSpacing.xl,
  }}
>
  {/* Auto-responsive grid */}
</div>
```

---

## ✨ Common Patterns

### Loading Button
```tsx
<button
  disabled={isLoading}
  style={{
    opacity: isLoading ? 0.7 : 1,
    cursor: isLoading ? 'not-allowed' : 'pointer',
  }}
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

### Error Message Display
```tsx
{error && (
  <div
    style={{
      padding: AppSpacing.md,
      backgroundColor: `${AppColors.error}20`,
      border: `1px solid ${AppColors.error}`,
      borderRadius: '8px',
      color: AppColors.error,
      marginBottom: AppSpacing.lg,
    }}
  >
    {error}
  </div>
)}
```

### Input Field
```tsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  style={{
    width: '100%',
    padding: `${AppSpacing.md} ${AppSpacing.lg}`,
    border: `1px solid ${AppColors.border}`,
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
  }}
/>
```

### Hover Effects
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = AppColors.primaryLight;
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = AppColors.primary;
}}
```

---

## 🐛 Debugging

### Check Auth State
```typescript
const { user, loading, onboardingCompleted, roleSelectionComplete } = useAuth();
console.log('Auth State:', { user, loading, onboardingCompleted, roleSelectionComplete });
```

### Check Theme Values
```typescript
import { AppColors, AppSpacing } from '@/lib/theme';
console.log('Colors:', AppColors);
console.log('Spacing:', AppSpacing);
```

### Browser DevTools
- Check CSS animations: Elements → Animations panel
- Check computed styles: Elements → Styles panel
- Check console for useAuth errors

---

## 📚 Further Reading

- Full docs: `ONBOARDING_IMPLEMENTATION.md`
- Design system: `lib/theme/`
- Auth context: `lib/auth/authContext.tsx`
- Global styles: `app/globals.css`
