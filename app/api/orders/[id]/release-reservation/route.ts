import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { releaseOrderInventory } from '@/lib/server/orderInventory';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const snapshot = await getAdminDb().collection('orders').doc(params.id).get();
  if (!snapshot.exists) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  const order = snapshot.data() || {};
  if (![order.buyerId, order.userId].includes(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const result = await releaseOrderInventory(params.id, {
    reason: 'buyer_payment_cancelled',
    requireExpired: false,
  });
  return NextResponse.json({ success: result === 'released' || result === 'already_released', result });
}
