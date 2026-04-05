# NCDFCOOP Commerce - UX Workflow Implementation Guide

**Document Date:** April 5, 2026  
**Status:** Comprehensive Implementation Complete  
**Platform:** Next.js 14 + React 18 + Firebase + Zustand (via Auth Context)

---

## TABLE OF CONTENTS

1. [Implementation Overview](#implementation-overview)
2. [Architecture](#architecture)
3. [User Journey](#user-journey)
4. [Component Structure](#component-structure)
5. [State Management](#state-management)
6. [Authentication & Authorization](#authentication--authorization)
7. [Role System](#role-system)
8. [Routing & Navigation](#routing--navigation)
9. [File Structure](#file-structure)
10. [Testing Checklist](#testing-checklist)

---

## IMPLEMENTATION OVERVIEW

This document describes the complete UX workflow implementation for NCDFCOOP Commerce website based on the iOS app specifications. The implementation includes:

- **Splash Screen** with 2-3 second loading animation
- **Onboarding** with educational content
- **Authentication** system (Sign In / Sign Up)
- **Role Selection** - Critical UX decision point
- **Role-Aware Home Screens** - Different dashboards per role
- **Seller Onboarding** - 5-step workflow
- **Role-Based Navigation** - Dynamic menus
- **User Persistence** - Auto-login with stored tokens

### Technology Stack

```
Frontend:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

Backend/Services:
- Firebase Auth
- Cloud Firestore
- Custom API (future)

State Management:
- React Context (Auth)
- localStorage/sessionStorage (persistence)
```

---

## ARCHITECTURE

### Layer Structure

```
┌─────────────────────────────────────┐
│      UI Components (Pages/Views)    │
│  (HomeScreen, RoleSelection, etc)   │
├─────────────────────────────────────┤
│    Route Guards & Wrappers          │
│  (ProtectedRoute, redirects)        │
├─────────────────────────────────────┤
│      Context Providers              │
│  (AuthProvider with state)          │
├─────────────────────────────────────┤
│   Middleware & Services             │
│  (roleGuard, authService)           │
├─────────────────────────────────────┤
│     Firebase & External APIs        │
└─────────────────────────────────────┘
```

### Auth Context Flow

```
AuthProvider
├── State:
│   ├── user: AuthUser | null
│   ├── loading: boolean
│   ├── error: string | null
│   ├── onboardingCompleted: boolean
│   ├── roleSelectionComplete: boolean
│   └── currentRole: string | null
│
└── Methods:
    ├── signup(email, password, name)
    ├── login(email, password)
    ├── logout()
    ├── resetPassword(email)
    ├── completeOnboarding()
    ├── selectRole(role)
    ├── switchRole(role)
    └── refreshUserData()
```

---

## USER JOURNEY

### Complete Flow Diagram

```
UNAUTHENTICATED USER
        ↓
    [/] (Splash Screen)
        ↓
   [2 seconds delay]
        ↓
    [/welcome]
        ├─ Sign In → [/auth/login]
        │            ├─ Email/Password login
        │            └─ Social auth
        │
        └─ Sign Up → [/auth/signup]
                     ├─ Create account
                     └─ Auto-redirect to onboarding


AFTER SIGNUP (First Login)
        ↓
    [/onboarding] ← Educational screens
        ↓
   [Onboarding Completed flag set]
        ↓
    [/role-selection] ← CRITICAL POINT
        ├─ Member
        ├─ Wholesale Buyer
        └─ Seller → [/seller/onboarding] ← 5-step workflow
                     ├─ Step 1: Landing
                     ├─ Step 2: Business Setup
                     ├─ Step 3: First Product
                     ├─ Step 4: Review Status
                     └─ [/home] → Seller Dashboard


EXISTING USER (Returning)
        ↓
    [/] (Splash)
        ↓
   [Auto-login via persisted token]
        ↓
    [/home] ← Role-aware dashboard
        ├─ Member → MemberHomeScreen
        ├─ Wholesale Buyer → WholesaleBuyerHomeScreen
        └─ Seller → SellerDashboardHomeScreen
```

---

## COMPONENT STRUCTURE

### Page Components (app/ directory)

```
app/
├── page.tsx                    # Splash screen redirector
├── layout.tsx                  # Root layout with AuthProvider
├── splash/page.tsx             # Splash screen page
├── welcome/page.tsx            # Welcome/landing for unauth users
├── onboarding/page.tsx         # Educational onboarding
├── role-selection/page.tsx     # Role selection screen
├── home/page.tsx               # Role-aware home screen router
├── auth/
│   ├── login/page.tsx          # Sign in page
│   ├── signup/page.tsx         # Sign up page
│   └── forgot-password/page.tsx # Password reset request
├── access-denied/page.tsx      # Unauthorized access
└── seller/
    └── onboarding/page.tsx     # Seller onboarding flow
```

### Component Library (components/ directory)

```
components/
├── SplashScreen.tsx            # 2-3 second loading screen
├── RoleSelectionScreen.tsx     # Role selection UI
├── ProtectedRoute.tsx          # Route guard wrapper
├── MemberHomeScreen.tsx        # Member dashboard
├── WholesaleBuyerHomeScreen.tsx # Wholesale dashboard
├── SellerDashboardHomeScreen.tsx # Seller dashboard
├── SellerOnboarding.tsx        # 5-step seller flow
├── EnhancedNavigation.tsx      # Role-aware navigation
├── Navigation.tsx             # (Legacy, can be removed)
├── HomeScreen.tsx             # (Legacy)
└── [Other components...]
```

### Utility Modules (lib/ directory)

```
lib/
├── auth/
│   └── authContext.tsx         # Main state management
├── middleware/
│   └── roleGuard.ts            # Role checks & permissions
├── constants/
│   └── database.ts             # Enums & constants
└── firebase/
    └── config.ts               # Firebase setup
```

---

## STATE MANAGEMENT

### AuthContext Data Flow

```
User Action (Login/Signup)
        ↓
    [Auth Method Called]
        ↓
[Firebase Auth Updates]
        ↓
[onAuthStateChanged Triggered]
        ↓
[Fetch User Document from Firestore]
        ↓
[Update Context State]
    ├── user object
    ├── onboardingCompleted
    ├── roleSelectionComplete
    └── currentRole
        ↓
[Components Re-render with New State]
```

### Persisted Data

**In Firestore (users collection):**
```
{
  id: string
  email: string
  name: string
  roles: string[]                    // NEW: Multiple roles
  selectedRole: string               // NEW: Primary role
  roleSelectionComplete: boolean     // NEW: Workflow flag
  onboardingCompleted: boolean       // NEW: Workflow flag
  memberTier: string
  createdAt: Timestamp
  updatedAt: Timestamp
  ...otherFields
}
```

**In localStorage (if using):**
```
- onboarding_completed: boolean
- role_selection_complete: boolean
- selected_role: string
- user_id: string
```

---

## AUTHENTICATION & AUTHORIZATION

### Authentication Methods Supported

1. **Email/Password**
   - Sign up with validation
   - Sign in with error handling
   - Password reset via email

2. **Social Auth (Future)**
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In

### Token Management

```
Access Token (15 min expiry)
├─ Stored in: Memory (safe)
├─ Used in: API headers
└─ Refreshed: Automatic

Refresh Token (7-30 days)
├─ Stored in: FlutterSecureStorage equivalent (encrypted)
├─ Used for: Getting new access tokens
└─ Revoked: On logout
```

### Auto-Login Flow

```
[App loads]
    ↓
[Check Firebase Auth state]
    ├─ Has session? → Restore user
    └─ No session? → Show welcome
    ↓
[Restore Firestore user data]
    ├─ roles, selectedRole, flags
    └─ Update AuthContext
    ↓
[Route based on state]
```

---

## ROLE SYSTEM

### Available Roles

```
PRIMARY ROLES (User selects one):

1. MEMBER (coopMember)
   - Color: #C9A227 (Gold)
   - Features: Shopping, loyalty rewards, member pricing
   - Home Screen: MemberHomeScreen
   
2. WHOLESALE BUYER (wholesale_buyer)
   - Color: #2E5090 (Blue)
   - Features: Bulk ordering, credit lines, invoicing
   - Home Screen: WholesaleBuyerHomeScreen
   
3. SELLER (seller)
   - Color: #0B6B3A (Deep Green)
   - Features: Product listing, analytics, fulfillment
   - Home Screen: SellerDashboardHomeScreen + Onboarding

ADDITIONAL ROLES (Backend managed):
- franchise, store_manager, store_staff
- institutional_buyer, institutional_approver
- warehouse_staff, delivery_driver
- admin, super_admin
```

### Role Selection Logic

```
User clicks role card
    ↓
POST /api/users/{userId}/roles
Body: { selectedRole: "seller" }
    ↓
Backend:
  ├─ Verify user exists
  ├─ Add role to roles array
  ├─ Set selectedRole
  ├─ Set roleSelectionComplete = true
  └─ Return updated user
    ↓
Frontend:
  ├─ Update AuthContext
  ├─ Set currentRole
  ├─ Set roleSelectionComplete flag
  └─ Route to appropriate screen

If role === SELLER:
  → /seller/onboarding
Else:
  → /home
```

### Permissions System

```
enum Permission {
  // Buyer permissions
  VIEW_PRODUCTS,
  ADD_TO_CART,
  CHECKOUT,
  VIEW_ORDER_HISTORY,
  ADD_MONEY_TO_ACCOUNT,
  SAVE_MONEY_ON_PLATFORM,

  // Seller permissions
  LIST_PRODUCTS,
  EDIT_PRODUCTS,
  VIEW_SALES_ANALYTICS,
  FULFILL_ORDERS,

  // Admin permissions
  VIEW_ALL_USERS,
  MODIFY_USER_ROLES,
  APPROVE_PRODUCTS,
  ...
}

// Used for component-level access control
if (hasPermission(currentRole, Permission.LIST_PRODUCTS)) {
  show("list products UI")
}
```

---

## ROUTING & NAVIGATION

### Public Routes (No Auth Required)
```
/               → Splash
/welcome        → Welcome/landing
/auth/login     → Sign in
/auth/signup    → Sign up
/auth/forgot-password → Password reset
```

### Protected Routes (Auth Required)
```
/onboarding     → Educational screens (onboardingCompleted: false)
/role-selection → Role picker (roleSelectionComplete: false)
/home           → Role-based dashboard (all: true)
/seller/onboarding → Seller setup (role: seller)
/account        → Account settings
```

### Route Guards Implementation

```
ProtectedRoute Component:
├─ Check if user authenticated
├─ Check if onboarding complete
├─ Check if role selected
├─ Check if has required role
└─ Redirect if conditions not met

Usage:
<ProtectedRoute 
  currentPath="/seller/products"
  requiredRoles={[USER_ROLES.SELLER]}
>
  <SellerProducts />
</ProtectedRoute>
```

---

## TESTING CHECKLIST

### Authentication Flow
- [ ] Sign up creates user in Firebase
- [ ] Sign in retrieves existing user
- [ ] Password reset email sent
- [ ] Invalid credentials show errors
- [ ] Tokens stored securely

### Onboarding Flow
- [ ] New user sees onboarding screens
- [ ] Completing onboarding sets flag
- [ ] Onboarded users skip onboarding
- [ ] Can skip onboarding flow

### Role Selection
- [ ] All three role options display correctly
- [ ] Selecting role saves to database
- [ ] Seller role routes to onboarding
- [ ] Other roles route to home
- [ ] Role colors display correctly

### Home Screens
- [ ] Member sees MemberHomeScreen
- [ ] Wholesale Buyer sees WholesaleBuyerHomeScreen
- [ ] Seller sees SellerDashboardHomeScreen
- [ ] Navigation shows role-appropriate items

### Seller Onboarding
- [ ] Step 1: Landing displays
- [ ] Step 2: Form validates and saves
- [ ] Step 3: Product upload works
- [ ] Step 4: Shows approval status
- [ ] Completion routes to home

### Navigation
- [ ] Navigation hides on splash/auth/onboarding
- [ ] Navigation shows on protected pages
- [ ] Role-specific menu items display
- [ ] Logout works correctly
- [ ] Mobile navigation responsive

### User Persistence
- [ ] Page refresh keeps user logged in
- [ ] Auto-login with stored token
- [ ] Token refresh works silently
- [ ] Logout clears tokens
- [ ] Closing browser logs out

---

## COMMON PATTERNS

### Using Auth Context

```tsx
// In any component
import { useAuth } from '@/lib/auth/authContext';

export function MyComponent() {
  const { user, currentRole, logout } = useAuth();
  
  if (!user) return <div>Not logged in</div>;
  
  return <div>Hello {user.displayName}, you are {currentRole}</div>;
}
```

### Checking Permissions

```tsx
import { hasPermission, Permission } from '@/lib/middleware/roleGuard';

if (hasPermission(currentRole, Permission.LIST_PRODUCTS)) {
  // Show product listing UI
}
```

### Conditional Rendering by Role

```tsx
if (currentRole === USER_ROLES.SELLER) {
  return <SellerDashboardHomeScreen />;
} else if (currentRole === USER_ROLES.WHOLESALE_BUYER) {
  return <WholesaleBuyerHomeScreen />;
} else {
  return <MemberHomeScreen />;
}
```

---

## MIGRATION NOTES

### From Old Components
- `Navigation.tsx` (old) → `EnhancedNavigation.tsx` (new)
- `HomeScreen.tsx` (single) → Role-specific screens
- `LoginScreen.tsx` → `/auth/login` page
- `SignupScreen.tsx` → `/auth/signup` page

### Database Changes
Add new fields to users collection:
```
roles: ["member"]
selectedRole: "member"
roleSelectionComplete: true
onboardingCompleted: true
```

---

## DEPLOYMENT CONSIDERATIONS

1. **Environment Variables**: Ensure Firebase config is set
2. **Database Migration**: Add new fields to existing users
3. **Cross-Browser Testing**: Test on Chrome, Safari, Firefox
4. **Mobile Testing**: Full testing on iOS and Android browsers
5. **Performance**: Monitor splash screen timing
6. **Security**: Validate tokens on backend

---

## FUTURE ENHANCEMENTS

1. **Social Authentication**
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In

2. **Multi-Role UI**
   - Role switcher dropdown
   - Quick role switching without reload
   - Role-specific breadcrumbs

3. **Advanced Seller Onboarding**
   - Document upload
   - Verification workflows
   - Payout setup

4. **Analytics**
   - Track onboarding completion rates
   - Monitor role selection distribution
   - Measure seller onboarding dropout points

5. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

---

**Updated:** April 5, 2026  
**Implemented By:** AI Development Copilot  
**Status:** Ready for Testing
