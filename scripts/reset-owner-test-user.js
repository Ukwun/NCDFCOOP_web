/* Destructive test-only reset for the configured initial owner. */
const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
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

function serviceAccount() {
  const filename = argument('--service-account') || process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!filename) throw new Error('Provide --service-account "C:\\secure\\firebase-admin.json". The private key must remain outside this repository.');
  const resolved = path.resolve(filename);
  if (!fs.existsSync(resolved)) throw new Error(`Service-account file not found: ${resolved}`);
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

const OWNED_QUERIES = [
  ['products', 'sellerId'], ['inquiries', 'buyerId'], ['inquiries', 'sellerId'],
  ['orders', 'userId'], ['orders', 'buyerId'], ['notifications', 'userId'],
  ['cartItems', 'userId'], ['favorites', 'userId'], ['disputes', 'buyerId'],
  ['payoutRequests', 'sellerId'], ['sellerLedgerEntries', 'sellerId'],
];

async function main() {
  loadLocalEnv();
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'operations.config.json'), 'utf8'));
  const authorizedEmail = String(config.initialSuperAdminEmail || '').trim().toLowerCase();
  if (email !== authorizedEmail) throw new Error(`This command may only reset the configured owner: ${authorizedEmail}`);
  if (!process.argv.includes('--confirm-reset')) throw new Error('Destructive reset not confirmed. Add --confirm-reset to proceed.');

  const account = serviceAccount();
  const app = getApps()[0] || initializeApp({ credential: cert(account), projectId: account.project_id });
  const auth = getAuth(app); const db = getFirestore(app);
  let user;
  try { user = await auth.getUserByEmail(email); }
  catch (error) { if (error.code === 'auth/user-not-found') { console.log(`${email} is already absent from Firebase Authentication.`); return; } throw error; }

  const writer = db.bulkWriter(); const paths = new Set();
  for (const [collectionName, field] of OWNED_QUERIES) {
    const snapshot = await db.collection(collectionName).where(field, '==', user.uid).get();
    snapshot.docs.forEach((document) => { if (!paths.has(document.ref.path)) { paths.add(document.ref.path); writer.delete(document.ref); } });
  }
  for (const collectionName of ['users', 'members', 'payoutProfiles', 'sellerBalances', 'accountDeletionAudit']) {
    const ref = db.collection(collectionName).doc(user.uid); paths.add(ref.path); writer.delete(ref);
  }
  await writer.close();
  await auth.deleteUser(user.uid);
  await db.collection('accountResetAudit').add({ previousUserId: user.uid, email, reason: 'requested_test_reset', deletedRecords: paths.size, resetAt: FieldValue.serverTimestamp() });
  console.log(`Reset complete for ${email}. The previous Auth UID ${user.uid} was deleted with ${paths.size} linked records. The email can now sign up as a new user.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
