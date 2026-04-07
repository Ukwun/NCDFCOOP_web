# 🚀 NETLIFY DEPLOYMENT GUIDE - NCDFCOOP Commerce Web

**Complete step-by-step guide to deploy your Next.js 14 site to Netlify with automatic updates from GitHub**

---

## 📋 CHECKLIST: 5-Step Deployment Process

### **BEFORE YOU START** ✅
- [ ] GitHub repository created with code pushed to `main` branch
- [ ] Firebase project created with Firestore database
- [ ] Flutterwave account created with API keys  
- [ ] Sentry account created with auth token
- [ ] Domain name registered (or use Netlify subdomain)

### **STEP 1: Create Netlify Account & Connect GitHub** (5 minutes)
- [ ] Go to https://netlify.com and sign up
- [ ] Click "New site from Git" 
- [ ] Choose GitHub > Authorize Netlify > Select repository
- [ ] Site created (auto-generates subdomain like `amazing-site-123.netlify.app`)

### **STEP 2: Configure Build Settings** (2 minutes)
- [ ] Build command: `npm ci --legacy-peer-deps && npm run build`
- [ ] Publish directory: `.next`
- [ ] Node version: Set to 18.x (Environment → Node version)
- [ ] Save and trigger deploy

### **STEP 3: Add Environment Variables** (5 minutes)
- [ ] Site Settings → Build & Deploy → Environment
- [ ] Add all variables (see section below)
- [ ] Re-trigger deployment

### **STEP 4: Configure Custom Domain** (10 minutes)
- [ ] Site Settings → Domain settings → Add custom domain
- [ ] Update your domain registrar's DNS records (Netlify will show you how)
- [ ] Verify domain (usually takes 10-30 minutes)
- [ ] SSL certificate auto-issued

### **STEP 5: Test Live Site** (5 minutes)
- [ ] Visit your domain
- [ ] Complete test checkout
- [ ] Verify payment confirmation
- [ ] Check order in Firebase

---

## 🔑 ENVIRONMENT VARIABLES TO SET IN NETLIFY

**Go to:** Site Settings → Build & Deploy → Environment → Edit variables

### **Firebase Configuration** (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBu5HDs_wuhKy7A5sCjdvNZY4t5vnZ6Fag
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coop-commerce-8d43f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coop-commerce-8d43f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coop-commerce-8d43f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=962109579563
NEXT_PUBLIC_FIREBASE_APP_ID=1:962109579563:web:a0fa92699be3cf861ee56e
```

### **Flutterwave Configuration** (Required for Payments)
```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_test_3328123ad3e7bc829368f627963094733e5647b0
FLUTTERWAVE_SECRET_KEY=sk_test_7ffa54e85c90861976aad3b51f2c5ffbdb1bdd7c
```
**IMPORTANT:** Before live launch, upgrade to LIVE keys from Flutterwave dashboard
```
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### **Sentry Configuration** (Required for Error Tracking)
```
# Get your auth token from: https://sentry.io/settings/auth-tokens
# See SENTRY_SETUP_GUIDE.md for detailed instructions
SENTRY_AUTH_TOKEN=[Your Sentry auth token]
NEXT_PUBLIC_SENTRY_DSN=[Your Sentry DSN from project settings]
SENTRY_ORG=your-organization-name
SENTRY_PROJECT=your-project-name
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SENTRY_SKIP_AUTO_RELEASE=false
```

### **Email Service** (Optional - for order confirmations)
```
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@ncdfcoop.com
```

### **Bank Account Details** (For manual bank transfers)
```
NEXT_PUBLIC_BANK_ACCOUNT_NAME=NCDFCOOP Commerce
NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=1234567890
NEXT_PUBLIC_BANK_NAME=First Bank Nigeria
NEXT_PUBLIC_BANK_SORT_CODE=011
```

### **Application Configuration**
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
NODE_ENV=production
```

---

## 🔗 GITHUB ACTIONS SETUP (Auto-Deploy on Push)

### **1. Create GitHub Secrets**
Go to: GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
```
NETLIFY_AUTH_TOKEN      → Get from Netlify (Account → Applications → Authorize)
NETLIFY_SITE_ID         → Get from Netlify (Site settings → API ID)
SENTRY_AUTH_TOKEN       → Your Sentry authentication token
SLACK_WEBHOOK_URL       → (Optional) For Slack notifications
```

And all the environment variables above as secrets (GitHub will inject them into the build).

### **2. GitHub Actions Workflow**
The workflow file `.github/workflows/deploy.yml` is already created. It:
- ✅ Runs on every push to `main` branch
- ✅ Installs dependencies
- ✅ Runs build & tests
- ✅ Deploys to Netlify automatically
- ✅ Posts status to Slack (optional)

**Result:** Every `git push` automatically deploys your site! 🚀

---

## 🔄 AFTER DEPLOYMENT: Monitoring & Maintenance

### **Daily Tasks**
- [ ] Check Sentry dashboard for errors
- [ ] Monitor Netlify deploy logs
- [ ] Check Firestore for new orders
- [ ] Respond to customer issues

### **Weekly Tasks**
- [ ] Review analytics dashboard
- [ ] Check payment success rate (should be > 95%)
- [ ] Verify email confirmations sending
- [ ] Check performance metrics (Lighthouse)

### **Monthly Tasks**
- [ ] Update dependencies (`npm update`)
- [ ] Run security audit (`npm audit`)
- [ ] Review and optimize Firestore usage
- [ ] Backup production database
- [ ] Plan new features

---

## 🚨 TROUBLESHOOTING

### **Build Fails on Netlify**
1. Check build logs: Netlify dashboard → Deploys → Click failed deploy
2. Common issues:
   - Missing environment variables → Add to Netlify dashboard
   - Sentry token invalid → Get new one from sentry.io
   - Node version mismatch → Set to 18.x on Netlify
3. Re-trigger deploy: Click "Trigger deploy" button

### **Site Shows 404 Error**
1. Check Netlify redirects: Create `netlify.toml` with:
   ```
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```
2. Re-deploy

### **Payments Not Working**
1. Verify Flutterwave keys are correct in environment variables
2. Check webhook is accessible: `curl https://yourdomain.com/api/webhooks/flutterwave`
3. Test with card: `4239 0000 0000 0010` (exp: 12/25, CVV: 000)
4. Check Firestore order status

### **Emails Not Sending**
1. Verify SendGrid API key is set
2. Check email address is from verified domain
3. Check Firebase Functions are deployed
4. Look for email failures in SendGrid dashboard

### **Custom Domain Not Working**
1. Verify DNS records are correct (check domain registrar)
2. Wait up to 24 hours for DNS propagation
3. Try flushing browser cache (Ctrl+Shift+Delete)
4. Check SSL certificate status (should be "Active")

---

## 📊 POST-LAUNCH MONITORING

### **Site Health Dashboard**
Create a simple health check endpoint:
```bash
curl https://yourdomain.com/api/health-check
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T10:30:00Z",
  "firebase": "connected",
  "uptime": "99.9%"
}
```

### **Performance Metrics**
- [ ] Page load time < 3 seconds (use Lighthouse)
- [ ] Error rate < 0.1% (check Sentry)
- [ ] Uptime > 99.9% (monitor Netlify)
- [ ] Payment success > 95% (check Firestore)

### **Analytics to Track**
- Daily active users
- Conversion rate (cart → checkout → payment)
- Cart abandonment rate
- Average order value
- Top products
- Customer satisfaction score

---

## 🔐 SECURITY BEST PRACTICES

### **Before Going Live**
- [ ] Enable Firestore security rules (not test mode)
- [ ] Set strong Firebase authentication passwords
- [ ] Rotate Sentry auth tokens every 90 days
- [ ] Use separate Flutterwave accounts for test and production
- [ ] Enable HTTPS on custom domain (automatic on Netlify)
- [ ] Add security headers in Netlify netlify.toml:
  ```
  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      X-XSS-Protection = "1; mode=block"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "geolocation=(), microphone=(), camera=()"
  ```

### **Ongoing Security**
- [ ] Monitor Sentry for suspicious activity
- [ ] Review Firestore access logs weekly
- [ ] Rotate sensitive tokens monthly
- [ ] Keep dependencies updated (`npm update --save`)
- [ ] Run `npm audit` regularly

---

## 📞 SUPPORT & RESOURCES

### **Netlify Documentation**
- Getting Started: https://docs.netlify.com
- Next.js Guide: https://docs.netlify.com/integrations/frameworks/next-js/
- Deploy Logs: https://docs.netlify.com/monitoring-logs/deploy-logs/

### **Firebase Documentation**
- Authentication: https://firebase.google.com/docs/auth
- Firestore: https://firebase.google.com/docs/firestore
- Hosting: https://firebase.google.com/docs/hosting

### **Flutterwave Documentation**
- API Reference: https://developer.flutterwave.com/docs
- Webhooks: https://developer.flutterwave.com/docs/webhooks/
- Test Cards: https://developer.flutterwave.com/docs/test-cards/

### **Sentry Documentation**
- Setup Guide: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Error Tracking: https://docs.sentry.io/platforms/javascript/enriching-events/

---

## ✅ FINAL CHECKLIST BEFORE LAUNCH

**Site Configuration**
- [ ] Custom domain configured and SSL active
- [ ] All environment variables set on Netlify
- [ ] Build completes without errors
- [ ] Site loads on production domain

**Features Testing**
- [ ] Authentication flow works (signup → login → role selection)
- [ ] Product browsing works (search, filters, pagination)
- [ ] Shopping cart persists
- [ ] Checkout flow complete
- [ ] Flutterwave payment works (test card)
- [ ] Bank transfer option shows account details
- [ ] Order confirmation email sends
- [ ] Member features accessible

**Performance & Security**
- [ ] Lighthouse score > 80
- [ ] No errors in Sentry
- [ ] Firestore security rules enabled (not test mode)
- [ ] HTTPS enforced
- [ ] Security headers configured

**Monitoring Ready**
- [ ] Sentry dashboard accessible
- [ ] Netlify monitors set up
- [ ] Firebase console accessible
- [ ] Flutterwave webhook verified
- [ ] Email service tested

---

## 🎉 SUCCESS!

When all checks pass, your site is **LIVE and PRODUCTION-READY**! 

Every `git push` to `main` will automatically:
1. ✅ Install dependencies
2. ✅ Run tests
3. ✅ Build production bundle
4. ✅ Deploy to Netlify
5. ✅ Update your site live

**Deployment is now automated and fully integrated!** 🚀

---

**Questions?** See the comprehensive analysis in `DEPLOYMENT_STRATEGY_LIVE_2026.md`
