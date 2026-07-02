/* One-time owner bootstrap. Never commit a service-account private key. */
const fs = require('fs');
const path = require('path');
const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

function loadLocalEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseServiceAccount(raw) {
  if (!raw) return null;
  for (const candidate of [raw, Buffer.from(raw, 'base64').toString('utf8')]) {
    try { const value = JSON.parse(candidate); if (value.project_id && value.client_email && value.private_key) return value; } catch {}
  }
  return null;
}

function credentials() {
  const explicitFile = argument('--service-account') || process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitFile) {
    const resolved = path.resolve(explicitFile);
    if (!fs.existsSync(resolved)) throw new Error(`Service-account file not found: ${resolved}`);
    return { credential: cert(JSON.parse(fs.readFileSync(resolved, 'utf8'))), source: resolved };
  }
  const encoded = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
  if (encoded) return { credential: cert(encoded), source: 'FIREBASE_SERVICE_ACCOUNT' };
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = String(process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) return { credential: cert({ projectId, clientEmail, privateKey }), source: 'Firebase Admin environment variables' };
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return { credential: applicationDefault(), source: 'Google application default credentials' };
  throw new Error([
    'Firebase Admin credentials are not configured.',
    'Download a service-account JSON from Firebase Console > Project settings > Service accounts > Generate new private key,',
    'then run: npm run bootstrap:super-admin -- babatundeoralusi@gmail.com --service-account "C:\\secure\\firebase-admin.json"',
    'Keep that JSON outside this repository and delete or archive it securely after bootstrap.',
  ].join('\n'));
}

async function main() {
  loadLocalEnv();
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'operations.config.json'), 'utf8'));
  const authorizedEmail = String(config.initialSuperAdminEmail || '').trim().toLowerCase();
  if (!email || email !== authorizedEmail) throw new Error(`Only the configured initial owner (${authorizedEmail}) can be bootstrapped.`);
  const trusted = credentials();
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coop-commerce-8d43f';
  const app = getApps()[0] || initializeApp({ credential: trusted.credential, projectId }); const auth = getAuth(app); const db = getFirestore(app);
  const owner = await auth.getUserByEmail(email); if (!owner.emailVerified) throw new Error('The owner account exists but its email has not been verified yet.');
  const claims = owner.customClaims || {}; await auth.setCustomUserClaims(owner.uid, { ...claims, operationalRoles: ['super_admin'] });
  await db.collection('users').doc(owner.uid).set({ email, roles: FieldValue.arrayUnion('super_admin'), selectedRole: 'super_admin', isOperationalStaff: true, staffStatus: 'active', roleSelectionComplete: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await db.collection('activityLogs').add({ userId: owner.uid, action: 'initial_super_admin_bootstrapped', credentialSource: trusted.source, createdAt: FieldValue.serverTimestamp() });
  await auth.revokeRefreshTokens(owner.uid);
  console.log(`Super-admin provisioned for ${email}. Sign out and sign in again, then open /admin/operations.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
