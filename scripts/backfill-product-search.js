const fs = require('fs');
const admin = require('firebase-admin');
const credentialPath = process.env.FIREBASE_ADMIN_CREDENTIALS;
if (!credentialPath || !fs.existsSync(credentialPath)) throw new Error('FIREBASE_ADMIN_CREDENTIALS is required.');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(credentialPath, 'utf8'))) });
const db = admin.firestore();
function tokens(...values) {
  const words = values.map((value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, ' ')).join(' ').split(/\s+/).filter((word) => word.length >= 2);
  const result = new Set();
  for (const word of words) { result.add(word.slice(0, 40)); for (let length = 2; length <= Math.min(word.length, 12); length += 1) result.add(word.slice(0, length)); if (result.size >= 120) break; }
  return Array.from(result).slice(0, 120);
}
async function main() {
  const snapshot = await db.collection('products').get();
  let batch = db.batch(); let pending = 0; let updated = 0;
  for (const document of snapshot.docs) {
    const data = document.data();
    batch.set(document.ref, { searchTokens: tokens(data.name, data.category, data.description), searchIndexedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    pending += 1; updated += 1;
    if (pending === 400) { await batch.commit(); batch = db.batch(); pending = 0; }
  }
  if (pending) await batch.commit();
  console.log(JSON.stringify({ updated }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
