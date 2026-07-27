import { NextRequest, NextResponse } from 'next/server';
import { USER_ROLES } from '@/lib/constants/database';
import { getAdminDb } from '@/lib/firebase/admin';
import { hasRole, verifyRequestUser } from '@/lib/server/requestAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request);
    if (!hasRole(user, USER_ROLES.SELLER)) {
      return NextResponse.json({ error: 'Seller access required.' }, { status: 403 });
    }
    const snapshot = await getAdminDb().collection('sellerBalances').doc(user!.uid).get();
    const data = snapshot.data() || {};
    return NextResponse.json({
      balance: {
        available: Math.max(0, Number(data.available || 0)),
        pendingPayout: Math.max(0, Number(data.pendingPayout || 0)),
        lifetimeEarned: Math.max(0, Number(data.lifetimeEarned || 0)),
        lifetimePaid: Math.max(0, Number(data.lifetimePaid || 0)),
        held: Math.max(0, Number(data.held || 0)),
      },
    });
  } catch (error) {
    console.error('Seller balance read failed:', error);
    return NextResponse.json({ error: 'Seller balance is temporarily unavailable.' }, { status: 500 });
  }
}
