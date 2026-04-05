# 🚀 Deployment Checklist - NCDF COOP Commerce Platform

Complete these steps in order to deploy the application to production.

---

## ✅ Phase 1: Pre-Deployment Setup (Local Machine)

### Step 1: Install Dependencies
```bash
npm install
```

**Expected:** All packages installed without errors
**Time:** ~2 minutes

---

### Step 2: Firebase Project Setup

1. Go to https://firebase.google.com
2. Click "Get Started"
3. Create new project:
   - **Project Name:** ncdfcoop-commerce
   - **Enable Google Analytics:** Yes (optional)
4. Wait for project creation (~1 minute)

---

### Step 3: Get Firebase Credentials

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Switch to **Service Accounts** tab
3. Click "Generate New Private Key"
4. Copy the credentials
5. In Console, go to **Project Settings** → **General**
6. Scroll to "Your apps" section
7. Copy these values:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```

---

### Step 4: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create Database"
3. Select:
   - **Region:** nam5 (US East) - or nearest to your users
   - **Mode:** Start in production mode
4. Click "Create"
5. Once created, create collections:

```
Collections to create:
- users (uid as document ID)
- members (uid as document ID)
- products (auto-generated ID)
- orders (auto-generated ID)
- messages (auto-generated ID)
- offers (auto-generated ID)
- transactions (reference as document ID)
- conversations (auto-generated ID)
- loyalty_points (uid as document ID)
- cart_items (userId_productId as document ID)
```

---

### Step 5: Configure Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password**:
   - Click the "Email/Password" option
   - Toggle "Enable"
   - Keep "Email link (passwordless sign-in)" disabled
4. Click "Save"

---

### Step 6: Setup Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. (Optional) Add Paystack public key:
   ```env
   NEXT_PUBLIC_PAYSTACK_KEY=pk_live_xxxxx  # or pk_test_xxxxx for testing
   ```

4. (Optional) Add Google Analytics ID:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

---

### Step 7: Setup Email Service (Choose One)

#### Option A: SendGrid
1. Go to https://sendgrid.com
2. Sign up and verify email
3. Go to **Settings → API Keys**
4. Click "Create API Key"
5. Name it "NCDF COOP" and create
6. Copy the API key
7. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```
8. Install library:
   ```bash
   npm install @sendgrid/mail
   ```
9. Update `/app/api/email/send/route.ts` with SendGrid code (see EMAIL_SERVICE_SETUP.md)

#### Option B: Mailgun
1. Go to https://mailgun.com
2. Sign up and verify domain
3. Go to **Settings → API Keys**
4. Copy your API key
5. Add to `.env.local`:
   ```env
   MAILGUN_API_KEY=key-xxxxxxxxxxxxx
   MAILGUN_DOMAIN=mail.yourdomain.com
   ```
6. Install libraries:
   ```bash
   npm install mailgun.js form-data
   ```
7. Update `/app/api/email/send/route.ts` with Mailgun code (see EMAIL_SERVICE_SETUP.md)

---

### Step 8: Test Locally

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in browser

3. Test these flows:
   - [ ] Signup with mock email
   - [ ] Login with new credentials
   - [ ] View home screen (HomeScreen)
   - [ ] Make a deposit
   - [ ] View offers (OfferScreen)
   - [ ] Send a message (MessageScreen)
   - [ ] Add item to cart (CartScreen)
   - [ ] Test checkout (review order summary)

4. Check browser console for errors
5. Check terminal for server errors

---

## ✅ Phase 2: Deploy to Netlify

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: NCDF COOP Commerce Platform"
git branch -M main
git remote add origin https://github.com/your-username/coop-commerce.git
git push -u origin main
```

---

### Step 2: Create Netlify Account

1. Go to https://netlify.com
2. Click "Sign up"
3. Choose "GitHub" for authentication
4. Allow Netlify to access your GitHub account
5. Verify email

---

### Step 3: Connect Repository to Netlify

1. In Netlify Dashboard, click "Add new site"
2. Choose "Import an existing project"
3. Select "GitHub"
4. Find your `coop-commerce` repository
5. Click "Import"
6. Configure build settings:
   - **Base directory:** (leave empty)
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
7. Click "Deploy site"

**Note:** First deployment will fail because ENV vars aren't set yet.

---

### Step 4: Add Environment Variables

1. In Netlify dashboard, go to **Site settings**
2. Click **Build & deploy → Environment**
3. Click **Edit variables**
4. Add all variables from your `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_PAYSTACK_KEY (optional)
   NEXT_PUBLIC_GA_ID (optional)
   SENDGRID_API_KEY or MAILGUN_API_KEY (if using email)
   SENDGRID_FROM_EMAIL or MAILGUN_DOMAIN (if using email)
   ```
5. Click "Save"

---

### Step 5: Trigger Redeploy

1. Go back to **Builds** in Netlify
2. Click "Trigger deploy"
3. Select "Clear cache and redeploy"
4. Wait for deployment to complete (~3-5 minutes)
5. Once complete, click the preview link to test

**Expected:** Site loads without errors

---

### Step 6: Configure Firebase for Netlify Domain

1. In Firebase Console, go to **Authentication → Settings**
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add your Netlify domain (e.g., `ncdfcoop.netlify.app`)
5. Click "Save"

---

### Step 7: Test Live Site

Test the live deployment:
1. [ ] Load homepage
2. [ ] Test signup (use temporary email or Mailinator)
3. [ ] Test login
4. [ ] Make deposit  
5. [ ] View offers
6. [ ] Send message
7. [ ] Add to cart
8. [ ] Start checkout (test payment button appears)
9. [ ] Check browser console for errors
10. [ ] Test on mobile device

---

## ✅ Phase 3: Post-Deployment Configuration

### Step 1: Setup Paystack Account (if using payments)

1. Go to https://paystack.com
2. Sign up for Nigerian business account
3. Complete business verification
4. Go to **Settings → API Keys & Webhooks**
5. Copy **Public Key**
6. Add to Netlify environment variables as `NEXT_PUBLIC_PAYSTACK_KEY`

**IMPORTANT:** 
- Use `pk_test_xxxxx` for testing
- Switch to `pk_live_xxxxx` when going live
- Test transactions thoroughly before accepting real money

---

### Step 2: Setup Payment Webhooks

1. In Paystack dashboard, go to **Settings → API Keys & Webhooks**
2. Add webhook:
   - **URL:** `https://yourdomain.netlify.app/api/paystack/webhook`
   - **Events:** Select "charge.success" and "charge.failed"
3. Save webhook

*Note: You'll need to implement the webhook handler in Next.js API routes*

---

### Step 3: Configure Firestore Security Rules

Replace default Firestore rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own documents
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    match /members/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    match /cart_items/{userId_productId} {
      allow read, write: if request.auth.uid == extractUserId(userId_productId);
    }
    
    // Public reads only
    match /offers/{document=**} {
      allow read: if request.auth != null;
    }
    
    match /products/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Orders - user can only read their own
    match /orders/{orderId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Messages
    match /conversations/{convId} {
      allow read, write: if request.auth.uid in resource.data.participants;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth.uid in [resource.data.senderId, resource.data.recipientId];
    }
    
    function extractUserId(str) {
      return str.split('_')[0];
    }
  }
}
```

---

### Step 4: Monitor Deployment

1. In Netlify, set up email notifications:
   - Site settings → Email notifications
   - Enable "Failed deploy" alerts

2. Set up monitoring:
   - Google Analytics: Check real-time data
   - Cloud Firestore: Monitor read/write operations
   - Netlify Analytics: Track site performance

---

## ✅ Phase 4: Launch & Go Live

### Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Email service working
- [ ] Paystack test payments working
- [ ] All 5 screens tested on mobile
- [ ] Dark mode verified
- [ ] Firestore rules applied
- [ ] Analytics events firing
- [ ] Error logging working
- [ ] Support email configured
- [ ] Terms & Privacy pages created (if needed)

### Launch Steps

1. **Domain Setup** (if using custom domain)
   - Add Netlify nameservers to domain registrar
   - Wait for DNS propagation (up to 24 hours)
   - Netlify will auto-provision SSL certificate

2. **Switch Paystack to Live**
   - Update `NEXT_PUBLIC_PAYSTACK_KEY` to live key
   - Test one payment thoroughly
   - Train support staff on refund process

3. **Announce Launch**
   - Email existing members
   - Update marketing materials
   - Share on social media
   - Brief support team

---

## 🆘 Troubleshooting Common Issues

### "Failed to initialize Firebase"
- Check API keys in `.env.local` / Netlify environment
- Verify Firebase project exists
- Confirm Netlify domain is authorized in Firebase

### "Email not sending"
- Check SendGrid/Mailgun API key
- Verify email service endpoint is correct
- Test with curl: 
  ```bash
  curl -X POST https://yourdomain.com/api/email/send \
    -H "Content-Type: application/json" \
    -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
  ```

### "Payment button not working"
- Verify Paystack key is public key (starts with `pk_`)
- Check PaystackPop script loads in browser console
- Test on actual domain (localhost won't work with Paystack)

### "Cart not persisting"
- Verify user is authenticated
- Check Firebase read/write permissions
- Look for Firestore errors in browser console

### "Messages disappearing"
- Check Firebase conversation creation
- Verify message sender/recipient UIDs
- Check Firestore security rules

---

## 📊 Post-Launch Monitoring

### Log Into Tools
1. **Netlify Dashboard**: Monitor deployments
2. **Firebase Console**: Check performance
3. **Google Analytics**: Track user behavior
4. **Email Service Dashboard**: Monitor deliverability

### Key Metrics to Monitor
- Daily active users
- Conversion rate (signup → order)
- Payment success rate
- Email delivery rate
- Firestore read/write operations
- Website performance (Lighthouse)

---

## 🎓 Reference Links

| Service | Documentation |
|---------|---------------|
| Netlify | https://docs.netlify.com |
| Firebase | https://firebase.google.com/docs |
| Next.js | https://nextjs.org/docs |
| Paystack | https://paystack.com/docs |
| SendGrid | https://docs.sendgrid.com |
| Mailgun | https://documentation.mailgun.com |

---

## 🎉 You're Live!

Once you complete all these steps, your NCDF COOP Commerce Platform will be:
- ✅ Live on the web
- ✅ Accepting member signups
- ✅ Processing deposits
- ✅ Sending emails
- ✅ Processing Paystack payments
- ✅ Tracking user analytics
- ✅ Fully backed by Firebase

---

**Estimated Total Time:** 1-2 hours (depending on email service setup)

**Questions?** Check:
1. INSTALLATION_GUIDE.md - Initial setup
2. EMAIL_SERVICE_SETUP.md - Email configuration
3. Service documentation links above
4. Netlify support: https://support.netlify.com

---

**Ready to deploy? Let's go! 🚀**
