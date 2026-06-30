import { USER_ROLES } from '@/lib/constants/database';

export function getRoleLandingPath(role?: string | null): string {
  switch (role) {
    case USER_ROLES.SELLER:
    case USER_ROLES.FRANCHISE:
      return '/seller';
    case USER_ROLES.ADMIN:
      return '/admin';
    case USER_ROLES.STAFF:
    case USER_ROLES.OPERATOR:
      return '/analytics';
    case USER_ROLES.INSTITUTIONAL_BUYER:
    case USER_ROLES.MEMBER:
    default:
      return '/home';
  }
}

export function getAuthenticatedLandingPath(
  role: string | null | undefined,
  roleSelectionComplete: boolean
): string {
  const operationalRoles: string[] = [
    USER_ROLES.ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.OPERATOR,
  ];

  if (!roleSelectionComplete && !operationalRoles.includes(role || '')) {
    return '/role-selection';
  }

  return getRoleLandingPath(role);
}
