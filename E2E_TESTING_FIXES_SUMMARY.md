# E2E Real-User Testing - Fixes Applied & Testing Plan

## What Was Wrong

1. **Firestore Role Selection** - When sellers selected "Seller" role, the update was silently falling back to localStorage, causing Firestore rules validation to fail later
2. **Storage Permissions** - Image uploads were blocked due to unauthenticated or stale auth tokens

## Fixes Applied

### ✅ Fix #1: selectRole Function (lib/auth/authContext.tsx)

**Changed:**
- Removed silent localStorage fallback on permission errors
- Added retry logic with exponential backoff (300ms, 600ms)
- Now throws error if all retries fail (tells user something went wrong)

**Result:**
- Seller role MUST be successfully saved to Firestore
- Firestore rules validation will work correctly
- User gets proper error feedback if role selection fails

### ✅ Fix #2: Image Upload Handler (app/seller/products/add/page.tsx)

**Changed:**
- Added auth token refresh before upload
- Added detailed logging for debugging
- Improved error messages for different failure scenarios
- Better handling of Cloud Storage specific errors

**Result:**
- Auth token is guaranteed to be fresh when upload starts
- User gets helpful error messages if upload fails
- Upload failures can be debugged via console logs

### ⚠️ Fix #3: Cloud Storage Rules - STILL NEEDED

**Status:** Rules file exists but needs to be deployed to Firebase

**Required Action:**
```bash
# Deploy storage rules to Firebase project
firebase deploy --only storage

# Verify deployment succeeded:
# - Go to Firebase Console → Storage → Rules tab
# - Should see the rules with product-images pattern
```

---

## Testing Plan - Complete E2E Workflow

### Pre-Test Requirements
```
✓ npm run build succeeds locally
✓ npm run dev is running on http://localhost:3000
✓ Have new test email ready (e.g., test-seller-TIMESTAMP@example.com)
✓ Have test password ready (e.g., TestPass123)
✓ Have test image ready (any .png or .jpg file < 10MB)
```

### Test Steps

#### Phase 1: Account & Role Setup
```
1. Open http://localhost:3000/signup
   - Email: test-seller-$(date +%s)@example.com
   - Password: TestPass123
   - Continue through signup

2. Select Seller Role
   - Click "Start Selling" (🚀 icon)
   - Verify: Page redirects to /home WITHOUT error
   
3. Verify Firestore User Document
   - Open Firebase Console → Firestore
   - Go to users collection
   - Find document with your uid
   - Check selectedRole field = "seller" ✓ (THIS WAS BROKEN, NOW FIXED)
```

#### Phase 2: Product Creation
```
4. Navigate to /seller/products/add
   - Click "Add New Product" or go directly to URL

5. Fill Product Form
   - Name: "Test Wholesale Product"
   - Description: "This is a test product"
   - Category: Vegetables
   - Listing Type: Wholesale (should reveal MOQ field)
   - Price: 1500
   - Wholesale Price: 35000
   - MOQ: 1
   - Stock: 100
   - Unit: Kilogram
   
   - Leave image blank for now
   - Click "Save as Draft"
   
6. Verify Product Created
   - Redirects to /seller/products
   - Table shows: "Test Wholesale Product" with price 1500
```

#### Phase 3: Image Upload (CRITICAL TEST)
```
7. Go back to /seller/products/add
   - Click "Add New Product" again
   - Fill form same as Phase 2, Step 5

8. Upload Image
   - Find "Upload Product Image" section
   - Select test image file (Tomatoes.png, etc.)
   - Wait for upload to complete
   
   EXPECTED OUTCOMES:
   - ✅ BEST: Upload succeeds, shows progress 0-100%, image URL appears
   - ⚠️  EXPECTED (if storage rules not deployed): 
        Error message: "Permission denied: You do not have permission..."
        → This means rules need to be deployed via: firebase deploy --only storage
   
9. If Upload Succeeds
   - Image URL visible in form
   - Click "Publish Product"
   - Product appears in list WITH IMAGE thumbnail
   
10. If Upload Fails
    - Note the error message
    - Check browser console for [Image Upload] logs
    - Follow "Fixing Storage Permissions" section below
```

#### Phase 4: Multi-Image Support (if upload works)
```
11. Create Another Product
    - Fill form again
    - Upload first image, wait for completion
    - Try uploading SECOND image (should append to list)
    - Verify form shows: [thumbnail, image2] in images array
    
    Note: Code supports up to 6 images per product
          Update form validation if needed to enforce limit
```

#### Phase 5: Verification in Products List
```
12. View Products List
    - Navigate to /seller/products
    - Table should show:
      ✓ Product name
      ✓ Category
      ✓ Price
      ✓ Stock quantity
      ✓ Image thumbnail (if uploaded)
      ✓ Edit button
      ✓ Delete button

13. Check Product Details (if available)
    - Click product name or view button
    - Should show:
      ✓ All images uploaded
      ✓ Wholesale pricing info
      ✓ MOQ field
      ✓ Description
      ✓ Category
```

---

## Fixing Storage Permissions (if needed)

### Symptom
Upload fails with: `Permission denied: You do not have permission to upload images`

### Root Cause
Cloud Storage security rules have not been deployed to Firebase project

### Fix
```bash
# 1. Verify rules file exists and looks correct
cat storage.rules | grep "product-images" -A 5

# 2. Deploy to Firebase
firebase login          # Sign in if not already
firebase deploy --only storage

# 3. Verify deployment
# Go to Firebase Console → Storage → Rules tab
# Look for: match /product-images/{userId}/{allPaths=**}
# Should see: allow write: if isOwner(userId) && ...

# 4. Wait 30 seconds for rules to propagate globally
sleep 30

# 5. Try upload again in browser
```

### Verification
- Upload succeeds (progress bar reaches 100%)
- Image URL appears in form
- No console errors about permissions

---

## Success Criteria

✅ **Phase 1: Role Setup** - Seller role successfully saved to Firestore
✅ **Phase 2: Product Creation** - Products created without errors  
✅ **Phase 3: Image Upload** - Images upload successfully OR clear deployment steps provided
✅ **Phase 4: Multi-Image** - Multiple images per product work (if upload works)
✅ **Phase 5: Display** - Images show in products list with correct metadata

---

## Troubleshooting

### Issue: "Firebase not initialized"
**Fix:** Ensure Firebase config is loaded
```bash
# Check that lib/firebase/config.ts exports: auth, db, storage
grep "export" lib/firebase/config.ts
```

### Issue: "No authenticated user available"
**Fix:** User isn't properly authenticated
```bash
# In browser console:
firebase.auth().currentUser
# Should show user object with uid, email, etc.
```

### Issue: Upload path incorrect
**Fix:** Check path construction
```bash
# Console will log: [Image Upload] Path: product-images/[uid]/[timestamp]_[filename]
# Verify uid matches what you signed in with
```

### Issue: Rules syntax error
**Fix:** Validate rules file
```bash
firebase rules:list
# Should show valid rules deployed
```

---

## Next Steps After Testing

If all tests pass:
1. Document test results in project
2. Run production build test
3. Set up CI/CD deployment pipeline
4. Plan production launch

If tests fail:
1. Check console logs for [Image Upload] entries
2. Verify Storage rules deployed correctly
3. Check Firebase Console for any service outages
4. Retry with fresh authentication

---

## Files Changed
- `lib/auth/authContext.tsx` - Fixed selectRole function
- `app/seller/products/add/page.tsx` - Enhanced image upload with token refresh
- `FIREBASE_PERMISSIONS_FIX_GUIDE.md` - Detailed fix documentation
- `REAL_USER_E2E_TEST_REPORT.md` - Testing report and findings

## Files Still Need Action
- `storage.rules` - Deploy using `firebase deploy --only storage`
- `firestore.rules` - Already correct, no changes needed
