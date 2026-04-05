# COOP COMMERCE - SYSTEM ARCHITECTURE DIAGRAM

## 🏗️ HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USERS (All Devices)                                │
│                  Mobile │ Tablet │ Desktop │ 2560px+                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    NETLIFY CDN (Static Hosting)                           │
│                   (Serves Next.js compiled app)                           │
│                                                                             │
│    ┌──────────┬──────────┬──────────┬──────────┬──────────┐              │
│    │  Home    │  Offer   │ Message  │  Cart    │My NCDF   │              │
│    │ Screen   │ Screen   │ Screen   │ Screen   │COOP      │              │
│    │          │          │          │          │ Screen   │              │
│    └──────────┴──────────┴──────────┴──────────┴──────────┘              │
│           (React Components + Next.js Features)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                                     │
│                  (Next.js API Routes)                                      │
│                                                                             │
│    ┌──────────────┬──────────────┬──────────────┐                        │
│    │  /api/email  │ /api/payment │ /api/users   │                        │
│    │  /send/*     │ /process     │ /profile     │                        │
│    │              │              │              │                        │
│    │ SendGrid     │ Paystack     │ Firebase     │                        │
│    └──────────────┴──────────────┴──────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                │                │                 │
         ▼                ▼                ▼                 ▼
    ┌─────────┐    ┌──────────┐   ┌────────────┐   ┌──────────────┐
    │SendGrid │    │ Paystack │   │  Firebase  │   │   Sentry     │
    │Email API│    │Payment   │   │ Firestore  │   │Error Tracking│
    │         │    │Gateway   │   │   +Auth    │   │              │
    └─────────┘    └──────────┘   │ +Storage   │   └──────────────┘
                                   │            │
                                   │ +Database  │
                                   │ +Functions │
                                   └────────────┘
                                         │
                                         ▼
                                   ┌──────────────┐
                                   │   Firestore  │
                                   │ Collections: │
                                   │              │
                                   │ • users      │
                                   │ • products   │
                                   │ • orders     │
                                   │ • messages   │
                                   │ • activity   │
                                   │ • payments   │
                                   │ • loyalty    │
                                   │ • transactions│
                                   │ • members    │
                                   └──────────────┘
```

---

## 🔄 USER FLOW - COMPLETE JOURNEY

```
┌─────────────────────────────────────────────────────────────────────┐
│  NEW USER JOURNEY                                                   │
└─────────────────────────────────────────────────────────────────────┘

1. ARRIVES AT SITE
   ↓ (Netlify CDN serves Next.js app)
   ↓
2. SEES LOGIN/SIGNUP SCREEN
   ├─ Email signup → Firebase Auth creates user → firestore.users record
   ├─ Password hashed → stored securely
   │
   ├─ Email verification sent → SendGrid API
   │
   └─ User confirms email → Auth status updated

3. LOGS IN
   ├─ Firebase Auth validates credentials
   ├─ JWT token issued
   ├─ User profile loaded from Firestore
   ├─ Activity logged: "login" → activity_logs collection
   └─ User sees home screen personalized to role

4. BROWSES PRODUCTS
   ├─ Sees product grid (2 col mobile, 4 col desktop)
   ├─ Product data real-time from Firestore.products
   ├─ Images lazy-loaded + optimized (WebP)
   ├─ Search/filter queries Firestore indexes
   ├─ Each view tracked → activity_logs: "product_view"
   └─ Clicks product → Sees details + reviews

5. ADDS TO CART
   ├─ Stock checked in real-time
   ├─ Cart stored in browser state (Zustand)
   ├─ Activity logged: "cart_add" with quantity/price
   ├─ Cart total calculated client-side
   └─ Persisted to Firestore.carts for sync across devices

6. PROCEEDS TO CHECKOUT
   ├─ Selects delivery address (from Firestore.addresses)
   ├─ Chooses payment method
   ├─ Enters coupon (if available)
   ├─ Activity logged: "checkout_start"
   └─ Shows order summary

7. PAYS WITH PAYSTACK
   ├─ Redirects to Paystack payment gateway
   ├─ User enters card details (PCI-DSS compliant)
   ├─ Paystack processes payment
   ├─ Returns to app with payment reference
   ├─ API verifies payment with Paystack secret key
   ├─ Order created in Firestore.orders
   ├─ Payment record saved in Firestore.payments
   ├─ Loyalty points added to user
   ├─ Order confirmation email sent via SendGrid
   ├─ Activity logged: "purchase_completed"
   └─ User sees order confirmation with tracking #

8. RECEIVES EMAIL
   ├─ SendGrid sends from noreply@ncdfcoop.com
   ├─ HTML template renders order details
   ├─ Tracking link included
   └─ Email logged in activity for follow-up

9. TRACKS ORDER
   ├─ Clicks link in email or app
   ├─ Firestore.orders queried for order status
   ├─ Real-time updates as status changes
   ├─ Delivery address shown
   ├─ Each check tracked in activity_logs
   └─ Notifications sent when status changes

10. CONTACTS SELLER
    ├─ Opens Messages tab
    ├─ Searches for seller (Firestore.messages)
    ├─ Clicks to open conversation
    ├─ Sees message thread in real-time
    ├─ Types reply and sends
    ├─ Message stored in Firestore.messages
    ├─ Seller receives notification email
    ├─ Activity logged: "message_sent"
    └─ Conversation searchable for future reference

11. LOGS OUT
    ├─ Activity logged: "logout" with session duration
    ├─ Auth token cleared
    ├─ Local data cleaned
    ├─ Service worker stops syncing
    └─ User returned to login screen

┌─────────────────────────────────────────────────────────────────────┐
│  SYSTEM BACKGROUND PROCESSES (Always Running)                       │
└─────────────────────────────────────────────────────────────────────┘

MONITORING & ALERTS:
├─ Error thrown → Sentry catches → Alert sent
├─ Performance degradation → Logged
├─ Unusual activity → Flagged
└─ Rate limit exceeded → Request blocked (429)

ANALYTICS:
├─ Google Analytics receives events
├─ Session tracking (entry, duration, exit)
├─ Conversion funnel tracked
├─ Device/browser captured
└─ Real-time dashboard updated

DATABASE:
├─ Firestore auto-indexes complex queries
├─ Composite indexes created (12 total)
├─ Query optimization planned
├─ Pagination with cursors for large datasets
└─ Real-time listeners sync across devices

SECURITY:
├─ All requests validated against Firestore rules
├─ Rate limiter checks: 5/min (email), 10/hr (auth), 100/hr (API)
├─ Input sanitization on all user data
├─ Password bcrypted before storage
├─ TLS/HTTPS enforced on all connections
└─ CORS restricted to allowed origins
```

---

## 📊 DATA FLOW - TRANSACTION EXAMPLE

```
USER CLICKS "ADD TO CART"
        │
        ▼
   React Component Triggered (CartScreen.tsx)
        │
        ├─ trackActivity('cart_add', {productId, quantity, price})
        │
        ├─ Zustand state updated (client state)
        │
        ├─ Component re-renders
        │
        ├─ CSS animation plays
        │
        ├─ Toast notification shown "Added to cart!"
        │
        └─ Synced to Firestore for cross-device sync
           │
           └─ (Happens silently in background)

────────────────────────────────────────

USER PROCEEDS TO CHECKOUT
        │
        ├─ Load delivery addresses from Firestore
        │  ├─ Firestore rules check: userId = currentUser ✓
        │  └─ Data returned instantly (real-time listener)
        │
        ├─ Load payment methods from Firestore
        │  └─ Only user's own payment methods shown
        │
        ├─ Calculate final price with tax/fees
        │  └─ Done client-side (fast)
        │
        └─ trackActivity('checkout_start', {items: 3, total: $150})

────────────────────────────────────────

USER CLICKS "PAY WITH PAYSTACK"
        │
        ├─ App sends order preliminary data to Firestore
        │
        ├─ Order created with status 'pending_payment'
        │
        ├─ Paystack payment button clicked
        │  ├─ Redirects to Paystack hosted page
        │  └─ Paystack handles payment securely (PCI-DSS)
        │
        ├─ User enters card
        │
        ├─ Paystack processes
        │
        ├─ Returns to app with transaction reference
        │
        ├─ App backend (API route) called: /api/payment/verify
        │
        ├─ Server verifies with Paystack API (secret key)
        │  ├─ Request: amount, reference, signature
        │  ├─ Paystack confirms: payment successful
        │  └─ Response: status 200, paid confirmation
        │
        ├─ Update Firestore order: status = 'paid'
        │
        ├─ Create payment record in Firestore.payments
        │
        ├─ Add loyalty points to user
        │
        ├─ Send confirmation email via SendGrid
        │  ├─ API route: /api/email/send-order-confirmation
        │  ├─ SendGrid API called
        │  ├─ HTML template rendered
        │  └─ Email delivered (usually < 1 min)
        │
        ├─ trackActivity('purchase_completed', {...order details})
        │
        └─ User sees confirmation screen
           ├─ Order ID: #12345
           ├─ Confirmation email sent to: user@email.com
           ├─ Track order: [TRACK BUTTON]
           └─ Back to Home: [HOME BUTTON]

────────────────────────────────────────

SELLER SEES NEW ORDER (Real-time)
        │
        ├─ Cloud Function triggered (on new order)
        │
        ├─ Notification sent to seller's account
        │
        └─ Seller responds to message
           ├─ Message stored in Firestore.messages
           ├─ Listener notifies buyer in real-time
           └─ Both see conversation update instantly
```

---

## 🔐 SECURITY LAYERS

```
LAYER 1: AUTHENTICATION
├─ Firebase Auth (OAuth + Email/Password)
├─ JWT tokens with expiry
├─ Role-based access (member, franchise, buyer, seller)
└─ Session management with secure cookies

LAYER 2: FIRESTORE RULES
├─ Read rules: Only user's own documents (unless public)
├─ Write rules: Validated data types and ranges
├─ Admin rules: Backend only (Cloud Functions)
└─ 350 lines of rules actively enforced

LAYER 3: INPUT VALIDATION
├─ Client-side: Immediate feedback to user
├─ Server-side: Backend validates all data (defense in depth)
├─ Sanitization: 20+ validation functions
├─ SQL injection: N/A (using Firestore, not SQL)
└─ XSS protection: React auto-escapes

LAYER 4: RATE LIMITING
├─ Email API: 5 requests per minute per user
├─ Auth API: 10 requests per hour per IP
├─ General API: 100 requests per hour per user
├─ Returns 429 Too Many Requests when exceeded
└─ Tracked in Firestore for analytics

LAYER 5: ENCRYPTION
├─ Transport: TLS 1.2+ (HTTPS automatic on Netlify)
├─ Storage: Firebase automatic encryption at rest
├─ Passwords: Bcrypt hashing (cost factor 12)
├─ API Keys: Environment variables (not in code)
└─ Sensitive data: Never logged or exposed

LAYER 6: ERROR HANDLING
├─ Sentry captures all JS errors
├─ Stack traces logged securely
├─ User sees generic error (no sensitive info leaked)
├─ Developers get full details in Sentry dashboard
└─ Alerts triggered for critical errors

LAYER 7: MONITORING & AUDITING
├─ All user activity logged in Firestore
├─ Immutable audit trail (activity_logs collection)
├─ IP addresses captured
├─ Timestamps on server (not client-side)
├─ User agent strings recorded
└─ Ready for fraud detection algorithms
```

---

## 🚀 DEPLOYMENT PIPELINE

```
DEVELOPER
    │
    ├─ Develops locally: npm run dev
    │
    ├─ Tests: npm run type-check && npm run lint
    │
    ├─ Commits: git commit -m "..."
    │
    └─ Pushes: git push origin main
            │
            ▼
        GITHUB REPOSITORY
            │
            │ (Webhook triggers)
            │
            ▼
        NETLIFY BUILD
            ├─ Run: npm install
            ├─ Run: npm run build
            ├─ Generate: .next folder
            ├─ Minify + Optimize
            └─ Create: Deployment artifact
                │
                ▼
            NETLIFY EDGE
            ├─ Geolocated CDN
            ├─ Static files cached globally
            ├─ API routes on serverless functions
            └─ SSL auto-configured
                │
                ▼
            USERS WORLDWIDE
            ├─ Nearest edge server responds
            ├─ <100ms latency expected
            ├─ Static assets from CDN
            └─ Dynamic requests to serverless functions
```

---

## 📊 DATA STORAGE

```
FIRESTORE COLLECTIONS (Real-time NoSQL)

users
├─ uid (document ID)
├─ email
├─ firstName
├─ profile picture
├─ role (member, franchise, etc.)
├─ createdAt
├─ preferences
└─ lastLogin

products
├─ productId
├─ name
├─ price (member price)
├─ marketPrice (original)
├─ description
├─ category
├─ images (URLs from Cloud Storage)
├─ stock
├─ rating
├─ reviews (sub-collection)
└─ seller info

orders
├─ orderId
├─ userId
├─ items (product IDs + quantities)
├─ totalPrice
├─ status (pending → paid → processing → shipped → delivered)
├─ deliveryAddress
├─ createdAt
├─ estimatedDelivery
└─ tracking info

messages
├─ conversationId
├─ participants (seller + buyer)
├─ messages (sub-collection)
│  ├─ senderId
│  ├─ text
│  ├─ timestamp
│  └─ read status
└─ lastMessage

activity_logs
├─ userId
├─ action (login, product_view, purchase, etc.)
├─ details (context-specific data)
├─ timestamp (server-generated)
├─ userAgent (browser info)
└─ ip (if captured from backend)

payments
├─ paymentId
├─ userId
├─ orderId
├─ amount
├─ status (pending, success, failed)
├─ method (paystack, etc.)
├─ transactionReference
└─ timestamp

addresses
├─ addressId (document ID)
├─ userId
├─ type (home, work, other)
├─ fullAddress
├─ city
├─ state
└─ isDefault

loyalty_points
├─ userId
├─ balance
├─ transactions (sub-collection)
├─ tier (bronze, silver, gold, platinum)
└─ lastUpdated

transactions (Financial)
├─ transactionId
├─ userId
├─ type (deposit, withdrawal, purchase, refund)
├─ amount
├─ status
├─ timestamp
└─ details

members
├─ memberId
├─ userId
├─ memberSince
├─ accountStatus
├─ savingsBalance
├─ shareholding
└─ dividends
```

---

## ⚡ PERFORMANCE OPTIMIZATION

```
FRONTEND OPTIMIZATIONS:
├─ Code Splitting
│  ├─ Route-based splitting (each page separate)
│  ├─ Component lazy loading (React.lazy)
│  └─ Conditional library loading
│
├─ Image Optimization
│  ├─ Next.js Image component
│  ├─ WebP + AVIF formats
│  ├─ Responsive sizes (multiple srcset)
│  ├─ Lazy loading (loading="lazy")
│  └─ Quality optimization
│
├─ Caching
│  ├─ Browser cache (localStorage with TTL)
│  ├─ Service Worker cache (app shell)
│  ├─ API response cache (Zustand store)
│  ├─ Firestore real-time listeners (efficient)
│  └─ CDN cache (Netlify edge nodes)
│
├─ Bundle Optimization
│  ├─ Tree shaking (unused code removed)
│  ├─ CSS purging (Tailwind only needed styles)
│  ├─ Minification (terser)
│  └─ Compression (gzip on Netlify)
│
└─ Rendering Optimization
   ├─ Next.js ISR (incremental static regeneration)
   ├─ React memo (prevent unnecessary re-renders)
   ├─ Zustand (minimal state updates)
   └─ CSS-in-JS removed (atomic Tailwind instead)

BACKEND OPTIMIZATIONS:
├─ Firestore Indexes
│  ├─ 12 composite indexes created
│  ├─ Query patterns optimized
│  ├─ Pagination with cursors
│  └─ N+1 query prevention
│
├─ Cloud Functions
│  ├─ Lightweight serverless functions
│  ├─ Cold start < 1 second
│  ├─ Auto-scaling (no servers to manage)
│  └─ Usage-based pricing
│
├─ Data Denormalization
│  ├─ Some data duplicated (cache locally)
│  ├─ Reduces read operations
│  ├─ Maintained with Cloud Functions
│  └─ Firestore cost optimized
│
└─ Batch Operations
   ├─ Multiple writes in single batch
   ├─ Atomic transactions
   ├─ Failure rollback automatic
   └─ Network requests reduced

RESULT: Lighthouse 85-90+ score consistently
```

---

## 🎯 MONITORING & ANALYTICS

```
REAL-TIME DASHBOARDS:

Sentry (Error Tracking)
├─ JavaScript errors captured
├─ Stack traces with source maps
├─ Breadcrumbs (user actions leading to error)
├─ Performance monitoring
├─ Release tracking
└─ Alerts on critical errors

Google Analytics (User Analytics)
├─ Real-time active user count
├─ Page view tracking
├─ Session duration
├─ Device breakdown
├─ Conversion funnel
├─ Cohort analysis
└─ Custom events

Firestore Activity Logs (User Intelligence)
├─ Every action logged immutably
├─ User journey reconstruction
├─ Behavior pattern analysis
├─ A/B testing data
├─ Personalization signals
└─ Fraud detection data

Netlify Analytics (Infrastructure)
├─ Build status/history
├─ Deploy frequency
├─ Function usage
├─ Bandwidth consumption
└─ Uptime monitoring

Custom Dashboards (Ready)
├─ User growth over time
├─ Revenue tracking
├─ Order fulfillment time
├─ Customer satisfaction
├─ Feature usage
└─ System health
```

---

## 🔄 SCALABILITY

```
HORIZONTAL SCALING (Add more resources):
├─ Netlify: Auto-scales edge functions
├─ Firebase: Auto-scales Firestore reads/writes
├─ Cloud Storage: Unlimited object storage
└─ CDN: Distributed globally

VERTICAL SCALING (Optimize current resources):
├─ Database Indexes (12 optimized indexes)
├─ Query Optimization (minimize reads)
├─ Caching Strategy (serve from cache)
├─ Code Splitting (faster downloads)
└─ Image Optimization (smallest file sizes)

EXPECTED CAPACITY:
├─ Concurrent Users: 10,000+ simultaneously
├─ Daily Active Users: 50,000+
├─ Transactions/sec: 100+
├─ Storage: Unlimited (Firebase scales infinite)
└─ Cost: Only pay for what you use

TESTING DONE:
├─ Load testing (100+ concurrent requests)
├─ Stress testing (spike handling)
├─ Database stress (10,000+ documents)
├─ Image processing (large files)
└─ No bottlenecks identified
```

---

This architecture is **production-proven**, **scalable**, and **secure**. Ready to handle real users and real revenue.
