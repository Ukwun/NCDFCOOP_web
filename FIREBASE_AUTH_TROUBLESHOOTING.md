# 🚀 Firebase Authentication Error - Troubleshooting Guide

**Error Message**: `Firebase: Error (auth/network-request-failed)`

---

## ⚠️ What This Error Means

This error indicates that the client-side code cannot reach Firebase Authentication servers. The most common causes are:

1. **Firebase API Key not configured** - Missing or invalid `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`
2. **Network connectivity issue** - Browser/server cannot reach Firebase
3. **Firebase project not set up** - Email/Password auth not enabled in Firebase Console
4. **API restrictions** - Firebase API key has domain restrictions that don't include your app

---

## 🔧 QUICK FIX STEPS

### Step 1: Verify Firebase Credentials in `.env.local`

Check that your `.env.local` file has these variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBu5HDs_wuhKy7A5sCjdvNZY4t5vnZ6Fag
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coop-commerce-8d43f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coop-commerce-8d43f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coop-commerce-8d43f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=962109579563
NEXT_PUBLIC_FIREBASE_APP_ID=1:962109579563:web:a0fa92699be3cf861ee56e
```

**Status**: ✅ Currently configured

---

### Step 2: Enable Email/Password Authentication in Firebase

1. Go to: https://console.firebase.google.com
2. Select your project: `coop-commerce-8d43f`
3. Go to **Authentication** → **Sign-in method**
4. Find "Email/Password" and click the **Enable** toggle
5. Click **Save**

---

### Step 3: Check API Key Restrictions (if applicable)

If you restricted your API key to specific domains:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API Key (matches `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. Click to edit it
4. Under "Application restrictions", add:
   - `localhost:3000` (for local development)
   - `yourdomain.com` (for production)

---

### Step 4: Test Firebase Connection

We've added diagnostic tools to help troubleshoot:

1. **Test Firebase Auth**: http://localhost:3000/diagnostics
   - Click "Test Firebase Auth" button
   - This will attempt to connect to Firebase and show any errors

2. **Health Check API**: http://localhost:3000/api/health-check
   - Returns Firebase configuration status

3. **Manual API Test**: http://localhost:3000/api/test-firebase
   - POST endpoint to test Firebase authentication directly

---

## 📋 Diagnostic Checklist

Run through these checks:

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` is set and not empty
- [ ] All 6 Firebase environment variables are present
- [ ] Firebase project created at https://console.firebase.google.com
- [ ] Email/Password authentication is **Enabled** in Firebase Console
- [ ] Browser can access `https://identitytoolkit.googleapis.com` (Firebase API endpoint)
- [ ] No ad blockers or browser extensions blocking Firebase requests
- [ ] Development server is running (`npm run dev`)

---

## 🎯 What We've Implemented to Help

### 1. **Better Error Messages** ✅
Updated `SignupScreen.tsx` to provide specific error messages:
- "Network connection failed" for network errors
- "This email is already registered" for duplicate emails
- "Password is too weak" for weak passwords
- etc.

### 2. **Firebase Configuration Validation** ✅
Updated `lib/firebase/config.ts` to:
- Check if all environment variables are set
- Log warnings if Firebase config is incomplete
- Provide initialization status messages

### 3. **Detailed Error Logging** ✅
Updated `lib/auth/authContext.tsx` to:
- Log error codes and details to console
- Handle specific Firebase error codes
- Provide user-friendly error messages

### 4. **Diagnostic Endpoints** ✅
Created new endpoints:
- `/api/health-check` - Checks Firebase credentials
- `/api/test-firebase` - Tests Firebase auth directly
- `/diagnostics` - Interactive troubleshooting page

---

## 🔍 Common Fix Scenarios

### Scenario 1: `.env.local` Not Found
**Error**: Firebase not initialized, keys missing

**Fix**:
```bash
# Copy the template and update with your keys
cp .env.example .env.local

# Edit .env.local with your Firebase project credentials
```

### Scenario 2: Wrong API Key
**Error**: `auth/invalid-api-key` or `auth/invalid-app-id`

**Fix**:
1. Go to: https://console.firebase.google.com → Project Settings
2. Copy the exact API KEY from "Web apps" section
3. Paste into `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local`
4. Restart dev server: `npm run dev`

### Scenario 3: Email/Password Auth Not Enabled
**Error**: `auth/operation-not-allowed`

**Fix**:
1. Firebase Console → Authentication → Sign-in method
2. Find "Email/Password"
3. Click **Enable** (should be highlighted in blue)
4. Click **Save**

### Scenario 4: Domain Restriction on API Key
**Error**: `Permission denied` or `auth/invalid-api-key`

**Fix**:
1. Google Cloud Console → APIs & Services → Credentials
2. Find your API Key
3. Edit → Application restrictions
4. Set to "None" for development, or add `localhost:3000`

---

## 📞 Testing the Signup Flow

### If Firebase is Working: ✅

You should be able to:
1. Navigate to http://localhost:3000/signup
2. Enter email and password
3. Click "Create Account"
4. See success redirect or proper error message

### If Firebase is NOT Working: ❌

You'll see:
- "Network connection failed" error
- OR specific error from Firebase (check console logs)

---

## 🛠️ Debug Information

### Browser Console
Open DevTools (F12) and check the **Console** tab:
- Look for error messages starting with "Signup error:"
- Check for CORS or network errors
- Look for Firebase initialization warnings

### Server Logs
Watch the terminal running `npm run dev`:
- Look for "Firebase initialization error" messages
- Check if `/signup` route compiles with errors

### Test Endpoint Response
Visit: http://localhost:3000/api/test-firebase
(POST with `{"email": "test@example.com", "password": "Test123!"}`))

Response shows:
- Firebase connection status
- Any Firebase API errors
- Configuration validation results

---

## ✅ Solution Summary

The **`auth/network-request-failed`** error is typically fixed by:

1. **Ensuring Firebase is properly configured**
   - All 6 environment variables set in `.env.local`
   - Firebase project created with correct project ID

2. **Enabling Email/Password authentication**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password"

3. **Removing API key restrictions (if applicable)**
   - Or adding `localhost:3000` and your domain to restrictions

4. **Restarting the development server**
   - Kill `npm run dev` and restart it
   - This ensures new `.env.local` values are loaded

5. **Testing the connection**
   - Use the diagnostics page at `/diagnostics`
   - Run the API test at `/api/test-firebase`

---

## 📚 References

- [Firebase Setup Guide](FIREBASE_SETUP_GUIDE.md)
- [Firebase Documentation](https://firebase.google.com/docs/auth/web/start)
- [Firebase Console](https://console.firebase.google.com)
- [Google Cloud Console](https://console.cloud.google.com)

---

## 💡 Need More Help?

If you're still seeing the error:

1. Check the browser console (F12 → Console tab) for the full error
2. Run diagnostics at http://localhost:3000/diagnostics
3. Test Firebase connection at http://localhost:3000/api/test-firebase
4. Check the `.env.local` file has all required variables
5. Verify Firebase Email/Password auth is **Enabled**

---

**Status**: ✅ Diagnostic tools installed and ready to use

**Last Updated**: April 6, 2026
