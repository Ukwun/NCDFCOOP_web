# Sentry Tokens Explained - What Goes Where?

## The Token You Mentioned

You sent: `re_hzqKP3WK_3JyCX87b1ngXqBbf1zcWpDvG`

This looks like a **Relay Token** (different from what you need). Here's what each token does:

---

## 3 Different Sentry Tokens

### 1️⃣ **DSN (Data Source Name)** - For Client-Side Error Tracking
**Where to get it:** `Settings → Client Keys (DSN)`
**Format:** `https://[PUBLIC_KEY]@ingest.sentry.io/[PROJECT_ID]`
**Example:** `https://4c2bae7d9fbc413e8@ingest.sentry.io/4504521237299200`
**Where it goes:** `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`
**What it does:** Client-side errors get sent to Sentry
**Public?** ✅ Yes (starts with `NEXT_PUBLIC_` - safe to expose)

```env
NEXT_PUBLIC_SENTRY_DSN=https://4c2bae7d9fbc413e8@ingest.sentry.io/4504521237299200
```

---

### 2️⃣ **Auth Token** - For Build/Deployment ⭐ YOU ARE HERE
**Where to get it:** `Settings → API Auth Tokens → New Token` (your current page)
**Format:** `sntrys_eyJpc2...` (very long string starting with `sntrys_`)
**Example:** `sntrys_eyJpc3NhTjlodDB1UXhFMTYwOUJqRGFEajlIRTQ2YzlaZVJuNW`
**Where it goes:** `SENTRY_AUTH_TOKEN` in `.env.local`
**What it does:** Allows `npm run build` to create releases and upload source maps
**Public?** ❌ NO (keep secret - never commit)

```env
SENTRY_AUTH_TOKEN=sntrys_eyJpc3NhTjlodDB1UXhFMTYwOUJqRGFEajlIRTQ2YzlaZVJuNW
```

---

### 3️⃣ **Relay Token** - Not Needed for Your Setup
**Where to get it:** `Settings → Integrations → Relays`
**Format:** Looks like what you sent: `re_hzqKP3WK_3JyCX87b1ngXqBbf1zcWpDvG`
**What it does:** For self-hosted Sentry installations
**Need it?** ❌ No (skip this)

---

## Quick Setup Reference

| Need | Type | Format | Where | Env Var |
|------|------|--------|-------|---------|
| ✅ **Client tracking** | DSN | `https://key@ingest...` | Client Keys | `NEXT_PUBLIC_SENTRY_DSN` |
| ✅ **Build releases** | Auth Token | `sntrys_...` | API Auth Tokens | `SENTRY_AUTH_TOKEN` |
| ❌ **Relay** | Relay Token | `re_...` | (skip) | - |

---

## Your Current Page (NEW TOKEN PAGE)

You're on: `https://8-gigabytes.sentry.io/settings/account/api/auth-tokens/new-token/`

### What You'll See:
```
┌─────────────────────────────────────────┐
│ Create an Auth Token                    │
│                                         │
│ Name: [coop-commerce-prod______]       │
│                                         │
│ Scopes (Select All):                    │
│ ☑ project:read                          │
│ ☑ project:write                         │
│ ☑ org:read                              │
│ ☑ releases:write ← IMPORTANT            │
│ ☑ org:admin                             │
│                                         │
│ [CREATE AUTH TOKEN]                     │
│                                         │
│ (Shows token after creation)             │
│ Token: sntrys_eyJpc3NhTjlod...          │
│ [Copy] [Done]                           │
└─────────────────────────────────────────┘
```

After clicking **CREATE AUTH TOKEN**, you'll see your new token. Copy it and add to `.env.local`.

---

## Two Files You Need to Modify

### File 1: `.env.local`
Add these two lines:

```env
# From Client Keys page
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@ingest.sentry.io/YOUR_PROJECT

# From API Auth Tokens (new token) page  
SENTRY_AUTH_TOKEN=sntrys_YOUR_FULL_TOKEN_HERE
```

### File 2: `next.config.js`
Change this line:

```javascript
// BEFORE (disables Sentry)
const SENTRY_ENABLED = !!process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_AUTH_TOKEN !== 'your-sentry-auth-token-here';

// AFTER (enables Sentry when token exists)
const SENTRY_ENABLED = !!process.env.SENTRY_AUTH_TOKEN;
```

---

## Verify Before Building

### Check 1: Find Your DSN
1. Go to: `https://8-gigabytes.sentry.io/`
2. Click **Projects** → **javascript-nextjs**
3. Click **Client Keys (DSN)** in sidebar
4. Copy the full DSN URL (starts with `https://`)

### Check 2: Create Your Auth Token (You're doing this now!)
1. Stay on: `https://8-gigabytes.sentry.io/settings/account/api/auth-tokens/new-token/`
2. Enter token name
3. Check all 5 scopes
4. Click **CREATE AUTH TOKEN**
5. Copy the token immediately (it won't show again!)

### Check 3: Add to .env.local
Paste both in your `.env.local` file

### Check 4: Test Build
```bash
npm run build
```

Should complete without "Invalid token 401" errors.

---

## Summary

🎯 **Your task:**
1. ✅ Create Auth Token (on that page now)
2. ⏳ Get DSN (from Client Keys)
3. ⏳ Update `.env.local`
4. ⏳ Run `npm run build`

**You're 25% done (on the token creation page now!)**

Once you create the token and copy it, let me know and I'll add it to your `.env.local` for you.
