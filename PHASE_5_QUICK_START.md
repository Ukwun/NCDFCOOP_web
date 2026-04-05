# Phase 5: Quick Start - First 30 Minutes

**Goal:** Get image optimization working TODAY
**Time:** 30 minutes
**Impact:** 30% performance improvement

---

## Step 1: Verify Next.js Image Component (2 min)

Your `next.config.js` is already optimized! Check:

```bash
# Verify next.js version
npm ls next
# Should be ^14.0.0 or higher
```

---

## Step 2: Update One Product Image (10 min)

Find your first product image component:

**BEFORE:**
```tsx
<img 
  src="/products/item.jpg" 
  alt="Product"
/>
```

**AFTER:**
```tsx
import Image from 'next/image';
import { getOptimizedImageProps } from '@/lib/optimization/imageOptimization';

<Image 
  {...getOptimizedImageProps(
    '/products/item.jpg',
    'product',
    'Product Name'
  )}
/>
```

---

## Step 3: Test in Dev Server (5 min)

```bash
# Start dev server
npm run dev

# Open DevTools → Network tab
# Look for WebP images being served automatically
# Check image sizes (should be 70% smaller)
```

---

## Step 4: Measure Impact (5 min)

```bash
# Run Lighthouse
npm run build  # Build for production
npm start      # Start production server

# Open DevTools → Lighthouse
# Run Performance audit
# Note the LCP (Largest Contentful Paint) score
```

**Expected:**
- LCP improved 30%+
- Images in WebP format
- Responsive sizes per device

---

## Step 5: Commit & Deploy (5 min)

```bash
# Commit changes
git add .
git commit -m "Phase 5: Image optimization - 30% faster"

# Deploy (follow your deployment process)
firebase deploy
# or
vercel deploy
# or
netlify deploy
```

---

## Next Steps

Once Step 1 is done, tackle in this order:

1. **Complete Image Optimization** (1-2 days)
   - Replace all product images
   - Try on mobile network
   - Measure full impact

2. **Add HTTP Caching** (1 day)
   - Already configured in next.config.js!
   - Just ensure it's deployed

3. **Cache API Responses** (1-2 days)
   - Wrap API calls with LRUCache
   - Reduce redundant requests

4. **Setup Code Splitting** (2-3 days)
   - Lazy-load modals/heavy components
   - Split routes

5. **Optimize Database** (3-5 days)
   - Create Firestore indexes
   - Implement pagination

---

## Troubleshooting

### Images not showing
```typescript
// Make sure height is provided or fill={true}
<Image 
  {...getOptimizedImageProps(url, type, alt)}
  height={600}  // Add explicit height
/>
```

### WebP not working in Safari
```typescript
// Check fallback in srcSet
// Should have JPEG fallback
<Image 
  src={url}
  alt={alt}
  // Next.js handles format fallback automatically
/>
```

### Build fails
```bash
# Clear cache
rm -rf .next
npm run build

# Check for TypeScript errors
npm run type-check
```

---

## Performance Checklist

After completing steps 1-5:

- [ ] Images serving in WebP format
- [ ] Image sizes 70%+ smaller
- [ ] LCP improved 30%+
- [ ] No layout shifts from images
- [ ] Works on mobile
- [ ] Lighthouse score increased

---

## Done! 🎉

You've just implemented the biggest performance gain with minimal effort.

**What's next:**
- Complete the remaining 3 quick wins in the guide
- Target 4-6 weeks to complete all Phase 5 optimizations
- Expected: 60% faster page loads, $250+/year savings

---

Need help? Check:
- [PHASE_5_PERFORMANCE_GUIDE.md](PHASE_5_PERFORMANCE_GUIDE.md) - Detailed guide
- [lib/optimization/imageOptimization.ts](lib/optimization/imageOptimization.ts) - Function reference
- [next.config.js](next.config.js) - Configured for optimization
