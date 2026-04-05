# IMAGE ASSET PLACEMENT GUIDE

**Date:** April 5, 2026  
**Status:** Ready to integrate onboarding screens and logo

---

## 📁 FILES YOU NEED TO PLACE

You have 4 image files that need to be organized in specific folders. Here's exactly where each one goes:

### File 1: NCDFCOOP Logo
**What you have:** The NCDFCOOP logo with green circle and orange text  
**Where it goes:** `public/images/logo/ncdfcoop-logo.png`  
**Size to save as:** PNG format, 200x200px or larger   
**Used in:** Navigation header, Login screen, Signup screen

### File 2: Community/Group Image
**What you have:** Group of happy people showing the app (community feature)  
**Where it goes:** `public/images/onboarding/community.jpg`  
**Size to save as:** 1080x1440px (mobile optimized) or larger  
**Used in:** Onboarding screen (slide 1)

### File 3: Shopping Image
**What you have:** Woman browsing products on couch at home  
**Where it goes:** `public/images/onboarding/shopping.jpg`  
**Size to save as:** 1080x1440px (mobile optimized) or larger  
**Used in:** Onboarding screen (slide 2)

### File 4: Commerce/Shopping Image
**What you have:** Woman with shopping bags using the app while shopping  
**Where it goes:** `public/images/onboarding/purchases.jpg`  
**Size to save as:** 1080x1440px (mobile optimized) or larger  
**Used in:** Onboarding screen (slide 3)

---

## 🛠️ HOW TO PLACE FILES (WINDOWS)

### Option 1: File Explorer (Easiest)

**Step 1: Navigate to Logo Folder**
```
C:\development\coop_commerce_web\public\images\logo\
```

**Step 2: Place Logo**
1. Copy your NCDFCOOP logo image
2. Paste it in the `logo` folder
3. Rename it to: `ncdfcoop-logo.png`
4. Verify: File appears in folder

**Step 3: Navigate to Onboarding Folder**
```
C:\development\coop_commerce_web\public\images\onboarding\
```

**Step 4: Place Onboarding Images**
1. Copy the group/community image
2. Paste it in the `onboarding` folder
3. Rename it to: `community.jpg`

4. Copy the woman at home image
5. Paste it in the `onboarding` folder
6. Rename it to: `shopping.jpg`

7. Copy the woman shopping image
8. Paste it in the `onboarding` folder
9. Rename it to: `purchases.jpg`

**Step 5: Verify**
Your folder structure should look like:
```
public/
├── images/
│   ├── logo/
│   │   └── ncdfcoop-logo.png          ✅
│   ├── onboarding/
│   │   ├── community.jpg              ✅
│   │   ├── shopping.jpg               ✅
│   │   └── purchases.jpg              ✅
│   └── icons/
└── ...
```

---

## ⌨️ HOW TO PLACE FILES (POWERSHELL)

If you prefer using the terminal:

```powershell
# Navigate to your project
cd c:\development\coop_commerce_web

# Copy logo (replace with actual file path)
Copy-Item "C:\path\to\ncdfcoop-logo.png" "public\images\logo\ncdfcoop-logo.png"

# Copy onboarding images
Copy-Item "C:\path\to\community-image.jpg" "public\images\onboarding\community.jpg"
Copy-Item "C:\path\to\shopping-image.jpg" "public\images\onboarding\shopping.jpg"
Copy-Item "C:\path\to\purchases-image.jpg" "public\images\onboarding\purchases.jpg"

# Verify files
ls public/images/logo/
ls public/images/onboarding/
```

---

## 🎯 WHAT EACH IMAGE DOES NOW

### Logo (ncdfcoop-logo.png)
✅ Shows on login screen (centered header)  
✅ Shows on signup screen (centered header)  
✅ Shows in navigation sidebar (desktop version)  
✅ Dark mode compatible  

**Styling:**
- Displays as 60x60px in headers
- 40x40px in navigation bar
- Responsive on all devices

### Community Image (community.jpg)
✅ First onboarding screen slide  
✅ Shows group of people with the app  
✅ Describes: "Join millions of members saving, shopping, and building wealth together"

### Shopping Image (shopping.jpg)
✅ Second onboarding screen slide  
✅ Shows woman browsing products  
✅ Describes: "Browse exclusive products with member-only discounts and deals"

### Purchases Image (purchases.jpg)
✅ Third onboarding screen slide  
✅ Shows woman shopping with bags  
✅ Describes: "Every purchase earns loyalty points and brings you closer to premium tiers"

---

## 🚀 AFTER PLACING FILES

Once you've placed the images, here's what happens:

### 1. Logo Appears
- On login screen (center)
- On signup screen (center)
- On navigation sidebar (desktop)
- Automatically responsive

### 2. Onboarding Screen Works
- First time users see onboarding carousel
- Swipe through 3 slides
- Shows our images with descriptions
- Users can skip or complete tour

### 3. Activity Tracked
- "onboarding_viewed" - when user sees each slide
- "onboarding_completed" - when user finishes
- "onboarding_skipped" - if they skip early

---

## 📐 IMAGE SPECIFICATIONS

### Logo Image
```
Format: PNG with transparency
Size: 200x200px minimum (up to 500x500px)
Colors: Green (#10B981), Orange (#F3951A), Dark Green
Quality: High resolution (300 DPI if possible)
Aspect ratio: 1:1 (square)
Background: Transparent
```

### Onboarding Images
```
Format: JPG/JPEG
Size: 1080x1440px (mobile), or larger
Colors: Full color, high quality
Quality: High resolution
Aspect ratio: 3:4 (portrait)
Background: Can have background (photo)
```

---

## ✅ TROUBLESHOOTING

### "Logo not showing on login screen"
**Solution:**
1. Check file exists: `public/images/logo/ncdfcoop-logo.png`
2. Check file name is EXACTLY: `ncdfcoop-logo.png` (case-sensitive)
3. Check file is PNG format
4. Rebuild: `npm run build`
5. Clear browser cache: `Ctrl+Shift+Delete`

### "Onboarding images not showing"
**Solution:**
1. Check files exist in `public/images/onboarding/`
2. Check file names are EXACTLY:
   - `community.jpg`
   - `shopping.jpg`
   - `purchases.jpg`
3. Check all files are JPG format
4. Rebuild: `npm run build`
5. Clear browser cache

### "Images look blurry or stretched"
**Solution:**
1. Ensure image sizes are correct (see specs above)
2. Use Next.js Image component (already coded)
3. Next.js optimizes images automatically
4. May take a few seconds to render

### "Dark mode issues with logo"
**Solution:**
Our Logo component is designed to work in both light and dark modes.
If logo looks wrong in dark mode:
1. Check if logo has transparent background
2. Consider logo colors work on both light and dark
3. Component automatically adds text "NCDF" (green) + "COOP" (orange)

---

## 🔄 COMPONENT INTEGRATION

The components that use your images are already coded:

### Logo Component
```typescript
// File: components/Logo.tsx
// Displays logo with responsive sizing
// Used in: Navigation, LoginScreen, SignupScreen

<Logo size="small" />      // 40x40px
<Logo size="medium" />     // 60x60px  
<Logo size="large" />      // 120x120px
```

### Onboarding Component
```typescript
// File: components/OnboardingScreen.tsx
// Displays onboarding carousel with your images
// Used on: First-time user experience

// Slides automatically reference:
// /images/onboarding/community.jpg
// /images/onboarding/shopping.jpg
// /images/onboarding/purchases.jpg
```

### Updated Screens
- ✅ LoginScreen - Shows logo in header
- ✅ SignupScreen - Shows logo in header
- ✅ Navigation - Shows logo in sidebar (desktop)
- ✅ OnboardingScreen - Shows carousel with all images

---

## 📋 FINAL CHECKLIST

Before you're done, verify:

```
LOGO
☑️ File exists: public/images/logo/ncdfcoop-logo.png
☑️ File format: PNG
☑️ File size: 200x200px or larger
☑️ Appears on login screen
☑️ Appears on signup screen
☑️ Appears in navigation sidebar

ONBOARDING IMAGES
☑️ community.jpg exists and shows group
☑️ shopping.jpg exists and shows women browsing
☑️ purchases.jpg exists and shows woman shopping
☑️ All in: public/images/onboarding/
☑️ All are JPG format
☑️ All are 1080x1440px or larger
☑️ Onboarding carousel displays correctly

OVERALL
☑️ Images appear correctly
☑️ Images look sharp (not pixelated)
☑️ Images are responsive (work mobile to desktop)
☑️ Logo looks good in dark mode
☑️ Onboarding transitions smoothly
```

---

## 🎬 NEXT STEPS

1. **Place your image files** using File Explorer or PowerShell
2. **Verify folder structure** matches the paths above
3. **Restart dev server** (if running locally):
   ```bash
   npm run dev
   ```
4. **Test login screen** - Logo should appear centered
5. **Test signup screen** - Logo should appear centered
6. **Test onboarding** - Carousel should show all 3 images

---

## 💡 TIPS

- **Backup originals** - Keep original image files somewhere safe
- **Resize images** - Use an online tool if sizes are too large
- **Optimize for web** - JPGs should be compressed (under 500KB each)
- **Test on mobile** - Check images on real phone or browser DevTools
- **Dark mode test** - Toggle dark mode to ensure images work both ways

---

**Ready to place your images?** Follow the steps above and you'll have a professional-looking onboarding experience matching your mobile app! 🚀

