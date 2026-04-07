# INTELLIGENT USER TRACKING - IMPLEMENTATION GUIDE
## Complete Guide to Using Tracking, Analytics, and Recommendations

**Date:** April 7, 2026  
**Status:** Complete Implementation Ready  
**Features:** Full user tracking, analytics, recommendations, issue detection

---

## 📋 QUICK START

### Basic Usage in a Component

```tsx
'use client';

import { useIntelligentTracking } from '@/lib/hooks';
import { useEffect } from 'react';

export function ProductPage() {
  const { tracker } = useIntelligentTracking({
    trackPageView: true, // Auto-track page view on mount
    enableTracking: true,
    enableAnalytics: true,
    enableRecommendations: true,
  });

  // Track when user views a product
  const handleProductClick = async (product) => {
    await tracker.trackProductView(
      product.id,
      product.name,
      product.category,
      product.price,
      product.sellerId,
      'detail' // view type: 'grid' or 'detail'
    );
  };

  // Track when user adds to cart
  const handleAddToCart = async (product, quantity) => {
    await tracker.trackAddToCart(
      product.id,
      product.name,
      quantity,
      product.price,
      product.category
    );
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

## 🔍 FEATURE 1: USER TRACKING

### What Gets Tracked

```
✅ Navigation & Page Views
   - Every page visited
   - Time spent on each page
   - Scroll depth (how far down they scrolled)
   - Exit pages

✅ Product Interactions
   - Product views (grid vs detail)
   - Searches (keywords + results count)
   - Filters applied
   - Product comparisons

✅ Shopping Cart
   - Add to cart
   - Remove from cart
   - Cart abandonment (when they leave)
   - Reason for abandonment

✅ Checkout Process
   - Checkout start
   - Progress through form (which fields filled)
   - Checkout abandonment
   - Which step did they abandon at?

✅ Purchases
   - Purchase completion (with order ID, amount)
   - Purchase failures (error code, message)

✅ Device & Engagement
   - Device info (mobile, tablet, desktop)
   - Browser type and version
   - Screen size and viewport
   - Click count, scroll count
   - Time spent engaging
```

### Implementation Examples

#### 1. Track Page View

```tsx
useEffect(() => {
  const { tracker } = useIntelligentTracking();
  
  tracker.trackPageView(
    'Products Catalog',           // Page title
    '/products',                  // URL
    document.referrer             // Referrer
  );
}, []);
```

#### 2. Track Product Search

```tsx
const handleSearch = async (searchQuery) => {
  const { tracker } = useIntelligentTracking();
  const results = await searchProducts(searchQuery);
  
  await tracker.trackSearch(
    searchQuery,                  // What they searched for
    results.length,               // How many results
    { category: 'electronics' }   // Filters applied
  );
};
```

#### 3. Track Product Filter

```tsx
const handleFilter = async (filterType, filterValue) => {
  const { tracker } = useIntelligentTracking();
  const filteredResults = applyFilter(filterType, filterValue);
  
  await tracker.trackFilter(
    filterType,      // 'price', 'category', 'rating', etc.
    filterValue,     // specific value
    filteredResults.length
  );
};
```

#### 4. Track Add to Cart

```tsx
const handleAddToCart = async (product, quantity) => {
  const { tracker } = useIntelligentTracking();
  
  await tracker.trackAddToCart(
    product.id,
    product.name,
    quantity,
    product.price,
    product.category
  );
  
  // Then add to cart in your app
  addToCart(product, quantity);
};
```

#### 5. Track Cart Abandonment

```tsx
// Call this when user navigates away from cart without checkout
const handleLeaveCart = async (cartItems, cartTotal) => {
  const { tracker } = useIntelligentTracking();
  
  await tracker.trackCartAbandonment(
    cartItems,  // Array of { productId, name, price, quantity }
    cartTotal,
    'Too expensive'  // Optional: why they left
  );
};
```

#### 6. Track Checkout Progress

```tsx
// Call as user fills checkout form
const handleFormChange = async (formData, step) => {
  const { tracker } = useIntelligentTracking();
  
  // Count filled fields
  const filledFields = Object.keys(formData).filter(
    key => formData[key] !== ''
  ).length;
  const totalFields = Object.keys(formData).length;
  
  await tracker.trackCheckoutProgress(
    step,           // 'shipping', 'payment', 'review', etc.
    filledFields,   // How many fields are filled?
    totalFields     // Total fields in this step
  );
};
```

#### 7. Track Checkout Abandonment

```tsx
// Call when user abandons checkout
const handleCheckoutAbandonment = async (step, cartTotal, formData) => {
  const { tracker } = useIntelligentTracking();
  
  const filledFields = Object.keys(formData).filter(
    key => formData[key] !== ''
  ).length;
  
  await tracker.trackCheckoutAbandonment(
    step,              // 'shipping', 'payment', etc.
    cartTotal,
    filledFields,
    Object.keys(formData).length,
    'Payment method not available'  // Why they left
  );
};
```

#### 8. Track Purchase Completion

```tsx
const handlePurchaseSuccess = async (order, cartItems) => {
  const { tracker } = useIntelligentTracking();
  
  await tracker.trackPurchaseComplete(
    order.id,                  // Order ID
    order.total,               // Total amount
    cartItems,                 // Items purchased
    'card'                     // Payment method
  );
};
```

#### 9. Track Purchase Failure

```tsx
const handlePurchaseError = async (error, cartItems, total) => {
  const { tracker } = useIntelligentTracking();
  
  await tracker.trackPurchaseFailed(
    total,
    cartItems,
    error.code,                // Error code from payment gateway
    error.message              // User-friendly message
  );
};
```

#### 10. Track Errors

```tsx
try {
  // Some operation
} catch (error) {
  const { tracker } = useIntelligentTracking();
  
  await tracker.trackError(
    'ProductLoadError',        // Error type
    error.message,             // What happened
    error.stack,               // Stack trace
    { productId: productId }   // Context
  );
}
```

---

## 📊 FEATURE 2: ANALYTICS & BUSINESS INTELLIGENCE

### Get Conversion Metrics

```tsx
const { getConversionMetrics } = useIntelligentTracking({
  enableAnalytics: true,
});

// Get metrics for last 30 days
const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

const metrics = await getConversionMetrics(thirtyDaysAgo, today);

// metrics = {
//   totalViewers: 10000,
//   cartAddCount: 500,
//   checkoutStartCount: 300,
//   purchaseCount: 150,
//   cartToCheckoutRate: 60%,
//   checkoutToPurchaseRate: 50%,
//   overallConversionRate: 1.5%
// }
```

### Get Cart Abandonment Metrics

```tsx
const { getCartAbandonmentMetrics } = useIntelligentTracking({
  enableAnalytics: true,
});

const metrics = await getCartAbandonmentMetrics(startDate, endDate);

// metrics = {
//   totalCartsAbandoned: 250,
//   cartsRecovered: 10,
//   recoveryRate: 4%,
//   averageCartValue: 15000,
//   totalAbandonedValue: 3750000,
//   commonReasons: [
//     { reason: 'Too expensive', count: 100 },
//     { reason: 'Shipping cost high', count: 80 },
//     { reason: 'Slow checkout', count: 40 }
//   ]
// }
```

### Get Product Popularity

```tsx
const { getProductPopularity } = useIntelligentTracking({
  enableAnalytics: true,
});

// Get top 10 products by purchases
const topProducts = await getProductPopularity('purchases', 10);

// Each product = {
//   productId: 'prod_123',
//   productName: 'Laptop',
//   category: 'Electronics',
//   viewCount: 5000,
//   addToCartCount: 800,
//   purchaseCount: 200,
//   viewToCartRate: 16%,
//   cartToPurchaseRate: 25%
// }
```

### Get Peak Shopping Hours

```tsx
const { getPeakHours } = useIntelligentTracking({
  enableAnalytics: true,
});

const peakHours = await getPeakHours(startDate, endDate);

// Each hour = {
//   hour: 19,
//   dayOfWeek: 'Fri',
//   activityCount: 5000,
//   purchaseCount: 250
// }
```

### Get User Behavior Patterns

```tsx
const { getUserBehavior } = useIntelligentTracking({
  enableAnalytics: true,
});

const behavior = await getUserBehavior(userId);

// behavior = {
//   userId: 'user_123',
//   sessionCount: 12,
//   totalTimeSpent: 480,  // minutes
//   averageSessionDuration: 40,  // minutes
//   favoriteCategory: 'Electronics',
//   preferredPriceRange: { min: 10000, max: 100000 },
//   lastActiveTime: Date,
//   isAtRisk: false,  // Haven't visited in 30 days?
//   isFraudAtRisk: false  // Unusual behavior?
// }
```

---

## 💡 FEATURE 3: SMART RECOMMENDATIONS

### Get Personalized Recommendations

```tsx
const { getRecommendations } = useIntelligentTracking({
  enableRecommendations: true,
});

const recommendations = await getRecommendations(10);  // Top 10

// Each recommendation = {
//   productId: 'prod_123',
//   productName: 'Laptop',
//   category: 'Electronics',
//   price: 250000,
//   reason: 'Users like you also bought this',
//   score: 92  // Confidence score 0-100
// }

// Display recommendations
{recommendations.map(rec => (
  <ProductCard
    key={rec.productId}
    product={rec}
    badge={`${rec.score}% match`}  // Show confidence score
  />
))}
```

### Get Trending Products

```tsx
const { getTrendingProducts } = useIntelligentTracking({
  enableRecommendations: true,
});

const trendingNow = await getTrendingProducts(
  7,   // Last 7 days
  10   // Top 10
);
```

### Get Frequently Bought Together

```tsx
const { getFrequentlyBoughtTogether } = useIntelligentTracking({
  enableRecommendations: true,
});

// When user is viewing a laptop
const complementaryProducts = await getFrequentlyBoughtTogether(
  'laptop_id',
  5  // Top 5 products bought with this
);

// Display in "Frequently bought together" section
```

### Get Cart Recovery Recommendations

```tsx
// When user abandons cart, suggest complementary items
const { getCartRecoveryRecommendations } = useIntelligentTracking({
  enableRecommendations: true,
});

const recoveryRecs = await getCartRecoveryRecommendations(
  userId,
  cartItems
);

// Show in recovery email:
// "You left items in your cart. Customers who bought these also liked..."
```

---

## 🚨 FEATURE 4: ISSUE DETECTION

### Auto-Detect Problems

```tsx
const { detectAllIssues } = useIntelligentTracking({
  enableAnalytics: true,
});

const issues = await detectAllIssues(startDate, endDate);

// Each issue = {
//   issueId: 'issue_123',
//   issueType: 'cart_abandonment',
//   severity: 'high',  // 'critical' | 'high' | 'medium' | 'low'
//   title: 'High Cart Abandonment Rate (45%)',
//   description: '...',
//   affectedCount: 450,
//   impactValue: 3750000,  // Revenue lost
//   suggestedAction: 'Simplify checkout, offer incentive, ...'
//   data: { /* detailed data */ }
// }
```

### Types of Issues Detected

```
✅ Cart Abandonment Issues
   - High abandonment rate (>40%)
   - Common reasons for abandonment
   - Estimated revenue loss
   - Suggested actions

✅ Checkout Issues
   - Where users drop off most
   - Abandonment by checkout step
   - Form completion rates
   - Friction points

✅ Payment Processing Issues
   - High failure rate (>5% is bad)
   - Error codes and frequencies
   - Lost revenue from failed payments
   - When failures spike

✅ Performance Issues
   - Slow page load times
   - Core Web Vitals violations
   - Mobile vs desktop differences
   - Network latency issues

✅ Error Spikes
   - Unusual error frequency
   - Most common errors
   - Error severity categorization
   - When errors occur

✅ User Friction Points
   - Low engagement areas
   - High bounce rates
   - Form field frustration
   - Navigation confusion
```

---

## 🎯 INTEGRATION CHECKLIST

Here's how to integrate tracking into your key pages:

### 1. Product Pages (ProductList, Product Detail)

```tsx
// ProductList.tsx
export function ProductList() {
  const { tracker } = useIntelligentTracking({
    trackPageView: true,
    enableTracking: true,
    enableRecommendations: true,
  });

  const handleProductClick = async (product) => {
    await tracker.trackProductView(
      product.id,
      product.name,
      product.category,
      product.price,
      product.sellerId,
      'grid'  // or 'detail'
    );
    navigateToProductDetail(product.id);
  };

  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => handleProductClick(product)}
        />
      ))}
    </div>
  );
}
```

### 2. Search Pages

```tsx
// SearchResults.tsx
export function SearchResults({ query }) {
  const { tracker } = useIntelligentTracking({
    trackPageView: true,
  });

  useEffect(() => {
    tracker.trackSearch(query, results.length, {
      category: selectedCategory,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
    });
  }, [query, results]);

  return (
    // Component
  );
}
```

### 3. Cart Pages

```tsx
// CartScreen.tsx
export function CartScreen() {
  const { tracker } = useIntelligentTracking();
  const [cartItems, setCartItems] = useState([]);

  const handleAddToCart = async (product, quantity) => {
    await tracker.trackAddToCart(
      product.id,
      product.name,
      quantity,
      product.price,
      product.category
    );
    setCartItems([...cartItems, { ...product, quantity }]);
  };

  const handleProceedToCheckout = async () => {
    const total = calculateTotal(cartItems);
    await tracker.trackCheckoutStart(cartItems, total);
    navigateToCheckout();
  };

  useEffect(() => {
    // If user leaves without checkout
    return () => {
      if (cartItems.length > 0) {
        tracker.trackCartAbandonment(
          cartItems,
          calculateTotal(cartItems),
          'Navigated away'
        );
      }
    };
  }, [cartItems]);

  return (
    // Component
  );
}
```

### 4. Checkout Pages

```tsx
// CheckoutFlow.tsx
export function CheckoutFlow() {
  const { tracker } = useIntelligentTracking();
  const [currentStep, setCurrentStep] = useState('shipping');
  const [formData, setFormData] = useState({});

  const handleFieldChange = async (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Track progress
    const filledCount = Object.values(newFormData).filter(
      v => v !== ''
    ).length;
    
    await tracker.trackCheckoutProgress(
      currentStep,
      filledCount,
      Object.keys(newFormData).length
    );
  };

  const handleNext = () => {
    setCurrentStep('payment');
  };

  const handlePurchase = async () => {
    try {
      const order = await processPayment(formData);
      await tracker.trackPurchaseComplete(
        order.id,
        order.total,
        cartItems,
        'card'
      );
      navigateToSuccess();
    } catch (error) {
      await tracker.trackPurchaseFailed(
        cartTotal,
        cartItems,
        error.code,
        error.message
      );
      showError(error);
    }
  };

  useEffect(() => {
    // If user leaves without purchase
    return () => {
      if (Object.keys(formData).length > 0 && !orderCompleted) {
        tracker.trackCheckoutAbandonment(
          currentStep,
          cartTotal,
          Object.values(formData).filter(v => v !== '').length,
          Object.keys(formData).length,
          'User navigated away'
        );
      }
    };
  }, []);

  return (
    // Component
  );
}
```

### 5. Admin Analytics Dashboard

```tsx
// AdminDashboard.tsx or separate AnalyticsDashboard page
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

export function AdminAnalytics() {
  return (
    <AnalyticsDashboard
      timeRange="month"
      refreshInterval={60000}  // Refresh every minute
      showIssueDetection={true}
    />
  );
}
```

---

## 📈 USAGE EXAMPLES BY SCENARIO

### Scenario 1: New User First Visit

```tsx
const handleFirstVisit = async () => {
  const { tracker } = useIntelligentTracking();
  
  // Track page views
  await tracker.trackPageView('Welcome', '/welcome');
  
  // Track product browsing
  products.forEach(product => {
    tracker.trackProductView(
      product.id,
      product.name,
      product.category,
      product.price
    );
  });
  
  // Analyze: Is new user engaging?
  // Later: Send onboarding recommendations
};
```

### Scenario 2: Cart Abandonment Recovery

```tsx
// In recovery email service
const sendCartRecoveryEmail = async (userId, cartItems) => {
  const { getCartRecoveryRecommendations } = useIntelligentTracking({
    enableRecommendations: true,
  });
  
  const recommendations = await getCartRecoveryRecommendations(
    userId,
    cartItems
  );
  
  // Email template:
  // "You left ₦15,000 in your cart. 
  // Customers who bought these items also loved..."
  // [Show recommendations]
  // [10% discount: COMEBACK10]
};
```

### Scenario 3: Identify Problem Products

```tsx
const handleProductQualityIssue = async () => {
  const { getProductPopularity, detectAllIssues } = useIntelligentTracking({
    enableAnalytics: true,
  });
  
  // Find products with high view count but low purchase rate
  const products = await getProductPopularity('purchases');
  const problemProducts = products.filter(p => 
    p.viewCount > 100 && p.purchaseCount < 5
  );
  
  // These have low conversion - why?
  // Issue: Product images bad, price too high, poor description?
};
```

### Scenario 4: Optimize for Peak Hours

```tsx
const optimizeForPeakHours = async () => {
  const { getPeakHours } = useIntelligentTracking({
    enableAnalytics: true,
  });
  
  const peaks = await getPeakHours(startDate, endDate);
  
  // peaks might show:
  // Friday 7-8 PM: highest traffic
  // Saturday 10-11 AM: second highest
  
  // Actions:
  // - Ensure max server capacity Friday 7-8 PM
  // - Run promotions during peak hours
  // - Schedule maintenance outside peak hours
};
```

### Scenario 5: Build Customer Profiles

```tsx
const buildCustomerProfile = async (userId) => {
  const { getUserBehavior } = useIntelligentTracking({
    enableAnalytics: true,
  });
  
  const behavior = await getUserBehavior(userId);
  
  // Profile = {
  //   Who: Regular electronics buyer
  //   What: ₦20-100k price range
  //   When: Shops Friday evenings
  //   How often: 12 times in 6 months
  //   At risk: No, very engaged
  // }
  
  // Use for: Targeted marketing, personalized recommendations
};
```

---

## 🔐 PRIVACY & SECURITY NOTES

```
✅ What's Tracked:
   - User actions only
   - No passwords or sensitive data
   - No full credit card numbers
   - Anonymized IP addresses (recommended)

✅ What's NOT Tracked:
   - Passwords
   - Full emails (only stored separately)
   - Credit card details
   - Personally identifiable info

✅ GDPR Compliance:
   - Users can request data export
   - Users can request data deletion
   - Activity logs retained per policy
   - Consent on first visit
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before going live:

```
□ Enable tracking in all key components
□ Test tracking data in Firestore
□ Verify analytics dashboard shows data
□ Configure Firestore security rules
□ Set up retention policies for old logs
□ Configure backup for analytics data
□ Test recommendation engine with sample users
□ Verify issue detection catches real problems
□ Set up monitoring/alerts for critical issues
□ Train admin team on dashboard
□ Document tracking implementation for team
```

---

## 📞 TROUBLESHOOTING

### Tracking Not Working?

```
1. Check user is authenticated (tracker needs userId)
2. Verify Firestore connectivity
3. Check browser console for errors
4. Ensure COLLECTIONS.ACTIVITY_LOGS exists in database
5. Check Firestore quotas/limits
```

### Analytics Data Delayed?

```
1. Firestore writes are eventually consistent
2. Analytics queries operate on recent data
3. Real-time dashboard refreshes every 60s
4. For historical data, wait until data is fully written
```

### Recommendations Not Good?

```
1. Needs minimum user activity data (5+ sessions)
2. Personalization improves with more users
3. Check if users have purchase history
4. Verify product categories are consistent
```

---

**Implementation Status: COMPLETE ✅**

All tracking, analytics, recommendations, and issue detection are now ready to integrate into your application!
