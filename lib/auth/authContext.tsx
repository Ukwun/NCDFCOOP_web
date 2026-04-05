'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES, MEMBER_TIERS } from '@/lib/constants/database';

export interface AuthUser extends User {
  role?: string;
  memberTier?: string;
  isNewUser?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Get user role and member data
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
          const memberDoc = await getDoc(doc(db, COLLECTIONS.MEMBERS, currentUser.uid));

          const authUser: AuthUser = currentUser as AuthUser;
          authUser.role = userDoc.data()?.role || USER_ROLES.MEMBER;
          authUser.memberTier = memberDoc.data()?.tier || MEMBER_TIERS.BRONZE;

          setUser(authUser);
          setError(null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    try {
      setError(null);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Update profile
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Create user document
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        id: uid,
        email,
        name,
        role: USER_ROLES.MEMBER,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePicture: '',
        phone: '',
        address: '',
        isActive: true,
      });

      // Create member profile
      await setDoc(doc(db, COLLECTIONS.MEMBERS, uid), {
        userId: uid,
        memberSince: Timestamp.now(),
        savingsBalance: 0,
        loyaltyPoints: 0,
        tier: MEMBER_TIERS.BRONZE,
        totalPurchases: 0,
        totalDeposits: 0,
        referralCode: generateReferralCode(),
        isVerified: false,
        kycStatus: 'pending',
      });

      setUser(userCredential.user as AuthUser);
    } catch (err: any) {
      const errorMessage = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : err.message || 'Failed to create account';
      setError(errorMessage);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user as AuthUser);
    } catch (err: any) {
      const errorMessage = err.code === 'auth/user-not-found'
        ? 'Email not found. Please create an account.'
        : err.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : 'Failed to login';
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      setError(null);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL,
        });

        // Update Firestore
        await setDoc(
          doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
          {
            name: displayName,
            profilePicture: photoURL,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

        setUser(auth.currentUser as AuthUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        logout,
        signup,
        login,
        resetPassword,
        updateUserProfile,
      }}
    >
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

// Helper function to generate referral code
function generateReferralCode(): string {
  return 'NCDF' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
