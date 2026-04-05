# 💻 IMPLEMENTATION TEMPLATES & CODE EXAMPLES

Quick copy-paste ready code for implementing backend features

---

## 1. AUTHENTICATION SETUP

### File: `lib/firebase/config.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
```

### File: `lib/auth/authContext.tsx`
```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 2. LOGIN SCREEN

### File: `components/LoginScreen.tsx`
```typescript
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect will happen automatically via useAuth in layout
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Welcome Back
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
```

---

## 3. SIGNUP SCREEN

### File: `components/SignupScreen.tsx`
```typescript
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email,
        name,
        role: 'member',
        createdAt: new Date(),
        profilePicture: '',
      });

      // Create member profile
      await setDoc(doc(db, 'members', userId), {
        userId,
        memberSince: new Date(),
        savingsBalance: 0,
        loyaltyPoints: 0,
        tier: 'bronze',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
```

---

## 4. UPDATED HOME SCREEN WITH REAL DATA

### File: `components/HomeScreen.tsx` (with backend)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/authContext';

interface MemberData {
  savingsBalance: number;
  loyaltyPoints: number;
  tier: string;
  memberSince: Date;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch member data
  useEffect(() => {
    if (!user) return;

    const fetchMemberData = async () => {
      try {
        const docRef = doc(db, 'members', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMemberData(docSnap.data() as MemberData);
        }
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [user]);

  const handleDeposit = async () => {
    if (!user || !depositAmount || !memberData) return;

    try {
      const amount = parseFloat(depositAmount);
      const newBalance = memberData.savingsBalance + amount;

      // Update member balance
      const memberRef = doc(db, 'members', user.uid);
      await updateDoc(memberRef, {
        savingsBalance: newBalance,
      });

      // Update local state
      setMemberData({
        ...memberData,
        savingsBalance: newBalance,
      });

      // Show success and reset
      alert(`✅ Deposit of ₦${amount.toFixed(2)} successful!`);
      setDepositAmount('');
      setShowDepositDialog(false);
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Failed to process deposit');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome, Member 🎉
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your savings and membership benefits
        </p>
      </div>

      {/* Savings Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6 shadow-lg">
        <p className="text-blue-100 mb-2">Total Savings</p>
        <h2 className="text-4xl font-bold mb-4">
          ₦{memberData?.savingsBalance.toLocaleString() || '0'}
        </h2>
        <div className="flex justify-between text-blue-100 text-sm">
          <span>Member ID: MEM#{user?.uid?.substring(0, 8).toUpperCase()}</span>
          <span>Tier: {memberData?.tier}</span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowDepositDialog(true)}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
        >
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-bold text-gray-900 dark:text-white">Quick Deposit</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Add funds to your savings</p>
        </button>

        <button
          onClick={() => alert('Withdrawal request initiated')}
          className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:shadow-lg transition-shadow text-left"
        >
          <div className="text-3xl mb-2">🏦</div>
          <h3 className="font-bold text-gray-900 dark:text-white">Withdraw</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Request withdrawal to account</p>
        </button>
      </div>

      {/* Member Benefits */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏅 Member Benefits</h3>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Access to member-exclusive deals</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Earn loyalty points on every purchase</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Free shipping on orders over ₦5,000</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-600">✓</span>
            <span className="text-gray-700 dark:text-gray-300">Priority customer support</span>
          </li>
        </ul>
      </div>

      {/* Deposit Dialog */}
      {showDepositDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quick Deposit</h2>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositDialog(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700"
              >
                Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. ACTIVITY TRACKING SERVICE

### File: `lib/services/activityTracker.ts`
```typescript
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ActivityLog {
  userId: string;
  action: string;
  details?: Record<string, any>;
  timestamp?: any;
}

export async function trackActivity(activity: ActivityLog) {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      ...activity,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Track these activities:
export const ACTIVITIES = {
  PAGE_VIEW: 'page_view',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PURCHASE: 'purchase',
  MESSAGE_SENT: 'message_sent',
  LOGIN: 'login',
  LOGOUT: 'logout',
  CART_ADDED: 'cart_added',
  OFFER_VIEWED: 'offer_viewed',
};

// Usage in components:
// await trackActivity({
//   userId: user.uid,
//   action: ACTIVITIES.DEPOSIT,
//   details: { amount: 5000 }
// });
```

---

## 6. ENVIRONMENT VARIABLES FILE

### File: `.env.local`
```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Paystack (Optional - add later)
NEXT_PUBLIC_PAYSTACK_KEY=your_paystack_key_here
```

---

## 7. UPDATED LAYOUT WITH AUTH PROVIDER

### File: `app/layout.tsx`
```typescript
'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/authContext';
import Navigation from '@/components/Navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NCDFCOOP Commerce - Website Version</title>
        <meta name="description" content="NCDFCOOP Commerce Platform - Member Dashboard" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900">
        <AuthProvider>
          <Navigation />
          <div className="flex-1 pb-24 md:pb-0">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 8. UPDATED NAVIGATION WITH AUTH CHECK

### File: `components/Navigation.tsx` (updated)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import HomeScreen from './HomeScreen';
import OfferScreen from './OfferScreen';
import MessageScreen from './MessageScreen';
import CartScreen from './CartScreen';
import MyNCDFCOOPScreen from './MyNCDFCOOPScreen';
import LoginScreen from './LoginScreen';

export default function Navigation() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'offer', label: 'Offer', icon: '🎁' },
    { id: 'message', label: 'Message', icon: '💬' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'profile', label: 'My NCDFCOOP', icon: '👤' },
  ];

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'offer':
        return <OfferScreen />;
      case 'message':
        return <MessageScreen />;
      case 'cart':
        return <CartScreen />;
      case 'profile':
        return <MyNCDFCOOPScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderScreen()}
      </div>

      {/* Navigation Bar (same as before) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:top-0 md:bottom-auto md:right-auto md:w-48 md:border-t-0 md:border-r md:h-screen md:flex md:flex-col">
        <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">NCDFCOOP</h1>
        </div>

        <div className="flex md:flex-col justify-around md:justify-start md:flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-none md:h-16 md:px-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 py-2 md:py-0 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="text-xl md:text-lg">{tab.icon}</span>
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="h-20 md:hidden"></div>
    </>
  );
}
```

---

## QUICK CHECKLIST

Copy these templates in this order:

1. ✅ `lib/firebase/config.ts` - Firebase setup
2. ✅ `lib/auth/authContext.tsx` - Auth context
3. ✅ `components/LoginScreen.tsx` - Login form
4. ✅ `components/SignupScreen.tsx` - Signup form
5. ✅ `lib/services/activityTracker.ts` - Activity tracking
6. ✅ `.env.local` - Environment variables
7. ✅ `app/layout.tsx` - Updated with provider
8. ✅ `components/HomeScreen.tsx` - Updated with real data
9. ✅ Update other screens similarly

Then run:
```bash
npm install firebase
npm run dev
```

---

All code is ready to copy-paste. Verify Firebase config keys before running! 🚀
