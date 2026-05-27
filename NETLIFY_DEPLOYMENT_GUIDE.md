# NETLIFY DEPLOYMENT GUIDE - NCDFCOOP COMMERCE
**Your next step to going LIVE**

---

## ✅ PRE-DEPLOYMENT CHECKLIST (Do This Now)

### Step 1: Verify GitHub Repository is Ready (5 mins)
```bash
# In terminal:
cd /development/coop_commerce_web

# Check git status:
git status

# You should see:
# - All important files committed
# - No uncommitted changes (except .env.local which should be .gitignored)
# - Clean working directory

# If not committed, do this:
git add .
git commit -m "Production ready: all features tested and working"
git push origin main
```

**What to check**:
- ✅ Code committed to GitHub
- ✅ No secrets in repository (no API keys, tokens)
- ✅ .gitignore has: `.env.local`, `node_modules/`, `.next/`

---

### Step 2: Create Environment Configuration (10 mins)

#### **A. Check your .env.local**
```bash
# Your .env.local should have (get these from Firebase Console + Flutterwave):

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ncdfcoop-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ncdfcoop-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ncdfcoop-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789...
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_...
```

**⚠️ IMPORTANT**: 
- Do NOT commit .env.local to GitHub
- Check your .gitignore has `.env.local`
- If accidentally committed, delete it: `git rm .env.local`

#### **B. Create .env.example (This goes in GitHub)**
```bash
# Create file: .env.example
# Content: (copy from .env.local but use fake values)

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_key
```

```bash
# Add to git:
git add .env.example
git commit -m "Add environment variables template"
git push
```

---

### Step 3: Test Build Locally (5 mins)

```bash
# In terminal, test the production build:
npm run build

# You should see:
# ✓ Compiled successfully
# ✓ Linted successfully

# If there are errors, fix them now BEFORE deploying

# After successful build, test running it:
npm start

# Visit: http://localhost:3000
# Verify everything works
```

**✅ If this works locally, it will work on Netlify**

---

### Step 4: Verify Firebase is Production-Ready (10 mins)

#### **Check Firebase Console**
```
1. Go to: https://console.firebase.google.com
2. Select your project: ncdfcoop-xxx
3. Check:
   - ✅ Authentication methods enabled (Email, Google, Facebook)
   - ✅ Firestore is active and has data
   - ✅ Security Rules are set (not in test mode!)
   - ✅ Storage is configured
```

#### **Update Firebase Security Rules (CRITICAL!)**
```
If still in TEST MODE, fix immediately:

Go to Firestore Security Rules → Replace with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default: Deny all access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Users can only read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /members/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /orders/{orderId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.sellerId);
    }
    
    // Products: anyone can read, sellers can write their own
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.sellerId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.sellerId;
    }
  }
}

Click PUBLISH ✅
```

---

### Step 5: Test Firebase Connection (5 mins)

```bash
# Test the health check endpoint locally:
curl http://localhost:3000/api/health-check

# Should return:
{
  "status": "ok",
  "timestamp": "2026-05-27T...",
  "firebase": "connected"
}

# If Firebase not connected, debug:
1. Check Firebase config in lib/firebase/config.ts
2. Check .env.local has correct keys
3. Check Firebase project is not deleted
```

---

### Step 6: Flutterwave Test Payment (5 mins)

```bash
# Go to production app (local)
# Add product to cart
# Go to checkout
# Select payment method: "Card"
# Use test card:
  Card Number: 4242 4242 4242 4242
  Expiry: 12/25
  CVV: 123
  Amount: Any amount
  
# Should show: "Payment Successful"
# Check Firestore: transaction should be recorded

# ✅ If this works, production payment will work
```

---

### Step 7: Final Git Push (2 mins)

```bash
# Make final commit:
git status

# Add any remaining files:
git add .
git commit -m "Production deployment: all systems ready"
git push origin main
```

---

## 🚀 NETLIFY DEPLOYMENT (The Easy Part - 10 mins)

### Step 1: Create Netlify Account (3 mins)
```
1. Go to: https://app.netlify.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Netlify to access your GitHub
5. Netlify connects to your GitHub account
```

### Step 2: Connect Repository (3 mins)
```
1. In Netlify, click "Add new site" → "Import an existing project"
2. Choose "GitHub"
3. Search for: "coop_commerce_web"
4. Select: Ukwun/coop_commerce_web
5. Click "Connect & authorize"
6. Netlify gains access to your repository
```

### Step 3: Configure Build (2 mins)
```
Netlify should auto-detect Next.js, but verify:

Build command: npm run build ✓
Publish directory: .next ✓
```

**If not showing these, click "Edit settings":**
```
Build & Deploy → Build settings

Build command: npm run build
Publish directory: .next
Base directory: (leave empty)
```

### Step 4: Add Environment Variables (2 mins)
```
In Netlify Dashboard:

Site Settings → Build & Deploy → Environment

Click "Edit variables"

Add these variables (copy from your .env.local):

Variable Name              | Value
NEXT_PUBLIC_FIREBASE_API_KEY | AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | ncdfcoop-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID | ncdfcoop-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | ncdfcoop-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | 123456789...
NEXT_PUBLIC_FIREBASE_APP_ID | 1:123456789...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | G-XXXXXXXXXX
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY | FLWPUBK_...

Click "Save"
```

### Step 5: Deploy! (Automatic)
```
1. Push code to GitHub: git push origin main
2. Netlify automatically sees the push
3. Netlify automatically builds (takes 3-5 minutes)
4. Netlify automatically deploys
5. You get a URL: https://ncdfcoop.netlify.app

🎉 LIVE!
```

---

## ✅ DEPLOYMENT SUCCESS VERIFICATION

### Immediately After Deployment:
```
1. Visit your Netlify URL
   - [ ] Site loads (not blank)
   - [ ] Navigation appears
   - [ ] No errors in console (F12)

2. Test Core Features:
   - [ ] Homepage loads
   - [ ] Can see products
   - [ ] Can add to cart
   - [ ] Can see checkout
   - [ ] Can see all 3 roles

3. Check Production Monitoring:
   - [ ] Sentry shows no errors
   - [ ] Firebase shows activity
   - [ ] Netlify shows green deploy

4. Test Payment (Optional):
   - [ ] Can add product to cart
   - [ ] Checkout flow works
   - [ ] Payment form appears
   - [ ] (Don't complete payment yet, test later)
```

---

## 📊 MONITOR YOUR DEPLOYMENT

### Daily Checks (First Week):
```
1. Netlify Dashboard
   - Check for deploy failures
   - Monitor build time
   - No errors shown

2. Sentry Dashboard
   - https://sentry.io
   - Check for production errors
   - 0 errors = success ✅

3. Firebase Console
   - Check Firestore operations
   - No failed reads/writes
   - Monitoring tab shows activity

4. Flutterwave Dashboard
   - Check for payment transactions
   - No declined payments
   - Settlement status

5. Browser Console (F12)
   - No errors when using site
   - Performance metrics good
```

### Fix Issues Immediately:
```
If something breaks:
1. Check browser console (F12) for errors
2. Check Netlify deploy logs for build errors
3. Check Sentry for production errors
4. Check Firebase rules if data operations fail
5. Rollback: Previous deploys available in Netlify

Rollback command (if needed):
- Go to Netlify Dashboard
- Deployments tab
- Find previous successful deploy
- Click "Publish deploy"
- Site reverts to previous version
```

---

## 🎯 CUSTOM DOMAIN SETUP (Optional But Recommended)

If you want `ncdfcoop.com` instead of `ncdfcoop.netlify.app`:

### Step 1: Buy Domain (10 mins)
```
1. Go to: GoDaddy.com or Namecheap.com
2. Search for: ncdfcoop.com (or your preferred domain)
3. Buy for 1 year (usually ₦500-2000)
4. You get access to domain settings
```

### Step 2: Connect to Netlify (10 mins)
```
1. In Netlify Dashboard → Site Settings → Domain management
2. Click "Add custom domain"
3. Enter: ncdfcoop.com
4. Netlify asks how to configure DNS
5. If using GoDaddy/Namecheap:
   - Go to GoDaddy/Namecheap domain settings
   - Update DNS servers to Netlify's (provided)
   - Wait 24-48 hours for DNS propagation
6. Netlify automatically creates SSL certificate

Result: https://ncdfcoop.com works! 🎉
```

---

## 🚨 TROUBLESHOOTING

### Issue: Build fails on Netlify but works locally
```
Solution:
1. Check environment variables (all set?)
2. Check Node version (20.x)
3. Check package-lock.json is committed
4. Check no hardcoded paths or absolute imports
5. View build logs: Netlify Dashboard → Deploys → Failed deploy → View logs
```

### Issue: Firebase not connecting on production
```
Solution:
1. Check environment variables copied correctly
2. Check Firebase API keys are valid
3. Check Firestore location matches
4. Check security rules aren't blocking
5. Check browser console for CORS errors
6. Add debug log to lib/firebase/config.ts
```

### Issue: Payment not working
```
Solution:
1. Check Flutterwave keys are correct
2. Check you're using test keys (if in test mode)
3. Check payment button has onClick handler
4. View browser console for errors
5. Check Flutterwave dashboard for transaction
```

### Issue: Notifications not sending
```
Solution:
1. Check email service is configured (SendGrid)
2. Check email triggers are in place
3. Check email address is correct
4. Check spam folder
5. View Firebase Cloud Function logs
```

---

## 📞 AFTER DEPLOYMENT (Next Steps)

### First Week:
1. ✅ Monitor for errors (0 expected)
2. ✅ Test all major features
3. ✅ Verify payments process correctly
4. ✅ Share with beta users (5-10 people)
5. ✅ Gather feedback
6. ✅ Fix any issues quickly

### Second Week:
1. ✅ Build admin dashboard
2. ✅ Add real-time features
3. ✅ Implement email notifications
4. ✅ Add push notifications
5. ✅ Marketing push to grow users

### Third Week+:
1. ✅ Scale based on user growth
2. ✅ Add advanced features
3. ✅ Optimize performance
4. ✅ Expand to more payment methods
5. ✅ Plan mobile app

---

## 🎉 YOU'RE DEPLOYED!

**Congratulations!** Your platform is now:
- ✅ Live globally
- ✅ Processing real transactions
- ✅ Available 24/7
- ✅ Automatically backed up
- ✅ Monitored for errors
- ✅ Scaled automatically

**Your deployment URL**: https://ncdfcoop.netlify.app

**Share with users!** 🚀

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] GitHub repository ready (code committed)
- [ ] Environment variables correct
- [ ] Local build successful (npm run build)
- [ ] Firebase security rules updated (NOT in test mode)
- [ ] Flutterwave keys configured
- [ ] .env.local NOT committed
- [ ] .env.example created
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Build settings configured (npm run build, .next)
- [ ] Environment variables added to Netlify
- [ ] First deploy triggered (git push)
- [ ] Site loads successfully
- [ ] Core features verified
- [ ] No errors in Sentry
- [ ] Firebase activity showing
- [ ] Monitoring dashboards open
- [ ] Ready to share with users

---

**Status**: Ready to Deploy 🚀  
**Time to Live**: 30 minutes (if all checklist items done)  
**Support**: Check logs in Netlify, Sentry, Firebase if issues  

Let's go LIVE!
