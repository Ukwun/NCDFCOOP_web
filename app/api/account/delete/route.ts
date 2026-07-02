import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';

const OWNED_COLLECTIONS = [
  ['products', 'sellerId'],
  ['inquiries', 'buyerId'],
  ['inquiries', 'sellerId'],
  ['orders', 'userId'],
  ['notifications', 'userId'],
  ['cartItems', 'userId'],
  ['favorites', 'userId'],
] as const;

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in again before deleting your account.' }, { status: 401 });

    const db = getAdminDb();
    const batch = db.batch();
    const seen = new Set<string>();
    for (const [collectionName, ownerField] of OWNED_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).where(ownerField, '==', user.uid).get();
      snapshot.docs.forEach((document) => {
        if (!seen.has(document.ref.path)) {
          batch.delete(document.ref);
          seen.add(document.ref.path);
        }
      });
    }
    for (const collectionName of ['users', 'members', 'payoutProfiles']) {
      batch.delete(db.collection(collectionName).doc(user.uid));
    }
    batch.set(db.collection('accountDeletionAudit').doc(user.uid), {
      userId: user.uid,
      requestedAt: FieldValue.serverTimestamp(),
      status: 'completed',
    });
    await batch.commit();
    await getAdminAuth().deleteUser(user.uid);
    return NextResponse.json({ message: 'Your account and private profile data have been deleted.' });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json({ error: 'Your account was not deleted. Please retry after signing in again.' }, { status: 500 });
  }
}
