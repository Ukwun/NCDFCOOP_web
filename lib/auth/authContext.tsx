"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import {
  COLLECTIONS,
  USER_ROLES,
  MEMBER_TIERS,
} from "@/lib/constants/database";
import { logActivity } from "@/lib/services/activityService";
import { getAuthenticatedLandingPath } from "@/lib/auth/roleRouting";

export interface AuthUser extends User {
  roles?: string[];
  selectedRole?: string;
  currentRole?: string;
  membershipStatus?: "active" | "inactive" | "pending";
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
  signup: (
    email: string,
    password: string,
    nameOrMembershipType?: string,
    membershipTypeMaybe?: string,
    referralCode?: string,
  ) => Promise<string>;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<string>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  signInWithGoogle: (referralCode?: string) => Promise<string | null>;
  signInWithFacebook: (referralCode?: string) => Promise<string | null>;
  signInWithApple: (referralCode?: string) => Promise<string | null>;
  completeOnboarding: () => Promise<void>;
  selectRole: (role: string) => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateReferralCode(): string {
  return `NCDF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const LOCAL_ONBOARDING_KEY = "ncdfcoop_onboarding_completed";
const LOCAL_ROLE_OVERRIDE_KEY = "selectedRoleOverride";
const PENDING_ROLE = "pending_role";

async function attributeReferral(currentUser: User, referralCode?: string): Promise<void> {
  const normalized = String(referralCode || "").trim().toUpperCase();
  if (!normalized) return;
  const token = await currentUser.getIdToken();
  const response = await fetch("/api/referrals/attribute", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ referralCode: normalized }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "We could not apply this referral code.");
  }
}

function sanitizeRoleInput(role?: string): string | null {
  if (!role) return null;

  const normalized = role.toLowerCase().trim();
  if (
    normalized === "wholesale_buyer" ||
    normalized === "wholesale" ||
    normalized === "institutional_buyer" ||
    normalized === "institutional buyer" ||
    normalized === "buyer"
  ) {
    return USER_ROLES.INSTITUTIONAL_BUYER;
  }

  if (normalized === "seller") {
    return USER_ROLES.SELLER;
  }

  if (normalized === "member") {
    return USER_ROLES.MEMBER;
  }

  return null;
}

// Roles from Firestore can include platform roles. Public UI role selection
// stays narrower so users cannot promote themselves into operational access.
function normalizeStoredRole(role?: string): string | null {
  if (!role) return null;
  const publicRole = sanitizeRoleInput(role);
  if (publicRole) return publicRole;

  const normalized = role.toLowerCase().trim();
  const systemRoles = Object.values(USER_ROLES) as string[];
  return systemRoles.includes(normalized) ? normalized : null;
}

function normalizeRoleInput(role?: string): string {
  return sanitizeRoleInput(role) || USER_ROLES.MEMBER;
}

function isPendingRoleProfile(profile?: Record<string, any>): boolean {
  return (
    !profile ||
    profile.selectedRole === PENDING_ROLE ||
    profile.roleSelectionComplete === false
  );
}

function getLocalOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LOCAL_ONBOARDING_KEY) === "true";
}

function setLocalOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ONBOARDING_KEY, "true");
}

function clearLocalOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_ONBOARDING_KEY);
}

function getRoleOverrideFromStorage(activeRoles: string[]): string | null {
  if (typeof window === "undefined") return null;
  const overrideRole = normalizeStoredRole(
    window.localStorage.getItem(LOCAL_ROLE_OVERRIDE_KEY) || undefined,
  );
  return overrideRole && activeRoles.includes(overrideRole)
    ? overrideRole
    : null;
}

function resolveSignupInputs(
  nameOrMembershipType?: string,
  membershipTypeMaybe?: string,
) {
  if (!nameOrMembershipType) return { name: "" };

  const roleLikeInput = sanitizeRoleInput(nameOrMembershipType);
  if (roleLikeInput) return { name: "" };

  return { name: nameOrMembershipType };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [roleSelectionComplete, setRoleSelectionComplete] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const hydrateSignedInIdentity = async (
    currentUser: User,
    referralCode?: string,
  ): Promise<string> => {
    if (!db) throw new Error("Firebase not initialized");

    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const snapshot = await getDoc(userRef);
    let profile = snapshot.data();

    const createdProfile = !profile;
    if (!profile) {
      const localOnboarding = getLocalOnboardingCompleted();

      profile = {
        id: currentUser.uid,
        email: currentUser.email,
        name:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        roles: [],
        selectedRole: PENDING_ROLE,
        membershipType: PENDING_ROLE,
        roleSelectionComplete: false,
        onboardingCompleted: localOnboarding,
        membershipStatus: "pending",
        memberTier: MEMBER_TIERS.BRONZE,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePicture: currentUser.photoURL || "",
        phone: currentUser.phoneNumber || "",
        address: "",
        isActive: true,
      };

      await setDoc(userRef, profile);

      const memberRef = doc(db, COLLECTIONS.MEMBERS, currentUser.uid);
      const memberSnapshot = await getDoc(memberRef);
      if (!memberSnapshot.exists()) {
        await setDoc(memberRef, {
          userId: currentUser.uid,
          memberSince: Timestamp.now(),
          loyaltyPoints: 0,
          tier: MEMBER_TIERS.BRONZE,
          totalPurchases: 0,
          referralCode: generateReferralCode(),
          isVerified: false,
          isActive: false,
          kycStatus: "pending",
        });
      }
    }

    if (createdProfile && referralCode) {
      try {
        await attributeReferral(currentUser, referralCode);
      } catch (referralError) {
        console.error("Social referral attribution failed:", referralError);
      }
    }

    const normalizedRoles = Array.isArray(profile.roles)
      ? (profile.roles.map(normalizeStoredRole).filter(Boolean) as string[])
      : [];
    const storedRole = isPendingRoleProfile(profile)
      ? null
      : normalizeStoredRole(profile.selectedRole) || normalizedRoles[0] || null;
    const roles = Array.from(new Set(normalizedRoles));
    const selectedRole =
      storedRole && roles.length > 0
        ? getRoleOverrideFromStorage(roles) ||
          (roles.includes(storedRole) ? storedRole : roles[0])
        : null;
    const selectionComplete = !!profile.roleSelectionComplete && !!selectedRole;
    const completedOnboarding = !!(
      profile.onboardingCompleted || getLocalOnboardingCompleted()
    );
    const authUser: AuthUser = {
      ...currentUser,
      displayName:
        currentUser.displayName ||
        String(profile.name || currentUser.email?.split("@")[0] || "User"),
      photoURL:
        currentUser.photoURL || String(profile.profilePicture || "") || null,
      roles,
      selectedRole: selectedRole || undefined,
      currentRole: selectedRole || undefined,
      membershipStatus:
        profile.membershipStatus ||
        (selectedRole === USER_ROLES.MEMBER ? "pending" : "inactive"),
      memberTier: profile.memberTier || MEMBER_TIERS.BRONZE,
      roleSelectionComplete: selectionComplete,
      onboardingCompleted: completedOnboarding,
    };

    setUser(authUser);
    setCurrentRole(selectedRole || null);
    setRoleSelectionComplete(selectionComplete);
    setOnboardingCompleted(completedOnboarding);
    setError(null);

    return getAuthenticatedLandingPath(selectedRole, selectionComplete);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && getLocalOnboardingCompleted()) {
      setOnboardingCompleted(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!user) {
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userEmail");
      window.localStorage.removeItem("userRole");
      window.localStorage.removeItem("membershipTier");
      return;
    }

    window.localStorage.setItem("userId", user.uid);
    window.localStorage.setItem("userEmail", user.email || "");
    window.localStorage.setItem("userRole", currentRole || "");
    window.localStorage.setItem("membershipType", currentRole || "");
    window.localStorage.setItem("membershipTier", user.memberTier || "");
  }, [currentRole, user]);

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

        const pendingReferral = typeof window !== "undefined"
          ? window.sessionStorage.getItem("pendingReferralCode") || undefined
          : undefined;
        await hydrateSignedInIdentity(currentUser, pendingReferral);
        if (pendingReferral && typeof window !== "undefined") {
          window.sessionStorage.removeItem("pendingReferralCode");
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    nameOrMembershipType?: string,
    membershipTypeMaybe?: string,
    referralCode?: string,
  ): Promise<string> => {
    try {
      setError(null);
      if (!auth || !db) throw new Error("Firebase not initialized");

      const { name } = resolveSignupInputs(
        nameOrMembershipType,
        membershipTypeMaybe,
      );
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim() || normalizedEmail.split("@")[0];
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      const uid = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: normalizedName,
      });

      const now = Timestamp.now();
      const signupBatch = writeBatch(db);

      signupBatch.set(doc(db, COLLECTIONS.USERS, uid), {
        id: uid,
        email: normalizedEmail,
        name: normalizedName,
        roles: [],
        selectedRole: PENDING_ROLE,
        membershipType: PENDING_ROLE,
        roleSelectionComplete: false,
        onboardingCompleted: false,
        membershipStatus: "pending",
        memberTier: MEMBER_TIERS.BRONZE,
        createdAt: now,
        updatedAt: now,
        profilePicture: "",
        phone: "",
        address: "",
        isActive: true,
      });

      signupBatch.set(doc(db, COLLECTIONS.MEMBERS, uid), {
        userId: uid,
        memberSince: now,
        loyaltyPoints: 0,
        tier: MEMBER_TIERS.BRONZE,
        totalPurchases: 0,
        referralCode: generateReferralCode(),
        isVerified: false,
        isActive: false,
        kycStatus: "pending",
      });

      try {
        await signupBatch.commit();
      } catch (profileError) {
        console.error("Signup profile write failed:", profileError);
        try {
          await deleteUser(userCredential.user);
        } catch (cleanupError) {
          console.error("Signup auth cleanup failed:", cleanupError);
        }
        throw new Error(
          "We could not finish creating your profile. Please try again.",
        );
      }

      try {
        await attributeReferral(userCredential.user, referralCode);
      } catch (referralError) {
        console.error("Referral attribution failed:", referralError);
      }

      const localOnboarding = getLocalOnboardingCompleted();
      setUser({
        ...userCredential.user,
        displayName: normalizedName,
        roles: [],
        selectedRole: undefined,
        currentRole: undefined,
        membershipStatus: "pending",
        roleSelectionComplete: false,
        onboardingCompleted: localOnboarding,
        memberTier: MEMBER_TIERS.BRONZE,
        isNewUser: true,
      });
      setCurrentRole(null);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
      void logActivity(uid, "signup", {
        signupMethod: "password",
      });
      return "/role-selection";
    } catch (err: any) {
      setError(err?.message || "Failed to create account");
      throw err;
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<string> => {
    try {
      setError(null);
      if (!auth) throw new Error("Firebase not initialized");
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const destination = await hydrateSignedInIdentity(userCredential.user);
      void logActivity(userCredential.user.uid, "login", {
        loginMethod: "password",
      });
      return destination;
    } catch (err: any) {
      // Sanitize error messages to not expose system details
      let errorMessage =
        "Unable to sign in. Please check your credentials and try again.";

      if (err.code === "auth/user-not-found") {
        errorMessage =
          "We could not find an account with this email. Please create an account.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        errorMessage =
          "The email or password is incorrect. Please check both and try again.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage =
          "This account has been disabled. Please contact support.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage =
          "Too many failed login attempts. Please try again later.";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      if (!auth) throw new Error("Firebase not initialized");
      await signOut(auth);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("selectedRoleOverride");
        window.localStorage.removeItem("dev_autologin");
        window.localStorage.removeItem("userId");
        window.localStorage.removeItem("userEmail");
        window.localStorage.removeItem("userRole");
        window.localStorage.removeItem("displayName");
      }
      setUser(null);
      setCurrentRole(null);
      setRoleSelectionComplete(false);
      setOnboardingCompleted(false);
    } catch (err: any) {
      setError(err?.message || "Failed to logout");
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const response = await fetch("/api/email/send-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            "Failed to send reset email. Please try again later.",
        );
      }
    } catch (err: any) {
      // Sanitize error messages
      let errorMessage = "Failed to send reset email. Please try again later.";

      if (err.code === "auth/user-not-found") {
        // Don't reveal if email exists or not for security
        errorMessage =
          "If an account exists with this email, you will receive a password reset link shortly.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
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
      if (!auth || !db) throw new Error("Firebase not initialized");
      if (!auth.currentUser) return;

      await updateProfile(auth.currentUser, { displayName, photoURL });
      await setDoc(
        doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
        {
          name: displayName,
          profilePicture: photoURL,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      setUser({
        ...user,
        ...auth.currentUser,
        displayName,
        photoURL: photoURL ?? auth.currentUser.photoURL,
      } as AuthUser);
    } catch (err: any) {
      setError(err?.message || "Failed to update profile");
      throw err;
    }
  };

  const normalizeSocialError = (err: any, providerName: string) => {
    const message = err?.message || `${providerName} sign-in failed`;
    if (err?.code === "auth/unauthorized-domain") {
      return `OAuth not authorized for this domain. Add ${window.location.hostname} to Firebase Authentication authorized domains.`;
    }
    if (err?.code === "auth/popup-blocked") {
      return `${providerName} popup was blocked. Please allow popups for this site and try again.`;
    }
    if (err?.code === "auth/popup-closed-by-user") {
      return `${providerName} sign-in popup was closed before completing.`;
    }
    if (err?.code === "auth/operation-not-allowed") {
      return `${providerName} sign-in is not enabled yet. Please contact support or sign in with email and password.`;
    }
    return message;
  };

  const signInWithGoogle = async (referralCode?: string): Promise<string | null> => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      const destination = await hydrateSignedInIdentity(result.user, referralCode);
      void logActivity(result.user.uid, "login", {
        loginMethod: "google",
      });
      return destination;
    } catch (err: any) {
      // If popup flow is blocked or not allowed, fallback to redirect flow
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/unauthorized-domain" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        try {
          if (referralCode) window.sessionStorage.setItem("pendingReferralCode", referralCode);
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr: any) {
          const errorMessage = normalizeSocialError(redirectErr, "Google");
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      const errorMessage = normalizeSocialError(err, "Google");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithFacebook = async (referralCode?: string): Promise<string | null> => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new FacebookAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      const destination = await hydrateSignedInIdentity(result.user, referralCode);
      void logActivity(result.user.uid, "login", {
        loginMethod: "facebook",
      });
      return destination;
    } catch (err: any) {
      // Fallback to redirect if popup is blocked or not permitted
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/unauthorized-domain" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        try {
          if (referralCode) window.sessionStorage.setItem("pendingReferralCode", referralCode);
          await signInWithRedirect(auth, provider);
          return null;
        } catch (redirectErr: any) {
          const errorMessage = normalizeSocialError(redirectErr, "Facebook");
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      const errorMessage = normalizeSocialError(err, "Facebook");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithApple = async (referralCode?: string): Promise<string | null> => {
    if (!auth) throw new Error("Firebase not initialized");
    const provider = new OAuthProvider("apple.com");
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      const destination = await hydrateSignedInIdentity(result.user, referralCode);
      void logActivity(result.user.uid, "login", {
        loginMethod: "apple",
      });
      return destination;
    } catch (err: any) {
      const errorMessage = normalizeSocialError(err, "Apple");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const completeOnboarding = async () => {
    try {
      setError(null);
      if (!auth || !db) throw new Error("Firebase not initialized");
      if (!auth.currentUser) {
        setLocalOnboardingCompleted();
        setOnboardingCompleted(true);
        return;
      }

      await setDoc(
        doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
        {
          onboardingCompleted: true,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      setLocalOnboardingCompleted();
      setOnboardingCompleted(true);
      if (user) setUser({ ...user, onboardingCompleted: true });
    } catch (err: any) {
      setError(err?.message || "Failed to complete onboarding");
      throw err;
    }
  };

  const selectRole = async (role: string) => {
    const normalizedRole = normalizeRoleInput(role);

    try {
      setError(null);
      if (!auth || !db) throw new Error("Firebase not initialized");
      if (!auth.currentUser) throw new Error("No authenticated user available");
      if (!user) throw new Error("User context is not available");

      const existingRoles = user.roles || [];
      const isInitialRoleSelection =
        !user.roleSelectionComplete && existingRoles.length === 0;
      if (!isInitialRoleSelection && !existingRoles.includes(normalizedRole)) {
        throw new Error(
          "This role is not active on your account yet. Complete its onboarding approval first.",
        );
      }
      const nextRoles = isInitialRoleSelection
        ? [normalizedRole]
        : existingRoles;
      const updateData: Record<string, unknown> = {
        selectedRole: normalizedRole,
        roleSelectionComplete: true,
        updatedAt: Timestamp.now(),
      };

      if (isInitialRoleSelection) {
        updateData.roles = nextRoles;
        updateData.membershipType = normalizedRole;
        updateData.membershipStatus =
          normalizedRole === USER_ROLES.MEMBER ? "pending" : "inactive";
      }

      // Attempt to update Firestore with retry logic to handle transient network issues
      let lastError: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await setDoc(
            doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
            updateData,
            { merge: true },
          );
          lastError = null;
          break; // Success, exit retry loop
        } catch (err: any) {
          lastError = err;
          if (attempt < 2) {
            // Wait before retrying (exponential backoff: 300ms, 600ms)
            await new Promise((resolve) =>
              setTimeout(resolve, 300 * (attempt + 1)),
            );
          }
        }
      }

      // If all retries failed, throw the error
      if (lastError) {
        throw lastError;
      }

      // Only store in localStorage AFTER Firestore write succeeds
      if (typeof window !== "undefined") {
        window.localStorage.setItem("selectedRoleOverride", normalizedRole);
      }

      setCurrentRole(normalizedRole);
      setRoleSelectionComplete(true);
      setUser({
        ...user,
        selectedRole: normalizedRole,
        currentRole: normalizedRole,
        roleSelectionComplete: true,
        membershipStatus: isInitialRoleSelection
          ? normalizedRole === USER_ROLES.MEMBER
            ? "pending"
            : "inactive"
          : user.membershipStatus,
        roles: nextRoles,
      });
      void logActivity(auth.currentUser.uid, "role_changed", {
        previousRole: currentRole,
        selectedRole: normalizedRole,
        mode: isInitialRoleSelection ? "initial_selection" : "selection_update",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to select role");
      throw err;
    }
  };

  const switchRole = async (role: string) => {
    const normalizedRole = normalizeRoleInput(role);

    try {
      setError(null);
      if (!auth || !db) throw new Error("Firebase not initialized");
      if (!auth.currentUser) throw new Error("No authenticated user available");
      if (!user) throw new Error("User context is not available");

      const existingRoles = user.roles || [];
      if (!existingRoles.includes(normalizedRole)) {
        throw new Error(
          "This role is not active on your account yet. Complete its onboarding approval first.",
        );
      }

      await setDoc(
        doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
        {
          selectedRole: normalizedRole,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem("selectedRoleOverride", normalizedRole);
      }

      setCurrentRole(normalizedRole);
      setUser({
        ...user,
        selectedRole: normalizedRole,
        currentRole: normalizedRole,
        roles: existingRoles,
      });
      void logActivity(auth.currentUser.uid, "role_changed", {
        previousRole: currentRole,
        selectedRole: normalizedRole,
        mode: "switch",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to switch role");
      throw err;
    }
  };

  const refreshUserData = async () => {
    try {
      setError(null);
      if (!auth || !db) throw new Error("Firebase not initialized");
      if (!auth.currentUser) return;

      const userDoc = await getDoc(
        doc(db, COLLECTIONS.USERS, auth.currentUser.uid),
      );
      const userData = userDoc.data();
      if (!userData) return;

      const roles = Array.from(
        new Set(
          (Array.isArray(userData.roles) ? userData.roles : [USER_ROLES.MEMBER])
            .map(normalizeStoredRole)
            .filter(Boolean),
        ),
      ) as string[];
      const storedRole = isPendingRoleProfile(userData)
        ? null
        : normalizeStoredRole(userData.selectedRole) || roles[0] || null;
      const selectedRole =
        storedRole && roles.length > 0
          ? getRoleOverrideFromStorage(roles) ||
            (roles.includes(storedRole) ? storedRole : roles[0])
          : null;
      const selectionComplete =
        !!userData.roleSelectionComplete && !!selectedRole;
      const refreshedUser: AuthUser = {
        ...auth.currentUser,
        roles,
        selectedRole: selectedRole || undefined,
        currentRole: selectedRole || undefined,
        membershipStatus:
          userData.membershipStatus ||
          (selectedRole === USER_ROLES.MEMBER ? "pending" : "inactive"),
        roleSelectionComplete: selectionComplete,
        onboardingCompleted: !!userData.onboardingCompleted,
        memberTier: userData.memberTier || MEMBER_TIERS.BRONZE,
      };

      setUser(refreshedUser);
      setCurrentRole(selectedRole || null);
      setRoleSelectionComplete(selectionComplete);
      setOnboardingCompleted(!!refreshedUser.onboardingCompleted);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh user data");
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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
