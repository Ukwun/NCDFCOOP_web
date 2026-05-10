import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getPrivateKey(): string | undefined {
  const fromEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!fromEnv) return undefined;
  return fromEnv.replace(/\\n/g, '\n');
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0]!;
    return adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return adminApp;
  }

  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / platform default credentials.
  adminApp = initializeApp({ projectId });
  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
