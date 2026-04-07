# Mobile & Responsive Testing Guide

**For Testing on Real Devices Before Production Launch**
Last Updated: April 7, 2026

---

## 📱 Phase 1: Device & Network Setup

### Required Devices
- **iPhone** (iOS 14+): iPhone 12 or newer recommended
- **Android Phone** (Android 10+): Samsung Galaxy S21 or equivalent
- **Tablet**: iPad (7th gen+) or Samsung Galaxy Tab S6+
- **Desktop**: Windows 1920x1080 and macOS at various resolutions

### Network Conditions to Test
```
✅ Wi-Fi 5G (Fast) - 50+ Mbps
✅ Wi-Fi 4G (Normal) - 10-30 Mbps
✅ Cellular 4G LTE (Slow) - 5-10 Mbps
✅ Cellular 3G (Very Slow) - 1-3 Mbps
✅ Offline (No Network) - Test fallback UI
```

**Testing Tool**: Use Chrome DevTools → Network tab → Throttling dropdown

---

## 🧪 Phase 2: Critical User Flows (Test in This Order)

### Flow 1: Authentication & Onboarding (5-10 min per device)
- [ ] Sign Up page loads and is responsive
- [ ] Form inputs are accessible on keyboard
- [ ] Submit button is tappable (min 44x44px)
- [ ] Email/password validation shows clear errors
- [ ] Sign In page works and redirects correctly
- [ ] Password reset email works

**Mobile-Specific Checks**:
- [ ] Autofill works with iOS Keychain
- [ ] Autofill works with Android credential manager
- [ ] No console errors appear
- [ ] Page doesn't have horizontal scroll
- [ ] Back button doesn't break navigation

### Flow 2: Browse Products (10-15 min per device)
- [ ] Products page loads without error
- [ ] Product images load (check slow network)
- [ ] Product cards are properly sized for screen
- [ ] Price and discount are visible
- [ ] "Add to Cart" button is clearly visible and tappable
- [ ] Search/filter functionality works

**Mobile-Specific Checks**:
- [ ] Grid layout adjusts: 1 col (mobile) → 2-3 col (tablet) → 4+ col (desktop)
- [ ] Images scale properly without stretching
- [ ] No text overflow beyond screen edge
- [ ] Font sizes are readable (16px minimum for body text)
- [ ] Pagination controls are easy to tap
- [ ] No jank/lag when scrolling product list

### Flow 3: Shopping Cart (10-15 min per device)
- [ ] Cart loads with added items
- [ ] Item quantity can be increased/decreased
- [ ] Remove item button works
- [ ] Total price recalculates correctly
- [ ] "Proceed to Checkout" button is visible

**Mobile-Specific Checks**:
- [ ] Cart items display correctly stacked
- [ ] Quantity controls (+/-) are tappable
- [ ] Delete button has adequate padding
- [ ] Swipe gestures don't break the page
- [ ] Form inputs are accessible
- [ ] No overlapping elements

### Flow 4: Checkout & Payment (15-20 min per device)
- [ ] Checkout form displays all fields
- [ ] Address form fields are properly labeled
- [ ] Payment method selection works (Flutterwave/Bank Transfer)
- [ ] Flutterwave popup opens and loads
- [ ] Bank transfer details are readable
- [ ] Submit button works without errors

**Mobile-Specific Checks**:
- [ ] Address input fields are large enough to tap
- [ ] Keyboard doesn't cover important elements
- [ ] Form validation errors are visible
- [ ] Payment gateway redirects work and return correctly
- [ ] "Continue Shopping" link is accessible on error
- [ ] Loading spinners show during processing

### Flow 5: Order Confirmation (5-10 min per device)
- [ ] Order confirmation page loads after payment
- [ ] Order ID is displayed correctly
- [ ] Items list matches what was ordered
- [ ] Total price is accurate
- [ ] "View Invoice" button works
- [ ] "Continue Shopping" button returns to products

**Mobile-Specific Checks**:
- [ ] Timeline displays properly (all steps visible)
- [ ] Delivery date is shown
- [ ] Contact information is readable
- [ ] Invoice opens in new window without errors
- [ ] Download option works

---

## 📐 Phase 3: Responsive Design Validation

### Breakpoint Testing Checklist

#### Mobile (320px - 640px)
```
✅ Single column layout for products
✅ Navigation menu collapses to hamburger
✅ Form fields stack vertically
✅ Buttons span full width
✅ No horizontal scrolling
✅ Touch targets are 44x44px minimum
✅ Text is readable without zoom
✅ Images scale proportionally
```

#### Tablet (641px - 1024px)
```
✅ Two-column product grid
✅ Side navigation becomes visible (if applicable)
✅ Form fields may be 2-column
✅ Buttons have adequate padding
✅ Tables are horizontal-scrollable if needed
✅ Images are appropriately sized
✅ Content doesn't exceed 90% width
```

#### Desktop (1025px+)
```
✅ Three or four-column product grid
✅ Full navigation bar visible
✅ Multi-column forms
✅ Proper whitespace/margins
✅ No layout shift when content loads
```

### CSS & Layout Checklist
```
✅ No fixed widths breaking layouts
✅ Max-width containers used (800-1200px)
✅ Margins/padding scale with breakpoints
✅ Flexbox/Grid properly configured
✅ Images use max-width: 100%
✅ Text doesn't have excessive line-length (>65 chars)
✅ Font sizes don't require horizontal scroll
✅ Z-index layering works correctly on mobile
```

---

## 🎯 Phase 4: Device-Specific Testing

### iPhone (iOS)
```
Settings → Safari → Advanced → Enable "Web Inspector"
Then use: Safari → Develop → [Device Name] → [Page]

Checklist:
✅ Safe area (notch/Dynamic Island) respected for content
✅ Bottom swipe gesture doesn't break navigation
✅ Keyboard appearance/disappearance handled smoothly
✅ Status bar background matches design
✅ Pinch-to-zoom works (don't disable entire viewport)
✅ Double-tap zoom works
✅ Pull-to-refresh doesn't interfere
✅ Autocorrect suggestions appear correctly
```

### Android
```
Connect via USB Debugging:
adb reverse tcp:3000 tcp:3000
Then access: http://localhost:3000

Or use Chrome DevTools → Remote Debugging

Checklist:
✅ Android gesture buttons don't interfere
✅ Keyboard appearance handled (don't push content up excessively)
✅ Back button works with page history
✅ Status bar background colors work
✅ Haptic feedback (if implemented) works
✅ Screen rotation doesn't break layout
✅ Memory/battery usage is reasonable
```

---

## ⚡ Phase 5: Performance Testing

### Critical Metrics (Use Lighthouse in DevTools)
```
📊 Performance: ≥ 90/100
⚡ Largest Contentful Paint (LCP): < 2.5s
🎯 First Input Delay (FID): < 100ms
🎨 Cumulative Layout Shift (CLS): < 0.1
```

### Real-Device Performance Check
1. Open DevTools → Performance tab
2. Record while:
   - Loading products page
   - Scrolling product list
   - Adding item to cart
   - Navigating to checkout

3. Check for:
   - Long tasks (> 50ms)
   - Jank (frame drops below 60fps)
   - Memory leaks
   - Excessive re-renders

### Image Optimization Test
```
✅ Product images load < 500ms on 4G
✅ Images don't exceed 2MB each
✅ Thumbnails use optimized formats
✅ Lazy loading works (images below fold load on scroll)
✅ Images have proper aspect ratios (no distortion)
```

### Network Test on Slow Connections
Windows/Mac:
1. Chrome DevTools → Network
2. Set to "Slow 4G"
3. Reload page and measure:
   - First page load
   - Product image loading
   - Cart update latency
   - Checkout submission

Expected Results:
- First Contentful Paint: < 3s
- Products loadable: < 5s
- Checkout works smoothly

---

## 🔐 Phase 6: Security & Privacy Testing

### HTTPS & Certificates
```
✅ No mixed content warnings
✅ SSL certificate is valid
✅ Padlock icon shows in address bar
✅ No certificate errors
```

### Data Sensitivity
```
✅ Forms use POST (not GET) for sensitive data
✅ Passwords never shown in URL
✅ Payment data never logged to console
✅ API keys not exposed in client code
✅ Local storage used only for non-sensitive data
```

---

## 🐛 Phase 7: Browser Console Cleanup

### During Each Test Session, Check Console For:
```
❌ JavaScript errors (red in console)
⚠️  Warnings (orange/yellow)
📍 Unhandled promise rejections
🔴 Network request failures
💾 Memory warnings
```

Run this in console on each page:
```javascript
// Check for console errors
console.assert(true, 'Testing console access');

// Check for unhandled errors
window.addEventListener('error', (e) => console.log('Error:', e));
window.addEventListener('unhandledrejection', (e) => console.log('Rejection:', e));
```

---

## 📋 Phase 8: Testing Checklist Template

Create a new testing session and fill out:

```
Date Tested: _______________
Tester Name: _______________
Device: _______________
OS Version: _______________
Network: _______________
Browser: _______________

AUTHENTICATION
[ ] Sign Up works
[ ] Sign In works
[ ] Logout works
[ ] Password reset works

PRODUCTS
[ ] Page loads
[ ] Images display
[ ] Products can be searched
[ ] Add to cart works

CART
[ ] Items persist
[ ] Quantity updates
[ ] Remove works
[ ] Total calculates

CHECKOUT
[ ] Form requires fields
[ ] Address input works
[ ] Payment selection works
[ ] Order creation succeeds

CONFIRMATION
[ ] Page loads correctly
[ ] Invoice generates
[ ] Email sent

PERFORMANCE
[ ] Lighthouse Score: ___
[ ] Load Time: ___ seconds
[ ] Scroll Smoothness: Good / Fair / Poor

ISSUES FOUND
1. ____________________
2. ____________________
3. ____________________

CONSOLE ERRORS
[ ] None found
[ ] Issue: ____________________
```

---

## 🚀 Pre-Launch Sign-Off

Before going live, ALL of the following must pass:

### Critical (Must Pass)
- [x] All flows complete on iPhone + Android
- [x] No console errors on any device
- [x] Responsive design validated across breakpoints
- [x] Payment processing works end-to-end
- [x] Order confirmation shows correctly
- [x] Images load properly on 4G network
- [x] Forms are accessible and working

### Important (Should Pass)
- [x] Lighthouse score ≥ 85
- [x] Pages load < 3s on 4G
- [x] No horizontal scroll on mobile
- [x] Custom fonts load and display correctly
- [x] All buttons tappable (44x44px minimum)

### Nice-to-Have (Can be fixed post-launch)
- [x] Animations smooth on lower-end devices
- [x] Dark mode working (if implemented)
- [x] Offline fallback page exists

---

## 🛠 Common Mobile Issues & Fixes

### Issue: Keyboard Covers Form
**Fix**: Add top margin/padding when input focused
```css
input:focus {
  scroll-margin-top: 100px;
}
```

### Issue: Buttons Not Tappable
**Fix**: Ensure minimum 44x44px size
```css
button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

### Issue: Text Too Small
**Fix**: Use minimum 16px font size
```css
body {
  font-size: 16px; /* Don't go below this */
}
```

### Issue: Images Distorted
**Fix**: Use `object-fit: cover` with aspect ratio
```css
img {
  width: 100%;
  height: auto;
  object-fit: cover;
  aspect-ratio: 1;
}
```

### Issue: Horizontal Scroll on Mobile
**Fix**: Check for elements wider than viewport
```css
* {
  max-width: 100vw;
  overflow-x: hidden;
}
```

---

## 📱 Recommended Testing Apps

- **BrowserStack**: Real device testing (30 min free trial)
- **Responsively App**: Desktop app for responsive testing
- **Chrome DevTools**: Built-in mobile emulation
- **Safari DevTools**: For iOS testing
- **Lighthouse CI**: Automated Lighthouse testing
- **Percy**: Visual regression testing

---

## 🎬 Test Execution Steps (Live Testing)

1. **Day 1**: iPhone (5G) + Android (4G) - Happy path flows
2. **Day 2**: iPhone (3G) + Android (slow network) - Performance
3. **Day 3**: All devices - Edge cases & errors
4. **Day 4**: Final validation - All fixes verified
5. **Deploy**: When all critical items pass ✅

**Estimated Total Time**: 8-10 hours per person

---

**When ready to test, run:**
```bash
npm run dev
# Then tunnel with ngrok to test on real devices:
ngrok http 3000
# Share the ngrok URL with testing team
```

**Questions?** Check the console in your browser's DevTools (F12) for detailed error messages.
