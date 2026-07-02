import { USER_ROLES } from '@/lib/constants/database';
import { VerifiedRequestUser, hasAnyRole } from '@/lib/server/requestAuth';

export const DISPUTE_ROLES = [USER_ROLES.SUPPORT_AGENT, USER_ROLES.DISPUTE_OFFICER, USER_ROLES.RISK_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
export const DISPUTE_DECISION_ROLES = [USER_ROLES.DISPUTE_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
export const FINANCE_ROLES = [USER_ROLES.FINANCE_OPERATOR, USER_ROLES.RISK_OFFICER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN];
export const STAFF_MANAGEMENT_ROLES = [USER_ROLES.SUPER_ADMIN];
export const ALL_OPERATIONS_ROLES = Array.from(new Set([...DISPUTE_ROLES, ...FINANCE_ROLES]));

export const canOperateDisputes = (user: VerifiedRequestUser | null) => hasAnyRole(user, DISPUTE_ROLES);
export const canDecideDisputes = (user: VerifiedRequestUser | null) => hasAnyRole(user, DISPUTE_DECISION_ROLES);
export const canOperateFinance = (user: VerifiedRequestUser | null) => hasAnyRole(user, FINANCE_ROLES);
export const canManageStaff = (user: VerifiedRequestUser | null) => hasAnyRole(user, STAFF_MANAGEMENT_ROLES);
