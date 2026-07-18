import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getPrivateKey(): string | undefined {
  const fromEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!fromEnv) return undefined;
  return fromEnv.replace(/\\n/g, '\n');
}

interface ServiceAccountShape {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
}

function parseServiceAccount(value?: string): ServiceAccountShape | null {
  if (!value) return null;

  const candidates = [value];
  try {
    candidates.push(Buffer.from(value, 'base64').toString('utf8'));
  } catch {
    // The raw JSON candidate can still be valid.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as ServiceAccountShape;
      if (
        (parsed.project_id || parsed.projectId) &&
        (parsed.client_email || parsed.clientEmail) &&
        (parsed.private_key || parsed.privateKey)
      ) {
        return parsed;
      }
    } catch {
      // Try the next supported representation.
    }
  }

  return null;
}

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0]!;
    return adminApp;
  }

  const serviceAccount = parseServiceAccount(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  );
  const projectId =
    serviceAccount?.project_id ||
    serviceAccount?.projectId ||
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail =
    serviceAccount?.client_email ||
    serviceAccount?.clientEmail ||
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (
    serviceAccount?.private_key ||
    serviceAccount?.privateKey ||
    getPrivateKey()
  )?.replace(/\\n/g, '\n');

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

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    return adminApp;
  }

  throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
