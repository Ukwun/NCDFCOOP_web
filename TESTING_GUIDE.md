# Quick Start Guide - UX Workflow Testing

**Date:** April 5, 2026  
**Status:** Implementation Complete

---

## OVERVIEW

The NCDFCOOP Commerce website now includes a complete role-based UX workflow matching the iOS app specifications. This guide helps you test and verify the implementation.

---

## GETTING STARTED

### Prerequisites
```bash
Node.js 18+
npm or yarn
Firebase project configured
```

### Installation
```bash
# Install dependencies
npm install

# Set up Firebase credentials in lib/firebase/config.ts
# Configure environment variables

# Start development server
npm run dev

# Visit http://localhost:3000
```

---

## TESTING THE COMPLETE WORKFLOW

### Scenario 1: New User (Complete Flow)

```
1. Open http://localhost:3000
   Expected: Splash screen shows for 2 seconds
   
2. See Welcome page
   Expected: Options to Sign In or Create Account
   
3. Click "Create Account"
   Expected: Redirected to /auth/signup
   
4. Fill form and submit
   ├─ Name: "Test User"
   ├─ Email: "test@example.com"
   ├─ Password: "SecurePassword123"
   Date: Should create Firebase account and user doc
   Expected: Redirected to /onboarding
   
5. View Onboarding Screens
   Expected: 3 educational screens with navigation
   Expected: "Get Started" button at end
   
6. Complete Onboarding
   Expected: Redirected to /role-selection
   
7. Select Role
   Expected: Three role cards
   ├─ 👤 Member (gold)
   ├─ 🛒 Wholesale Buyer (blue)
   └─ 🚀 Seller (green)
   
   SELECT: Seller
   Expected: Redirected to /seller/onboarding
   
8. Complete Seller Onboarding (5 steps)
   ├─ Step 1: Read landing page
   ├─ Step 2: Fill business details
   ├─ Step 3: Upload first product
   ├─ Step 4: View approval status
   └─ Step 5: Redirected to /home
   
   Expected: Seeing Seller Dashboard Home Screen
```

### Scenario 2: Returning User (Auto-Login)

```
1. Open http://localhost:3000
   Expected: Splash screen shows
   
2. Firebase recognizes existing session
   Expected: Auto-restore user data
   
3. Check workflow flags
   ├─ onboardingCompleted: true
   ├─ roleSelectionComplete: true
   └─ currentRole: "seller"
   
   Expected: Redirected directly to /home
   Expected: Seller Dashboard appears immediately
```

### Scenario 3: Member Flow

```
1. Create new account (Scenario 1, steps 1-6)

2. At Role Selection (/role-selection)
   SELECT: Member
   
   Expected: Redirected directly to /home (no extra onboarding)
   Expected: Member Home Screen with:
   ├─ Welcome message
   ├─ Loyalty points display
   ├─ Total savings
   ├─ Member since date
   ├─ Upgrade to Premium banner
   └─ Featured products grid
```

### Scenario 4: Wholesale Buyer Flow

```
1. Create new account (Scenario 1, steps 1-6)

2. At Role Selection (/role-selection)
   SELECT: Wholesale Buyer
   
   Expected: Redirected directly to /home
   Expected: Wholesale Buyer Home Screen with:
   ├─ Business Dashboard title
   ├─ B2B Account Status
   ├─ Credit limit display
   ├─ Quick action buttons
   └─ Bulk categories grid
```

---

## NAVIGATION TESTING

### Top Navigation Bar
- [ ] Shows user name in account button
- [ ] Logout button works and returns to welcome
- [ ] Navigation items change based on role
- [ ] Hover states work on desktop
- [ ] Mobile menu is accessible

### Mobile Bottom Navigation
- [ ] Appears on screens < 768px
- [ ] All role-specific items visible
- [ ] Correct active state highlighting
- [ ] Tap navigation works
- [ ] Doesn't cover content

### Role Indicator (Multi-Role Users)
- [ ] Shows current role badge
- [ ] Click badge opens role switcher
- [ ] Can switch between available roles
- [ ] Home page displays new role's dashboard
- [ ] Navigation updates for new role

---

## AUTHENTICATION TESTS

### Sign Up Validation
- [ ] Name required
- [ ] Valid email required
- [ ] Password min 8 characters
- [ ] Passwords must match
- [ ] Terms must be accepted
- [ ] Duplicate email shows error
- [ ] "Email already registered" message is clear

### Sign In
- [ ] Email/password required
- [ ] Invalid credentials show error
- [ ] Remember me checkbox present
- [ ] Forgot password link works
- [ ] Social auth buttons present (stub)

### Forgot Password
- [ ] Email field required
- [ ] Shows "Check your email" after submit
- [ ] Reset link works (test with Firebase console)
- [ ] Back to sign in link works

### Logout
- [ ] Logout clears user data
- [ ] Redirects to /welcome
- [ ] Session is completely cleared
- [ ] Visiting /home redirects back to welcome

---

## ROLE SELECTION TESTS

### UI/UX
- [ ] Three role cards display correctly
- [ ] Colors match specification:
  - [ ] Member: #C9A227 (Gold)
  - [ ] Wholesale: #2E5090 (Blue)
  - [ ] Seller: #0B6B3A (Green)
- [ ] Selected role highlighted
- [ ] Radio button shows selection
- [ ] Benefits list shows for each role

### Functionality
- [ ] Selecting role saves to database
- [ ] Seller role triggers /seller/onboarding
- [ ] Other roles go directly to /home
- [ ] Skip button defaults to Member role
- [ ] Can't continue without selection (button disabled)

---

## SELLER ONBOARDING TESTS

### Step 1: Landing
- [ ] Displays selling value props
- [ ] Why sell on NCDFCOOP section shows
- [ ] "Start Selling" button navigates to step 2

### Step 2: Business Setup
- [ ] All fields required (validation works)
- [ ] Form saves temporarily
- [ ] Next button takes to step 3
- [ ] Back button works

### Step 3: Product Upload
- [ ] Product name required
- [ ] Price validation (numeric)
- [ ] Quantity required
- [ ] MOQ field optional
- [ ] WARNING banner about review is visible
- [ ] Submit saves and goes to step 4

### Step 4: Approval Status
- [ ] Shows 🟡 Pending status
- [ ] "Why Approval Matters" section explains process
- [ ] Options provided (add another, go to dashboard)
- [ ] Links are clickable

### Step 5 (Home)
- [ ] Redirected to /home
- [ ] Seller Dashboard displays
- [ ] Product appears in list with pending status
- [ ] Can manage products from dashboard

---

## STATE MANAGEMENT TESTS

### AuthContext Updates
- [ ] User object updates on login
- [ ] currentRole reflects selected role
- [ ] onboardingCompleted flag sets correctly
- [ ] roleSelectionComplete flag sets correctly
- [ ] Error states display properly

### Data Persistence
- [ ] Refresh page keeps user logged in
- [ ] Close and reopen browser: still logged in
- [ ] User data matches Firestore
- [ ] Role selection persists
- [ ] Onboarding flag persists

### Auto-Login Detection
```
// Test manual flow
1. Log in with email/password
2. Refresh page (Cmd+R / Ctrl+R)
3. Should not see splash/welcome again
4. Should see home screen directly
5. User data should already be loaded
```

---

## EDGE CASES & ERROR SCENARIOS

### Network Errors
- [ ] No internet connection shows error
- [ ] Displays retry button
- [ ] Graceful degradation if API fails

### Invalid State
- [ ] User exists but no role → shows role selection
- [ ] User has role but no onboarding → shows onboarding
- [ ] Accessing protected route without auth → redirects to welcome
- [ ] Accessing seller routes without seller role → shows access denied

### Browser Compatibility
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers
- [ ] Dark mode works

---

## PERFORMANCE CHECKS

### Splash Screen Timing
```
Measure in timings:
- Splash appears: 0ms (instant)
- Duration shown: 2000ms (2 seconds)
- Auto-redirect: Happens at mark
- Total time: Should feel snappy, < 3s total
```

### Component Loading
- [ ] Role selection loads quickly
- [ ] Home screen renders without lag
- [ ] Navigation responsive (< 100ms)
- [ ] Mobile experience smooth

### Bundle Size
```bash
npm run build
# Check .next/static for bundle sizes
# Home screen code should be optimized
```

---

## DATABASE STRUCTURE VALIDATION

### Users Collection
```
For test user should contain:

{
  id: "uid...",
  email: "test@example.com",
  name: "Test User",
  roles: ["seller"],              // NEW
  selectedRole: "seller",         // NEW
  roleSelectionComplete: true,    // NEW
  onboardingCompleted: true,      // NEW
  createdAt: <timestamp>,
  updatedAt: <timestamp>,
  ...existingFields
}
```

Verify in Firebase Console:
- [ ] All new fields present
- [ ] Values correct for test user
- [ ] Nested structure correct

---

## COMMON ISSUES & SOLUTIONS

### Issue: Stuck on Splash Screen
**Solution:** Check browser console for errors, verify Firebase is initialized

### Issue: SignUp Fails Without Error
**Solution:** Check Firebase auth rules, verify email not already registered

### Issue: Doesn't Redirect After Selection
**Solution:** Check Firestore rules allow read/write to users collection

### Issue: Old Navigation Still Shows
**Solution:** Clear browser cache, hard refresh (Ctrl+F5), rebuild app

### Issue: Mobile Layout Broken
**Solution:** Check viewport meta tag, verify Tailwind responsive classes

---

## QUICK DEBUG CHECKLIST

```javascript
// In browser console, test auth context
import { useAuth } from '@/lib/auth/authContext';

const { user, currentRole, onboardingCompleted, roleSelectionComplete } = useAuth();
console.log('User:', user);
console.log('Role:', currentRole);
console.log('Onboarding Complete:', onboardingCompleted);
console.log('Role Selection Complete:', roleSelectionComplete);
```

---

## SIGN-OFF TESTING

Before declaring ready for production:

- [ ] All 4 main scenarios work end-to-end
- [ ] Navigation tests all pass
- [ ] Role-specific screens display correctly
- [ ] Database records created properly
- [ ] Logout and auto-login functional
- [ ] Error cases handled gracefully
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] No console errors
- [ ] Performance acceptable

---

## NEXT STEPS

1. **Testing Phase:** Follow scenarios and checklists above
2. **Feedback:** Note any UI/UX issues
3. **Refinement:** Adjust colors, text, flow based on feedback  
4. **Content:** Add actual product images, real category names
5. **Optimization:** Implement dynamic content loading
6. **Analytics:** Add tracking for key events
7. **Documentation:** Update with any deviations from spec

---

**Last Updated:** April 5, 2026  
**Ready for:** QA Testing
