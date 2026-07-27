import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { USER_ROLES } from '@/lib/constants/database';

export interface VerifiedRequestUser {
  uid: string;
  email?: string;
  roles: string[];
  selectedRole?: string;
  membershipStatus?: string;
  memberTier?: string;
  sellerVerified?: boolean;
}

export interface VerifiedRequestIdentity {
  uid: string;
  email?: string;
  emailVerified: boolean;
  operationalRoles: string[];
}

export const OPERATIONAL_ROLES = [
  USER_ROLES.SUPPORT_AGENT,
  USER_ROLES.DISPUTE_OFFICER,
  USER_ROLES.FINANCE_OPERATOR,
  USER_ROLES.RISK_OFFICER,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
] as const;

export function hasAnyRole(user: VerifiedRequestUser | null, roles: readonly string[]): boolean {
  return !!user && roles.some((role) => user.roles.includes(role));
}

export function hasRole(user: VerifiedRequestUser | null, role: string): boolean {
  return !!user && (user.selectedRole === role || user.roles.includes(role));
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function verifyRequestIdentity(
  request: NextRequest,
): Promise<VerifiedRequestIdentity | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const decoded = await getAdminAuth().verifyIdToken(token, true);
  return {
    uid: decoded.uid,
    email: decoded.email,
    emailVerified: decoded.email_verified === true,
    operationalRoles: Array.isArray(decoded.operationalRoles)
      ? decoded.operationalRoles.filter(
          (role): role is string => typeof role === 'string',
        )
      : [],
  };
}

export function isInternalRequest(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) return false;

  const supplied =
    request.headers.get('x-internal-api-key') ||
    request.headers.get('x-api-key');

  return supplied === expected;
}

export async function verifyRequestUser(
  request: NextRequest
): Promise<VerifiedRequestUser | null> {
  const identity = await verifyRequestIdentity(request);
  if (!identity) return null;

  const profile = await getAdminDb().collection('users').doc(identity.uid).get();
  const data = profile.data() || {};
  const roles = Array.isArray(data.roles)
    ? data.roles.filter((role): role is string => typeof role === 'string')
    : [];
  const claimedRoles = identity.operationalRoles;
  const operational = OPERATIONAL_ROLES.filter((role) => roles.includes(role));
  // Operational access requires agreement between the signed token and the
  // server-owned user profile. Public roles continue to use the profile only.
  const trustedOperational = operational.filter((role) => claimedRoles.includes(role));
  const effectiveRoles = roles.filter((role) => !OPERATIONAL_ROLES.includes(role as any)).concat(trustedOperational);

  return {
    uid: identity.uid,
    email: identity.email,
    roles: effectiveRoles,
    selectedRole:
      typeof data.selectedRole === 'string' ? data.selectedRole : undefined,
    membershipStatus:
      typeof data.membershipStatus === 'string'
        ? data.membershipStatus
        : undefined,
    memberTier:
      typeof data.memberTier === 'string' ? data.memberTier : undefined,
    sellerVerified:
      data.sellerVerified === true ||
      data.sellerStatus === 'approved' ||
      data.kycStatus === 'verified',
  };
}

export function isTrustedOperator(user: VerifiedRequestUser | null): boolean {
  if (!user) return false;
  const trustedRoles: string[] = [
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.OPERATOR,
    ...OPERATIONAL_ROLES,
  ];
  return user.roles.some((role) => trustedRoles.includes(role));
}

export async function isInternalOrTrustedRequest(
  request: NextRequest
): Promise<boolean> {
  if (isInternalRequest(request)) return true;

  try {
    return isTrustedOperator(await verifyRequestUser(request));
  } catch {
    return false;
  }
}
