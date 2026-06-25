# E2E Image Upload Analysis Report

## Problem Summary
Product images are broken after running the E2E test against real Firestore with the dev-only publish override removed.

## Root Cause
1. **File Upload Fails in Dev Autologin Mode** (lines 278-286 in `app/seller/products/add/page.tsx`)
   - The `handleFileSelected` function now requires real Firebase authentication: `if (!auth?.currentUser || auth.currentUser.uid !== user.uid)`
   - Dev autologin does NOT have `auth.currentUser` set (it's simulated in localStorage only)
   - Result: File uploads are blocked with error message, but the E2E script doesn't check for this error

2. **E2E Script Falls Back to Placeholder URLs**
   - When file upload fails silently in the E2E test, no upload occurs
   - The form proceeds to publish without an image, defaulting to placeholder
   - The script fills `input[type="url"]` with `https://via.placeholder.com/...` (lines 60, 85 in E2E script)
   - These placeholder URLs may be unreachable or rate-limited

3. **Image Component Can't Load Broken URLs**
   - The products page uses `next/image` (line 489 in `app/seller/products/page.tsx`)
   - It requires valid, accessible image URLs
   - Placeholder URLs from via.placeholder.com may be blocked or unreachable

## Evidence
```
Console errors from products page:
- "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"
- Images in products table show broken/placeholder state
- Dev autologin session enabled (localStorage) but no auth.currentUser
```

## Solution Options

### Option A: Keep Real Firebase Auth Required (Recommended for Production)
✅ **Pros:**
- More secure - prevents unauthorized uploads
- Matches production requirements
- Forces proper Firebase setup

❌ **Cons:**
- Requires test credentials for E2E testing
- Can't test uploads with dev autologin alone

**Implementation:** Provide test Firebase email/password credentials to run the E2E script

### Option B: Allow Dev Autologin for Uploads (Development Only)
✅ **Pros:**
- Enables local E2E testing without Firebase credentials
- Faster iteration during development
- Better for CI/CD in development environments

❌ **Cons:**
- Bypasses auth checks
- Less realistic testing

**Implementation:** Restore `allowDevPublish` flag for dev autologin file uploads only

### Option C: Use Local Image Files in E2E (Workaround)
✅ **Pros:**
- Tests image attachment without Firebase Storage
- Doesn't require auth fixes
- Tests the HTML form input binding

❌ **Cons:**
- Doesn't test Firebase Storage upload
- Images won't be accessible in production
- Limited validation

**Implementation:** Store relative file URLs (e.g., `/images/logo.png`) in dev mode

## Recommendation
**Implement Option A + Option B hybrid:**
1. For production/staging: Use real Firebase auth (Option A)
2. For local development: Add a dev-mode allowlist that permits uploads when using dev autologin + a specific `DEV_MODE_UPLOADS=true` env var
3. Update E2E tests to conditionally use real credentials OR dev mode uploads based on environment

## Next Steps
1. Decide which option matches your testing strategy
2. Update `handleFileSelected()` to implement the chosen approach
3. Update E2E script to handle upload failures gracefully
4. Add error logging to E2E script to catch silent failures
5. Test with real Firebase credentials or implement dev-mode upload bypass
