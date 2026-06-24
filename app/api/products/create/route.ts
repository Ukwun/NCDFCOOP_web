import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin with service account JSON in env var
function initAdmin() {
  if (admin.apps && admin.apps.length) return;
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set; admin disabled');
    return;
  }
  try {
    let serviceAccount: any;
    try {
      // Try raw JSON first
      serviceAccount = JSON.parse(svc);
    } catch (rawErr) {
      try {
        // Try base64-decoded JSON
        const decoded = Buffer.from(svc, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
        console.info('FIREBASE_SERVICE_ACCOUNT loaded from base64-encoded value');
      } catch (b64Err) {
        throw rawErr; // rethrow original parse error for clarity
      }
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
  }
}

initAdmin();

export async function POST(req: Request) {
  if (!admin.apps || admin.apps.length === 0) {
    return NextResponse.json({ error: 'Admin SDK not configured' }, { status: 501 });
  }

  try {
    const body = await req.json();

    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!idToken) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure sellerId matches token uid
    if (!body.sellerId || body.sellerId !== decoded.uid) {
      return NextResponse.json({ error: 'sellerId must match authenticated user' }, { status: 403 });
    }

    const db = admin.firestore();

    // Sanitise product: remove undefined
    const sanitized = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
    sanitized.createdAt = admin.firestore.FieldValue.serverTimestamp();
    sanitized.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const docRef = await db.collection('products').add(sanitized as any);

    return NextResponse.json({ id: docRef.id });
  } catch (err: any) {
    console.error('API /api/products/create error:', err);
    return NextResponse.json({ error: err?.message || 'unknown' }, { status: 500 });
  }
}
