/**
 * Generate a Firebase password reset link using the Admin SDK.
 * Usage:
 *  - Set FIREBASE_SERVICE_ACCOUNT to the raw JSON or base64-encoded JSON of your service account
 *    or set GOOGLE_APPLICATION_CREDENTIALS to a path to the JSON file.
 *  - Run: node scripts/generate-reset-link.js youremail@example.com
 */
const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps && admin.apps.length) return;

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!svc) {
    console.error('Set FIREBASE_SERVICE_ACCOUNT (raw JSON or base64) or GOOGLE_APPLICATION_CREDENTIALS (path)');
    process.exit(1);
  }

  try {
    let serviceAccount;
    // If path provided via GOOGLE_APPLICATION_CREDENTIALS, let admin handle it
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({});
      return;
    }

    // Try parse raw JSON
    try {
      serviceAccount = JSON.parse(svc);
    } catch (rawErr) {
      // Try base64 decode
      try {
        const decoded = Buffer.from(svc, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch (b64Err) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON or base64-encoded JSON');
        process.exit(1);
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err);
    process.exit(1);
  }
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/generate-reset-link.js youremail@example.com');
    process.exit(1);
  }

  initAdmin();

  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    console.log('Password reset link:');
    console.log(link);
  } catch (err) {
    console.error('Failed to generate password reset link:', err);
    process.exit(1);
  }
}

main();
