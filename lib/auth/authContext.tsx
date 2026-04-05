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
import { doc, setDoc, getDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES, MEMBER_TIERS } from '@/lib/constants/database';

export interface AuthUser extends User {
  roles?: string[];
  selectedRole?: string;
  memberTier?: string;
  isNewUser?: boolean;
  onboardingCompleted?: boolean;
  roleSelectionComplete?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  roleSelectionComplete: boolean;
  currentRole: string | null;
  
  // Auth methods
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  
  // Workflow methods
  completeOnboarding: () => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [roleSelectionComplete, setRoleSelectionComplete] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Listen for auth state changes and restore user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Get user document
          const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
          const userData = userDoc.data();
          
          if (userData) {
            const authUser: AuthUser = {
              ...currentUser,
              roles: userData.roles || [USER_ROLES.MEMBER],
              selectedRole: userData.selectedRole || USER_ROLES.MEMBER,
              roleSelectionComplete: userData.roleSelectionComplete || false,
              onboardingCompleted: userData.onboardingCompleted || false,
              memberTier: userData.memberTier || MEMBER_TIERS.BRONZE,
            };
            
            setUser(authUser);
            setCurrentRole(authUser.selectedRole || USER_ROLES.MEMBER);
            setRoleSelectionComplete(authUser.roleSelectionComplete || false);
            setOnboardingCompleted(authUser.onboardingCompleted || false);
            setError(null);
          } else {
            // New user - create document
            const newAuthUser: AuthUser = {
              ...currentUser,
              roles: [USER_ROLES.MEMBER],
              selectedRole: USER_ROLES.MEMBER,
              roleSelectionComplete: false,
              onboardingCompleted: false,
              memberTier: MEMBER_TIERS.BRONZE,
              isNewUser: true,
            };
            setUser(newAuthUser);
            setCurrentRole(USER_ROLES.MEMBER);
            setRoleSelectionComplete(false);
            setOnboardingCompleted(false);
          }
        } else {
          setUser(null);
          setCurrentRole(null);
          setRoleSelectionComplete(false);
          setOnboardingCompleted(false);
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

  const signup = async (email: string, password: string, membershipType?: string, name?: string) => {
    try {
      setError(null);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Update profile
      await updateProfile(userCredential.user, {
        displayName: name || email.split('@')[0],
      });

      // Determine the membership type (from parameter or default)
      const selectedMembership = membershipType || USER_ROLES.MEMBER;

      // Create user document with new workflow fields
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        id: uid,
        email,
        name: name || email.split('@')[0],
        roles: [selectedMembership],
        selectedRole: selectedMembership,
        membershipType: selectedMembership,
        roleSelectionComplete: false, // User needs to select role
        onboardingCompleted: false, // User needs to complete onboarding
        memberTier: MEMBER_TIERS.BRONZE,
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

      const newAuthUser: AuthUser = {
        ...userCredential.user,
        roles: [selectedMembership],
        selectedRole: selectedMembership,
        roleSelectionComplete: false,
        onboardingCompleted: false,
        memberTier: MEMBER_TIERS.BRONZE,
        isNewUser: true,
      };
      
      setUser(newAuthUser);
      setCurrentRole(selectedMembership);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
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
      setCurrentRole(null);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
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

        setUser({
          ...auth.currentUser,
          ...user,
        } as AuthUser);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  // Complete onboarding flow
  const completeOnboarding = async () => {
    try {
      setError(null);
      if (auth.currentUser) {
        await setDoc(
          doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
          {
            onboardingCompleted: true,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        setOnboardingCompleted(true);
        if (user) {
          setUser({ ...user, onboardingCompleted: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
      throw err;
    }
  };

  // Select primary role (after onboarding, before home)
  const selectRole = async (role: string) => {
    try {
      setError(null);
      if (auth.currentUser) {
        await setDoc(
          doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
          {
            selectedRole: role,
            roleSelectionComplete: true,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        setCurrentRole(role);
        setRoleSelectionComplete(true);
        if (user) {
          setUser({
            ...user,
            selectedRole: role,
            roleSelectionComplete: true,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to select role');
      throw err;
    }
  };

  // Switch to a different role
  const switchRole = async (role: string) => {
    try {
      setError(null);
      if (auth.currentUser && user?.roles?.includes(role)) {
        await setDoc(
          doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
          {
            selectedRole: role,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        setCurrentRole(role);
        if (user) {
          setUser({ ...user, selectedRole: role });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to switch role');
      throw err;
    }
  };

  // Refresh user data from database
  const refreshUserData = async () => {
    try {
      setError(null);
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid));
        const userData = userDoc.data();
        
        if (userData) {
          const authUser: AuthUser = {
            ...auth.currentUser,
            roles: userData.roles || [USER_ROLES.MEMBER],
            selectedRole: userData.selectedRole || USER_ROLES.MEMBER,
            roleSelectionComplete: userData.roleSelectionComplete || false,
            onboardingCompleted: userData.onboardingCompleted || false,
            memberTier: userData.memberTier || MEMBER_TIERS.BRONZE,
          };
          
          setUser(authUser);
          setCurrentRole(authUser.selectedRole || USER_ROLES.MEMBER);
          setRoleSelectionComplete(authUser.roleSelectionComplete || false);
          setOnboardingCompleted(authUser.onboardingCompleted || false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh user data');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        onboardingCompleted,
        roleSelectionComplete,
        currentRole,
        logout,
        signup,
        login,
        resetPassword,
        updateUserProfile,
        completeOnboarding,
        selectRole,
        switchRole,
        refreshUserData,
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
