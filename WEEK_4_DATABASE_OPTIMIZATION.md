# Week 4: Database Optimization Implementation Plan

**Week Dates:** Apr 26-May 2, 2026
**Status:** 📅 Scheduled (after Week 3)
**Goal:** Optimize Firestore queries and reduce costs by 70%
**Expected Impact:** Database reads 150K/day (from 500K), monthly cost $30→$9

---

## 🎯 Week 4 Overview

Database optimization focuses on **asking for less data in smarter ways**:

1. **Create Firestore Indexes** (enable efficient multi-field queries)
2. **Implement Pagination** (don't load all 10,000 items at once)
3. **Use Aggregation** (count items without fetching them)
4. **Fix N+1 Queries** (fetch related data efficiently)
5. **Monitor Costs** (track usage and savings)

---

## 📋 Week 4 Tasks

### Day 1: Create Firestore Compound Indexes

#### Task 1.1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project `coop-commerce`
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index** for each one below

#### Task 1.2: Create Required Indexes

**Index 1: Products - Category + Status + CreatedAt**
```
Collection: products
Fields:
  - category (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query Fields: matches products by category, status, and sort by recent
```

**Index 2: Products - Category + Price + Rating**
```
Collection: products
Fields:
  - category (Ascending)
  - price (Ascending)
  - averageRating (Descending)
Query Fields: matches products by category, price range, sorted by rating
```

**Index 3: Products - Search Terms**
```
Collection: products
Fields:
  - searchTerms (Array Contains)
  - status (Ascending)
  - createdAt (Descending)
Query Fields: full-text search approximation
```

**Index 4: Orders - User + Status + CreatedAt**
```
Collection: orders
Fields:
  - userId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query Fields: get user's orders filtered by status
```

**Index 5: Orders - Status + CreatedAt**
```
Collection: orders
Fields:
  - status (Ascending)
  - createdAt (Descending)
Query Fields: get all orders by status
```

**Index 6: Orders - Seller + Status + CreatedAt**
```
Collection: orders
Fields:
  - sellerId (Ascending)
  - status (Ascending)
  - createdAt (Descending)
Query Fields: seller dashboard - filter own orders
```

**Index 7: Messages - Conversation + CreatedAt**
```
Collection: messages
Fields:
  - conversationId (Ascending)
  - createdAt (Descending)
Query Fields: load conversation messages in order
```

**Index 8: Messages - Participant + Unread + CreatedAt**
```
Collection: messages
Fields:
  - participantId (Ascending)
  - unread (Ascending)
  - createdAt (Descending)
Query Fields: find unread messages for user
```

**Index 9: Members - Status + CreatedAt**
```
Collection: members
Fields:
  - status (Ascending)
  - createdAt (Descending)
Query Fields: list active members, newest first
```

**Index 10: Members - Tier + Status**
```
Collection: members
Fields:
  - membershipTier (Ascending)
  - status (Ascending)
Query Fields: segment members by tier
```

**Index 11: Offers - Status + ExpiresAt**
```
Collection: offers
Fields:
  - status (Ascending)
  - expiresAt (Descending)
Query Fields: get active offers, expiring soon
```

**Index 12: Offers - Category + ExpiresAt + Discount**
```
Collection: offers
Fields:
  - category (Ascending)
  - expiresAt (Descending)
  - discountPercentage (Descending)
Query Fields: offers by category, sorted by best discount
```

**Note:** Firebase will take a few minutes to build each index. You'll see a spinning icon until ready.

---

### Day 2: Implement Cursor-Based Pagination

#### Task 2.1: Update Product Listing Service

**File:** [lib/services/productService.ts](lib/services/productService.ts)

```typescript
import { 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaginationHelper } from '@/lib/optimization/databaseOptimization';

const paginationHelper = new PaginationHelper(20); // 20 items per page

export interface PaginatedProducts {
  products: any[];
  cursor: any;
  hasMore: boolean;
}

export async function getPaginatedProducts(
  filters: { category?: string; status?: string } = {},
  cursor?: any
): Promise<PaginatedProducts> {
  const constraints: QueryConstraint[] = [];

  // Add filters
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }

  // Add sorting
  constraints.push(orderBy('createdAt', 'desc'));

  // Add pagination
  constraints.push(limit(21)); // Request 21 to know if there are more

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  // Execute query
  const q = query(collection(db, 'products'), ...constraints);
  const snapshot = await getDocs(q);
  const docs = snapshot.docs;

  // Check if there are more results
  const hasMore = docs.length > 20;
  const products = docs.slice(0, 20).map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Last product becomes cursor for next page
  const lastCursor = docs[19]; // 20th item (0-indexed)

  return {
    products,
    cursor: lastCursor,
    hasMore
  };
}
```

#### Task 2.2: Update HomeScreen Pagination

**File:** [components/HomeScreen.tsx](components/HomeScreen.tsx)

```typescript
import { getPaginatedProducts } from '@/lib/services/productService';

export function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load first page
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    const result = await getPaginatedProducts({
      category: currentCategory,
      status: 'active'
    });
    setProducts(result.products);
    setCursor(result.cursor);
    setHasMore(result.hasMore);
    setIsLoading(false);
  };

  const loadMore = async () => {
    setIsLoading(true);
    const result = await getPaginatedProducts(
      { category: currentCategory, status: 'active' },
      cursor // Pass cursor for next page
    );
    setProducts([...products, ...result.products]);
    setCursor(result.cursor);
    setHasMore(result.hasMore);
    setIsLoading(false);
  };

  return (
    <>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </>
  );
}
```

---

### Day 3: Use Aggregation Queries

#### Task 3.1: Replace Count Queries

**BEFORE (inefficient):**
```typescript
// This fetches ALL 10,000 orders just to count them!
const allOrders = await getDocs(
  query(collection(db, 'orders'))
);
const count = allOrders.size; // ❌ Costs 10,000 reads!
```

**AFTER (efficient):**
```typescript
import { AggregationHelper } from '@/lib/optimization/databaseOptimization';

const count = await AggregationHelper.count(
  db, 
  'orders',
  [where('status', '==', 'completed')]
); // ✅ Costs 1 read!
```

#### Task 3.2: Implement Stats Aggregation

**File:** [lib/services/analyticsService.ts](lib/services/analyticsService.ts)

```typescript
import { AggregationHelper } from '@/lib/optimization/databaseOptimization';

export async function getOrderStats(userId: string) {
  const userOrders = [where('userId', '==', userId)];

  return {
    totalOrders: await AggregationHelper.count(db, 'orders', userOrders),
    completedOrders: await AggregationHelper.count(
      db,
      'orders',
      [...userOrders, where('status', '==', 'completed')]
    ),
    totalSpent: await AggregationHelper.sum(
      db,
      'orders',
      'totalAmount',
      userOrders
    ),
  };
}
```

---

### Day 4: Fix N+1 Query Patterns

#### Task 4.1: Identify N+1 Patterns

Search for patterns like:

```typescript
// ❌ N+1 Query Problem
const users = await getDocs(collection(db, 'users'));
for (const user of users.docs) {
  const orders = await getDocs(
    query(collection(db, 'orders'), where('userId', '==', user.id))
  ); // Called N times! (1+N reads)
}
```

#### Task 4.2: Fix with Efficient Patterns

**Solution 1: Single query if possible**
```typescript
// ✅ Single query
const orders = await getDocs(
  query(collection(db, 'orders'), where('status', '==', 'pending'))
); // 1 read for potentially 1000 orders
```

**Solution 2: Denormalization**
```typescript
// Store user name in order document
// No need to fetch user separately
const order = {
  id: 'order1',
  userId: 'user1',
  userName: 'John Doe', // Denormalized - no separate fetch needed
  items: [...],
};
```

**Solution 3: Batch read if needed**
```typescript
import { BatchOperations } from '@/lib/optimization/databaseOptimization';

const userIds = ['user1', 'user2', 'user3'];

// Batch read orders for multiple users (1 query per 10 users)
const allOrders = await BatchOperations.batchRead(
  async (ids) => getDocs(
    query(collection(db, 'orders'), where('userId', 'in', ids))
  ),
  userIds,
  10 // Batch size of 10
);
```

---

### Day 5: Monitor Costs & Verify Improvements

#### Task 5.1: Check Firestore Dashboard

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select `coop-commerce` project
3. Navigate to **Firestore Database** → **Usage** tab
4. Look for:
   - **Read operations per day** (should decrease 70%)
   - **Write operations per day** (should stay same)
   - **Estimated monthly cost** (should drop 70%)

#### Task 5.2: Monitor Query Performance

```typescript
import { QueryPerformanceMonitor } from '@/lib/optimization/databaseOptimization';

const monitor = new QueryPerformanceMonitor();

// Track query performance
const start = performance.now();
const results = await getProducts();
const duration = performance.now() - start;

monitor.trackQuery('getProducts', duration, results.length);

// Get performance report
console.log(monitor.getReport());
// Shows: avg duration, total docs read, slowest/fastest queries
```

#### Task 5.3: Calculate Cost Savings

```typescript
import { FirestoreCostCalculator } from '@/lib/optimization/databaseOptimization';

// Before optimization
const costBefore = FirestoreCostCalculator.calculateCost({
  reads: 500000,  // 500K reads/day
  writes: 5000,
  deletes: 500
});
// → $30/month

// After optimization
const costAfter = FirestoreCostCalculator.calculateCost({
  reads: 150000,  // 150K reads/day
  writes: 5000,
  deletes: 500
});
// → $9/month

// Calculate savings
const savings = FirestoreCostCalculator.estimateReduction(
  { reads: 500000, writes: 5000, deletes: 500 },
  { reads: 150000, writes: 5000, deletes: 500 }
);
// → monthlySavings: '$21.00', percentage: '70%', annualSavings: '$252.00'

console.log(`💰 Monthly savings: ${savings.monthlySavings}`);
console.log(`💰 Annual savings: ${savings.annualSavings}`);
```

#### Task 5.4: Performance Verification

```bash
# Run Lighthouse one final time
npm run build
npm start

# Check Dashboard
# - Page load time should be 1-2s (was 3-5s)
# - All Core Web Vitals should be "Good"
# - Cumulative Layout Shift (CLS) should be <0.1

# Firebase Console
# - Read operations should be <150K/day (was 500K)
# - Estimated cost should be ~$9/month (was $30)
```

---

## 📊 Week 4 Success Metrics

| Metric | Before | Target | Success |
|--------|--------|--------|---------|
| **Firestore Reads/day** | 500,000 | 150,000 | 70% reduction |
| **Monthly Cost** | $30 | $9 | 70% savings |
| **Query Time** | >1000ms | <500ms | 50% faster |
| **Pagination Load** | Load all | Load 20 | On-demand |
| **Index Coverage** | Score 0% | 100% | All queries indexed |

---

## 🔧 Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| [lib/services/productService.ts](lib/services/productService.ts) | UPDATED - Add pagination | Efficient product loading |
| [components/HomeScreen.tsx](components/HomeScreen.tsx) | UPDATED - Implement pagination | Users only fetch needed items |
| [lib/services/analyticsService.ts](lib/services/analyticsService.ts) | NEW - Use aggregation | Cost-efficient stats |
| Firebase Console | 12 new indexes | Efficient multi-field queries |

---

## ✅ Week 4 Checklist

- [ ] All 12 Firestore indexes created (check Firebase Console)
- [ ] Pagination implemented for products
- [ ] Pagination implemented for orders
- [ ] Aggregation queries used for counts
- [ ] N+1 query patterns identified and fixed
- [ ] Query performance monitored
- [ ] Cost calculator configured
- [ ] Daily reads <150K (70% reduction)
- [ ] Monthly cost ~$9 (70% savings)
- [ ] All tests passing
- [ ] Performance verified with Lighthouse
- [ ] Changes committed

---

## 🎯 Summary: 4-Week Implementation Complete!

After Week 4, you will have:

✅ **Image Optimization** (30% LCP improvement)
✅ **Code Splitting** (40% FCP improvement)
✅ **Caching Layer** (83% faster repeats)
✅ **Database Optimization** (70% cost reduction)

**Total Performance Improvement:**
- 60-70% faster page loads
- 67% smaller bundle size
- 50-70% fewer API calls
- 70% lower database costs
- $252+/year in savings

---

## 📞 Reference

**Database Optimization Guide:**
→ [PHASE_5_PERFORMANCE_GUIDE.md#4-database-query-optimization](PHASE_5_PERFORMANCE_GUIDE.md)

**Module Functions:**
→ [lib/optimization/databaseOptimization.ts](lib/optimization/databaseOptimization.ts)

**Complete Overview:**
→ [PHASE_5_COMPLETE_OVERVIEW.md](PHASE_5_COMPLETE_OVERVIEW.md)

---

**Ready for Week 4? Start with Firebase Console on Apr 26!** 🚀

After Week 4: **Phase 5 Complete & Phase 6 Ready (Advanced Features)**
