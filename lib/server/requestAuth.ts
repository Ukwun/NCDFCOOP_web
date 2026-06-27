import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { USER_ROLES } from '@/lib/constants/database';

export interface VerifiedRequestUser {
  uid: string;
  email?: string;
  roles: string[];
  selectedRole?: string;
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
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
  const token = bearerToken(request);
  if (!token) return null;

  const decoded = await getAdminAuth().verifyIdToken(token);
  const profile = await getAdminDb().collection('users').doc(decoded.uid).get();
  const data = profile.data() || {};
  const roles = Array.isArray(data.roles)
    ? data.roles.filter((role): role is string => typeof role === 'string')
    : [];

  return {
    uid: decoded.uid,
    email: decoded.email,
    roles,
    selectedRole:
      typeof data.selectedRole === 'string' ? data.selectedRole : undefined,
  };
}

export function isTrustedOperator(user: VerifiedRequestUser | null): boolean {
  if (!user) return false;
  const trustedRoles: string[] = [
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.OPERATOR,
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
