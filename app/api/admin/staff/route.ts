import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { canManageStaff } from '@/lib/operations/access';
import { USER_ROLES } from '@/lib/constants/database';

const ASSIGNABLE = [USER_ROLES.SUPPORT_AGENT, USER_ROLES.DISPUTE_OFFICER, USER_ROLES.FINANCE_OPERATOR, USER_ROLES.RISK_OFFICER, USER_ROLES.ADMIN] as string[];

function firebaseErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) return '';
  return String(error.code);
}

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
      tx.set(db.collection('notifications').doc(), {
        userId: authUser.uid,
        title: 'Operational role assigned',
        message: `Your ${role.replace(/_/g, ' ')} access is now active.`,
        type: 'role',
        read: false,
        data: { role, link: '/admin/operations' },
        createdAt: now,
      });
    });
    return NextResponse.json({
      success: true,
      message: `${email} was assigned as ${role}. Active sessions will refresh automatically.`,
    });
  } catch (error: unknown) {
    if (firebaseErrorCode(error) === 'auth/user-not-found') return NextResponse.json({ error: 'That email does not have an account yet.' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to assign staff role.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await verifyRequestUser(request);
    if (!canManageStaff(actor)) {
      return NextResponse.json(
        { error: 'Super-admin access required.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || '').trim();
    const role = String(body.role || '').trim();
    if (!userId || !ASSIGNABLE.includes(role)) {
      return NextResponse.json(
        { error: 'Select a valid staff member and assigned role.' },
        { status: 400 },
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    const [authUser, profileSnapshot] = await Promise.all([
      auth.getUser(userId),
      db.collection('users').doc(userId).get(),
    ]);
    const claims = authUser.customClaims || {};
    const claimedRoles = Array.isArray(claims.operationalRoles)
      ? claims.operationalRoles.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const remainingOperationalRoles = claimedRoles.filter(
      (value) => value !== role,
    );
    await auth.setCustomUserClaims(authUser.uid, {
      ...claims,
      operationalRoles: remainingOperationalRoles,
    });

    const profile = profileSnapshot.data() || {};
    const profileRoles = Array.isArray(profile.roles)
      ? profile.roles.filter((value): value is string => typeof value === 'string')
      : [];
    const remainingProfileRoles = profileRoles.filter((value) => value !== role);
    const fallbackRole =
      remainingOperationalRoles[0] ||
      remainingProfileRoles.find((value) => !ASSIGNABLE.includes(value)) ||
      remainingProfileRoles[0] ||
      'pending_role';
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      tx.set(
        db.collection('users').doc(userId),
        {
          roles: FieldValue.arrayRemove(role),
          ...(profile.selectedRole === role
            ? {
                selectedRole: fallbackRole,
                roleSelectionComplete: fallbackRole !== 'pending_role',
              }
            : {}),
          isOperationalStaff: remainingOperationalRoles.length > 0,
          staffStatus:
            remainingOperationalRoles.length > 0 ? 'active' : 'inactive',
          updatedAt: now,
        },
        { merge: true },
      );
      tx.set(db.collection('activityLogs').doc(), {
        userId: actor!.uid,
        action: 'staff_role_revoked',
        subjectUserId: userId,
        role,
        createdAt: now,
      });
      tx.set(db.collection('notifications').doc(), {
        userId,
        title: 'Operational role updated',
        message: `Your ${role.replace(/_/g, ' ')} access was removed.`,
        type: 'role',
        read: false,
        data: { role, link: '/home' },
        createdAt: now,
      });
    });

    return NextResponse.json({
      success: true,
      message: `${role.replace(/_/g, ' ')} access was removed from ${authUser.email || userId}.`,
    });
  } catch (error: unknown) {
    if (firebaseErrorCode(error) === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'That staff account no longer exists.' },
        { status: 404 },
      );
    }
    console.error('Unable to revoke staff role:', error);
    return NextResponse.json(
      { error: 'Unable to revoke staff role.' },
      { status: 500 },
    );
  }
}
