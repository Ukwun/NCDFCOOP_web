# 🔐 ENVIRONMENT VARIABLES SETUP GUIDE

**Complete guide to setting up all required environment variables for production deployment**

---

## 📋 OVERVIEW: Where to Set Variables

| Location | Purpose | Visibility |
|----------|---------|-----------|
| `.env.local` | Local development (NOT committed to git) | Developer machine only |
| Netlify Dashboard | Production on Netlify | Live site only |
| GitHub Secrets | GitHub Actions CI/CD | Actions runner only |

---

## 1️⃣ LOCAL DEVELOPMENT SETUP (.env.local)

### **Create `.env.local` File**
```bash
cp .env.example .env.local
nano .env.local  # Edit with your values
```

### **⚠️ IMPORTANT:**
- `.env.local` is in `.gitignore` - NEVER commit secrets to git
- Only you see these values on your machine
- Must add values before running `npm run dev` or `npm run build`

### **Complete `.env.local` File**

```bash
# ============================================
# 🔥 FIREBASE CONFIGURATION
# ============================================
# Get from: Firebase Console → Project Settings → Your apps → Web app

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBu5HDs_wuhKy7A5sCjdvNZY4t5vnZ6Fag
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coop-commerce-8d43f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coop-commerce-8d43f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coop-commerce-8d43f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=962109579563
NEXT_PUBLIC_FIREBASE_APP_ID=1:962109579563:web:a0fa92699be3cf861ee56e

# ============================================
# 💳 FLUTTERWAVE PAYMENT GATEWAY
# ============================================
# Get from: Flutterwave Dashboard → Settings → API Keys

# TEST KEYS (Use for development - no real charges)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_3328123ad3e7bc829368f627963094733e5647b0
FLUTTERWAVE_SECRET_KEY=sk_test_7ffa54e85c90861976aad3b51f2c5ffbdb1bdd7c

# PRODUCTION KEYS (Switch before launching)
# NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
# FLUTTERWAVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# ============================================
# 🚨 SENTRY ERROR TRACKING
# ============================================
# Get from: Sentry Dashboard → Settings → Auth Tokens → Create New Token
# See SENTRY_SETUP_GUIDE.md for detailed instructions

NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn-goes-here@ingest.sentry.io/project-id
SENTRY_AUTH_TOKEN=sntryu_your-auth-token-goes-here
SENTRY_ORG=8-gigabytes
SENTRY_PROJECT=javascript-nextjs
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_SKIP_AUTO_RELEASE=false

# ============================================
# 📧 EMAIL SERVICE (Optional - for order confirmations)
# ============================================

# Option 1: SENDGRID
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@ncdfcoop.com

# Option 2: MAILGUN
# MAILGUN_API_KEY=your-mailgun-api-key-here
# MAILGUN_DOMAIN=mail.ncdfcoop.com

# ============================================
# 🏦 BANK ACCOUNT DETAILS (For manual transfers)
# ============================================
# These are NEXT_PUBLIC so they appear in client code (secure to do so - no secrets)

NEXT_PUBLIC_BANK_ACCOUNT_NAME=NCDFCOOP Commerce
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=1234567890
NEXT_PUBLIC_BANK_NAME=First Bank Nigeria
NEXT_PUBLIC_BANK_SORT_CODE=011

# ============================================
# 📊 ANALYTICS
# ============================================

NEXT_PUBLIC_GA_MEASUREMENT_ID=G-9TZPP2SJ05
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# ============================================
# 🔧 APPLICATION CONFIGURATION
# ============================================

NODE_ENV=development
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOG_LEVEL=debug
```

---

## 2️⃣ NETLIFY PRODUCTION SETUP

### **Step-by-Step: Add Variables to Netlify Dashboard**

1. Go to: https://app.netlify.com
2. Select your site
3. Click "Site settings"
4. Go to "Build & deploy" → "Environment"
5. Click "Edit variables"
6. Add each variable one by one:

### **Variable 1-6: Firebase**
```
Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyBu5HDs_wuhKy7A5sCjdvNZY4t5vnZ6Fag
[Save]

Key: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: coop-commerce-8d43f.firebaseapp.com
[Save]

Key: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: coop-commerce-8d43f
[Save]

Key: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: coop-commerce-8d43f.appspot.com
[Save]

Key: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 962109579563
[Save]

Key: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:962109579563:web:a0fa92699be3cf861ee56e
[Save]
```

### **Variable 7-8: Flutterwave**
```
Key: NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY
Value: pk_test_3328123ad3e7bc829368f627963094733e5647b0
[Save]

Key: FLUTTERWAVE_SECRET_KEY
Value: sk_test_7ffa54e85c90861976aad3b51f2c5ffbdb1bdd7c
[Save]

⚠️ IMPORTANT: Before launch, update to LIVE keys from Flutterwave dashboard!
```

### **Variable 9-13: Sentry**
```
Key: NEXT_PUBLIC_SENTRY_DSN
Value: [Get from Sentry project settings - see SENTRY_SETUP_GUIDE.md]
[Save]

Key: SENTRY_AUTH_TOKEN
Value: [Get from https://sentry.io/settings/auth-tokens - see SENTRY_SETUP_GUIDE.md]
[Save]

Key: SENTRY_ORG
Value: [Your Sentry organization name]
[Save]

Key: SENTRY_PROJECT
Value: [Your Sentry project name]
[Save]

Key: NEXT_PUBLIC_SENTRY_ENVIRONMENT
Value: production
[Save]

Key: SENTRY_SKIP_AUTO_RELEASE
Value: false
[Save]
```

### **Variable 14-15: Email Service**
```
Key: SENDGRID_API_KEY
Value: your-sendgrid-api-key-here
[Save]

Key: SENDGRID_FROM_EMAIL
Value: noreply@ncdfcoop.com
[Save]
```

### **Variable 16-19: Bank Details**
```
Key: NEXT_PUBLIC_BANK_ACCOUNT_NAME
Value: NCDFCOOP Commerce
[Save]

Key: NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
Value: 1234567890
[Save]

Key: NEXT_PUBLIC_BANK_NAME
Value: First Bank Nigeria
[Save]

Key: NEXT_PUBLIC_BANK_SORT_CODE
Value: 011
[Save]
```

### **Variable 20-22: Application**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://yourdomain.com
[Save]

Key: NEXT_PUBLIC_API_BASE_URL
Value: https://yourdomain.com/api
[Save]

Key: NODE_ENV
Value: production
[Save]
```

---

## 3️⃣ GITHUB ACTIONS SECRETS SETUP

### **Step-by-Step: Add Secrets for GitHub Actions**

1. Go to: GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret:

### **Critical Secrets**
```
Name: NETLIFY_AUTH_TOKEN
Secret: (Get from Netlify → User menu → Applications → New access token)
[Add secret]

Name: NETLIFY_SITE_ID
Secret: (Get from Netlify → Site settings → Site ID)
[Add secret]

Name: SENTRY_AUTH_TOKEN
Secret: [Get from https://sentry.io/settings/auth-tokens - see SENTRY_SETUP_GUIDE.md]
[Add secret]
```

### **Firebase Secrets** (For build process)
```
Add all NEXT_PUBLIC_FIREBASE_* and other sensitive environment variables as secrets
so they're available during GitHub Actions build
```

---

## ⚙️ VARIABLE REFERENCE

### **PUBLIC vs SECRET Variables**

**Public Variables** (prefixed with `NEXT_PUBLIC_`):
- Visible in browser (OK - no sensitive data here)
- Firebase API key, Flutterwave public key, etc.
- Used for client-side code

**Secret Variables** (NO prefix):
- Only available during build & on server
- Flutterwave SECRET key, SendGrid API, Sentry token
- Never exposed to browser

### **All Variables Checklists**

**Firebase (6 variables)**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

**Flutterwave (2 variables)**
- [ ] `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
- [ ] `FLUTTERWAVE_SECRET_KEY`

**Sentry (5 variables)**
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `SENTRY_ORG`
- [ ] `SENTRY_PROJECT`
- [ ] `NEXT_PUBLIC_SENTRY_ENVIRONMENT`

**Email Service (2 variables - choose one)**
- [ ] `SENDGRID_API_KEY` (OR)
- [ ] `MAILGUN_API_KEY`

**Bank Details (4 variables)**
- [ ] `NEXT_PUBLIC_BANK_ACCOUNT_NAME`
- [ ] `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER`
- [ ] `NEXT_PUBLIC_BANK_NAME`
- [ ] `NEXT_PUBLIC_BANK_SORT_CODE`

**Application (3 variables)**
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_API_BASE_URL`
- [ ] `NODE_ENV`

**Total: ~22-24 environment variables**

---

## 🔑 HOW TO GET EACH VALUE

### **Firebase Keys**
1. Go to Firebase Console: https://console.firebase.google.com/
2. Click your project
3. Click "Project Settings" (gear icon)
4. Click "Your apps" tab
5. Click your Web app
6. Copy all values from configuration block

### **Flutterwave Keys**
1. Go to Flutterwave Dashboard: https://dashboard.flutterwave.com/
2. Click "Settings" → "API Keys"
3. Copy **Test Keys** for development
4. Copy **Live Keys** for production (only after verification)

### **Sentry Auth Token**
1. Go to Sentry: https://sentry.io/
2. Click "Settings" → "Auth Tokens"
3. Click "Create New Token"
4. Select scopes: `project:read`, `project:write`, `org:read`, `releases:write`
5. Copy token

### **Sentry DSN**
1. Go to Sentry: https://sentry.io/
2. Click your project
3. Click "Settings" → "Client Keys (DSN)"
4. Copy the DSN URL

### **SendGrid API Key** (Optional)
1. Go to SendGrid: https://app.sendgrid.com/
2. Click "Settings" → "API Keys"
3. Create new key with "Full Access"
4. Copy key

### **Google Analytics ID** (Optional)
1. Go to Google Analytics: https://analytics.google.com/
2. Click your property
3. Click "Data Streams"
4. Click your web stream
5. Copy "Measurement ID" (format: G-XXXXXXXXXX)

### **Netlify Credentials**
1. Go to Netlify: https://app.netlify.com/
2. Click "User menu" → "Applications"
3. Click "New access token"
4. Name it "GitHub Actions"
5. Copy token

For Netlify Site ID:
1. Go to your site on Netlify
2. Click "Site settings"
3. Copy "Site ID"

---

## ✅ VERIFICATION CHECKLIST

### **After Setting Local Variables**
- [ ] Run `npm run build` - builds without errors
- [ ] No TypeScript errors
- [ ] Sentry auth token is valid (build succeeds)
- [ ] Firebase keys connect successfully

### **After Setting Netlify Variables**
- [ ] Trigger a new deploy on Netlify
- [ ] Build completes without errors
- [ ] Site loads on your domain
- [ ] Payment gateway works in production

### **After Setting GitHub Secrets**
- [ ] Push a commit to `main` branch
- [ ] GitHub Actions workflow runs
- [ ] Build completes successfully
- [ ] Deploys to Netlify automatically

---

## 🚨 COMMON MISTAKES TO AVOID

❌ **DON'T:**
- Never commit `.env.local` to git
- Never use spaces around `=` in env variables
- Never mix `pk_test_` with `sk_live_` keys (must match: both test or both live)
- Never reuse tokens across projects/environments

✅ **DO:**
- Use separate Flutterwave accounts for test and production
- Rotate Sentry tokens every 90 days
- Store copies of keys in secure password manager
- Use GitHub Secrets Manager for CI/CD

---

## 🔄 UPDATING ENVIRONMENT VARIABLES

### **For Local Development**
1. Edit `.env.local`
2. Save file
3. Restart dev server: `npm run dev`
4. Variables update automatically

### **For Production (Netlify)**
1. Go to Netlify dashboard
2. Click site → Site settings → Environment
3. Edit variable or add new one
4. Trigger re-deploy: "Trigger deploy" button
5. Variables active immediately

### **For GitHub Actions**
1. Go to Repository → Settings → Secrets
2. Update or add new secret
3. Next push will use new variable

---

## 📊 ENVIRONMENT VARIABLE SUMMARY TABLE

| Variable | Type | Length | Required | Example |
|----------|------|--------|----------|---------|
| NEXT_PUBLIC_FIREBASE_API_KEY | String | ~42 chars | ✅ | AIzaSyBu... |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | String | ~32 chars | ✅ | project.firebaseapp.com |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | String | ~20 chars | ✅ | coop-commerce-8d43f |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | String | ~35 chars | ✅ | project.appspot.com |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | String | ~12 chars | ✅ | 962109579563 |
| NEXT_PUBLIC_FIREBASE_APP_ID | String | ~22 chars | ✅ | 1:962...863cf |
| NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY | String | ~30 chars | ✅ | pk_test_... |
| FLUTTERWAVE_SECRET_KEY | String | ~30 chars | ✅ | sk_test_... |
| SENTRY_AUTH_TOKEN | String | ~100 chars | ✅ | sntryu_... |
| NEXT_PUBLIC_SENTRY_DSN | URL | ~100 chars | ✅ | https://...sentry.io |
| SENDGRID_API_KEY | String | ~70 chars | ⚠️ | SG.... |
| MAILGUN_API_KEY | String | ~60 chars | ⚠️ | key-... |
| NODE_ENV | Enum | 11 chars | ✅ | production/development |

---

## 🎯 QUICK START

**5-minute fast track:**

```bash
# 1. Copy example file
cp .env.example .env.local

# 2. Edit with your real values (open in editor)
nano .env.local

# 3. Test local build
npm run build

# 4. If successful, set same variables on Netlify dashboard

# 5. Trigger Netlify deploy

# Done! 🚀
```

---

## ❓ TROUBLESHOOTING

**Q: Build fails with "Sentry auth token invalid"**
A: Generate new token at sentry.io, update SENTRY_AUTH_TOKEN

**Q: "Cannot connect to Firebase"**
A: Check NEXT_PUBLIC_FIREBASE_PROJECT_ID is correct, verify project exists

**Q: "Flutterwave key not working"**
A: Ensure using test keys for development, live keys for production (not mixed)

**Q: "Environment variable not found"**  
A: Check variable name is exactly correct (case-sensitive), restart dev server

**Q: Site builds locally but fails on Netlify**
A: Set same variables on Netlify dashboard, trigger manual re-deploy

---

**Need help?** See the full deployment guide in `NETLIFY_DEPLOYMENT_GUIDE.md`
