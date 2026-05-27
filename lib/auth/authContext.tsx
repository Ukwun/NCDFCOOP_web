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
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES, MEMBER_TIERS } from '@/lib/constants/database';

export interface AuthUser extends User {
  roles?: string[];
  selectedRole?: string;
  membershipStatus?: 'active' | 'inactive' | 'pending';
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
  logout: () => Promise<void>;
  signup: (email: string, password: string, nameOrMembershipType?: string, membershipTypeMaybe?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateReferralCode(): string {
  return `NCDF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizeRoleInput(role?: string): string {
  if (!role) return USER_ROLES.MEMBER;

  const normalized = role.toLowerCase().trim();
  if (normalized === 'wholesale_buyer' || normalized === 'wholesale') {
    return USER_ROLES.INSTITUTIONAL_BUYER;
  }

  return normalized;
}

function getRoleOverrideFromStorage(validRoles: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const overrideRole = normalizeRoleInput(window.localStorage.getItem('selectedRoleOverride') || undefined);
  return validRoles.includes(overrideRole) ? overrideRole : null;
}

function resolveSignupInputs(nameOrMembershipType?: string, membershipTypeMaybe?: string) {
  const validRoles = Object.values(USER_ROLES) as string[];
  if (!nameOrMembershipType) {
    return { name: '', membershipType: USER_ROLES.MEMBER };
  }

  const lower = normalizeRoleInput(nameOrMembershipType);
  if (validRoles.includes(lower)) {
    return { name: '', membershipType: lower };
  }

  const normalizedMembershipTypeMaybe = normalizeRoleInput(membershipTypeMaybe);

  return {
    name: nameOrMembershipType,
    membershipType: (normalizedMembershipTypeMaybe && validRoles.includes(normalizedMembershipTypeMaybe)
      ? normalizedMembershipTypeMaybe
      : USER_ROLES.MEMBER),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [roleSelectionComplete, setRoleSelectionComplete] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setCurrentRole(null);
          setRoleSelectionComplete(false);
          setOnboardingCompleted(false);
          return;
        }

        const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userData) {
          const validRoles = Object.values(USER_ROLES) as string[];
          const selectedRole = getRoleOverrideFromStorage(validRoles)
            || normalizeRoleInput(userData.selectedRole || USER_ROLES.MEMBER);
          const roles = Array.from(new Set([...(userData.roles || [USER_ROLES.MEMBER]), selectedRole]));
          const authUser: AuthUser = {
            ...currentUser,
            roles,
            selectedRole,
            membershipStatus:
              userData.membershipStatus ||
              (selectedRole === USER_ROLES.MEMBER
                ? 'active'
                : 'inactive'),
            roleSelectionComplete: !!userData.roleSelectionComplete,
            onboardingCompleted: !!userData.onboardingCompleted,
            memberTier: userData.memberTier || MEMBER_TIERS.BRONZE,
          };

          setUser(authUser);
          setCurrentRole(selectedRole);
          setRoleSelectionComplete(!!authUser.roleSelectionComplete);
          setOnboardingCompleted(!!authUser.onboardingCompleted);
          setError(null);
        } else {
          let urlRole: string | null = null;
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            urlRole = url.searchParams.get('type');
          }

          const validRoles = Object.values(USER_ROLES) as string[];
          const normalizedUrlRole = normalizeRoleInput(urlRole || undefined);
          const selectedRole = validRoles.includes(normalizedUrlRole) ? normalizedUrlRole : USER_ROLES.MEMBER;

          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || '',
            roles: [selectedRole],
            selectedRole,
            membershipType: selectedRole,
            roleSelectionComplete: false,
            onboardingCompleted: false,
            membershipStatus: selectedRole === USER_ROLES.MEMBER ? 'active' : 'inactive',
            memberTier: MEMBER_TIERS.BRONZE,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            profilePicture: currentUser.photoURL || '',
            phone: currentUser.phoneNumber || '',
            address: '',
            isActive: true,
          });

          setUser({
            ...currentUser,
            roles: [selectedRole],
            selectedRole,
            membershipStatus: selectedRole === USER_ROLES.MEMBER ? 'active' : 'inactive',
            roleSelectionComplete: false,
            onboardingCompleted: false,
            memberTier: MEMBER_TIERS.BRONZE,
            isNewUser: true,
          });
          setCurrentRole(selectedRole);
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

  const signup = async (email: string, password: string, nameOrMembershipType?: string, membershipTypeMaybe?: string) => {
    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');

      const { name, membershipType } = resolveSignupInputs(nameOrMembershipType, membershipTypeMaybe);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: name || email.split('@')[0],
      });

      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        id: uid,
        email,
        name: name || email.split('@')[0],
        roles: [membershipType],
        selectedRole: membershipType,
        membershipType,
        roleSelectionComplete: false,
        onboardingCompleted: false,
        memberTier: MEMBER_TIERS.BRONZE,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePicture: '',
        phone: '',
        address: '',
        isActive: true,
      });

      await setDoc(doc(db, COLLECTIONS.MEMBERS, uid), {
        userId: uid,
        memberSince: Timestamp.now(),
        loyaltyPoints: 0,
        tier: MEMBER_TIERS.BRONZE,
        totalPurchases: 0,
        referralCode: generateReferralCode(),
        isVerified: false,
        kycStatus: 'pending',
      });

      setUser({
        ...userCredential.user,
        roles: [membershipType],
        selectedRole: membershipType,
        membershipStatus: membershipType === USER_ROLES.MEMBER ? 'active' : 'inactive',
        roleSelectionComplete: false,
        onboardingCompleted: false,
        memberTier: MEMBER_TIERS.BRONZE,
        isNewUser: true,
      });
      setCurrentRole(membershipType);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      if (!auth) throw new Error('Firebase not initialized');
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
      if (!auth) throw new Error('Firebase not initialized');
      await signOut(auth);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('selectedRoleOverride');
      }
      setUser(null);
      setCurrentRole(null);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to logout');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      if (!auth) throw new Error('Firebase not initialized');
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
      throw err;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) return;

      await updateProfile(auth.currentUser, { displayName, photoURL });
      await setDoc(
        doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
        {
          name: displayName,
          profilePicture: photoURL,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      setUser({ ...auth.currentUser, ...user } as AuthUser);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
      throw err;
    }
  };

  const signInWithFacebook = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new FacebookAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
    } catch (err: any) {
      setError(err?.message || 'Facebook sign-in failed');
      throw err;
    }
  };

  const signInWithApple = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new OAuthProvider('apple.com');
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
    } catch (err: any) {
      setError(err?.message || 'Apple sign-in failed');
      throw err;
    }
  };

  const completeOnboarding = async () => {
    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) return;

      await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setOnboardingCompleted(true);
      if (user) setUser({ ...user, onboardingCompleted: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding');
      throw err;
    }
  };

  const selectRole = async (role: string) => {
    const normalizedRole = normalizeRoleInput(role);

    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) return;

      await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
        roles: arrayUnion(normalizedRole),
        selectedRole: normalizedRole,
        roleSelectionComplete: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedRoleOverride', normalizedRole);
      }

      setCurrentRole(normalizedRole);
      setRoleSelectionComplete(true);
      if (user) {
        const existingRoles = user.roles || [];
        setUser({
          ...user,
          selectedRole: normalizedRole,
          roleSelectionComplete: true,
          roles: Array.from(new Set([...existingRoles, normalizedRole])),
        });
      }
    } catch (err: any) {
      const errorCode = String(err?.code || '');
      const canFallbackToLocalRole =
        errorCode === 'permission-denied' ||
        errorCode === 'unavailable' ||
        errorCode === 'auth/network-request-failed' ||
        errorCode.includes('permission');

      if (canFallbackToLocalRole) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('selectedRoleOverride', normalizedRole);
        }

        setCurrentRole(normalizedRole);
        setRoleSelectionComplete(true);
        if (user) {
          const existingRoles = user.roles || [];
          setUser({
            ...user,
            selectedRole: normalizedRole,
            roleSelectionComplete: true,
            roles: Array.from(new Set([...existingRoles, normalizedRole])),
          });
        }
        return;
      }

      setError(err?.message || 'Failed to select role');
      throw err;
    }
  };

  const switchRole = async (role: string) => {
    const normalizedRole = normalizeRoleInput(role);

    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser || !user) return;

      const existingRoles = user.roles || [];
      if (!existingRoles.includes(normalizedRole)) {
        await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
          roles: arrayUnion(normalizedRole),
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }

      await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
        selectedRole: normalizedRole,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedRoleOverride', normalizedRole);
      }

      setCurrentRole(normalizedRole);
      setUser({ ...user, selectedRole: normalizedRole, roles: Array.from(new Set([...existingRoles, normalizedRole])) });
    } catch (err: any) {
      const errorCode = String(err?.code || '');
      const canFallbackToLocalRole =
        errorCode === 'permission-denied' ||
        errorCode === 'unavailable' ||
        errorCode === 'auth/network-request-failed' ||
        errorCode.includes('permission');

      if (canFallbackToLocalRole) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('selectedRoleOverride', normalizedRole);
        }

        const existingRoles = user.roles || [];
        setCurrentRole(normalizedRole);
        setUser({ ...user, selectedRole: normalizedRole, roles: Array.from(new Set([...existingRoles, normalizedRole])) });
        return;
      }

      setError(err?.message || 'Failed to switch role');
      throw err;
    }
  };

  const refreshUserData = async () => {
    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) return;

      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid));
      const userData = userDoc.data();
      if (!userData) return;

      const validRoles = Object.values(USER_ROLES) as string[];
      const selectedRole = getRoleOverrideFromStorage(validRoles)
        || normalizeRoleInput(userData.selectedRole || USER_ROLES.MEMBER);
      const roles = Array.from(new Set([...(userData.roles || [USER_ROLES.MEMBER]), selectedRole]));
      const refreshedUser: AuthUser = {
        ...auth.currentUser,
        roles,
        selectedRole,
        membershipStatus:
          userData.membershipStatus ||
          (selectedRole === USER_ROLES.MEMBER
            ? 'active'
            : 'inactive'),
        roleSelectionComplete: !!userData.roleSelectionComplete,
        onboardingCompleted: !!userData.onboardingCompleted,
        memberTier: userData.memberTier || MEMBER_TIERS.BRONZE,
      };

      setUser(refreshedUser);
      setCurrentRole(selectedRole);
      setRoleSelectionComplete(!!refreshedUser.roleSelectionComplete);
      setOnboardingCompleted(!!refreshedUser.onboardingCompleted);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh user data');
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
        signInWithGoogle,
        signInWithFacebook,
        signInWithApple,
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
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}