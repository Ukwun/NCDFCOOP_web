import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { canManageStaff } from '@/lib/operations/access';
import { USER_ROLES } from '@/lib/constants/database';

const ASSIGNABLE = [USER_ROLES.SUPPORT_AGENT, USER_ROLES.DISPUTE_OFFICER, USER_ROLES.FINANCE_OPERATOR, USER_ROLES.RISK_OFFICER, USER_ROLES.ADMIN] as string[];

export async function GET(request: NextRequest) {
  const actor = await verifyRequestUser(request);
  if (!canManageStaff(actor)) return NextResponse.json({ error: 'Super-admin access required.' }, { status: 403 });
  const snapshot = await getAdminDb().collection('users').where('isOperationalStaff', '==', true).limit(100).get();
  return NextResponse.json({ staff: snapshot.docs.map((doc) => ({ id: doc.id, email: doc.data().email || '', name: doc.data().name || '', roles: doc.data().roles || [], staffStatus: doc.data().staffStatus || 'active' })) });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await verifyRequestUser(request);
    if (!canManageStaff(actor)) return NextResponse.json({ error: 'Super-admin access required.' }, { status: 403 });
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || !ASSIGNABLE.includes(role)) return NextResponse.json({ error: 'Enter an existing user email and a valid staff role.' }, { status: 400 });
    const authUser = await getAdminAuth().getUserByEmail(email);
    if (!authUser.emailVerified) return NextResponse.json({ error: 'The staff member must verify their email first.' }, { status: 409 });
    const claims = authUser.customClaims || {};
    const operationalRoles = Array.from(new Set([...(Array.isArray(claims.operationalRoles) ? claims.operationalRoles : []), role]));
    await getAdminAuth().setCustomUserClaims(authUser.uid, { ...claims, operationalRoles });
    const db = getAdminDb(); const now = FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
      tx.set(db.collection('users').doc(authUser.uid), { email, roles: FieldValue.arrayUnion(role), selectedRole: role, roleSelectionComplete: true, isOperationalStaff: true, staffStatus: 'active', staffAssignedBy: actor!.uid, updatedAt: now }, { merge: true });
      tx.set(db.collection('activityLogs').doc(), { userId: actor!.uid, action: 'staff_role_assigned', subjectUserId: authUser.uid, role, createdAt: now });
    });
    await getAdminAuth().revokeRefreshTokens(authUser.uid);
    return NextResponse.json({ success: true, message: `${email} was assigned as ${role}. They must sign in again.` });
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') return NextResponse.json({ error: 'That email does not have an account yet.' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to assign staff role.' }, { status: 500 });
  }
}
