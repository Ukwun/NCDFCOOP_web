/* One-time owner bootstrap. Never commit a service-account private key. */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { randomUUID } = require('crypto');
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

async function credentials(ownerEmail) {
  if (process.argv.includes('--firebase-cli-session')) {
    const globalRoot = execFileSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', 'npm root -g'],
      { encoding: 'utf8' }
    ).trim();
    const cliAuth = require(path.join(globalRoot, 'firebase-tools', 'lib', 'auth.js'));
    const account = cliAuth.getGlobalDefaultAccount();
    const accountEmail = String(account?.user?.email || '').trim().toLowerCase();
    if (!account?.tokens?.refresh_token || accountEmail !== ownerEmail) {
      throw new Error(`Firebase CLI must be signed in as ${ownerEmail} before using --firebase-cli-session.`);
    }
    return {
      async accessToken() {
        const token = await cliAuth.getAccessToken(account.tokens.refresh_token, []);
        return token.access_token;
      },
      source: `Firebase CLI session (${accountEmail})`,
    };
  }
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
    `then run: npm run bootstrap:super-admin -- ${argument('--email') || process.argv[2] || '<owner-email>'} --service-account "C:\\secure\\firebase-admin.json"`,
    'Keep that JSON outside this repository and delete or archive it securely after bootstrap.',
  ].join('\n'));
}

async function requestJson(url, accessToken, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `${method} ${url} failed with HTTP ${response.status}`);
  }
  return payload;
}

async function bootstrapWithCliSession({ email, projectId, trusted }) {
  const accessToken = await trusted.accessToken();
  const authBase = `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts`;
  const lookup = await requestJson(`${authBase}:lookup`, accessToken, 'POST', { email: [email] });
  const owner = lookup.users?.[0];
  if (!owner?.localId) throw new Error(`No Firebase Authentication account exists for ${email}.`);
  if (owner.emailVerified !== true) throw new Error('The owner account exists but its email has not been verified yet.');

  let claims = {};
  try { claims = JSON.parse(owner.customAttributes || '{}'); } catch {}
  await requestJson(`${authBase}:update`, accessToken, 'POST', {
    localId: owner.localId,
    customAttributes: JSON.stringify({ ...claims, operationalRoles: ['super_admin'] }),
    validSince: String(Math.floor(Date.now() / 1000)),
  });

  const database = `projects/${projectId}/databases/(default)`;
  const userDocument = `${database}/documents/users/${owner.localId}`;
  const activityDocument = `${database}/documents/activityLogs/${randomUUID()}`;
  await requestJson(
    `https://firestore.googleapis.com/v1/${database}/documents:commit`,
    accessToken,
    'POST',
    {
      writes: [
        {
          update: {
            name: userDocument,
            fields: {
              email: { stringValue: email },
              selectedRole: { stringValue: 'super_admin' },
              isOperationalStaff: { booleanValue: true },
              staffStatus: { stringValue: 'active' },
              roleSelectionComplete: { booleanValue: true },
            },
          },
          updateMask: {
            fieldPaths: ['email', 'selectedRole', 'isOperationalStaff', 'staffStatus', 'roleSelectionComplete'],
          },
          updateTransforms: [
            {
              fieldPath: 'roles',
              appendMissingElements: { values: [{ stringValue: 'super_admin' }] },
            },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
        {
          update: {
            name: activityDocument,
            fields: {
              userId: { stringValue: owner.localId },
              action: { stringValue: 'initial_super_admin_bootstrapped' },
              credentialSource: { stringValue: trusted.source },
            },
          },
          updateTransforms: [
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
          ],
        },
      ],
    }
  );

  const verifiedAuth = await requestJson(`${authBase}:lookup`, accessToken, 'POST', {
    localId: [owner.localId],
  });
  const verifiedProfile = await requestJson(
    `https://firestore.googleapis.com/v1/${userDocument}`,
    accessToken
  );
  const verifiedClaims = JSON.parse(verifiedAuth.users?.[0]?.customAttributes || '{}');
  const verifiedRoles = verifiedProfile.fields?.roles?.arrayValue?.values?.map((value) => value.stringValue) || [];
  if (
    !verifiedClaims.operationalRoles?.includes('super_admin') ||
    verifiedProfile.fields?.selectedRole?.stringValue !== 'super_admin' ||
    !verifiedRoles.includes('super_admin')
  ) {
    throw new Error('Super-admin bootstrap completed but verification did not match the required role state.');
  }

  return owner.localId;
}

async function main() {
  loadLocalEnv();
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'operations.config.json'), 'utf8'));
  const authorizedEmail = String(config.initialSuperAdminEmail || '').trim().toLowerCase();
  if (!email || email !== authorizedEmail) throw new Error(`Only the configured initial owner (${authorizedEmail}) can be bootstrapped.`);
  const trusted = await credentials(email);
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'coop-commerce-8d43f';
  if (trusted.accessToken) {
    const uid = await bootstrapWithCliSession({ email, projectId, trusted });
    console.log(`Super-admin provisioned and verified for ${email} (${uid}). Sign out and sign in again, then open /admin/operations.`);
    return;
  }
  const app = getApps()[0] || initializeApp({ credential: trusted.credential, projectId }); const auth = getAuth(app); const db = getFirestore(app);
  const owner = await auth.getUserByEmail(email); if (!owner.emailVerified) throw new Error('The owner account exists but its email has not been verified yet.');
  const claims = owner.customClaims || {}; await auth.setCustomUserClaims(owner.uid, { ...claims, operationalRoles: ['super_admin'] });
  await db.collection('users').doc(owner.uid).set({ email, roles: FieldValue.arrayUnion('super_admin'), selectedRole: 'super_admin', isOperationalStaff: true, staffStatus: 'active', roleSelectionComplete: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await db.collection('activityLogs').add({ userId: owner.uid, action: 'initial_super_admin_bootstrapped', credentialSource: trusted.source, createdAt: FieldValue.serverTimestamp() });
  await auth.revokeRefreshTokens(owner.uid);
  console.log(`Super-admin provisioned for ${email}. Sign out and sign in again, then open /admin/operations.`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
