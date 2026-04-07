# Sentry Configuration - Step-by-Step Setup Guide

## Part 1: Create Sentry Auth Token (You're here!)

You're already on the right page: `https://8-gigabytes.sentry.io/settings/account/api/auth-tokens/new-token/`

### Step 1: Name Your Token
- **Field:** "Auth Token Name"
- **Enter:** `coop-commerce-prod-token` (or any name you prefer)
- This helps identify the token's purpose later

### Step 2: Select Required Scopes
Check ALL of these scopes:
- ✅ `project:read` - Read project info
- ✅ `project:write` - Modify project settings  
- ✅ `org:read` - Read organization info
- ✅ `releases:write` - Create/manage releases (needed for builds)
- ✅ `org:admin` - Organization admin access

**Why these scopes?**
- `releases:write` is critical for Next.js builds to upload source maps
- Others allow build process to authenticate with Sentry

### Step 3: Create Token
- Click the **blue "Create Auth Token"** button
- A long token string will appear like: `sntrys_eyJp...rest_of_token`

### Step 4: Copy & Save Token Immediately
⚠️ **IMPORTANT:** Sentry will only show this token ONCE
- Click **"Copy"** button next to the token
- Paste it somewhere safe (you'll add it to `.env.local` shortly)
- Full token looks like: `sntrys_eyJpc...` (very long string)

---

## Part 2: Get Your Sentry DSN

### Step 1: Go to Project Settings
In `https://8-gigabytes.sentry.io/`:
1. Click **"Projects"** in left sidebar
2. Click your project: **javascript-nextjs**
3. Click **"Client Keys (DSN)"** in the left menu

### Step 2: View/Copy DSN
You should see something like:
```
https://4c2bae7d9fbc413e8f7385f55c515d51@ingest.sentry.io/your-project-id
```

**Your DSN has two parts:**
- **Public Key:** `4c2bae7d9fbc413e8f7385f55c515d51` (before @)
- **Project ID:** Your Sentry project number (after the /)

### Step 3: Confirm Your Project
- Organization: **8-gigabytes**
- Project: **javascript-nextjs**
- All keys should match what you see in the Sentry dashboard

---

## Part 3: Update .env.local File

### Step 1: Open `.env.local` in VS Code
- File location: `c:\development\coop_commerce_web\.env.local`

### Step 2: Add/Update These Lines

Replace these placeholder values with your actual tokens:

```env
# ============================================
# 🔒 SENTRY ERROR LOGGING
# ============================================

# Your actual Sentry DSN from Client Keys
NEXT_PUBLIC_SENTRY_DSN=https://4c2bae7d9fbc413e8f7385f55c515d51@ingest.sentry.io/your-project-id

# Auth Token for build process (from new-token page)
SENTRY_AUTH_TOKEN=sntrys_eyJpc...your_full_token_here...

# Enable Sentry during builds
SENTRY_SKIP_AUTO_RELEASE=false
SENTRY_IGNORE_API_ERRORS=false

# Sentry environment
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# App version
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Step 3: Verify Your Values
Make sure:
- ✅ `NEXT_PUBLIC_SENTRY_DSN` - Starts with `https://` and contains `@ingest.sentry.io`
- ✅ `SENTRY_AUTH_TOKEN` - Starts with `sntrys_` and is very long
- ✅ `SENTRY_SKIP_AUTO_RELEASE` - Set to `false` (enables releases)
- ✅ `SENTRY_IGNORE_API_ERRORS` - Set to `false` (catch errors)

---

## Part 4: Update next.config.js (Re-enable Sentry)

Open `next.config.js` and find this section:

**BEFORE:**
```javascript
// Temporarily disable Sentry due to missing auth token
const SENTRY_ENABLED = !!process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_AUTH_TOKEN !== 'your-sentry-auth-token-here';
```

**AFTER:**
```javascript
// Sentry enabled when auth token is configured
const SENTRY_ENABLED = !!process.env.SENTRY_AUTH_TOKEN;
```

---

## Part 5: Test Your Configuration

### Step 1: Run Build
```bash
npm run build
```

### Step 2: Check for Success
- ✅ Build completes without Sentry 401 errors
- ✅ `.next` directory is created
- ✅ No "Invalid token (http status: 401)" messages

### Step 3: Verify Release Created
After successful build:
1. Go to: `https://8-gigabytes.sentry.io/organizations/8-gigabytes/releases/`
2. Look for your new release (should match `NEXT_PUBLIC_APP_VERSION`)

---

## Troubleshooting

### "Invalid token (http status: 401)"
- ✅ Copy the token again (make sure you got the full string)
- ✅ Check no extra spaces at beginning/end
- ✅ Verify you selected all required scopes

### "Command failed: sentry-cli"
- ✅ Check `SENTRY_AUTH_TOKEN` is set in `.env.local`
- ✅ Verify it's the auth token (starts with `sntrys_`), NOT the DSN
- ✅ Run `npm install` to update dependencies

### "Project not found"
- ✅ Check organization is **8-gigabytes** 
- ✅ Check project is **javascript-nextjs**
- ✅ DSN and auth tokens should match same project

### Build Succeeds but Sentry not Working
- ✅ Check `NEXT_PUBLIC_SENTRY_DSN` is correct
- ✅ Verify `SENTRY_ENABLED = true` in next.config.js
- ✅ Environment matches your setup (production vs development)

---

## Summary of Your Tokens

After completing these steps, you should have:

| Token | Format | Example |
|-------|--------|---------|
| **DSN** | `https://[key]@ingest.sentry.io/[id]` | `https://4c2bae...@ingest.sentry.io/1234567` |
| **Auth Token** | `sntrys_...long string...` | `sntrys_eyJpc2Su...rest...` |

**Never commit these to Git!** They stay in `.env.local` (which is in `.gitignore`)

---

## Next: Deploy to Production

Once build succeeds:
1. Commit your code (not .env.local)
2. Deploy to Vercel/Netlify
3. Add *environment variables* in hosting platform
4. Sentry will track all production errors

---

**Need help?** Check Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
