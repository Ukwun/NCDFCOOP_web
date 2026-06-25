# Production E2E Testing Guide

## Quick Start: Test with Real Firebase Auth

### Step 1: Create Test Seller Account
```bash
# Using Firebase Console or CLI
# Email: test-seller@example.com
# Password: (use secure test password)
```

### Step 2: Set Environment Variables
```bash
# PowerShell
$env:E2E_TEST_EMAIL = "test-seller@example.com"
$env:E2E_TEST_PASSWORD = "your-test-password"
$env:HEADLESS = "false"  # See browser
```

### Step 3: Run E2E Test with Real Auth
```bash
$env:E2E_BASE = "http://localhost:3000"
node ./scripts/e2e/seller-upload-fix2.spec.js
```

### Step 4: Verify Results
✅ **Expected Outcomes:**
1. Signs in with real Firebase credentials (not dev autologin)
2. Creates retail product with image uploaded to Firebase Storage
3. Creates wholesale product with image uploaded to Firebase Storage
4. Products display in `/seller/products` with working image thumbnails
5. Images load from Firebase Storage download URLs

## Troubleshooting

### Images Still Broken?
1. Check Firebase Storage bucket exists: `gs://your-project.appspot.com`
2. Verify Cloud Storage rules allow seller writes: `allow write: if request.auth.uid == resource.metadata.userId`
3. Confirm CORS configured on bucket (for public image serving)

### Upload Fails?
1. Check `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` are valid
2. Verify seller account exists in Firebase Console
3. Check Firebase Storage is initialized in `lib/firebase/config.ts`

### Auth Not Working?
1. Ensure Firebase project credentials in `.env.local`
2. Verify Cloud Storage API is enabled in GCP Console
3. Check `firestore.rules` and `storage.rules` allow required operations

## What's Being Tested

### File Upload Flow
```
1. Select image file with file input
2. Upload to Firebase Storage: `product-images/{userId}/{timestamp}_{filename}`
3. Get download URL: `storage.googleapis.com/...`
4. Store URL in product document
5. Display image in products list using download URL
```

### Product Lifecycle
```
1. Fill form (name, category, price, stock)
2. Attach image file
3. Click "Publish Product"
4. Save to Firestore (if real auth) or localStorage (if dev)
5. Navigate to `/seller/products`
6. Verify product appears with image in table
```

## Expected Test Duration
- Dev Mode (localStorage): ~15-30 seconds
- Real Firebase Mode: ~30-60 seconds (includes Storage upload latency)

## Next Steps After Validation
1. Commit changes: `git add . && git commit -m "Enable E2E testing with file uploads and hybrid dev/prod auth"`
2. Update CI/CD pipeline to run tests with credentials
3. Schedule weekly full E2E runs with production auth
4. Monitor Firebase Storage for test image uploads (clean up as needed)
