import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { enforcePersistentRateLimit } from '@/lib/middleware/rateLimiting';

function serialize(data: FirebaseFirestore.DocumentData) {
  return JSON.parse(JSON.stringify(data, (_key, value) =>
    value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value,
  ));
}

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    await enforcePersistentRateLimit(forwarded || request.headers.get('x-nf-client-connection-ip') || 'catalog', 'search');
    const params = request.nextUrl.searchParams;
    const pageSize = Math.min(Math.max(Number(params.get('limit') || 24), 1), 50);
    const term = String(params.get('q') || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').trim().split(/\s+/)[0]?.slice(0, 40);
    const category = String(params.get('category') || '').trim().slice(0, 80);
    const view = params.get('type') === 'wholesale' ? 'wholesale' : 'retail';
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection('products').where('status', '==', 'live');
    if (term) query = query.where('searchTokens', 'array-contains', term);
    if (category && category !== 'All') query = query.where('category', '==', category);
    query = query.orderBy('createdAt', 'desc');
    const cursor = String(params.get('cursor') || '');
    if (cursor) {
      const cursorDoc = await db.collection('products').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.limit(Math.min(pageSize * 2, 100)).get();
    const matching = snapshot.docs.filter((document) => {
      const type = String(document.data().type || 'retail');
      return type === view || type === 'both';
    });
    const visible = matching.slice(0, pageSize);
    return NextResponse.json({
      products: visible.map((document) => ({ id: document.id, ...serialize(document.data()) })),
      nextCursor: snapshot.size >= Math.min(pageSize * 2, 100) ? snapshot.docs.at(-1)?.id || null : null,
    }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch (error) {
    if ((error as Error & { status?: number })?.status === 429) return NextResponse.json({ error: 'Search limit reached. Try again shortly.' }, { status: 429 });
    console.error('Catalog query failed:', error);
    return NextResponse.json({ error: 'The marketplace is temporarily unavailable.' }, { status: 500 });
  }
}

