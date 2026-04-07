# ✅ PRODUCTION DEPLOYMENT CHECKLIST - NCDFCOOP Commerce Web

**Use this checklist to verify your site is ready for live deployment**

---

## 📋 PRE-DEPLOYMENT PHASE (Week 1)

### **Critical Issues** 🔴
- [ ] **Sentry Token** - Verify valid token configured
  ```bash
  echo "SENTRY_AUTH_TOKEN set: $SENTRY_AUTH_TOKEN"
  ```
  Expected: ✅ Valid token displayed (starts with `sntryu_`)

- [ ] **Build Succeeds Locally** - Test production build
  ```bash
  npm run build
  ```
  Expected: ✅ `.next/` directory created, no errors

- [ ] **TypeScript Compilation** - Check for type errors
  ```bash
  npm run type-check
  ```
  Expected: ✅ No TypeScript errors

- [ ] **Flutterwave Webhook** - Verify endpoint exists and is functional
  ```bash
  curl -X POST http://localhost:3000/api/webhooks/flutterwave \
    -H "Content-Type: application/json" \
    -d '{"test": "true"}'
  ```
  Expected: ✅ Returns valid response (not 404)

### **Environment Configuration** 🔧
- [ ] `.env.local` in project root (NOT in git)
- [ ] All 22 environment variables configured
- [ ] No placeholder values (all `your-xxx-here` replaced)
- [ ] Firebase keys are correct and valid
- [ ] Flutterwave keys are correct (test for development)
- [ ] Sentry DSN and token are correct

### **Local Development Testing** 🧪
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] Home page loads at `http://localhost:3000`
- [ ] No console errors on first load
- [ ] Mobile responsive on DevTools (toggle device toolbar)

---

## 🏗️ BUILD & DEPLOYMENT PHASE (Week 2)

### **Code Quality** 📊
- [ ] Linting passes: `npm run lint`
- [ ] TypeScript strict mode: `npm run type-check`
- [ ] Build successful: `npm run build`
- [ ] No warnings in build output
- [ ] Source maps generated for debugging

### **Feature Testing** 🎯
**Authentication**
- [ ] Sign up flow completes
- [ ] Email verification works
- [ ] Login with correct credentials works
- [ ] Login fails with incorrect credentials
- [ ] Logout returns to login page
- [ ] Protected routes redirect to login

**Product Browsing**
- [ ] Home page loads all products
- [ ] Search functionality works
- [ ] Filters (category, price) work correctly
- [ ] Pagination works (next/prev pages)
- [ ] Product detail page loads
- [ ] Product images display correctly
- [ ] Reviews and ratings display

**Shopping Cart**
- [ ] Add to cart works
- [ ] Remove from cart works
- [ ] Cart persists after page refresh
- [ ] Cart total calculates correctly
- [ ] Empty cart shows proper message

**Checkout & Payment**
- [ ] Address validation works
- [ ] Payment method selection works
- [ ] Flutterwave payment form opens
- [ ] Test payment completes
- [ ] Bank transfer shows account details
- [ ] Order created in Firestore after payment
- [ ] Order confirmation email received

**Member Features**
- [ ] Member dashboard loads
- [ ] Tier display correct
- [ ] Loyalty points display
- [ ] Deposit request works
- [ ] Withdrawal request works
- [ ] Savings goals display
- [ ] Rewards redemption option visible

**Admin Features**
- [ ] Analytics dashboard loads
- [ ] Metrics display correctly
- [ ] Issue alerts appear
- [ ] Top products table shows data
- [ ] Revenue calculations correct

### **Responsive Design** 📱
Test on multiple devices:
- [ ] **Mobile (iPhone SE 375px)** - All pages readable, touch-friendly
- [ ] **Mobile (iPhone 12 390px)** - Bottom navigation visible
- [ ] **Mobile (Android 360px)** - No horizontal scroll
- [ ] **Tablet (iPad 768px)** - Adaptive layout
- [ ] **Desktop (1366px)** - Full-width layout
- [ ] **Desktop (1920px)** - Proper spacing
- [ ] **Dark mode** - Colors readable and contrast OK
- [ ] **Landscape mode** - Content fits without scroll

**Test on Actual Devices:**
- [ ] iPhone/iPad (Safari)
- [ ] Android phone (Chrome)
- [ ] Tablet (Chrome)
- [ ] Desktop (Chrome, Firefox, Edge)

### **Performance** ⚡
- [ ] Lighthouse score > 80 (DevTools)
  ```bash
  npm install -g lighthouse
  lighthouse https://localhost:3000
  ```
- [ ] Page load time < 3 seconds (Network tab)
- [ ] No console errors
- [ ] No memory leaks (DevTools profiler)
- [ ] Images optimized (use next/image)
- [ ] JavaScript bundle < 500KB

### **Security** 🔒
- [ ] No API keys in client code
- [ ] Firebase rules enforced (test in console)
- [ ] Sensitive data sent via HTTPS only
- [ ] CSRF tokens present (if forms)
- [ ] XSS prevention (sanitize inputs)
- [ ] Rate limiting on API routes
- [ ] SQL injection prevention (using Firestore)

---

## 🚀 NETLIFY SETUP PHASE (Week 2)

### **Create Netlify Account** 
- [ ] Go to https://netlify.com and sign up
- [ ] Verify email address
- [ ] Create new site

### **Connect GitHub Repository**
- [ ] Click "New site from Git"
- [ ] Choose GitHub
- [ ] Authorize Netlify app
- [ ] Select your repository
- [ ] Confirm branch: `main`
- [ ] Site created (shows netlify subdomain)

### **Configure Build Settings**
- [ ] Build command: `npm ci --legacy-peer-deps && npm run build`
- [ ] Publish directory: `.next`
- [ ] Node version: Set to 18.x (Build settings → Environment variables)
- [ ] Test build: Click "Trigger deploy"
- [ ] Build succeeds without errors

### **Add Environment Variables**
- [ ] Go to Site settings → Build & Deploy → Environment
- [ ] Add all 22+ environment variables:
  - [ ] Firebase (6 vars)
  - [ ] Flutterwave (2 vars)
  - [ ] Sentry (5 vars)
  - [ ] Email service (1-2 vars)
  - [ ] Bank details (4 vars)
  - [ ] Application (3+ vars)
- [ ] Verify all variables added (count should be 22+)
- [ ] Trigger re-deploy after adding variables

### **Configure Custom Domain** 
- [ ] Go to Site settings → Domain settings
- [ ] Add custom domain
- [ ] Update DNS at your registrar (follow Netlify instructions)
- [ ] Wait for DNS propagation (usually 10-30 minutes)
- [ ] Verify domain resolves to your site
- [ ] SSL certificate active (should show green lock)

### **Test Production Site**
- [ ] Visit custom domain URL
- [ ] Page loads without errors
- [ ] All assets load (no 404s)
- [ ] Responsive on mobile
- [ ] Https working (green lock icon)
- [ ] No mixed content warnings

---

## 🧪 FINAL TESTING PHASE (Week 2-3)

### **Complete User Journey Tests** 🥇

**Scenario 1: New Member Registration**
- [ ] Click "Sign Up"
- [ ] Fill email, password, name
- [ ] Select member role
- [ ] Complete onboarding
- [ ] Verify email (if required)
- [ ] Login with new account
- [ ] ✅ Access member dashboard

**Scenario 2: Buyer Purchase Flow**
- [ ] Browse products
- [ ] Add item to cart
- [ ] Go to checkout
- [ ] Enter shipping address
- [ ] Select payment method (Flutterwave)
- [ ] Complete payment (test card)
- [ ] ✅ See order confirmation page
- [ ] ✅ Receive confirmation email
- [ ] ✅ Check Firestore for order (status = "paid")

**Scenario 3: Bank Transfer Payment**
- [ ] Go to checkout
- [ ] Select bank transfer option
- [ ] ✅ See bank account details
- [ ] ✅ See reference number
- [ ] ✅ Receive email with bank details
- [ ] ✅ Order shows pending status
- [ ] Admin verifies and changes to paid
- [ ] ✅ Order status updates to "paid"

**Scenario 4: Seller Product Listing**
- [ ] Login as seller
- [ ] Go to seller dashboard
- [ ] Add new product
- [ ] Upload product image
- [ ] Set price, description
- [ ] Submit
- [ ] ✅ Product appears in catalog
- [ ] ✅ Buyers can see it
- [ ] ✅ Seller can view analytics

**Scenario 5: Member Tier Progression**
- [ ] Login as member
- [ ] Check current tier (Bronze)
- [ ] Buy enough items to progress
- [ ] ✅ Tier automatically updates to Silver
- [ ] ✅ Discount applies to next purchase
- [ ] ✅ Loyalty points accumulate

### **Admin Features Testing** 👨‍💼
- [ ] Analytics dashboard loads
- [ ] Metrics update in real-time
- [ ] Issue alerts display (if any)
- [ ] Top products shows correct data
- [ ] Revenue calculations accurate
- [ ] Can download reports
- [ ] Charts display correctly

### **Error Handling** ⚠️
Test how system handles errors:
- [ ] Invalid email shows error message
- [ ] Weak password is rejected
- [ ] Missing required fields show alerts
- [ ] Network errors handled gracefully
- [ ] Payment failures show clear message
- [ ] 404 pages display properly
- [ ] 500 errors logged to Sentry

### **Performance Under Load** 📊
- [ ] Site handles multiple concurrent users
- [ ] Database queries respond in < 200ms
- [ ] Payment processing completes in < 5 seconds
- [ ] Images load quickly (CDN working)
- [ ] No timeout errors

### **Monitoring & Alerts** 🚨
- [ ] Sentry dashboard shows no new errors
- [ ] Netlify shows all deploys successful
- [ ] Firebase shows healthy connection
- [ ] Flutterwave shows payments processing
- [ ] Email service logs show successful sends

---

## ✔️ PRE-LAUNCH VERIFICATION (Day Before)

### **Final Checklist**
- [ ] All code pushed to GitHub `main` branch
- [ ] All environment variables set on Netlify
- [ ] All tests passing locally
- [ ] Production build succeeds
- [ ] Site loads on custom domain (HTTPS)
- [ ] Payment workflow tested end-to-end
- [ ] Email confirmations working
- [ ] Mobile responsive verified
- [ ] Admin features tested
- [ ] No console errors
- [ ] No Sentry errors
- [ ] Documentation updated

### **Data Backup**
- [ ] Firebase data backed up
- [ ] Database indexes created
- [ ] Firestore rules deployed
- [ ] Admin user account created
- [ ] Test data loaded (sample products)

### **Team Readiness**
- [ ] Support team trained
- [ ] Emergency contact list ready
- [ ] Rollback plan documented
- [ ] Monitoring dashboard shared
- [ ] Runbook for common issues created

### **Legal & Compliance**
- [ ] Terms of Service page created
- [ ] Privacy Policy page created
- [ ] GDPR compliance verified
- [ ] Payment terms documented
- [ ] Return policy documented

---

## 🎉 LAUNCH DAY

### **Morning (Before Launch)**
- [ ] Sleep well! 😴
- [ ] Final code review of any last changes
- [ ] Team standing by for issues
- [ ] Monitoring dashboards open
- [ ] Customer support ready

### **Go Live (10:00 AM)**
1. [ ] Final test on production site
2. [ ] Click "Publish" or trigger final deploy
3. [ ] Monitor Netlify build (should take < 5 min)
4. [ ] Verify site loads on production domain
5. [ ] Test critical feature (payment flow)
6. [ ] Monitor Sentry for errors (first 30 min)

### **First Hour**
- [ ] Monitor for errors every 5 minutes
- [ ] Check Firestore for new orders
- [ ] Verify emails are sending
- [ ] Test support channels (email, contact form)
- [ ] Respond to any issues immediately

### **First 24 Hours**
- [ ] Monitor continuously during business hours
- [ ] Check analytics for traffic/conversions
- [ ] Verify payment success rate
- [ ] Check email delivery
- [ ] Respond to customer feedback
- [ ] Log any issues for future fixes

### **First Week**
- [ ] Daily monitoring & analytics review
- [ ] Customer feedback collection
- [ ] Performance optimization (if needed)
- [ ] Security audit
- [ ] Bug fixes (if any critical issues)

---

## 📊 POST-LAUNCH METRICS TO TRACK

### **Daily Metrics** 📈
- Page load time (target: < 3s)
- Error rate (target: < 0.1%)
- Uptime percentage (target: 99.9%)
- Payment success rate (target: > 95%)
- Email delivery rate (target: 99%)

### **Weekly Metrics** 📅
- New user registrations
- Total orders received
- Total revenue
- Cart abandonment rate
- Average order value
- Customer satisfaction score

### **Monthly Metrics** 📊
- Monthly active users
- Monthly revenue
- Customer lifetime value  
- Repeat purchase rate
- Churn rate

---

## ⚡ QUICK COMMANDS FOR LAUNCH DAY

```bash
# Pre-launch verification
npm run build              # Verify build succeeds
npm run type-check         # No TS errors
npm run lint              # Code quality check

# Local testing
npm run dev               # Start dev server
# Test at http://localhost:3000

# Production simulation
npm start                 # Run production build locally

# Git commands
git status                # Check uncommitted changes
git add .                # Stage all changes
git commit -m "Ready for launch"
git push origin main      # Trigger Netlify auto-deploy

# Monitor deployment
# Go to https://app.netlify.com → Deploys → Watch build log

# Check live site
# Visit your custom domain

# Monitor errors
# Go to https://sentry.io → Your project → Issues
```

---

## 🚨 EMERGENCY PROCEDURES

### **If Critical Error Occurs**
1. [ ] Check Sentry for error details
2. [ ] Check Netlify logs for build errors
3. [ ] Rollback: Click "Revert" in Netlify Deploys
4. [ ] Site reverts to last working version (< 1 min)
5. [ ] Investigate root cause
6. [ ] Fix locally
7. [ ] Test thoroughly
8. [ ] Deploy again

### **If Payment Processing Fails**
1. [ ] Check Flutterwave status page
2. [ ] Verify API keys are correct in Netlify
3. [ ] Check webhook endpoint is accessible
4. [ ] Test with new payment attempt
5. [ ] If persists, switch to bank transfer temporarily

### **If Database Goes Down**
1. [ ] Check Firebase status
2. [ ] Verify network connectivity
3. [ ] Check Firebase project quotas
4. [ ] Restore from backup if needed
5. [ ] Notify users of temporary unavailability

### **If Email Service Fails**
1. [ ] Check SendGrid status & API key
2. [ ] Verify email addresses are correct
3. [ ] Check spam filters
4. [ ] Switch to backup email service if available
5. [ ] Notify affected users

---

## ✅ SUCCESS CRITERIA

Your site is **LIVE and SUCCESSFUL** when:

✅ Site accessible on custom domain (HTTPS)  
✅ All pages load without errors  
✅ Payment processing works end-to-end  
✅ Order confirmations email correctly  
✅ Mobile responsive on all devices  
✅ < 0.1% error rate in Sentry  
✅ > 95% uptime  
✅ > 95% payment success rate  
✅ Team confident in system  
✅ Customer feedback is positive  

---

## 🎓 DOCUMENTATION

Keep these guides handy:
- 📄 [DEPLOYMENT_STRATEGY_LIVE_2026.md](./DEPLOYMENT_STRATEGY_LIVE_2026.md) - Overall strategy
- 📄 [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md) - Netlify setup
- 📄 [ENVIRONMENT_VARIABLES_GUIDE.md](./ENVIRONMENT_VARIABLES_GUIDE.md) - Env variable setup
- 📄 [MOBILE_TESTING_GUIDE.md](./MOBILE_TESTING_GUIDE.md) - Device testing

---

**You've got this! 🚀**

When all checks pass, your NCDFCOOP Commerce platform is ready to serve real users and make a real impact!

**Questions?** See the full deployment guides above.
