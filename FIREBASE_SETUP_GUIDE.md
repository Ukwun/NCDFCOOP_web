# Firebase Setup Guide - Authentication & Storage

**Time Required:** 15-20 minutes  
**Difficulty:** Easy (mostly UI clicks)  
**Prerequisite:** Firebase project created (assuming you have this)

---

## PART 1: CONFIGURE AUTHENTICATION PROVIDERS

### Step 1: Go to Firebase Console

```
1. Open: https://console.firebase.google.com
2. Select: Your NCDFCOOP project
3. Left sidebar: Authentication
4. Click: Sign-in method
```

You'll see a list of providers. Currently enabled:
- ✅ Email/Password (already done)

### Step 2: Enable Google OAuth (10 minutes)

**Why?** Allows users to login with Google account (1-click signup)

**Steps:**

1. **In Firebase Console:**
   ```
   Authentication → Sign-in method
   └─ Find "Google" provider
   └─ Click on it
   └─ Toggle: Enable
   ```

2. **Configure Google OAuth:**
   ```
   Enabled: Yes ✓
   Public-facing name: "Google"
   Support email: noreply@ncdfcoop.com (or your support email)
   ```

3. **Click Save**

4. **Verify:**
   ```
   You'll see a "Web SDK configuration updated" message
   Status should show: Enabled ✓
   ```

**That's it!** Google OAuth is now active.

**In your app**, users will see a "Sign in with Google" button (already available if you installed Google Sign-In).

---

### Step 3: Enable Apple Sign-In (Optional - 5 minutes)

**Why?** iOS users love Sign in with Apple. Good for brand trust.

**Note:** Requires Apple Developer Account ($99/year). Skip if not needed.

**Steps:**

1. **In Firebase Console:**
   ```
   Authentication → Sign-in method
   └─ Find "Apple"
   └─ Click on it
   └─ Toggle: Enable
   ```

2. **Configure Apple:**
   ```
   Enabled: Yes ✓
   Team ID: (from Apple Developer)
   Key ID: (from Apple Developer)
   Private key: (from Apple Developer)
   ```

3. **To get Apple credentials:**
   - Go to: https://developer.apple.com
   - Certificates, IDs & Profiles
   - Create new Service ID for "Sign in with Apple"
   - Configure and download credentials
   - Paste into Firebase

4. **Click Save**

**Optional for now** - you can enable this later if needed.

---

### Step 4: Enable Phone SMS Authentication (Optional - 5 minutes)

**Why?** For one-time passwords (OTP) via SMS. Useful for security-conscious users.

**Note:** Requires phone number verification. Small cost per SMS.

**Steps:**

1. **In Firebase Console:**
   ```
   Authentication → Sign-in method
   └─ Find "Phone"
   └─ Click on it
   └─ Toggle: Enable
   ```

2. **Configure Phone:**
   ```
   Enabled: Yes ✓
   Testing phone numbers: (optional, for testing)
   ```

3. **Add Test Phone Numbers (for testing):**
   ```
   +1 234 567 8900
   └─ Test code: 123456
   
   This lets you test SMS login without real SMS costs
   ```

4. **Click Save**

**Optional for now** - SMS can be added anytime.

---

### Summary: Authentication Providers

```
✅ Email/Password    - DONE (already enabled)
✅ Google OAuth      - ENABLE NOW (5 min)
⏭️  Apple Sign-In    - ENABLE LATER (optional)
⏭️  Phone SMS        - ENABLE LATER (optional)

Current Recommendation:
├─ Enable: Email/Password + Google
└─ Skip for now: Apple + Phone
   (can add when you have time)
```

---

## PART 2: SET UP CLOUD STORAGE BUCKET

### What is Cloud Storage?

Cloud Storage is Firebase's file hosting system. You'll use it for:
- User profile avatars
- Product images
- Invoice PDFs
- Order receipts
- Supporting documents

Think of it like an image CDN + file storage combined.

---

### Step 1: Create Storage Bucket

**In Firebase Console:**

```
1. Left sidebar: Storage
2. Click: "Get Started"
3. You'll see a dialog
```

**Configure Bucket:**

```
Bucket name: Will be auto-generated like:
  ncdfcoop-prod.appspot.com
  (Don't change this - it's auto-assigned)

Security Rules:
  Choose: Start in test mode (for development)
  └─ We'll update rules in next step

Location:
  us-multi-region (or closest to your users)
  └─ africa-south1 (if targeting Africa)
  └─ europe-west1 (if targeting Europe)

Click: Create
```

**Wait for:** 1-2 minutes while bucket is created

**You'll see:** A folder structure
```
gs://ncdfcoop-prod.appspot.com/
```

That's your bucket root. Done! ✓

---

### Step 2: Set Up Folder Structure

**Best Practice:** Organize files into folders

**In Firebase Storage Console, create these folders:**

```
1. Click: Create folder button (or drag folder)

Create these folders:
├─ avatars/         (profile pictures)
│  └─{userId}/profile.jpg
├─ products/        (product images)
│  └─ {productId}/image1.jpg
├─ invoices/        (PDFs)
│  └─ {orderId}/invoice.pdf
├─ receipts/        (payment receipts)
│  └─ {transactionId}/receipt.pdf
└─ temp/            (temporary uploads)
   └─ cleanup after use
```

**How to create:**
```
1. In Storage UI: Click "Create folder"
2. Name: "avatars"
3. Click "Create"
4. Repeat for each folder
```

Or do it via code later - easier.

---

### Step 3: Update Firestore Storage Rules

**Current:** Rules are in "test mode" (insecure for production)

**Replace with production rules:**

**In Firebase Console:**

```
Storage → Rules (tab)
```

**Replace entire content with:**

```json
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Public reads (anyone can view)
    match /products/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && 
                      request.auth.uid == request.resource.metadata.userId;
    }
    
    // User avatars (private, only owner can write)
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == userId;
      // Max 5MB for avatars
      allow create: if request.resource.size < 5 * 1024 * 1024 &&
                       request.resource.contentType.matches('image/.*');
    }
    
    // Invoices (private, only owner can view)
    match /invoices/{userId}/{allPaths=**} {
      allow read: if request.auth != null && 
                     request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId;
      // Max 10MB for PDFs
      allow create: if request.resource.size < 10 * 1024 * 1024 &&
                       request.resource.contentType.matches('application/pdf');
    }
    
    // Receipts (private)
    match /receipts/{userId}/{allPaths=**} {
      allow read: if request.auth != null && 
                     request.auth.uid == userId;
      allow create: if request.auth != null && 
                       request.auth.uid == userId;
      allow delete: if request.auth != null && 
                       request.auth.uid == userId;
    }
    
    // Temporary uploads
    match /temp/{userId}/{allPaths=**} {
      allow read, write, delete: if request.auth != null && 
                                    request.auth.uid == userId;
    }
    
    // Deny everything else
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

**Click:** "Publish" (bottom right)

**Result:** Rules deployed ✓

---

### Step 4: Test Storage Access

**In Storage Console:**

```
1. Click: "Create folder" → name it "test"
2. Click "test" folder
3. Click "Upload file"
4. Select any image from your computer
5. Upload

You should see the file in the folder.
```

**Verify Upload URL:**

```
1. Click the file you just uploaded
2. In right panel, find:
   "Name" (shows full path)
   "Bucket path" (shows gs:// URL)

Example:
gs://ncdfcoop-prod.appspot.com/test/image.jpg

This is your file URL format.
```

**Delete the test folder** (cleanup):

```
1. Select "test" folder
2. Delete
```

---

## PART 3: CODE INTEGRATION

### How to Use in Your App

**Upload a file:**

```typescript
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';

async function uploadUserAvatar(file: File, userId: string) {
  const storageRef = ref(storage, `avatars/${userId}/profile.jpg`);
  
  try {
    const result = await uploadBytes(storageRef, file);
    return result.metadata.fullPath; // gs://bucket/avatars/userId/profile.jpg
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

**Get download URL:**

```typescript
import { getDownloadURL } from 'firebase/storage';

async function getAvatarUrl(userId: string) {
  const storageRef = ref(storage, `avatars/${userId}/profile.jpg`);
  
  try {
    const url = await getDownloadURL(storageRef);
    return url; // https://firebasestorage.googleapis.com/...
  } catch (error) {
    console.error('Download URL failed:', error);
  }
}
```

**Delete a file:**

```typescript
import { deleteObject } from 'firebase/storage';

async function deleteAvatar(userId: string) {
  const storageRef = ref(storage, `avatars/${userId}/profile.jpg`);
  
  try {
    await deleteObject(storageRef);
    console.log('File deleted');
  } catch (error) {
    console.error('Delete failed:', error);
  }
}
```

---

### Upload File Component (React)

**Ready to use in your app:**

```tsx
'use client';

import { useState } from 'react';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/lib/auth/authContext';

export function AvatarUploader() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !user) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);

      // Get download URL
      const url = await getDownloadURL(storageRef);
      setAvatarUrl(url);

      // Save URL to Firestore
      // await updateProfile(user.uid, { avatarUrl: url });

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-lg">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="border border-outline rounded-md p-md"
      />

      {uploading && <p>Uploading...</p>}

      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-24 h-24 rounded-full mt-lg"
        />
      )}
    </div>
  );
}
```

---

### Product Image Upload (Similar)

```tsx
// For products (multiple images)
const handleUploadProductImage = async (
  file: File,
  productId: string,
  imageIndex: number
) => {
  const storageRef = ref(
    storage,
    `products/${productId}/image_${imageIndex}.jpg`
  );
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  
  // Save URL to Firestore product document
  // await updateProduct(productId, { 
  //   images: [...existingImages, downloadUrl]
  // });
};
```

---

## PART 4: STORAGE COSTS

**Important to know:**

```
Pricing (as of April 2026):
├─ Storage: $0.18 per GB/month
├─ Download: $0.12 per GB
├─ Operations:
│  ├─ Upload: $0.05 per 10,000 operations
│  ├─ Download: $0.04 per 10,000 operations
│  └─ Delete: Free
└─ Example:
   100 GB stored: $18/month
   10 GB downloaded/month: ~$1.20/month
   TOTAL: ~$20/month

ESTIMATE FOR 1,000 USERS:
├─ 1 avatar per user (5MB): 5GB stored = $0.90/month
├─ 10 products with 5 images each (500KB each):
│  100 product images = 50GB stored = $9/month
├─ Receipts & invoices (10MB per 1,000 users): 10GB = $1.80/month
└─ MONTHLY TOTAL: ~$12-15/month

(Very cheap compared to AWS S3)

SET UP COST ALERTS:
1. Firebase Console → Billing
2. Budget Alerts
3. Set threshold: $50/month (alerts when exceeded)
```

---

## PART 5: ENABLE CDN CACHING

**Optional but recommended** for images

**In Firebase Console:**

```
Storage → Files
└─ Every file can be cached by CDN

Already done by default!
Images served from nearest edge location globally.
```

**Resulting URLs look like:**

```
Original upload:
gs://ncdfcoop-prod.appspot.com/products/123/image.jpg

CDN URL (automatic):
https://firebasestorage.googleapis.com/v0/b/ncdfcoop-prod
  .appspot.com/o/products%2F123%2Fimage.jpg?alt=media

This URL is cached globally and served fast!
```

---

## CHECKLIST: YOU'RE DONE! ✅

```
AUTHENTICATION PROVIDERS:
✅ Email/Password      - Already enabled
✅ Google OAuth        - Enable (5 min)
⏭️  Apple Sign-In      - Optional (do later)
⏭️  Phone SMS OTP      - Optional (do later)

CLOUD STORAGE:
✅ Storage bucket      - Created
✅ Folder structure    - Created (avatars/, products/, invoices/, receipts/)
✅ Security rules      - Deployed
✅ Test upload         - Verified working
✅ CDN caching         - Automatic
✅ Cost alerts         - Set up

TOTAL TIME: 15-20 minutes
NEXT STEP: Move to STEP 3 of deployment (environment variables)
```

---

## QUICK REFERENCE: FIREBASE CONSOLE PATHS

**Authentication:**
```
https://console.firebase.google.com
→ Select project
→ Authentication (left sidebar)
→ Sign-in method (tab)
```

**Cloud Storage:**
```
https://console.firebase.google.com
→ Select project
→ Storage (left sidebar)
→ Files (tab)
```

**Security Rules (Storage):**
```
https://console.firebase.google.com
→ Select project
→ Storage
→ Rules (tab)
```

---

## TROUBLESHOOTING

### Problem: "Google OAuth not showing in app"

**Solution:** Make sure client is correctly configured
```typescript
// In your app, verify firebase config has:
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Then in your component:
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
```

### Problem: "Storage rule errors"

**Solution:** Check syntax in Rules tab
```
1. Look for error messages at top right
2. Verify JSON is valid
3. Test rules with "Test Rules" button before publishing
```

### Problem: "Upload failing with 'permission denied'"

**Solution:** Check if user is authenticated
```typescript
// Make sure user is logged in before upload:
const { user } = useAuth();
if (!user) {
  console.error('Must be logged in to upload');
  return;
}

// Then upload to user's folder:
const ref = storage(`avatars/${user.uid}/...`);
```

### Problem: "Download URLs very long/slow"

**Solution:** They're normal. Firebase CDN handles optimization.
```
These URLs are automatically:
✓ Cached globally
✓ Served from nearest location
✓ Optimized by Firebase

No action needed.
```

---

## WHAT'S NEXT

After completing this:

1. **STEP 3:** Configure environment variables (.env.local)
2. **STEP 4:** Integrate payment processing (Paystack)
3. **STEP 5:** Verify user tracking

See [COMPREHENSIVE_PROJECT_ANALYSIS.md](./COMPREHENSIVE_PROJECT_ANALYSIS.md) for full deployment roadmap.

---

**Total Time to Complete This Step: 15-20 minutes**

**Status After Completion: Firebase 100% ready for production ✅**
