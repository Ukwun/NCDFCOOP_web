# Week 3: Caching Layer Implementation Plan

**Week Dates:** Apr 19-25, 2026
**Status:** 📅 Scheduled (after Week 2)
**Goal:** Implement multi-layer caching strategy
**Expected Impact:** 50-70% API reduction, 83% faster repeat visits

---

## 🎯 Week 3 Overview

Implement **4 layers of caching** for maximum performance:

1. **HTTP Cache Headers** (Browser automatically caches assets)
2. **Browser Storage** (localStorage for user preferences)
3. **In-Memory Cache** (LRU cache for API responses)
4. **Query Result Cache** (Cache by search parameters)

---

## 📋 Week 3 Tasks

### Day 1: Browser Cache for User Preferences

#### Task 1.1: Cache User Settings

**File:** Create [lib/hooks/usePreferences.ts](lib/hooks/usePreferences.ts)

```typescript
import { BrowserCacheManager } from '@/lib/optimization/cachingStrategies';

const preferenceCache = new BrowserCacheManager('preferences');

export function usePreferences() {
  const [theme, setTheme] = useState(() => {
    // Load from cache on startup
    return preferenceCache.get('theme') || 'light';
  });

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    // Save to cache (24 hour TTL)
    preferenceCache.set('theme', newTheme, 86400);
  };

  return { theme, updateTheme };
}
```

#### Task 1.2: Cache View Preferences

```typescript
// Cache which products user viewed
preferenceCache.set('lastViewed', productId, 3600); // 1 hour

// Cache sorting preference
preferenceCache.set('productSort', 'price-asc', 604800); // 1 week

// Cache filter selections
preferenceCache.set('activeFilters', filters, 604800); // 1 week
```

---

### Day 2: API Response Caching with LRU Cache

#### Task 2.1: Create Cached API Service

**File:** Create [lib/services/cachedApiService.ts](lib/services/cachedApiService.ts)

```typescript
import { LRUCache } from '@/lib/optimization/cachingStrategies';

class CachedApiService {
  private responseCache = new LRUCache<any>(100); // Keep 100 most recent

  async getProducts(filters?: any) {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = this.responseCache.get(cacheKey);
    if (cached) {
      console.log('📦 Using cached products');
      return cached;
    }

    // Fetch if not cached
    const response = await fetch('/api/products', { 
      body: JSON.stringify(filters) 
    });
    const data = await response.json();

    // Cache for 5 minutes
    this.responseCache.set(cacheKey, data, 300);

    return data;
  }

  async getOrders(userId: string) {
    const cacheKey = `orders:${userId}`;
    
    const cached = this.responseCache.get(cacheKey);
    if (cached) return cached;

    const response = await fetch(`/api/orders/${userId}`);
    const data = await response.json();

    this.responseCache.set(cacheKey, data, 300);
    return data;
  }

  // Clear cache on mutations
  invalidateCache(pattern: string) {
    // Clear specific cache entries
    // Example: invalidateCache('products:') clears all product caches
  }
}

export const apiService = new CachedApiService();
```

#### Task 2.2: Use Cached API Service

Replace API calls throughout components:

```typescript
// BEFORE:
const response = await fetch('/api/products');

// AFTER:
import { apiService } from '@/lib/services/cachedApiService';
const products = await apiService.getProducts();
```

---

### Day 3: Service Worker for Offline Support

#### Task 3.1: Register Service Worker

**File:** [public/sw.js](public/sw.js)

```javascript
const CACHE_NAME = 'coop-commerce-v1';
const URLS_TO_CACHE = [
  '/',
  '/products',
  '/cart',
  '/api/products',
  '/api/orders',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache if offline
        return caches.match(event.request);
      })
  );
});
```

#### Task 3.2: Register in Layout

**File:** [app/layout.tsx](app/layout.tsx)

```typescript
export default function RootLayout() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registered'))
        .catch(err => console.error('Service Worker failed', err));
    }
  }, []);

  return (
    // ... rest of layout
  );
}
```

---

### Day 4: Query Result Caching

#### Task 4.1: Cache Search Results

**File:** Update [components/HomeScreen.tsx](components/HomeScreen.tsx)

```typescript
import { QueryCache } from '@/lib/optimization/cachingStrategies';

const queryCache = new QueryCache();

export function HomeScreen() {
  const [products, setProducts] = useState([]);

  const searchProducts = async (filters: any) => {
    // Check if this exact query was already executed
    const cached = queryCache.get('products', filters);
    if (cached) {
      console.log('💾 Using cached query results');
      setProducts(cached);
      return;
    }

    // Fetch and cache
    const response = await fetch('/api/products', {
      body: JSON.stringify(filters)
    });
    const data = await response.json();

    // Cache this query result
    queryCache.set('products', filters, data);
    setProducts(data);
  };

  const updateFilters = (newFilters: any) => {
    searchProducts(newFilters);
  };

  const clearCache = () => {
    queryCache.invalidate('products');
  };

  return (
    // ... render
  );
}
```

---

### Day 5: Test & Verify Caching

#### Task 5.1: Test Browser Cache

```bash
# Open DevTools → Application → Cache Storage
# Should see 'coop-commerce-v1' with cached assets

# Open DevTools → Local Storage
# Should see user preferences saved
```

#### Task 5.2: Test API Response Cache

```bash
# Network tab → Filter JS
# Make API call (e.g., load products)
# Should show in Network tab: 200 OK with time

# Make same API call again
# Should use cached response (much faster, maybe 0ms)
# Check console for '📦 Using cached products' message
```

#### Task 5.3: Test Offline Mode

```bash
# DevTools → Network → set to "Offline"
# Navigate app (should still work from cache)
# Try fetching new data (should fail gracefully)
# Go back online (should resume normal operation)
```

#### Task 5.4: Measure Performance

```bash
# Test repeat page load time
# Before: ~3 seconds
# After: <500ms (should be instant)

# Run Lighthouse
# Verify cache hit rate >60%
```

---

## 📊 Week 3 Success Metrics

| Metric | Before | Target | Success |
|--------|--------|--------|---------|
| **API Calls** | 100% network | <50% network | 50+ reduction |
| **Repeat Load** | ~3s | <500ms | 85% faster |
| **Cache Hit Rate** | 0% | >60% | Most requests cached |
| **Offline Support** | None | Full | Works without network |
| **Preference Load** | Fresh | Instant | From localStorage |

---

## 🔧 Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| [lib/hooks/usePreferences.ts](lib/hooks/usePreferences.ts) | NEW - Browser cache hook | Instant preference loading |
| [lib/services/cachedApiService.ts](lib/services/cachedApiService.ts) | NEW - Cached API service | 50-70% API reduction |
| [public/sw.js](public/sw.js) | NEW - Service Worker | Offline support |
| [app/layout.tsx](app/layout.tsx) | UPDATED - Register SW | Service Worker active |
| [components/HomeScreen.tsx](components/HomeScreen.tsx) | UPDATED - Query caching | Instant search results |

---

## ✅ Week 3 Checklist

- [ ] User preferences cached (localStorage)
- [ ] API responses cached (LRU cache)
- [ ] Service Worker registered
- [ ] Offline mode tested
- [ ] Cache invalidation implemented
- [ ] Cache hit rate >60%
- [ ] Repeat page load <500ms
- [ ] Lighthouse score improved
- [ ] All features still working
- [ ] Changes committed

---

## 💡 Cache Invalidation Strategy

When data changes, clear relevant caches:

```typescript
// When user updates profile
onProfileUpdate(() => {
  preferenceCache.remove('userProfile');
  apiService.invalidateCache('user:');
});

// When product is added to cart
onAddToCart(() => {
  apiService.invalidateCache('cart:');
  queryCache.invalidate('products'); // User expectations change
});

// When filters change
onFilterChange(() => {
  queryCache.invalidate('products'); // Old results invalid
});
```

---

## 🎯 Week 4 Preview

Once Week 3 is complete, implement:
- **Create 12 Firestore indexes**
- **Implement cursor-based pagination**
- **Use aggregation queries** (count, sum)
- **Monitor cost reduction** (target 70%)

Expected: Database reads reduced 70%, monthly cost $30→$9

---

## 📞 Reference

**Caching Guide:**
→ [PHASE_5_PERFORMANCE_GUIDE.md#3-caching-strategies](PHASE_5_PERFORMANCE_GUIDE.md)

**Module Functions:**
→ [lib/optimization/cachingStrategies.ts](lib/optimization/cachingStrategies.ts)

**Complete Overview:**
→ [PHASE_5_COMPLETE_OVERVIEW.md](PHASE_5_COMPLETE_OVERVIEW.md)

---

**Ready for Week 3? Start with Day 1 on Apr 19!** 💾
