# Firebase Permissions Fix Guide - E2E Testing

## Executive Summary

The E2E test revealed **two permission issues** preventing real Firebase workflow:

1. **Firestore Role Selection Fallback** - When seller selects their role, Firestore update fails and falls back to localStorage, causing Firestore rules validation failures
2. **Cloud Storage Write Permission Denied** - Image uploads return 403 Unauthorized despite correct path and authenticated user

Both issues prevent the complete seller workflow from executing in production.

---

## Issue #1: Firestore Role Selection Fallback

### Root Cause
File: `lib/auth/authContext.tsx` lines 511-570 (selectRole function)

When user selects "Seller" role:
```typescript
try {
  await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
    roles: arrayUnion(normalizedRole),
    selectedRole: normalizedRole,
    roleSelectionComplete: true,
    updatedAt: Timestamp.now(),
  }, { merge: true });
} catch (err: any) {
  // PROBLEM: Falls back to localStorage on ANY permission error
  if (canFallbackToLocalRole) {
    window.localStorage.setItem('selectedRoleOverride', normalizedRole);
    return; // ❌ Exits without updating Firestore
  }
  throw err;
}
```

### Impact on Product Creation
When user tries to create a product, Firestore rules check:
```
allow create: if isAuthenticated() && (
  request.resource.data.sellerId == request.auth.uid || isAdmin()
);
```

The rule passes! But later rules depend on `currentRole()`:
```
function currentRole() {
  return currentUserDocExists() ? currentUserDoc().data.selectedRole : 'member';
}
```

If the Firestore document still has `selectedRole: 'member'`, functions like `isSeller()` return false.

### Solution A: Ensure Firestore Update Succeeds

**Option 1: Remove localStorage fallback (RECOMMENDED)**
```typescript
// In selectRole function - REMOVE this entire block:
if (canFallbackToLocalRole) {
  // ❌ DELETE THESE LINES
  window.localStorage.setItem('selectedRoleOverride', normalizedRole);
  setCurrentRole(normalizedRole);
  setRoleSelectionComplete(true);
  return;
}

// Instead, throw the error so the user knows something failed
setError(err?.message || 'Failed to select role');
throw err;
```

**Option 2: Add retry logic with delay**
```typescript
let retries = 0;
while (retries < 3) {
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
      roles: arrayUnion(normalizedRole),
      selectedRole: normalizedRole,
      roleSelectionComplete: true,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    break; // Success, exit retry loop
  } catch (err: any) {
    retries++;
    if (retries >= 3) throw err;
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
  }
}
```

**Option 3: Initialize user document earlier**

Modify signup to ensure document is fully initialized:
```typescript
// In signup function, after creating user auth:
const uid = userCredential.user.uid;

// Ensure user document is fully initialized
await setDoc(doc(db, COLLECTIONS.USERS, uid), {
  id: uid,
  email,
  name: name || email.split('@')[0],
  roles: [membershipType],
  selectedRole: membershipType,
  membershipType,
  roleSelectionComplete: false, // ✓ Will be updated in selectRole
  onboardingCompleted: false,
  // ... other fields
}, { merge: true }); // Use merge to prevent overwrites
```

### Recommended Implementation

**Replace lines 511-570 in `lib/auth/authContext.tsx`:**

```typescript
const selectRole = async (role: string) => {
  const normalizedRole = normalizeRoleInput(role);

  try {
    setError(null);
    if (!auth || !db) throw new Error('Firebase not initialized');
    if (!auth.currentUser) throw new Error('No authenticated user available');

    // Attempt to update Firestore with retry logic
    let lastError: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await setDoc(
          doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
          {
            roles: arrayUnion(normalizedRole),
            selectedRole: normalizedRole,
            roleSelectionComplete: true,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        lastError = null;
        break; // Success
      } catch (err: any) {
        lastError = err;
        if (attempt < 2) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }

    if (lastError) {
      // Only throw if all retries failed
      throw lastError;
    }

    // Update localStorage as backup only if Firestore succeeded
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedRoleOverride', normalizedRole);
    }

    setCurrentRole(normalizedRole);
    setRoleSelectionComplete(true);
    if (user) {
      const existingRoles = user.roles || [];
      setUser({
        ...user,
        selectedRole: normalizedRole,
        roleSelectionComplete: true,
        roles: Array.from(new Set([...existingRoles, normalizedRole])),
      });
    }
  } catch (err: any) {
    setError(err?.message || 'Failed to select role');
    throw err;
  }
};
```

---

## Issue #2: Cloud Storage Write Permission Denied

### Root Cause
Upload path: `product-images/dReVFnoYXGRex7d3RKQ8lC9nWqj2/1782328580949_Tomatoes1.png`

Error: `storage/unauthorized` - "User does not have permission to access..."

### Why It's Happening

**Possible Cause #1: Storage Rules Not Deployed**
- The `storage.rules` file exists locally but may not be deployed to Firebase project
- Cloud Storage might be using default rules instead

**Possible Cause #2: Auth Token Timing Issue**
- Firebase SDK might not have fully refreshed auth token
- Upload happens before auth is fully ready

**Possible Cause #3: User Document Missing Role**
- If Issue #1 causes Firestore write to fail, user doesn't have seller role
- (Though this shouldn't affect Storage since Storage only checks auth.uid)

### Solution: Deploy Storage Rules

**Step 1: Verify rules file**
```bash
# Check that rules are present
cat storage.rules
# Should show lines including:
# allow write: if isOwner(userId) &&
#   request.resource.size < 10 * 1024 * 1024 &&
#   request.resource.contentType.matches('image/.*');
```

**Step 2: Deploy rules using Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only storage

# Output should show:
# ✔  storage: Rules have been successfully deployed for [project-id]
```

**Step 3: Verify deployment**
```bash
# Check deployed rules in Firebase Console:
# 1. Go to Firebase Console → Storage → Rules tab
# 2. Confirm rules show product-images pattern with write permission
# 3. Should see: "allow write: if isOwner(userId) && ..."
```

### Solution: Add Auth Token Validation

**In `app/seller/products/add/page.tsx`, modify handleFileSelected:**

```typescript
const handleFileSelected = async (file?: File) => {
  if (!file) return;
  if (!user) {
    setUploadError('You must be logged in to upload images');
    return;
  }

  if (!storage || !auth) {
    setUploadError('Storage is not configured in this environment');
    return;
  }

  const isRealAuth = auth?.currentUser && auth.currentUser.uid === user.uid;
  const isDevMode = isDevAutologin();
  
  if (!isRealAuth && !isDevMode) {
    setUploadError(
      'Image upload requires a real Firebase sign-in. Dev-mode sessions can still save drafts locally, but uploads are disabled.'
    );
    return;
  }

  setUploadError(null);
  setIsUploading(true);
  setUploadProgress(0);

  try {
    // 🔧 NEW: Ensure auth token is fresh before upload
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User authentication lost. Please refresh and try again.');
    }

    // Force token refresh to ensure it's valid
    const idToken = await currentUser.getIdToken(true);
    if (!idToken) {
      throw new Error('Failed to obtain valid authentication token');
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `product-images/${currentUser.uid}/${Date.now()}_${safeFileName}`;
    
    // 🔧 Log for debugging
    console.log('Uploading to path:', path);
    console.log('Auth UID:', currentUser.uid);
    console.log('Token obtained:', !!idToken);

    const ref = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(ref, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(percent);
        },
        (err) => {
          console.error('Upload state changed error:', err);
          setUploadError(err instanceof Error ? err.message : String(err));
          setIsUploading(false);
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData((prev) => ({
            ...prev,
            thumbnail: url,
            images: prev.images && prev.images.length > 0 ? [url, ...prev.images] : [url],
          }));
          setIsUploading(false);
          setUploadProgress(100);
          console.log('Upload successful:', url);
          resolve();
        }
      );
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    
    if (err?.code === 'storage/unauthorized') {
      setUploadError(
        'Permission denied. Make sure:\n' +
        '1. Storage rules are deployed\n' +
        '2. You\'re signed in with a real Firebase account\n' +
        '3. Try refreshing the page and signing in again'
      );
    } else if (typeof err === 'string') {
      setUploadError(err);
    } else if (err instanceof Error) {
      setUploadError(err.message);
    } else {
      setUploadError('Unable to upload image. Please try again.');
    }
  } finally {
    setIsUploading(false);
  }
};
```

---

## Deployment Checklist

- [ ] **Fix #1**: Remove or update localStorage fallback in selectRole function
- [ ] **Fix #2**: Deploy storage.rules to Firebase project using `firebase deploy --only storage`
- [ ] **Fix #3**: Add token refresh and logging to handleFileSelected function
- [ ] **Test**: Run complete E2E flow again:
  ```
  1. Create new seller account
  2. Select "Seller" role
  3. Create wholesale product with all fields
  4. Upload product image
  5. Verify image displays in products list
  6. Test with multiple images (up to 6)
  ```

---

## Testing the Fixes

### Quick Test Script
```bash
# 1. Verify rules are deployed
firebase rules:list

# 2. Create test seller account
# Manual: Visit http://localhost:3000/signup
# Email: test-seller-$(date +%s)@example.com
# Password: TestPass123

# 3. Select Seller role (should succeed in Firestore)
# Check: Firebase Console → Firestore → users collection
# Should show: selectedRole: "seller"

# 4. Create product with image
# Manual: Go to /seller/products/add
# Fill form and upload image
# Check: Firebase Console → Storage → product-images folder
# Should show: product-images/{userId}/{timestamp}_filename.png

# 5. View product list
# Should show: Product name + image thumbnail
```

---

## Production Readiness Metrics

After fixes are applied:

- ✅ Seller role selection persists to Firestore
- ✅ Image uploads succeed without 403 errors
- ✅ Images display in product list
- ✅ Support up to 6 images per product
- ✅ Wholesale pricing stored and displayed
- ✅ Products visible to wholesale buyers with correct pricing
- ✅ Complete seller workflow functional end-to-end
