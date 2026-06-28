'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { COLLECTIONS, USER_ROLES, MEMBER_TIERS } from '@/lib/constants/database';
import { logActivity } from '@/lib/services/activityService';

export interface AuthUser extends User {
  roles?: string[];
  selectedRole?: string;
  currentRole?: string;
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

const LOCAL_ONBOARDING_KEY = 'ncdfcoop_onboarding_completed';
const LOCAL_ROLE_OVERRIDE_KEY = 'selectedRoleOverride';

function sanitizeRoleInput(role?: string): string | null {
  if (!role) return null;

  const normalized = role.toLowerCase().trim();
  if (
    normalized === 'wholesale_buyer' ||
    normalized === 'wholesale' ||
    normalized === 'institutional_buyer' ||
    normalized === 'institutional buyer' ||
    normalized === 'buyer'
  ) {
    return USER_ROLES.INSTITUTIONAL_BUYER;
  }

  if (normalized === 'seller') {
    return USER_ROLES.SELLER;
  }

  if (normalized === 'member') {
    return USER_ROLES.MEMBER;
  }

  return null;
}

function normalizeRoleInput(role?: string): string {
  return sanitizeRoleInput(role) || USER_ROLES.MEMBER;
}

function getLocalOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LOCAL_ONBOARDING_KEY) === 'true';
}

function setLocalOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_ONBOARDING_KEY, 'true');
}

function clearLocalOnboardingCompleted(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LOCAL_ONBOARDING_KEY);
}

function getRoleOverrideFromStorage(activeRoles: string[]): string | null {
  if (typeof window === 'undefined') return null;
  const overrideRole = sanitizeRoleInput(window.localStorage.getItem(LOCAL_ROLE_OVERRIDE_KEY) || undefined);
  return overrideRole && activeRoles.includes(overrideRole) ? overrideRole : null;
}

function resolveSignupInputs(nameOrMembershipType?: string, membershipTypeMaybe?: string) {
  const validRoles = Object.values(USER_ROLES) as string[];
  if (!nameOrMembershipType) {
    return { name: '', membershipType: USER_ROLES.MEMBER };
  }

  const lower = sanitizeRoleInput(nameOrMembershipType);
  if (lower && validRoles.includes(lower)) {
    return { name: '', membershipType: lower };
  }

  const normalizedMembershipTypeMaybe = sanitizeRoleInput(membershipTypeMaybe);

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
    if (typeof window !== 'undefined' && getLocalOnboardingCompleted()) {
      setOnboardingCompleted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!user) {
      window.localStorage.removeItem('userId');
      window.localStorage.removeItem('userEmail');
      window.localStorage.removeItem('userRole');
      window.localStorage.removeItem('membershipTier');
      return;
    }

    window.localStorage.setItem('userId', user.uid);
    window.localStorage.setItem('userEmail', user.email || '');
    window.localStorage.setItem('userRole', currentRole || '');
    window.localStorage.setItem('membershipType', currentRole || '');
    window.localStorage.setItem('membershipTier', user.memberTier || '');
  }, [currentRole, user]);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        const validRoles = Object.values(USER_ROLES) as string[];
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
          const roles = Array.from(new Set(Array.isArray(userData.roles)
            ? userData.roles.map(sanitizeRoleInput).filter(Boolean)
            : [USER_ROLES.MEMBER])) as string[];
          const storedRole = normalizeRoleInput(userData.selectedRole || USER_ROLES.MEMBER);
          const selectedRole = getRoleOverrideFromStorage(roles)
            || (roles.includes(storedRole) ? storedRole : roles[0] || USER_ROLES.MEMBER);
          const localOnboarding = getLocalOnboardingCompleted();
          const onboardingFromStorage = userData.onboardingCompleted || localOnboarding;
          const authUser: AuthUser = {
            ...currentUser,
            roles,
            selectedRole,
            currentRole: selectedRole,
            membershipStatus:
              userData.membershipStatus ||
              (selectedRole === USER_ROLES.MEMBER
                ? 'active'
                : 'inactive'),
            roleSelectionComplete: !!userData.roleSelectionComplete,
            onboardingCompleted: !!onboardingFromStorage,
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
          const localOnboarding = getLocalOnboardingCompleted();

          await setDoc(userRef, {
            id: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || '',
            roles: [selectedRole],
            selectedRole,
            membershipType: selectedRole,
            roleSelectionComplete: false,
            onboardingCompleted: localOnboarding,
            membershipStatus: selectedRole === USER_ROLES.MEMBER ? 'pending' : 'inactive',
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
            currentRole: selectedRole,
            membershipStatus: selectedRole === USER_ROLES.MEMBER ? 'pending' : 'inactive',
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
        membershipStatus: membershipType === USER_ROLES.MEMBER ? 'pending' : 'inactive',
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
        isActive: false,
        kycStatus: 'pending',
      });

      const localOnboarding = getLocalOnboardingCompleted();
      setUser({
        ...userCredential.user,
        roles: [membershipType],
        selectedRole: membershipType,
        membershipStatus: membershipType === USER_ROLES.MEMBER ? 'pending' : 'inactive',
        roleSelectionComplete: false,
        onboardingCompleted: localOnboarding,
        memberTier: MEMBER_TIERS.BRONZE,
        isNewUser: true,
      });
      setCurrentRole(membershipType);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
      void logActivity(uid, 'signup', { signupMethod: 'password' });
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
      void logActivity(userCredential.user.uid, 'login', {
        loginMethod: 'password',
      });
    } catch (err: any) {
      // Sanitize error messages to not expose system details
      let errorMessage = 'Unable to sign in. Please check your credentials and try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'We could not find an account with this email. Please create an account.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (!auth) throw new Error('Firebase not initialized');
      await signOut(auth);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('selectedRoleOverride');
        window.localStorage.removeItem('dev_autologin');
        window.localStorage.removeItem('userId');
        window.localStorage.removeItem('userEmail');
        window.localStorage.removeItem('userRole');
        window.localStorage.removeItem('displayName');
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
      const response = await fetch('/api/email/send-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send reset email. Please try again later.');
      }
    } catch (err: any) {
      // Sanitize error messages
      let errorMessage = 'Failed to send reset email. Please try again later.';

      if (err.code === 'auth/user-not-found') {
        // Don't reveal if email exists or not for security
        errorMessage = 'If an account exists with this email, you will receive a password reset link shortly.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
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

  const normalizeSocialError = (err: any, providerName: string) => {
    const message = err?.message || `${providerName} sign-in failed`;
    if (err?.code === 'auth/unauthorized-domain') {
      return `OAuth not authorized for this domain. Add ${window.location.hostname} to Firebase Authentication authorized domains.`;
    }
    if (err?.code === 'auth/popup-blocked') {
      return `${providerName} popup was blocked. Please allow popups for this site and try again.`;
    }
    if (err?.code === 'auth/popup-closed-by-user') {
      return `${providerName} sign-in popup was closed before completing.`;
    }
    if (err?.code === 'auth/operation-not-allowed') {
      return `${providerName} sign-in is not enabled yet. Please contact support or sign in with email and password.`;
    }
    return message;
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new GoogleAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
      void logActivity(result.user.uid, 'login', { loginMethod: 'google' });
    } catch (err: any) {
      // If popup flow is blocked or not allowed, fallback to redirect flow
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          const errorMessage = normalizeSocialError(redirectErr, 'Google');
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      const errorMessage = normalizeSocialError(err, 'Google');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithFacebook = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new FacebookAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
      void logActivity(result.user.uid, 'login', { loginMethod: 'facebook' });
    } catch (err: any) {
      // Fallback to redirect if popup is blocked or not permitted
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/unauthorized-domain' || err?.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: any) {
          const errorMessage = normalizeSocialError(redirectErr, 'Facebook');
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      const errorMessage = normalizeSocialError(err, 'Facebook');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithApple = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    const provider = new OAuthProvider('apple.com');
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      setUser(result.user as AuthUser);
      void logActivity(result.user.uid, 'login', { loginMethod: 'apple' });
    } catch (err: any) {
      const errorMessage = normalizeSocialError(err, 'Apple');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const completeOnboarding = async () => {
    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) {
        setLocalOnboardingCompleted();
        setOnboardingCompleted(true);
        return;
      }

      await setDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      }, { merge: true });

      setLocalOnboardingCompleted();
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
      if (!auth.currentUser) throw new Error('No authenticated user available');

      // Attempt to update Firestore with retry logic to handle transient network issues
      let lastError: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await setDoc(
            doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
            {
              roles: arrayUnion(normalizedRole),
              selectedRole: normalizedRole,
              roleSelectionComplete: true,
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );
          lastError = null;
          break; // Success, exit retry loop
        } catch (err: any) {
          lastError = err;
          if (attempt < 2) {
            // Wait before retrying (exponential backoff: 300ms, 600ms)
            await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
          }
        }
      }

      // If all retries failed, throw the error
      if (lastError) {
        throw lastError;
      }

      // Only store in localStorage AFTER Firestore write succeeds
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
      void logActivity(auth.currentUser.uid, 'role_changed', {
        previousRole: currentRole,
        selectedRole: normalizedRole,
        mode: 'initial_selection',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to select role');
      throw err;
    }
  };

  const switchRole = async (role: string) => {
    const normalizedRole = normalizeRoleInput(role);

    try {
      setError(null);
      if (!auth || !db) throw new Error('Firebase not initialized');
      if (!auth.currentUser) throw new Error('No authenticated user available');
      if (!user) throw new Error('User context is not available');

      const existingRoles = user.roles || [];
      if (!existingRoles.includes(normalizedRole)) {
        throw new Error(
          'This role is not active on your account yet. Complete its onboarding or contact support.'
        );
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
      void logActivity(auth.currentUser.uid, 'role_changed', {
        previousRole: currentRole,
        selectedRole: normalizedRole,
        mode: 'switch',
      });
    } catch (err: any) {
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

      const roles = Array.from(
        new Set(
          (Array.isArray(userData.roles) ? userData.roles : [USER_ROLES.MEMBER])
            .map(sanitizeRoleInput)
            .filter(Boolean)
        )
      ) as string[];
      const storedRole = normalizeRoleInput(userData.selectedRole || USER_ROLES.MEMBER);
      const selectedRole = getRoleOverrideFromStorage(roles)
        || (roles.includes(storedRole) ? storedRole : roles[0] || USER_ROLES.MEMBER);
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
