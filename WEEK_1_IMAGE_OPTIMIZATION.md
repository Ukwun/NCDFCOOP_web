# Phase 5 Implementation: 4-Week Execution Plan

**Start Date:** April 5, 2026
**Status:** 🚀 **STARTING NOW**
**Timeline:** 4 weeks (1 week per optimization pillar)
**Expected ROI:** 60% faster + $250+/year savings

---

## 📅 Weekly Breakdown

### ⏰ Week 1: Image Optimization (Apr 5-11)
**Goal:** Replace product images with Next.js Image, target 30% LCP improvement
**Effort:** 2-3 days (~10 hours)
**Status:** 🚀 **THIS WEEK - ACTION ITEMS BELOW**

#### Tasks:
- [ ] **Day 1:** Update HomeScreen to use optimized images
- [ ] **Day 2:** Update CartScreen & OfferScreen product images
- [ ] **Day 3:** Verify WebP format, test on mobile
- [ ] Measure: Run Lighthouse, record LCP baseline
- [ ] Deploy to staging, test on real devices

**Expected Result:** Images 70% smaller, LCP improved 30%+

---

### ⏰ Week 2: Code Splitting (Apr 12-18)
**Goal:** Split JS bundles by route, lazy-load heavy components
**Effort:** 2-3 days (~10 hours)
**Status:** 📅 Scheduled

#### Tasks:
- [ ] Implement route-based code splitting (6 routes)
- [ ] Lazy-load modals, dialogs, heavy components
- [ ] Test navigation performance
- [ ] Verify JS bundle reduced to <200KB
- [ ] Measure FCP improvement (target 40%+)

**Expected Result:** JS bundle 40% smaller, FCP improved 40%+

---

### ⏰ Week 3: Caching Layer (Apr 19-25)
**Goal:** Implement HTTP caching + browser cache + API response caching
**Effort:** 2-3 days (~10 hours)
**Status:** 📅 Scheduled

#### Tasks:
- [ ] Browser cache for user preferences
- [ ] API response caching (LRU cache)
- [ ] Verify cache hit rate >60%
- [ ] Add Service Worker for offline
- [ ] Test repeat page loads (<1s)

**Expected Result:** API calls reduced 50-70%, repeat loads 83% faster

---

### ⏰ Week 4: Database Optimization (Apr 26-May 2)
**Goal:** Create Firestore indexes, implement pagination, use aggregation
**Effort:** 3-5 days (~15 hours)
**Status:** 📅 Scheduled

#### Tasks:
- [ ] Create 12 Firestore compound indexes in Firebase Console
- [ ] Implement cursor-based pagination
- [ ] Add aggregation queries (count, sum, avg)
- [ ] Fix N+1 query patterns
- [ ] Monitor Firestore costs (target 70% reduction)

**Expected Result:** Database reads reduced 70%, monthly cost $30→$9

---

## 🎯 Week 1 Action Plan: Image Optimization

**This Week's Goal:** Get first performance win implemented and measured

### Step 1: Update next.config.js (ALREADY DONE ✅)
Your next.config.js already has:
- ✅ Image format optimization (AVIF, WebP)
- ✅ Device-aware sizes
- ✅ Cache headers (30-day minimum)
- ✅ Production optimizations

**No action needed** - already configured!

---

### Step 2: Update HomeScreen with Optimized Images (TODAY)

**File:** [components/HomeScreen.tsx](components/HomeScreen.tsx)

**Current State:** Need to check what image implementations exist

**Change Required:** Replace any `<img>` tags with optimized Next.js Image component

**Example:**
```typescript
// BEFORE:
<img src={product.image} alt={product.name} />

// AFTER:
import Image from 'next/image';
import { getOptimizedImageProps } from '@/lib/optimization/imageOptimization';

<Image {...getOptimizedImageProps(product.image, 'product', product.name)} />
```

---

### Step 3: Update CartScreen (Day 1-2)

**File:** [components/CartScreen.tsx](components/CartScreen.tsx)

Apply same optimization to cart item images.

---

### Step 4: Update OfferScreen (Day 2)

**File:** [components/OfferScreen.tsx](components/OfferScreen.tsx)

Optimize promotional images with 'offer' type configuration.

---

### Step 5: Test & Measure (Day 3)

```bash
# Start dev server
npm run dev

# In another terminal, open DevTools → Network tab
# Look for WebP images being served
# Check image sizes (should show KB not MB)

# Build and measure with Lighthouse
npm run build
npm start

# Open DevTools → Lighthouse
# Run Performance audit on Homepage
# Record LCP baseline (should be ~5s before optimization)
```

**Success Criteria:**
- ✅ Images served in WebP format
- ✅ Image sizes 70% smaller
- ✅ LCP improved from ~5s to ~3.5s (30%+)
- ✅ No layout shifts

---

### Step 6: Deploy to Staging

```bash
# Commit changes
git add components/
git commit -m "Week 1: Image optimization - WebP/AVIF formats, responsive sizing"

# Deploy (your deployment process)
firebase deploy
# or
vercel deploy
# or
netlify deploy
```

---

## 🔧 Code Changes Needed This Week

### HomeScreen.tsx

Find all product image renders and update them.

**Template:**
```typescript
// At top of file, add imports
import Image from 'next/image';
import { getOptimizedImageProps } from '@/lib/optimization/imageOptimization';

// In product rendering, replace:
<img src={product.image} alt={product.name} />

// With:
<Image {...getOptimizedImageProps(product.image, 'product', product.name)} />
```

### CartScreen.tsx

Same pattern for cart items.

### OfferScreen.tsx

Use `'offer'` type for promotional images:
```typescript
<Image {...getOptimizedImageProps(offer.image, 'offer', offer.title)} />
```

---

## 📊 Week 1 Success Metrics

| Metric | Baseline | Target | Success |
|--------|----------|--------|---------|
| **LCP** | ~5.0s | ~3.5s | >30% improvement |
| **Avg Image Size** | 500KB | 150KB | 70% reduction |
| **Format Support** | JPEG only | WebP/AVIF | Modern formats |
| **Lighthouse Score** | TBD | +15 points | Measurable improvement |

---

## 💡 Pro Tips for Week 1

1. **Test on Mobile:** Use DevTools to throttle to 3G - you'll see biggest impact
2. **Check Safari:** Use fallback JPEG in srcSet for older browsers
3. **Monitor Cumulative Layout Shift (CLS):** Ensure images don't cause jumps
4. **Use Next.js Image:** It handles all the heavy lifting
5. **Measure Everything:** Lighthouse before/after for validation

---

## 🚧 Troubleshooting

### Images Not Loading
```typescript
// Add explicit height if not in layout
<Image 
  {...getOptimizedImageProps(url, type, alt)}
  height={600}  // Add this
/>
```

### WebP Not Working in Safari
```typescript
// Next.js handles fallback automatically
// But ensure quality is sufficient (85% default)
```

### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build

# Type check
npm run type-check
```

---

## ✅ Week 1 Checklist

- [ ] All product image components updated
- [ ] No broken image links
- [ ] Lighthouse score improved 15+
- [ ] LCP improved 30%+
- [ ] Images serve in WebP format
- [ ] Mobile network test passed
- [ ] Changes committed and ready to deploy

---

## 🎯 Week 2 Preview

Once Week 1 is complete, you'll move to:
- **Route-based code splitting** (split home/products/cart/offers bundles)
- **Component lazy loading** (modals only load when needed)
- **Library on-demand loading** (heavy libs load when used)

Expected: 30% JS reduction, 40% FCP improvement

**Guide:** [PHASE_5_PERFORMANCE_GUIDE.md](PHASE_5_PERFORMANCE_GUIDE.md#2️⃣-code-splitting)

---

## 📞 Need Help?

**For image optimization reference:**
→ [lib/optimization/imageOptimization.ts](lib/optimization/imageOptimization.ts)

**For detailed guide:**
→ [PHASE_5_PERFORMANCE_GUIDE.md](PHASE_5_PERFORMANCE_GUIDE.md#1️⃣-image-optimization)

**For complete overview:**
→ [PHASE_5_COMPLETE_OVERVIEW.md](PHASE_5_COMPLETE_OVERVIEW.md)

---

**Ready to start? Begin with Step 2 today!** 🚀
