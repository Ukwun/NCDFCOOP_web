# Sentry Setup Guide for NCDFCOOP Commerce Web

**Project:** NCDFCOOP Commerce Platform (Web)  
**Organization:** 8-gigabytes  
**Project:** javascript-nextjs  
**Date Setup Started:** April 5, 2026

---

## 📋 What is Sentry?

Sentry is a real-time error tracking and performance monitoring platform that helps you:
- 🚨 **Capture errors** before users report them
- 📊 **Monitor performance** metrics (LCP, FCP, CLS)
- 🎬 **Replay sessions** to understand what went wrong
- 📈 **Track trends** in error rates and performance
- 🔔 **Get alerts** when critical issues occur

---

## ✅ What's Already Configured

The following files have been created and configured:

### 1. **Server-side Error Tracking**
- **File:** [instrumentation.ts](instrumentation.ts)
- **Status:** ✅ Ready
- **Features:**
  - Node.js error capture
  - HTTP tracing
  - Uncaught exceptions
  - Unhandled rejections

### 2. **Next.js Integration**
- **File:** [next.config.js](next.config.js)
- **Status:** ✅ Ready
- **Changes:**
  - Wrapped with `withSentryConfig()`
  - Source map hiding enabled
  - Auto session tracking enabled
  - Tunnel route `/monitoring`

### 3. **Client-side Error Tracking**
- **File:** [lib/logging/sentry.client.ts](lib/logging/sentry.client.ts)
- **Status:** ✅ Ready
- **Features:**
  - Browser error capture
  - Session replay
  - User context tracking
  - Breadcrumb tracking
  - Custom exception handling

### 4. **Package Dependencies**
- **Package:** @sentry/nextjs@^10.47.0
- **Status:** ✅ Installed
- **In:** [package.json](package.json)

---

## 🔧 Setup Steps (Required)

### Step 1: Get Your Sentry Credentials ✅

**Your DSN is already configured:**
```
https://7dd040b41779c621b6b083a6ff77a44f@o4511166305468416.ingest.us.sentry.io/4511166410326016
```

This is already set in:
- [.env.local.example](.env.local.example)
- [instrumentation.ts](instrumentation.ts)
- [lib/logging/sentry.client.ts](lib/logging/sentry.client.ts)

No additional DSN retrieval needed! ✅

### Step 2: Get Your Auth Token

1. Go to [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/)
2. Create a new token with `event:read`, `releases:read`, `releases:write` scopes
3. Copy the token

### Step 3: Create `.sentryclirc` File

Copy `.sentryclirc.example` to `.sentryclirc`:

```bash
cp .sentryclirc.example .sentryclirc
```

Then edit `.sentryclirc` and replace:
- `your_sentry_auth_token_here` → Your actual auth token from Step 2

### Step 4: Update `.env.local` ✅

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and only replace the **SENTRY_AUTH_TOKEN**:

```env
# DSN is already configured
NEXT_PUBLIC_SENTRY_DSN=https://7dd040b41779c621b6b083a6ff77a44f@o4511166305468416.ingest.us.sentry.io/4511166410326016

# Get this from https://sentry.io/settings/account/api/auth-tokens/
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

**That's it!** The DSN is pre-configured. ✅

### Step 5: Test the Setup

Run the development server:

```bash
npm run dev
```

Then go to http://localhost:3001 and check:
1. **Console** → Should see Sentry initialization
2. **Network** → Should see requests to `sentry.io`
3. **Application** → Check localStorage for Sentry data

---

## 🧪 Test Error Capture

To test if Sentry is working:

### Test 1: Browser Console Error

Open DevTools console and run:
```javascript
throw new Error('Test Sentry error');
```

**Expected:** Error should appear in Sentry dashboard within seconds

### Test 2: Unhandled Rejection

In console:
```javascript
Promise.reject('Test rejection');
```

### Test 3: Network Error

In console:
```javascript
fetch('http://invalid-url-that-will-fail.com');
```

---

## 📊 Sentry Dashboard

### Key Sections

**1. Issues (Main Dashboard)**
- Real-time error feed
- Error grouping and deduplication
- Assignee and status tracking
- Commenting and collaboration

**2. Performance Monitoring**
- Page load times (FCP, LCP)
- Transaction tracing
- Custom performance metrics
- Slow transactions

**3. Session Replay**
- Video playback of user sessions
- Interactive timeline
- Console logs and network activity
- Helps debug complex issues

**4. Alerts**
- Configure when to notify
- Slack, email, PagerDuty integration
- Custom alert rules

---

## 🔐 Security Considerations

### Data Privacy
- ✅ Masked PII (Personally Identifiable Information)
- ✅ Blocked media uploads (reduces bandwidth)
- ✅ Session replay disabled in production (optional)
- ✅ Filtered sensitive URLs

### What Sentry Collects
- ✅ Error messages and stack traces
- ✅ Browser and OS information
- ✅ Page URLs (no query params by default)
- ✅ Console logs (last 100 messages)
- ✅ Network requests (limited)
- ✅ User interactions (breadcrumbs)

### What Sentry Does NOT Collect
- ❌ Password or auth tokens
- ❌ Credit card information
- ❌ Form field values (unless whitelisted)
- ❌ localStorage/sessionStorage (unless explicitly sent)

---

## 📋 Implementation Checklist

- [ ] Create `.sentryclirc` file from example
- [ ] Update `.env.local` with DSN and auth token
- [ ] Run `npm run build` and verify no errors
- [ ] Start dev server: `npm run dev`
- [ ] Test error capture in console
- [ ] Deploy to staging environment
- [ ] Monitor Sentry dashboard for real errors
- [ ] Set up Slack/email alerts
- [ ] Configure team notifications
- [ ] Document critical errors to track

---

## 🚀 Next Steps

### Immediate (This Week)
1. ✅ Complete setup steps above
2. ✅ Test error capturing
3. ✅ Deploy to staging
4. ✅ Monitor for production errors

### Short-term (Week 2-3)
1. Add error context to key components
2. Set up alert rules for critical errors
3. Integrate with Slack notifications
4. Train team on issue management

### Long-term (Month 2+)
1. Analyze error patterns
2. Prioritize bug fixes based on impact
3. Track performance regressions
4. Use Session Replay for complex bugs

---

## 📞 Useful Resources

### Documentation
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Tracking Best Practices](https://docs.sentry.io/product/error-monitoring/best-practices/)
- [Performance Monitoring Guide](https://docs.sentry.io/product/performance/)

### Configuration
- **Sentry Dashboard:** https://sentry.io/organizations/8-gigabytes/
- **JavaScript-nextjs Project:** https://sentry.io/organizations/8-gigabytes/projects/javascript-nextjs/
- **Project Settings:** https://sentry.io/settings/8-gigabytes/projects/javascript-nextjs/

### API References
- **Sentry SDK API:** https://docs.sentry.io/platforms/javascript/enriching-events/
- **CLI Reference:** https://docs.sentry.io/cli/

---

## ⚙️ Configuration Files

### Server-side ([instrumentation.ts](instrumentation.ts))
- Handles Node.js errors
- Tracks HTTP requests
- Logs unhandled rejections
- Filters sensitive data

### Client-side ([lib/logging/sentry.client.ts](lib/logging/sentry.client.ts))
- Browser error capture
- Session replay
- User context tracking
- Custom breadcrumbs

### Build-time ([next.config.js](next.config.js))
- Sentry integration with Next.js
- Source map management
- Auto session tracking
- Release management

---

## 🆘 Troubleshooting

### Sentry Not Capturing Errors

**Check:**
1. ✅ DSN is correct in `.env.local`
2. ✅ SENTRY_AUTH_TOKEN is set
3. ✅ `npm install` completed successfully
4. ✅ `npm run build` succeeds
5. ✅ Check browser console for errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
npm run dev
```

### DSN Errors in Build

**Check:**
1. DSN format is correct: `https://key@org.ingest.sentry.io/project-id`
2. URL is accessible from your network
3. No firewall blocking requests to sentry.io

**Solution:**
```bash
# Test DSN connectivity
curl https://sentry.io/api/projects/
```

### Auth Token Issues

**Check:**
1. Token has correct scopes: `event:read`, `releases:read`, `releases:write`
2. Token is not expired
3. Token is properly set in `.env.local`

**Solution:**
- Create new token if expired
- Check scopes in Sentry dashboard

---

## 📈 Success Metrics

After setup, you should see:
- ✅ Errors appearing in Sentry dashboard
- ✅ Real-time notifications working
- ✅ Performance metrics available
- ✅ User sessions being tracked
- ✅ Alerts configured for critical issues

---

## 🎯 Phase Integration

This Sentry setup is part of the broader NCDFCOOP optimization roadmap:

| Phase | Component | Status |
|-------|-----------|--------|
| **4** | Core app | ✅ Complete |
| **5.1** | Image optimization | ✅ Complete |
| **5.2** | Code splitting | 📅 Week 2 |
| **5.3** | Caching layer | 📅 Week 3 |
| **5.4** | Database optimization | 📅 Week 4 |
| **Monitor** | **Error tracking (Sentry)** | **✅ This week** |
| **Monitor** | Performance tracking | 🚀 Ready |

---

**Setup Date:** April 5, 2026  
**Status:** 🚀 **READY FOR CONFIGURATION**  
**Next Step:** Complete Step 1-5 above and test

