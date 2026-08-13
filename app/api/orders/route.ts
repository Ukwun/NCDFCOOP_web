import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { verifyRequestUser } from '@/lib/server/requestAuth';
import { enforcePersistentRateLimit } from '@/lib/middleware/rateLimiting';

export async function GET(request: NextRequest) {
  const user = await verifyRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await enforcePersistentRateLimit(user.uid, 'api');
    const size = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') || 25), 1), 50);
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection('orders')
      .where('buyerId', '==', user.uid)
      .orderBy('createdAt', 'desc');
    const cursor = String(request.nextUrl.searchParams.get('cursor') || '');
    if (cursor) {
      const cursorDoc = await db.collection('orders').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.limit(size + 1).get();
    const page = snapshot.docs.slice(0, size);
    const serialize = (data: FirebaseFirestore.DocumentData) => JSON.parse(JSON.stringify(data, (_key, value) => value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value));
    return NextResponse.json({
      orders: page.map((document) => ({ id: document.id, ...serialize(document.data()) })),
      nextCursor: snapshot.size > size ? page.at(-1)?.id || null : null,
    });
  } catch (error) {
    if ((error as Error & { status?: number })?.status === 429) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    console.error('Order page query failed:', error);
    return NextResponse.json({ error: 'Orders are temporarily unavailable.' }, { status: 500 });
  }
}
