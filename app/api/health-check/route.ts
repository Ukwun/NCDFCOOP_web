import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

async function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Health dependency timeout')), milliseconds)),
  ]);
}

export async function GET(request: NextRequest) {
  const firebaseClient = {
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const clientReady = Object.values(firebaseClient).every(Boolean);
  const deep = request.nextUrl.searchParams.get('deep') === '1';

  if (!deep) {
    return NextResponse.json({
      status: clientReady ? 'ok' : 'error',
      service: 'CoopX',
      firebaseClient,
      timestamp: new Date().toISOString(),
    }, { status: clientReady ? 200 : 500, headers: { 'Cache-Control': 'no-store' } });
  }

  let adminReady = false;
  let adminError = '';
  try {
    await withTimeout(Promise.all([
      getAdminDb().collection('users').limit(1).get(),
      getAdminAuth().listUsers(1),
    ]), 6_000);
    adminReady = true;
  } catch (error) {
    adminError = error instanceof Error ? error.message : 'Firebase Admin unavailable';
  }

  const configuredPublicPaymentKey =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ||
    '';
  const configuredServerPaymentKey =
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.FLUTTERWAVE_SECRET_KEY ||
    '';
  const dependencies = {
    firebaseClient: clientReady,
    firebaseAdmin: adminReady,
    paymentProvider: /^pk_(test|live)_/i.test(configuredPublicPaymentKey) &&
      /^sk_(test|live)_/i.test(configuredServerPaymentKey)
      ? 'paystack'
      : /^FLWPUBK_(TEST|LIVE)-/i.test(configuredPublicPaymentKey) &&
          /^FLWSECK_(TEST|LIVE)-/i.test(configuredServerPaymentKey)
        ? 'flutterwave'
        : 'unconfigured',
    paystackPublic: /^pk_(test|live)_/i.test(configuredPublicPaymentKey),
    paystackServer: /^sk_(test|live)_/i.test(configuredServerPaymentKey),
    flutterwavePublic: /^FLWPUBK_(TEST|LIVE)-/i.test(configuredPublicPaymentKey),
    flutterwaveServer: /^FLWSECK_(TEST|LIVE)-/i.test(configuredServerPaymentKey),
    transactionalEmail: !!process.env.SENDGRID_API_KEY && !!process.env.SENDGRID_FROM_EMAIL,
  };
  const commerceReady = clientReady && adminReady;

  return NextResponse.json({
    status: commerceReady ? 'ready' : 'degraded',
    service: 'CoopX',
    dependencies,
    ...(adminError ? { blocker: 'Firebase Admin is unavailable to server-side commerce routes.' } : {}),
    timestamp: new Date().toISOString(),
  }, {
    status: commerceReady ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
