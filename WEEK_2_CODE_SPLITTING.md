# Week 2: Code Splitting Implementation Plan

**Week Dates:** Apr 12-18, 2026
**Status:** 📅 Scheduled (after Week 1)
**Goal:** Split JS bundles by route, reduce bundle 40%
**Expected Impact:** 30% JS reduction, 40% FCP improvement

---

## 🎯 Week 2 Overview

Code splitting focuses on **not loading code that's not needed right now**.

Instead of one big 300KB bundle, split into:
- **home.js** (120KB) - Loaded first
- **products.js** (60KB) - Loaded on navigation
- **cart.js** (50KB) - Loaded when needed
- **messages.js** (40KB) - Loaded on demand
- **offers.js** (40KB) - Loaded on demand
- **account.js** (30KB) - Loaded when needed

**Total Initial:** 120KB instead of 300KB! (**60% smaller**)

---

## 📋 Week 2 Tasks

### Day 1: Implement Route-Based Code Splitting

#### Task 1.1: Update Navigation Component

**File:** [components/Navigation.tsx](components/Navigation.tsx)

Replace direct imports with lazy loading:

```typescript
// BEFORE:
import HomeScreen from '@/components/HomeScreen';
import CartScreen from '@/components/CartScreen';

// AFTER:
import { getLazyRouteComponent } from '@/lib/optimization/codeSplitting';

const HomeScreen = getLazyRouteComponent('/');
const CartScreen = getLazyRouteComponent('/cart');
const OfferScreen = getLazyRouteComponent('/offers');
const MessageScreen = getLazyRouteComponent('/messages');
const MyNCDFCOOPScreen = getLazyRouteComponent('/account');
```

#### Task 1.2: Verify Route Rendering

Make sure each route component loads dynamically:

```typescript
{
  currentRoute === '/' && <HomeScreen />
}
// This component only loads when HomeScreen needs to render
```

---

### Day 2: Lazy-Load Heavy Components

#### Task 2.1: Lazy-Load Modals

**Files:** Find all modal/dialog components

```typescript
// BEFORE:
import ConfirmDialog from '@/components/ConfirmDialog';

// AFTER:
import { createLazyComponent } from '@/lib/optimization/codeSplitting';

const ConfirmDialog = createLazyComponent(
  () => import('@/components/ConfirmDialog'),
  { fallback: <LoadingSpinner /> }
);

// Usage: Only loads when shown
{showConfirm && <ConfirmDialog onConfirm={handleConfirm} />}
```

#### Task 2.2: Lazy-Load Heavy Computations

If you have any heavy image processing or calculations:

```typescript
// Move to Web Worker
const processImage = async (image) => {
  const result = await executeInWorker(
    '/workers/imageProcessor.js',
    { image }
  );
  return result;
};
```

---

### Day 3: Defer Third-Party Libraries

#### Task 3.1: Load Libraries On-Demand

Focus on the heaviest libraries:

```typescript
// BEFORE: Import at top level
import pdfLib from 'pdf-lib';

// AFTER: Load when user needs PDF export
const handleExportPDF = async () => {
  const { default: pdfLib } = await dynamicImportLibrary('pdfLib');
  // Now use pdfLib
};
```

#### Task 3.2: Preload Likely Next Routes

In Navigation component:

```typescript
import { preloadRoute } from '@/lib/optimization/codeSplitting';

// When user hovers over "Products" link:
onMouseEnter={() => preloadRoute('/products')}
```

---

### Day 4: Track Chunk Loading Performance

#### Task 4.1: Add Performance Monitoring

```typescript
import { trackChunkLoad } from '@/lib/optimization/codeSplitting';

// When loading dynamic component:
const start = performance.now();
const Component = await dynamicImportLibrary('recharts');
trackChunkLoad('recharts', performance.now() - start);
```

#### Task 4.2: Monitor Bundle Usage

Check which chunks are actually being used:

```bash
# Build and analyze
npm run build

# Check next/dist output for chunk sizes
# Look for improvements in initial chunk size
```

---

### Day 5: Test & Verify

#### Task 5.1: Verify Bundle Size Reduction

```bash
# Build for production
npm run build

# Check bundle analysis
# Should see:
# - Initial JS: <200KB (was 300KB)
# - Home route: ~120KB
# - Other routes: 40-60KB each
```

#### Task 5.2: Test Navigation Performance

- [ ] Click through all routes
- [ ] Verify smooth navigation (no janky transitions)
- [ ] Check DevTools Network tab for chunk loading
- [ ] Verify no duplicate code in chunks

#### Task 5.3: Lighthouse Test

```bash
npm start

# Run Lighthouse
# Verify FCP improved 40%+ (was ~3s, target ~1.8s)
```

---

## 🔧 Code Changes Required

### 1. Navigation.tsx - Route-Based Splitting

```typescript
import { getLazyRouteComponent } from '@/lib/optimization/codeSplitting';
import { Suspense } from 'react';

// Create lazy route components
const HomeScreen = getLazyRouteComponent('/');
const ProductsScreen = getLazyRouteComponent('/products');
const CartScreen = getLazyRouteComponent('/cart');
const OfferScreen = getLazyRouteComponent('/offers');
const MessageScreen = getLazyRouteComponent('/messages');
const MyNCDFCOOPScreen = getLazyRouteComponent('/account');

export default function Navigation({ currentRoute }) {
  return (
    <Suspense fallback={<LoadingPage />}>
      {currentRoute === '/' && <HomeScreen />}
      {currentRoute === '/products' && <ProductsScreen />}
      {currentRoute === '/cart' && <CartScreen />}
      {currentRoute === '/offers' && <OfferScreen />}
      {currentRoute === '/messages' && <MessageScreen />}
      {currentRoute === '/account' && <MyNCDFCOOPScreen />}
    </Suspense>
  );
}
```

### 2. Component-Level Lazy Loading Example

```typescript
import { createLazyComponent } from '@/lib/optimization/codeSplitting';

// Instead of importing directly
const PaymentForm = createLazyComponent(
  () => import('@/components/PaymentForm'),
  { fallback: <div>Loading payment options...</div> }
);

// Use in render
{showPayment && <PaymentForm onSubmit={handlePayment} />}
```

### 3. Library On-Demand Example

```typescript
import { dynamicImportLibrary, trackChunkLoad } from '@/lib/optimization/codeSplitting';

const handleGenerateReport = async () => {
  const start = performance.now();
  
  // Load PDF library only when needed
  const pdfLib = await dynamicImportLibrary('pdfLib');
  
  // Track load time
  trackChunkLoad('pdfLib', performance.now() - start);
  
  // Generate PDF
  // ...
};
```

---

## 📊 Week 2 Success Metrics

| Metric | Before | Target | Success |
|--------|--------|--------|---------|
| **JS Bundle** | 300KB | <200KB | 33%+ reduction |
| **Initial Chunk** | 300KB | 120KB | 60% reduction |
| **FCP** | ~3.0s | ~1.8s | 40% improvement |
| **Route Load** | 500ms | <100ms | Smooth navigation |
| **Chunk Load Time** | TBD | <500ms | Fast transitions |

---

## ✅ Week 2 Checklist

- [ ] Route-based code splitting implemented
- [ ] All routes load on demand
- [ ] Heavy components lazy-loaded
- [ ] Library loading deferred
- [ ] Chunk performance tracked
- [ ] JS bundle <200KB
- [ ] FCP improved 40%+
- [ ] Navigation smooth (no janky loading)
- [ ] All tests passing
- [ ] Changes committed

---

## 🎯 Week 3 Preview

Once Week 2 is complete, implement:
- **Browser cache** for user preferences (localStorage)
- **API response caching** (LRU cache for API calls)
- **Service Worker** for offline support
- **Query result caching** (cache by parameters)

Expected: API calls reduced 50-70%, repeat loads 83% faster

---

## 📞 Reference

**Code Splitting Guide:**
→ [PHASE_5_PERFORMANCE_GUIDE.md#2-code-splitting](PHASE_5_PERFORMANCE_GUIDE.md)

**Module Functions:**
→ [lib/optimization/codeSplitting.ts](lib/optimization/codeSplitting.ts)

**Complete Overview:**
→ [PHASE_5_COMPLETE_OVERVIEW.md](PHASE_5_COMPLETE_OVERVIEW.md)

---

**Ready for Week 2? Start with Navigation.tsx on Apr 12!** ⚡
