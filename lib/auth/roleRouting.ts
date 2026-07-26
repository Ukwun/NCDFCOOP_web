import { USER_ROLES } from '@/lib/constants/database';

export function getRoleLandingPath(role?: string | null): string {
  switch (role) {
    case USER_ROLES.SELLER:
    case USER_ROLES.FRANCHISE:
      return '/seller';
    case USER_ROLES.ADMIN:
      return '/admin';
    case USER_ROLES.SUPER_ADMIN:
      return '/admin';
    case USER_ROLES.SUPPORT_AGENT:
    case USER_ROLES.DISPUTE_OFFICER:
    case USER_ROLES.FINANCE_OPERATOR:
    case USER_ROLES.RISK_OFFICER:
      return '/admin/operations';
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
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.SUPPORT_AGENT,
    USER_ROLES.DISPUTE_OFFICER,
    USER_ROLES.FINANCE_OPERATOR,
    USER_ROLES.RISK_OFFICER,
    USER_ROLES.STAFF,
    USER_ROLES.OPERATOR,
  ];

  if (!roleSelectionComplete && !operationalRoles.includes(role || '')) {
    return '/role-selection';
  }

  return getRoleLandingPath(role);
}
